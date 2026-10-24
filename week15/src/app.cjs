const express=require('express');
const helmet=require('helmet');
const mongoose=require('mongoose');
const {router,authenticate}=require('./auth.cjs');
const app=express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({limit:'16kb',strict:true}));
app.get('/health',(req,res)=>res.status(mongoose.connection.readyState===1?200:503).json({database:mongoose.connection.readyState===1?'connected':'unavailable'}));
app.use('/api/auth',router);
app.get('/api/me',authenticate,(req,res)=>res.json({id:req.user.id,email:req.user.email,role:req.user.role}));
app.get('/api/admin/users',authenticate,async(req,res)=>{
  if(req.user.role!=='admin')return res.status(403).json({error:'Admin role required'});
  res.json(await require('./models.cjs').User.find().select('email role').limit(100).lean());
});
app.use('/api/workouts',authenticate,require('./workouts.cjs'));
app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.use(require('./errors.cjs'));
module.exports=app;
