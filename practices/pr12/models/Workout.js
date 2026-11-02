const mongoose = require('mongoose');
const lab = require('../lab.json');
const schema = new mongoose.Schema({
  type: { type: String, required: [true, 'Тип тренировки обязателен'], minlength: [2, 'Минимум 2 символа'], maxlength: 80, trim: true },
  duration: { type: Number, required: [true, 'Длительность обязательна'], min: [1, 'Длительность от 1 минуты'], max: [300, 'Не более 300 минут'] },
  calories: { type: Number, min: [0, 'Калории не могут быть отрицательными'], default: 0 },
  date: { type: Date, required: true, default: Date.now },
  trainer: { type: String, default: 'Самостоятельно', trim: true, maxlength: 80 },
  exercises: { type: [String], default: [] },
  metrics: { pulse: { type: Number, min: 30, max: 230 }, distance: { type: Number, min: 0 } },
  tags: { type: [String], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, strict: 'throw', collection: 'workouts' });
if (lab.stage >= 15) {
  schema.index({ type: 1, duration: -1 });
  schema.index({ trainer: 1 });
  schema.index({ duration: -1 });
  schema.index({ type: 'text' });
  schema.index({ owner: 1, date: 1 });
}
module.exports = mongoose.model('Workout', schema);
