// Run: node --test tests/cinematic-graphics-v60.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import { installCinematicGraphicsV60 } from '../public/cinematic-graphics-v60.js';

function fixture({memory=8,cores=8,reduced=false}={}){
 class Vec {
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){Object.assign(this,{x,y,z});return this}
  copy(v){return this.set(v.x,v.y,v.z)}
  sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z)}
  normalize(){const m=Math.hypot(this.x,this.y,this.z)||1;return this.set(this.x/m,this.y/m,this.z/m)}
  addScaledVector(v,k){return this.set(this.x+k*v.x,this.y+k*v.y,this.z+k*v.z)}
 }
 class Resource{dispose(){this.disposed=true}}
 class Material extends Resource{constructor(config={}){super();Object.assign(this,config)}}
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vec();this.userData={}}}
 class Sprite{constructor(material){this.material=material;this.position=new Vec();this.scale=new Vec();this.userData={}}}
 const T={Vector3:Vec,ShaderMaterial:Material,SphereGeometry:Resource,Mesh,
  Sprite,SpriteMaterial:Material,CanvasTexture:Resource,BackSide:1,AdditiveBlending:2};
 const objects=[];
 const scene={add(v){objects.push(v)},remove(v){objects.splice(objects.indexOf(v),1)}};
 const camera={position:new Vec(0,2,0),rolls:[],yaw:[],rotateZ(v){this.rolls.push(v)},rotateY(v){this.yaw.push(v)}};
 const sun={position:new Vec(-30,70,20),target:{position:new Vec()}};
 const originalWindow=globalThis.window,originalNavigator=globalThis.navigator,originalDocument=globalThis.document;
 Object.defineProperty(globalThis,'window',{configurable:true,value:{matchMedia:()=>({matches:reduced})}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{deviceMemory:memory,hardwareConcurrency:cores}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{
  body:{append(){}},
  createElement(tag){
   if(tag==='canvas')return {getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})};
   return {style:{},setAttribute(){},remove(){}};
  }
 }});
 const restore=()=>{
  for(const [key,original] of [['window',originalWindow],['navigator',originalNavigator],['document',originalDocument]]){
   if(original===undefined)delete globalThis[key];else Object.defineProperty(globalThis,key,{configurable:true,value:original});
  }
 };
 return {T,scene,camera,sun,objects,restore};
}
test('low-end mobile gets cheap sky without the extra glare sprite',()=>{
 const f=fixture({memory:2,cores:4});
 try{
  const fx=installCinematicGraphicsV60({...f,renderer:{isWebGLRenderer:true},mobile:true});
  assert.equal(fx.getStats().sky,true);assert.equal(fx.getStats().halo,false);
  for(let i=0;i<12;i++)fx.update({dt:.033,active:true,driving:true,speed:25,steer:.7,yawRate:.12});
  assert.ok(f.camera.rolls.length>0);
  fx.dispose();assert.equal(f.objects.length,0);
 }finally{f.restore()}
});
test('steady camera and reduced-motion preference avoid camera movement',()=>{
 const f=fixture({reduced:true});
 try{
  const fx=installCinematicGraphicsV60({...f,renderer:{isWebGLRenderer:true},mobile:false});
  assert.equal(fx.getStats().sky,false);
  fx.update({dt:.033,active:true,driving:true,speed:30,steer:1});
  assert.equal(f.camera.rolls.length,0);fx.dispose();
 }finally{f.restore()}
});
test('unsupported renderer adds no visuals',()=>{
 const f=fixture();
 try{
  const fx=installCinematicGraphicsV60({...f,renderer:{isWebGLRenderer:false},mobile:true});
  assert.equal(fx.enabled,false);assert.equal(f.objects.length,0);
 }finally{f.restore()}
});
