// V112 Character Life: emotion, gaze, conversation, personality and cloth response.
// Operates on existing articulated residents, reusing their meshes and LOD.
// No additional animation loop, textures, GPU draw calls, network or save keys.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*clamp(dt,0,.10)));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function createCitizenBehaviorV112({mobile=false}={}){
 let animated=0,talking=0,greeting=0;
 function update(person,{dt=0,time=0,focus=null,driving=false,
    distanceSq=Infinity,visible=true,faceNear=false,walking=false,
    frightened=false,stumbling=false,raining=false,nearCar=false}={}){
  const u=person?.userData;
  if(!u||!visible||distanceSq>(mobile?29:44)**2)return;
  dt=clamp(dt,0,.06);time=Math.max(0,Number(time)||0);
  const locked=!!u.streetEventLock;
  const close=!driving&&!!focus&&distanceSq<64;
  const engaged=!frightened&&!stumbling&&!nearCar;
  // Exiting conversation never teleports a resident, interrupts a mission or moves them into traffic.
  const talkingNow=engaged&&locked&&close;
  const period=9300+(u.id%7)*1250;
  const cycle=(time+u.id*1321)%period;
  const idleMoment=engaged&&!walking&&!talkingNow&&cycle<2200&&distanceSq<(mobile?15:24)**2;
  const style=(u.id*7+u.id%4)%5;
  // A personal palette of quiet gestures; only the nearest residents animate fully.
  const gestureTarget=talkingNow?1:idleMoment?.58:0;
  u.expressionV112||={gesture:0,look:0,mouth:0,scarf:0,blink:0};
  const e=u.expressionV112;
  e.gesture=smooth(e.gesture,gestureTarget,6,dt);
  const lookActive=close&&engaged&&(talkingNow||!walking||u.waveUntil>time);
  const dx=focus?focus.x-person.position.x:0,dz=focus?focus.z-person.position.z:0;
  const yaw=lookActive?clamp(wrap(Math.atan2(dx,dz)-person.rotation.y),-.64,.64):0;
  e.look=smooth(e.look,yaw,lookActive?5:3,dt);
  u.head.rotation.y=e.look+Math.sin(time*.0007+u.id)*.035;
  // Existing blink LOD remains authoritative; micro eye motion only at face-range.
  if(faceNear&&u.eyes)for(let i=0;i<u.eyes.length;i++){
   const eye=u.eyes[i];
   eye.position.x=(i===0?-.064:.064)+e.look*.013;
  }
  const talkingEnergy=talkingNow?(.55+.45*Math.sin(time*.010+u.id)):(idleMoment?.10:0);
  e.mouth=smooth(e.mouth,talkingEnergy,12,dt);
  if(u.mouth?.scale){
   u.mouth.scale.y=.010+Math.max(0,e.mouth)*.014;
   u.mouth.scale.x=.069+(talkingNow?.008:0);
  }
  if(u.brows)for(let i=0;i<u.brows.length;i++){
   const brow=u.brows[i];if(!brow?.position)continue;
   brow.position.y=1.837+(talkingNow?.011:0)+(frightened?.018:0);
   brow.rotation.z=(i===0?.06:-.06)+(talkingNow?(i===0?-.055:.055):0);
  }
  if(!engaged){ // collision/stumble animations take priority over secondary gestures.
   if(u.scarfTail)u.scarfTail.rotation.z=smooth(u.scarfTail.rotation.z,0,6,dt);
   return;
  }
  // Restore the idle head axis before applying expressive movement. The impact
  // system retains full control if the citizen is stumbling.
  if(engaged)u.head.rotation.x=0;
  animated++;
  if(talkingNow)talking++;
  const gesture=e.gesture;
  if(talkingNow){
   // Dialogue has three understated poses (greet, explain, emphasize), blended
   // by smooth waves rather than jumping between keyframes.
   const beat=time*.0025+u.id*.79;
   const explain=.5+.5*Math.sin(beat);
   const emphasize=.5+.5*Math.sin(beat*.7+1.2);
   const greet=.5+.5*Math.sin(beat*.55-.4);
   const waveInProgress=(u.waveUntil||0)>time;
   u.arms[0].rotation.x-=gesture*(.10+.27*explain);
   u.elbows[0].rotation.x-=gesture*(.18+.25*explain);
   u.arms[0].rotation.z-=gesture*(.05+.12*greet);
   if(!waveInProgress){
    u.arms[1].rotation.x-=gesture*(.14+.20*emphasize);
    u.elbows[1].rotation.x-=gesture*(.20+.18*emphasize);
    u.arms[1].rotation.z+=gesture*.08*emphasize;
   }
   // Restrained posture: no instant ninety-degree torso turns in dialogue.
   u.head.rotation.x=.02+Math.sin(beat*1.7)*.028*gesture;
   u.body.rotation.y=Math.sin(beat*.7)*.028*gesture;
  }else if(idleMoment){
   // Distinct personalities: check watch, adjust scarf, stretch, ponder, wave.
   const pulse=Math.sin(Math.PI*clamp(cycle/2200,0,1));
   if(style===0){
    u.arms[0].rotation.x-=pulse*.42*gesture;
    u.elbows[0].rotation.x-=pulse*.45*gesture;
   }else if(style===1){
    u.arms[1].rotation.x-=pulse*.32*gesture;
    u.elbows[1].rotation.x-=pulse*.56*gesture;
    u.head.rotation.x=pulse*.08;
   }else if(style===2){
    u.arms[0].rotation.z-=pulse*.10*gesture;
    u.arms[1].rotation.z+=pulse*.10*gesture;
    u.body.rotation.x=-pulse*.045*gesture;
   }else if(style===3){
    u.head.rotation.z=Math.sin(time*.003+u.id)*.045*gesture;
   }else{
    u.arms[1].rotation.x-=pulse*.30*gesture;
    u.head.rotation.x=-pulse*.07*gesture;
   }
   greeting++;
  }
  // Rain makes residents shield their face when stationary; never during impact.
  if(raining&&!walking&&!talkingNow&&distanceSq<225){
   const rainStrength=smooth(e.scarf,1,4,dt);
   e.scarf=rainStrength;
   u.arms[0].rotation.x-=rainStrength*.35;
   u.elbows[0].rotation.x-=rainStrength*.24;
  }else e.scarf=smooth(e.scarf,0,4,dt);
  if(u.scarfTail){
   const flutter=(raining?.075:.035)*Math.sin(time*.004+u.id*1.4);
   u.scarfTail.rotation.z=smooth(u.scarfTail.rotation.z,flutter+(walking?-.08:0),4,dt);
   u.scarfTail.rotation.x=-.10+(walking?Math.abs(Math.sin(u.phase))*.12:0);
  }
 }
 function stats(){return {animated,talking,idleGestures:greeting,mobile};}
 function beginFrame(){animated=0;talking=0;greeting=0;}
 return {update,beginFrame,stats};
}
