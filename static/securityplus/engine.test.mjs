import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DOMAINS,TARGET,validateBank,makeAttempt,scoreQuestion,summarize,readiness,priorities,complete,validExam,freshCapacity,isAvailable} from './engine.js';
import {fieldCorrect,previewFirewall} from './simulation.js';
import {restoreProfile} from './restore.js';

const bank = ['questions','applied'].flatMap(f=>JSON.parse(readFileSync(new URL(f+'.json',import.meta.url))));
const catalog = new Map(bank.map(q=>[q.id,q]));
const now = Date.UTC(2026,10,17,18);
const start = now - 15 * 86400000;
const learner = () => ({name:'Test learner',history:[],active:null,potential:{}});
const countBy = (q, key) => new Set(q.map(key)).size;
function rng(seed) {
 return () => {
  seed = (Math.imul(1664525,seed) + 1013904223) >>> 0;
  return seed / 4294967296;
 };
}
function keyFor(q) {
 return q.tasks ? Object.fromEntries(q.tasks.map((t,i)=>[i,t.accept ? t.accept[0] : [...t.correct]])) : [...q.correct];
}
function take(p,mode='exam',{seed=9,grade=1,domain=0,closed=true,mark=()=>true}={}) {
 const a=makeAttempt(bank,p,mode,domain,rng(seed),start+p.history.length*7200000);
 a.questions.forEach((q,i)=>{if (i<a.questions.length*grade && mark(q,i)) a.answers[i]=keyFor(q);});
 a.ended=a.started+3600000;
 a.reason='submitted';
 a.closedBook=mode==='exam'&&closed;
 a.result=summarize(a);
 p.history.push(a);
 return a;
}
const signal = p => readiness(p.history,now);
const backup = p=>({format:'breachsum-profile-v1',profile:structuredClone(p)});

test('bank covers all 28 objectives with valid options, exhibits and ample domain pools',()=>{
 assert.ok(validateBank(bank));
 assert.equal(bank.filter(q=>q.workspace).length,15);
 assert.equal(bank.filter(isAvailable).length,264);
 assert.equal(countBy(bank,q=>q.id),bank.length);
 assert.equal(countBy(bank,q=>q.prompt),bank.length);
 for (const d of DOMAINS) {
  assert.equal(bank.filter(q=>q.domain===d.id&&q.workspace).length,3);
  assert.ok(bank.filter(q=>q.domain===d.id&&!q.tasks).length>=2*(d.count-1));
 }
 [4,5,4,9,6].forEach((n,i)=>{for(let j=1;j<=n;j++)assert.ok(bank.some(q=>q.objective===`${i+1}.${j}`));});
 assert.ok(bank.filter(q=>q.workspace).every(q=>q.tasks.some(t=>t.accept)));
 assert.throws(()=>validateBank([{...bank[0],objective:'1.9'}]));
});

test('1,000 seeded exams vary membership, order and option positions while preserving the blueprint and every answer',()=>{
 const sets=new Set(), orders=new Set(), sampled=new Set(), positions=new Set(), menuPositions=new Set();
 for(let seed=1;seed<=1000;seed++){
  const a=makeAttempt(bank,learner(),'exam',0,rng(seed),start);
  const ids=a.questions.map(q=>q.id);
  orders.add(ids.join(','));sets.add([...ids].sort().join(','));
  assert.equal(new Set(ids).size,90);
  assert.equal(a.deadline-a.started,5400000);
  for (const d of DOMAINS) {
   const inDomain=a.questions.filter(q=>q.domain===d.id);
   assert.equal(inDomain.length,d.count);
   assert.equal(inDomain.filter(q=>q.workspace).length,1);
  }
  for(const q of a.questions){
   sampled.add(q.id);
   const original=catalog.get(q.id);
   for(const [j,task] of (q.tasks||[q]).entries()){
    const source=q.tasks?original.tasks[j]:original;
    if(task.accept) {assert.equal(task.label,source.label);continue;}
    assert.deepEqual(task.correct.map(i=>task.options[i].text).sort(),source.correct.map(i=>source.options[i].text).sort());
   }
   if(q.id==='d1-01') positions.add(q.correct[0]);
   if(q.id==='lab-firewall') menuPositions.add(q.tasks.find(t=>t.key==='protocol').correct[0]);
   assert.equal(scoreQuestion(q,keyFor(q)),1);
  }
 }
 assert.equal(sets.size,1000);assert.equal(orders.size,1000);
 assert.equal(sampled.size,bank.filter(isAvailable).length);
 assert.equal(positions.size,4);assert.equal(menuPositions.size,3);
});

