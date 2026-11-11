import { solvePedestrianImpactV20 } from './pedestrian-physics-v20.js';
// Egypt Streets V18/V20 — oriented car contacts and Newton pedestrian impulses.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const sizes={taxi:[2.02,.94],sedan:[2,.96],sport:[2.1,1.02],motorbike:[1.03,.43]};
const K='egypt-streets-collisions-v18';
const unit=(x,z)=>{const d=Math.hypot(x,z)||1;return {x:x/d,z:z/d}};
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const forward=y=>({x:Math.sin(y),z:Math.cos(y)});
const side=y=>({x:Math.cos(y),z:-Math.sin(y)});
export function vehicleShape(x,z,yaw=0,id='taxi'){
 const [halfLength,halfWidth]=sizes[id]||sizes.taxi;
 return {x,z,yaw,halfLength,halfWidth};
}
export function vehicleContact(a,b){
 const difference={x:a.x-b.x,z:a.z-b.z};
 if(Math.hypot(difference.x,difference.z)>a.halfLength+b.halfLength+a.halfWidth+b.halfWidth)return null;
 const af=forward(a.yaw),ar=side(a.yaw),bf=forward(b.yaw),br=side(b.yaw);
 let depth=Infinity,normal=null;
 for(const axis of [af,ar,bf,br]){
  const ra=a.halfLength*Math.abs(dot(af,axis))+a.halfWidth*Math.abs(dot(ar,axis));
  const rb=b.halfLength*Math.abs(dot(bf,axis))+b.halfWidth*Math.abs(dot(br,axis));
  const projected=dot(difference,axis),overlap=ra+rb-Math.abs(projected);
  if(overlap<=0)return null;
  if(overlap<depth){depth=overlap;normal={x:axis.x*(projected<0?-1:1),z:axis.z*(projected<0?-1:1)}}
 }
 return {penetration:depth,normal};
}
export function pedestrianContact(car,person,radius=.43){
 const f=forward(car.yaw),r=side(car.yaw),d={x:person.x-car.x,z:person.z-car.z};
 const along=dot(d,f),across=dot(d,r);
 const cf=clamp(along,-car.halfLength,car.halfLength),cr=clamp(across,-car.halfWidth,car.halfWidth);
 const diff={x:d.x-f.x*cf-r.x*cr,z:d.z-f.z*cf-r.z*cr};
 const dist=Math.hypot(diff.x,diff.z);
 if(dist>radius)return null;
 if(dist>.0001)return {penetration:radius-dist,normal:unit(-diff.x,-diff.z)};
 const front=car.halfLength-Math.abs(along),sides=car.halfWidth-Math.abs(across);
 const axis=front<sides?f:r,negative=front<sides?along:across;
 return {penetration:radius+Math.min(front,sides),normal:{x:axis.x*(negative<0?1:-1),z:axis.z*(negative<0?1:-1)}};
}
export function createCollisionPhysicsV18({traffic=[],pedestrians=[],getVehicleType=()=>'taxi',
 getVehicleMass=()=>1310,registerDamage=()=>{},reactPedestrian=()=>{},charge=()=>false,
 notify=()=>{},sound=()=>{},storage,ui,forceUi}={}){
 let stats={hits:0,carHits:0,pedHits:0,trafficHits:0,totalPenalty:0};
 let lastPedestrianPhysics=null;
 try{const a=JSON.parse(storage?.getItem(K)||'null');
  if(a)for(const k of Object.keys(stats))stats[k]=clamp(Number(a[k])||0,0,k==='totalPenalty'?1e7:1e5)
 }catch(e){}
 const recent=new WeakMap(),trafficRecent=new WeakMap();
 const persist=()=>{try{storage?.setItem(K,JSON.stringify(stats))}catch(e){}};
 const render=()=>{if(ui)ui.textContent=stats.hits?
  '💥 خبطات '+stats.hits+' • عربيات '+stats.carHits+' • مشاة '+stats.pedHits:
  '🛡️ سواقة آمنة • خلي بالك من المشاة'};
 function kindOf(c){return c.userData?.wheels?.length===2?'motorbike':'taxi'}
 function bodyOf(c){return vehicleShape(c.position.x,c.position.z,c.rotation.y,kindOf(c))}
 function probe(x,z,yaw=0,id=getVehicleType()){
  if(![x,z,yaw].every(Number.isFinite))return null;
  const me=vehicleShape(x,z,yaw,id);let hit=null,contacts=[];
  for(const other of traffic){
   if((other.position.x-x)**2+(other.position.z-z)**2>36)continue;
   const contact=vehicleContact(me,bodyOf(other));
   if(contact){
    const item={...contact,type:'vehicle',other};
    contacts.push(item);
    if(!hit||contact.penetration>hit.penetration)hit=item;
   }
  }
  for(const other of pedestrians){
   if((other.position.x-x)**2+(other.position.z-z)**2>22)continue;
   const contact=pedestrianContact(me,other.position);
   if(contact){
    const item={...contact,type:'pedestrian',other};
    contacts.push(item);
    if(!hit||contact.penetration>hit.penetration)hit=item;
   }
  }
  return hit?{...hit,contacts}:null;
 }
 function onCollision(hit,body,impact,t=0){
  if(!hit?.other||!Number.isFinite(t))return null;
  if(t-(recent.get(hit.other)??-Infinity)<1800)return null;
  recent.set(hit.other,t);
  const heading=forward(body.yaw),v={x:heading.x*impact,z:heading.z*impact};
  const d=hit.other.userData||{};
  const otherV=hit.type==='vehicle'?
    {x:d.axis==='x'?d.direction*(d.actualCruise||0):0,
     z:d.axis==='z'?d.direction*(d.actualCruise||0):0}:{x:0,z:0};
  const relative=Math.hypot(v.x-otherV.x,v.z-otherV.z);
  const severity=clamp(Math.max(Math.abs(impact),relative),.01,49);
  stats.hits++;
  if(hit.type==='vehicle'){
   stats.carHits++;
   d.crashHold=t+clamp(severity*115,350,2000);
   d.actualCruise=Math.max(0,(d.actualCruise||0)*(severity<4?.60:.13));
   d.crashShake=clamp(severity*.014,.025,.23);
   registerDamage(Math.max(4.0,severity*1.14));
   body.yawRate+=clamp((hit.normal.x*heading.z-hit.normal.z*heading.x)*.24,-.18,.18);
   if(severity>4)body.speed=-Math.sign(impact||1)*Math.min(1.35,severity*.065);
   notify(severity>8?'💥 خبطت عربية! راجع حالة عربيتك واترك مسافة أمان.':
     '🚗 خبطت عربية تانية — خفف السرعة.');
   sound(severity,'vehicle');
  }else{
   stats.pedHits++;
   const away=unit(-hit.normal.x,-hit.normal.z);
   const heading=forward(body.yaw),direction=Math.sign(impact||1);
   const approach=Math.max(.35,Math.abs(dot(heading,away)));
   const personMass=58+((hit.other.userData?.id||0)%9)*3.25;
   const physics=solvePedestrianImpactV20({
     vehicleMass:getVehicleMass(),personMass,
     closingSpeed:severity*approach,
     contactDuration:clamp(.10+severity*.002,.10,.18)
   });
   lastPedestrianPhysics=physics;
   reactPedestrian(hit.other,away,clamp(physics.personDeltaV/12,.2,1),t,physics);
   registerDamage(Math.max(2.2,severity*.38));
   // Physics impulse slows the car; additional bumper damping avoids nudging
   // the same person repeatedly while the walkable collision separates.
   body.speed=direction*Math.max(0,severity-physics.vehicleDeltaV)*.38;
   body.lateralSpeed*=.20;body.yawRate*=.70;
   if(forceUi)forceUi.textContent='F≈ '+Math.round(physics.averageForce/100)/10+
      ' كيلو نيوتن • قوة صدمة تقديرية (F = m × a)';
   const fine=severity>6?150:65;
   if(charge(fine)){stats.totalPenalty+=fine;notify('🚨 خبطت حد! غرامة سلامة −'+fine+' جنيه.')}
   else notify('🚨 خد بالك من المشاة — لازم توقف لهم!');
   sound(severity,'pedestrian');
  }
  persist();render();
  return {type:hit.type,severity,total:stats.hits};
 }
 function trafficStep(car,step,t=0,player=null,driving=false){
  if(!Number.isFinite(step))return 0;
  const d=car.userData;
  if(t<(d.crashHold||0))return 0;
  const axis=d.axis,original=car.position[axis];
  const check=f=>{
   const x=axis==='x'?original+step*f:car.position.x;
   const z=axis==='z'?original+step*f:car.position.z;
   const a=vehicleShape(x,z,car.rotation.y,kindOf(car));
   for(const other of traffic){
    if(other===car||(x-other.position.x)**2+(z-other.position.z)**2>41)continue;
    if(vehicleContact(a,bodyOf(other)))return {other,type:'vehicle'};
   }
   if(driving&&player?.position&&(x-player.position.x)**2+(z-player.position.z)**2<40&&
       vehicleContact(a,vehicleShape(player.position.x,player.position.z,player.rotation.y,getVehicleType())))
       return {other:player,type:'player'};
   for(const p of pedestrians){
    if((x-p.position.x)**2+(z-p.position.z)**2<22&&pedestrianContact(a,p.position))
      return {other:p,type:'pedestrian'};
   }
   return null;
  };
  const end=check(1);
  if(!end)return step;
  let lo=0,hi=1;
  for(let i=0;i<7;i++){const m=(lo+hi)/2;if(check(m))hi=m;else lo=m}
  const allowed=Math.abs(step*lo)<.02?0:step*lo*.90;
  d.actualCruise=Math.min(d.actualCruise||0,allowed===0?0:Math.abs(allowed)*12);
  if(end.type==='vehicle'&&Math.abs(step)>.12&&t-(trafficRecent.get(car)??-Infinity)>2300){
   trafficRecent.set(car,t);
   stats.trafficHits++;
   d.crashHold=t+380;end.other.userData.crashHold=t+460;
   d.crashShake=.05;end.other.userData.crashShake=.05;persist()
  }
  return allowed;
 }
 function animateTraffic(car,dt=1/60){
  const d=car.userData;
  d.crashShake=Math.max(0,(d.crashShake||0)-dt*.19);
  const tilt=d.crashShake>0?Math.sin(d.crashShake*30)*d.crashShake*.37:0;
  if(d.chassis)d.chassis.rotation.z=tilt;else car.rotation.z=tilt;
 }
 render();
 return {probe,onCollision,trafficStep,animateTraffic,getStats:()=>({...stats}),
  getLastPedestrianPhysics:()=>lastPedestrianPhysics?{...lastPedestrianPhysics}:null,
  refresh:render};
}
