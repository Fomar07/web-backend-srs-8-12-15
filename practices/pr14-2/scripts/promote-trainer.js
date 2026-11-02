require('dotenv').config();
const db=require('../db');
const email=process.argv[2];
if(!email)throw new Error('Укажите email: node scripts/promote-trainer.js email');
(async()=>{await db.connect();const User=require('../models/User');
 const result=await User.updateOne({email:email.toLowerCase()},{$set:{role:'trainer'}});
 console.log({matched:result.matchedCount,modified:result.modifiedCount});await db.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
