const Workout = require('../models/Workout');
const lab = require('../lab.json');
const cache = require('../middlewares/cache');
function problem(status, message) { const e = new Error(message); e.status = status; throw e; }
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function filters(f) {
  const q = {};
  for (const [param, field, op] of [['minDuration','duration','$gte'],['maxDuration','duration','$lte'],['minCalories','calories','$gte']]) {
    if (f[param] !== undefined) {
      const n = Number(f[param]); if (!Number.isFinite(n) || n < 0) problem(400, 'Некорректный числовой фильтр');
      q[field] = { ...q[field], [op]: n };
    }
  }
  for (const field of ['type','trainer']) if (f[field]) q[field] = String(f[field]);
  if (f.search) q.type = { $regex: escape(String(f.search).slice(0,80)), $options: 'i' };
  if (f.tag) q.tags = String(f.tag);
  if (f.exercise) q.exercises = String(f.exercise);
  return q;
}
async function findAll(f = {}) {
  const started = performance.now();
  const q = filters(f);
  const sorts = { duration_asc: { duration: 1, _id: 1 }, duration_desc: { duration: -1, _id: 1 }, type: { type: 1, _id: 1 } };
  const sort = sorts[f.sort] || { createdAt: -1, _id: 1 };
  if (lab.stage < 15) return Workout.find(q).sort(sort).lean();
  const page = Number(f.page ?? 1), limit = Number(f.limit ?? 5);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) problem(400, 'page >= 1, limit от 1 до 100');
  const [items, total] = await Promise.all([
    Workout.find(q).sort(sort).skip((page-1)*limit).limit(limit).lean(), Workout.countDocuments(q)
  ]);
  console.log(`findAll: ${(performance.now()-started).toFixed(3)}ms`);
  return { items, pagination: { total, page, limit, pages: Math.ceil(total/limit) } };
}
async function findById(id) { return Workout.findById(id).lean(); }
function permitted(user, item) {
  if (lab.stage < 14) return;
  if (user.role !== 'trainer' && String(item.owner) !== user.id) problem(403, 'Изменять можно только собственную тренировку');
}
async function overlap(data, user, exclude) {
  if (lab.stage < 14.1) return;
  const owner = data.owner || user?.id;
  if (!owner) return;
  const start = new Date(data.date); const end = new Date(+start + data.duration*60000);
  const q = { owner, date: { $lt: end, $gt: new Date(+start-300*60000) } };
  if (exclude) q._id = { $ne: exclude };
  const prior = await Workout.find(q).lean();
  if (prior.some(w => +new Date(w.date)+w.duration*60000 > +start)) problem(409, 'Тренировки одного клиента не должны пересекаться');
}
// Последовательная запись исключает гонку проверки пересечений в одном процессе.
let queue = Promise.resolve();
function serial(fn) { const result = queue.then(fn); queue = result.catch(()=>{}); return result; }
function create(data, user) { return serial(async () => {
  const doc = new Workout({ ...data, ...(lab.stage >= 14 ? { owner: user.id } : {}) });
  await doc.validate(); await overlap(doc.toObject(), user); await doc.save(); cache.invalidate(); return doc;
}); }
function update(id, data, user) { return serial(async () => {
  const old = await Workout.findById(id); if (!old) return null; permitted(user, old);
  const check = new Workout({ ...old.toObject(), ...data }); await check.validate();
  await overlap(check.toObject(), user, id);
  const item = await Workout.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  cache.invalidate(); return item;
}); }
async function remove(id, user) {
  const old = await Workout.findById(id); if (!old) return null; permitted(user, old);
  const result = await Workout.findByIdAndDelete(id); cache.invalidate(); return result;
}
async function stats() { return Workout.aggregate([
  { $group: { _id: '$type', avgDuration: { $avg: '$duration' }, totalCalories: { $sum: '$calories' }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]); }
module.exports = { findAll, findById, create, update, remove, stats };
