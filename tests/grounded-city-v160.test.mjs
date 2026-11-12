import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {installGroundedCityV160} from '../public/grounded-city-v160.js';
const context={fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createRadialGradient(){return {addColorStop(){}}}};
test('V160 remains inert without WebGL',()=>{
 const system=installGroundedCityV160({renderer:{}});system.update();assert.equal(system.stats().enabled,false);
});
test('V160 bounds draw calls, textures only masonry, follows actors and releases resources',()=>{
 globalThis.document={createElement:()=>({getContext:()=>context})};
 const scene=new T.Scene(),material=new T.MeshLambertMaterial({color:0xbbaa88});
 const wall=new T.Mesh(new T.BoxGeometry(10,18,10),material),window=new T.Mesh(new T.BoxGeometry(1,2,.1),material);scene.add(wall,window);
 const actor=new T.Group();actor.position.set(5,0,8);actor.rotation.y=.8;
 const system=installGroundedCityV160({T,scene,renderer:{isWebGLRenderer:true},mobile:true,getActors:()=>Array(100).fill(actor)});
 assert.equal(system.stats().drawCalls,4);assert.equal(system.stats().walls,1);assert.ok(wall.material.map);assert.equal(window.material.map,null);assert.ok(wall.material.isMeshLambertMaterial);
 system.update();const shadows=scene.getObjectByName('V160 pooled contact shadows');assert.equal(shadows.count,32);
 const matrix=new T.Matrix4(),position=new T.Vector3();shadows.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.equal(position.x,5);assert.equal(position.z,8);
 actor.position.x=10;system.update();shadows.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.equal(position.x,10);
 system.dispose();assert.equal(scene.children.length,2);delete globalThis.document;
});
