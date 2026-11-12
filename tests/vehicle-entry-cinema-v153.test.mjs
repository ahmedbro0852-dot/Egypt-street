// Egypt Streets V153 — staged 3D vehicle boarding, doors and safe transitions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 smoothEntryV153,doorSwingV153,rideSideV153,rideDoorPointV153,
 createVehicleEntryCinemaV153
} from '../public/vehicle-entry-cinema-v153.js';

function fixture(kind='sedan',lowEnd=false){
 class Vector{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
 class Group{constructor(){this.position=new Vector();this.rotation={x:0,y:0,z:0};
  this.children=[];this.visible=true;this.userData={}}
  add(child){this.children.push(child)}}
 class BoxGeometry{constructor(...size){this.size=size}}
 class MeshBasicMaterial{constructor(x){this.options=x}}
 class Mesh extends Group{constructor(g,m){super();this.geometry=g;this.material=m}}
 const T={Group,BoxGeometry,MeshBasicMaterial,Mesh};
 const hero=new Group(),rig=new Group();hero.userData.rig=rig;
 hero.position.set(-3,0,0);
 const vehicle=new Group();vehicle.userData.streetRideKind=kind;
 vehicle.userData.wheels=kind==='motorbike'?[{},{}]:[{}, {}, {}, {}];
 vehicle.userData.chassis=new Group();
 vehicle.userData.damagePanels={paint:{}};
 vehicle.position.set(0,0,0);
 const cinema=createVehicleEntryCinemaV153({T,hero,lowEnd});
 return {T,hero,vehicle,cinema};
}
test('door timing is clamped and smooth before entering and exiting',()=>{
 assert.equal(smoothEntryV153(-10),0);assert.equal(smoothEntryV153(10),1);
 for(const mode of ['enter','exit']){
  assert.equal(doorSwingV153(0,mode),0);
  assert.ok(doorSwingV153(.45,mode)>.95);
  assert.equal(doorSwingV153(1,mode),0);
 }
});
test('door is opened away from the car on both sides',()=>{
 const {vehicle,hero}=fixture();
 assert.equal(rideSideV153(hero,vehicle),-1);
 hero.position.set(3,0,0);
 assert.equal(rideSideV153(hero,vehicle),1);
 const left=rideDoorPointV153(vehicle,-1),right=rideDoorPointV153(vehicle,1);
 assert.ok(left.x<0&&right.x>0);
});
test('car entry animates the avatar and hinged door, runs completion once',()=>{
 const {hero,vehicle,cinema}=fixture();
 let finished=0;
 assert.equal(cinema.startEnter(vehicle,()=>{finished++;hero.visible=false}),true);
 assert.equal(cinema.startEnter(vehicle,()=>{}),false,'cannot stack boarding');
 assert.equal(cinema.isActive(),true);
 for(let i=0;i<10;i++)cinema.update(.05);
 assert.ok(vehicle.userData.entryDoorV153);
 assert.ok(vehicle.userData.entryDoorV153.hinge.visible);
 assert.ok(vehicle.userData.entryDoorV153.opening.visible);
 assert.ok(Math.abs(hero.position.x)<3);
 for(let i=0;i<30;i++)cinema.update(.05);
 assert.equal(cinema.isActive(),false);
 assert.equal(finished,1);
 assert.equal(hero.visible,false);
 assert.equal(vehicle.userData.entryDoorV153.hinge.visible,false);
 cinema.update(.05);assert.equal(finished,1);
});
test('exit returns the avatar to a safe sidewalk position',()=>{
 const {vehicle,hero,cinema}=fixture();
 hero.visible=false;
 let done=0;const finish={x:-3.4,z:0};
 assert.equal(cinema.startExit(vehicle,finish,()=>done++),true);
 assert.equal(hero.visible,true);
 for(let i=0;i<25;i++)cinema.update(.05);
 assert.equal(done,1);
 assert.ok(Math.abs(hero.position.x-finish.x)<1e-8);
 assert.ok(Math.abs(hero.position.z-finish.z)<1e-8);
 assert.equal(cinema.isActive(),false);
});
test('motorcycles animate boarding without creating a car door',()=>{
 const {vehicle,cinema,hero}=fixture('motorbike');
 assert.equal(cinema.startEnter(vehicle,()=>{hero.visible=false}),true);
 for(let i=0;i<30;i++)cinema.update(.05);
 assert.equal(vehicle.userData.entryDoorV153,undefined);
 assert.equal(hero.visible,false);
});
test('low-end phones skip expensive geometry but keep entry animation',()=>{
 const {vehicle,cinema}=fixture('sedan',true);
 assert.equal(cinema.startEnter(vehicle),true);
 for(let i=0;i<20;i++)cinema.update(.05);
 assert.equal(vehicle.userData.entryDoorV153,undefined);
 assert.equal(cinema.isActive(),false);
});
test('pausing transition and cancellation do not complete or leak doors',()=>{
 const {vehicle,cinema}=fixture();
 let calls=0;cinema.startEnter(vehicle,()=>calls++);
 cinema.update(.05);cinema.update(0);assert.equal(calls,0);
 cinema.cancel();assert.equal(cinema.isActive(),false);
 assert.equal(vehicle.userData.entryDoorV153.hinge.visible,false);
 assert.equal(calls,0);
 assert.equal(cinema.startEnter(vehicle,()=>calls++),true);
 for(let i=0;i<30;i++)cinema.update(.05);
 assert.equal(calls,1);
});
