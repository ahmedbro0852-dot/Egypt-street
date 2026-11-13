import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../public/three.js';import {applyTaxiDesign3} from '../public/taxi-design-v179.js';
test('selected taxi livery preserves chassis and wheels and is applied only once',()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 try{const root=new T.Group(),chassis=new T.Group(),paint=new T.MeshStandardMaterial({color:'#d7a52f'}),wheel=new T.Group();root.add(chassis,wheel);root.userData={chassis,wheels:[wheel],damagePanels:{paint}};
 const roof=new T.Mesh(new T.BoxGeometry(1,.1,1).translate(0,1.56,0),paint);chassis.add(roof);applyTaxiDesign3(root);const count=chassis.children.length;applyTaxiDesign3(root);
 assert.equal(paint.color.getHex(),0xf5bb23);assert.equal(roof.material.color.getHex(),0x171c21);assert.equal(chassis.children.length,count);assert.equal(root.userData.wheels[0],wheel);assert.equal(wheel.parent,root);
 }finally{globalThis.document=old}
});
