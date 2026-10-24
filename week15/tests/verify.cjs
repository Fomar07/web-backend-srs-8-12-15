const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{spawn}=require('child_process');
const crypto=require('node:crypto');
const mongoose=15>8?require('mongoose'):null,jwt=15===15?require('jsonwebtoken'):null;
const src=path.resolve(__dirname,'../..');
const evidence=path.join(__dirname,'results');fs.mkdirSync(evidence,{recursive:true});
const secret=crypto.randomBytes(48).toString('hex');
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function run(week){
 const port=3100+week,base=`http://127.0.0.1:${port}`,home=path.join(src,`СРС ${week}`);
 const uri=process.env.TEST_MONGO_URI || `mongodb://127.0.0.1:27017/fitness_srs${week}_test`;
 let logs='',child;
 async function start(){
  child=spawn(process.execPath,[path.join(home,'src/server.cjs')],{cwd:home,env:{...process.env,PORT:String(port),MONGO_URI:uri,JWT_SECRET:secret},windowsHide:true});
  child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)return;}catch{}await sleep(100);}
  throw Error(`Server ${week} did not start: ${logs}`);
 }
 async function stop(){if(child&&!child.killed){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}}
 const records=[];
 async function call(label,method,url,body,status,token,raw){
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(base+url,{method,headers,body:body===undefined?undefined:(raw?body:JSON.stringify(body))});
  const text=await response.text();let result;try{result=JSON.parse(text);}catch{result=text;}
  records.push({label,method,url,request:body,status:response.status,expected:status,response:result});
  assert.equal(response.status,status,label+': '+text);
  return result;
 }
 try{
  await start();
  let alice,bob,token,bobToken;
  const pwd='Fitness-demo-2026!';
  const suffix=Date.now();
  if(week===15){
   await call('Anonymous access denied','GET','/api/workouts',undefined,401);
   await call('Role injection denied','POST','/api/auth/register',{email:`x${suffix}@example.test`,password:pwd,role:'admin'},400);
   alice=await call('Registration','POST','/api/auth/register',{email:`alice${suffix}@example.test`,password:pwd},201);
   await call('Duplicate email','POST','/api/auth/register',{email:alice.email,password:pwd},409);
   bob=await call('Second user','POST','/api/auth/register',{email:`bob${suffix}@example.test`,password:pwd},201);
   await call('NoSQL injection denied','POST','/api/auth/login',{email:{$ne:null},password:pwd},400);
   await call('Wrong password','POST','/api/auth/login',{email:alice.email,password:'Wrong-pass-2026!'},401);
   token=(await call('Login','POST','/api/auth/login',{email:alice.email,password:pwd},200)).accessToken;
   bobToken=(await call('Second user login','POST','/api/auth/login',{email:bob.email,password:pwd},200)).accessToken;
   await call('Admin access denied','GET','/api/admin/users',undefined,403,token);
  }
  const item=await call('Create workout','POST','/api/workouts',{type:'Плавание',duration:40,date:'2026-10-24'},201,token);
  const id=item.id||item._id;
  await call('Read workout','GET',`/api/workouts/${id}`,undefined,200,token);
  const list=await call('List workouts','GET','/api/workouts',undefined,200,token);
  assert.ok(week===8?list.some(x=>x.id===id):list.items.some(x=>x._id===id));
  await call('Reject zero duration','POST','/api/workouts',{type:'Бег',duration:0},400,token);
  await call('Reject fractional duration','POST','/api/workouts',{type:'Бег',duration:1.5},400,token);
  await call('Reject object injection','POST','/api/workouts',{type:{$ne:null},duration:20},400,token);
  await call('Reject unknown field','PATCH',`/api/workouts/${id}`,{$set:{duration:2}},400,token);
  await call('Reject invalid date','PATCH',`/api/workouts/${id}`,{date:'2026-02-31'},400,token);
  const changed=await call('Update duration','PATCH',`/api/workouts/${id}`,{duration:50},200,token);assert.equal(changed.duration,50);
  await call('Reject invalid update','PATCH',`/api/workouts/${id}`,{duration:601},400,token);
  if(week>8){
   await call('Invalid ObjectId','GET','/api/workouts/wrong',undefined,400,token);
   await call('Missing ObjectId','GET','/api/workouts/000000000000000000000001',undefined,404,token);
   await call('Pagination limit','GET','/api/workouts?limit=51',undefined,400,token);
   await stop();await start();
   const persisted=await call('Persisted after restart','GET',`/api/workouts/${id}`,undefined,200,token);assert.equal(persisted.duration,50);
  }
  if(week===15){
   await call('Other user cannot read','GET',`/api/workouts/${id}`,undefined,404,bobToken);
   await call('Other user cannot modify','PATCH',`/api/workouts/${id}`,{duration:1},404,bobToken);
   await call('Other user cannot delete','DELETE',`/api/workouts/${id}`,undefined,404,bobToken);
   const other=await call('Other user list isolated','GET','/api/workouts',undefined,200,bobToken);assert.equal(other.total,0);
   const payload=jwt.decode(token);
   const expired=jwt.sign({ver:0},secret,{algorithm:'HS256',issuer:'fitness-api',audience:'fitness-client',subject:alice.id,expiresIn:-1});
   await call('Expired JWT','GET','/api/me',undefined,401,expired);
   const wrongAudience=jwt.sign({ver:0},secret,{algorithm:'HS256',issuer:'fitness-api',audience:'other-client',subject:alice.id,expiresIn:'1m'});
   await call('Wrong audience','GET','/api/me',undefined,401,wrongAudience);
   const forged=token.slice(0,token.lastIndexOf('.')+1)+'a'.repeat(43);
   await call('Forged signature','GET','/api/me',undefined,401,forged);
   const none=Buffer.from(JSON.stringify({alg:'none'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';
   await call('Unsigned JWT','GET','/api/me',undefined,401,none);
   await mongoose.connect(uri);
   const stored=await mongoose.connection.collection('users').findOne({_id:new mongoose.Types.ObjectId(alice.id)});
   assert.ok(stored.passwordHash.startsWith('scrypt$'));assert.ok(!JSON.stringify(stored).includes(pwd));
   fs.writeFileSync(path.join(evidence,'password-check.json'),JSON.stringify({algorithm:'scrypt',plaintextStored:false,hashLength:stored.passwordHash.length}));
   await mongoose.connection.collection('users').updateOne({_id:new mongoose.Types.ObjectId(bob.id)},{$set:{role:'admin'}});
   await mongoose.disconnect();
   await call('Admin role permitted','GET','/api/admin/users',undefined,200,bobToken);
   await call('Logout invalidates all tokens','POST','/api/auth/logout',undefined,204,token);
   await call('Revoked JWT','GET','/api/me',undefined,401,token);
   const refreshed=(await call('Login after logout','POST','/api/auth/login',{email:alice.email,password:pwd},200)).accessToken;
   token=refreshed;
   let blocked=false;
   for(let i=0;i<12;i++){
    const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:alice.email,password:'Wrong-pass-2026!'})});
    if(r.status===429){records.push({label:'Brute force rate limit',method:'POST',url:'/api/auth/login',status:429,expected:429,response:await r.text()});blocked=true;break;}
   }
   assert.ok(blocked);
   const headers=await fetch(base+'/health');assert.equal(headers.headers.get('x-content-type-options'),'nosniff');
  }
  await call('Delete workout','DELETE',`/api/workouts/${id}`,undefined,204,token);
  await call('Deleted item is absent','GET',`/api/workouts/${id}`,undefined,404,token);
  await call('Unknown route','GET','/api/absent',undefined,404,token);
  await call('Malformed JSON','POST','/api/workouts','{"type":',400,token,true);
  await call('JSON body size limit','POST','/api/workouts',{type:'x'.repeat(17000),duration:2},413,token);
  fs.writeFileSync(path.join(evidence,`week${week}.json`),JSON.stringify({week,checks:records.length,passed:records.length,records},null,2));
  fs.writeFileSync(path.join(evidence,`week${week}.log`),logs);
  console.log(`Week ${week}: ${records.length} HTTP checks passed`);
 }finally{await stop();}
}
run(15).catch(e=>{console.error(e);process.exitCode=1});
