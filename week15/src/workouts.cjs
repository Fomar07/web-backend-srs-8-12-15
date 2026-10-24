const express=require('express');
const mongoose=require('mongoose');
const {Workout}=require('./models.cjs');
const validate=require('./validate.cjs');
const router=express.Router();
function scope(req) {return req.user.role==='admin'?{}:{owner:req.user._id};}
router.param('id',(req,res,next,id)=>{
  if(!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({error:'Invalid ObjectId'});
  next();
});
router.get('/',async(req,res)=>{
  const page=Number(req.query.page||1),limit=Number(req.query.limit||10);
  if(!Number.isInteger(page)||page<1||page>10000||!Number.isInteger(limit)||limit<1||limit>50) return res.status(400).json({error:'Invalid pagination'});
  const filter=scope(req);
  const [items,total]=await Promise.all([Workout.find(filter).sort({date:-1,_id:-1}).skip((page-1)*limit).limit(limit).lean(),Workout.countDocuments(filter)]);
  res.json({items,total,page,limit});
});
router.post('/',async(req,res)=>{
  const item=await Workout.create({...validate(req.body),owner:req.user._id});
  res.status(201).location(`/api/workouts/${item.id}`).json(item);
});
router.get('/:id',async(req,res)=>{
  const item=await Workout.findOne({_id:req.params.id,...scope(req)}).lean();
  if(!item)return res.status(404).json({error:'Workout not found'});
  res.json(item);
});
router.patch('/:id',async(req,res)=>{
  const data=validate(req.body,true);
  const item=await Workout.findOneAndUpdate({_id:req.params.id,...scope(req)},{$set:data},{new:true,runValidators:true});
  if(!item)return res.status(404).json({error:'Workout not found'});
  res.json(item);
});
router.delete('/:id',async(req,res)=>{
  const item=await Workout.findOneAndDelete({_id:req.params.id,...scope(req)});
  if(!item)return res.status(404).json({error:'Workout not found'});
  res.sendStatus(204);
});
module.exports=router;
