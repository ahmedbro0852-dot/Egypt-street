// Egypt Streets — separate steering knuckles from tyre rolling on every vehicle.
// Simple Ackermann wheel angles preserve realistic inner/outer front wheel behaviour.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const WHEEL_RADIUS=.405;
export function ackermannAngles(steer,track=1.88,wheelbase=2.7){
 const angle=clamp(Number.isFinite(steer)?steer:0,-.65,.65);
 if(Math.abs(angle)<.0001)return {left:0,right:0};
 const sign=Math.sign(angle),radius=wheelbase/Math.tan(Math.abs(angle));
 const inner=Math.atan2(wheelbase,Math.max(1.2,radius-track/2));
 const outer=Math.atan2(wheelbase,radius+track/2);
 return {left:sign*(sign<0?inner:outer),right:sign*(sign>0?inner:outer)};
}
export function updateCarWheels(car,physical,dt=1/60){
 if(!car?.userData?.wheels||!physical)return;
 const wheels=car.userData.wheels,angles=ackermannAngles(physical.steer);
 const sin=Math.sin(physical.wheelSpin||0);
 for(const wheel of wheels){
   const meta=wheel.userData||{},front=meta.front??wheel.position.z>0;
   const side=meta.side??Math.sign(wheel.position.x);
   // Steer around the vertical kingpin, spin around the axle in a *child* group.
   wheel.rotation.y=front?(side<0?angles.left:angles.right):0;
   if(meta.rolling){
     meta.rolling.rotation.x=physical.wheelSpin||0;
   }else wheel.rotation.x=physical.wheelSpin||0;
   if(Number.isFinite(meta.baseY)){
     // Tyres contact the road: subtle unsprung oscillation only.
     const roadRipple=Math.min(.025,Math.abs(physical.speed||0)*.0012);
     wheel.position.y=meta.baseY+roadRipple*Math.sin((physical.wheelSpin||0)*.65+side*.8+(front?1.1:0));
   }
 }
}
export function spinTrafficWheels(car,distance){
 if(!car?.userData?.wheels)return;
 const moved=Math.abs(distance);
 for(const wheel of car.userData.wheels){
   const roll=wheel.userData?.rolling||wheel;
   // Every AI car is moving forward in its own local coordinate system.
   roll.rotation.x+=moved/(wheel.userData?.radius||WHEEL_RADIUS);
 }
}
export function gearStatus(speed=0,parkingBrake=false,reversing=false){
 if(parkingBrake)return {gear:'P',label:'فرامل اليد',color:'parked'};
 if(speed<-.35||reversing)return {gear:'R',label:'رجوع',color:'reverse'};
 if(Math.abs(speed)<.35)return {gear:'N',label:'واقف',color:'neutral'};
 return {gear:'D',label:'قيادة',color:'drive'};
}