test('mixed quiz, domain quiz and workshop draw different items and keep the right answer after shuffling',()=>{
 for(const [mode,domain] of [['adaptive',0],...DOMAINS.map(d=>['adaptive',d.id]),['pbq',0]]){
  const forms=new Set();
  for(let s=1;s<=100;s++){
   const a=makeAttempt(bank,learner(),mode,domain,rng(s),start);
   assert.equal(a.questions.length,mode==='pbq'?5:20);
   assert.equal(countBy(a.questions,q=>q.id),a.questions.length);
   assert.ok(a.questions.every(q=>scoreQuestion(q,keyFor(q))===1));
   if(domain)assert.ok(a.questions.every(q=>q.domain===domain));
   if(mode==='pbq')assert.equal(countBy(a.questions,q=>q.domain),5);
   if(mode==='adaptive'&&!domain)for(const d of DOMAINS)assert.ok(a.questions.filter(q=>q.domain===d.id).length>=2);
   forms.add(a.questions.map(q=>q.id).sort().join(','));
  }
  assert.ok(forms.size>60,`${mode}/${domain}: ${forms.size} distinct samples`);
 }
});

test('priority estimates change adaptive allocation and leave timed domain counts alone',()=>{
 const p=learner();
 const exam=take(p);
 exam.questions.forEach((q,i)=>{if(q.domain===3)delete exam.answers[i];});
 exam.result=summarize(exam);
 const ranked=priorities(p.history,p.potential);
 assert.equal(ranked[0].id,3);
 const a=makeAttempt(bank,p,'adaptive');
 assert.ok(a.questions.filter(q=>q.domain===3).length>a.questions.filter(q=>q.domain===1).length);
 assert.ok(priorities([], {1:1.25}).find(d=>d.id===1).priority>priorities([],{}).find(d=>d.id===1).priority);
});

test('two exams plus a mixed quiz can use entirely first-seen items; exhausted banks report their actual capacity',()=>{
 for (const order of [['exam','adaptive','exam'],['adaptive','exam','exam'],['exam','exam','adaptive']]){
  const p=learner();for(const mode of order)assert.equal(take(p,mode).result.fresh,1);
 }
 const p=learner();let a;
 for(let i=0;i<5;i++){
  const cap=freshCapacity(bank,p.history);
  a=take(p,'exam',{seed:i+1});
  assert.equal(a.result.rows.filter(r=>r.fresh).length,cap);
 }
 assert.equal(freshCapacity(bank,p.history),0);
});

test('multi-select is exact; partial PBQ credit survives blank and incorrectly formatted entries',()=>{
 const m=bank.find(q=>q.correct?.length===2),q=catalog.get('lab-risk-ledger');
 assert.equal(scoreQuestion(m,[]),0);assert.equal(scoreQuestion(m,m.correct.slice(0,1)),0);
 assert.equal(scoreQuestion(m,[...m.correct].reverse()),1);
 assert.equal(scoreQuestion(m,[...m.correct,m.options.findIndex((_,i)=>!m.correct.includes(i))]),0);
 assert.equal(scoreQuestion(q,{0:'$40,000.00',1:'20,000',2:'5000x'}),.5);
 assert.equal(complete(q,{0:'40000',1:'2e4',2:'',3:'8,000'}),false);
 assert.equal(scoreQuestion(q,{}),0);
 assert.equal(fieldCorrect(catalog.get('lab-awareness').tasks[0],'40%'),true);
 assert.equal(fieldCorrect(catalog.get('lab-wifi-profile').tasks[0],'cedar-staff'),false);
 assert.equal(fieldCorrect(catalog.get('lab-auth-triage').tasks[1],' RCOLE '),true);
});

