// Run: node --test tests/vehicle-details-v111.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {installVehicleDetailsV111} from '../public/vehicle-details-v111.js';

function fake3D(){
 class V {constructor(){this.set(0,0,0)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
 class Geo{dispose(){this.disposed=true}}
 class Mat{constructor(options){this.options=options}dispose(){this.disposed=true}}
 class Base{
  constructor(){this.children=[];this.userData={};this.position=new V();this.rotation=new V();this.scale=new V()}
  add(v){this.children.push(v)}
  remove(v){const n=this.children.indexOf(v);if(n!==-1)this.children.splice(n,1)}
  updateMatrix(){this.matrix={}}
 }
 class Group extends Base{}
 class Mesh extends Base{
  constructor(geometry,material){super();this.geometry=geometry;this.material=material}
 }
 class InstancedMesh extends Mesh{
  constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={}}
  setMatrixAt(){}
  computeBoundingSphere(){}
 }
 return {T:{Group,Mesh,Object3D:Base,InstancedMesh,BoxGeometry:Geo,MeshStandardMaterial:Mat},
  makeCar(){const chassis=new Group();return {userData:{chassis,wheels:[1,2,3,4]}}}};
}
test('V111 vehicle detail creates bounded 3D meshes for the player only',()=>{
 const f=fake3D();const car=f.makeCar();
 const system=installVehicleDetailsV111({T:f.T,renderer:{isWebGLRenderer:true},mobile:true});
 assert.equal(system.enabled,true);
 system.update({vehicle:car,active:true,driving:true,engineOn:true,rain:true,dt:.06});
 assert.equal(system.stats().detailCars,1);
 const group=car.userData.chassis.children[0];
 assert.equal(group.children.filter(x=>x instanceof f.T.InstancedMesh).length,3);
 for(let i=0;i<9;i++)system.update({vehicle:car,active:true,driving:true,engineOn:true,rain:true,dt:.06});
 const blade=group.children.find(x=>x instanceof f.T.Group).children[0];
 assert.ok(blade);
 const firstWiper=group.children.find(x=>x instanceof f.T.Group);
 assert.notEqual(firstWiper.rotation.z,0);
 for(let i=0;i<15;i++)system.update({vehicle:car,active:true,driving:true,engineOn:false,rain:false,dt:.06});
 assert.ok(Math.abs(firstWiper.rotation.z)<.01);
 system.dispose();assert.equal(car.userData.chassis.children.length,0);
});
test('No extra meshes for bikes or software-rendered sessions',()=>{
 const f=fake3D(),car=f.makeCar();
 const off=installVehicleDetailsV111({T:f.T,renderer:{isWebGLRenderer:false}});
 assert.equal(off.enabled,false);
 off.update({vehicle:car});
 const bike={userData:{chassis:new f.T.Group(),wheels:[1,2]}};
 const on=installVehicleDetailsV111({T:f.T,renderer:{isWebGLRenderer:true}});
 on.update({vehicle:bike,active:true,driving:true});
 assert.equal(on.stats().detailCars,0);on.dispose();
});
