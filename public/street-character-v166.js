import * as T from './three.js';
import {updateCharacterPose} from './character-pose-v180.js';
import {fitCharacter} from './character-size-v175.js';
import {GLTFLoader} from './GLTFLoader.js';
import {stepBodyDynamics} from './character-body-v171.js';
import {finishCharacter} from './character-surface-v170.js';
export const CHARACTER_URL='./models/civilian-v169.glb';
export function characterWeights(speed){speed=Number.isFinite(speed)?speed:0;const walk=T.MathUtils.clamp(Math.abs(speed)/1.8,0,1),run=T.MathUtils.clamp((Math.abs(speed)-2.5)/1.8,0,1);return {idle:1-walk,walk:walk*(1-run),run:walk*run}}
export function createStreetCharacter({scene,onStatus=()=>{}}){
 const root=new T.Group();root.name='Street protagonist';scene.add(root);
 let model=null,mixer=null,actions=null,previousYaw=0,disposed=false;
 let head=null,neck=null,clock=0,headYaw=0;
 const body={pitch:0,roll:0,speed:0,yaw:0};
 const pose={air:0,landing:0,wasGrounded:true};let bones={};
 onStatus('جاري تحميل الشخصية…');
 const ready=new GLTFLoader().loadAsync(CHARACTER_URL).then(gltf=>{
  if(disposed)return false;
  model=gltf.scene;const fitted=fitCharacter(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.envMapIntensity=.55;if(material.roughness!==undefined)material.roughness=Math.max(.48,material.roughness)}}});
  finishCharacter(model);head=model.getObjectByName('head');neck=model.getObjectByName('neck_01');
  for(const name of ['spine_02','upperarm_l','upperarm_r','thigh_l','thigh_r','calf_l','calf_r'])bones[name]=model.getObjectByName(name);
  root.add(fitted);mixer=new T.AnimationMixer(model);actions={};
  for(const name of ['Idle','Walk','Run']){const clip=gltf.animations.find(c=>c.name===name);if(!clip)throw new Error('Missing animation '+name);actions[name.toLowerCase()]=mixer.clipAction(clip).setEffectiveWeight(name==='Idle'?1:0).play()}
  onStatus('الشخصية جاهزة • اسحب لتدوير الكاميرا');return true;
 }).catch(()=>{if(!disposed)onStatus('تعذر تحميل الشخصية • اضغط إعادة التحميل');return false});
 return {root,ready,update(dt,{speed=0,direction=0,lookYaw=direction,rotate=true,grounded=true,vertical=0}={}){
  const step=T.MathUtils.clamp(dt,0,.05);if(rotate&&Math.abs(speed)>.05){previousYaw+=Math.atan2(Math.sin(direction-previousYaw),Math.cos(direction-previousYaw))*(1-Math.exp(-12*step));root.rotation.y=previousYaw}
  if(!actions)return;actions.walk.setEffectiveTimeScale(T.MathUtils.clamp(Math.abs(speed)/2,.2,1.35));actions.run.setEffectiveTimeScale(T.MathUtils.clamp(Math.abs(speed)/4.3,.5,1.25));const weights=characterWeights(speed);for(const key of ['idle','walk','run']){const a=actions[key];a.setEffectiveWeight(T.MathUtils.lerp(a.getEffectiveWeight(),weights[key],1-Math.exp(-10*step)))}mixer.update(step);clock+=step;
  // Mixer writes a fresh local pose each frame, so these offsets never accumulate.
  const relative=Math.atan2(Math.sin(lookYaw-root.rotation.y),Math.cos(lookYaw-root.rotation.y));
  headYaw=T.MathUtils.damp(headYaw,T.MathUtils.clamp(relative,-.42,.42),5,step);
  if(head){head.rotateY(headYaw*.65);head.rotateX(Math.sin(clock*1.35)*.009)}
  if(neck)neck.rotateY(headYaw*.35);
  stepBodyDynamics(body,{speed,yaw:rotate?root.rotation.y:(scene.rotation?.y||0),grounded,dt:step});
  updateCharacterPose(pose,bones,{dt:step,speed,grounded,vertical,clock});
  model.rotation.x=body.pitch;model.rotation.z=body.roll;

 },dispose(){disposed=true;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model)}root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}}});scene.remove(root)}};
}
