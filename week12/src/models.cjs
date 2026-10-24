const mongoose=require('mongoose');
const workoutSchema=new mongoose.Schema({
  
  type:{type:String,required:true,trim:true,minlength:2,maxlength:60},
  duration:{type:Number,required:true,min:1,max:600,validate:Number.isInteger},
  date:{type:Date,default:Date.now,required:true}
},{timestamps:true,versionKey:false});
workoutSchema.index({date:-1});

module.exports={Workout:mongoose.model('Workout',workoutSchema)};
