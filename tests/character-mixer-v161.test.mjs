import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {locomotionWeightsV161,createHeroMixerV161} from '../public/character-mixer-v161.js';

function hero(){
 const root=new T.Group(),rig=new T.Group();
 root.add(rig);root.userData.rig=rig;
 for(const key of ['leftLeg','rightLeg','leftArm','rightArm','leftKnee','rightKnee']){
  const joint=new T.Group();rig.add(joint);root.userData[key]=joint;
 }
 return root;
}
test('locomotion blend is bounded and sums to one',()=>{
 for(const speed of [0,1,2.5,3.8,5.2,6.3,15,Infinity,-5,NaN]){
  const {idle,walk,run}=locomotionWeightsV161(speed);
  assert.ok([idle,walk,run].every(Number.isFinite));
  assert.ok([idle,walk,run].every(x=>x>=0&&x<=1));
  assert.ok(Math.abs(idle+walk+run-1)<1e-12);
 }
 assert.equal(locomotionWeightsV161(0).idle,1);
 assert.ok(locomotionWeightsV161(6.3).run>.9);
});
test('Three.AnimationMixer plays real weighted clips with walking/running transitions',()=>{
 const root=hero();const m=createHeroMixerV161({T,hero:root});
 assert.equal(m.enabled,true);
 assert.equal(m.getStats().idle,1);
 for(let i=0;i<25;i++)m.update(.016,{speed:3.2,grounded:true});
 let state=m.getStats();
 assert.ok(state.walk>.4);
 assert.ok(Math.abs(root.userData.leftLeg.rotation.x)>0.02);
 for(let i=0;i<35;i++)m.update(.016,{speed:6.4,grounded:true});
 state=m.getStats();
 assert.ok(state.run>.8);
 assert.ok(state.walk<.2);
 for(let i=0;i<35;i++)m.update(.016,{speed:0,grounded:true});
 assert.ok(m.getStats().idle>.9);
 m.dispose();
 assert.equal(root.userData.rig.name,'');
});
test('airborne jump, vehicle boarding and driving do not inherit walk animation',()=>{
 const root=hero(),m=createHeroMixerV161({T,hero:root});
 m.update(.04,{speed:4,grounded:true});
 const before=m.getStats().mixerTime;
 for(const mode of [{grounded:false},{boarding:true},{driving:true},{paused:true}]){
  m.update(.04,{speed:4,grounded:true,...mode});
  assert.equal(m.getStats().mixerTime,before);
 }
});
test('weak phones can keep original procedural animation',()=>{
 const fallback=createHeroMixerV161({T,hero:hero(),enabled:false});
 assert.equal(fallback.enabled,false);
 assert.doesNotThrow(()=>fallback.update(.016,{speed:7}));
});
