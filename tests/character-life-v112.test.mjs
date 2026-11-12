// Run: node --test tests/character-life-v112.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCitizenBehaviorV112} from '../public/citizen-behavior-v112.js';
import {createHeroPresenceV112} from '../public/hero-presence-v112.js';

const rotation=()=>({x:0,y:0,z:0});
function fakeResident(){
 const data={id:3,streetEventLock:true,head:{rotation:rotation()},
  body:{rotation:rotation()},arms:[{rotation:rotation()},{rotation:rotation()}],
  elbows:[{rotation:rotation()},{rotation:rotation()}],
  brows:[{position:{y:1.837},rotation:rotation()},{position:{y:1.837},rotation:rotation()}],
  eyes:[{position:{x:-.064}},{position:{x:.064}}],
  mouth:{scale:{x:.069,y:.01}},scarfTail:{rotation:rotation()},phase:1};
 return {position:{x:0,z:0},rotation:{y:0},userData:data};
}
function fakeHero(){
 const userData={rig:{},head:{rotation:rotation()},
  heroPupils:[{position:{x:-.063},scale:{y:.013}},{position:{x:.063},scale:{y:.013}}],
  heroBrows:[{position:{y:.068},rotation:rotation()},{position:{y:.068},rotation:rotation()}],
  heroMouth:{scale:{x:.045,y:.006}}};
 return {position:{x:0,z:0},rotation:{y:0},userData};
}
test('NPC has eye contact, social gestures and animated mouth only near player',()=>{
 const behavior=createCitizenBehaviorV112({mobile:true}),person=fakeResident();
 for(let i=0;i<18;i++)behavior.update(person,{dt:.05,time:10000+i*50,
  focus:{x:3,z:2},distanceSq:13,visible:true,walking:false});
 assert.ok(person.userData.expressionV112.gesture>.6);
 assert.ok(person.userData.mouth.scale.y>.011);
 assert.ok(Number.isFinite(person.userData.head.rotation.y));
 const old=person.userData.mouth.scale.y;
 behavior.update(person,{dt:.05,time:20000,focus:{x:50,z:50},distanceSq:5000,visible:true});
 assert.equal(person.userData.mouth.scale.y,old,'offscreen animation budget');
});
test('NPC responds to rain but impact animation remains authoritative',()=>{
 const behavior=createCitizenBehaviorV112(),person=fakeResident();
 person.userData.streetEventLock=false;
 behavior.update(person,{dt:.05,time:20000,focus:{x:10,z:10},
  distanceSq:200,visible:true,walking:false,raining:true});
 assert.ok(person.userData.expressionV112.scarf>0);
 person.userData.arms[0].rotation.x=-.8;
 behavior.update(person,{dt:.05,time:20100,distanceSq:200,visible:true,
  frightened:true,stumbling:true});
 assert.equal(person.userData.arms[0].rotation.x,-.8);
});
test('hero gaze never accumulates yaw and eye blink restores rig state',()=>{
 const hero=fakeHero(),people=[{visible:true,position:{x:2,z:0}}];
 const presence=createHeroPresenceV112({hero,people});
 for(let i=0;i<140;i++){
  // Mimic the existing V31 head rotation mixer.
  hero.userData.head.rotation.y*=Math.exp(-.08);
  presence.update({dt:.016,driving:false,speed:0});
  assert.ok(Math.abs(hero.userData.head.rotation.y)<=.581);
 }
 assert.equal(presence.stats().trackedEyes,2);
 assert.ok(Math.abs(hero.userData.head.rotation.y)>.08,'hero must actually turn to face nearby people');
 presence.dispose();
 assert.equal(hero.userData.heroPupils[0].scale.y,.013);
 assert.equal(hero.userData.heroPupils[0].position.x,-.063);
});
test('missing rig safely disables facial animation',()=>{
 assert.equal(createHeroPresenceV112({hero:{userData:{}}}).enabled,false);
});
