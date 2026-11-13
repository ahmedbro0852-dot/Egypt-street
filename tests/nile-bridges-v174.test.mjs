import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {createNileBridges,NILE_BRIDGE_CENTERS} from '../public/nile-bridges-v174.js';
import {createRealisticRoads} from '../public/roads-realism-v17.js';
test('three bridge structures share four batches and keep the driving corridor free',()=>{
 const scene=new T.Scene(),solids=[];
 const bridge=createNileBridges({T,scene,solids});
 assert.equal(bridge.stats.drawCalls,4);assert.equal(bridge.stats.bridges,3);
 assert.equal(solids.length,6);
 const matrix=new T.Matrix4();
 for(const mesh of bridge.meshes){assert.ok(mesh.boundingSphere.radius>0);for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite))}}
 for(const z of NILE_BRIDGE_CENTERS){
  assert.ok(solids.some(s=>s.z===z+6.95));assert.ok(solids.some(s=>s.z===z-6.95));
  for(const s of solids)assert.ok(Math.abs(s.z-z)-s.d>5.7,'rails never obstruct the existing lanes');
 }
});
test('bridge asphalt stays continuous over both Corniche crossings and the river',()=>{
 const old=globalThis.document;
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 try{
  const scene=new T.Scene(),roads=createRealisticRoads({T,scene,mobileLite:true});
  const asphalt=scene.children[0],ray=new T.Raycaster();
  for(const z of NILE_BRIDGE_CENTERS)for(const x of [88,94,100,110,132,160,170,176]){
   ray.set(new T.Vector3(x,3,z),new T.Vector3(0,-1,0));
   const hit=ray.intersectObject(asphalt)[0];assert.ok(hit,`missing asphalt at ${x},${z}`);
   assert.ok(Math.abs(hit.point.y-.405)<1e-5);
   assert.equal(roads.surfaceAt(x,z).roadType,'bridge');
  }
  roads.dispose();
 }finally{globalThis.document=old}
});
