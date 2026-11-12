// V161: locomotion state blending via the real Three.js AnimationMixer.
// Keeps the authored hero, jump and vehicle-entry animations intact.
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
export function locomotionWeightsV161(speed=0){
 const movement=clamp(Math.abs(speed)/2.3,0,1);
 const sprint=clamp((Math.abs(speed)-3.7)/2.2,0,1);
 return {idle:1-movement,walk:movement*(1-sprint),run:movement*sprint};
}
export function createHeroMixerV161({T,hero,enabled=true}={}){
 const r=hero?.userData;
 if(!enabled||!r?.rig||!T?.AnimationMixer||!T?.AnimationClip||!T?.NumberKeyframeTrack)
  return {enabled:false,update(){},getStats:()=>({enabled:false})};
 const parts=[
  ['heroRigV161',r.rig],
  ['heroLeftLegV161',r.leftLeg],['heroRightLegV161',r.rightLeg],
  ['heroLeftArmV161',r.leftArm],['heroRightArmV161',r.rightArm],
  ['heroLeftKneeV161',r.leftKnee],['heroRightKneeV161',r.rightKnee]
 ];
 // Names are only applied to the player's existing lightweight articulated
 // rig; no additional meshes or skeleton clones are constructed.
 const previous=parts.map(([name,obj])=>({obj,name:obj?.name}));
 for(const [name,obj] of parts){if(obj)obj.name=name}
 const k=T.NumberKeyframeTrack;
 const key=(name,axis,values,duration)=>new k(
  name+'.'+axis,[0,duration*.25,duration*.5,duration*.75,duration],values);
 const breathing=new T.AnimationClip('v161_idle',2.0,[
  key('heroRigV161','position[y]',[0,.016,.025,.014,0],2.0),
  key('heroLeftArmV161','rotation[x]',[-.02,-.04,-.02,0,-.02],2.0),
  key('heroRightArmV161','rotation[x]',[-.02,0,-.02,-.04,-.02],2.0)
 ]);
 const walk=new T.AnimationClip('v161_walk',.86,[
  key('heroLeftLegV161','rotation[x]',[0,.48,0,-.48,0],.86),
  key('heroRightLegV161','rotation[x]',[0,-.48,0,.48,0],.86),
  key('heroLeftArmV161','rotation[x]',[-.04,-.31,-.04,.27,-.04],.86),
  key('heroRightArmV161','rotation[x]',[-.04,.27,-.04,-.31,-.04],.86),
  key('heroLeftKneeV161','rotation[x]',[-.10,-.56,-.10,-.18,-.10],.86),
  key('heroRightKneeV161','rotation[x]',[-.10,-.18,-.10,-.56,-.10],.86),
  key('heroRigV161','position[y]',[0,.055,.012,.055,0],.86),
  key('heroRigV161','rotation[x]',[.02,.06,.02,.06,.02],.86)
 ]);
 const run=new T.AnimationClip('v161_run',.62,[
  key('heroLeftLegV161','rotation[x]',[0,.72,0,-.72,0],.62),
  key('heroRightLegV161','rotation[x]',[0,-.72,0,.72,0],.62),
  key('heroLeftArmV161','rotation[x]',[-.04,-.48,-.04,.39,-.04],.62),
  key('heroRightArmV161','rotation[x]',[-.04,.39,-.04,-.48,-.04],.62),
  key('heroLeftKneeV161','rotation[x]',[-.18,-.84,-.18,-.25,-.18],.62),
  key('heroRightKneeV161','rotation[x]',[-.18,-.25,-.18,-.84,-.18],.62),
  key('heroRigV161','position[y]',[.018,.095,.018,.095,.018],.62),
  key('heroRigV161','rotation[x]',[.11,.16,.11,.16,.11],.62)
 ]);
 const mixer=new T.AnimationMixer(hero);
 const actions={idle:mixer.clipAction(breathing),walk:mixer.clipAction(walk),run:mixer.clipAction(run)};
 const weights={idle:1,walk:0,run:0};
 for(const [type,action] of Object.entries(actions)){
  action.enabled=true;action.setEffectiveWeight(weights[type]);action.play();
 }
 function update(dt,{speed=0,grounded=true,driving=false,boarding=false,paused=false}={}){
  if(paused||driving||boarding||!grounded)return;
  const frame=clamp(dt,0,.05);
  const targets=locomotionWeightsV161(speed);
  const response=1-Math.exp(-10*frame);
  for(const type of ['idle','walk','run']){
   weights[type]+=(targets[type]-weights[type])*response;
   actions[type].setEffectiveWeight(weights[type]);
  }
  const pace=clamp(Math.abs(speed),.6,7.5);
  actions.walk.timeScale=clamp(pace/3.4,.55,1.45);
  actions.run.timeScale=clamp(pace/5.5,.72,1.48);
  mixer.update(frame);
 }
 return {enabled:true,update,
  getStats:()=>({enabled:true,...weights,mixerTime:mixer.time}),
  dispose:()=>{mixer.stopAllAction();mixer.uncacheRoot(hero);
   for(const part of previous)if(part.obj)part.obj.name=part.name||''}};
}
