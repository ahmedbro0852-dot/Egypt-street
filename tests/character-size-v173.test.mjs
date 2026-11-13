import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {fitCharacter} from '../public/character-size-v173.js';
test('centimeter assets stay human-sized after animation rewrites their root scale',()=>{
 const model=new T.Group();model.scale.setScalar(.01);
 const mesh=new T.Mesh(new T.BoxGeometry(60,180,30));mesh.position.y=90;model.add(mesh);
 const fitted=fitCharacter(model);
 const mixer=new T.AnimationMixer(model);
 mixer.clipAction(new T.AnimationClip('Idle',1,[new T.VectorKeyframeTrack('.scale',[0,1],[.01,.01,.01,.01,.01,.01])])).play();
 for(let i=0;i<60;i++)mixer.update(1/60);
 const bounds=new T.Box3().setFromObject(fitted);
 assert.ok(Math.abs(bounds.max.y-bounds.min.y-1.72)<1e-6);
 assert.ok(Math.abs(bounds.min.y)<1e-6);
});
test('invalid empty character is rejected',()=>assert.throws(()=>fitCharacter(new T.Group()),/Invalid/));
