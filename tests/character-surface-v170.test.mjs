import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {finishCharacter} from '../public/character-surface-v170.js';

test('fabric finish preserves the skinned mesh and produces finite physical cloth materials',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
 try{
  const scene=new T.Group(),geometry=new T.BufferGeometry();
  const shirt=new T.MeshStandardMaterial({name:'Sam | original top',color:'#34383b'});
  const trousers=new T.MeshStandardMaterial({name:'Sam | original bottom',color:'#304c68'});
  const mesh=new T.SkinnedMesh(geometry,[shirt,trousers]);scene.add(mesh);
  finishCharacter(scene);
  assert.equal(mesh.geometry,geometry);assert.equal(mesh.isSkinnedMesh,true);
  for(const m of mesh.material){assert.ok(m.isMeshPhysicalMaterial);assert.ok(m.bumpMap.isTexture);assert.ok(Number.isFinite(m.sheen));assert.equal(m.metalness,0);assert.equal(m.roughness,.94)}
  assert.equal(mesh.material[0].bumpMap,mesh.material[1].bumpMap);
  assert.equal(mesh.material[0].color.getHex(),0x69704a);assert.equal(mesh.material[1].color.getHex(),0x292c2d);
 }finally{globalThis.document=previous}
});
