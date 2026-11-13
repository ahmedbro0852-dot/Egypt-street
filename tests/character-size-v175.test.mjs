import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../public/three.js';
import {GLTFLoader} from '../public/GLTFLoader.js';
import {fitCharacter} from '../public/character-size-v175.js';

test('actual civilian stays human-sized through idle, walking and running',async()=>{
 const b=await readFile(new URL('../public/models/civilian-v169.glb',import.meta.url));
 const n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n));
 // Keep the actual geometry, skin, transforms and animations; omit only GPU
 // image decoding so the asset-level regression can run without a browser.
 for(const m of g.materials){delete m.normalTexture;delete m.occlusionTexture;delete m.emissiveTexture;
  if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture}}
 delete g.images;delete g.textures;
 g.buffers[0].uri='data:application/octet-stream;base64,'+b.subarray(28+n).toString('base64');
 const previous=globalThis.ProgressEvent;
 globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,props)}};
 try{
  const gltf=await new GLTFLoader().parseAsync(JSON.stringify(g),'');
  const fitted=fitCharacter(gltf.scene),mixer=new T.AnimationMixer(gltf.scene);
  for(const name of ['Idle','Walk','Run']){
   mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name===name)).play();
   for(let i=0;i<12;i++){
    mixer.update(.1);fitted.updateMatrixWorld(true);
    gltf.scene.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox()}});
    const bounds=new T.Box3().setFromObject(fitted),height=bounds.max.y-bounds.min.y;
    assert.ok(height>1.5&&height<1.85,`${name}: ${height}m`);
    assert.ok(Math.abs(bounds.min.y)<.12,`${name}: feet ${bounds.min.y}m`);
   }
  }
 }finally{globalThis.ProgressEvent=previous}
});
