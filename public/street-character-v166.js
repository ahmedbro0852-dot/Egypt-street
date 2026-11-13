import * as T from './three.js';
import {GLTFLoader} from './GLTFLoader.js';
export const CHARACTER_URL='./models/civilian-v169.glb';
export function characterWeights(speed){speed=Number.isFinite(speed)?speed:0;const walk=T.MathUtils.clamp(Math.abs(speed)/1.8,0,1),run=T.MathUtils.clamp((Math.abs(speed)-2.5)/1.8,0,1);return {idle:1-walk,walk:walk*(1-run),run:walk*run}}
export function createStreetCharacter({scene,onStatus=()=>{}}){
 const root=new T.Group();root.name='Street protagonist';scene.add(root);
 let model=null,mixer=null,actions=null,previousYaw=0,disposed=false;
 onStatus('جاري تحميل الشخصية…');
 const ready=new GLTFLoader().loadAsync(CHARACTER_URL).then(gltf=>{
  if(disposed)return false;
  model=gltf.scene;const bounds=new T.Box3().setFromObject(model),height=bounds.max.y-bounds.min.y;
  if(!Number.isFinite(height)||height<.01)throw new Error('Invalid character dimensions');
  model.scale.setScalar(1.78/height);bounds.setFromObject(model);model.position.y-=bounds.min.y;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.envMapIntensity=.55;if(material.roughness!==undefined)material.roughness=Math.max(.48,material.roughness)}}});
  root.add(model);mixer=new T.AnimationMixer(model);actions={};
  for(const name of ['Idle','Walk','Run']){const clip=gltf.animations.find(c=>c.name===name);if(!clip)throw new Error('Missing animation '+name);actions[name.toLowerCase()]=mixer.clipAction(clip).setEffectiveWeight(name==='Idle'?1:0).play()}
  onStatus('الشخصية جاهزة • اسحب لتدوير الكاميرا');return true;
 }).catch(()=>{if(!disposed)onStatus('تعذر تحميل الشخصية • اضغط إعادة التحميل');return false});
 return {root,ready,update(dt,{speed=0,direction=0}={}){
  const step=T.MathUtils.clamp(dt,0,.05);if(Math.abs(speed)>.05){previousYaw+=Math.atan2(Math.sin(direction-previousYaw),Math.cos(direction-previousYaw))*(1-Math.exp(-12*step));root.rotation.y=previousYaw}
  if(!actions)return;actions.walk.setEffectiveTimeScale(T.MathUtils.clamp(Math.abs(speed)/2,.2,1.35));actions.run.setEffectiveTimeScale(T.MathUtils.clamp(Math.abs(speed)/4.3,.5,1.25));const weights=characterWeights(speed);for(const key of ['idle','walk','run']){const a=actions[key];a.setEffectiveWeight(T.MathUtils.lerp(a.getEffectiveWeight(),weights[key],1-Math.exp(-10*step)))}mixer.update(step);
 },dispose(){disposed=true;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model)}root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}}});scene.remove(root)}};
}
