// Run: node --test tests/v153-character-entry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pub=resolve(root,'public');
const read=p=>readFileSync(resolve(pub,p),'utf8');
const game=read('game.js'),crowd=read('egyptian-crowd.js');
test('V153 preserves all V152 professional races and available vehicle controls',()=>{
 assert.match(game,/race-league-v100\.js/);
 assert.match(game,/cairo-races-v31\.js/);
 assert.match(game,/vehicle-entry-v151\.js/);
 assert.match(game,/createCharacterDynamicsV112\(/);
 assert.match(game,/heroPresenceV112\.update\(/);
 assert.match(crowd,/animateCitizenStrideV112\(/);
});
test('every static import in the V153 entry and crowd exists',()=>{
 const missing=[];
 for(const name of ['game.js','egyptian-crowd.js']){
  const body=read(name);
  for(const match of body.matchAll(/^\s*import\s+[^\n]*?from\s+['"]([^'"]+)['"]/gm)){
   const spec=match[1].split('?')[0];
   if(!spec.startsWith('.'))continue;
   const candidate=resolve(pub,spec);
   if(!existsSync(candidate))missing.push(name+': '+spec);
  }
 }
 assert.deepEqual(missing,[],'Broken relative imports can prevent the game from launching');
});
test('versioning and offline caching include every character module',()=>{
 const html=read('index.html'),sw=read('sw-v50.js');
 assert.match(html,/game\.js\?v=153\.1/);
 assert.match(html,/V153 LIVING CHARACTERS/);
 assert.match(sw,/egypt-streets-static-v153-living-characters-2/);
 for(const file of ['character-dynamics-v112.js','footstep-fx-v112.js',
  'hero-presence-v112.js','citizen-behavior-v112.js','citizen-locomotion-v112.js']){
  assert.ok(existsSync(resolve(pub,file)),file+' not found');
  assert.ok(sw.includes(file),file+' not precached');
 }
});
