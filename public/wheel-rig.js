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
// Per-wheel, load-sensitive travel. All inputs are in SI units.
// The chassis is already animated by vehicle-physics.js; wheels remain
// separate so the tyres can visibly absorb braking, cornering and small bumps.
export function wheelOffsetV150(physical={},front=true,side=1){
 const finite=(value)=>Number.isFinite(value)?value:0;
 const speed=Math.abs(finite(physical.speed));
 const longLoad=clamp(-finite(physical.acceleration)*.007,-.048,.048)*(front?1:-1);
 const sideLoad=clamp(finite(physical.lateralAcceleration)*.006,-.05,.05)*(side<0?-1:1);
 const roll=finite(physical.wheelSpin);
 const roadRipple=clamp(speed/5,0,1)*(
   .009*Math.sin(roll*.68+(front?1.4:0)+side*.75)+
   .004*Math.sin(roll*.29+(front?0:1.8)-side*.43));
 const impact=clamp(finite(physical.impact)*.003,0,.04)*
   Math.sin(roll*1.8+(front?0:1.1)+side);
 return clamp(longLoad+sideLoad+roadRipple+impact,-.075,.075);
}
export function updateCarWheels(car,physical,dt=1/60){
 if(!car?.userData?.wheels||!physical)return;
 const wheels=car.userData.wheels,angles=ackermannAngles(physical.steer);
 const blend=1-Math.exp(-12*clamp(Number.isFinite(dt)?dt:1/60,0,.05));
 for(const wheel of wheels){
   const meta=wheel.userData||{},front=meta.front??wheel.position.z>0;
   const side=meta.side??Math.sign(wheel.position.x);
   // Steer around the vertical kingpin, spin around the axle in a *child* group.
   wheel.rotation.y=front?(side<0?angles.left:angles.right):0;
   // Wheel angular velocity depends on its radius: bike wheels are smaller.
   const spin=(physical.wheelSpin||0)*(WHEEL_RADIUS/(meta.radius||WHEEL_RADIUS));
   if(meta.rolling){
     meta.rolling.rotation.x=spin;
   }else wheel.rotation.x=spin;
   if(Number.isFinite(meta.baseY)){
     // V150: spring-filtered independent wheel travel, not shared sine wobble.
     const target=wheelOffsetV150(physical,front,side);
     const previous=Number.isFinite(meta.travelV150)?meta.travelV150:0;
     meta.travelV150=previous+(target-previous)*blend;
     wheel.position.y=meta.baseY+meta.travelV150;
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
