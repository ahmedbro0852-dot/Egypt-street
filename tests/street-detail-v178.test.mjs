import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {installStreetDetailV178} from '../public/street-detail-v178.js';
test('street props stay outside the carriageway and share a small fixed batch budget',()=>{
 const previous=globalThis.document;
 const context=new Proxy({},{get:()=>()=>{}});
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 try{
  const scene=new T.Scene(),solids=[];
  const detail=installStreetDetailV178({T,scene,solids});
  assert.equal(detail.stats().drawCalls,7);assert.ok(detail.stats().props>500);
  for(const prop of solids){
   for(const center of [-60,-30,0,30,60])assert.ok(Math.abs(prop.x-center)-prop.w>5.5);
   for(const center of [-60,-30,0,30,60])assert.ok(Math.abs(prop.z-center)-prop.d>5.5);
  }
  const m=new T.Matrix4();
  for(const mesh of scene.children){
   for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite))}
   assert.ok(mesh.boundingSphere.radius>0);
   if(mesh.name.startsWith('Street signs'))for(const value of mesh.geometry.attributes.uv.array)assert.ok(value>=0&&value<=1);
  }
  detail.dispose();assert.equal(scene.children.length,0);
 }finally{globalThis.document=previous}
});
