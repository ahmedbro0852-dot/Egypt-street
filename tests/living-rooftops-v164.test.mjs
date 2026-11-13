import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {installLivingRooftopsV164} from '../public/living-rooftops-v164.js';
test('rooftop animation stays finite, pauses, respects reduced motion and disposes',()=>{
 const scene=new T.Scene();
 for(let i=0;i<30;i++){const wall=new T.Mesh(new T.BoxGeometry(9.5,16,18));wall.position.set(i*12,8,15);scene.add(wall)}
 const preference={matches:false};
 const system=installLivingRooftopsV164({T,scene,renderer:{isWebGLRenderer:true},mobile:true,reducedMotion:preference});
 assert.deepEqual(system.stats(),{enabled:true,roofs:8,birds:8,drawCalls:3});
 const birds=scene.getObjectByName('V164 circling birds');
 const before=Array.from(birds.instanceMatrix.array);system.update(.04);
 assert.notDeepEqual(Array.from(birds.instanceMatrix.array),before);
 const moving=Array.from(birds.instanceMatrix.array);system.update(.04,{paused:true});assert.deepEqual(Array.from(birds.instanceMatrix.array),moving);
 preference.matches=true;system.update(.04);assert.deepEqual(Array.from(birds.instanceMatrix.array),moving);
 for(const mesh of scene.children.filter(o=>o.isInstancedMesh))assert.ok(Array.from(mesh.instanceMatrix.array).every(Number.isFinite));
 system.dispose();assert.equal(scene.children.length,30);
});
test('software renderer skips rooftop effects',()=>{assert.equal(installLivingRooftopsV164({renderer:{}}).stats().enabled,false)});
