// Egypt Streets V150: verify the complete browser ESM graph and offline shell.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const importsRE=/(?:^|\n)\s*import\s*(?:[^'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/g;
async function graph(entry='game.js'){
 const visited=new Set(),missing=[];
 async function visit(relative){
  if(visited.has(relative))return;
  visited.add(relative);
  let source;
  try{source=await readFile(path.join(root,relative),'utf8')}
  catch{missing.push(relative);return}
  const imports=[...source.matchAll(importsRE)].map(match=>match[1]);
  for(const imported of imports){
   if(!imported.startsWith('./'))continue;
   const next=path.posix.normalize(path.posix.join(path.posix.dirname(relative),
    imported.split('?')[0].split('#')[0].slice(2)));
   await visit(next);
  }
 }
 await visit(entry);
 return {visited,missing};
}
test('V150 game graph has no missing ES module dependency',async()=>{
 const {visited,missing}=await graph();
 assert.deepEqual(missing,[]);
 assert.ok(visited.has('city-sculpt-v60.js'));
 assert.ok(visited.has('mobile-palms-v60.js'));
 assert.ok(visited.has('race-opponents-v150.js'));
});
test('PWA pre-cache includes every reachable game script',async()=>{
 const {visited,missing}=await graph();
 assert.deepEqual(missing,[]);
 const worker=await readFile(path.join(root,'sw-v50.js'),'utf8');
 const shellMatch=worker.match(/const SHELL=(\[[^\n]+\]);/);
 assert.ok(shellMatch,'service worker must have a literal shell array');
 const cached=new Set(JSON.parse(shellMatch[1]).map(name=>name.replace(/^\.\//,'')));
 const uncached=[...visited].filter(name=>!cached.has(name));
 assert.deepEqual(uncached,[],'offline shell is missing imported scripts');
 // The offline cache must advance when game assets change, not stay on V150.
 assert.match(worker,/const CACHE='egypt-streets-static-v(?:15[1-9]|1[6-9]\\d|[2-9]\\d{2})-[^']+';/);
});
test('entry document references the current V150 game script',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const gameTag=html.match(/game\.js\?v=(\d+)(?:\.(\d+))?/);
 assert.ok(gameTag&&Number(gameTag[1])>=150,'game script must be version 150 or newer');
 assert.match(html,/race-league-v100\.css\?v=150\.0/);
});
