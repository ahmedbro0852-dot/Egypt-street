// node --test tests/city-3d-v60.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {installFacadeDepthV46} from '../public/facade-depth-v46.js';
import {installCitySculptV60} from '../public/city-sculpt-v60.js';
import {installMobilePalmsV60} from '../public/mobile-palms-v60.js';

function world(){
 class V{set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(p){return this.set(p.x,p.y,p.z)}}
 class Disposable{constructor(options={}){Object.assign(this,options)}dispose(){this.disposed=true}}
 class Color{setHex(v){this.hex=v;return this}}
 class Obj{constructor(){this.position=new V();this.rotation=new V();this.scale=new V()}updateMatrix(){this.matrix={}}}
 class Instance{
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;
   this.instanceMatrix={needsUpdate:false};this.userData={};
  }
  setMatrixAt(){}
  setColorAt(){this.instanceColor={needsUpdate:false}}
  computeBoundingSphere(){}
 }
 const T={Object3D:Obj,InstancedMesh:Instance,BoxGeometry:Disposable,
  SphereGeometry:Disposable,CylinderGeometry:Disposable,
  MeshStandardMaterial:Disposable,MeshLambertMaterial:Disposable,
  Color,DoubleSide:2};
 const facades=[];
 for(let i=0;i<60;i++){
  facades.push({isMesh:true,geometry:{type:'PlaneGeometry',parameters:{width:12,height:12}},
   material:{map:{image:{width:256,height:512}}},rotation:{x:0},
   position:{x:i*2,y:10,z:i*3}});
 }
 const meshes=[];
 const scene={
  traverse(callback){for(const item of facades)callback(item)},
  add(...entries){meshes.push(...entries)},
  remove(item){const i=meshes.indexOf(item);if(i>=0)meshes.splice(i,1)}
 };
 return {T,scene,meshes};
}
function setDevice(){
 const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 Object.defineProperty(globalThis,'window',{configurable:true,value:{matchMedia:()=>({matches:true})}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{deviceMemory:2,hardwareConcurrency:4,maxTouchPoints:1}});
 return ()=>{
  for(const [key,desc] of [['window',originalWindow],['navigator',originalNavigator]]){
   if(desc)Object.defineProperty(globalThis,key,desc);
   else delete globalThis[key];
  }
 };
}
test('V60 facade depth, 3D awnings and palms fit bounded mobile instancing budgets',()=>{
 const reset=setDevice();
 try{
  const {T,scene,meshes}=world(),renderer={isWebGLRenderer:true};
  const buildings=installFacadeDepthV46({T,scene,renderer});
  const storefronts=installCitySculptV60({T,scene,renderer,mobile:true,lowEnd:true});
  const trees=installMobilePalmsV60({T,scene,renderer,positions:[[7,0],[7,15],[-67,15]],mobile:true});
  assert.ok(buildings.stats().fixtures>0);
  assert.ok(buildings.stats().drawCalls<=5);
  assert.ok(storefronts.stats().shops<=16);
  assert.ok(storefronts.stats().drawCalls<=6);
  assert.equal(trees.stats().drawCalls,2);
  assert.equal(trees.stats().trees,3);
  assert.equal(meshes.some(mesh=>mesh.castShadow===true),false);
  trees.update(1,true);
  trees.dispose();storefronts.dispose();buildings.dispose();
  assert.equal(meshes.length,0);
 }finally{reset()}
});
test('mobile 3D geometry falls back cleanly without WebGL',()=>{
 const reset=setDevice();
 try{
  const {T,scene,meshes}=world(),renderer={isWebGLRenderer:false};
  assert.equal(installFacadeDepthV46({T,scene,renderer}).enabled,false);
  assert.equal(installCitySculptV60({T,scene,renderer,mobile:true}).enabled,false);
  assert.equal(installMobilePalmsV60({T,scene,renderer,positions:[[7,0]],mobile:true}).enabled,false);
  assert.equal(meshes.length,0);
 }finally{reset()}
});
