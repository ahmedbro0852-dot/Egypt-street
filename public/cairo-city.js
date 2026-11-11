// Extra Cairo environment for the existing Three.js game.
// Procedural geometry & texture atlases: deliberately light on mobile downloads.
export function installCairo(T,scene,box,sign,solids){
let seed=7431;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647};
const material=c=>new T.MeshLambertMaterial({color:c});
const palettes=['#d2bda0','#bfa98c','#c8c2b2','#ddd0b7','#b7b8aa','#ba9a7c'];
const facades=[];
for(let style=0;style<6;style++){
 const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');
 g.fillStyle=palettes[style];g.fillRect(0,0,256,512);
 for(let n=0;n<90;n++){g.fillStyle=n%2?'#ffffff12':'#5f524010';g.fillRect(random()*256,random()*512,4+random()*24,2+random()*5)}
 for(let floor=0;floor<5;floor++){
  let y=10+floor*100;g.fillStyle='#d7c6ac';g.fillRect(0,y+85,256,9);g.fillStyle='#887965';g.fillRect(0,y+90,256,3);
  for(let col=0;col<3;col++){
   let x=9+col*84;
   g.fillStyle='#84705e';g.fillRect(x-3,y,68,73);g.fillStyle='#e4d2b6';g.fillRect(x,y,62,69);
   g.fillStyle='#435a65';g.fillRect(x+5,y+4,52,60);
   g.fillStyle='#728a8c';g.fillRect(x+8,y+6,19,50);
   g.fillStyle='#c2c8b8';g.fillRect(x+29,y+4,3,60);
   g.fillStyle='#7d7369';g.fillRect(x-3,y+70,68,7);
   for(let j=0;j<6;j++){g.fillStyle='#514943';g.fillRect(x+j*11,y+75,2,13);}
   if((floor+col+style)%7===0){g.fillStyle='#e4dfd1';g.fillRect(x+32,y+28,27,20);g.fillStyle='#7b8887';g.fillRect(x+36,y+31,15,14)}
  }
 }
 const tex=new T.CanvasTexture(c);tex.anisotropy=2;facades.push(new T.MeshLambertMaterial({map:tex,side:T.DoubleSide}));
}
function front(x,z,w,h,d,i){
 const p=new T.Mesh(new T.PlaneGeometry(w-.22,Math.max(1,h-2.4)),facades[i%6]);
 p.position.set(x,(h+2.4)/2,z+d/2+.09);scene.add(p);
}
const original=scene.children.filter(o=>o.isMesh&&o.geometry?.parameters?.width===9.5&&o.geometry?.parameters?.depth===18);
original.forEach((o,i)=>front(o.position.x,o.position.z,9.5,o.geometry.parameters.height,18,i));
function building(x,z,i){
 const h=12+Math.floor(random()*5)*3,w=12+Math.floor(random()*3)*2,d=15;
 box(x,h/2,z,w,h,d,palettes[i%palettes.length]);
 box(x,h+.26,z,w+.6,.52,d+.6,'#ddcdb4');
 box(x,1.45,z+d/2+.08,w-1,2.7,.20,i%2?'#396b65':'#8d5939');
 box(x,.20,z+d/2+1.4,w+2,.33,2.7,'#b8a68e');
 front(x,z,w,h,d,i);
 solids.push({x,z,w:w/2+.6,d:d/2+.5});
}
for(const z of [-115,113])for(let i=0;i<8;i++){
 const x=-119+i*27;if(x>73)continue;building(x,z,i+Math.abs(z));
}
for(const z of [-153,153])for(let i=0;i<5;i++)building(-116+i*41,z,i+4);
for(const z of [-133,-93,93,133]){
 box(-17,.015,z,265,.11,10.8,'#525a5b');
 // Lane stripes are now batched by the road realism module.
}
for(const x of [-139,-95,84]){
 box(x,.015,0,10,.11,340,'#50595b');
}
// Nile water and both paved riverbank promenades.
box(131,-.025,0,52,.12,366,'#236b81');
const river=new T.Mesh(new T.PlaneGeometry(52,366),new T.MeshLambertMaterial({color:'#2e8795',transparent:true,opacity:.91}));
river.rotation.x=-Math.PI/2;river.position.set(131,.055,0);river.userData.skipFallback=true;scene.add(river);
for(let k=0;k<30;k++){box(108+random()*46,.074,-175+random()*350,1.3+random()*2,.008,.14,'#6da8b1')}
box(94,.025,0,11,.13,345,'#555d60');box(101,.15,0,3,.22,346,'#d0c5ac');
box(161,.15,0,3,.22,346,'#d0c5ac');box(170,.02,0,11,.13,345,'#555d60');
for(const z of [-60,0,60]){
 box(132,.22,z,91,.36,11.5,'#8b8580');
 for(const dz of [-5.5,5.5])box(132,.60,z+dz,91,.60,.3,'#d4c9b5');
 for(const x of [113,133,154])box(x,-2.35,z,3.8,5.2,3.8,'#a9a096');
 // Bridge lane paint is supplied by the merged road layer.
}
const wood=material('#7e7059'),green=material('#608365'),metal=material('#606969');
function tree(x,z){
 let trunk=new T.Mesh(new T.CylinderGeometry(.15,.23,3.7,7),wood);trunk.position.set(x,1.85,z);scene.add(trunk);
 for(const [dx,dy,dz,r] of [[0,4.2,0,1.6],[-1,3.7,.1,1.1],[.9,3.85,-.4,1.1]]){
  let crown=new T.Mesh(new T.SphereGeometry(r,8,6),green);crown.position.set(x+dx,dy,z+dz);scene.add(crown);
 }
}
function lamp(x,z){
 const stem=new T.Mesh(new T.CylinderGeometry(.085,.17,5.9,8),metal);stem.position.set(x,2.95,z);scene.add(stem);
 box(x+.52,5.8,z,1.1,.13,.12,'#7e8583');
 const orb=new T.Mesh(new T.SphereGeometry(.25,8,6),new T.MeshBasicMaterial({color:'#ffe5b0'}));
 orb.position.set(x+1,5.78,z);scene.add(orb);
}
for(let z=-156;z<=154;z+=23){tree(99,z+7);if(z%2!==0)lamp(97,z);}
for(const x of [-67,-32,25,65])for(const z of [-76,78])lamp(x,z);
// Feluccas: low-poly silhouettes visible from the Corniche.
for(const [x,z,s] of [[123,-99,1],[142,39,.83],[125,128,1.1]]){
 box(x,.25,z,2.7*s,.57,5.4*s,'#76513b');
 const mast=new T.Mesh(new T.CylinderGeometry(.06,.08,6*s,6),metal);mast.position.set(x,3.2*s,z);scene.add(mast);
 const sail=new T.Mesh(new T.ConeGeometry(2.4*s,5.1*s,3),new T.MeshLambertMaterial({color:'#eee4cf',side:T.DoubleSide}));
 sail.position.set(x+.55*s,3.5*s,z-.4*s);sail.rotation.y=.2;scene.add(sail);
}
// Egyptian landmarks: stylized tower, mosque, Giza pyramids.
const tower=new T.Mesh(new T.CylinderGeometry(1.9,3.1,28,12),material('#bba991'));tower.position.set(191,14,-90);scene.add(tower);
const top=new T.Mesh(new T.CylinderGeometry(4.7,4,3.2,14),material('#c3b496'));top.position.set(191,29.5,-90);scene.add(top);
box(191,33,-90,.5,4,.5,'#e4d3ae');
box(-112,4.5,-150,22,9,16,'#e0c7a5');
const dome=new T.Mesh(new T.SphereGeometry(5,12,8,0,Math.PI*2,0,Math.PI/2),material('#879e9d'));
dome.position.set(-112,9,-150);scene.add(dome);
for(const x of [-124,-100]){
 const m=new T.Mesh(new T.CylinderGeometry(.6,.85,18,10),material('#d4bea1'));m.position.set(x,9,-150);scene.add(m);
 const c=new T.Mesh(new T.ConeGeometry(1.2,3.7,10),material('#92a29a'));c.position.set(x,19.7,-150);scene.add(c);
}
for(const [x,z,r] of [[-175,-155,16],[-199,-165,10]]){
 const p=new T.Mesh(new T.ConeGeometry(r,r*1.28,4),material('#bda77d'));p.position.set(x,r*.64,z);p.rotation.y=Math.PI/4;scene.add(p);
}
// Crosswalks are placed ahead of signals by the dedicated road module.
for(const [x,z] of [[-42,91],[-20,91],[18,93],[50,91],[-78,-94]]){
 box(x,1,z,6.1,1.8,3.0,'#bda47e');box(x,2.17,z,7.1,.17,3.6,'#b76d55');
}
sign('كورنيش النيل',87,3,72,7);
sign('وسط البلد',-9,3,-82,7);
sign('القاهرة',42,3,97,6);
return {isWater(x,z){return x>105&&x<158&&![-60,0,60].some(n=>Math.abs(z-n)<5.7)},
district(x,z){return x>160?'الزمالك':x>92?'كورنيش النيل':x< -89?'الجيزة':z>90?'المعادي':z< -88?'مصر القديمة':'وسط البلد • القاهرة'},
bridges:[-60,0,60]};
}
