// Run: node --test tests/v111-entry-smoke.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=resolve(root,'public/game.js');
const content=readFileSync(file,'utf8');
const matches=[...content.matchAll(/^\s*import\s+[^\n]*?from\s+['"]([^'"]+)['"]/gm)];
test('V111 game entrypoint contains no broken static import paths',()=>{
 assert.ok(matches.length>30,'expected game module imports');
 const missing=[];
 for(const [,request] of matches){
  if(!request.startsWith('.'))continue;
  const clean=request.split('?')[0];
  const path=resolve(dirname(file),clean);
  if(!existsSync(path))missing.push(clean);
 }
 assert.deepEqual(missing,[],'Missing modules block the whole game');
});
test('V111 HTML and offline cache reference the new visuals',()=>{
 const html=readFileSync(resolve(root,'public/index.html'),'utf8');
 const serviceWorker=readFileSync(resolve(root,'public/sw-v50.js'),'utf8');
 assert.match(html,/game\.js\?v=111\.0/);
 assert.match(html,/V111 3D WORLD/);
 for(const name of ['city-sculpt-v60.js','mobile-palms-v60.js','vehicle-details-v111.js']){
  assert.ok(existsSync(resolve(root,'public',name)),name+' missing');
  assert.ok(serviceWorker.includes(name),name+' absent from offline cache');
 }
});
