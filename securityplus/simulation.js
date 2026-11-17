// Configuration fields keep the same indices when the learner leaves a case.
// Menu entries can be shuffled; typed fields accept equivalent representations.
export function normalizedValue(value, kind, unit) {
  let raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  if (kind === 'exact') return raw;
  if (kind !== 'number') return raw.toLowerCase();
  if (unit === 'usd') raw = raw.replace(/^\$\s*/, '');
  if (unit === 'percent') raw = raw.replace(/\s*%$/, '');
  if (!/^[-+]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(raw)) return null;
  const numeric = Number(raw.replaceAll(',', ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function fieldCorrect(task, answer) {
  if (!task.accept) return Array.isArray(answer) && answer.length === 1 && answer[0] === task.correct[0];
  const value = normalizedValue(answer, task.kind, task.unit);
  return value !== null && task.accept.some(expected => normalizedValue(expected, task.kind, task.unit) === value);
}

export function fieldFilled(task, answer) {
  return task.accept ? normalizedValue(answer, task.kind, task.unit) !== null : Array.isArray(answer) && answer.length === 1;
}

// The case firewall evaluates the learner's proposed rule, then its fixed default deny.
// This diagnostic uses packet fields only and has no access to the grading key.
export function previewFirewall(question, answers) {
  const settings = Object.fromEntries(question.tasks.map((task, index) => {
    const answer = answers?.[index];
    const value = task.accept ? normalizedValue(answer, task.kind, task.unit) : task.options[answer?.[0]]?.text;
    return [task.key, typeof value === 'string' ? value.toLowerCase().replace(/\/32$/, '') : value];
  }));
  return question.workspace.probes.map(packet => {
    const matches = ['source', 'destination', 'protocol', 'port'].every(key =>
      settings[key] === 'any' || settings[key] === packet[key]);
    return { name: packet.name, result: matches && settings.action === 'allow' ? 'Allow' : 'Deny' };
  });
}
