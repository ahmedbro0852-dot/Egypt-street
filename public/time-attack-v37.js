// Egypt Streets V37 — solo Time Attack and replay of your real personal-best lap.
// All positions are local, sampled at fixed intervals, and stored on this device only.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const TIME_ATTACK_V37={
 maxTime:150, sampleEvery:.18,
 medals:{gold:48,silver:72,bronze:110},
 rewards:{gold:850,silver:600,bronze:350,finish:180}
};
export function timeAttackMedalV37(seconds){
 if(!Number.isFinite(seconds)||seconds<=0)return 'none';
 return seconds<=TIME_ATTACK_V37.medals.gold?'gold':
   seconds<=TIME_ATTACK_V37.medals.silver?'silver':
   seconds<=TIME_ATTACK_V37.medals.bronze?'bronze':'finish';
}
export function sanitiseGhostV37(data){
 if(!data||!Array.isArray(data.samples)||!Number.isFinite(data.time)||
    data.time<=0||data.time>TIME_ATTACK_V37.maxTime)return null;
 const clean=[];
 for(const s of data.samples.slice(0,1100)){
  if(!Array.isArray(s)||s.length!==4||s.some(x=>!Number.isFinite(x)))return null;
  const [t,x,z,yaw]=s;
  if(t<0||t>data.time+.3||Math.abs(x)>600||Math.abs(z)>400||
     Math.abs(yaw)>1e5||(clean.length&&t<=clean[clean.length-1][0]))return null;
  clean.push([t,x,z,yaw]);
 }
 return clean.length>=2?{time:data.time,samples:clean}:null;
}
export function positionAtGhostV37(record,seconds){
 if(!record?.samples?.length)return null;
 const a=record.samples,t=clamp(Number(seconds)||0,0,a[a.length-1][0]);
 let lo=0,hi=a.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(a[mid][0]<t)lo=mid+1;else hi=mid}
 const b=a[lo],p=a[Math.max(0,lo-1)];
 const f=b===p?0:clamp((t-p[0])/(b[0]-p[0]),0,1);
 const angle=Math.atan2(Math.sin(b[3]-p[3]),Math.cos(b[3]-p[3]));
 return {x:p[1]+(b[1]-p[1])*f,z:p[2]+(b[2]-p[2])*f,
  yaw:p[3]+angle*f};
}
export function createTimeAttackV37({storage,key='egypt-street-time-attack-v37'}={}){
 let best=null,attempts=0,completed=0,samples=[],lastSample=-Infinity,elapsed=0,
    active=false;
 try{
  const saved=JSON.parse(storage?.getItem(key)||'null');
  best=sanitiseGhostV37(saved?.best);
  attempts=clamp(Math.floor(saved?.attempts||0),0,999999);
  completed=clamp(Math.floor(saved?.completed||0),0,999999);
 }catch(e){}
 function save(){try{storage?.setItem(key,JSON.stringify({best,attempts,completed}))}catch(e){}}
 function begin(vehicle){
  samples=[];lastSample=-Infinity;elapsed=0;active=true;attempts++;save();
  record(0,vehicle);return true;
 }
 function record(t,car){
  if(!active||!car||!Number.isFinite(t)||t<0||t>TIME_ATTACK_V37.maxTime+.1||
     !Number.isFinite(car.x)||!Number.isFinite(car.z)||!Number.isFinite(car.yaw))return;
  if(t-lastSample<TIME_ATTACK_V37.sampleEvery-.0001)return;
  // Round samples to avoid localStorage bloat, retain enough precision for smooth playback.
  samples.push([+t.toFixed(3),+car.x.toFixed(2),+car.z.toFixed(2),+car.yaw.toFixed(4)]);
  lastSample=t;elapsed=t;
 }
 function finish(seconds,car,{valid=false}={}){
  if(!active)return {accepted:false,best:best?.time??null};
  if(car&&Number.isFinite(seconds))record(seconds,car);
  active=false;
  const proper=valid&&Number.isFinite(seconds)&&seconds>0&&seconds<=TIME_ATTACK_V37.maxTime&&samples.length>=2;
  if(!proper){save();return {accepted:false,best:best?.time??null}}
  completed++;
  const medal=timeAttackMedalV37(seconds),reward=TIME_ATTACK_V37.rewards[medal];
  const personalBest=!best||seconds<best.time-.0001;
  if(personalBest)best=sanitiseGhostV37({time:seconds,samples});
  save();
  return {accepted:true,personalBest,time:seconds,medal,reward,best:best?.time??seconds};
 }
 function abort(){active=false;samples=[];save()}
 return {begin,record,finish,abort,
  getGhost:(t)=>positionAtGhostV37(best,t),
  getHistory:()=>({bestTime:best?.time??null,attempts,completed,hasGhost:!!best}),
  getState:()=>({active,elapsed,samples:samples.length})};
}
