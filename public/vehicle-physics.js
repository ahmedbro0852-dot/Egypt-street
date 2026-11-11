// Lightweight deterministic vehicle dynamics for the mobile browser game.
// Units are metres, seconds, radians. No physics-engine dependency.
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const approach=(v,target,amount)=>v<target?Math.min(target,v+amount):Math.max(target,v-amount);
export function createVehiclePhysics(x=0,z=0,yaw=0){
  return {x,z,yaw,speed:0,steer:0,yawRate:0};
}
export function stepVehiclePhysics(vehicle,input,dt,intersects){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.045);
  const throttle=clamp(input?.throttle||0,-1,1);
  const steering=clamp(input?.steer||0,-1,1);
  const braking=Boolean(input?.brake);
  const before=vehicle.speed;
  // Steering wheel eases toward commanded angle; no instant yaw at full speed.
  vehicle.steer=approach(vehicle.steer,steering*.43,dt*1.9);
  if(braking){
    vehicle.speed=approach(vehicle.speed,0,22*dt);
  }else if(throttle>.08){
    const force=throttle*8.6;
    vehicle.speed=vehicle.speed<-.12?
      approach(vehicle.speed,0,17*dt):
      Math.min(24,vehicle.speed+force*dt);
  }else if(throttle<-.08){
    const force=-throttle*5.8;
    vehicle.speed=vehicle.speed>.12?
      approach(vehicle.speed,0,16.5*dt):
      Math.max(-9,vehicle.speed-force*dt);
  }else{
    // Rolling and aerodynamic losses make the car coast rather than stop abruptly.
    const drag=1.0+.017*vehicle.speed*vehicle.speed;
    vehicle.speed=approach(vehicle.speed,0,drag*dt);
  }
  if(Math.abs(vehicle.speed)<.02)vehicle.speed=0;
  // Bicycle-model turning with a stabilised yaw rate.
  const desiredYawRate=clamp((vehicle.speed/2.75)*Math.tan(vehicle.steer),-1.25,1.25);
  vehicle.yawRate+= (desiredYawRate-vehicle.yawRate)*(1-Math.exp(-9*dt));
  let impact=0,collision=false;
  const count=Math.max(1,Math.ceil(Math.abs(vehicle.speed)*dt/.34));
  const segment=dt/count;
  for(let i=0;i<count;i++){
    const nextYaw=vehicle.yaw+vehicle.yawRate*segment;
    const nx=vehicle.x+Math.sin(nextYaw)*vehicle.speed*segment;
    const nz=vehicle.z+Math.cos(nextYaw)*vehicle.speed*segment;
    if(intersects(nx,nz,nextYaw)){
      impact=Math.abs(vehicle.speed);
      collision=true;
      vehicle.speed=impact>2?-Math.sign(vehicle.speed)*Math.min(impact*.09,1.25):0;
      vehicle.yawRate*=.3;
      break;
    }
    vehicle.x=nx;vehicle.z=nz;vehicle.yaw=nextYaw;
  }
  return {impact,collision,acceleration:(vehicle.speed-before)/Math.max(dt,.001)};
}
