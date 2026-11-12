// V112 Living Characters — consistent heading, planted steps and natural stop/start.
// Transform-only; no extra meshes, draw calls, timers, saves or collision changes.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const decay=(dt,k)=>1-Math.exp(-clamp(dt,0,.10)*k);
export function citizenHeadingV112(current,target,dt,turnRate=7){
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+delta*decay(dt,turnRate);
}
export function animateCitizenStrideV112(person,{dt=0,phase=0,near=true,walking=false,
  nearCar=false,frightened=false,stumbling=false,raining=false}={}){
 const u=person?.userData;
 if(!u?.body||!u?.legs||!u?.knees)return {enabled:false};
 dt=clamp(dt,0,.08);
 const amount=clamp(Number(u.motion)||0,0,1);
 const moving=walking&&!stumbling&&!frightened;
 const previous=u.gaitV112||{weight:0,brake:0,lean:0};
 const body=u.body;
 const pace=(u.id%4)*.04+.86;
 const target= moving?amount:0;
 previous.weight+=(target-previous.weight)*decay(dt,10);
 const stopping=nearCar||(!moving&&previous.weight>.04);
 previous.brake+=(Number(stopping)-previous.brake)*decay(dt,8);
 previous.lean+=(Math.sin(phase)*previous.weight*.028-previous.lean)*decay(dt,6);
 u.gaitV112=previous;
 // Fall and impact poses belong exclusively to the collision system.
 if(stumbling||frightened){
  if(u.legs[0]?.rotation){u.legs[0].rotation.y=0;u.legs[0].rotation.z=0;}
  if(u.legs[1]?.rotation){u.legs[1].rotation.y=0;u.legs[1].rotation.z=0;}
  if(u.knees[0]?.rotation)u.knees[0].rotation.z=0;
  if(u.knees[1]?.rotation)u.knees[1].rotation.z=0;
  // During impacts, restore neutral ankles; the existing fall rig stays in charge.
  for(const foot of u.feet||[]){
   foot.rotation.x=0;foot.rotation.z=0;foot.position.y=-.31;
  }
  return {enabled:true,lod:near?'near':'far',priority:'collision'};
 }
 if(!near){
  if(u.proxy){
   // Far pedestrians retain readable weight shift without full joint updates.
   u.proxy.rotation.y=previous.lean*.56;
   u.proxy.position.y+=Math.max(0,Math.sin(phase*2))*.008*previous.weight;
  }
  return {enabled:true,lod:'far'};
 }
 const stride=Math.sin(phase*pace),liftL=Math.max(0,-stride),liftR=Math.max(0,stride);
 const eased=previous.weight;
 // Additive relative to the existing freshly-computed walking pose.
 // Keep clothing and shoes from sliding through the ground at higher speeds.
 body.position.y+=Math.max(0,Math.sin(phase*2))*.012*eased;
 body.rotation.x+=-.025*eased+previous.brake*.035;
 body.rotation.z+=previous.lean*.42;
 if(u.legs[0]?.rotation){
  u.legs[0].rotation.y=.014*stride*eased;
  u.legs[0].rotation.z=liftL*.023*eased;
 }
 if(u.legs[1]?.rotation){
  u.legs[1].rotation.y=-.014*stride*eased;
  u.legs[1].rotation.z=-liftR*.023*eased;
 }
 if(u.knees[0]?.rotation)u.knees[0].rotation.z=liftL*.035*eased;
 if(u.knees[1]?.rotation)u.knees[1].rotation.z=-liftR*.035*eased;
 // Contact-aware heel-to-toe action: the planted shoe settles flat; the swing
 // foot clears the pavement. These are visual pivots, not IK or collision edits.
 if(u.feet?.length===2){
  const contactL=Math.max(0,stride),contactR=Math.max(0,-stride);
  const fL=u.feet[0],fR=u.feet[1];
  fL.rotation.x=eased*(contactL*.075-liftL*.19);
  fR.rotation.x=eased*(contactR*.075-liftR*.19);
  fL.rotation.z=eased*liftL*.020;
  fR.rotation.z=-eased*liftR*.020;
  fL.position.y=-.31+eased*liftL*.035;
  fR.position.y=-.31+eased*liftR*.035;
 }
 if(raining&&moving){
  body.rotation.x+=.016*eased;
 }
 return {enabled:true,lod:'near',weight:eased};
}
