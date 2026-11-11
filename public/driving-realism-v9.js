// Egypt Streets V9 — automatic transmission, live RPM, traction assist and turn signals.
// A gameplay drivetrain model: no extra textures, servers, tracking or music.
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function createDrivingRealismV9({notify=()=>{}}={}){
 let clock=0,rpm=0,gear=1,shiftTime=0,engineOn=false,turn='off',hazards=false;
 let blinking=false,turnAngle=0,lastYaw=null;
 const ratios=[390,255,185,137,103,79],thresholds=[8,15,23,31,40];
 function enter(fuel=1){engineOn=fuel>.01;rpm=engineOn?850:0;gear=1;shiftTime=0;lastYaw=null;turnAngle=0;}
 function exit(){engineOn=false;rpm=0;shiftTime=0;turn='off';hazards=false;blinking=false;lastYaw=null;}
 function toggleEngine(fuel=0,speed=0){
  if(engineOn){
   if(Math.abs(speed)>1){notify('وقف العربية قبل ما تطفي الموتور.');return false}
   engineOn=false;rpm=0;notify('🔑 الموتور اتطفى.');
   return true;
  }
  if(fuel<=.01){notify('⛽ مفيش بنزين كفاية لتشغيل الموتور.');return false}
  engineOn=true;rpm=850;shiftTime=.3;
  notify('🔑 الموتور اشتغل.');
  return true;
 }
 function indicator(direction){
  if(direction!=='left'&&direction!=='right')return false;
  hazards=false;
  turn=turn===direction?'off':direction;
  turnAngle=0;lastYaw=null;
  return turn;
 }
 function hazard(){
  hazards=!hazards;
  if(hazards){turn='off';turnAngle=0}
  return hazards;
 }
 function restore(data){
  if(!data||typeof data!=='object')return;
  turn=['left','right'].includes(data.turn)?data.turn:'off';
  hazards=!!data.hazards;
  if(hazards)turn='off';
  turnAngle=0;lastYaw=null;
 }
 function update(dt,{driving=false,speed=0,throttle=0,brake=false,steer=0,
   yaw=0,fuel=0,parking=false,skid=0,vehicleId='taxi'}={}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.08);
  clock+=dt;blinking=(clock%(.72))<.36;
  if(!driving){return {engineOn:false,rpm:0,gear:'N',throttleScale:0,flash:false};}
  if(engineOn&&fuel<=.001){engineOn=false;rpm=0;notify('⛽ البنزين خلص، الموتور طفى.');}
  const backward=speed<-.45;
  const stopped=Math.abs(speed)<.3;
  if(!backward&&!parking&&engineOn){
   const desired=thresholds.filter(limit=>speed>=limit).length+1;
   // Sequential auto box: no skipping gears and a brief torque interruption when shifting.
   if(shiftTime<=0&&desired!==gear){
    gear+=Math.sign(desired-gear);
    shiftTime=.21;
   }
  }
  shiftTime=Math.max(0,shiftTime-dt);
  const bike=vehicleId==='motorbike',sport=vehicleId==='sport';
  const multiplier=bike?1.48:sport?1.13:1;
  const target=engineOn?(backward?1000+Math.abs(speed)*200:
    Math.max(850,820+Math.max(0,speed)*ratios[gear-1]*multiplier+
      (stopped&&Math.abs(throttle)>.2?throttle*330:0))):0;
  const response=1-Math.exp(-dt*(shiftTime>0?14:7.5));
  rpm=clamp(rpm+(target-rpm)*response,engineOn?720:0,bike?9500:sport?7600:6500);
  // Traction control gently eases power during tyre slip, notably in rain.
  const tractionCut=clamp(1-Math.max(0,skid-.22)*.55,.54,1);
  const throttleScale=engineOn&&!parking?(shiftTime>0?.47:1)*tractionCut:0;
  if(turn!=='off'){
   if(lastYaw!==null){
    const delta=wrap(yaw-lastYaw),sign=turn==='left'?1:-1;
    if(delta*sign>0)turnAngle+=Math.min(.18,delta*sign);
   }
   lastYaw=yaw;
   if(turnAngle>.53&&Math.abs(steer)<.14&&Math.abs(speed)>2.5){
    turn='off';turnAngle=0;
   }
  }
  return {engineOn,rpm:Math.round(rpm),gear:parking?'P':backward?'R':engineOn?'D'+gear:'N',
    gearNumber:gear,throttleScale,flash:blinking,turn,hazards,
    left:blinking&&(hazards||turn==='left'),
    right:blinking&&(hazards||turn==='right'),
    shifting:shiftTime>0};
 }
 return {enter,exit,restore,toggleEngine,indicator,hazard,update,
  getState:()=>({engineOn,rpm,gear,turn,hazards,blinking,shifting:shiftTime>0})};
}
