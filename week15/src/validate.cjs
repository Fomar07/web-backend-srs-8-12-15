function workoutInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('JSON object required'), {status:400});
  const allowed = ['type','duration','date'];
  if (Object.keys(body).some(k => !allowed.includes(k))) throw Object.assign(new Error('Unknown field'), {status:400});
  const data = {};
  if (!partial || 'type' in body) {
    if (typeof body.type !== 'string' || body.type.trim().length < 2 || body.type.trim().length > 60) throw Object.assign(new Error('type: 2..60 characters'), {status:400});
    data.type = body.type.trim();
  }
  if (!partial || 'duration' in body) {
    if (!Number.isInteger(body.duration) || body.duration < 1 || body.duration > 600) throw Object.assign(new Error('duration: integer 1..600'), {status:400});
    data.duration = body.duration;
  }
  if ('date' in body) {
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !Number.isFinite(Date.parse(body.date)) || new Date(body.date).toISOString().slice(0,10) !== body.date) throw Object.assign(new Error('date: YYYY-MM-DD'), {status:400});
    data.date = new Date(body.date);
  }
  if (partial && !Object.keys(data).length) throw Object.assign(new Error('Empty update'), {status:400});
  return data;
}
module.exports = workoutInput;
