import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DOMAINS,validateBank,makeAttempt,scoreQuestion,summarize,readiness,priorities,complete} from './engine.js';
const bank=JSON.parse(readFileSync(new URL('./questions.json',import.meta.url)));
const p=()=>({history:[],potential:{}});
function answerPerfect(a){a.questions.forEach((q,i)=>{a.answers[i]=q.tasks?Object.fromEntries(q.tasks.map((t,j)=>[j,[...t.correct]])):[...q.correct];});a.ended=a.started+3000000;a.result=summarize(a);a.closedBook=true;return a;}
test('bank has unique IDs, options, explanations, all objectives, enough fresh items for two exams',()=>{assert.ok(validateBank(bank));for(const d of DOMAINS){assert.ok(bank.filter(q=>q.domain===d.id&&!q.tasks).length>=2*(d.count-1));assert.ok(bank.filter(q=>q.domain===d.id&&q.tasks).length>=2);}const expected=[4,5,4,9,6];expected.forEach((n,i)=>{for(let j=1;j<=n;j++)assert.ok(bank.some(q=>q.objective===`${i+1}.${j}`),`missing ${i+1}.${j}`);});});
test('100 randomized exams preserve 90 item blueprint, exact answers and five PBQs',()=>{for(let k=0;k<100;k++){const a=makeAttempt(bank,p());assert.equal(a.questions.length,90);assert.equal(new Set(a.questions.map(q=>q.id)).size,90);assert.equal(a.questions.filter(q=>q.tasks).length,5);assert.equal(a.deadline-a.started,5400000);for(const d of DOMAINS)assert.equal(a.questions.filter(q=>q.domain===d.id).length,d.count);for(const q of a.questions){const orig=bank.find(x=>x.id===q.id);(q.tasks||[q]).forEach((t,j)=>{const original=orig.tasks?orig.tasks[j]:orig;assert.deepEqual(t.correct.map(i=>t.options[i].text).sort(),original.correct.map(i=>original.options[i].text).sort());});}answerPerfect(a);assert.equal(a.result.score,1);assert.equal(a.result.pbq,1);}});
test('second exam is entirely fresh with expanded bank',()=>{const pr=p();pr.history.push(answerPerfect(makeAttempt(bank,pr)));const second=makeAttempt(bank,pr);assert.ok(second.questions.every(q=>!second.seen.includes(q.id)));});
test('all or nothing multiple select; equal partial PBQ credit; unanswered zero',()=>{const m=bank.find(q=>q.correct?.length===2),pb=bank.find(q=>q.tasks);assert.equal(scoreQuestion(m,[]),0);assert.equal(scoreQuestion(m,m.correct.slice(0,1)),0);assert.equal(scoreQuestion(m,[...m.correct].reverse()),1);assert.equal(scoreQuestion(m,[...m.correct,m.options.findIndex((_,i)=>!m.correct.includes(i))]),0);assert.equal(scoreQuestion(pb,{0:pb.tasks[0].correct}),.25);assert.equal(scoreQuestion(pb,{}),0);assert.equal(complete(pb,{0:pb.tasks[0].correct}),false);});
test('adaptive practice includes every domain and responds to priority estimates',()=>{const pr=p();for(let k=0;k<25;k++){const a=makeAttempt(bank,pr,'adaptive');assert.equal(a.questions.length,20);for(const d of DOMAINS)assert.ok(a.questions.filter(q=>q.domain===d.id).length>=2);}const initial=priorities([],{});assert.equal(initial[0].id,4);const adjusted=priorities([],{1:1.25,4:.75});assert.ok(adjusted.find(x=>x.id===1).priority>initial.find(x=>x.id===1).priority);});
test('readiness requires self-report, fresh items and two good timed exams, not repeated practice',()=>{const pr=p();assert.equal(readiness([]).label,'Build your baseline');const first=answerPerfect(makeAttempt(bank,pr));pr.history.push(first);assert.equal(readiness(pr.history).label,'Validate independently');const second=answerPerfect(makeAttempt(bank,pr));pr.history.push(second);assert.equal(readiness(pr.history).label,'Strong practice evidence');second.closedBook=false;assert.equal(readiness(pr.history).label,'Validate independently');second.closedBook=true;second.result.fresh=.2;assert.equal(readiness(pr.history).label,'Validate independently');first.result.score=.6;assert.equal(readiness(pr.history).label,'Targeted review needed');assert.equal(readiness([answerPerfect(makeAttempt(bank,p(),'adaptive'))]).label,'Build your baseline');});

test('malformed miniature exams and empty PBQs cannot qualify',()=>{const tiny=answerPerfect(makeAttempt(bank,p(),'pbq'));tiny.mode='exam';tiny.deadline=tiny.started+5400000;assert.equal(readiness([tiny]).label,'Build your baseline');const bad=structuredClone(bank.find(q=>q.tasks));bad.tasks=[];assert.throws(()=>validateBank([bad]));});

test('profile imports restore shuffled answers, recompute keys/freshness and reject malformed tasks',()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function validateBackup(data){'),source.indexOf("window.addEventListener('storage'"));
 const validateBackup=new Function('bank','DOMAINS','validateBank','summarize','return '+body)(bank,DOMAINS,validateBank,summarize);
 const original=answerPerfect(makeAttempt(bank,p()));
 const backup={format:'breachsum-profile-v1',profile:{name:'Test',history:[original],active:null,potential:{}}};
 original.seen=original.questions.map(q=>q.id);
 original.questions.forEach(q=>(q.tasks||[q]).forEach(t=>{t.correct=[];t.correct.push((t.options.length-1));}));
 const restored=validateBackup(structuredClone(backup));
 assert.equal(restored.history[0].result.score,1);
 assert.equal(restored.history[0].result.fresh,1);
 const invalid=structuredClone(backup);invalid.profile.history[0].questions.find(q=>q.tasks).tasks=[];
 assert.throws(()=>validateBackup(invalid));
 const badOption=structuredClone(backup);badOption.profile.history[0].questions[0].options?.splice(0,1);
 if(!badOption.profile.history[0].questions[0].tasks)assert.throws(()=>validateBackup(badOption));
});
