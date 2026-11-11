// Egypt Streets V20: Newton impact impulse and non-graphic pedestrian recovery.
// SI units. J = F*dt = reducedMass*(1+restitution)*relativeSpeed.
// The animation intentionally caps real impulse velocities for mobile play.
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
export function solvePedestrianImpactV20({vehicleMass=1310,personMass=72,closingSpeed=0,contactDuration=.12,restitution=.06}={}){
 const m=limit(Number(vehicleMass)||1310,160,2600),p=limit(Number(personMass)||72,45,110);
 const v=limit(Number(closingSpeed)||0,0,49),dt=limit(contactDuration,.055,.21);
 const reducedMass=m*p/(m+p),impulse=(1+limit(restitution,0,.22))*reducedMass*v;
 const averageForce=impulse/dt,personDeltaV=impulse/p,vehicleDeltaV=impulse/m;
 return {vehicleMass:m,personMass:p,impactSpeed:v,contactDuration:dt,impulse,
  averageForce,personAcceleration:averageForce/p,vehicleDeceleration:averageForce/m,
  personDeltaV,vehicleDeltaV,horizontalSpeed:limit(personDeltaV*.32,0,6.4),
  loftSpeed:limit(personDeltaV*.09,0,1.5),stumbleAngle:limit(personDeltaV*.10,.12,1.32),
  downDurationMs:personDeltaV>5?900+Math.min(1200,personDeltaV*60):450};
}
export function createPedestrianMotionV20(impact,away,t=0){
 const len=Math.hypot(away?.x||0,away?.z||0)||1;
 return {vx:(away?.x||0)/len*limit(impact?.horizontalSpeed||0,0,6.4),
  vz:(away?.z||0)/len*limit(impact?.horizontalSpeed||0,0,6.4),
  vy:limit(impact?.loftSpeed||0,0,1.5),height:0,fall:0,stage:'air',time:t,
  downUntil:0,durationMs:limit(impact?.downDurationMs||500,400,2200),
  recoverMs:750+Math.min(500,(impact?.personDeltaV||0)*20),
  tilt:limit(impact?.stumbleAngle||.5,.12,1.32)};
}
export function stepPedestrianMotionV20(m,dt,t,{x=0,z=0,canMove=()=>true}={}){
 if(!m)return {x,z,height:0,fall:0,active:false};
 const h=limit(Number.isFinite(dt)?dt:0,0,.05);let nx=x,nz=z;
 if(m.stage==='air'){
  const nextX=x+m.vx*h,nextZ=z+m.vz*h;
  if(canMove(nextX,nextZ)){nx=nextX;nz=nextZ}else{m.vx*= -.10;m.vz*= -.10}
  m.height+=m.vy*h;m.vy-=9.81*h;
  m.vx*=Math.exp(-2.8*h);m.vz*=Math.exp(-2.8*h);
  m.fall=limit(m.fall+2.1*h,0,1);
  if(m.height<=0&&m.vy<0){
   m.height=0;m.vy=0;m.vx*=.25;m.vz*=.25;m.stage='down';
   m.downUntil=t+m.durationMs;m.fall=1;
  }
 }else if(m.stage==='down'){
  m.height=0;m.fall=1;
  if(t>=m.downUntil){m.stage='recover';m.recoverFrom=t}
 }else if(m.stage==='recover'){
  m.fall=limit(1-(t-m.recoverFrom)/m.recoverMs,0,1);
  if(m.fall===0)m.stage='done';
 }
 return {x:nx,z:nz,height:Math.max(0,m.height),fall:m.fall,
  active:m.stage!=='done',stage:m.stage};
}
