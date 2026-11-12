import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {KENNEY_CAR_URLS_V157,normalizeKenneyBoundsV157,createKenneyCarVisualsV157}
 from '../public/kenney-car-visuals-v157.js';
import {CANNON_ES_V157,STREET_PROP_LAYOUT_V157,createStreetRigidBodiesV157}
 from '../public/external-physics-v157.js';
import {readFile} from 'node:fs/promises';

test('CC0 Kenney assets are pinned, budgeted and correctly normalized',()=>{
 const variants=['taxi','sedan','sport','suv'];
 for(const key of variants){
  assert.match(KENNEY_CAR_URLS_V157[key],/3ddcc695adbba9fb918cf31b7c139b3f95b76910\/packs\/car-kit\/[^/]+\.glb$/);
 }
 const norm=normalizeKenneyBoundsV157({x:2,y:1.4,z:4},{x:-1,y:-.3,z:-2});
 assert.ok(norm.scale>0&&norm.scale<=1.1);
 assert.ok(Number.isFinite(norm.offsetX)&&Number.isFinite(norm.offsetY));
});
test('Kenney scene replaces the simple body and preserves its fallback',async()=>{
 const root=new T.Group(),chassis=new T.Group(),original=new T.Mesh(
  new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());
 root.add(chassis);chassis.add(original);root.userData.chassis=chassis;root.userData.wheels=[];
 const gltf=new T.Group();gltf.add(new T.Mesh(new T.BoxGeometry(1.8,1.5,4),new T.MeshStandardMaterial()));
 let loads=0;
 const models=createKenneyCarVisualsV157({enabled:true,maxCars:1,
  loader:{loadAsync:async()=>{loads++;return {scene:gltf}}}});
 const parent=new T.Group();parent.add(root);
 assert.equal(models.attach(root,'sedan'),true);
 assert.equal(models.attach(root,'sedan'),false);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,1);assert.equal(original.visible,false);
 assert.equal(root.userData.kenneyModelV157.type,'sedan');
 assert.equal(models.getStats().loaded,1);
 assert.equal(models.getStats().requested,1);
 assert.equal(models.attach(new T.Group(),'taxi'),false);
});
test('Kenney loading failure keeps original car visible',async()=>{
 const root=new T.Group(),chassis=new T.Group();
 root.add(chassis);root.userData.chassis=chassis;root.userData.wheels=[];
 const g=new T.Group();g.add(root);
 const visuals=createKenneyCarVisualsV157({enabled:true,loader:{loadAsync:async()=>{throw Error('offline')}}});
 visuals.attach(root,'taxi');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(root.userData.kenneyModelV157,undefined);
 assert.match(visuals.getStats().lastError,/offline/);
});
test('street rigid body layout bounded for mobile and package pinned',()=>{
 assert.equal(STREET_PROP_LAYOUT_V157.length,12);
 assert.match(CANNON_ES_V157,/cannon-es@0\.20\.0\/\+esm$/);
 const coords=new Set(STREET_PROP_LAYOUT_V157.map(([x,z])=>x+','+z));
 assert.equal(coords.size,STREET_PROP_LAYOUT_V157.length);
});
function fakeCannon(){
 class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
 class Body{
  static KINEMATIC=4;
  constructor(opts={}){this.position=opts.position||new V;this.velocity=new V;
   this.quaternion={setFromEuler(){},setFromAxisAngle(){},x:0,y:0,z:0,w:1};this.shape=opts.shape}
  sleep(){}
 }
 class Box{constructor(v){this.size=v}}
 class Plane{}
 class Cylinder{}
 class World{
  constructor(o){this.gravity=o.gravity;this.solver={iterations:4};this.defaultContactMaterial={};this.added=[];this.steps=0}
  addBody(o){this.added.push(o)}
  step(){this.steps++}
 }
 class SAPBroadphase{constructor(world){this.world=world}}
 return {World,SAPBroadphase,Body,Box,Plane,Cylinder,Vec3:V};
}
test('cannon-es initializes actual bodies only when activated and syncs meshes',async()=>{
 const scene=new T.Scene();
 const props=createStreetRigidBodiesV157({T,scene,maxProps:3,mobile:true,loadEngine:async()=>fakeCannon()});
 assert.equal(props.getStats().status,'idle');
 assert.equal(props.start(),true);
 assert.equal(props.start(),false);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(props.getStats().status,'ready');
 assert.equal(props.getStats().count,3);
 props.update(.016,{active:true,driving:true,position:{x:1,z:2},speed:11,yaw:.3});
 assert.ok(props.getStats().steps>0);
 assert.ok(scene.children.length>=3);
 props.dispose();
 assert.equal(props.getStats().status,'disposed');
});
test('unavailable external physics falls back without breaking game',async()=>{
 const scene=new T.Scene();
 const props=createStreetRigidBodiesV157({T,scene,maxProps:4,loadEngine:async()=>{throw Error('network offline')}});
 props.start();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(props.getStats().status,'fallback');
 assert.match(props.getStats().error,/network offline/);
 assert.doesNotThrow(()=>props.update(.033,{active:true,driving:true,position:{x:0,z:0}}));
});
test('the main game actually wires licensed models and rigid-body simulation',async()=>{
 const game=await readFile(new URL('../public/game.js',import.meta.url),'utf8');
 assert.match(game,/vehicleVisualsV161\.attach\(activeVehicle/);
 assert.match(game,/worldPhysicsV161\.update\(dt/);
 assert.match(game,/vehicleVisualsV161\.updateWheels\(activeVehicle/);
 assert.match(game,/maxCars:isMobileOptimized\?3:8/);
});
