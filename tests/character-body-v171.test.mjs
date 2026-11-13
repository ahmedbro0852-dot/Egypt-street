import test from 'node:test';
import assert from 'node:assert/strict';
import {stepBodyDynamics} from '../public/character-body-v171.js';
const body=()=>({pitch:0,roll:0,speed:0,yaw:0});
test('running leans forward, turns bank, and stopping settles upright',()=>{
 const s=body();for(let i=0;i<60;i++)stepBodyDynamics(s,{speed:4.3,yaw:i*.02,dt:1/60});
 assert.ok(s.pitch<-.04);assert.ok(s.roll>.02);assert.ok(s.roll<=.065);
 for(let i=0;i<120;i++)stepBodyDynamics(s,{speed:0,yaw:s.yaw,dt:1/60});
 assert.ok(Math.abs(s.pitch)<1e-5);assert.ok(Math.abs(s.roll)<1e-5);
});
test('angle wrapping does not cause a full rotation impulse',()=>{
 const s=body();s.yaw=Math.PI-.001;s.speed=2;
 stepBodyDynamics(s,{speed:2,yaw:-Math.PI+.001,dt:.02});assert.ok(Math.abs(s.roll)<.001);
});
test('zero and invalid time freeze the pose; long frames and airborne offsets stay bounded',()=>{
 const s=body();stepBodyDynamics(s,{speed:4,dt:NaN});assert.deepEqual(s,body());
 for(let i=0;i<50;i++)stepBodyDynamics(s,{speed:Infinity,yaw:NaN,dt:2,grounded:false});
 assert.ok(s.pitch>0&&s.pitch<=.08);assert.equal(s.roll,0);assert.ok(Object.values(s).every(Number.isFinite));
});
