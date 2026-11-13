import test from 'node:test';import assert from 'node:assert/strict';
import {stepCharacterMotion} from '../public/character-motion-v167.js';
test('acceleration, diagonal normalization and braking are bounded',()=>{const a={x:0,z:0,vx:0,vz:0},b={...a};for(let i=0;i<60;i++){stepCharacterMotion(a,{forward:1,dt:1/60});stepCharacterMotion(b,{forward:1,strafe:1,dt:1/60})}assert.ok(Math.abs(Math.hypot(a.vx,a.vz)-Math.hypot(b.vx,b.vz))<1e-6);for(let i=0;i<60;i++)stepCharacterMotion(a,{dt:1/60});assert.ok(Math.abs(a.vz)<.001)});
test('pushing at boundary reports zero actual speed',()=>{const s={x:4.05,z:0,vx:2,vz:0};const result=stepCharacterMotion(s,{strafe:1,dt:.04});assert.equal(s.x,4.05);assert.equal(result.speed,0);assert.equal(s.vx,0)});
test('zero elapsed time does not move actor',()=>{const s={x:0,z:0,vx:2,vz:0};assert.equal(stepCharacterMotion(s,{forward:1,dt:0}).speed,0);assert.equal(s.x,0)});
