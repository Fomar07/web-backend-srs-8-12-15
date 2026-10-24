const {scrypt,randomBytes,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(scrypt);
async function hash(password){
  const salt=randomBytes(16).toString('hex');
  const key=await derive(password,salt,64,{N:16384,r:8,p:1});
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verify(password,stored){
  const [,salt,hex]=stored.split('$');
  const expected=Buffer.from(hex,'hex');
  const actual=await derive(password,salt,64,{N:16384,r:8,p:1});
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
module.exports={hash,verify};