test('firewall preview evaluates the configured rule independently including equivalent host notation',()=>{
 const q=catalog.get('lab-firewall'), a=keyFor(q);
 a[0]='10.34.1.8/32';
 const decisions=()=>previewFirewall(q,a).map(p=>p.result);
 assert.deepEqual(decisions(),['Allow','Deny','Deny','Deny']);
 a[0]='any';assert.deepEqual(decisions(),['Allow','Allow','Deny','Deny']);
 a[4]=[1];assert.deepEqual(decisions(),['Deny','Deny','Deny','Deny']);
});

test('readiness needs two fresh closed-book exams plus recent quiz or workshop corroboration',()=>{
 const p=learner();assert.equal(signal(p).label,'Build your baseline');
 take(p);assert.equal(signal(p).label,'One more timed exam');
 take(p);assert.equal(signal(p).label,'Confirm with a quiz or workshop');
 const beforeQuiz=structuredClone(p);
 take(p,'adaptive',{grade:.80});assert.equal(signal(p).quiz.score,.8);
 assert.equal(signal(p).label,'Ready to schedule');
 take(beforeQuiz,'pbq');assert.equal(signal(beforeQuiz).label,'Ready to schedule');
 const weakWorkshop=take(p,'pbq',{grade:0});assert.equal(signal(p).label,'Review before scheduling');
 weakWorkshop.result.rows.forEach(r=>r.score=.75);
 assert.equal(signal(p).label,'Ready to schedule');
});

test('a more recent weak quiz or repeated timed exam downgrades a ready learner; perfect repeats cannot certify freshness',()=>{
 const p=learner();take(p);take(p);take(p,'adaptive');assert.equal(signal(p).label,'Ready to schedule');
 take(p,'adaptive',{grade:0});assert.equal(signal(p).label,'Review before scheduling');
 const q=learner();take(q);take(q);take(q,'pbq');take(q,'exam',{grade:0});assert.equal(signal(q).label,'Review before scheduling');
 const quizzes=learner();take(quizzes,'adaptive');assert.equal(signal(quizzes).label,'Build your baseline');
 const mixed=learner();const a=take(mixed,'adaptive');a.result.rows.forEach(r=>r.fresh=false);
 assert.equal(signal(mixed).quiz.count,0);
 const bad=learner();take(bad,'exam',{closed:false});const prior=take(bad,'exam');prior.result.fresh=.69;
 assert.equal(signal(bad).met,0);assert.equal(signal(bad).label,'Build your baseline');
});

test('every cutoff handles equality, including domain floors, PBQ, form freshness, and recent evidence',()=>{
 const p=learner();take(p);const exam=take(p);const workshop=take(p,'pbq');const test=()=>signal(p).label;
 for(const e of p.history.filter(a=>a.mode==='exam')){
  e.result.score=TARGET.overall;e.result.pbq=TARGET.pbq;e.result.fresh=TARGET.fresh;e.result.domains.forEach(d=>d.score=TARGET.domain);
 }
 workshop.result.rows.forEach(r=>r.score=TARGET.pbq);
 assert.equal(test(),'Ready to schedule');
 for(const field of ['score','pbq']){
  const previous=exam.result[field];exam.result[field]-=.001;assert.equal(test(),'Review before scheduling');exam.result[field]=previous;
 }
 exam.result.domains[2].score-=.001;assert.equal(test(),'Review before scheduling');exam.result.domains[2].score=TARGET.domain;
 workshop.result.rows[0].score-=.001;assert.equal(test(),'Review before scheduling');workshop.result.rows[0].score=TARGET.pbq;
 exam.result.fresh=.6999;assert.equal(test(),'One more timed exam');
 assert.equal(readiness(p.history,now+31*86400000).label,'Build your baseline');
});

