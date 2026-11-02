const router = require('express').Router();
const ctrl = require('../controllers/itemsController');
const lab = require('../lab.json');
const auth = lab.stage >= 13 ? require('../middlewares/auth') : (req,res,next)=>next();
const guard = lab.stage >= 13 ? require('../middlewares/roleGuard') : ()=>(req,res,next)=>next();
const validation = require('../middlewares/validation');
const cache = require('../middlewares/cache');
const secure = lab.stage >= 14 ? [auth,guard('client','trainer')] : [];
router.get('/stats',ctrl.stats);
if (lab.stage >= 13) {
  router.get('/trainer-only', auth, guard('trainer'), (req,res)=>res.json({ message:'Назначение программ доступно тренеру' }));
  router.post('/assign', auth, guard('trainer'), (req,res)=>res.json({ message:'Программа назначена', program:req.body.program || 'Общая физическая подготовка' }));
}
router.get('/', ...(lab.stage >= 15 ? [cache] : []), ctrl.list);
router.get('/:id',ctrl.one);
router.post('/',...secure,...validation.workout,ctrl.create);
router.put('/:id',...secure,...validation.workout,ctrl.update);
router.delete('/:id',...secure,ctrl.remove);
module.exports = router;
