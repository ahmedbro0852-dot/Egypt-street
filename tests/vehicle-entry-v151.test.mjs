// V151: a player can enter a nearby street car or motorbike of any color.
// Existing garage items remain unaffected and saves stay backwards-compatible.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nearestRideV151,rideKindV151,RIDE_RADIUS_V151} from '../public/vehicle-entry-v151.js';
import {sanitizeSnapshot} from '../public/game-save-v55.js';
const v=(x,z,id,visible=true)=>({position:{x,y:0,z},visible,userData:{streetRideKind:id}});
test('nearest ride is selected by distance, not yellow taxi identity',()=>{
 const taxi=v(5.5,0,'taxi'),red=v(2,0,'sedan'),bike=v(3,0,'motorbike');
 assert.equal(nearestRideV151({player:{x:0,z:0},vehicles:[taxi,bike,red]}),red);
 assert.equal(nearestRideV151({player:{x:0,z:0},vehicles:[taxi,bike,red],radius:2.5}),red);
 assert.equal(RIDE_RADIUS_V151,6);
});
test('invisible, distant and invalid entries cannot be driven',()=>{
 const far=v(9,0,'sport'),hidden=v(1,0,'sedan',false);
 assert.equal(nearestRideV151({player:{x:0,z:0},vehicles:[far,hidden]}),null);
 assert.equal(nearestRideV151({player:{x:0,z:0},vehicles:[null,{position:{x:NaN,z:1}}]}),null);
 assert.equal(nearestRideV151({player:{x:NaN,z:0},vehicles:[far]}),null);
 assert.equal(rideKindV151(v(0,0,'motorbike')),'motorbike');
 assert.equal(rideKindV151(v(0,0,'sport')),'sport');
});
const base={version:1,player:{x:0,z:0,yaw:0},taxi:{x:2,z:8,yaw:.2},
 money:250,mission:{completed:0,target:{x:62,z:-50}}};
test('street vehicle and original parked taxi persist through save sanitization',()=>{
 const one=sanitizeSnapshot({...base,streetRide:{index:7,kind:'motorbike'},
  taxiPark:{x:-10,z:12,yaw:1.5}});
 assert.deepEqual(one.streetRide,{index:7,kind:'motorbike'});
 assert.deepEqual(one.taxiPark,{x:-10,z:12,yaw:1.5});
 assert.deepEqual(sanitizeSnapshot(one).streetRide,one.streetRide);
 assert.equal(sanitizeSnapshot(base).streetRide,null);
 assert.equal(sanitizeSnapshot({...base,streetRide:{index:300,kind:'sedan'}}).streetRide,null);
 assert.equal(sanitizeSnapshot({...base,streetRide:{index:3,kind:'invalid'}}).streetRide.kind,'sedan');
});
test('game code takes the actual nearby world vehicle without taxi-only restrictions',async()=>{
 const text=await readFile(new URL('../public/game.js',import.meta.url),'utf8');
 assert.match(text,/const candidate=nearbyRideV151\(\)/);
 assert.match(text,/chooseRideV151\(candidate\)/);
 assert.match(text,/traffic\.splice\(index,1\)/);
 assert.doesNotMatch(text,/قرب من العربية الصفرا الأول/);
});
