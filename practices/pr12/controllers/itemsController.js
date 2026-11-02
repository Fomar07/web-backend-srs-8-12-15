const service = require('../services/itemsService');
const allowed = ['type','duration','calories','date','trainer','exercises','metrics','tags'];
function data(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) { const e = new Error('Ожидается JSON-объект'); e.status=400; throw e; }
  if (Object.keys(body).some(k => !allowed.includes(k))) { const e = new Error('Неизвестное или запрещённое поле'); e.status=400; throw e; }
  return Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k)));
}
function missing(res, item) { if (!item) { res.status(404).json({ error: 'Тренировка не найдена' }); return true; } return false; }
exports.list = async (req,res) => res.json(await service.findAll(req.query));
exports.stats = async (req,res) => res.json(await service.stats());
exports.one = async (req,res) => { const item=await service.findById(req.params.id); if (!missing(res,item)) res.json(item); };
exports.create = async (req,res) => res.status(201).json(await service.create(data(req.body),req.user));
exports.update = async (req,res) => { const item=await service.update(req.params.id,data(req.body),req.user); if (!missing(res,item)) res.json(item); };
exports.remove = async (req,res) => { const item=await service.remove(req.params.id,req.user); if (!missing(res,item)) res.status(204).end(); };
