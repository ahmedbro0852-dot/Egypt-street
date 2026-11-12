// V112 Hero Presence: alive eyes and facial micro-expression on the existing player rig.
// All work is transform-only. No textures, geometry, extra rendering passes or timers.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const damp=(now,goal,k,dt)=>now+(goal-now)*(1-Math.exp(-k*clamp(dt,0,.06)));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export function createHeroPresenceV112({hero,people=[]}={}){
 const u=hero?.userData;
 if(!u?.rig||!u.head)return {enabled:false,update(){},stats:()=>({enabled:false})};
 const eyes=u.heroPupils||[],brows=u.heroBrows||[],mouth=u.heroMouth;
 const base=eyes.map(o=>o.position?.x||0);
 let clock=0,scan=0,blink=0,blinkNext=2.1,look=0,smile=0,nearby=null,lastLook=0;
 function update({dt=0,active=true,paused=false,driving=false,speed=0}={}){
  if(!active||paused)return;
  dt=clamp(dt,0,.06);clock+=dt;scan+=dt;
  // Nearby social attention is sampled only 3x/second; no extra animation loop.
  if(scan>=.34){
   scan=0;nearby=null;
   if(!driving){
    let bestDist=5.5*5.5;
    for(const citizen of people){
     if(citizen?.visible===false||!citizen?.position)continue;
     const dx=citizen.position.x-hero.position.x,dz=citizen.position.z-hero.position.z;
     const dist=dx*dx+dz*dz;
     if(dist<bestDist){bestDist=dist;nearby=citizen;}
    }
   }
  }
  const walking=Math.abs(Number(speed)||0)>.6&&!driving;
  let target=0;
  if(nearby&&!driving&&!walking){
   const dx=nearby.position.x-hero.position.x,dz=nearby.position.z-hero.position.z;
   target=clamp(angle(Math.atan2(dx,dz)-hero.rotation.y),-.40,.40);
  }else if(!driving&&!walking)target=Math.sin(clock*.49)*.11;
  look=damp(look,target,nearby?4.1:2.5,dt);
  // Existing V31 animation owns base head movement; only apply small fresh offsets.
  // V31 blends the previous frame's rotation at rate 5; subtract its retained\n  // facial offset before applying this frame's gaze to avoid accumulated yaw.\n  u.head.rotation.y-=lastLook*Math.exp(-5*dt);\n  u.head.rotation.y=clamp(u.head.rotation.y+look,-.58,.58);\n  lastLook=look;
  if(!driving){
   u.head.rotation.x+=Math.sin(clock*1.47)*.008*(walking?.5:1);
   u.head.rotation.z+=Math.sin(clock*.87)*.008;
  }
  blinkNext-=dt;
  if(blinkNext<=0){blink=.115;blinkNext=1.9+(Math.sin(clock*2.9)+1)*1.05;}
  blink=Math.max(0,blink-dt);
  const blinkClose=blink>0;
  for(let i=0;i<eyes.length;i++){
   const eye=eyes[i];
   eye.scale.y=blinkClose?.0018:.013;
   eye.position.x=base[i]+look*.008;
  }
  const nearTalk=nearby&&!walking&&!driving;
  smile=damp(smile,nearTalk?.9:!driving?.24:0,3,dt);
  if(mouth?.scale){mouth.scale.x=.045+smile*.008;mouth.scale.y=.006+smile*.002;}
  for(let i=0;i<brows.length;i++){
   const brow=brows[i];
   brow.position.y=.068+smile*.006;
   brow.rotation.z=(i===0?.025:-.025)*smile;
  }
 }
 function dispose(){
  for(let i=0;i<eyes.length;i++){eyes[i].scale.y=.013;eyes[i].position.x=base[i];}
  if(mouth?.scale){mouth.scale.x=.045;mouth.scale.y=.006;}
 }
 return {enabled:true,update,dispose,stats:()=>({enabled:true,trackedEyes:eyes.length,trackedBrows:brows.length})};
}
