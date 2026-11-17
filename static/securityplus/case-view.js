import {fieldCorrect, previewFirewall} from './simulation.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
 '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[c]);

function exhibit(source) {
 const esc = escapeHTML;
 return `<details class="case-exhibit" open><summary>${esc(source.title)}</summary>
  <div class="case-scroll" tabindex="0" aria-label="${esc(source.title)} table"><table>
  <thead><tr>${source.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
  <tbody>${source.rows.map(row=>`<tr>${row.map((value,i)=>i===0?`<th scope="row">${esc(value)}</th>`:`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div></details>`;
}

function feedback(task, value) {
 const right = fieldCorrect(task,value);
 const expected = task.accept ? task.accept[0] : task.options[task.correct[0]].text;
 const explanation = task.accept ? task.rationale : task.options[task.correct[0]].explanation;
 const selected = !right && !task.accept && task.options[value?.[0]];
 const comment = selected ? ' ' + selected.explanation : '';
 return `<p class="field-feedback ${right?'good':'warn'}"><strong>${right?'Correct':'Expected '+escapeHTML(expected)}.</strong> ${escapeHTML(explanation+comment)}</p>`;
}

function field(task, value, index, checked) {
 const esc = escapeHTML, disabled = checked ? 'disabled' : '';
 const input = task.accept
  ? `<input type="text" maxlength="128" autocomplete="off" autocapitalize="off" spellcheck="false" ${task.kind==='number'?'inputmode="decimal"':''}
       data-entry="${index}" value="${esc(value)}" ${disabled}>`
  : `<select data-entry="${index}" ${disabled}><option value="">Choose a setting</option>
       ${task.options.map((o,i)=>`<option value="${i}" ${value?.includes(i)?'selected':''}>${esc(o.text)}</option>`).join('')}</select>`;
 return `<div class="case-field"><label><span>${esc(task.label)}</span>${input}</label>${checked?feedback(task,value):''}</div>`;
}

export function caseHTML(question, answers, checked) {
 const workspace = question.workspace;
 return `<section class="case-workspace" aria-label="${escapeHTML(workspace.title)}"><h3>${escapeHTML(workspace.title)}</h3>
  ${workspace.sources.map(exhibit).join('')}
  <div class="case-fields">${question.tasks.map((t,i)=>field(t,answers?.[i],i,checked)).join('')}</div>
  ${workspace.probes && !checked ? '<button type="button" data-probe>Preview packet decisions</button><div class="probe-output" aria-live="polite"></div>':''}</section>`;
}

export function bindCase(question, attempt, index, saveAnswer) {
 for (const control of document.querySelectorAll('[data-entry]')) {
  const update = () => {
   const task = Number(control.dataset.entry);
   const value = control.tagName === 'SELECT' ? (control.value === '' ? [] : [Number(control.value)]) : control.value;
   saveAnswer(task, value);
   const output = document.querySelector('.probe-output');
   if (output) output.textContent = '';
  };
  control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input',update);
 }
 const probe = document.querySelector('[data-probe]');
 if (probe) probe.onclick = () => {
  const decisions = previewFirewall(question,attempt.answers[index]);
  document.querySelector('.probe-output').innerHTML = decisions.map(p =>
   `<span>${escapeHTML(p.name)} <b>${escapeHTML(p.result)}</b></span>`).join('');
 };
}
