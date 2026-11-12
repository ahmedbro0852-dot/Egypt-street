// Run: node --test tests/v112-motion.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacterDynamicsV112} from '../public/character-dynamics-v112.js';
import {createFootstepFXV112} from '../public/footstep-fx-v112.js';

function character(){
 const rotation=()=>({x:0,y:0,z:0});
 const scarf={rotation:rotation()};
 const rig={rotation:rotation(),position:{y:0},getObjectByName(name){return name==='v112ScarfDrape'?scarf:null}};
 const joint=()=>({rotation:rotation()});
 const hero={rotation:rotation(),userData:{rig,leftArm:joint(),rightArm:joint(),leftKnee:joint(),rightKnee:joint(),head:joint(),motionV31:{turn:.8}}};
 return {hero,scarf,rig};
}
function graphics(){
 class Resource{dispose(){this.disposed=true}}
 class Color{setHex(v){this.color=v;return this}}
 class Vec{set(x,y,z){Object.assign(this,{x,y,z});return this}}
 class Obj{constructor(){this.position=new Vec();this.rotation=new Vec();this.scale=new Vec()}updateMatrix(){this.matrix={}}}
 class InstancedMesh{
  constructor(geometry,material,count){this.geometry=geometry;this.material=material;this.count=count;this.userData={};this.instanceMatrix={}}
  setMatrixAt(){}
  setColorAt(){this.instanceColor={}}
 }
 const T={SphereGeometry:Resource,MeshBasicMaterial:Resource,InstancedMesh,Object3D:Obj,Color};
 const objects=[],scene={add(o){objects.push(o)},remove(o){objects.splice(objects.indexOf(o),1)}};
 return {T,scene,objects};
}
test('V112 procedural character gait is bounded, cloth moves and resets',()=>{
 const {hero,rig,scarf}=character();
 const fx=createCharacterDynamicsV112({hero});
 assert.equal(fx.enabled,true);
 for(let i=0;i<20;i++)fx.update({dt:1/60,phase:i*.38,speed:4.8,amount:1,grounded:true,rain:true});
 assert.ok(Number.isFinite(rig.rotation.z));
 assert.ok(Math.abs(scarf.rotation.z+.25)>.005);
 assert.equal(fx.getStatus().cloth,true);
 fx.dispose();
 assert.equal(scarf.rotation.z,-.25);
 assert.equal(hero.userData.leftKnee.rotation.z,0);
 assert.equal(hero.userData.rightKnee.rotation.z,0);
});
test('V112 footstep pool draws once, only while walking on the ground',()=>{
 const {T,scene,objects}=graphics();
 const fx=createFootstepFXV112({T,scene,renderer:{isWebGLRenderer:true},mobile:true});
 assert.equal(fx.enabled,true);
 assert.equal(fx.stats().drawCalls,1);
 const player={position:{x:0,y:0,z:0}};
 fx.update({dt:.04,active:true,player,driving:true,speed:5});
 assert.equal(objects[0].count,0);
 fx.update({dt:.04,active:true,player,driving:false,grounded:true,speed:3});
 player.position.x=.95;
 fx.update({dt:.04,active:true,player,driving:false,grounded:true,speed:3});
 assert.ok(objects[0].count>0);
 for(let i=0;i<17;i++)fx.update({dt:.05,active:true,player,driving:false,grounded:false,speed:0});
 assert.equal(objects[0].count,0);
 fx.dispose();assert.equal(objects.length,0);
});
test('V112 animation gracefully disables without a character rig or WebGL',()=>{
 assert.equal(createCharacterDynamicsV112({hero:{userData:{}}}).enabled,false);
 const {T,scene}=graphics();
 assert.equal(createFootstepFXV112({T,scene,renderer:{isWebGLRenderer:false}}).enabled,false);
});
