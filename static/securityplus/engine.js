import {fieldCorrect, fieldFilled, normalizedValue} from './simulation.js';
export const DOMAINS = [
 {id:1,name:'General Security Concepts',weight:12,count:11},
 {id:2,name:'Threats, Vulnerabilities & Mitigations',weight:22,count:20},
 {id:3,name:'Security Architecture',weight:18,count:16},
 {id:4,name:'Security Operations',weight:28,count:25},
 {id:5,name:'Program Management & Oversight',weight:20,count:18}
];
export function shuffle(a, random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function equal(a=[],b=[]){return a.length===b.length&&[...a].sort().every((v,i)=>v===[...b].sort()[i]);}
export function scoreQuestion(q, answer) {
 if (!q.tasks) return equal(answer || [], q.correct) ? 1 : 0;
 const points = q.tasks.filter((task, i) => task.accept
   ? fieldCorrect(task, answer?.[i]) : equal(answer?.[i] || [], task.correct)).length;
 return points / q.tasks.length;
}
export function complete(q, answer) {
 if (!q.tasks) return (answer || []).length === q.correct.length;
 return q.tasks.every((task, i) => task.accept
   ? fieldFilled(task, answer?.[i]) : (answer?.[i] || []).length === task.correct.length);
}
export function summarize(attempt){const rows=attempt.questions.map((q,i)=>({id:q.id,domain:q.domain,objective:q.objective,topic:q.topic,pbq:!!q.tasks,score:scoreQuestion(q,attempt.answers[i]),confidence:attempt.confidence[i]||'unset',fresh:!attempt.seen.includes(q.id)}));const domains=DOMAINS.map(d=>{const r=rows.filter(x=>x.domain===d.id);return {...d,n:r.length,score:r.length?r.reduce((s,x)=>s+x.score,0)/r.length:null};});const pbq=rows.filter(x=>x.pbq);return {rows,domains,score:rows.reduce((s,r)=>s+r.score,0)/rows.length,pbq:pbq.length?pbq.reduce((s,r)=>s+r.score,0)/pbq.length:null,fresh:rows.filter(x=>x.fresh).length/rows.length};}
export function evidence(history){const rows=history.slice(-3).flatMap(a=>a.result.rows);return DOMAINS.map(d=>{const r=rows.filter(x=>x.domain===d.id), s=r.reduce((n,x)=>n+x.score,0);return {...d,n:r.length,score:r.length?s/r.length:null,gap:1-(s+1)/(r.length+2)};});}
export function priorities(history,potential={}){return evidence(history).map(d=>({...d,potential:Number(potential[d.id]||1),priority:d.weight*d.gap*Number(potential[d.id]||1)})).sort((a,b)=>b.priority-a.priority);}
export function objectiveEvidence(history){const map=new Map();history.slice(-3).forEach(a=>a.result.rows.forEach(r=>{let o=map.get(r.objective)||{objective:r.objective,domain:r.domain,n:0,total:0,topics:new Set()};o.n++;o.total+=r.score;o.topics.add(r.topic);map.set(r.objective,o);}));return [...map.values()].map(o=>({...o,score:o.total/o.n,topics:[...o.topics]})).sort((a,b)=>a.score-b.score||b.n-a.n);}
export function isAvailable(q) { return !q.tasks || Boolean(q.workspace); }

function randomize(question, random) {
 const reorder = task => {
  if (task.accept) return task;
  const order = shuffle(task.options.map((_, i) => i), random);
  return {...task, options: order.map(i => task.options[i]), correct: task.correct.map(i => order.indexOf(i))};
 };
 return question.tasks ? {...question, tasks: question.tasks.map(reorder)} : reorder(question);
}

function quizAllocation(rank) {
 const total = rank.reduce((sum, domain) => sum + domain.priority, 0);
 const allocations = rank.map(domain => {
  const share = 10 * domain.priority / total;
  return {id: domain.id, count: 2 + Math.floor(share), remainder: share % 1};
 });
 const left = 20 - allocations.reduce((sum, d) => sum + d.count, 0);
 [...allocations].sort((a, b) => b.remainder - a.remainder).slice(0, left).forEach(d => d.count++);
 return allocations;
}

export function makeAttempt(bank, profile, mode='exam', domain=0, random=Math.random, now=Date.now()) {
 const seen = new Set(profile.history.flatMap(a => a.result.rows.map(row => row.id)));
 const pool = bank.filter(isAvailable);
 const draw = (domainId, practical, count) => {
  const candidates = pool.filter(q => q.domain === domainId && Boolean(q.tasks) === practical);
  const fresh = candidates.filter(q => !seen.has(q.id));
  const chosen = shuffle(fresh, random).slice(0, count);
  if (chosen.length < count) chosen.push(...shuffle(candidates.filter(q => seen.has(q.id)), random).slice(0, count - chosen.length));
  return chosen;
 };
 let selected;
 if (mode === 'exam') {
  selected = DOMAINS.flatMap(d => [...draw(d.id, true, 1), ...draw(d.id, false, d.count - 1)]);
  if (selected.length !== 90) throw Error('Insufficient questions for the exam blueprint.');
 } else if (mode === 'pbq') {
  selected = DOMAINS.flatMap(d => draw(d.id, true, 1));
 } else if (domain) {
  selected = draw(domain, false, 20);
 } else {
  selected = quizAllocation(priorities(profile.history, profile.potential)).flatMap(d => draw(d.id, false, d.count));
 }
 const questions = shuffle(selected, random).map(q => randomize(q, random));
 return {id:crypto.randomUUID(),version:1,mode,domain,started:now,deadline:mode==='exam'?now+5400000:null,
  index:0,questions,answers:{},confidence:{},flags:[],checked:[],seen:[...seen],closedBook:false};
}

export function validExam(a) {
 return a.mode === 'exam' && a.questions.length === 90 && a.deadline === a.started + 5400000
  && Number.isFinite(a.ended) && a.ended >= a.started && (a.ended <= a.deadline || a.reason === 'timeout')
  && a.checked.length === 0 && new Set(a.questions.map(q => q.id)).size === 90
  && DOMAINS.every(d => a.questions.filter(q => q.domain === d.id).length === d.count
    && a.questions.filter(q => q.domain === d.id && q.tasks).length === 1);
}

export const TARGET = {overall:.85, domain:.75, pbq:.75, fresh:.70, quiz:.80, quizCount:20, workshopCount:5, days:30};
const percent = value => Math.round(value * 100) + '%';

function examGaps(result) {
 const gaps = [];
 if (result.score < TARGET.overall) gaps.push('overall ' + percent(result.score));
 for (const d of result.domains) if (d.score < TARGET.domain) gaps.push('D' + d.id + ' ' + percent(d.score));
 if (result.pbq < TARGET.pbq) gaps.push('PBQs ' + percent(result.pbq));
 return gaps;
}

function practiceSample(attempts, mode, count, target) {
 const unique = new Map();
 for (const a of attempts) {
  if (a.mode !== mode) continue;
  a.result.rows.forEach((row, i) => {
   if (mode === 'pbq' && !a.questions[i].workspace) return;
   if (row.fresh && !unique.has(row.id)) unique.set(row.id, row.score);
  });
 }
 const sample = [...unique.values()].slice(-count);
 const score = sample.length ? sample.reduce((a,b) => a+b,0) / sample.length : null;
 return {count:sample.length, required:count, score, target, status:sample.length < count ? 'pending' : score >= target ? 'met' : 'review'};
}

// Maximum unseen item count actually available on the next form, respecting each domain quota.
export function freshCapacity(bank, history) {
 const seen = new Set(history.flatMap(a => a.result.rows.map(r => r.id)));
 const pool = bank.filter(q => isAvailable(q) && !seen.has(q.id));
 return DOMAINS.reduce((n, d) => n + Math.min(d.count - 1, pool.filter(q => q.domain === d.id && !q.tasks).length)
  + Number(pool.some(q => q.domain === d.id && q.workspace)), 0);
}

export function readiness(history, now = Date.now()) {
 const recent = history.filter(a => a.ended <= now && now - a.ended <= TARGET.days * 86400000);
 const timed = recent.filter(a => validExam(a) && a.closedBook === true);
 const eligible = timed.filter(a => a.result.fresh >= TARGET.fresh);
 const lastTwo = eligible.slice(-2);
 const exams = lastTwo.map(a => ({score:a.result.score, fresh:a.result.fresh, pbq:a.result.pbq, domains:a.result.domains, gaps:examGaps(a.result)}));
 const met = exams.filter(exam => !exam.gaps.length).length;
 const quiz = practiceSample(recent, 'adaptive', TARGET.quizCount, TARGET.quiz);
 const workshop = practiceSample(recent, 'pbq', TARGET.workshopCount, TARGET.pbq);
 const gaps = [quiz,workshop].filter(s => s.status === 'review');
 const base = {exams, met, quiz, workshop};
 const signal = (label, detail, level='neutral') => ({...base,label,detail,level});
 const latest = timed.at(-1);
 if (latest && examGaps(latest.result).length) {
  return signal('Review before scheduling', 'Your latest closed-book exam needs work on ' + examGaps(latest.result).join(', ') + '. Review those misses and try an unfamiliar timed form.', 'warn');
 }
 if (gaps.length) {
  const parts = [];
  if (quiz.status === 'review') parts.push('quiz ' + percent(quiz.score) + ' (target 80%)');
  if (workshop.status === 'review') parts.push('PBQ workshop ' + percent(workshop.score) + ' (target 75%)');
  return signal('Review before scheduling', 'Recent first-seen practice is below target: ' + parts.join(' and ') + '. Review the missed objectives and check them on fresh practice.', 'warn');
 }
 if (met < 2) {
  const detail = met ? 'One qualifying exam met all targets. Complete a second qualifying timed exam.' :
    'Take a full timed exam and mark it closed-book on the results screen. At least 63 of its 90 items must be first-seen.';
  return signal(met ? 'One more timed exam' : 'Build your baseline', detail);
 }
 if (!lastTwo.some(a => a.questions.some(q => q.workspace)) && workshop.status !== 'met') {
  return signal('Confirm with hands-on PBQs', 'Your qualifying exams used the earlier case format. Complete five first-seen hands-on workshop cases at 75% or better to confirm your practical skills.');
 }
 if (![quiz, workshop].some(s => s.status === 'met')) {
  return signal('Confirm with a quiz or workshop', 'Both timed exams met the targets. Complete a fresh 20-question quiz or a five-case PBQ workshop to confirm your practice skills.');
 }
 return signal('Ready to schedule', 'Your two qualifying exams and recent practice meet the lab targets. Scheduling your SY0-701 exam is a reasonable next step.', 'good');
}

export function validateBank(bank) {
 const ids = new Set();
 const limits = [0,4,5,4,9,6];
 for (const q of bank) {
  if (typeof q.id !== 'string' || ids.has(q.id)) throw Error('Invalid or duplicate question ID: ' + q.id);
  ids.add(q.id);
  const [domain, objective] = String(q.objective).split('.').map(Number);
  if (!Number.isInteger(q.domain) || domain !== q.domain || !(objective >= 1 && objective <= limits[domain])
      || q.objective !== domain+'.'+objective || !q.prompt || !q.topic) throw Error('Invalid objective or content: ' + q.id);
  if (q.workspace && (!q.workspace.title || !q.workspace.sources?.length || !Array.isArray(q.tasks)
    || q.workspace.sources.some(s => !s.title || !s.columns?.length || !s.rows?.length
      || s.rows.some(row => !Array.isArray(row) || row.length !== s.columns.length)))) throw Error('Invalid case exhibit: ' + q.id);
  if (q.tasks && (!Array.isArray(q.tasks) || q.tasks.length < 2 || q.tasks.some(t => !t.label))) throw Error('Invalid PBQ tasks: ' + q.id);
  for (const t of q.tasks || [q]) {
   if (t.accept) {
    if (!q.workspace || !['number','text','exact'].includes(t.kind) || !Array.isArray(t.accept) || !t.accept.length
      || !t.rationale || t.accept.some(v => normalizedValue(v, t.kind) === null)) throw Error('Invalid entry field: ' + q.id);
   } else if (!t.options?.length || !t.correct?.length || (q.workspace && t.correct.length !== 1)
     || new Set(t.correct).size !== t.correct.length || t.correct.some(i => !Number.isInteger(i) || !t.options[i])
     || new Set(t.options.map(o => o.text)).size !== t.options.length || t.options.some(o => !o.text || !o.explanation)) throw Error('Invalid options: ' + q.id);
  }
 }
 return true;
}
