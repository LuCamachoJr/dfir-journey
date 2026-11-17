import {DOMAINS, summarize, validExam} from './engine.js';

// Preserve the exact option order that a saved learner saw. Use the published
// content for prompts, feedback and keys, including the original ten case studies.
export function restoreProfile(data, bank) {
 if (data.format !== 'breachsum-profile-v1' || typeof data.profile?.name !== 'string' || !data.profile.name.trim()) throw Error('Unrecognized profile backup.');
 const p = data.profile;
 if (!Array.isArray(p.history) || p.history.length > 500) throw Error('Invalid history.');
 const catalog = new Map(bank.map(q => [q.id, q]));
 const seen = new Set();
 const sessionIds = new Set();
 const restoreOptionOrder = (saved, known) => {
  if (known.accept) return known;
  if (!Array.isArray(saved.options) || saved.options.length !== known.options.length) throw Error('Invalid option list.');
  const order = saved.options.map(o => known.options.findIndex(item => item.text === o.text));
  if (order.includes(-1) || new Set(order).size !== order.length) throw Error('Invalid option order.');
  return {...known,options:order.map(i => known.options[i]),correct:known.correct.map(i => order.indexOf(i))};
 };
 const checkValue = (task, value) => {
  if (value === undefined) return;
  if (task.accept) {
   if (typeof value !== 'string' || value.length > 128) throw Error('Invalid entry.');
  } else if (!Array.isArray(value) || new Set(value).size !== value.length ||
    value.some(i => !Number.isInteger(i) || !task.options[i])) throw Error('Invalid choice.');
 };
 function session(a, finished) {
  if (!a || typeof a.id !== 'string' || sessionIds.has(a.id) || !['exam','pbq','adaptive'].includes(a.mode)
    || !Array.isArray(a.questions) || !a.questions.length || a.questions.length > 90
    || !a.answers || !a.confidence || !Array.isArray(a.flags) || !Array.isArray(a.checked)
    || !Number.isFinite(a.started) || !Number.isInteger(a.index) || !a.questions[a.index]) throw Error('Invalid session.');
  sessionIds.add(a.id);
  const ids = new Set();
  a.questions = a.questions.map((saved, i) => {
   const known = catalog.get(saved.id);
   if (!known || ids.has(saved.id) || known.objective !== saved.objective || known.domain !== saved.domain
       || Boolean(known.tasks) !== Boolean(saved.tasks)) throw Error('Unknown or repeated question.');
   ids.add(saved.id);
   if (!known.tasks) {
    checkValue(known,a.answers[i]);
    return restoreOptionOrder(saved,known);
   }
   if (saved.tasks.length !== known.tasks.length) throw Error('Invalid PBQ task count.');
   const tasks = known.tasks.map((task,j) => {
    if (saved.tasks[j]?.label !== task.label) throw Error('Unknown PBQ field.');
    checkValue(task,a.answers[i]?.[j]);
    return restoreOptionOrder(saved.tasks[j],task);
   });
   return {...known,tasks};
  });
  a.seen = [...seen];
  if (a.mode === 'exam' && (a.deadline !== a.started + 5400000 || a.checked.length)) throw Error('Invalid timed exam.');
  if (a.mode !== 'exam' && a.questions.some(q => Boolean(q.tasks) !== (a.mode === 'pbq'))) throw Error('Invalid practice form.');
  if (finished) {
   if (!Number.isFinite(a.ended) || a.ended < a.started || (a.mode === 'exam' && !validExam(a))) throw Error('Invalid completed session.');
   a.result = summarize(a);
   for (const q of a.questions) seen.add(q.id);
  }
  return a;
 }
 p.history = p.history.map(a => session(a,true));
 if (p.active) session(p.active,false);
 p.potential = Object.fromEntries(DOMAINS.map(d => [d.id,[.75,1,1.25].includes(p.potential?.[d.id]) ? p.potential[d.id] : 1]));
 return p;
}
