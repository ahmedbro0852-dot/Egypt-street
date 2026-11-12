// Egypt Streets V112 — secondary animation for the existing articulated player.
// No new skeleton, textures, draw calls, save keys or physics changes.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createCharacterDynamicsV112({hero}={}){
 const rig=hero?.userData?.rig;
 if(!rig)return {enabled:false,update(){},dispose(){},getStatus:()=>({enabled:false})};
 const data=hero.userData;
 const scarf=rig.getObjectByName?.('v112ScarfDrape')||null;
 const state={clock:0,motion:0,turn:0,cloth:0,land:0,wasGrounded:true};
 const lerp=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));
 function update({dt=0,phase=0,speed=0,amount=0,grounded=true,vertical=0,driving=false,rain=false}={}){
  dt=clamp(Number(dt)||0,0,.06);
  state.clock+=dt;
  const moving=!driving&&grounded?clamp(Number(amount)||0,0,1):0;
  state.motion=lerp(state.motion,moving,grounded?9:5,dt);
  const energy=state.motion;
  const run=clamp((Math.abs(Number(speed)||0)-3.2)/3.5,0,1);
  const bend=clamp(data.motionV31?.turn||0,-2.5,2.5);
  state.turn=lerp(state.turn,driving?0:bend,7,dt);
  if(grounded&&!state.wasGrounded)state.land=.13+Math.min(.09,Math.abs(Number(vertical)||0)*.008);
  state.wasGrounded=grounded;
  state.land=lerp(state.land,0,13,dt);
  const stride=Math.sin(phase),second=Math.sin(phase*2),breath=Math.sin(state.clock*2.25);
  // Each value is additive to V31's fresh pose, never accumulated from prior frames.
  rig.rotation.y+=(-stride*.033+second*.010)*energy;
  rig.rotation.z+=clamp(-state.turn*.008,-.035,.035)*energy+breath*.003*(1-energy);
  rig.rotation.x+=run*.022*energy;
  rig.position.y+=Math.max(0,Math.cos(phase*2))*.012*energy-state.land*.36;
  if(data.leftArm&&data.rightArm){
   data.leftArm.rotation.z-=Math.abs(stride)*.028*energy;
   data.rightArm.rotation.z+=Math.abs(stride)*.028*energy;
  }
  if(data.leftKnee&&data.rightKnee){
   data.leftKnee.rotation.z=.025*stride*energy;
   data.rightKnee.rotation.z=-.025*stride*energy;
  }
  if(data.head){
   data.head.rotation.z+=clamp(-state.turn*.014,-.035,.035)*energy;
   data.head.rotation.x+=Math.min(.025,Math.abs(second)*.018*energy);
  }
  // Two simple cloth axes, resting when idle/inside the car.
  const clothTarget=clamp((run*.5+energy*.5)*(rain?1.18:1),0,1);
  state.cloth=lerp(state.cloth,clothTarget,5,dt);
  if(scarf){
   scarf.rotation.z=-.25+Math.sin(phase*.5)*.14*state.cloth;
   scarf.rotation.x=-.03-Math.abs(second)*.12*state.cloth;
   scarf.rotation.y=.09*Math.sin(phase*.7+1)*state.cloth;
  }
 }
 function dispose(){
  if(scarf){scarf.rotation.z=-.25;scarf.rotation.x=0;scarf.rotation.y=0}
  if(data.leftKnee)data.leftKnee.rotation.z=0;
  if(data.rightKnee)data.rightKnee.rotation.z=0;
 }
 return {enabled:true,update,dispose,getStatus:()=>({
  enabled:true,cloth:!!scarf,procedural:true
 })};
}
