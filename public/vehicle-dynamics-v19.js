// Egypt Streets V19 — vehicle mass profiles, suspension tuning and multi-body impulses.
// All units are metres, seconds and kilograms. Deterministic gameplay simulation.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const VEHICLE_DYNAMICS_V19={
 taxi:{mass:1310,wheelbase:2.70,frontShare:.55,inertiaScale:1.03,engineForce:7350,brakeForce:9800,spring:66,rollSpring:54,
  suspensionTravel:.115,tyreStiffness:1.00,dragScale:1,brakeThermal:1},
 sedan:{mass:1590,wheelbase:2.93,frontShare:.57,inertiaScale:1.17,engineForce:8300,brakeForce:10900,spring:59,rollSpring:48,
  suspensionTravel:.14,tyreStiffness:.96,dragScale:1.13,brakeThermal:.95},
 sport:{mass:1125,wheelbase:2.60,frontShare:.51,inertiaScale:.91,engineForce:8900,brakeForce:10500,spring:83,rollSpring:79,
  suspensionTravel:.078,tyreStiffness:1.13,dragScale:.89,brakeThermal:1.09},
 motorbike:{mass:215,wheelbase:1.42,frontShare:.48,inertiaScale:.48,engineForce:1680,brakeForce:1710,spring:72,rollSpring:88,
  suspensionTravel:.18,tyreStiffness:.76,dragScale:.53,brakeThermal:.84}
};
export function getVehicleDynamicsV19(id='taxi'){
 return {...(VEHICLE_DYNAMICS_V19[id]||VEHICLE_DYNAMICS_V19.taxi)};
}
const forward=y=>({x:Math.sin(y),z:Math.cos(y)});
const dot=(a,b)=>a.x*b.x+a.z*b.z;
function npcMass(other){
 return other?.userData?.wheels?.length===2?VEHICLE_DYNAMICS_V19.motorbike.mass:
   other?.userData?.massV19||VEHICLE_DYNAMICS_V19.taxi.mass;
}
export function computeImpactV19({playerMass=1310,otherMass=1310,closingSpeed=0,restitution=.12}={}){
 const a=clamp(playerMass,100,2600),b=clamp(otherMass,100,2600);
 const closing=Math.max(0,Number(closingSpeed)||0);
 const impulse=(1+clamp(restitution,0,.35))*closing/(1/a+1/b);
 return {impulse,playerDelta:impulse/a,otherDelta:impulse/b,
  reducedMass:a*b/(a+b)};
}
export function createMultiBodyV19({getId=()=>'taxi',onExtra=()=>{},onInfo=()=>{}}={}){
 const last=new WeakMap();
 function resolve(contacts,body,impact,t=0){
  if(!Array.isArray(contacts)||!contacts.length||!body)return {contacts:0,impulse:0};
  const mass=getVehicleDynamicsV19(getId()).mass;
  const heading=forward(body.yaw);
  // The physics step has already stopped at the contact; use pre-impact speed
  // as the incoming relative velocity to compute an impulse.
  let velocity={x:heading.x*impact,z:heading.z*impact};
  let sumImpulse=0,updated=0,additional=0,significant=0;
  const others=new Set();
  for(const hit of contacts){
   if(!hit?.other||others.has(hit.other))continue;
   others.add(hit.other);
   const prior=last.get(hit.other)??-Infinity;
   if(t-prior<1300)continue;
   last.set(hit.other,t);
   updated++;
   const person=hit.type==='pedestrian';
   // Person reaction and fine are handled by the primary safety system.
   if(person){
    if(updated>1)onExtra(hit,impact,t);
    continue;
   }
   const other=hit.other,ud=other.userData||{};
   const axis=ud.axis==='x'?'x':'z',direction=ud.direction||1;
   const otherVelocity={x:axis==='x'?direction*(ud.actualCruise||0):0,
                        z:axis==='z'?direction*(ud.actualCruise||0):0};
   const normal=hit.normal||{x:-heading.x,z:-heading.z};
   const approaching=Math.max(0,-dot({x:velocity.x-otherVelocity.x,z:velocity.z-otherVelocity.z},normal));
   if(approaching<.02)continue;
   const response=computeImpactV19({playerMass:mass,otherMass:npcMass(other),
      closingSpeed:approaching,restitution:.13});
   sumImpulse+=response.impulse;significant++;
   // Incremental sequential impulses simulate several simultaneous nearby car bodies.
   velocity.x+=normal.x*response.playerDelta;
   velocity.z+=normal.z*response.playerDelta;
   const after={x:otherVelocity.x-normal.x*response.otherDelta,
                z:otherVelocity.z-normal.z*response.otherDelta};
   // Traffic AI runs on lanes only. Convert the 2D impulse back to its lane speed.
   const newLaneSpeed=Math.max(0,direction*(axis==='x'?after.x:after.z));
   ud.actualCruise=clamp(newLaneSpeed,0,ud.cruise||12);
   ud.crashHold=Math.max(ud.crashHold||0,t+Math.min(1000,180+approaching*57));
   ud.crashShake=Math.max(ud.crashShake||0,clamp(approaching*.013,.025,.24));
   if(updated>1){onExtra(hit,approaching,t);additional++}
  }
  if(significant){
   const projected=dot(velocity,heading);
   // A collision cannot create more forward speed than the car had before it.
   body.speed=clamp(projected,-2.8,Math.max(0,impact*.85));
   body.heaveVelocity=clamp((body.heaveVelocity||0)+Math.min(.38,sumImpulse/(mass*38)),-2,2);
   body.pitchVelocity=clamp((body.pitchVelocity||0)+Math.min(.5,sumImpulse/(mass*29)),-2,2);
  }
  if(additional)onInfo('💥 تصادم متسلسل — '+(additional+1)+' مركبات متأثرة.');
  return {contacts:updated,vehicles:significant,additional,impulse:sumImpulse,
    remainingSpeed:body.speed};
 }
 return {resolve};
}
