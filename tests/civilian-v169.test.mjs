import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('civilian asset has local skin, real face/hair, clothing and usable locomotion clips',async()=>{
 const b=await readFile(new URL('../public/models/civilian-v169.glb',import.meta.url));assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);
 const n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n).toString());assert.ok(g.skins.length>0);assert.match(g.asset.copyright,/CC0/);
 assert.deepEqual(g.animations.map(a=>a.name).sort(),['Idle','Run','Walk']);
 assert.ok(g.meshes.some(m=>/short01/.test(m.name)),'hair mesh exists');assert.ok(g.meshes.some(m=>/casualsuit/.test(m.name)),'civilian clothes exist');assert.ok(!g.meshes.some(m=>/vanguard|visor/i.test(m.name)),'military mesh removed');
 for(const a of g.animations)for(const c of a.channels){assert.ok(c.target.node<g.nodes.length);const sampler=a.samplers[c.sampler];assert.ok(g.accessors[sampler.input].count>1);assert.ok(g.accessors[sampler.output].count>1)}
 const triangles=g.meshes.flatMap(m=>m.primitives).reduce((s,p)=>s+g.accessors[p.indices].count/3,0);assert.ok(triangles<65000);assert.ok(b.length<4e6);
 const binaryStart=28+n;for(const view of g.bufferViews)assert.ok(binaryStart+(view.byteOffset||0)+view.byteLength<=b.length);
 const source=await readFile(new URL('../public/street-character-v166.js',import.meta.url),'utf8');assert.match(source,/\.\/models\/civilian-v169\.glb/);assert.ok(!source.includes('Soldier.glb'));
});
