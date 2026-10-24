const express=require('express');
const jwt=require('jsonwebtoken');
const {rateLimit}=require('express-rate-limit');
const {User}=require('./models.cjs');
const passwords=require('./passwords.cjs');
const router=express.Router();
const secret=process.env.JWT_SECRET;
if(!secret || Buffer.byteLength(secret)<32 || secret.startsWith('replace_')) throw new Error('Set a random JWT_SECRET of at least 32 bytes');
const options={algorithm:'HS256',issuer:'fitness-api',audience:'fitness-client',expiresIn:'15m'};
const limiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false});
function credentials(body){
  if(!body||Array.isArray(body)||Object.keys(body).some(k=>!['email','password'].includes(k)))throw Object.assign(new Error('Only email and password allowed'),{status:400});
  if(typeof body.email!=='string'||body.email.length>120||!/^\S+@\S+\.\S+$/.test(body.email)||typeof body.password!=='string'||body.password.length<12||body.password.length>128)throw Object.assign(new Error('Valid email and password 12..128 characters required'),{status:400});
  return {email:body.email.trim().toLowerCase(),password:body.password};
}
router.post('/register',limiter,async(req,res)=>{
  const {email,password}=credentials(req.body);
  const user=await User.create({email,passwordHash:await passwords.hash(password),role:'member'});
  res.status(201).json({id:user.id,email:user.email,role:user.role});
});
router.post('/login',limiter,async(req,res)=>{
  const {email,password}=credentials(req.body);
  const user=await User.findOne({email}).select('+passwordHash');
  if(!user||!await passwords.verify(password,user.passwordHash))return res.status(401).json({error:'Invalid credentials'});
  const accessToken=jwt.sign({ver:user.tokenVersion},secret,{...options,subject:user.id});
  res.json({accessToken,tokenType:'Bearer',expiresIn:900});
});
async function authenticate(req,res,next){
  try{
    const match=/^Bearer ([^ ]+)$/.exec(req.get('Authorization')||'');
    if(!match)return res.status(401).json({error:'Bearer token required'});
    const payload=jwt.verify(match[1],secret,{algorithms:['HS256'],issuer:options.issuer,audience:options.audience});
    const user=await User.findById(payload.sub);
    if(!user||user.tokenVersion!==payload.ver)return res.status(401).json({error:'Token revoked'});
    req.user=user;next();
  }catch(err){
    if(['JsonWebTokenError','TokenExpiredError','NotBeforeError','CastError'].includes(err.name))return res.status(401).json({error:'Invalid or expired token'});
    next(err);
  }
}
router.post('/logout',authenticate,async(req,res)=>{
  await User.updateOne({_id:req.user._id},{$inc:{tokenVersion:1}});res.sendStatus(204);
});
module.exports={router,authenticate};
