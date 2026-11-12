// Egypt Streets V155 — glance timing and eye-blink regression checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {blinkAmountV155,mirrorGlanceV155,createDriverAttentionV155} from '../public/driver-attention-v155.js';
import {createSeatedDriverV154} from '../public/driver-avatar-v154.js';

function mockThree(){
 class Vec{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  length(){return Math.hypot(this.x,this.y,this.z)}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}}
 class G{constructor(){this.children=[];this.position=new Vec;this.scale=new Vec(1,1,1);
  this.rotation={x:0,y:0,z:0};this.quaternion={setFromUnitVectors(){}};this.visible=true;this.userData={};this.parent=null}
  add(obj){obj.parent?.remove(obj);this.children.push(obj);obj.parent=this}
  remove(obj){const i=this.children.indexOf(obj);if(i>=0)this.children.splice(i,1);obj.parent=null}}
 class Geo{dispose(){}}
 class Mat{constructor(opts){Object.assign(this,{transparent:false,opacity:1,depthWrite:true},opts)}dispose(){}}
 class Mesh extends G{constructor(g,m){super();this.geometry=g;this.material=m}}
 const geom=class extends Geo{};
 return {Vector3:Vec,Group:G,Mesh,BoxGeometry:geom,SphereGeometry:geom,
  CylinderGeometry:geom,TorusGeometry:geom,MeshLambertMaterial:Mat};
}
function vehicle(T){
 const g=new T.Group;g.userData.chassis=new T.Group;g.add(g.userData.chassis);
 g.userData.wheels=[{},{},{},{}];return g;
}
test('blink amount stays clamped, periodic and deterministic',()=>{
 assert.equal(blinkAmountV155(0),0);
 assert.equal(blinkAmountV155(3.74),1);
 assert.ok(blinkAmountV155(3.80)>0);
 assert.equal(blinkAmountV155(3.30),0);
 assert.ok(Math.abs(blinkAmountV155(3.74+5.2)-1)<1e-10);
 assert.ok(blinkAmountV155(NaN)>=0);
});
test('indicator mirror check is brief and looks in the correct direction',()=>{
 const idle=mirrorGlanceV155({age:.6,signal:0});
 const left=mirrorGlanceV155({age:.6,signal:-1});
 const right=mirrorGlanceV155({age:.6,signal:1});
 assert.equal(idle.strength,0);
 assert.ok(left.headYaw<0&&left.pupilX<0&&left.strength>.5);
 assert.ok(right.headYaw>0&&right.pupilX>0&&right.strength>.5);
 assert.equal(mirrorGlanceV155({age:2,signal:1}).strength,0);
 assert.equal(mirrorGlanceV155({age:-1,signal:1}).strength,0);
});
test('attention begins glance on signal change and does not keep looking away',()=>{
 const a=createDriverAttentionV155();
 let pose=a.update({dt:1/60,signal:-1});
 assert.equal(pose.headYaw,0);
 for(let i=0;i<45;i++)pose=a.update({dt:1/60,signal:-1});
 assert.ok(pose.headYaw<-.12);
 for(let i=0;i<60;i++)pose=a.update({dt:1/60,signal:-1});
 assert.equal(pose.headYaw,0);
 pose=a.update({dt:1/60,signal:1});
 assert.equal(pose.headYaw,0);
 for(let i=0;i<45;i++)pose=a.update({dt:1/60,signal:1});
 assert.ok(pose.headYaw>.12);
 a.reset();
 assert.equal(a.getState().previousSignal,0);
});
test('seated driver creates optional eyes and upholstery only once',()=>{
 const T=mockThree(),c=vehicle(T);
 const a=createSeatedDriverV154({T,lowEnd:false});
 a.update({vehicle:c,driving:true,dt:1/60,turn:1,steer:.3});
 assert.equal(a.getState().builds,1);
 assert.equal(a.getState().eyeCount,2);
 const original=a.getRoot();
 for(let i=0;i<60;i++)a.update({vehicle:c,driving:true,dt:1/60,turn:1});
 assert.equal(a.getRoot(),original);
 assert.ok(a.getState().attention.glance>=0);
 a.clear();
 assert.equal(a.getState().visible,false);
 const budget=createSeatedDriverV154({T,lowEnd:true});
 budget.update({vehicle:c,driving:true,dt:1/60});
 assert.equal(budget.getState().eyeCount,0);
 assert.equal(budget.getState().builds,1);
 a.dispose();budget.dispose();
});
