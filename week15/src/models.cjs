const mongoose=require('mongoose');
const workoutSchema=new mongoose.Schema({
  owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  type:{type:String,required:true,trim:true,minlength:2,maxlength:60},
  duration:{type:Number,required:true,min:1,max:600,validate:Number.isInteger},
  date:{type:Date,default:Date.now,required:true}
},{timestamps:true,versionKey:false});
workoutSchema.index({owner:1,date:-1});

const userSchema=new mongoose.Schema({
  email:{type:String,required:true,lowercase:true,trim:true,unique:true,maxlength:120},
  passwordHash:{type:String,required:true,select:false},
  role:{type:String,enum:['member','admin'],default:'member'},
  tokenVersion:{type:Number,default:0}
},{timestamps:true,versionKey:false});

module.exports={Workout:mongoose.model('Workout',workoutSchema),User:mongoose.model('User',userSchema)};
