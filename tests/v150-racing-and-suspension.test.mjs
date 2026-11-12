// Egypt Streets V150 — deterministic physics / racing AI regression tests.
// Run with Node.js 22+: node --test tests/v150-racing-and-suspension.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 cornerDemandV150,targetOpponentSpeedV150,evolveOpponentSpeedV150
} from '../public/race-opponents-v150.js';
import { wheelOffsetV150,updateCarWheels,ackermannAngles } from '../public/wheel-rig.js';

const points=[
 {x:0,z:0},{x:0,z:30},{x:30,z:30},{x:30,z:0}
];
test('AI brakes before the corner, not at the instant of turning',()=>{
 const distant=cornerDemandV150(points,0,4),near=cornerDemandV150(points,0,27);
 assert.equal(distant.remaining,26);
 assert.equal(near.remaining,3);
 assert.ok(near.severity>.5);
 const straightSpeed=targetOpponentSpeedV150({baseSpeed:16,points,steps:0,segment:4});
 const cornerSpeed=targetOpponentSpeedV150({baseSpeed:16,points,steps:0,segment:27});
 assert.equal(straightSpeed,16);
 assert.ok(cornerSpeed<straightSpeed);
 assert.ok(cornerSpeed>8);
});
test('opponents yield headway without slowing for distant or off-lane traffic',()=>{
 const options={baseSpeed:16,points,steps:0,segment:4,
  position:{x:0,z:10}};
 const free=targetOpponentSpeedV150(options);
 const close=targetOpponentSpeedV150({...options,player:{x:0,z:15}});
 const offLane=targetOpponentSpeedV150({...options,player:{x:7,z:15}});
 const behind=targetOpponentSpeedV150({...options,player:{x:0,z:7}});
 assert.ok(close<free);assert.equal(offLane,free);assert.equal(behind,free);
});
test('AI speed changes gradually and is bounded on frame spikes',()=>{
 assert.ok(evolveOpponentSpeedV150(16,4,1/60)>15.8);
 assert.ok(evolveOpponentSpeedV150(0,16,1/60)<.06);
 assert.ok(evolveOpponentSpeedV150(0,16,10)<.2);
 assert.equal(evolveOpponentSpeedV150(16,4,0),16);
 assert.equal(evolveOpponentSpeedV150(-1,NaN,1),0);
});
test('front axle responds to braking and opposite wheels react to lateral load',()=>{
 const brake={acceleration:-6,lateralAcceleration:0,speed:0,wheelSpin:0,impact:0};
 assert.ok(wheelOffsetV150(brake,true,1)>0);
 assert.ok(wheelOffsetV150(brake,false,1)<0);
 const turn={acceleration:0,lateralAcceleration:6,speed:0,wheelSpin:0,impact:0};
 assert.ok(wheelOffsetV150(turn,true,1)>wheelOffsetV150(turn,true,-1));
 assert.equal(wheelOffsetV150({speed:0,wheelSpin:0},true,1),0);
 assert.ok(Math.abs(wheelOffsetV150({speed:100,acceleration:100,lateralAcceleration:100},true,1))<=.075);
});
test('steering, independent wheel travel and wheel rolling remain compatible',()=>{
 function wheel(front,side){
  const rolling={rotation:{x:0}};
  return {position:{x:side*.85,y:.43,z:front?1.35:-1.35},
    rotation:{y:0,x:0},userData:{front,side,rolling,baseY:.43,radius:.405}};
 }
 const car={userData:{wheels:[wheel(true,-1),wheel(true,1),wheel(false,-1),wheel(false,1)]}};
 const physical={steer:.4,acceleration:-6,lateralAcceleration:4,heave:.01,
  speed:17,wheelSpin:8,impact:0};
 for(let i=0;i<30;i++)updateCarWheels(car,physical,1/60);
 const [frontL,frontR,rearL,rearR]=car.userData.wheels;
 assert.notEqual(frontL.rotation.y,frontR.rotation.y);
 assert.equal(rearL.rotation.y,0);
 assert.ok(frontL.position.y!==frontR.position.y);
 assert.ok(frontL.position.y!==rearL.position.y);
 assert.ok(frontL.userData.rolling.rotation.x>0);
 for(const w of car.userData.wheels)
  assert.ok(w.position.y>=.355&&w.position.y<=.505);
 assert.ok(Math.abs(ackermannAngles(.3).left-ackermannAngles(.3).right)>.001);
});
