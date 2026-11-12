// Egypt Streets V100 regression suite.
// Run: node --test tests/racing-league-v100.test.mjs (Node 22+)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRaceLeagueV100,pointsForResultV100,tierForPointsV100,
  sanitizeLeagueV100,V100_LEAGUE_KEY
} from '../public/race-league-v100.js';
import { CAIRO_RACES_V31,checkpointProgressV31 } from '../public/cairo-races-v31.js';

const city=CAIRO_RACES_V31.filter(c=>c.world);
test('six navigable world races remain on the paved Cairo grid',()=>{
 assert.equal(city.length,6);
 const vertical=[-60,-30,0,30,60,94,170],horizontal=[-60,-30,0,30,60];
 for(const course of city){
  assert.ok(course.laps>0&&course.points.length>=6);
  const pts=course.points.map(([x,z])=>({x,z}));
  for(let i=0;i<pts.length;i++){
   const a=pts[i],b=pts[(i+1)%pts.length];
   assert.ok((a.x===b.x)!==(a.z===b.z),course.id+' diagonal segment '+i);
   assert.ok(a.x===b.x?vertical.includes(a.x):horizontal.includes(a.z),
     course.id+' leaves the actual paved road grid');
  }
  let steps=0;
  for(let lap=0;lap<course.laps;lap++)for(let i=1;i<=pts.length;i++){
   const p=pts[i%pts.length];
   steps=checkpointProgressV31(pts,p.x,p.z,steps);
  }
  assert.equal(steps,pts.length*course.laps);
 }
});
test('XP only on finished races; levels progress to Legend',()=>{
 assert.equal(pointsForResultV100({completed:false,rank:1,world:true}),0);
 assert.equal(pointsForResultV100({completed:true,rank:1,world:true}),140);
 assert.ok(pointsForResultV100({completed:true,rank:3,world:false})<140);
 assert.equal(tierForPointsV100(0).tier.name,'مبتدئ');
 assert.equal(tierForPointsV100(3200).tier.name,'أسطورة مصر');
 assert.equal(sanitizeLeagueV100({xp:-1,events:{evil:{wins:-1}}}).xp,0);
});
function fixture(){
 const elements=new Map();
 function el(id){
  if(!elements.has(id))elements.set(id,{id,hidden:false,style:{},classList:{toggle(){}},
   setAttribute(){},insertBefore(){},append(){},remove(){},textContent:'',innerHTML:''});
  return elements.get(id);
 }
 const previousDoc=globalThis.document,previousWindow=globalThis.window;
 globalThis.document={hidden:false,body:el('body'),getElementById:el,
  createElement:tag=>el(tag+':'+elements.size),addEventListener(){}};
 globalThis.window={addEventListener(){}};
 const entries=new Map(),storage={
  getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)
 };
 return {el,storage,cleanup(){
  if(previousDoc===undefined)delete globalThis.document;else globalThis.document=previousDoc;
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
 }};
}
test('race navigation starts at the marker and saved league progress survives reload',()=>{
 const f=fixture();
 try{
  let launched=null;const car={x:0,z:0,yaw:0,speed:0};
  const s=createRaceLeagueV100({storage:f.storage,getCourses:()=>city,getRace:()=>null,
   getVehicle:()=>car,getActive:()=>true,getPaused:()=>false,
   startRace:id=>{launched=id;return true}});
  assert.ok(s.navigate(city[0],{x:0,z:0}));
  s.update(500);
  assert.equal(f.el('v100NavAction').disabled,false);
  f.el('v100NavAction').onclick();
  assert.equal(launched,city[0].id);
  s.complete(city[0],true,1,{elapsed:64.5});
  assert.equal(s.getState().xp,140);
  assert.equal(s.getState().events[city[0].id].best,64.5);
  s.complete(city[1],true,2,{elapsed:90});
  assert.equal(s.getState().streak,0);
  s.complete(city[1],false,4,{elapsed:90});
  assert.equal(s.getState().completed,2);
  const saved=JSON.parse(f.storage.getItem(V100_LEAGUE_KEY));
  assert.equal(saved.completed,2);
  const s2=createRaceLeagueV100({storage:f.storage,getCourses:()=>city});
  assert.equal(s2.getState().wins,1);
 }finally{f.cleanup()}
});
