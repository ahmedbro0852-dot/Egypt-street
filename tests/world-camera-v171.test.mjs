import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraClearFraction,constrainWorldCamera,updateTravelLook} from '../public/world-camera-v171.js';
const origin={x:0,y:1.4,z:0};
test('continuous camera sweep catches thin walls and never forces camera through a near wall',()=>{
 for(const z of [.4,2.345,7.999]){
  const wall={x:0,z,w:2,d:.01},desired={x:0,y:4,z:10};
  constrainWorldCamera(origin,desired,[wall]);
  assert.ok(desired.z<z-.01);
  assert.ok(desired.z>=0);
 }
});
test('nearest obstacle wins regardless of order and clear paths remain unchanged',()=>{
 const a={x:0,z:3,w:2,d:.2},b={x:0,z:7,w:2,d:.2},end={x:0,y:3,z:10};
 assert.equal(cameraClearFraction(origin,end,[a,b]),cameraClearFraction(origin,end,[b,a]));
 assert.equal(cameraClearFraction(origin,end,[{x:8,z:2,w:1,d:1}]),1);
 assert.equal(cameraClearFraction(origin,{x:0,z:0},[a]),1);
});
test('post smoothing sweep blocks diagonal paths and handles boundary starts',()=>{
 const wall={x:2,z:2,w:.1,d:2},end={x:8,y:5,z:8};
 constrainWorldCamera(origin,end,[wall]);
 assert.ok(end.x<1.66);assert.ok(Number.isFinite(end.y));
 assert.equal(cameraClearFraction({x:2,z:2},{x:9,z:9},[wall]),0);
});
test('look ahead settles in reverse and is consistent across frame rates',()=>{
 const run=hz=>{let value=0;for(let i=0;i<hz;i++)value=updateTravelLook(value,-15,1/hz);return value};
 assert.ok(run(60)<-1.9);
 assert.ok(Math.abs(run(30)-run(120))<1e-10);
 assert.equal(updateTravelLook(1,20,0),1);
 assert.ok(Math.abs(updateTravelLook(0,1000,.05))<2.6);
});
