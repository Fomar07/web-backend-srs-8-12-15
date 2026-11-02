const router = require('express').Router();
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const lab = require('./lab.json');
const collection = () => getDb().collection('workouts');
router.get('/stats',async (req,res)=>res.json(await collection().aggregate([
 { $group:{ _id:'$type', avgDuration:{$avg:'$duration'}, totalCalories:{$sum:'$calories'}, count:{$sum:1} } }, {$sort:{_id:1}}
]).toArray()));
router.get('/',async (req,res)=>{
 const q={};
 if(req.query.minDuration!==undefined) {const n=Number(req.query.minDuration); if(!Number.isFinite(n))return res.status(400).json({error:'Неверный фильтр'});q.duration={$gte:n};}
 if(req.query.type)q.type=String(req.query.type);
 if(req.query.search)q.type={$regex:String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
 if(req.query.exercise)q.exercises={$in:[String(req.query.exercise)]};
 if(req.query.minPulse)q['metrics.pulse']={$gt:Number(req.query.minPulse)};
 const sort=req.query.sort==='duration_desc'?{duration:-1}:{date:1};
 if(lab.stage>=10) {
  res.json(await collection().aggregate([{$match:q},{$sort:sort},
   {$lookup:{from:'trainers',localField:'trainerId',foreignField:'_id',as:'trainerData'}},
   {$unwind:{path:'$trainerData',preserveNullAndEmptyArrays:true}}
  ]).toArray());
 }else res.json(await collection().find(q).sort(sort).toArray());
});
router.post('/',async(req,res)=>{
 const {type,duration,calories=0,date=new Date().toISOString()}=req.body||{};
 if(typeof type!=='string'||type.trim().length<2||!Number.isInteger(duration)||duration<1||duration>300||!Number.isFinite(calories)||calories<0||Number.isNaN(Date.parse(date)))
  return res.status(400).json({error:'Проверьте тип, длительность, калории и дату'});
 const item={type:type.trim(),duration,calories,date:new Date(date)};
 const result=await collection().insertOne(item);res.status(201).json({_id:result.insertedId,...item});
});
module.exports=router;
