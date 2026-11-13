import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installStreetDesignV162} from '../public/ui-skin-v162.js';

function mockClassList(){
 const set=new Set();
 return {toggle(x,force){if(force===undefined? !set.has(x):force)set.add(x);else set.delete(x);return set.has(x)},
  contains:x=>set.has(x),remove:x=>set.delete(x)};
}
function fakeElement(id=''){
 const attrs={};const events={};
 return {id,attributes:attrs,classList:mockClassList(),children:[],nextSibling:null,
  setAttribute(k,v){attrs[k]=String(v)},
  getAttribute(k){return attrs[k]},
  addEventListener(k,fn){events[k]=fn},
  removeEventListener(k,fn){if(events[k]===fn)delete events[k]},
  fire(k,e={}){events[k]?.(e)},
  click(){events.click?.({})},
  append(child){this.children.push(child);child.parent=this},
  insertBefore(child){this.children.push(child);child.parent=this},
  remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);this.parent=null}
 };
}
test('V162 expands optional controls while keeping physical gameplay buttons in place',()=>{
 const fuel=fakeElement('fuelHud'),body=fakeElement('body'),world=fakeElement('world'),track=fakeElement('fuelTrack');
 fuel.querySelector=s=>s==='#fuelTrack'?track:null;
 track.nextSibling=null;
 body.firstChild=null;
 const document={body,createElement:t=>fakeElement(),
  getElementById:id=>({fuelHud:fuel,world})[id]||null};
 const ui=installStreetDesignV162({doc:document});
 assert.equal(ui.enabled,true);
 assert.equal(fuel.children.length,1);
 const toggle=fuel.children[0];
 assert.equal(toggle.id,'v162DriveDetails');
 assert.equal(toggle.attributes['aria-expanded'],'false');
 assert.equal(ui.getExpanded(),false);
 toggle.click();
 assert.equal(ui.getExpanded(),true);
 assert.equal(toggle.attributes['aria-expanded'],'true');
 assert.match(toggle.textContent,/إخفاء/);
 toggle.click();
 assert.equal(ui.getExpanded(),false);
 body.fire('click',{target:{id:'v51CarToggle'}});
 assert.equal(ui.getExpanded(),true);
 body.fire('click',{target:{id:'v51CarClose'}});
 assert.equal(ui.getExpanded(),false);
 ui.setExpanded(true);
 ui.dispose();
 assert.equal(ui.getExpanded(),false);
 assert.equal(fuel.children.length,0);
 assert.equal(body.children.length,0);
});
test('V162 allows graceful operation if game DOM is not ready',()=>{
 assert.equal(installStreetDesignV162({doc:null}).enabled,false);
 assert.equal(installStreetDesignV162({doc:{getElementById:()=>null,createElement(){return {}},body:null}}).enabled,false);
});
test('all important controls and missions remain in document',async()=>{
 const s=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['intro','continueGame','start','newGame','enter','joy','brakePedal',
   'accelerate','reverse','camera','fuelHud','fuelActions','mission','map','jobsBtn','garageBtn','gpsBtn'])
  if(id==='mission')assert.match(s,/class="mission"/);
  else assert.ok(s.includes('id="'+id+'"'),id+' must remain in markup');
 assert.ok(s.includes('street-design-v162.css?v=162.2'));
 assert.ok(s.indexOf('street-design-v162.css')>s.indexOf('royal-hud-v49.css'),'new art direction loads last');
 assert.match(s,/game\.js\?v=171\.0/);
});
test('V162 theme supports thumb targets and fast fallback on weak phones',async()=>{
 const css=await readFile(new URL('../public/street-design-v162.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(orientation:landscape\) and \(max-height:540px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/#v162DriveDetails/);
 assert.match(css,/\.v162-expanded/);
 assert.match(css,/body\.v49-no-actions/);
 assert.match(css,/body\.reference-v47\.v43-photo/);
 assert.match(css,/43px!important/);
 assert.match(css,/body\.royal-v49\.mobile-v51 #v49-quick/);
 assert.match(css,/#v151RaceFab:not\(\[hidden\]\)/);
 assert.match(css,/#v51CarToggle:not\(\[hidden\]\)/);
 assert.ok(!css.includes('filter: blur(30px)'), 'no expensive full-screen Gaussian blur');
});
test('PWA pre-cache contains the new design and interaction module',async()=>{
 const sw=await readFile(new URL('../public/sw-v50.js',import.meta.url),'utf8');
 assert.match(sw,/street-design-v162\.css/);
 assert.match(sw,/ui-skin-v162\.js/);
 assert.match(sw,/egypt-streets-static-v171-open-world/);
});
