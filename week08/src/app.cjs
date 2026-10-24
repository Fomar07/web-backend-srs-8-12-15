const express = require('express');
const {randomUUID} = require('node:crypto');
const validate = require('./validate.cjs');
const app = express();
const workouts = new Map();
app.disable('x-powered-by');
app.use((req,res,next) => {
  const started=Date.now();
  res.on('finish',()=>console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now()-started}ms`));
  next();
});
app.use(express.json({limit:'16kb',strict:true}));
app.get('/health', (req,res) => res.json({status:'ok',storage:'memory'}));
const router=express.Router();
router.get('/', (req,res) => res.json([...workouts.values()]));
router.post('/', (req,res) => {
  const input=validate(req.body);
  const item={id:randomUUID(),...input};
  workouts.set(item.id,item);
  res.status(201).location(`/api/workouts/${item.id}`).json(item);
});
router.param('id',(req,res,next,id)=>{
  if (!workouts.has(id)) return res.status(404).json({error:'Workout not found'});
  req.workout=workouts.get(id); next();
});
router.get('/:id',(req,res)=>res.json(req.workout));
router.patch('/:id',(req,res)=>{
  Object.assign(req.workout,validate(req.body,true));res.json(req.workout);
});
router.delete('/:id',(req,res)=>{workouts.delete(req.params.id);res.sendStatus(204);});
app.use('/api/workouts',router);
app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.use(require('./errors.cjs'));
module.exports=app;
