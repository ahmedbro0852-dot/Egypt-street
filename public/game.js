import { createStreetAudio } from './street-audio.js';
import * as T from './three.js';
import { installCairo } from './cairo-city.js';
import { createEgyptianCrowd } from './egyptian-crowd.js';
import { createStreetEvents } from './street-events.js';
import { createCareerSystem } from './street-careers.js';
import { createFuelSystem, PETROL_STATIONS } from './realistic-fuel.js';
import { createCityLife } from './city-life-v5.js';
import { createWorldSave, GAME_KEYS_V55 } from './game-save-v55.js';
import { createAutoDriver } from './auto-drive-v6.js';
import { createGpsV6 } from './gps-v6.js';
import { createGarageV8 } from './garage-v8.js';
import { createDrivingRealismV9 } from './driving-realism-v9.js';
import { createVehiclePhysics, stepVehiclePhysics } from './vehicle-physics.js';
import { stickFromPointer, footDirection, steeringFromStick, blendHeading } from './controls-v3.js';
import { updateCarWheels, spinTrafficWheels, gearStatus } from './wheel-rig.js';
// A deliberate "new game" clears only Egypt Street keys before systems are constructed.
let freshStartV55=false;
try{
 if(window.sessionStorage?.getItem('egypt-street-start-fresh-v55')==='1'){
  window.sessionStorage.removeItem('egypt-street-start-fresh-v55');
  for(const key of GAME_KEYS_V55)window.localStorage?.removeItem(key);
  freshStartV55=true;
 }
}catch(e){}
const $=id=>document.getElementById(id),scene=new T.Scene();scene.background=new T.Color('#b9d0cf');scene.fog=new T.Fog('#b9d0cf',65,190);let renderer;try{renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true})}catch(e){const old=$('world'),c=old.cloneNode();old.replaceWith(c);const ctx=c.getContext('2d');let sw=0,sh=0;renderer={setPixelRatio(){},setSize(w,h){sw=c.width=w;sh=c.height=h},render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();const view=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];ctx.fillStyle=scene.background?.getHexString?'#'+scene.background.getHexString():'#b9d0cf';ctx.fillRect(0,0,sw,sh);scene.traverse(o=>{if(!o.isMesh||!o.visible||!o.parent.visible||o.userData.skipFallback)return;for(let ancestor=o.parent;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;const center=new T.Vector3().setFromMatrixPosition(o.matrixWorld);if(center.distanceTo(camera.position)>95)return;const m=new T.Matrix4().multiplyMatrices(view,o.matrixWorld),pos=o.geometry.attributes.position,idx=o.geometry.index;const verts=[];for(let i=0;i<pos.count;i++)verts.push(new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m));for(let i=0;i<(idx?idx.count:pos.count);i+=3){const a=verts[idx?idx.getX(i):i],b=verts[idx?idx.getX(i+1):i+1],d=verts[idx?idx.getX(i+2):i+2];if([a,b,d].some(v=>v.z>1||v.z< -1))continue;if((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x)<0)continue;let color=o.material.color||new T.Color('#647b72');faces.push({a,b,d,z:(a.z+b.z+d.z)/3,color:'#'+color.getHexString()})}});faces.sort((a,b)=>b.z-a.z);for(let f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo((f.a.x+1)*sw/2,(1-f.a.y)*sh/2);ctx.lineTo((f.b.x+1)*sw/2,(1-f.b.y)*sh/2);ctx.lineTo((f.d.x+1)*sw/2,(1-f.d.y)*sh/2);ctx.fill()}}};}renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new T.PerspectiveCamera(62,1,.1,240);const ambient=new T.HemisphereLight(0xffe9c8,0x637278,2.6);scene.add(ambient);const sun=new T.DirectionalLight(0xffd7a1,2.6);sun.position.set(-30,70,20);scene.add(sun);const solids=[];const mat=c=>new T.MeshLambertMaterial({color:c});const materials=new Map();function box(x,y,z,w,h,d,c,parent=scene){if(!materials.has(c))materials.set(c,mat(c));let m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(c));m.position.set(x,y,z);parent.add(m);return m}box(0,-.2,0,460,.3,460,'#baa88a');
const roads=[-60,-30,0,30,60];for(const n of roads){box(n,.01,0,11,.1,170,'#555e60');box(0,.01,n,170,.1,11,'#555e60');for(let k=-80;k<85;k+=8){box(n,.08,k,.16,.02,3,'#d6cba1');box(k,.08,n,3,.02,.16,'#d6cba1')}}
function sign(text,x,y,z,w=5){const c=document.createElement('canvas');c.width=512;c.height=128;let q=c.getContext('2d');q.fillStyle='#174747';q.fillRect(0,0,512,128);q.fillStyle='#ffe3a9';q.font='bold 54px Arial';q.textAlign='center';q.fillText(text,256,84);let m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}));m.position.set(x,y,z);scene.add(m)}
let seed=7;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647}const colors=['#beaa8c','#d4bd99','#b7977d','#d2c2a8','#aaa58c'];for(let a=-2;a<2;a++)for(let b=-2;b<2;b++){const cx=a*30+15,cz=b*30+15;for(let j=0;j<2;j++){let x=cx+(j?5.4:-5.4),h=10+Math.floor(rand()*5)*3;box(x,.2,cz,10,.35,21,'#cfc4ac');box(x,h/2,cz,9.5,h,18,colors[Math.floor(rand()*5)]);solids.push({x,z:cz,w:5.3,d:9.6});box(x,h+.3,cz,10,.5,18.5,'#e4d2b2');for(let y=3;y<h-1;y+=3)for(let wx=-2.8;wx<=3;wx+=2.8){box(x+wx,y,cz+9.03,1.25,1.65,.08,'#42595c');box(x+wx,y-.8,cz+9.3,1.8,.15,.6,'#e1cba5');box(x+wx,y,cz-9.03,1.2,1.6,.08,'#536466')}box(x,1.2,cz+9.08,7,2,.1,j?'#376e70':'#877047');sign(['قهوة البلد','سوبر ماركت النيل','كشري عم سيد','عصير قصب'][((a+2)*4+b+2)%4],x,2.8,cz+9.2,7);box(x,h+1,cz,2,1.8,2,'#8e9a9a')}}
function palm(x,z){box(x,3,z,.35,6,.35,'#8e7956');for(let i=0;i<7;i++){let leaf=box(x,6,z,4,.15,.6,'#4d7954');leaf.rotation.y=i*Math.PI/3.5;leaf.rotation.z=.18}}for(let z=-75;z<80;z+=15){palm(7,z);palm(-67,z)}
const cairo = installCairo(T,scene,box,sign,solids);
function car(color){
 const g=new T.Group(),wheels=[];
 const paint=new T.MeshStandardMaterial({color,metalness:.65,roughness:.29});
 const glass=new T.MeshStandardMaterial({color:'#233b46',metalness:.48,roughness:.17});
 const rubber=new T.MeshStandardMaterial({color:'#17191b',roughness:.95});
 const chrome=new T.MeshStandardMaterial({color:'#bfc5ca',metalness:.92,roughness:.23});
 const black=new T.MeshStandardMaterial({color:'#24282b',roughness:.65});
 function part(geo,m,x=0,y=0,z=0,parent=g){const o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o}
 function cub(x,y,z,w,h,d,m,parent=g){return part(new T.BoxGeometry(w,h,d),m,x,y,z,parent)}
 function shell(rings,m){const v=[],idx=[];for(const [z,width,low,high] of rings){for(const [x,y] of [[-width*.87,low],[-width,low+.09],[-width,high-.08],[-width*.84,high],[width*.84,high],[width,high-.08],[width,low+.09],[width*.87,low]])v.push(x,y,z)}for(let r=0;r<rings.length-1;r++)for(let j=0;j<8;j++){let a=r*8+j,b=r*8+(j+1)%8,c=b+8,d=a+8;idx.push(a,d,b,b,d,c)}for(let j=1;j<7;j++){idx.push(0,j+1,j);let n=(rings.length-1)*8;idx.push(n,n+j,n+j+1)}let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();return part(geo,m)}
 shell([[-2.16,.76,.44,.85],[-2,.92,.40,1.02],[-1.40,.97,.40,1.05],[.95,.97,.40,1.03],[1.80,.90,.45,.94],[2.15,.78,.50,.85]],paint);
 shell([[-1.27,.82,1.00,1.08],[-.67,.73,1.00,1.55],[.48,.73,1.00,1.55],[1.18,.84,1.00,1.04]],glass);
 shell([[-.70,.745,1.51,1.56],[-.55,.75,1.52,1.59],[.40,.75,1.52,1.59],[.52,.735,1.51,1.56]],paint);
 // Roof pillars, door seams, handles and mirrors.
 for(const side of [-1,1]){
 const x=side*.82;
 for(const [z,y,h,tilt] of [[-.95,1.28,.61,-.86],[.02,1.30,.55,0],[.84,1.28,.65,.88]]){let p=cub(x,y,z,.055,h,.055,paint);p.rotation.x=tilt}
 cub(side*.965,.72,-.05,.012,.48,.018,black);cub(side*.94,.57,-.05,.018,.018,2.62,black);
 for(const z of [-.62,.55])cub(side*.97,.96,z,.03,.035,.19,chrome);
 let mirror=part(new T.SphereGeometry(1,12,8),paint,side*1.02,1.17,.81);mirror.scale.set(.16,.085,.12);cub(side*1.11,1.17,.78,.015,.09,.13,glass);
 cub(side*.9,.47,0,.10,.09,2.5,paint);
 }
 cub(0,.58,2.11,1.51,.18,.10,black);cub(0,.54,-2.12,1.52,.13,.09,black);
 cub(0,.79,2.145,.63,.22,.025,black);
 for(let y=.72;y<.89;y+=.045)cub(0,y,2.166,.59,.012,.015,chrome);
 const lamp=new T.MeshStandardMaterial({color:'#f4f0dc',emissive:'#fff1bc',emissiveIntensity:.65,roughness:.15});
 const tail=new T.MeshStandardMaterial({color:'#a62121',emissive:'#a5120b',emissiveIntensity:.5,roughness:.2});
 g.userData.headlights=lamp;g.userData.tailLights=tail;
 const blinkerLeft=new T.MeshStandardMaterial({color:'#a16d21',emissive:'#ffae2b',emissiveIntensity:.08,roughness:.3});
 const blinkerRight=new T.MeshStandardMaterial({color:'#a16d21',emissive:'#ffae2b',emissiveIntensity:.08,roughness:.3});
 g.userData.indicators={left:blinkerLeft,right:blinkerRight};
 for(const side of [-1,1]){
  cub(side*.63,.82,2.08,.43,.17,.07,lamp);
  cub(side*.66,.82,-2.09,.39,.17,.06,tail);
  cub(side*.67,.56,2.13,.20,.075,.04,lamp);
  const amber=side<0?blinkerLeft:blinkerRight;
  cub(side*.86,.76,2.13,.20,.095,.055,amber);
  cub(side*.84,.75,-2.11,.22,.095,.055,amber);
 }
 for(const z of [-2.18,2.18]){cub(0,.60,z,.40,.14,.018,mat('#e5e8de'));cub(0,.65,z*1.001,.40,.032,.022,mat('#4b8daf'))}
 for(const x of [-.94,.94])for(const z of [-1.35,1.32]){
 const pivot=new T.Group();pivot.position.set(x,.43,z);g.add(pivot);wheels.push(pivot);
 // Steering knuckle (Y) and rolling wheel (X) are independent objects.
 const rolling=new T.Group();pivot.add(rolling);
 pivot.userData={front:z>0,side:Math.sign(x),radius:.405,baseY:.43,rolling};
 const tire=part(new T.CylinderGeometry(.405,.405,.26,24),rubber,0,0,0,rolling);tire.rotation.z=Math.PI/2;
 const sx=Math.sign(x);const rim=part(new T.CylinderGeometry(.28,.28,.025,24),black,sx*.142,0,0,rolling);rim.rotation.z=Math.PI/2;
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const spoke=cub(sx*.159,Math.cos(a)*.13,Math.sin(a)*.13,.025,.25,.045,chrome,rolling);spoke.rotation.x=a}
 const hub=part(new T.CylinderGeometry(.075,.075,.035,16),chrome,sx*.17,0,0,rolling);hub.rotation.z=Math.PI/2;
 }
 // Soft contact shadow, no expensive shadow maps on mobile.
 const cv=document.createElement('canvas');cv.width=cv.height=64;const ctx=cv.getContext('2d'),grad=ctx.createRadialGradient(32,32,8,32,32,32);grad.addColorStop(0,'rgba(0,0,0,.5)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);let shadow=part(new T.PlaneGeometry(3.5,5.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false}),0,.105,0);shadow.rotation.x=-Math.PI/2;shadow.userData.skipFallback=true;
 // Chassis moves on its springs while the tyres stay planted on the asphalt.
 const chassis=new T.Group();
 for(const child of [...g.children])if(child!==shadow&&!wheels.includes(child)){
   g.remove(child);chassis.add(child)
 }
 g.add(chassis);
 g.userData.wheels=wheels;g.userData.chassis=chassis;
 scene.add(g);return g;
}
const taxi=car('#d7a52f');taxi.position.set(2,0,8);box(0,1.72,0,.52,.20,.32,'#fff1c8',taxi.userData.chassis);
function motorcycle(color){
 const g=new T.Group();g.userData.wheels=[];
 box(0,.52,0,.26,.13,1.22,'#35383b',g);box(0,.85,-.25,.40,.13,.68,'#25272b',g);
 const tank=new T.Mesh(new T.SphereGeometry(1,12,8),mat(color));tank.scale.set(.23,.22,.36);tank.position.set(0,.81,.27);g.add(tank);
 box(0,1.12,.66,.70,.055,.055,'#a5a8aa',g);box(0,.87,.77,.10,.55,.10,'#969b9e',g);
 box(0,1,.85,.23,.19,.10,'#fff0bd',g);
 const bikeBrake=new T.MeshStandardMaterial({color:'#a82120',emissive:'#de211c',emissiveIntensity:.5,roughness:.25});
 g.userData.tailLights=bikeBrake;
 const brakeMesh=new T.Mesh(new T.BoxGeometry(.22,.10,.06),bikeBrake);brakeMesh.position.set(0,.74,-.86);g.add(brakeMesh);
 const bikeLeft=new T.MeshStandardMaterial({color:'#ae7024',emissive:'#ffaf2d',emissiveIntensity:.08});
 const bikeRight=new T.MeshStandardMaterial({color:'#ae7024',emissive:'#ffaf2d',emissiveIntensity:.08});
 g.userData.indicators={left:bikeLeft,right:bikeRight};
 for(const side of [-1,1]){
  const turnMat=side<0?bikeLeft:bikeRight;
  for(const z of [-.81,.79]){
   const turnLamp=new T.Mesh(new T.BoxGeometry(.17,.10,.10),turnMat);
   turnLamp.position.set(side*.39,.86,z);g.add(turnLamp);
  }
 }
 for(const z of [-.70,.72]){const pivot=new T.Group();pivot.position.set(0,.34,z);g.add(pivot);g.userData.wheels.push(pivot);const rolling=new T.Group();pivot.add(rolling);pivot.userData={front:z>0,side:0,radius:.32,baseY:.34,rolling};const w=new T.Mesh(new T.CylinderGeometry(.32,.32,.16,16),mat('#171a1d'));w.rotation.z=Math.PI/2;rolling.add(w);for(const x of [-.09,.09]){const hub=new T.Mesh(new T.CylinderGeometry(.20,.20,.018,12),mat('#9da5ac'));hub.position.x=x;hub.rotation.z=Math.PI/2;rolling.add(hub)}}
 // Seated rider and helmet.
 box(0,1.15,-.12,.36,.48,.26,'#3a5260',g);const helmet=new T.Mesh(new T.SphereGeometry(.19,12,10),mat('#222b32'));helmet.position.set(0,1.55,-.06);g.add(helmet);box(0,1.57,.10,.28,.09,.06,'#6d8b95',g);
 for(const x of [-.25,.25]){box(x,.73,-.27,.13,.42,.20,'#334352',g);box(x,1.12,.28,.11,.12,.57,'#3a5260',g)}scene.add(g);return g;
}
const traffic=[];for(let i=0;i<22;i++){let c=i%4===3?motorcycle(['#b94536','#32657e','#b9ad82'][i%3]):car(['#d5d7d4','#466878','#742e2e','#b8b2a4','#34393e','#e0d2ad','#47745e'][i%7]);if(i%4!==3){if(i%3===0)c.scale.set(1.08,1.15,1.12);else if(i%3===1)c.scale.set(.94,.96,.90)}const direction=i%2?1:-1;c.userData.direction=direction;c.userData.axis=i<12?'z':'x';c.userData.cruise=i%4===3?10.2+(i%3)*.8:7.7+(i%4)*1.25;c.userData.actualCruise=c.userData.cruise;const lane=roads[i%5]+direction*2.6;const along=-76+(i%11)*14;if(c.userData.axis==='z')c.position.set(lane,0,along);else c.position.set(along,0,lane);c.rotation.y=(c.userData.axis==='x'?Math.PI/2:0)+(direction<0?Math.PI:0);traffic.push(c)}
// Articulated lightweight protagonist, based on the approved character reference.
function makeHero(){
 const root=new T.Group(),rig=new T.Group();root.add(rig);
 const skin=new T.MeshStandardMaterial({color:'#b78260',roughness:.88}),shirt=new T.MeshStandardMaterial({color:'#393b3e',roughness:1}),jeans=new T.MeshStandardMaterial({color:'#48627b',roughness:1}),hair=new T.MeshStandardMaterial({color:'#25201d',roughness:1}),shoe=new T.MeshStandardMaterial({color:'#d4cfc1',roughness:.95});
 function ell(parent,x,y,z,a,b,c,m){const mesh=new T.Mesh(new T.SphereGeometry(1,16,12),m);mesh.position.set(x,y,z);mesh.scale.set(a,b,c);parent.add(mesh);return mesh}
 function limb(x,y,len,r,m){
  const pivot=new T.Group();pivot.position.set(x,y,0);rig.add(pivot);
  ell(pivot,0,-len/4,0,r,len/4+.033,r,m);
  const joint=new T.Group();joint.position.y=-len/2;pivot.add(joint);
  ell(joint,0,-len/4,0,r*.92,len/4+.04,r*.98,m);
  pivot.userData.joint=joint;
  return pivot;
 }
 ell(rig,0,1.18,0,.29,.37,.17,shirt);ell(rig,0,.91,0,.26,.13,.16,shirt);
 ell(rig,0,1.55,0,.09,.12,.09,skin);
 const head=new T.Group();head.position.y=1.75;rig.add(head);
 ell(head,0,0,0,.16,.215,.155,skin);ell(head,0,.105,-.018,.165,.135,.155,hair);
 for(let i=0;i<16;i++){const a=i*2.399;ell(head,Math.cos(a)*.13,.17+Math.sin(i)*.018,Math.sin(a)*.10,.045,.045,.045,hair)}
 ell(head,0,-.11,.08,.132,.087,.083,hair);ell(head,0,-.055,.145,.096,.065,.018,skin);
 ell(head,0,-.015,.16,.029,.052,.035,skin);
 const eyeWhite=mat('#d9cfc0'),iris=mat('#30261f');
 for(const x of [-.063,.063]){ell(head,x,.035,.139,.034,.014,.012,eyeWhite);ell(head,x,.035,.151,.012,.013,.006,iris);ell(head,x,.068,.135,.041,.009,.012,hair);ell(head,Math.sign(x)*.16,-.005,0,.025,.052,.032,skin)}
 ell(head,0,-.084,.166,.045,.006,.007,mat('#795448'));
 const leftArm=limb(-.32,1.43,.32,.085,shirt),rightArm=limb(.32,1.43,.32,.085,shirt);
 for(const arm of [leftArm,rightArm]){
  const forearm=arm.userData.joint;
  ell(forearm,0,-.21,.014,.075,.08,.068,skin);
  ell(forearm,0,-.30,.035,.061,.071,.053,skin);
 }
 const watch=new T.Mesh(new T.CylinderGeometry(.071,.071,.045,12),hair);
 watch.position.set(0,-.235,.005);leftArm.userData.joint.add(watch);
 const leftLeg=limb(-.135,.86,.70,.105,jeans),rightLeg=limb(.135,.86,.70,.105,jeans);
 for(const leg of [leftLeg,rightLeg]){
  const knee=leg.userData.joint;
  ell(knee,0,-.387,.085,.115,.07,.208,shoe);
  ell(knee,0,-.435,.095,.118,.024,.210,mat('#b5ae9f'));
 }
 // Jacket seams, shirt neckline, shoe stitching and subtle face features.
 ell(rig,0,1.34,.176,.145,.052,.02,mat('#55545b'));
 ell(head,-.161,-.005,0,.022,.045,.032,skin);
 ell(head,.161,-.005,0,.022,.045,.032,skin);
 ell(head,0,-.083,.173,.055,.010,.010,mat('#74493d'));
 root.userData={rig,leftArm,rightArm,leftLeg,rightLeg,
  leftElbow:leftArm.userData.joint,rightElbow:rightArm.userData.joint,
  leftKnee:leftLeg.userData.joint,rightKnee:rightLeg.userData.joint,head};
 return root;
}
function animateHero(hero,phase,amount){
 const r=hero.userData;
 const strength=Math.min(1.5,Math.max(0,amount));
 const stride=Math.sin(phase),contact=Math.max(0,Math.sin(phase*2));
 r.leftLeg.rotation.x=stride*.50*strength;
 r.rightLeg.rotation.x=-stride*.50*strength;
 r.leftKnee.rotation.x=-Math.max(0,-stride)*.43*strength;
 r.rightKnee.rotation.x=-Math.max(0,stride)*.43*strength;
 r.leftArm.rotation.x=-stride*.37*strength;
 r.rightArm.rotation.x=stride*.37*strength;
 r.leftElbow.rotation.x=.12+Math.max(0,stride)*.10*strength;
 r.rightElbow.rotation.x=.12+Math.max(0,-stride)*.10*strength;
 r.head.rotation.y=Math.sin(phase*.44)*.045*strength;
 // Opposing shoulder/hip motion, heel-lift and damped weight transfer.
 r.rig.rotation.y=Math.sin(phase)*.035*strength;
 r.rig.rotation.z=Math.sin(phase)*.021*strength;
 r.rig.position.y=contact*.035*strength;
}
const player=makeHero();scene.add(player);player.position.set(0,0,12);
const crowd=createEgyptianCrowd(T,scene,(x,z)=>blocked(x,z,.38));
const walkers=crowd.people; // Forty unique residents

