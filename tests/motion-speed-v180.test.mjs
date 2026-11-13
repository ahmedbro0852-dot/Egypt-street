import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../public/three.js';
import {updateCharacterPose} from '../public/character-pose-v180.js';
import {createVehiclePhysics,stepVehiclePhysics} from '../public/vehicle-physics.js';
import {getVehicleDynamicsV19} from '../public/vehicle-dynamics-v19.js';
import {VEHICLES_V8} from '../public/garage-v8.js';
test('jump transitions to landing absorption then settles without scaling the skeleton',()=>{
 const state={air:0,landing:0,wasGrounded:true};const bones=Object.fromEntries(['thigh_l','calf_l','spine_02'].map(n=>[n,new T.Bone()]));
 for(let i=0;i<20;i++)updateCharacterPose(state,bones,{dt:1/60,grounded:false,vertical:2});
 assert.ok(state.air>.9);updateCharacterPose(state,bones,{dt:1/60,grounded:true});assert.ok(state.landing>.08);
 for(let i=0;i<120;i++){for(const b of Object.values(bones))b.quaternion.identity();updateCharacterPose(state,bones,{dt:1/60,grounded:true,speed:NaN,clock:NaN})}
 assert.ok(state.air<1e-5);assert.ok(state.landing<1e-5);
 for(const b of Object.values(bones)){assert.deepEqual(b.scale.toArray(),[1,1,1]);assert.ok(b.quaternion.toArray().every(Number.isFinite))}
});
test('upgraded taxi reaches 180 km/h on a dry straight and ABS brings it to rest',()=>{
 const spec=VEHICLES_V8.find(v=>v.id==='taxi');const tuning={...getVehicleDynamicsV19('taxi'),topSpeed:spec.top,engineScale:spec.engine,brakeScale:spec.brake};
 const p=createVehiclePhysics();for(let i=0;i<3600;i++)stepVehiclePhysics(p,{throttle:1,grip:1,tuning},1/60);
 assert.ok(p.speed>49&&p.speed<=50);for(let i=0;i<600;i++)stepVehiclePhysics(p,{brake:true,absEnabled:true,grip:1,tuning},1/60);
 assert.ok(Math.abs(p.speed)<.1);assert.ok(Object.values(p).filter(v=>typeof v==='number').every(Number.isFinite));
});
