// Egypt Street: lightweight bicycle dynamics + tyre grip + sprung chassis.
// SI units: metres, seconds, radians. No large dependencies.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const damp=(n,goal,k,dt)=>n+(goal-n)*(1-Math.exp(-k*dt));
const G=9.81,BASE_MASS=1250,BASE_IZ=2280,BASE_WHEELBASE=2.7;
const MU=.96,MAX_FORWARD=41.0,MAX_REVERSE=10.0;
export function createVehiclePhysics(x=0,z=0,yaw=0){
 return {x,z,yaw,speed:0,lateralSpeed:0,steer:0,yawRate:0,
 roll:0,rollVelocity:0,pitch:0,pitchVelocity:0,heave:0,heaveVelocity:0,
 wheelSpin:0,acceleration:0,lateralAcceleration:0,impact:0,collision:false,skid:0,absActive:0,driftAngle:0,drifting:false};
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
 const steerScale=clamp(Number.isFinite(tuning.steerScale)?tuning.steerScale:1,.7,1.75);
 const topSpeed=clamp(Number.isFinite(tuning.topSpeed)?tuning.topSpeed:MAX_FORWARD,24,56);
 const grip=clamp(Number.isFinite(input.grip)?input.grip:1,.45,1.25);
 // V19: real differences between a motorcycle, family sedan and sports coupe.
 const mass=clamp(Number.isFinite(tuning.mass)?tuning.mass:BASE_MASS,160,2600);
 const wheelbase=clamp(Number.isFinite(tuning.wheelbase)?tuning.wheelbase:BASE_WHEELBASE,1.25,3.7);
 const frontShare=clamp(Number.isFinite(tuning.frontShare)?tuning.frontShare:.55,.4,.64);
 const lf=wheelbase*(1-frontShare),lr=wheelbase*frontShare;
 const iz=BASE_IZ*(mass/BASE_MASS)*(wheelbase/BASE_WHEELBASE)**2*
    clamp(Number.isFinite(tuning.inertiaScale)?tuning.inertiaScale:1,.4,1.7);
 // Longitudinal load transfer: braking loads the front axle, acceleration the rear.
 const cgHeight=clamp(Number.isFinite(tuning.cgHeight)?tuning.cgHeight:.52,.3,.85);
 const transferred=clamp((p.acceleration||0)*cgHeight/(G*wheelbase),-.15,.15);
 const loadedFront=clamp(frontShare-transferred,.27,.77);
 const frontLoad=mass*G*loadedFront,rearLoad=mass*G*(1-loadedFront);
 const cf=50000*(mass/BASE_MASS)*clamp(tuning.tyreStiffness||1,.65,1.5);
 const cr=54000*(mass/BASE_MASS)*clamp(tuning.tyreStiffness||1,.65,1.5);
 const engineForce=clamp(Number.isFinite(tuning.engineForce)?tuning.engineForce:7350,900,17000);
 const brakeForce=clamp(Number.isFinite(tuning.brakeForce)?tuning.brakeForce:9800,1400,19000);
 const dragScale=clamp(Number.isFinite(tuning.dragScale)?tuning.dragScale:1,.3,1.8);
 const pitchSpring=clamp(Number.isFinite(tuning.spring)?tuning.spring:68,35,125);
 const rollSpring=clamp(Number.isFinite(tuning.rollSpring)?tuning.rollSpring:55,30,130);
 const suspensionTravel=clamp(Number.isFinite(tuning.suspensionTravel)?tuning.suspensionTravel:.115,.05,.23);
 let impact=0,collision=false,contact=null,maxSlip=0,sideAccel=0;
 const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
 for(let i=0;i<steps;i++){
   const speed=Math.abs(p.speed);
   const driftBrake=!!input.driftBrake&&speed>5&&Math.abs(steering)>.12&&!braking;
   // V33: wider wheel lock and much faster response, while the lock tapers
   // with speed so a quick high-speed input still feels controlled.
   p.steer=damp(p.steer,steering*steerScale*.70/(1+speed*.022),17,h);
   const engine=throttle>0?throttle*engineForce*Math.max(.43,1-.013*speed):
                throttle<0?throttle*engineForce*.48:0;
   const changingDirection=throttle*p.speed<-.18;
   let fx=changingDirection?-Math.sign(p.speed)*brakeForce*.65:engine*engineScale;
   // Engine torque cannot exceed the driven tyres' available grip.
   if(!braking)fx=clamp(fx,-MU*rearLoad*grip,MU*rearLoad*grip);
   // V21 ABS: brake hydraulic demand is capped by available tyre-road friction.
   // On wet roads ABS regulates pressure instead of fully locking the wheels.
   const brakeDemand=brakeForce*brakeScale;
   const tyreBrakeCapacity=MU*mass*G*grip*.94;
   const absPulsing=braking&&!!input.absEnabled&&speed>1.35&&brakeDemand>tyreBrakeCapacity;
   const effectiveBrake=Math.min(brakeDemand,tyreBrakeCapacity)*(braking&&!input.absEnabled&&brakeDemand>tyreBrakeCapacity?.82:1);
   p.absActive=absPulsing?clamp(1-tyreBrakeCapacity/Math.max(1,brakeDemand),0,1):0;
   if(braking)fx=-Math.sign(p.speed)*Math.min(effectiveBrake,Math.abs(p.speed)*mass/h);
   const drag=(Math.abs(p.speed)>.03?Math.sign(p.speed):0)*
     (190+.48*speed*speed+(Math.abs(throttle)<.06?560:0)+(1-grip)*800)*dragScale;
   fx-=drag;
   // V34: rear handbrake slows the car but never replaces the normal brake.
   if(driftBrake)fx-=Math.sign(p.speed)*Math.min(brakeForce*.21,mass*G*grip*.26);
   if(braking)fx=clamp(fx,-effectiveBrake,effectiveBrake);
   const usedGrip=clamp(Math.abs(fx)/(MU*mass*G*grip),0,.995);
   const fg=MU*frontLoad*grip*Math.sqrt(1-usedGrip*usedGrip*.65);
   const rg=MU*rearLoad*grip*Math.sqrt(1-usedGrip*usedGrip*.85)*(driftBrake?.41:1);
   const weight=clamp((speed-2)/3,0,1),direction=p.speed>=0?1:-1;
   const aFront=Math.atan2(p.lateralSpeed+lf*p.yawRate,Math.max(speed,1.8))-p.steer*direction;
   const aRear=Math.atan2(p.lateralSpeed-lr*p.yawRate,Math.max(speed,1.8));
   const fFront=clamp(-cf*aFront,-fg,fg),fRear=clamp(-cr*aRear*(driftBrake?.66:1),-rg,rg);
   maxSlip=Math.max(maxSlip,Math.abs(aFront),Math.abs(aRear));
   const longAcc=fx/mass+p.lateralSpeed*p.yawRate;
   let u=p.speed+longAcc*h;
   if(!braking&&throttle>0&&p.speed>=topSpeed)u=Math.min(u,p.speed);
   if(!braking&&throttle<0&&p.speed<=-MAX_REVERSE)u=Math.max(u,p.speed);
   if(braking&&(p.speed===0||Math.sign(u)!==Math.sign(p.speed)))u=0;
   if((Math.abs(throttle)<.05||changingDirection)&&Math.sign(u)!==Math.sign(p.speed))u=0;
   if(Math.abs(throttle)<.05&&Math.abs(u)<.03)u=0;
   u=clamp(u,-MAX_REVERSE,topSpeed);
   const latAcc=(fFront*Math.cos(p.steer)+fRear)/mass-p.speed*p.yawRate;
   const yawAcc=(lf*fFront*Math.cos(p.steer)-lr*fRear)/iz;
   const slowYaw=(u/wheelbase)*Math.tan(p.steer);
   p.yawRate+=(yawAcc*weight+(slowYaw-p.yawRate)*8*(1-weight)-p.yawRate*.25*weight)*h;
   // V33: add a traction-bounded yaw response to the dynamic bicycle model.
   // This makes fast turns actually rotate the car, not just slide its tyres.
   const maxYaw=clamp(9.6/Math.max(5,speed),.22,1.28)*clamp(grip,.55,1.10);
   const turnAssist=clamp(Number.isFinite(tuning.turnAssist)?tuning.turnAssist:3.8,0,7.5);
   const targetYaw=clamp((u/wheelbase)*Math.tan(p.steer)*(driftBrake?1.28:1),-maxYaw,maxYaw);
   p.yawRate=damp(p.yawRate,targetYaw,turnAssist*clamp(grip,.6,1.12),h);
   p.yawRate=clamp(p.yawRate,-maxYaw,maxYaw);
   p.lateralSpeed+=latAcc*h*weight;
   p.lateralSpeed*=Math.exp(-h*(8*(1-weight)+.30*weight));
   p.lateralSpeed=clamp(p.lateralSpeed,driftBrake?-6.4:-5,driftBrake?6.4:5);
   p.drifting=driftBrake;
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
     const candidate=intersects(p.x+(nx-p.x)*f,p.z+(nz-p.z)*f,p.yaw+(nyaw-p.yaw)*f);
     if(candidate){
       hit=true;
       // Static buildings still return boolean; moving contacts carry a body/normal.
       if(candidate!==true&&typeof candidate==='object'&&!contact)contact=candidate;
       break;
     }
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
   sideAccel=clamp((fFront*Math.cos(p.steer)+fRear)/mass,-MU*G*grip,MU*G*grip);
   const texture=clamp((Math.sin(p.z*.8)*Math.sin(p.x*1.1)+Math.sin(p.z*2.8+p.x*.6)*.23)*.010,-.013,.013);
   spring(p,'pitch','pitchVelocity',clamp(-longAcc*.008*suspensionTravel/.115,-.14,.14),pitchSpring,h);
   spring(p,'roll','rollVelocity',clamp(-sideAccel*.012*suspensionTravel/.115,-.20,.20),rollSpring,h);
   spring(p,'heave','heaveVelocity',texture*suspensionTravel/.115,90*(pitchSpring/68),h);
 }
 p.collision=collision;p.impact=impact;
 p.acceleration=(p.speed-oldSpeed)/Math.max(dt,1e-5);
 p.lateralAcceleration=sideAccel;
 p.skid=damp(p.skid,Math.max(p.drifting?.54:0,clamp((maxSlip-.13)*1.3,0,1)),5,dt);
 p.driftAngle=Math.atan2(p.lateralSpeed,Math.max(1.8,Math.abs(p.speed)));
 return {collision,impact,contact,acceleration:p.acceleration,lateralAcceleration:sideAccel,skid:p.skid,absActive:p.absActive};
}
