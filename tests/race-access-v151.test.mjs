// V151 regression: race control stays visible on touch devices in Compact mode.
// Run: node --experimental-default-type=module --test tests/race-access-v151.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installMobileLiteV51} from '../public/mobile-lite-v51.js';
class FakeElement{
 constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.style={};this.id='';this.innerHTML='';this.textContent='';
 this.attrs={};this.classList={add(){},remove(){}}}
 append(...children){this.children.push(...children)}
 remove(){this.removed=true}
 setAttribute(k,v){this.attrs[k]=v}
}
function setup(){
 const previousDocument=globalThis.document,previousWindow=globalThis.window,
       previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const elements=[];
 globalThis.document={
  body:new FakeElement('body'),head:new FakeElement('head'),
  createElement(tag){const node=new FakeElement(tag);elements.push(node);return node},
  getElementById(id){return elements.find(x=>x.id===id)||null}
 };
 globalThis.window={matchMedia:()=>({matches:true}),innerWidth:390};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{maxTouchPoints:5,deviceMemory:2,hardwareConcurrency:4}});
 function cleanup(){
  if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);
  else delete globalThis.navigator;
 }
 return {elements,cleanup};
}
test('Compact UI cannot hide the V151 independent race control',()=>{
 const t=setup();let active=false,racing=false,opens=0;
 try{
  const mobile=installMobileLiteV51({
   getActive:()=>active,getDriving:()=>false,getSpeed:()=>0,
   getRacing:()=>racing,openRaces:()=>{opens++}
  });
  assert.equal(mobile.enabled,true);
  const button=t.elements.find(x=>x.id==='v151RaceFab');
  assert.ok(button);
  assert.equal(button.hidden,true);
  assert.match(button.innerHTML,/السباقات/);
  const style=globalThis.document.head.children.map(x=>x.textContent).join('\n');
  assert.match(style,/body\.mobile-v51 #v151RaceFab\{/);
  assert.match(style,/body\.mobile-v51 #v151RaceFab\[hidden\]\{display:none!important\}/);
  active=true;mobile.update(500);
  assert.equal(button.hidden,false);
  button.onclick();assert.equal(opens,1);
  racing=true;mobile.update(900);assert.equal(button.hidden,true);
  button.onclick();assert.equal(opens,1);
  active=false;racing=false;mobile.update(1300);assert.equal(button.hidden,true);
  mobile.dispose();assert.equal(button.removed,true);
 }finally{t.cleanup()}
});
test('world race categories show before circuit events',()=>{
 const source=readFileSync(new URL('../public/cairo-races-v31.js',import.meta.url),'utf8');
 assert.match(source,/sort\(\(a,b\)=>Number\(b\.world\)-Number\(a\.world\)\)/);
 assert.match(source,/سباقات العالم المفتوح/);
 assert.match(source,/تحديات الحلبة/);
});
test('game passes an actual race-opener callback to mobile shortcut',()=>{
 const game=readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
 assert.match(game,/openRaces:\(\)=>raceSystem\?\.openPanel\(\)/);
 assert.match(game,/getRacing:\(\)=>!!raceSystem\?\.isRunning\(\)/);
});
