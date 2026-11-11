// Egypt Street: lightweight bicycle dynamics + tyre grip + sprung chassis.
// SI units: metres, seconds, radians. No large dependencies.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const damp=(n,goal,k,dt)=>n+(goal-n)*(1-Math.exp(-k*dt));
const G=9.81,MASS=1250,IZ=2280,WHEELBASE=2.7,LF=1.21,LR=1.49;
const FRONT_LOAD=MASS*G*LR/WHEELBASE,REAR_LOAD=MASS*G*LF/WHEELBASE;
const MU=.96,CF=50000,CR=54000,MAX_FORWARD=41.0,MAX_REVERSE=10.0;
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
 const tuning=input.tuning||{};
 const engineScale=clamp(Number.isFinite(tuning.engineScale)?tuning.engineScale:1,.6,1.85);
 const brakeScale=clamp(Number.isFinite(tuning.brakeScale)?tuning.brakeScale:1,.65,1.65);
 const steerScale=clamp(Number.isFinite(tuning.steerScale)?tuning.steerScale:1,.7,1.45);
 const topSpeed=clamp(Number.isFinite(tuning.topSpeed)?tuning.topSpeed:MAX_FORWARD,24,56);
 const grip=clamp(Number.isFinite(input.grip)?input.grip:1,.45,1.25);
 let impact=0,collision=false,maxSlip=0,sideAccel=0;
 const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
 for(let i=0;i<steps;i++){
   const speed=Math.abs(p.speed);
   // Quick city steering while reducing lock for highway stability.
   p.steer=damp(p.steer,steering*steerScale*.63/(1+speed*.029),10.5,h);
   const engine=throttle>0?throttle*7350*Math.max(.43,1-.013*speed):
                throttle<0?throttle*3550:0;
   let fx=engine*engineScale;
   if(braking)fx=-Math.sign(p.speed)*Math.min(9800*grip*brakeScale,Math.abs(p.speed)*MASS/h);
   const drag=(Math.abs(p.speed)>.03?Math.sign(p.speed):0)*
     (190+.48*speed*speed+(Math.abs(throttle)<.06?560:0)+(1-grip)*800);
   fx-=drag;
   if(braking)fx=clamp(fx,-9800*grip*brakeScale,9800*grip*brakeScale);
   const usedGrip=clamp(Math.abs(fx)/(MU*MASS*G),0,.92);
   const fg=MU*FRONT_LOAD*grip*Math.sqrt(1-usedGrip*usedGrip*.65);
   const rg=MU*REAR_LOAD*grip*Math.sqrt(1-usedGrip*usedGrip*.85);
   const weight=clamp((speed-2)/3,0,1),direction=p.speed>=0?1:-1;
   const aFront=Math.atan2(p.lateralSpeed+LF*p.yawRate,Math.max(speed,1.8))-p.steer*direction;
   const aRear=Math.atan2(p.lateralSpeed-LR*p.yawRate,Math.max(speed,1.8));
   const fFront=clamp(-CF*aFront,-fg,fg),fRear=clamp(-CR*aRear,-rg,rg);
   maxSlip=Math.max(maxSlip,Math.abs(aFront),Math.abs(aRear));
   const longAcc=fx/MASS+p.lateralSpeed*p.yawRate;
   let u=p.speed+longAcc*h;
   if(!braking&&throttle>0&&p.speed>=topSpeed)u=Math.min(u,p.speed);
   if(!braking&&throttle<0&&p.speed<=-MAX_REVERSE)u=Math.max(u,p.speed);
   if(braking&&(p.speed===0||Math.sign(u)!==Math.sign(p.speed)))u=0;
   if(Math.abs(throttle)<.05&&Math.abs(u)<.03)u=0;
   u=clamp(u,-MAX_REVERSE,topSpeed);
   const latAcc=(fFront*Math.cos(p.steer)+fRear)/MASS-p.speed*p.yawRate;
   const yawAcc=(LF*fFront*Math.cos(p.steer)-LR*fRear)/IZ;
   const slowYaw=(u/WHEELBASE)*Math.tan(p.steer);
   p.yawRate+=(yawAcc*weight+(slowYaw-p.yawRate)*8*(1-weight)-p.yawRate*.25*weight)*h;
   const maxYaw=clamp(7.2/Math.max(5,speed),.19,1.04);
   p.yawRate=clamp(p.yawRate,-maxYaw,maxYaw);
   p.lateralSpeed+=latAcc*h*weight;
   p.lateralSpeed*=Math.exp(-h*(8*(1-weight)+.30*weight));
   p.lateralSpeed=clamp(p.lateralSpeed,-5,5);
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
     // Slide along safe axis at low impact instead of bouncing back like a rubber car.
     let slipped=false;
     if(impact<7){
       if(!intersects(nx,p.z,p.yaw)){p.x=nx;slipped=true;}
       else if(!intersects(p.x,nz,p.yaw)){p.z=nz;slipped=true;}
     }
     p.speed=slipped?u*.42:0;
     p.lateralSpeed*=slipped?.20:.04;p.yawRate*=.20;
     p.heaveVelocity+=clamp(impact*.025,0,.34);
     p.pitchVelocity+=clamp(impact*.018,0,.26)*Math.sign(u||1);
   }else{p.x=nx;p.z=nz;p.yaw=nyaw;p.speed=u}
   p.wheelSpin+=p.speed*h/.405;
   sideAccel=clamp(latAcc,-MU*G*grip,MU*G*grip);
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