test('only fully timed forms count; incomplete and overdue imports cannot become valid exams',()=>{
 const p=learner(),a=take(p);
 assert.ok(validExam(a));
 const tiny=take(learner(),'pbq');tiny.mode='exam';tiny.deadline=tiny.started+5400000;assert.equal(validExam(tiny),false);
 const overdue=structuredClone(a);overdue.ended=overdue.deadline+60000;assert.equal(validExam(overdue),false);
 overdue.reason='timeout';assert.ok(validExam(overdue)); // Older versions could finalize a frozen tab late.
 const duplicate=structuredClone(a);duplicate.questions[1]=duplicate.questions[0];assert.equal(validExam(duplicate),false);
});

test('restore preserves shuffled modern and legacy attempts without trusting exported keys or invented first-seen scores',()=>{
 const p=learner();take(p);const q=take(p,'adaptive');const pb=take(p,'pbq');
 const archive=bank.filter(x=>x.tasks&&!x.workspace);
 const legacy={...structuredClone(pb),id:'legacy-workshop',questions:archive.slice(0,5),answers:{}};
 legacy.questions.forEach((item,i)=>legacy.answers[i]=keyFor(item));legacy.result=summarize(legacy);p.history.push(legacy);
 p.active=makeAttempt(bank,p,'pbq',0,rng(30),now);
 p.active.answers[0]=keyFor(p.active.questions[0]);
 const saved=backup(p);
 saved.profile.history[0].result.score=0;saved.profile.history[0].seen=p.history[0].questions.map(q=>q.id);
 for(const question of saved.profile.history[0].questions) for(const t of question.tasks||[question]) {if(t.accept)t.accept=['wrong'];else t.correct=[(t.correct[0]+1)%t.options.length];}
 const restored=restoreProfile(saved,bank);assert.equal(restored.history[0].result.score,1);
 assert.equal(restored.history[0].result.fresh,1);assert.equal(restored.history[1].result.score,q.result.score);
 assert.equal(restored.history.at(-1).result.score,1);
 assert.equal(scoreQuestion(restored.active.questions[0],restored.active.answers[0]),1);
 const bad=backup(p);bad.profile.history[0].questions.find(q=>q.tasks).tasks=[];assert.throws(()=>restoreProfile(bad,bank));
 const badPick=backup(p);badPick.profile.history[1].answers[0]=[999];assert.throws(()=>restoreProfile(badPick,bank));
});

test('legacy results are kept but a case-study-only history needs contemporary hands-on evidence',()=>{
 const p=learner();
 const oldExam=()=>{const a=take(p);a.questions=a.questions.map(q=>q.workspace?bank.find(x=>x.domain===q.domain&&x.tasks&&!isAvailable(x)):q);
  a.questions.forEach((q,i)=>a.answers[i]=keyFor(q));a.result=summarize(a);return a;};
 oldExam();oldExam();take(p,'adaptive');
 const oldWorkshop=take(p,'pbq');
 oldWorkshop.questions=DOMAINS.map(d=>bank.find(x=>x.domain===d.id&&x.tasks&&!isAvailable(x)));
 oldWorkshop.questions.forEach((q,i)=>oldWorkshop.answers[i]=keyFor(q));oldWorkshop.result=summarize(oldWorkshop);
 assert.equal(signal(p).workshop.count,0);assert.equal(signal(p).label,'Confirm with hands-on PBQs');
 take(p,'pbq');assert.equal(signal(p).label,'Ready to schedule');
});
