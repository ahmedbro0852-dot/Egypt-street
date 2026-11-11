const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export function animateHeroV31(hero,phase,amount,{dt=1/60,speed=0,grounded=true,vertical=0}={}){
 const r=hero.userData;if(!r?.rig)return;
 const a=r.motionV31||(r.motionV31={blend:0,run:0,clock:0,lastYaw:hero.rotation.y,turn:0,land:0,grounded:true});
 dt=clamp(dt,0,.05);a.clock+=dt;
 a.blend=mix(a.blend,grounded?clamp(amount,0,1):0,grounded?9:5,dt);
 a.run=mix(a.run,clamp((Math.abs(speed)-4)/3.5,0,1),6,dt);
 const dy=Math.atan2(Math.sin(hero.rotation.y-a.lastYaw),Math.cos(hero.rotation.y-a.lastYaw));a.lastYaw=hero.rotation.y;
 a.turn=mix(a.turn,clamp(dy/Math.max(dt,.001),-3,3),6,dt);
 if(grounded&&!a.grounded)a.land=.075;a.grounded=grounded;a.land=mix(a.land,0,11,dt);
 const b=a.blend,run=a.run,swing=Math.sin(phase),idle=Math.sin(a.clock*2.1),cycle=phase%(Math.PI*2);
 const leg=.47+run*.22,arm=.32+run*.28;
 r.leftLeg.rotation.x=swing*leg*b;r.rightLeg.rotation.x=-swing*leg*b;
 if(r.leftKnee){r.leftKnee.rotation.x=-Math.max(0,-swing)*(.52+run*.40)*b;r.rightKnee.rotation.x=-Math.max(0,swing)*(.52+run*.40)*b;}
 r.leftArm.rotation.x=-swing*arm*b-.04;r.rightArm.rotation.x=swing*arm*b-.04;
 if(r.leftElbow){r.leftElbow.rotation.x=-(.10+run*.60+Math.max(0,swing)*.16*b);r.rightElbow.rotation.x=-(.10+run*.60+Math.max(0,-swing)*.16*b);}
 r.leftArm.rotation.z=-.035-idle*.012*(1-b);r.rightArm.rotation.z=.035+idle*.012*(1-b);
 r.rig.position.y=Math.cos(phase*2)*(.016+run*.020)*b+idle*.004*(1-b)-a.land;
 r.rig.rotation.x=.035*b+run*.09*b;
 r.rig.rotation.z=swing*.018*b-clamp(a.turn*.018,-.06,.06)*b;
 r.rig.rotation.y=swing*.045*b;
 r.rig.scale.y=1+idle*.0025*(1-b);
 if(r.head){r.head.rotation.x=-r.rig.rotation.x*.55;r.head.rotation.y=mix(r.head.rotation.y,clamp(a.turn*.07,-.18,.18)+Math.sin(a.clock*.65)*.025*(1-b),5,dt);r.head.rotation.z=-r.rig.rotation.z*.6;}
 // Distinct takeoff/air pose rather than freezing the walking cycle.
 if(!grounded){const tuck=clamp(.25+Math.abs(vertical)*.025,.25,.65);r.leftLeg.rotation.x=-tuck*.45;r.rightLeg.rotation.x=tuck*.25;if(r.leftKnee){r.leftKnee.rotation.x=-tuck;r.rightKnee.rotation.x=-tuck*.7}r.leftArm.rotation.x=-.5;r.rightArm.rotation.x=-.35;r.rig.rotation.x=.06;}
}
export function createVisualPolishV31({T,scene,renderer,player}){
 if(!renderer.isWebGLRenderer)return {update(){},enabled:false};
 // One shared radial contact texture; no per-frame canvas work.
 const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),g=q.createRadialGradient(32,32,5,32,32,31);g.addColorStop(0,'rgba(0,0,0,.40)');g.addColorStop(.5,'rgba(0,0,0,.20)');g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;q.fillRect(0,0,64,64);
 const shadow=new T.Mesh(new T.PlaneGeometry(.95,1.25),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.rotation.x=-Math.PI/2;shadow.userData.skipFallback=true;scene.add(shadow);
 // Single player light, avoiding a separate shadow map per NPC car.
 const light=new T.SpotLight('#fff0d5',0,32,.48,.65,1.5);light.castShadow=false;scene.add(light,light.target);
 let lastVehicle=null;
 function update({driving,vehicle,night,grounded,dt}){
  shadow.visible=player.visible&&!driving;shadow.position.set(player.position.x,.125,player.position.z);shadow.material.opacity=grounded?1:.45;const scale=1+Math.max(0,player.position.y)*.2;shadow.scale.set(scale,scale,1);
  light.visible=driving&&night;light.intensity=night?22:0;if(driving&&vehicle){const angle=vehicle.rotation.y,x=vehicle.position.x,z=vehicle.position.z;light.position.set(x+Math.sin(angle)*1.8,vehicle.position.y+.85,z+Math.cos(angle)*1.8);light.target.position.set(x+Math.sin(angle)*20,.15,z+Math.cos(angle)*20)}
 }
 return {enabled:true,update};
}
