// Run: node --test tests/road-feedback-v60.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoadFeedbackV60 } from '../public/road-feedback-v60.js';

function fakeWorld(){
 class Disposable{dispose(){this.disposed=true}}
 class Point{set(x,y,z){this.x=x;this.y=y;this.z=z;return this}setScalar(x){return this.set(x,x,x)}}
 class Object3D{constructor(){this.position=new Point();this.rotation=new Point();this.scale=new Point();this.matrix={}}updateMatrix(){}}
 class InstancedMesh{
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;
   this.instanceMatrix={needsUpdate:false};this.userData={};
  }
  setMatrixAt(){}
 }
 const T={Object3D,InstancedMesh,BoxGeometry:Disposable,SphereGeometry:Disposable,MeshBasicMaterial:Disposable};
 const children=[];
 const scene={add(o){children.push(o)},remove(o){const i=children.indexOf(o);if(i>=0)children.splice(i,1)}};
 const vehicle={position:{x:0,y:0,z:0},rotation:{y:0}};
 return {T,children,scene,vehicle};
}
test('software fallback creates no 3D effects',()=>{
 const {T,scene,children}=fakeWorld();
 const fx=createRoadFeedbackV60({T,scene,renderer:{isWebGLRenderer:false},mobile:true});
 assert.equal(fx.enabled,false);assert.equal(children.length,0);
 fx.update({});fx.dispose();
});
test('mobile skid marks and wet tyre spray have fixed draw-call budgets',()=>{
 const {T,scene,children,vehicle}=fakeWorld();
 const fx=createRoadFeedbackV60({T,scene,renderer:{isWebGLRenderer:true},mobile:true});
 assert.equal(children.length,2);
 assert.deepEqual(fx.getStats(),{enabled:true,marksLimit:28,sprayLimit:10});
 fx.update({dt:.033,vehicle,active:true,driving:true,speed:12,skid:.7,weather:'صحو'});
 assert.equal(children[0].count,28);assert.equal(children[1].count,0);
 for(let i=0;i<3;i++)fx.update({dt:.06,vehicle,active:true,driving:true,speed:12,skid:0,weather:'مطر'});
 assert.equal(children[1].count,10);
 fx.dispose();assert.equal(children.length,0);
});
test('walking speed never creates skid marks',()=>{
 const {T,scene,children,vehicle}=fakeWorld();
 const fx=createRoadFeedbackV60({T,scene,renderer:{isWebGLRenderer:true}});
 fx.update({dt:.033,vehicle,active:true,driving:true,speed:2,skid:1});
 assert.equal(children[0].count,0);
 fx.dispose();
});
