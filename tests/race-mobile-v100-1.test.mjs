// Run: node --experimental-default-type=module --test tests/race-mobile-v100-1.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCairoRacesV31 } from '../public/cairo-races-v31.js';
import { CAIRO_RACES_V31 } from '../public/cairo-races-v31.js';

class V{
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}
 copy(p){return this.set(p.x,p.y,p.z)}
}
class N{
 constructor(){
  this.children=[];this.position=new V();this.rotation=new V();
  this.scale=new V(1,1,1);this.visible=true;this.userData={};
 }
 add(o){this.children.push(o);o.parent=this}
 remove(o){this.children=this.children.filter(x=>x!==o)}
 traverse(fn){fn(this);for(const x of this.children)x.traverse(fn)}
}
class G{dispose(){this.disposed=true}}
class M extends N{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
class Mat extends G{constructor(conf={}){super();Object.assign(this,conf)}}
const T={Group:N,Mesh:M,BoxGeometry:G,PlaneGeometry:G,CylinderGeometry:G,
 TorusGeometry:G,SphereGeometry:G,MeshStandardMaterial:Mat,
 MeshBasicMaterial:Mat,DoubleSide:2,
 // Arena must remain unallocated when only open-world races are played.
 BufferGeometry:class{constructor(){throw Error('3D arena built too early')}}
};
class E{
 constructor(tag='div'){
  this.tag=tag;this.hidden=false;this.textContent='';this.children=[];
  this.style={};this.id='';this.dataset={};
  this.classList={add(){},remove(){},toggle(){}};
 }
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 addEventListener(){}
 setAttribute(){}
}
function fixture(){
 const previousDocument=globalThis.document;
 const previousWindow=globalThis.window;
 const elements=[];
 globalThis.document={
  hidden:false,head:new E('head'),body:new E('body'),
  createElement(tag){const e=new E(tag);elements.push(e);return e}
 };
 globalThis.window={addEventListener(){}};
 const data=new Map();
 const storage={getItem:key=>data.get(key)||null,
  setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 const scene=new N(),car={x:0,z:0,yaw:0,speed:0},notes=[];
 const races=createCairoRacesV31({
  T,scene,storage,mobileLite:true,
  getActive:()=>true,getPaused:()=>false,getDriving:()=>true,
  getVehicle:()=>car,prepareCar:()=>true,restoreCar:()=>{},
  notify:message=>notes.push(message)
 });
 function cleanup(){
  if(previousDocument===undefined)delete globalThis.document;
  else globalThis.document=previousDocument;
  if(previousWindow===undefined)delete globalThis.window;
  else globalThis.window=previousWindow;
 }
 return {scene,car,notes,elements,races,cleanup};
}

test('mobile has a reachable races button, not permanently hidden in compact UI',()=>{
 const source=readFileSync(new URL('../public/mobile-lite-v51.js',import.meta.url),'utf8');
 assert.ok(!source.includes('body.mobile-v51 #v31RaceOpen,'));
 assert.match(source,/body\.mobile-v51 #v31RaceOpen\{position:fixed/);
 assert.ok(CAIRO_RACES_V31.filter(course=>course.world).length>=6);
});

test('racing initializes without expensive track meshes or rival cars',()=>{
 const f=fixture();
 try{
  assert.deepEqual(f.races.getPerformance(),{
   arenaCreated:false,rivalModelBuilds:0,rivalType:null,rivalsReady:0
  });
  assert.equal(f.races.getOpponents().length,0);
 }finally{f.cleanup()}
});

test('sequential city races reuse the same 3 opponent models on mobile',()=>{
 const f=fixture();
 try{
  assert.equal(f.races.start('world-downtown'),true);
  const models=f.races.getOpponents();
  assert.equal(models.length,3);
  assert.equal(f.races.getPerformance().rivalModelBuilds,3);
  f.races.finish(false,true);
  f.car.x=-60;f.car.z=-60;
  assert.equal(f.races.start('world-giza'),true);
  assert.equal(f.races.getPerformance().rivalModelBuilds,3);
  assert.equal(f.races.getPerformance().arenaCreated,false);
  for(let i=0;i<3;i++)assert.equal(f.races.getOpponents()[i],models[i]);
  f.races.finish(false,true);
 }finally{f.cleanup()}
});

test('distant opponent models hide but their race simulation keeps moving',()=>{
 const f=fixture();
 try{
  assert.equal(f.races.start('world-downtown'),true);
  const models=f.races.getOpponents();
  f.car.x=195;f.car.z=140;
  for(let i=0;i<90;i++)f.races.update(.05,1000+i*50);
  assert.equal(f.races.getRace().phase,'racing');
  assert.ok(models.every(model=>model.visible===false));
  const before={x:models[0].position.x,z:models[0].position.z};
  for(let i=0;i<15;i++)f.races.update(.05,6000+i*50);
  assert.ok(Math.hypot(models[0].position.x-before.x,models[0].position.z-before.z)>.1);
  f.car.x=models[0].position.x;f.car.z=models[0].position.z;
  f.races.update(.05,7200);
  assert.equal(models[0].visible,true);
  assert.equal(f.races.getPerformance().rivalModelBuilds,3);
  f.races.finish(false,true);
 }finally{f.cleanup()}
});
