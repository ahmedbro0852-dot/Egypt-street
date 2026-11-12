import test from 'node:test';
import assert from 'node:assert/strict';
import {driverPoseV154,isDriverCarV154,createSeatedDriverV154}
 from '../public/driver-avatar-v154.js';
import {createCockpitV15} from '../public/cockpit-v15.js';

function fakeThree(){
 class Vec{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  length(){return Math.hypot(this.x,this.y,this.z)}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
 }
 class Group{
  constructor(){this.children=[];this.position=new Vec();
   this.scale=new Vec(1,1,1);this.rotation={x:0,y:0,z:0};
   this.quaternion={setFromUnitVectors(){}};this.visible=true;this.userData={};this.parent=null}
  add(obj){obj.parent?.remove(obj);this.children.push(obj);obj.parent=this}
  remove(obj){const i=this.children.indexOf(obj);if(i>=0)this.children.splice(i,1);obj.parent=null}
 }
 class Geometry{dispose(){}}
 class Material{constructor(options){Object.assign(this,{opacity:1,depthWrite:true,transparent:false,...options})}dispose(){}}
 class Mesh extends Group{constructor(g,m){super();this.geometry=g;this.material=m}}
 const geom=class extends Geometry{constructor(...a){super();this.args=a}};
 return {Group,Vector3:Vec,Mesh,BoxGeometry:geom,SphereGeometry:geom,
  CylinderGeometry:geom,TorusGeometry:geom,MeshLambertMaterial:Material,
  MeshStandardMaterial:Material,MeshBasicMaterial:Material};
}
function ride(T,kind='sedan'){
 const g=new T.Group(),chassis=new T.Group();g.add(chassis);
 g.userData.chassis=chassis;
 g.userData.wheels=kind==='motorbike'?[{},{}]:[{},{},{},{}];
 g.userData.driverGlassV154=new T.MeshStandardMaterial({color:0x24303a});
 return g;
}
test('driver pose responds to steering, brake, turning and extreme inputs',()=>{
 const rest=driverPoseV154({steer:0,speed:0});
 const right=driverPoseV154({steer:.5,speed:26,braking:true});
 const left=driverPoseV154({steer:-.5});
 assert.equal(rest.wheelAngle,0);
 assert.ok(right.wheelAngle<0&&left.wheelAngle>0);
 assert.ok(right.headYaw<0&&right.headRoll<0);
 assert.ok(right.upperBodyPitch>0);
 assert.ok(rest.handLift===0&&right.handLift>0);
 const broken=driverPoseV154({steer:Infinity,speed:NaN,turn:Infinity});
 assert.ok(Number.isFinite(broken.headYaw));
 assert.ok(Math.abs(driverPoseV154({steer:999}).wheelAngle)<=.72);
});
test('3D avatar attaches to active sedan and clears with restored windshield',()=>{
 const T=fakeThree(),a=ride(T),b=ride(T),driver=createSeatedDriverV154({T});
 const glass=a.userData.driverGlassV154;
 assert.equal(isDriverCarV154(a),true);
 assert.equal(isDriverCarV154(ride(T,'motorbike')),false);
 driver.update({vehicle:a,driving:true,steer:.4,speed:22,braking:true});
 assert.equal(driver.getState().vehicle,a);
 assert.equal(driver.getRoot().parent,a.userData.chassis);
 assert.equal(glass.transparent,true);
 assert.ok(glass.opacity<1);
 assert.equal(driver.getState().builds,1);
 driver.update({vehicle:b,driving:true,steer:-.3});
 assert.equal(driver.getRoot().parent,b.userData.chassis);
 assert.equal(driver.getState().builds,1);
 assert.equal(glass.transparent,false);
 assert.equal(glass.opacity,1);
 assert.equal(a.userData.chassis.children.includes(driver.getRoot()),false);
 driver.update({vehicle:b,driving:true,interior:true});
 assert.equal(driver.getState().vehicle,null);
 assert.equal(b.userData.driverGlassV154.transparent,false);
 driver.dispose();
});
test('motorcycles and stopped characters cannot duplicate seated driver',()=>{
 const T=fakeThree(),driver=createSeatedDriverV154({T});
 const bike=ride(T,'motorbike');
 driver.update({vehicle:bike,driving:true,steer:.4});
 assert.equal(driver.getState().vehicle,null);
 driver.update({vehicle:ride(T),driving:false});
 assert.equal(driver.getState().vehicle,null);
 driver.clear();
});
test('cockpit hands track steering wheel without extra rendering passes',()=>{
 const T=fakeThree(),scene=new T.Group(),camera=new T.Group();
 const cockpit=createCockpitV15({T,scene,camera});
 assert.equal(cockpit.getState().driverHands,2);
 cockpit.setVisible(true);cockpit.update(.35,12,false);
 assert.equal(cockpit.getState().visible,true);
 assert.ok(cockpit.getState().steering<0);
 cockpit.update(-.35,12,true);
 assert.ok(cockpit.getState().steering>0);
 assert.ok(cockpit.getState().parts>15);
 cockpit.setVisible(false);
 assert.equal(cockpit.getState().visible,false);
});
