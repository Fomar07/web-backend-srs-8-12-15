// Run locally by the database administrator. No public role-edit endpoint exists.
const mongoose=require('mongoose');
const {User}=require('../src/models.cjs');
(async()=>{
 const email=process.argv[2];
 if(!email)throw new Error('Usage: node scripts/promote-admin.cjs email');
 await mongoose.connect(process.env.MONGO_URI);
 const result=await User.updateOne({email:email.toLowerCase()},{$set:{role:'admin'},$inc:{tokenVersion:1}});
 console.log({matched:result.matchedCount});await mongoose.disconnect();
})().catch(e=>{console.error(e.message);process.exitCode=1});
