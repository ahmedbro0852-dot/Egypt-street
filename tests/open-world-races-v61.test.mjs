// V61 lightweight world-race route and anti-shortcut regression tests.
// Run: node --test tests/open-world-races-v61.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { CAIRO_RACES_V31, checkpointProgressV31, rankRacersV31 } from '../public/cairo-races-v31.js';

const openWorld=CAIRO_RACES_V31.filter(course=>course.world);
const axis=(a,b)=>Math.abs(a-b)<.001;
const rows=[-60,-30,0,30,60],columns=[-60,-30,0,30,60,94,170];

test('three city championships coexist with original closed-track races',()=>{
 assert.equal(openWorld.length,3);
 assert.ok(CAIRO_RACES_V31.some(c=>!c.world&&c.kind==='drift'));
 assert.ok(CAIRO_RACES_V31.some(c=>!c.world&&c.kind==='timeattack'));
 assert.ok(openWorld.every(c=>c.laps>=1&&c.reward>0&&c.points.length>=6));
});

test('each checkpoint path follows aligned existing Cairo streets or Nile bridges',()=>{
 for(const course of openWorld){
  for(let i=0;i<course.points.length;i++){
   const [x,z]=course.points[i];
   const [nextX,nextZ]=course.points[(i+1)%course.points.length];
   const vertical=axis(x,nextX),horizontal=axis(z,nextZ);
   assert.notEqual(vertical,horizontal,course.id+' segment '+i+' must be orthogonal');
   const valid=vertical?columns.some(c=>axis(c,x)):rows.some(c=>axis(c,z));
   assert.ok(valid,course.id+' has an unsupported street segment '+i);
   assert.ok(Math.abs(x)<218&&Math.abs(z)<168,course.id+' leaves navigable city');
  }
 }
});

test('checkpoint progression is sequential, no shortcuts through later gates',()=>{
 for(const course of openWorld){
  const points=course.points.map(([x,z])=>({x,z}));
  const first=points[0],later=points[Math.min(3,points.length-1)];
  assert.equal(checkpointProgressV31(points,later.x,later.z,0),0);
  assert.equal(checkpointProgressV31(points,first.x,first.z,0),0);
  let steps=0;
  for(let lap=0;lap<course.laps;lap++){
   for(let i=1;i<=points.length;i++){
    const next=points[i%points.length];
    steps=checkpointProgressV31(points,next.x,next.z,steps);
   }
  }
  assert.equal(steps,points.length*course.laps);
 }
});

test('leaderboard ranks racers by distance progress and then elapsed time',()=>{
 const entries=[{name:'A',progress:5,time:22},{name:'B',progress:6,time:30},{name:'C',progress:5,time:19}];
 assert.deepEqual(rankRacersV31(entries).map(x=>x.name),['B','C','A']);
});
