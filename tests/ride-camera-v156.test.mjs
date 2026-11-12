// Egypt Streets V156 camera and parked-world regression tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rideCameraEaseV156,rideCameraShotV156,createRideCameraV156}
  from '../public/ride-camera-v156.js';

class Vec{
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 lerp(other,weight){this.x+=(other.x-this.x)*weight;this.y+=(other.y-this.y)*weight;
  this.z+=(other.z-this.z)*weight;return this}
}
class Quat{
 constructor(){this.a=0}
 copy(q){this.a=q.a;return this}
 slerp(q,weight){this.a+=(q.a-this.a)*weight;return this}
}
function fixture(opts={}){
 const T={Vector3:Vec,Quaternion:Quat};
 const camera={position:new Vec(0,5,-8),quaternion:new Quat(),lookAt(v){this.quaternion.a=v.x*.08+v.z*.02}};
 const ride={position:{x:10,y:0,z:5},rotation:{y:Math.PI/2}};
 return {camera,ride,cinema:createRideCameraV156({T,camera,...opts})};
}
test('weight is zero on either end and reaches its peak smoothly',()=>{
 assert.equal(rideCameraEaseV156(0),0);
 assert.equal(rideCameraEaseV156(1),0);
 assert.ok(rideCameraEaseV156(.48)>.95);
 for(const p of [-1,0,.12,.3,.6,.8,1,3]){
  const v=rideCameraEaseV156(p);
  assert.ok(v>=0&&v<=1);
 }
});
test('orbit shot rotates with the car and remains finite at bad inputs',()=>{
 const vehicle={position:{x:10,y:0,z:5},rotation:{y:Math.PI/2}};
 const left=rideCameraShotV156(vehicle,-1,'enter');
 const right=rideCameraShotV156(vehicle,1,'exit');
 assert.ok(left.position.x<10);
 assert.ok(left.position.z>right.position.z);
 for(const obj of [left.position,left.target,right.position,right.target])
  assert.ok([obj.x,obj.y,obj.z].every(Number.isFinite));
 const bad=rideCameraShotV156({position:{x:NaN,z:NaN},rotation:{y:Infinity}});
 assert.ok([bad.position.x,bad.position.z].every(Number.isFinite));
});
test('entry camera blends without snapping and finishes with no persistent animation',()=>{
 const {camera,ride,cinema}=fixture();
 assert.equal(cinema.start(ride,{mode:'enter',side:-1}),true);
 assert.ok(cinema.isActive());
 const before={...camera.position};
 cinema.update(0);
 assert.deepEqual({...camera.position},before);
 let touched=false;
 for(let i=0;i<22;i++){
  // A normal chase camera solves its pose every frame before the overlay.
  camera.position.set(0,5,-8);
  const beforeX=camera.position.x;
  cinema.update(.035);
  if(camera.position.x!==beforeX)touched=true;
 }
 assert.equal(touched,true);
 for(let i=0;i<100;i++)cinema.update(.035);
 assert.equal(cinema.isActive(),false);
 assert.equal(cinema.getState(),null);
});
test('reduced-motion settings skip camera orbit but still terminate',()=>{
 const {ride,camera,cinema}=fixture({reducedMotion:true,lowEnd:true});
 const original={...camera.position};
 assert.equal(cinema.start(ride,{mode:'exit',side:1}),true);
 for(let i=0;i<50;i++)cinema.update(.035);
 assert.equal(cinema.isActive(),false);
 assert.deepEqual({...camera.position},original);
});
test('borrowed street cars no longer teleport to the taxi when walking',async()=>{
 const source=await readFile(new URL('../public/game.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/if\(activeVehicle!==taxi&&!driving\)\{activeVehicle\.position\.copy\(taxi\.position\)/);
 assert.match(source,/!borrowedVehicle&&/);
 assert.match(source,/rideCameraV156\.update\(dt\)/);
});
