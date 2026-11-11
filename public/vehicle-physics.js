// Egypt Street: lightweight bicycle dynamics + tyre grip + sprung chassis.
// SI units: metres, seconds, radians. No large dependencies.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const damp=(n,goal,k,dt)=>n+(goal-n)*(1-Math.exp(-k*dt));
const G=9.81,MASS=1250,IZ=2280,WHEELBASE=2.7,LF=1.21,LR=1.49;
const FRONT_LOAD=MASS*G*LR/WHEELBASE,REAR_LOAD=MASS*G*LF/WHEELBASE;
const MU=.94,CF=48000,CR=52000;
export function createVehiclePhysics(x=0,z=0,yaw=0){
 return {x,z,yaw,speed:0,lateralSpeed:0,steer:0,yawRate:0,
 roll:0,rollVelocity:0,pitch:0,pitchVelocity:0,heave:0,heaveVelocity:0,
 wheelSpin:0,acceleration:0,lateralAcceleration:0,impact:0,collision:false,skid:0};
}
function spring(p,posKey,velKey,target,stiffness,dt){
 let v=p[velKey];v+=(stiffness*(target-p[posKey])-2*Math.sqrt(stiffness)*.85*v)*dt;
 p[velKey]=clamp(v,-5,5);p[posKey]+=p[velKey]*dt;
}
export function stepVehiclePhysics(p,input={},dt=1/60,intersects=()=>false){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
 const throttle=clamp(Number.isFinite(input.throttle)?input.throttle:0,-1,1);
 const steering=clamp(Number.isFinite(input.steer)?input.steer:0,-1,1);
 const braking=!!input.brake,oldSpeed=p.speed;
 let impact=0,collision=false,maxSlip=0,sideAccel=0;
 const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
 for(let i=0;i<steps;i++){
   const speed=Math.abs(p.speed);
   p.steer=damp(p.steer,steering*.58/(1+speed*.026),8,h);
   const engine=throttle>0?throttle*5600*Math.max(.28,1-.022*speed):
                throttle<0?throttle*3700:0;
   let fx=engine;
   if(braking)fx=-Math.sign(p.speed)*Math.min(14500,Math.abs(p.speed)*MASS/h);
   const drag=(Math.abs(p.speed)>.03?Math.sign(p.speed):0)*(165+.48*speed*speed);
   fx-=drag;
   if(braking)fx=clamp(fx,-14500,14500);
   const usedGrip=clamp(Math.abs(fx)/(MU*MASS*G),0,.92);
   const fg=MU*FRONT_LOAD*Math.sqrt(1-usedGrip*usedGrip*.65);
   const rg=MU*REAR_LOAD*Math.sqrt(1-usedGrip*usedGrip*.85);
   const weight=clamp((speed-2)/3,0,1),direction=p.speed>=0?1:-1;
   const aFront=Math.atan2(p.lateralSpeed+LF*p.yawRate,Math.max(speed,1.8))-p.steer*direction;
   const aRear=Math.atan2(p.lateralSpeed-LR*p.yawRate,Math.max(speed,1.8));
   const fFront=clamp(-CF*aFront,-fg,fg),fRear=clamp(-CR*aRear,-rg,rg);
   maxSlip=Math.max(maxSlip,Math.abs(aFront),Math.abs(aRear));
   const longAcc=fx/MASS+p.lateralSpeed*p.yawRate;
   let u=p.speed+longAcc*h;
   if(!braking&&throttle>0&&p.speed>=23.5)u=Math.min(u,p.speed);
   if(!braking&&throttle<0&&p.speed<=-8)u=Math.max(u,p.speed);
   if(braking&&(p.speed===0||Math.sign(u)!==Math.sign(p.speed)))u=0;
   if(Math.abs(throttle)<.05&&Math.abs(u)<.03)u=0;
   u=clamp(u,-8,23.5);
   const latAcc=(fFront*Math.cos(p.steer)+fRear)/MASS-p.speed*p.yawRate;
   const yawAcc=(LF*fFront*Math.cos(p.steer)-LR*fRear)/IZ;
   const slowYaw=(u/WHEELBASE)*Math.tan(p.steer);
   p.yawRate+=(yawAcc*weight+(slowYaw-p.yawRate)*8*(1-weight)-p.yawRate*.25*weight)*h;
   p.yawRate=clamp(p.yawRate,-1.25,1.25);
   p.lateralSpeed+=latAcc*h*weight;
   p.lateralSpeed*=Math.exp(-h*(8*(1-weight)+.30*weight));
   p.lateralSpeed=clamp(p.lateralSpeed,-7,7);
   if(speed<1&&Math.abs(throttle)<.06){
     p.yawRate*=Math.exp(-h*9);p.lateralSpeed*=Math.exp(-h*12);
   }
   const nyaw=p.yaw+p.yawRate*h;
   const nx=p.x+(Math.sin(nyaw)*u+Math.cos(nyaw)*p.lateralSpeed)*h;
   const nz=p.z+(Math.cos(nyaw)*u-Math.sin(nyaw)*p.lateralSpeed)*h;
   const n=Math.max(1,Math.ceil((Math.abs(u*h)+Math.abs(p.lateralSpeed*h))/.24));
   let hit=false;
   for(let j=1;j<=n;j++){
     const f=j/n;
     if(intersects(p.x+(nx-p.x)*f,p.z+(nz-p.z)*f,p.yaw+(nyaw-p.yaw)*f)){hit=true;break}
   }
   if(hit){
     collision=true;impact=Math.max(impact,Math.hypot(u,p.lateralSpeed));
     p.speed=impact<1.2?0:-Math.sign(u||1)*Math.min(.85,impact*.07);
     p.lateralSpeed*=.08;p.yawRate*=.24;
     p.heaveVelocity+=clamp(impact*.024,0,.35);
     p.pitchVelocity+=clamp(impact*.016,0,.26)*Math.sign(u||1);
   }else{p.x=nx;p.z=nz;p.yaw=nyaw;p.speed=u}
   p.wheelSpin+=p.speed*h/.405;
   sideAccel=clamp(latAcc,-MU*G,MU*G);
   const texture=clamp((Math.sin(p.z*.8)*Math.sin(p.x*1.1)+Math.sin(p.z*2.8+p.x*.6)*.23)*.010,-.013,.013);
   spring(p,'pitch','pitchVelocity',clamp(-longAcc*.008,-.10,.10),68,h);
   spring(p,'roll','rollVelocity',clamp(-sideAccel*.012,-.16,.16),55,h);
   spring(p,'heave','heaveVelocity',texture,90,h);
 }
 p.collision=collision;p.impact=impact;
 p.acceleration=(p.speed-oldSpeed)/Math.max(dt,1e-5);
 p.lateralAcceleration=sideAccel;
 p.skid=damp(p.skid,clamp((maxSlip-.13)*1.3,0,1),5,dt);
 return {collision,impact,acceleration:p.acceleration,lateralAcceleration:sideAccel,skid:p.skid};
}
