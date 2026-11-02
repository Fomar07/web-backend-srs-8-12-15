require('dotenv').config({quiet:true});
const db=require('../db');
const lab=require('../lab.json');
const {ObjectId}=require('mongodb');
async function seed(){
 await db.connect();const database=db.getDb();
 if(!database.databaseName.endsWith('_variant15'))throw new Error('Seed разрешён только для учебной БД варианта 15');
 const c=database.collection('workouts');
 if(await c.countDocuments()===0){
  const types=['Бег','Плавание','Силовая','Йога','Велосипед'];
  await c.insertMany(Array.from({length:15},(_,i)=>({
   type:types[i%5],duration:20+(i%5)*10,calories:150+i*20,
   date:new Date(Date.UTC(2026,10,10+i,8)),...(lab.stage<11?{trainerId:i%2?'trainer-irina':'trainer-arman'}:{}),
   trainer:i%2?'Ирина Соколова':'Арман Сериков',
   exercises:i%2?['Разминка','Планка']:['Разминка','Интервалы'],
   metrics:{pulse:110+i*3,distance:i%5===0?5:0},tags:i%2?['зал']:['улица'],
   createdAt:new Date(),updatedAt:new Date()
  })));
 }
 if(lab.stage>=9&&lab.stage<=10){
  const t=database.collection('trainers');
  for(const trainer of [{_id:'trainer-arman',name:'Арман Сериков',speciality:'Кардио'},{_id:'trainer-irina',name:'Ирина Соколова',speciality:'Силовые'}])
   await t.updateOne({_id:trainer._id},{$set:trainer},{upsert:true});
  await c.createIndex({type:1,duration:-1});await c.createIndex({'metrics.pulse':1});
 }
 if(lab.stage>=11)await require('../models/Workout').init();
 if(lab.stage>=13){
  const User=require('../models/User');const bcrypt=require('bcryptjs');await User.init();
  for(const [email,role] of [['client@example.test','client'],['trainer@example.test','trainer']]){
   if(!await User.findOne({email}))await User.create({email,role,password:await bcrypt.hash('DemoPass123!',10)});
  }
 }
 console.log(JSON.stringify({database:database.databaseName,workouts:await c.countDocuments(),practice:lab.number}));
 await db.close();
}
seed().catch(async e=>{console.error(e);await db.close();process.exitCode=1;});
