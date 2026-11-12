// Run: node --test tests/citizen-locomotion-v112.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {citizenHeadingV112,animateCitizenStrideV112} from '../public/citizen-locomotion-v112.js';

const rotation=()=>({x:0,y:0,z:0});
function makeCitizen(){
 const joint=()=>({rotation:rotation()});
 const data={
  id:5,motion:1,body:{position:{y:0},rotation:rotation()},
  legs:[joint(),joint()],knees:[joint(),joint()],
  feet:[{rotation:rotation(),position:{y:-.31}},{rotation:rotation(),position:{y:-.31}}],
  proxy:{position:{y:0},rotation:rotation()}
 };
 return {userData:data};
}
test('citizens use shortest turn across the -PI/PI seam',()=>{
 const current=3.12,target=-3.12;
 const next=citizenHeadingV112(current,target,.05);
 assert.ok(Math.abs(next-current)<.02,'should not spin around the long way');
 assert.ok(Math.abs(citizenHeadingV112(0,Math.PI/2,.04))>0);
});
test('natural steps blend weight and preserve existing near/far LOD',()=>{
 const citizen=makeCitizen(),u=citizen.userData;
 for(let i=0;i<12;i++){
  const result=animateCitizenStrideV112(citizen,{dt:.04,phase:i*.8,walking:true,near:true});
  assert.equal(result.lod,'near');
 }
 assert.ok(u.gaitV112.weight>.5);
 assert.ok(Number.isFinite(u.body.rotation.x));
 assert.ok(Number.isFinite(u.feet[0].rotation.x));
 assert.ok(Number.isFinite(u.feet[1].rotation.x));
 assert.ok(u.feet[0].position.y>=-.31 && u.feet[1].position.y>=-.31);
 for(let j=0;j<20;j++)animateCitizenStrideV112(citizen,{dt:.05,phase:7,walking:false,near:true});
 assert.ok(Math.abs(u.feet[0].rotation.x)<.01,'left shoe settles after stopping');
 assert.ok(Math.abs(u.feet[1].rotation.x)<.01,'right shoe settles after stopping');
 u.proxy.position.y=0;
 const far=animateCitizenStrideV112(citizen,{dt:.04,phase:1,walking:true,near:false});
 assert.equal(far.lod,'far');
 assert.ok(Number.isFinite(u.proxy.rotation.y));
});
test('impact and fall animations have priority over natural gait',()=>{
 const citizen=makeCitizen(),u=citizen.userData;
 u.body.rotation.x=.52;
 u.legs[0].rotation.z=.15;
 const result=animateCitizenStrideV112(citizen,{dt:.04,phase:2,near:true,stumbling:true});
 assert.equal(result.priority,'collision');
 assert.equal(u.body.rotation.x,.52);
 assert.equal(u.legs[0].rotation.z,0);
 assert.equal(u.feet[0].position.y,-.31);
 assert.equal(u.feet[1].position.y,-.31);
 assert.equal(u.feet[0].rotation.x,0);
 assert.equal(u.feet[1].rotation.x,0);
});
test('missing character rig degrades safely',()=>{
 assert.equal(animateCitizenStrideV112({},{}).enabled,false);
});
