import test from 'node:test';
import assert from 'node:assert/strict';
import {axleGripBudget,createVehiclePhysics,stepVehiclePhysics} from '../public/vehicle-physics.js';
test('rear drive consumes rear cornering grip while front steering grip remains available',()=>{
 const coast=axleGripBudget(6800,5500,1,0);
 const drive=axleGripBudget(6800,5500,1,4500);
 assert.equal(drive.front,coast.front);
 assert.ok(drive.rear<coast.rear*.6);
 assert.equal(axleGripBudget(6800,5500,1,9000).rear,0);
});
test('braking shares tyre demand between axles and rain reduces the cornering budget',()=>{
 const coast=axleGripBudget(8000,4300,1,0);
 const brake=axleGripBudget(8000,4300,1,-7000,true);
 const wet=axleGripBudget(8000,4300,.55,-7000,true);
 assert.ok(brake.front<coast.front&&brake.rear<coast.rear);
 assert.ok(wet.front<brake.front&&wet.rear<brake.rear);
 assert.ok(Object.values(wet).every(Number.isFinite));
});
test('combined hard cornering and braking stays finite across frame rates',()=>{
 for(const dt of [1/30,1/60,1/120])for(const grip of [.45,1]){
  const p=createVehiclePhysics();p.speed=24;
  for(let i=0;i<8/dt;i++)stepVehiclePhysics(p,{steer:.7,brake:true,absEnabled:true,grip},dt);
  for(const key of ['x','z','yaw','speed','lateralSpeed','yawRate'])assert.ok(Number.isFinite(p[key]),key);
  assert.ok(Math.abs(p.speed)<.1);
 }
});