const target=new T.Vector3(62,0,-50);let beacon=new T.Mesh(new T.CylinderGeometry(2,2,.12,32),new T.MeshBasicMaterial({color:0xffcd68,transparent:true,opacity:.7}));scene.add(beacon);let pillar=new T.Mesh(new T.CylinderGeometry(.25,.25,13,12),new T.MeshBasicMaterial({color:0xffd57e,transparent:true,opacity:.45}));scene.add(pillar);
const sound=createStreetAudio();
let pedal=0,brakePedal=false,jumpRequested=false,reverseKeyHeld=false,reversePressed=false,parkingBrake=false;
// Speed+ is a tap: the engine holds the new target speed by itself.
// Reverse is only accepted from a near-stop and automatically disengages cruise.
$('accelerate').onclick=()=>fuelSystem.changeSpeed(15);
const reverseButton=$('reverse');
reverseButton.onpointerdown=e=>{
 e.preventDefault();
 reversePressed=true;
 reverseButton.setPointerCapture(e.pointerId);
};
reverseButton.onpointerup=reverseButton.onpointercancel=reverseButton.onlostpointercapture=()=>{
 reversePressed=false;reverseKeyHeld=false;pedal=0;
};

// Genuine independently held mobile brake. Lost capture never leaves the pedal pressed.
const brakeButton=$('brakePedal');
brakeButton.onpointerdown=e=>{e.preventDefault();brakePedal=true;brakeButton.setPointerCapture(e.pointerId)};
brakeButton.onpointerup=brakeButton.onpointercancel=brakeButton.onlostpointercapture=()=>{brakePedal=false};
const parkButton=$('handbrake');
function updateParkingUi(){
 parkButton.setAttribute('aria-pressed',String(parkingBrake));
 parkButton.textContent=parkingBrake?'🅿️ فرامل اليد: مقفولة':'🅿️ فرامل اليد: مفتوحة';
}
parkButton.onclick=()=>{
 if(!driving)return;
 parkingBrake=!parkingBrake;
 if(parkingBrake&&autoDriver.getState().enabled){autoDriver.stop();updateAutoPilotLabel()}
 updateParkingUi();
 toast(parkingBrake?'🅿️ فرامل اليد شغالة — العربية هتقف':'✅ فرامل اليد اتفكت — تقدر تسوق');
 saveWorld(true);
};
updateParkingUi();
const jumpButton=$('jump');
jumpButton.onpointerdown=e=>{e.preventDefault();if(!driving)jumpRequested=true;jumpButton.setPointerCapture(e.pointerId)};
jumpButton.onpointerup=jumpButton.onpointercancel=()=>{};
$('sound').onclick=()=>{const mute=sound.toggle();$('sound').textContent=mute?'الصوت مغلق':'الصوت شغال';$('sound').setAttribute('aria-pressed',String(!mute))};document.addEventListener('visibilitychange',()=>{if(document.hidden){pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;keys={};resetPad();sprint=false;sound.suspend()}else if(active)sound.start()});let active=false,paused=false,driving=false,yaw=0,speed=0,cash=250,completed=0,joy={x:0,y:0},keys={},sprint=false;
const walletStorage=(()=>{try{return window.localStorage}catch(e){return null}})();
const worldSave=createWorldSave({storage:walletStorage});
const previousWorld=worldSave.load();
let hasSavedWallet=false;
try{
 const data=JSON.parse(walletStorage?.getItem('egypt-street-wallet-v4')||'null');
 if(data&&Number.isFinite(data.balance)&&data.balance>=0){
  cash=Math.min(1e7,data.balance);hasSavedWallet=true;
 }
}catch(e){}
$('money').textContent='ج.م '+Math.round(cash);
function saveWallet(){
 try{walletStorage?.setItem('egypt-street-wallet-v4',JSON.stringify({balance:cash}))}catch(e){}
}const vehicleState=createVehiclePhysics(taxi.position.x,taxi.position.z,taxi.rotation.y);const onFoot={vx:0,vz:0,vy:0,y:0,grounded:true};let cameraYaw=0,cameraPitch=.13,cameraFreeUntil=0,bumpCooldown=0;let toastTimer;function toast(s){$('toast').textContent=s;clearTimeout(toastTimer);$('toast').style.opacity=1;toastTimer=setTimeout(()=>$('toast').style.opacity=.15,4500)}const streetEvents=createStreetEvents({
 T,scene,people:walkers,
 getPlayer:()=>driving?taxi.position:player.position,
 getDriving:()=>driving,
 isWalkable:(x,z)=>!blocked(x,z,.48)&&!traffic.some(c=>Math.hypot(x-c.position.x,z-c.position.z)<1.3),
 onReward:(amount)=>{cash+=amount;$('money').textContent='ج.م '+Math.round(cash);saveWallet();},
 ui:{card:$('eventPanel'),title:$('eventTitle'),text:$('eventText'),
     interact:$('interact'),dialog:$('npcDialogue')}
});
const career=createCareerSystem({
 T,scene,
 ui:{open:$('jobsBtn'),close:$('jobsClose'),panel:$('jobsPanel'),cancel:$('jobsCancel'),
    summary:$('jobsSummary'),hud:$('workHud'),hudTitle:$('workHudTitle'),hudText:$('workHudText'),
    action:$('workAction'),
    cards:{taxi:$('careerTaxi'),courier:$('careerCourier'),microbus:$('careerMicrobus'),
           mechanic:$('careerMechanic'),cafe:$('careerCafe')}},
 getPosition:()=>driving?taxi.position:player.position,
 isDriving:()=>driving,getSpeed:()=>vehicleState.speed,
 onReward:amount=>{cash+=amount;$('money').textContent='ج.م '+Math.round(cash);saveWallet()},
 notify:msg=>toast(msg),
 storage:(()=>{try{return window.localStorage}catch(e){return null}})()
});
const restoredCareerPay=career.getStats().earned;
if(restoredCareerPay&&!hasSavedWallet){cash+=restoredCareerPay;$('money').textContent='ج.م '+Math.round(cash);saveWallet();}
const fuelSystem=createFuelSystem({
 T,scene,box,sign,storage:walletStorage,
 getPosition:()=>taxi.position,
 getSpeed:()=>vehicleState.speed,isDriving:()=>driving,
 isEngineRunning:()=>drivingRealism.getState().engineOn,
 getMoney:()=>cash,
 charge:cost=>{
  if(cash+.00001<cost)return false;
  cash=Math.max(0,Math.round((cash-cost)*10)/10);
  $('money').textContent='ج.م '+Math.round(cash);
  saveWallet();return true;
 },
 notify:msg=>toast(msg),
 ui:{hud:$('fuelHud'),mode:$('fuelMode'),amount:$('fuelAmount'),
   bar:$('fuelFill'),toggle:$('autoDrive'),slower:$('fuelSlower'),
   faster:$('fuelFaster'),warning:$('fuelWarning'),station:$('fuelStation'),refuel:$('fuelBtn'),
   condition:$('fuelCondition'),repair:$('fuelRepair')}
});
const cityLife=createCityLife({
 T,scene,sun,ambient,box,storage:walletStorage,
 getPosition:()=>driving?taxi.position:player.position,
 isDriving:()=>driving,getSpeed:()=>vehicleState.speed,
 charge:cost=>{
   if(cash+.00001<cost)return false;
   cash=Math.max(0,Math.round((cash-cost)*10)/10);
   $('money').textContent='ج.م '+Math.round(cash);saveWallet();return true;
 },
 notify:message=>toast(message),
 ui:{time:$('cityTime'),weather:$('cityWeather'),fines:$('cityLaw'),
   nightBtn:$('cityNight'),weatherBtn:$('cityWeatherBtn')}
});
const autoDriver=createAutoDriver({
 signalStop:car=>cityLife.trafficMustBrake(car),
 onStatus:message=>toast(message)
});
const gps=createGpsV6({
 autoDriver,isDriving:()=>driving,
 getCar:()=>vehicleState,
 getJob:()=>career.waypoint(),
 getDelivery:()=>({x:target.x,z:target.z,label:'طلب التوصيل'}),
 getSideEvent:()=>streetEvents.waypoint(),
 getStations:()=>PETROL_STATIONS,
 notify:message=>toast(message),
 ui:{
  btn:$('gpsBtn'),panel:$('gpsPanel'),close:$('gpsClose'),
  title:$('gpsTitle'),detail:$('gpsDetail'),active:$('gpsActive'),
  buttons:{job:$('gpsJob'),delivery:$('gpsDelivery'),side:$('gpsSide'),
    fuel:$('gpsFuel'),tour:$('gpsTour')}
 }
});
// Shared taxi anchor keeps existing GPS, camera, collisions and autosave intact.
const garageModels={taxi};
let activeVehicle=taxi;
function activateGarageVehicle(id){
 if(id!=='taxi'&&!garageModels[id]){
  const model=id==='motorbike'?motorcycle('#c74337'):
     car(id==='sport'?'#c52642':'#2b667a');
  if(id==='sport'){
   model.scale.set(1.04,.88,1.03);
   box(0,1.13,-1.90,1.68,.10,.30,'#192329',model.userData.chassis);
   box(0,1.01,-1.92,.11,.22,.22,'#121b22',model.userData.chassis);
   box(0,.68,2.12,.92,.08,.06,'#101a22',model.userData.chassis);
  }else if(id==='sedan'){
   model.scale.set(.96,1.02,.95);
   box(0,1.66,-.13,1.27,.10,1.18,'#3c7886',model.userData.chassis);
  }
  garageModels[id]=model;
 }
 activeVehicle=garageModels[id]||taxi;
 for(const [key,model] of Object.entries(garageModels)){
  model.visible=key===id;
  model.position.copy(taxi.position);model.rotation.y=taxi.rotation.y;
 }
}
const garage=createGarageV8({
 ui:{
  open:$('garageBtn'),panel:$('garagePanel'),close:$('garageClose'),
  title:$('garageSelected'),stats:$('garageSpecs'),balance:$('garageBalance'),
  cars:{taxi:$('garageTaxi'),sedan:$('garageSedan'),
        sport:$('garageSport'),motorbike:$('garageMotorbike')},
  upgrades:{engine:$('garageEngine'),brakes:$('garageBrakes'),tyres:$('garageTyres')}
 },
 storage:walletStorage,
 getMoney:()=>cash,
 charge:cost=>{
  if(cash+.00001<cost)return false;
  cash=Math.max(0,Math.round((cash-cost)*10)/10);
  $('money').textContent='ج.م '+Math.round(cash);saveWallet();return true;
 },
 isDriving:()=>driving,notify:message=>toast(message),
 onSelect:activateGarageVehicle,onChanged:()=>saveWorld(true)
});
activateGarageVehicle(garage.getVehicle().id);
const drivingRealism=createDrivingRealismV9({notify:message=>toast(message)});
let v9Live={engineOn:false,rpm:0,gear:'N',turn:'off',hazards:false,left:false,right:false,throttleScale:0};
let v9UiLast=-1;
function updateV9Lamps(){
 const lampSet=activeVehicle.userData.indicators;
 if(lampSet){
  lampSet.left.emissiveIntensity=v9Live.left?3.2:.07;
  lampSet.right.emissiveIntensity=v9Live.right?3.2:.07;
 }
}
function updateV9Dashboard(t=0){
 if(t-v9UiLast<125&&v9UiLast>=0)return;
 v9UiLast=t;
 const state=drivingRealism.getState();
 $('v9RpmValue').textContent=Math.round(state.rpm)+' RPM';
 $('v9RpmFill').style.width=Math.min(100,Math.max(0,state.rpm/7500*100)).toFixed(1)+'%';
 $('v9Engine').textContent=state.engineOn?'🔑 الموتور شغال':'🔑 الموتور مطفي';
 $('v9SignalStatus').textContent=state.hazards?'⚠️ فلشر الانتظار شغال':
  state.turn==='left'?'◀ إشارة شمال':state.turn==='right'?'إشارة يمين ▶':'إشارات: مغلقة';
 $('v9Left').setAttribute('aria-pressed',String(state.turn==='left'));
 $('v9Right').setAttribute('aria-pressed',String(state.turn==='right'));
 $('v9Hazard').setAttribute('aria-pressed',String(state.hazards));
 $('v9Ignition').setAttribute('aria-pressed',String(state.engineOn));
}
$('v9Left').onclick=()=>{if(!driving)return;drivingRealism.indicator('left');updateV9Dashboard(Infinity);saveWorld(true)};
$('v9Right').onclick=()=>{if(!driving)return;drivingRealism.indicator('right');updateV9Dashboard(Infinity);saveWorld(true)};
$('v9Hazard').onclick=()=>{if(!driving)return;drivingRealism.hazard();updateV9Dashboard(Infinity);saveWorld(true)};
$('v9Ignition').onclick=()=>{
 if(!driving)return;
 if(drivingRealism.toggleEngine(fuelSystem.getState().fuel,vehicleState.speed)){
  if(!drivingRealism.getState().engineOn&&autoDriver.getState().enabled){autoDriver.stop();updateAutoPilotLabel();}
  updateV9Dashboard(Infinity);saveWorld(true);
 }
};
function updateAutoPilotLabel(){
 $('autoPilot').textContent=autoDriver.getState().enabled?'🤖 أوقف القيادة الذاتية':'🤖 شغّل القيادة الذاتية';
}
$('autoPilot').onclick=()=>{
 if(!driving)return;
 if(parkingBrake){toast('فك فرامل اليد الأول عشان تشغّل القيادة الذاتية');return;}
 autoDriver.toggle(vehicleState);
 if(autoDriver.getState().enabled&&!fuelSystem.getState().auto&&fuelSystem.getState().fuel>.01)fuelSystem.toggle();
 updateAutoPilotLabel();saveWorld(true);
};
function worldSnapshot(){
 return {
  player:{x:player.position.x,z:player.position.z,yaw:player.rotation.y},
  taxi:{x:taxi.position.x,z:taxi.position.z,yaw:taxi.rotation.y},
  driving,parkingBrake,cameraYaw,cameraPitch,money:cash,
  mission:{completed,target:{x:target.x,z:target.z}},
  fuel:fuelSystem.getState(),career:career.getStats(),
  sideEvent:streetEvents.snapshot(),autopilot:autoDriver.getState(),gps:gps.getState(),garage:garage.getState(),drivingRealism:drivingRealism.getState()
 };
}
function saveWorld(force=false){
 if(!active)return false;
 if(force)saveWallet();
 return worldSave.save(worldSnapshot(),force);
}
function restoreWorld(state){
 if(!state)return false;
 // The stand-alone wallet key is updated immediately after purchases and rewards.
 if(!hasSavedWallet)cash=state.money;
 $('money').textContent='ج.م '+Math.round(cash);
 player.position.set(state.player.x,0,state.player.z);
 player.rotation.y=state.player.yaw;
 taxi.position.set(state.taxi.x,0,state.taxi.z);
 taxi.rotation.y=state.taxi.yaw;
 Object.assign(vehicleState,createVehiclePhysics(taxi.position.x,taxi.position.z,taxi.rotation.yaw));
 completed=state.mission.completed;
 target.set(state.mission.target.x,0,state.mission.target.z);
 $('task').textContent=completed?
   'تم توصيل '+completed+' طلب • المهمة الجاية عند العلامة الدهبية.':
   'وصل الطلب للعلامة الدهبية عشان تكسب ١٥٠ جنيه.';
 cameraYaw=state.cameraYaw;cameraPitch=state.cameraPitch;
 driving=!!state.driving;
 if(driving){
  player.visible=false;player.position.copy(taxi.position);
  document.body.classList.add('driving');
  fuelSystem.enter();
  $('modeLabel').textContent='وضع القيادة';$('enter').textContent='انزل';$('run').textContent='فرامل';
  $('controlsHint').textContent='🚗 قيادة ذاتية أو دريكسيون يدوي';
 }else{
  player.visible=true;document.body.classList.remove('driving');
  $('modeLabel').textContent='وضع المشي';$('enter').textContent='اركب';$('run').textContent='جري';
 }
 fuelSystem.restore(state.fuel);
 if(driving)drivingRealism.enter(fuelSystem.getState().fuel);else drivingRealism.exit();
 drivingRealism.restore(state.drivingRealism,fuelSystem.getState().fuel);
 v9Live={...v9Live,...drivingRealism.getState(),left:false,right:false};
 updateV9Dashboard(Infinity);
 parkingBrake=!!state.parkingBrake;updateParkingUi();
 career.restore(state.career);
 streetEvents.restore(state.sideEvent);
 autoDriver.restore(state.autopilot,vehicleState);
 if(parkingBrake&&autoDriver.getState().enabled)autoDriver.stop();
 gps.restore(state.gps);
 updateAutoPilotLabel();
 return true;
}
function beginV55(restoreSave=false){
 if(active)return;
 sound.start();active=true;$('intro').style.display='none';
 streetEvents.start();
 if(restoreSave&&previousWorld)restoreWorld(previousWorld);
 else saveWorld(true);
 if(driving)toast('✅ رجعت لنفس العربية والمكان. القيادة الذاتية جاهزة.');
 else toast(restoreSave?'✅ رجعت لنفس المكان وتقدمك محفوظ.':'🇪🇬 أهلاً بيك في شوارع مصر! قرب من العربية أو قدّم على شغل.');
}
$('interact').onclick=()=>career.interact()||streetEvents.interact();
$('start').onclick=()=>beginV55(false);
$('continueGame').onclick=()=>beginV55(true);
$('skipIntro').onclick=()=>beginV55(!!previousWorld);
$('newGame').onclick=()=>{
 worldSave.clear();
 try{window.sessionStorage?.setItem('egypt-street-start-fresh-v55','1')}catch(e){}
 if(typeof window.location?.reload==='function')window.location.reload();
 else beginV55(false);
};
if(previousWorld&&!freshStartV55){
 $('savePreview').textContent='💾 فيه تقدم محفوظ: '+previousWorld.mission.completed+
  ' توصيلات • '+Math.round(previousWorld.money)+' جنيه • آخر مكان محفوظ';
 $('continueGame').style.display='block';$('start').style.display='none';
}else{
 $('savePreview').textContent='🎮 مفيش حفظ سابق — تقدر تبدأ قصة جديدة في شوارع مصر.';
 $('continueGame').style.display='none';$('start').style.display='block';
}
if(freshStartV55)beginV55(false);
function enter(){
 if(driving){
  if(Math.abs(vehicleState.speed)>1.1){toast('وقف العربية الأول عشان تنزل بأمان');return}
  const side=3.4, sin=Math.sin(vehicleState.yaw),cos=Math.cos(vehicleState.yaw);
  const exits=[[taxi.position.x+cos*side,taxi.position.z-sin*side],
   [taxi.position.x-cos*side,taxi.position.z+sin*side],
   [taxi.position.x-sin*side,taxi.position.z-cos*side]];
  const safe=exits.find(([x,z])=>!blocked(x,z,.55));
  if(!safe){toast('حرّك العربية شوية عشان تلاقي مكان تنزل فيه');return}
  driving=false;player.visible=true;player.position.set(safe[0],0,safe[1]);
  speed=0;onFoot.vx=onFoot.vz=0;onFoot.vy=onFoot.y=0;onFoot.grounded=true;jumpRequested=false;vehicleState.speed=0;vehicleState.lateralSpeed=0;vehicleState.yawRate=0;
  autoDriver.stop();drivingRealism.exit();parkingBrake=false;updateParkingUi();fuelSystem.exit();document.body.classList.remove('driving');pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;resetPad();$('controlsHint').textContent='↕↔ العصاية للمشي • اسحب للكاميرا';$('modeLabel').textContent='وضع المشي';$('enter').textContent='اركب';$('run').textContent='جري';
 }else if(player.position.distanceTo(taxi.position)<6){
  driving=true;player.visible=false;
  Object.assign(vehicleState,createVehiclePhysics(taxi.position.x,taxi.position.z,taxi.rotation.y));
  yaw=taxi.rotation.y;cameraYaw=yaw;cameraFreeUntil=0;speed=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;resetPad();
  document.body.classList.add('driving');parkingBrake=false;updateParkingUi();fuelSystem.enter();drivingRealism.enter(fuelSystem.getState().fuel);autoDriver.start(vehicleState.x,vehicleState.z);
  updateAutoPilotLabel();$('modeLabel').textContent='وضع القيادة';$('enter').textContent='انزل';$('run').textContent='فرامل';
  $('controlsHint').textContent='🧭 GPS للمهمات • العصاية للتحكم اليدوي';
  toast('🤖 العربية بتسوق لوحدها. حرك العصاية للتوجيه اليدوي أو دوس فرامل.');
  saveWorld(true);
 }else toast('قرب من العربية الصفرا الأول')
} $('enter').onclick=enter;$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';toast(paused?'اللعبة متوقفة مؤقتًا':'يلا نكمل')};$('horn').onclick=()=>{sound.horn();streetEvents.horn()};$('run').onpointerdown=e=>{sprint=true;e.currentTarget.setPointerCapture(e.pointerId)};$('run').onpointerup=$('run').onpointercancel=()=>sprint=false;window.onkeydown=e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k===' '&&!e.repeat&&!driving)jumpRequested=true;if(k==='e'&&!e.repeat)enter();if(k==='f'&&!e.repeat){if(!career.interact())streetEvents.interact()}if(k==='j'&&!e.repeat)$('jobsBtn').click();if(k==='g'&&!e.repeat)$('gpsBtn').click();if(k==='p'&&!e.repeat)$('handbrake').click()};window.onkeyup=e=>keys[e.key.toLowerCase()]=false;window.onblur=()=>{pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;keys={};resetPad();sprint=false};
const pad=$('joy'),knob=$('knob'),worldCanvas=$('world');
function resetPad(){joy.x=0;joy.y=0;if(knob)knob.style.transform='translate(0px,0px)'}
function stickMove(e){
 const r=pad.getBoundingClientRect(),radius=Math.max(20,Math.min(r.width,r.height)*.5-22);
 const x=e.clientX-r.left-r.width*.5,y=e.clientY-r.top-r.height*.5;
 joy=stickFromPointer(x,y,radius);
 knob.style.transform='translate('+Math.round(joy.x*radius)+'px,'+Math.round(joy.y*radius)+'px)';
}
pad.onpointerdown=e=>{
 e.preventDefault();pad.setPointerCapture(e.pointerId);stickMove(e);
};
pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId)){e.preventDefault();stickMove(e)}};
pad.onpointerup=pad.onpointercancel=pad.onlostpointercapture=()=>resetPad();
$('camera').onclick=()=>{
 cameraNear=!cameraNear;toast(cameraNear?'كاميرا قريبة':'كاميرا واسعة');
};
let cameraNear=false,drag=null;
worldCanvas.onpointerdown=e=>{
 if(!active)return;
 e.preventDefault();
 drag={id:e.pointerId,x:e.clientX,y:e.clientY};
 worldCanvas.setPointerCapture?.(e.pointerId);
};
worldCanvas.onpointermove=e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 cameraYaw-=dx*.0053;cameraPitch=Math.max(-.24,Math.min(.52,cameraPitch+dy*.0035));
 cameraFreeUntil=performance.now()+2800;
 drag.x=e.clientX;drag.y=e.clientY;
};
worldCanvas.onpointerup=worldCanvas.onpointercancel=worldCanvas.onlostpointercapture=e=>{
 if(drag&&drag.id===e.pointerId)drag=null;
};
function blocked(x,z,radius=.45){
 if(Math.abs(x)>218-radius||Math.abs(z)>168-radius||cairo.isWater(x,z))return true;
 return solids.some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius)
}
function roadGrip(x,z){
 // Asphalt grips better than dusty pavements and unpaved blocks.
 const localRoad=(Math.abs(z)<84&&roads.some(n=>Math.abs(x-n)<6.8)) ||
        (Math.abs(x)<84&&roads.some(n=>Math.abs(z-n)<6.8));
 const outerRoad=([-133,-93,93,133].some(n=>Math.abs(z-n)<6.8)&&x>-151&&x<115) ||
        ([-139,-95,84,94,170].some(n=>Math.abs(x-n)<6.8)&&Math.abs(z)<169);
 const bridge=[-60,0,60].some(n=>Math.abs(z-n)<6.2)&&x>91&&x<177;
 return localRoad||outerRoad||bridge?1:.65;
}
function carCollision(x,z,angle){
 const sin=Math.sin(angle),cos=Math.cos(angle);
 // Narrow motorcycle footprint; the other cars keep door and bumper clearance.
 const small=garage.getVehicle().id==='motorbike';
 const halfL=small?.91:1.83,halfW=small?.36:.87,bumper=small?1.05:2.05;
 for(const [front,right] of [[halfL,halfW],[halfL,-halfW],[-halfL,halfW],[-halfL,-halfW],[bumper,0],[-bumper,0]]){
  const px=x+sin*front+cos*right,pz=z+cos*front-sin*right;
  if(blocked(px,pz,.12))return true;
 }
 // Nearby traffic and pedestrians are solid too.
 for(const npc of traffic)if(Math.hypot(x-npc.position.x,z-npc.position.z)<2.35)return true;
 for(const npc of walkers)if(Math.hypot(x-npc.position.x,z-npc.position.z)<1.22)return true;
 return false;
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}onresize=resize;resize();let last=0,gait=0;const map=$('map').getContext('2d');function minimap(p){
 map.clearRect(0,0,180,180);
 map.fillStyle='#555c54';map.fillRect(0,0,180,180);
 const scale=.55, cx=p.x,cz=p.z;
 const mx=x=>90+(x-cx)*scale,mz=z=>90+(z-cz)*scale;
 map.fillStyle='#276b83';map.fillRect(mx(104),0,(161-104)*scale,180);
 map.strokeStyle='#8a8c84';map.lineWidth=5.8;
 for(const n of [...roads,-90,90,130,-130]){
  map.beginPath();map.moveTo(mx(-220),mz(n));map.lineTo(mx(220),mz(n));map.stroke()
 }
 for(const n of [...roads,-128,-96,84,94,172]){
  map.beginPath();map.moveTo(mx(n),mz(-200));map.lineTo(mx(n),mz(200));map.stroke()
 }
 for(const z of cairo.bridges){
  map.strokeStyle='#e5d5a8';map.lineWidth=6;map.beginPath();
  map.moveTo(mx(103),mz(z));map.lineTo(mx(175),mz(z));map.stroke()
 }
 for(const junction of [-60,0,60])for(const cross of [-60,0,60]){
   const color=cityLife.getSignal('z',junction,cross);
   map.fillStyle=color==='green'?'#53ed91':color==='red'?'#fb6464':'#ffcd58';
   map.fillRect(mx(junction)-2,mz(cross)-2,4,4);
 }
 for(const station of PETROL_STATIONS){
   map.fillStyle='#56fac1';map.font='bold 10px Arial';
   map.fillText('⛽',mx(station.x)-5,mz(station.z)+5);
 }
 const route=gps.getRoute();
 if(route.length){
   map.strokeStyle='#70f0c1';map.lineWidth=3.2;
   map.beginPath();
   map.moveTo(mx(taxi.position.x),mz(taxi.position.z));
   for(const point of route)map.lineTo(mx(point.x),mz(point.z));
   map.stroke();
   const end=route[route.length-1];
   map.fillStyle='#eaffb4';map.beginPath();map.arc(mx(end.x),mz(end.z),4.8,0,Math.PI*2);map.fill();
 }
 const eventWaypoint=streetEvents.waypoint();
 if(eventWaypoint){
  map.strokeStyle='#67e6eb';map.lineWidth=2;
  map.beginPath();map.arc(mx(eventWaypoint.x),mz(eventWaypoint.z),7,0,Math.PI*2);map.stroke();
 }
 const workPoint=career.waypoint();
 if(workPoint){
  map.strokeStyle='#80ffc2';map.lineWidth=2.8;
  map.beginPath();map.arc(mx(workPoint.x),mz(workPoint.z),9,0,Math.PI*2);map.stroke();
  map.fillStyle='#c5ffe0';map.font='bold 10px Arial';map.fillText('شغل',mx(workPoint.x)-9,mz(workPoint.z)-12);
 }
 for(const [v,color,r] of [[target,'#ffd373',4],[taxi.position,'#e7b542',3],[p,'#fff',5]]){
  map.fillStyle=color;map.beginPath();map.arc(mx(v.x),mz(v.z),r,0,Math.PI*2);map.fill()
 }
 map.fillStyle='#fff';map.font='bold 10px Arial';map.fillText('N',9,14);
}
let saveClockV55=0;
window.addEventListener?.('pagehide',()=>saveWorld(true));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)saveWorld(true);
});
function frame(t){
 requestAnimationFrame(frame);
 const dt=last?Math.min((t-last)/1000,.04):1/60;last=t;
 const p=driving?taxi.position:player.position;
 if(active&&!paused){
  cityLife.update(dt,t,p);
  let f=-joy.y+(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  let turn=joy.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  f=Math.max(-1,Math.min(1,f));turn=Math.max(-1,Math.min(1,turn));
  if(driving){
   // Right on screen means right turn; the camera is an independent gesture.
   const reverseDemand=reversePressed||Boolean(keys.s||keys.arrowdown);
   // Brake first, then engage reverse only at a near-stop.
   if(reverseDemand&&autoDriver.getState().enabled){
     autoDriver.stop();updateAutoPilotLabel();
   }
   if(reverseDemand&&!reverseKeyHeld&&Math.abs(vehicleState.speed)<.85){
     reverseKeyHeld=fuelSystem.reverse();
   }
   if(!reverseDemand)reverseKeyHeld=false;
   const reverseBraking=reverseDemand&&!reverseKeyHeld&&vehicleState.speed>.55;
   const manualSteer=steeringFromStick(joy.x,(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0));
   if(autoDriver.getState().enabled&&Math.abs(manualSteer)>.24){
     autoDriver.stop();updateAutoPilotLabel();
   }
   const autopilot=autoDriver.controls(vehicleState,traffic,walkers,dt,{cruiseKmh:fuelSystem.getState().target});
   const steer=autopilot.active?autopilot.steer:manualSteer;
   const braking=brakePedal||sprint||keys.shift||keys[' ']||
      $('jobsPanel').style.display==='block'||$('garagePanel').style.display==='block'||
      $('gpsPanel').style.display==='block'||autopilot.brake||parkingBrake||reverseBraking;
   const demandedThrottle=autopilot.active?
      (braking||fuelSystem.getState().fuel<=.01||!fuelSystem.getState().auto?
        0:Math.min(fuelSystem.throttle({manual:1}),autopilot.throttle)):
     fuelSystem.throttle({
       reverse:reverseKeyHeld,
       brake:braking,manual:(keys.w||keys.arrowup)?1:0
     });
   v9Live=drivingRealism.update(dt,{
      driving:true,speed:vehicleState.speed,throttle:demandedThrottle,brake:braking,
      steer:vehicleState.steer,yaw:vehicleState.yaw,fuel:fuelSystem.getState().fuel,
      parking:parkingBrake,skid:vehicleState.skid,vehicleId:garage.getVehicle().id
   });
   const throttle=demandedThrottle*v9Live.throttleScale;
   const oldPos={x:vehicleState.x,z:vehicleState.z};
   const tune=garage.getTuning();
   const result=stepVehiclePhysics(vehicleState,{
     throttle,steer,brake:braking,
     grip:roadGrip(p.x,p.z)*cityLife.grip()*tune.gripScale,tuning:tune
   },dt,carCollision);
   cityLife.observeDriving(oldPos,vehicleState);
   taxi.position.x=vehicleState.x;taxi.position.z=vehicleState.z;
   fuelSystem.update(dt,t,throttle,v9Live.engineOn);
   taxi.rotation.y=vehicleState.yaw;yaw=vehicleState.yaw;speed=vehicleState.speed;
   if(activeVehicle!==taxi){activeVehicle.position.copy(taxi.position);activeVehicle.rotation.y=taxi.rotation.y;}
   if(activeVehicle.userData.headlights)activeVehicle.userData.headlights.emissiveIntensity=
     cityLife.illumination()<.22?2.6:.35;
   if(activeVehicle.userData.tailLights)activeVehicle.userData.tailLights.emissiveIntensity=braking?2.8:.55;
   updateV9Lamps();
   // Visual suspension: natural lateral roll, braking dive and tiny road vibrations.
   const chassis=activeVehicle.userData.chassis;
   if(chassis){chassis.position.y=vehicleState.heave;chassis.rotation.z=vehicleState.roll;chassis.rotation.x=vehicleState.pitch;}
   else activeVehicle.rotation.z=Math.min(.16,Math.max(-.16,vehicleState.roll*.75));
   player.position.copy(taxi.position);
   updateCarWheels(activeVehicle,vehicleState,dt);
   if(result.collision&&t>bumpCooldown){
    toast(result.impact>6?'خد بالك من الطريق! العربية خبطت':'في عائق قدّامك');
    if(result.impact>4&&navigator.vibrate)navigator.vibrate(Math.min(95,Math.round(result.impact*4)));
    fuelSystem.registerImpact(result.impact);
    bumpCooldown=t+1700;
   }
  }else{
   // GTA-style third-person analog locomotion relative to the camera orbit.
   const pace=sprint||keys.shift?6.15:3.65;
   const desired=footDirection(f,turn,cameraYaw,pace);
   const response=1-Math.exp(-(desired.magnitude>.03?8.0:13.0)*dt);
   onFoot.vx+=(desired.vx-onFoot.vx)*response;
   onFoot.vz+=(desired.vz-onFoot.vz)*response;
   const nearPerson=(x,z)=>walkers.some(w=>Math.hypot(x-w.position.x,z-w.position.z)<.77);
   const footBlocked=(x,z)=>blocked(x,z,.46)||
     traffic.some(c=>Math.hypot(x-c.position.x,z-c.position.z)<1.22)||nearPerson(x,z);
   const nx=p.x+onFoot.vx*dt,nz=p.z+onFoot.vz*dt;
   if(!footBlocked(nx,p.z))p.x=nx;else onFoot.vx=0;
   if(!footBlocked(p.x,nz))p.z=nz;else onFoot.vz=0;
   speed=Math.hypot(onFoot.vx,onFoot.vz);
   if(onFoot.grounded&&jumpRequested){
     onFoot.grounded=false;onFoot.vy=5.4;jumpRequested=false;
   }
   if(!onFoot.grounded){
     onFoot.vy-=16.5*dt;onFoot.y=Math.max(0,onFoot.y+onFoot.vy*dt);
     if(onFoot.y===0&&onFoot.vy<=0){onFoot.grounded=true;onFoot.vy=0;}
   }else{onFoot.y=0;}
   // No unintentional queued second jump from a tap while airborne.
   jumpRequested=false;
   player.position.y=onFoot.y;
   if(speed>.12){
     const heading=Math.atan2(onFoot.vx,onFoot.vz);
     player.rotation.y=blendHeading(player.rotation.y,heading,9.0,dt);
   }
  }
  // Existing ambient traffic, pedestrians and delivery tasks remain active.
  for(const c of traffic){
   const d=c.userData,axis=d.axis,otherAxis=axis==='x'?'z':'x';
   const forwardPosition=c.position[axis]+d.direction*5.5;
   // Accelerate after a stop; brake for traffic, pedestrians and the player's taxi.
   const laneBlocked=traffic.some(other=>other!==c&&other.userData.axis===axis&&
       other.userData.direction===d.direction&&Math.abs(other.position[otherAxis]-c.position[otherAxis])<3.1&&
       (other.position[axis]-c.position[axis])*d.direction>0&&
       (other.position[axis]-c.position[axis])*d.direction<7.3);
   const pedAhead=walkers.some(w=>Math.hypot(
      (axis==='x'?forwardPosition:c.position.x)-w.position.x,
      (axis==='z'?forwardPosition:c.position.z)-w.position.z)<2.1);
   const carAhead=driving&&Math.hypot(
      (axis==='x'?forwardPosition:c.position.x)-taxi.position.x,
      (axis==='z'?forwardPosition:c.position.z)-taxi.position.z)<3.8;
   const redLight=cityLife.trafficMustBrake(c);
   const hazard=laneBlocked||pedAhead||carAhead||redLight;
   d.actualCruise=T.MathUtils.damp(d.actualCruise??d.cruise,hazard?0:d.cruise,hazard?7.0:1.7,dt);
   const step=dt*d.actualCruise*d.direction;
   if(c.userData.headlights)c.userData.headlights.emissiveIntensity=
       cityLife.illumination()<.22?2.1:.4;
   if(c.userData.tailLights)c.userData.tailLights.emissiveIntensity=hazard?1.8:.5;
   spinTrafficWheels(c,step);
   c.position[axis]+=step;
   if(c.position[axis]>82)c.position[axis]=-82;
   if(c.position[axis]<-82)c.position[axis]=82;
   if(driving&&Math.hypot(c.position.x-p.x,c.position.z-p.z)<2.3){
    vehicleState.speed=Math.sign(vehicleState.speed)*Math.min(Math.abs(vehicleState.speed),1.4);
    speed=vehicleState.speed;
   }
  }
  gait+=dt*Math.abs(speed)*2.8;
  animateHero(player,gait,driving||!onFoot.grounded?0:Math.min(1,Math.abs(speed)/4.3));
  crowd.update(dt,t,p,traffic,taxi,driving?vehicleState.speed:0);
  streetEvents.update(dt,t);
  career.update(dt,t);
  gps.update(dt);
  if(driving&&p.distanceTo(target)<4&&Math.abs(speed)<10){
   cash+=150;completed++;
   $('money').textContent='ج.م '+Math.round(cash);saveWallet();
   $('task').textContent=`تم توصيل ${completed} طلب • +١٥٠ جنيه. الطلب التالي عند العلامة الدهبية.`;
   target.set(completed%2?-62:62,0,completed%2?50:-50);
   toast('عاش! الطلب وصل • +١٥٠ جنيه')
  }
 }
 beacon.position.set(target.x,.15,target.z);
 pillar.position.set(target.x,6.5,target.z);
 beacon.scale.setScalar(1+Math.sin(t*.003)*.12);
 // Driver camera returns behind the car gradually; dragging the world is a free look.
 if(driving&&t>cameraFreeUntil){
  cameraYaw=blendHeading(cameraYaw,vehicleState.yaw,1.8,dt);
 }
 const angle=cameraYaw;
 let distance=driving?(cameraNear?6.5:10.8)+Math.min(2.0,Math.abs(speed)*.08):(cameraNear?3.8:6.6);
 // Pull camera in when a wall stands between it and the character.
 for(let i=1;i<=10;i++){
  const f=i/10, cx=p.x-Math.sin(angle)*distance*f,cz=p.z-Math.cos(angle)*distance*f;
  if(blocked(cx,cz,.16)){distance=Math.max(2.35,distance*((i-1)/10));break;}
 }
 const baseH=driving?4.2:3.4;
 const height=baseH+Math.sin(cameraPitch)*distance+(driving?Math.min(1.0,Math.abs(speed)*.03):0);
 // A subtle speed-based FOV widening makes fast driving feel different without nausea.
 const desiredFov=62+(driving?Math.min(6,Math.abs(speed)*.16):0);
 const nextFov=camera.fov+(desiredFov-camera.fov)*(1-Math.exp(-dt*2.5));
 if(Math.abs(nextFov-camera.fov)>.018){camera.fov=nextFov;camera.updateProjectionMatrix();}
 const cp=new T.Vector3(p.x-Math.sin(angle)*distance,height,p.z-Math.cos(angle)*distance);
 camera.position.lerp(cp,1-Math.exp(-dt*(driving?5.3:7.0)));
 const lookAhead=driving?Math.min(2.6,Math.abs(speed)*.13):.4;
 camera.lookAt(p.x+Math.sin(angle)*lookAhead,driving?1.42:1.35,p.z+Math.cos(angle)*lookAhead);
 $('speed').innerHTML=Math.round(Math.abs(speed)*3.6)+'<small>كم / س</small>';
 if(driving){
  const gear=gearStatus(vehicleState.speed,parkingBrake,pedal<0||reverseKeyHeld);
  $('gearBadge').textContent=gear.gear==='D'&&v9Live.engineOn?'D'+drivingRealism.getState().gear:
    (!v9Live.engineOn?'N':gear.gear);
  $('gearBadge').dataset.gear=gear.gear;
  updateV9Dashboard(t);
  const steerAngle=vehicleState.steer;
  const turning=steerAngle>.035?'شمال':steerAngle<-.035?'يمين':'مستقيم';
  $('driveReadout').textContent=parkingBrake?'🅿️ فرامل اليد مفعّلة':
    gear.label+' • الدريكسيون '+turning+
    (autoDriver.getState().enabled?' • قيادة ذاتية':' • تحكم يدوي');
  $('steeringNeedle').style.left=(50-Math.max(-1,Math.min(1,steerAngle/.53))*39).toFixed(1)+'%';
 }
 minimap(p);
 if(active&&Math.round(t/1200)%2===0)$('toast').dataset.district=cairo.district(p.x,p.z);
 if(active&&!paused){
  if(activeVehicle!==taxi&&!driving){activeVehicle.position.copy(taxi.position);activeVehicle.rotation.y=taxi.rotation.y;}
  saveClockV55+=dt;
  if(saveClockV55>=2.5){saveClockV55=0;saveWorld(true)}
 }
 sound.tick({active,paused,driving,speed,traffic,p,dt,
 rpm:v9Live.rpm,engineOn:driving&&drivingRealism.getState().engineOn,
 throttle:driving?Math.max(0,v9Live.throttleScale):0,
 skid:driving?vehicleState.skid:0,weather:cityLife.getState().weather
});renderer.render(scene,camera);
}
requestAnimationFrame(frame);
