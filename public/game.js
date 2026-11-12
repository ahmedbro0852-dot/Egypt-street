import { createDetailedPalmV48, updateLandscapeV48 } from './palm-landscape-v48.js';
import { dressReferenceHeroV47, installReferenceHudV47 } from './reference-look-v47.js?v=47.2';
import { installRoyalHudV49 } from './royal-hud-v49.js?v=151.0';
import { installFacadeDepthV46 } from './facade-depth-v46.js';
import { installTravelLightingV44 } from './travel-lighting-v44.js';
import { installCairoGraphicsV45 } from './cairo-graphics-v45.js?v=48.1';
import { prepareDetailedCar } from './detailed-car-v42.js';
import { installDesktopWorldV43 } from './desktop-world-v43.js?v=48.1';
import { createMobileExperienceV40, tuneStickV40 } from './mobile-experience-v40.js';
import { installAdaptiveMobileV50 } from './mobile-performance-v50.js?v=53.0';
import { installMobileLiteV51 } from './mobile-lite-v51.js?v=151.0';
import { installMobileStaticBatchingV52 } from './mobile-static-batching-v52.js';
import { createCityQuestsV50 } from './city-quests-v50.js';
import { animateHeroV31, createVisualPolishV31 } from './animation-polish-v31.js';
import { createV30 } from './v30-expedition.js';
import { createCairoRacesV31 } from './cairo-races-v31.js?v=151.0';
import { createRaceLeagueV100 } from './race-league-v100.js?v=150.0';
import { createDriftV34 } from './drift-system-v34.js';
import { createStreetLaptopV41 } from './street-laptop-v41.js';
import { isRaceArenaV32, RACE_ARENA_BOUNDS_V32 } from './race-arena-v32.js';
import { installRealismRender } from './realism-render-v16.js';
import { createStreetAudio } from './street-audio.js?v=150.0';
import { createDrivingEffectsV56 } from './driving-effects-v56.js';
import { createRoadFeedbackV60 } from './road-feedback-v60.js?v=60.0';
import { installCitySculptV60 } from './city-sculpt-v60.js?v=60.2';
import { installMobilePalmsV60 } from './mobile-palms-v60.js?v=60.2';
import { installCinematicGraphicsV60 } from './cinematic-graphics-v60.js?v=60.1';
import { installMobileInstrumentsV56 } from './mobile-instruments-v56.js';
import * as T from './three.js';
import { installCairo } from './cairo-city.js?v=54.0';
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
import { createTaxiDispatchV15 } from './taxi-dispatch-v15.js';
import { createCockpitV15 } from './cockpit-v15.js';
import { installStreetDetailsV15 } from './street-details-v15.js';
import { createRealisticRoads } from './roads-realism-v17.js?v=54.0';
import { createCollisionPhysicsV18 } from './collision-physics-v18.js';
import { getVehicleDynamicsV19, createMultiBodyV19 } from './vehicle-dynamics-v19.js';
import { createVehiclePhysics, stepVehiclePhysics } from './vehicle-physics.js';
import { stickFromPointer, footDirection, steeringFromStick, blendHeading } from './controls-v3.js';
import { updateCarWheels, spinTrafficWheels, gearStatus } from './wheel-rig.js?v=150.0';
// A deliberate "new game" clears only Egypt Street keys before systems are constructed.
let freshStartV55=false;
try{
 if(window.sessionStorage?.getItem('egypt-street-start-fresh-v55')==='1'){
  window.sessionStorage.removeItem('egypt-street-start-fresh-v55');
  for(const key of GAME_KEYS_V55)window.localStorage?.removeItem(key);
  freshStartV55=true;
 }
}catch(e){}
const isMobileOptimized=!!(window.matchMedia?.('(pointer: coarse)')?.matches||(navigator.maxTouchPoints>0&&innerWidth<950));
// MSAA is enabled on stronger touch devices only; older phones keep the fast path.
const mobileMsaaV54=!isMobileOptimized||((Number(navigator.deviceMemory)||0)>=6&&(Number(navigator.hardwareConcurrency)||0)>=6);
const $=id=>document.getElementById(id),scene=new T.Scene();scene.background=new T.Color('#b9d0cf');scene.fog=new T.Fog('#b9d0cf',65,190);let renderer;try{renderer=new T.WebGLRenderer({canvas:$('world'),antialias:mobileMsaaV54,powerPreference:'high-performance'})}catch(e){const old=$('world'),c=old.cloneNode();old.replaceWith(c);const ctx=c.getContext('2d');let sw=0,sh=0;renderer={setPixelRatio(){},setSize(w,h){sw=c.width=w;sh=c.height=h},render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();const view=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];ctx.fillStyle=scene.background?.getHexString?'#'+scene.background.getHexString():'#b9d0cf';ctx.fillRect(0,0,sw,sh);scene.traverse(o=>{if(!o.isMesh||!o.visible||!o.parent.visible||o.userData.skipFallback)return;for(let ancestor=o.parent;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;const center=new T.Vector3().setFromMatrixPosition(o.matrixWorld);if(center.distanceTo(camera.position)>95)return;const m=new T.Matrix4().multiplyMatrices(view,o.matrixWorld),pos=o.geometry.attributes.position,idx=o.geometry.index;const verts=[];for(let i=0;i<pos.count;i++)verts.push(new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m));for(let i=0;i<(idx?idx.count:pos.count);i+=3){const a=verts[idx?idx.getX(i):i],b=verts[idx?idx.getX(i+1):i+1],d=verts[idx?idx.getX(i+2):i+2];if([a,b,d].some(v=>v.z>1||v.z< -1))continue;if((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x)<0)continue;let color=o.material.color||new T.Color('#647b72');faces.push({a,b,d,z:(a.z+b.z+d.z)/3,color:'#'+color.getHexString()})}});faces.sort((a,b)=>b.z-a.z);for(let f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo((f.a.x+1)*sw/2,(1-f.a.y)*sh/2);ctx.lineTo((f.b.x+1)*sw/2,(1-f.b.y)*sh/2);ctx.lineTo((f.d.x+1)*sw/2,(1-f.d.y)*sh/2);ctx.fill()}}};}renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new T.PerspectiveCamera(62,1,.1,240);const ambient=new T.HemisphereLight(0xffe9c8,0x637278,2.6);scene.add(ambient);const sun=new T.DirectionalLight(0xffd7a1,2.6);sun.position.set(-30,70,20);scene.add(sun);const solids=[];const mat=c=>new T.MeshLambertMaterial({color:c});const materials=new Map();function box(x,y,z,w,h,d,c,parent=scene){if(!materials.has(c))materials.set(c,mat(c));let m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(c));m.position.set(x,y,z);parent.add(m);return m}box(0,-.2,0,460,.3,460,'#baa88a');
const roads=[-60,-30,0,30,60];
for(const n of roads){
 box(n,.01,0,11,.1,170,'#555e60');
 box(0,.01,n,170,.1,11,'#555e60');
}
// V17 batches all asphalt overlays, lane strips and sidewalks instead of hundreds of meshes.
function sign(text,x,y,z,w=5){const c=document.createElement('canvas');c.width=512;c.height=128;let q=c.getContext('2d');q.fillStyle='#174747';q.fillRect(0,0,512,128);q.fillStyle='#ffe3a9';q.font='bold 54px Arial';q.textAlign='center';q.fillText(text,256,84);let m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}));m.position.set(x,y,z);scene.add(m)}
let seed=7;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647}const colors=['#beaa8c','#d4bd99','#b7977d','#d2c2a8','#aaa58c'];for(let a=-2;a<2;a++)for(let b=-2;b<2;b++){const cx=a*30+15,cz=b*30+15;for(let j=0;j<2;j++){let x=cx+(j?5.4:-5.4),h=10+Math.floor(rand()*5)*3;box(x,.2,cz,10,.35,21,'#cfc4ac');box(x,h/2,cz,9.5,h,18,colors[Math.floor(rand()*5)]);solids.push({x,z:cz,w:5.3,d:9.6});box(x,h+.3,cz,10,.5,18.5,'#e4d2b2');for(let y=3;y<h-1;y+=3)for(let wx=-2.8;wx<=3;wx+=2.8){box(x+wx,y,cz+9.03,1.25,1.65,.08,'#42595c');box(x+wx,y-.8,cz+9.3,1.8,.15,.6,'#e1cba5');box(x+wx,y,cz-9.03,1.2,1.6,.08,'#536466')}box(x,1.2,cz+9.08,7,2,.1,j?'#376e70':'#877047');sign(['قهوة البلد','سوبر ماركت النيل','كشري عم سيد','عصير قصب'][((a+2)*4+b+2)%4],x,2.8,cz+9.2,7);box(x,h+1,cz,2,1.8,2,'#8e9a9a')}}
const mobilePalmPositionsV60=[];
function palm(x,z){if(renderer.isWebGLRenderer&&!isMobileOptimized){createDetailedPalmV48(scene,x,z,6.3+Math.abs(z%9)*.14);return;}if(renderer.isWebGLRenderer&&isMobileOptimized){mobilePalmPositionsV60.push([x,z]);return;}box(x,3,z,.35,6,.35,'#8e7956');for(let i=0;i<7;i++){let leaf=box(x,6,z,4,.15,.6,'#4d7954');leaf.rotation.y=i*Math.PI/3.5;leaf.rotation.z=.18}}for(let z=-75;z<80;z+=15){palm(7,z);palm(-67,z)}
const mobilePalmsV60=installMobilePalmsV60({T,scene,renderer,positions:mobilePalmPositionsV60,mobile:isMobileOptimized});
const cairo = installCairo(T,scene,box,sign,solids,{detailedTrees:!!renderer.isWebGLRenderer&&!isMobileOptimized,mobileLite:isMobileOptimized});
const realisticRoads=createRealisticRoads({T,scene,mobileLite:isMobileOptimized,highEndMobile:mobileMsaaV54});
const streetDetails=installStreetDetailsV15({T,scene,box,sign,blocked});
const mobileStaticV52=installMobileStaticBatchingV52({T,scene,renderer,mobileLite:isMobileOptimized});
const cockpit=createCockpitV15({T,scene,camera});
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
 const frontBumper=cub(0,.58,2.11,1.51,.18,.10,black);
 const rearBumper=cub(0,.54,-2.12,1.52,.13,.09,black);
 g.userData.damagePanels={frontBumper,rearBumper,paint};
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
const taxi=car('#d7a52f');prepareDetailedCar(taxi,'#d7a52f',{enabled:!!renderer.isWebGLRenderer&&!isMobileOptimized});taxi.position.set(2,0,8);box(0,1.72,0,.52,.20,.32,'#fff1c8',taxi.userData.chassis);
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
const traffic=[];for(let i=0;i<22;i++){if(isMobileOptimized&&i%3===0)continue;let c=i%4===3?motorcycle(['#b94536','#32657e','#b9ad82'][i%3]):car(['#d5d7d4','#466878','#742e2e','#b8b2a4','#34393e','#e0d2ad','#47745e'][i%7]);if(i%4!==3){if(i%3===0)c.scale.set(1.08,1.15,1.12);else if(i%3===1)c.scale.set(.94,.96,.90)}const direction=i%2?1:-1;c.userData.direction=direction;c.userData.axis=i<12?'z':'x';c.userData.cruise=i%4===3?10.2+(i%3)*.8:7.7+(i%4)*1.25;c.userData.actualCruise=c.userData.cruise;
 c.userData.massV19=i%4===3?215:i%3===0?1590:i%3===1?1125:1310;
 const lane=roads[i%5]+direction*2.6;const along=-76+(i%11)*14;if(c.userData.axis==='z')c.position.set(lane,0,along);else c.position.set(along,0,lane);c.rotation.y=(c.userData.axis==='x'?Math.PI/2:0)+(direction<0?Math.PI:0);traffic.push(c)}
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
const player=makeHero();dressReferenceHeroV47({T,player,renderer});scene.add(player);player.position.set(0,0,12);
const crowd=createEgyptianCrowd(T,scene,(x,z)=>blocked(x,z,.38),{mobileLite:isMobileOptimized});
const walkers=crowd.people; // Forty unique residents

const target=new T.Vector3(62,0,-50);let beacon=new T.Mesh(new T.CylinderGeometry(2,2,.12,32),new T.MeshBasicMaterial({color:0xffcd68,transparent:true,opacity:.7}));scene.add(beacon);let pillar=new T.Mesh(new T.CylinderGeometry(.25,.25,13,12),new T.MeshBasicMaterial({color:0xffd57e,transparent:true,opacity:.45}));scene.add(pillar);
const sound=createStreetAudio();
let pedal=0,brakePedal=false,jumpRequested=false,reverseKeyHeld=false,reversePressed=false,parkingBrake=false,driftHeldV34=false;
let cameraMode='wide',cameraNear=false,cockpitLook=0,drag=null;
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
// V34 momentary drift lever: never latches when pointer is lost or app blurs.
const driftButtonV34=$('driftPedalV34');
driftButtonV34.onpointerdown=e=>{
 e.preventDefault();
 if(!active||!driving||paused)return;
 driftHeldV34=true;
 driftButtonV34.setPointerCapture?.(e.pointerId);
};
driftButtonV34.onpointerup=driftButtonV34.onpointercancel=
 driftButtonV34.onlostpointercapture=()=>{driftHeldV34=false};
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
$('sound').onclick=()=>{const mute=sound.toggle();$('sound').textContent=mute?'الصوت مغلق':'الصوت شغال';$('sound').setAttribute('aria-pressed',String(!mute))};document.addEventListener('visibilitychange',()=>{if(document.hidden){pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;keys={};driftHeldV34=false;resetPad();sprint=false;sound.suspend()}else if(active)sound.start()});let active=false,paused=false,driving=false,yaw=0,speed=0,cash=250,completed=0,joy={x:0,y:0},keys={},sprint=false;
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
function updateCrashBodyVisual(model,condition){
 const panels=model?.userData?.damagePanels;
 if(!panels)return;
 const wear=Math.max(0,Math.min(.88,(100-(Number.isFinite(condition)?condition:100))/95));
 // Minor bumper deformation and scuffed paint survive a page refresh via saved condition.
 panels.frontBumper.position.z=2.11-wear*.26;
 panels.frontBumper.rotation.y=wear*.16;
 panels.rearBumper.position.z=-2.12+wear*.15;
 panels.rearBumper.rotation.y=-wear*.09;
 panels.paint.roughness=.29+wear*.38;
 panels.paint.metalness=.65-wear*.24;
}
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
  if(id!=='motorbike')prepareDetailedCar(model,id==='sport'?'#a91e32':'#294f60',{enabled:!!renderer.isWebGLRenderer&&!isMobileOptimized});
  garageModels[id]=model;
 }
 activeVehicle=garageModels[id]||taxi;
 const dynamics=getVehicleDynamicsV19(id);
 $('vehicleMassV19').textContent='⚖️ الوزن '+dynamics.mass+' كجم • قاعدة العجل '+dynamics.wheelbase.toFixed(2)+' م';
 for(const [key,model] of Object.entries(garageModels)){
  model.visible=key===id;
  model.position.copy(taxi.position);model.rotation.y=taxi.rotation.y;
 }
}
let raceSystem=null;
let raceLeagueV100=null;
let raceModeV32=false,raceReturnPointV32=null;
const RACE_RETURN_KEY_V32='egypt-street-race-return-v32';
const currentRaceVehicleId=()=>{
 const race=raceSystem?.getRace();
 return race?.id==='formula'?'sport':race?.id==='moto'?'motorbike':garage.getVehicle().id;
};
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
 onSelect:id=>{if(raceSystem?.isRunning())raceSystem.finish(false,true);activateGarageVehicle(id)},
 onChanged:()=>saveWorld(true)
});
activateGarageVehicle(garage.getVehicle().id);
const drivingRealism=createDrivingRealismV9({notify:message=>toast(message)});
let lastAbsUiV21=-Infinity;
const collisionWorld=createCollisionPhysicsV18({
 traffic,pedestrians:walkers,storage:walletStorage,
 getRaceCars:()=>raceSystem?.getOpponents()||[],
 getVehicleType:()=>currentRaceVehicleId(),
 getVehicleMass:()=>getVehicleDynamicsV19(currentRaceVehicleId()).mass,
 registerDamage:force=>fuelSystem.registerImpact(force),
 reactPedestrian:(resident,away,power,time,physics)=>
    crowd.reactCollision(resident,away,power,time,physics),
 notify:message=>toast(message),sound:(severity,kind)=>sound.impact(severity,kind),
 charge:cost=>{
  if(cash+.00001<cost)return false;
  cash=Math.max(0,Math.round((cash-cost)*10)/10);
  $('money').textContent='ج.م '+Math.round(cash);saveWallet();return true;
 },
 ui:$('collisionStatus'),forceUi:$('pedestrianForceV20')
});
const multiBodyV19=createMultiBodyV19({
 traffic,getId:()=>currentRaceVehicleId(),
 // Every contact is accounted for by the existing V18 damage/safety system.
 onExtra:()=>{},
 onInfo:message=>toast(message)
});
const rideDispatch=createTaxiDispatchV15({
 T,scene,storage:walletStorage,
 ui:{start:$('v15TaxiRide'),cancel:$('v15RideCancel'),
    counter:$('v15TaxiCounter'),hud:$('v15RideHud'),
    title:$('v15RideTitle'),text:$('v15RideText')},
 getCar:()=>taxi.position,getSpeed:()=>vehicleState.speed,
 isDriving:()=>driving,getVehicle:()=>activeVehicle,
 navigate:(point,label)=>{
  gps.select('tour',true);
  autoDriver.setDestination(point,label,vehicleState,false);
  $('gpsPanel').style.display='none';
 },
 onReward:fare=>{
  cash+=fare;
  $('money').textContent='ج.م '+Math.round(cash);saveWallet();
 },
 notify:message=>toast(message),
 onChange:()=>{
  if(rideDispatch.getState().active)document.body.classList.add('rideActive');
  else document.body.classList.remove('rideActive');
  saveWorld(true);
 }
});
if(rideDispatch.getState().active)document.body.classList.add('rideActive');
raceSystem=createCairoRacesV31({
 T,scene,storage:walletStorage,fresh:freshStartV55,mobileLite:isMobileOptimized,
 getActive:()=>active,getPaused:()=>paused,getDriving:()=>driving,
 getVehicle:()=>vehicleState,
 getDriftInput:()=>({holding:driftHeldV34||!!keys.x}),
 requestDrive:()=>{if(!driving)enter();return driving},
 prepareCar:(course,spawn)=>{
  if(!driving)return false;
  if(course.world){
   raceReturnPointV32=null;raceModeV32=false;
  }else{
   raceReturnPointV32={
    x:vehicleState.x,z:vehicleState.z,yaw:vehicleState.yaw,
    cameraYaw,cameraMode
   };
   try{walletStorage?.setItem(RACE_RETURN_KEY_V32,JSON.stringify(raceReturnPointV32))}catch(e){}
   raceModeV32=true;
  }
  autoDriver.stop();updateAutoPilotLabel();
  parkingBrake=false;updateParkingUi();
  Object.assign(vehicleState,createVehiclePhysics(spawn.x,spawn.z,spawn.yaw));
  taxi.position.set(spawn.x,0,spawn.z);taxi.rotation.y=spawn.yaw;
  player.position.copy(taxi.position);yaw=spawn.yaw;speed=0;
  cameraYaw=spawn.yaw;cameraFreeUntil=0;
  // Formula and motorcycle modes provide their own open-wheel/racing visuals.
  if(course.kind==='formula'||course.kind==='moto'){
   for(const m of Object.values(garageModels))m.visible=false;
   activeVehicle=raceSystem.getPlayerRaceModel(course.kind);
   activeVehicle.position.copy(taxi.position);
   activeVehicle.rotation.y=spawn.yaw;activeVehicle.visible=true;
  }
  if(fuelSystem.getState().fuel>.01){
   if(!fuelSystem.getState().auto)fuelSystem.toggle();
   const needed=120-fuelSystem.getState().target;
   if(needed>0)fuelSystem.changeSpeed(needed);
  }
  if(!drivingRealism.getState().engineOn)
   drivingRealism.toggleEngine(fuelSystem.getState().fuel,0);
  $('controlsHint').textContent='🏁 اتبع الدواير الذهبية، لف بالدريكسيون، والفرامل بإيدك';
  saveWorld(true);return true;
 },
 restoreCar:course=>{
  if(course?.world){
   // Finish where the player drove; never teleport out of the persistent city.
   raceModeV32=false;raceReturnPointV32=null;
   activateGarageVehicle(garage.getVehicle().id);
   $('controlsHint').textContent='🌆 سباقات الشوارع متاحة عند العلامات على الخريطة';
   saveWorld(true);return;
  }
  const back=raceReturnPointV32||{x:2,z:8,yaw:0,cameraYaw:0,cameraMode:'wide'};
  raceModeV32=false;
  activeVehicle.visible=false;
  Object.assign(vehicleState,createVehiclePhysics(back.x,back.z,back.yaw));
  taxi.position.set(back.x,0,back.z);taxi.rotation.y=back.yaw;
  player.position.copy(taxi.position);yaw=back.yaw;speed=0;
  cameraYaw=back.cameraYaw??back.yaw;cameraFreeUntil=0;
  cameraMode=back.cameraMode==='cockpit'?'wide':back.cameraMode||'wide';
  cameraNear=cameraMode==='near';
  raceReturnPointV32=null;
  try{walletStorage?.removeItem(RACE_RETURN_KEY_V32)}catch(e){}
  activateGarageVehicle(garage.getVehicle().id);
  $('controlsHint').textContent='🧭 GPS للمهمات • العصاية للتحكم اليدوي';
  saveWorld(true);
 },
 onReward:(amount,course,rank)=>{
  cash=Math.min(1e7,cash+amount);
  $('money').textContent='ج.م '+Math.round(cash);
  saveWallet();saveWorld(true);
 },
 onFinish:(course,completed,rank,details)=>{
  raceLeagueV100?.complete(course,completed,rank,details);
  saveWorld(true);
 },
 onNavigate:(course,point)=>raceLeagueV100?.navigate(course,point),
 onCountdown:num=>sound.raceCountdown(num),
 notify:message=>toast(message)
});
raceLeagueV100=createRaceLeagueV100({
 storage:walletStorage,fresh:freshStartV55,
 getCourses:()=>raceSystem.getCourses(),
 getRace:()=>raceSystem.getRace(),
 getVehicle:()=>vehicleState,getActive:()=>active,getPaused:()=>paused,
 startRace:id=>raceSystem.start(id),
 openRaces:()=>raceSystem.openPanel(),notify:message=>toast(message)
});
const driftV34=createDriftV34({
 T,scene,storage:walletStorage,fresh:freshStartV55,
 ui:{pedal:$('driftPedalV34'),hud:$('driftV34Hud'),
  score:$('driftV34Score'),info:$('driftV34Info')},
 notify:message=>toast(message)
});
const streetLaptopV41=createStreetLaptopV41({
 T,scene,document,storage:walletStorage,fresh:freshStartV55,
 getPlayer:()=>player.position,
 getActive:()=>active,isDriving:()=>driving,isPaused:()=>paused,
 isRacing:()=>raceSystem?.isRunning()||false,
 getStatus:()=>({
  cash,completed,vehicle:garage.getVehicle().name||garage.getVehicle().id,
  fuel:fuelSystem.getState().fuel,
  races:raceSystem.getHistory(),
  bestLap:raceSystem.getTimeAttackHistory().bestTime
 }),
 notify:message=>toast(message),
 onOpen:()=>{keys={};resetPad();sprint=false}
});
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
 if(t!==Infinity&&t-v9UiLast<125&&v9UiLast>=0)return;
 v9UiLast=t===Infinity?-1:t;
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
 if(raceSystem?.isRunning()){toast('🏁 أثناء السباق القيادة يدوية — استخدم الدريكسيون والفرامل');return;}
 if(parkingBrake){toast('فك فرامل اليد الأول عشان تشغّل القيادة الذاتية');return;}
 autoDriver.toggle(vehicleState);
 if(autoDriver.getState().enabled&&!fuelSystem.getState().auto&&fuelSystem.getState().fuel>.01)fuelSystem.toggle();
 updateAutoPilotLabel();saveWorld(true);
};
function worldSnapshot(){
 return {
  player:{x:player.position.x,z:player.position.z,yaw:player.rotation.y},
  taxi:{x:taxi.position.x,z:taxi.position.z,yaw:taxi.rotation.y},
  driving,parkingBrake,cameraYaw,cameraPitch,cameraMode,money:cash,
  mission:{completed,target:{x:target.x,z:target.z}},
  fuel:fuelSystem.getState(),career:career.getStats(),
  sideEvent:streetEvents.snapshot(),autopilot:autoDriver.getState(),gps:gps.getState(),garage:garage.getState(),drivingRealism:drivingRealism.getState(),rideDispatch:rideDispatch.getState()
 };
}
function saveWorld(force=false){
 if(!active)return false;
 if(force)saveWallet();
 return worldSave.save(worldSnapshot(),force);
}
function restoreWorld(state){
 if(!state)return false;
 // Save snapshots taken during a race must never strand the player in an
 // empty arena after refreshing (the in-progress tournament is not resumed).
 let hasRaceCheckpoint=false;
 try{hasRaceCheckpoint=!!walletStorage?.getItem(RACE_RETURN_KEY_V32)}catch(e){}
 if(isRaceArenaV32(state.taxi.x,state.taxi.z)||hasRaceCheckpoint){
  let back=null;
  try{back=JSON.parse(walletStorage?.getItem(RACE_RETURN_KEY_V32)||'null')}catch(e){}
  if(!back||!Number.isFinite(back.x)||!Number.isFinite(back.z)||
     isRaceArenaV32(back.x,back.z))back={x:2,z:8,yaw:0,cameraYaw:0,cameraMode:'wide'};
  state={...state,taxi:{...state.taxi,x:back.x,z:back.z,yaw:back.yaw||0},
    player:{...state.player,x:back.x,z:back.z},
    cameraYaw:back.cameraYaw??back.yaw??0,cameraMode:'wide'};
  try{walletStorage?.removeItem(RACE_RETURN_KEY_V32)}catch(e){}
 }
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
 cameraMode=state.driving&&state.cameraMode==='cockpit'?'cockpit':
   state.cameraMode==='near'?'near':'wide';
 cameraNear=cameraMode==='near';cockpitLook=0;
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
 rideDispatch.restore(state.rideDispatch);
 if(rideDispatch.getState().active)document.body.classList.add('rideActive');
 else document.body.classList.remove('rideActive');
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
 if(streetLaptopV41.isOpen()){streetLaptopV41.close();return}
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
  if(cameraMode==='cockpit'){cameraMode='wide';cameraNear=false;cockpitLook=0;}
  autoDriver.stop();drivingRealism.exit();
  v9Live={...v9Live,left:false,right:false,engineOn:false,rpm:0};updateV9Lamps();
  parkingBrake=false;updateParkingUi();fuelSystem.exit();document.body.classList.remove('driving');pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;resetPad();$('controlsHint').textContent='↕↔ العصاية للمشي • اسحب للكاميرا';$('modeLabel').textContent='وضع المشي';$('enter').textContent='اركب';$('run').textContent='جري';
 }else if(player.position.distanceTo(taxi.position)<6){
  driving=true;player.visible=false;
  Object.assign(vehicleState,createVehiclePhysics(taxi.position.x,taxi.position.z,taxi.rotation.y));
  yaw=taxi.rotation.y;cameraYaw=yaw;cameraFreeUntil=0;speed=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;resetPad();
  document.body.classList.add('driving');parkingBrake=false;updateParkingUi();fuelSystem.enter();drivingRealism.enter(fuelSystem.getState().fuel);updateV9Dashboard(Infinity);
  autoDriver.start(vehicleState.x,vehicleState.z);
  updateAutoPilotLabel();$('modeLabel').textContent='وضع القيادة';$('enter').textContent='انزل';$('run').textContent='فرامل';
  $('controlsHint').textContent='🧭 GPS للمهمات • العصاية للتحكم اليدوي';
  toast('🤖 العربية بتسوق لوحدها. حرك العصاية للتوجيه اليدوي أو دوس فرامل.');
  saveWorld(true);
 }else toast('قرب من العربية الصفرا الأول')
} $('enter').onclick=enter;$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';toast(paused?'اللعبة متوقفة مؤقتًا':'يلا نكمل')};$('horn').onclick=()=>{sound.horn();streetEvents.horn()};$('run').onpointerdown=e=>{sprint=true;e.currentTarget.setPointerCapture(e.pointerId)};$('run').onpointerup=$('run').onpointercancel=()=>sprint=false;window.onkeydown=e=>{if(streetLaptopV41.isOpen()){
 const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName);
 if(e.key==='Escape'||(e.key?.toLowerCase()==='l'&&!typing)){
  e.preventDefault();streetLaptopV41.close();
 }return;
}
if(e.defaultPrevented)return;const tag=e.target?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;const physical={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',KeyF:'f',KeyJ:'j',KeyG:'g',KeyP:'p',KeyC:'c',KeyX:'x',KeyH:'h',KeyB:'b',KeyM:'m',Space:' ',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',ShiftLeft:'shift',ShiftRight:'shift'};const k=physical[e.code]||e.key.toLowerCase();if(k==='escape'&&!e.repeat&&active){$('pause').click();return}if(k==='m'&&!e.repeat&&active&&!paused){$('v40Menu')?.click();return}
if(k==='l'&&!e.repeat&&active&&!paused){streetLaptopV41.toggle();return}
if(paused)return;if(k==='h'&&!e.repeat)$('horn').click();if(k==='b'&&!e.repeat)$('garageBtn').click();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k===' '&&!e.repeat&&!driving)jumpRequested=true;if(k==='e'&&!e.repeat)enter();if(k==='f'&&!e.repeat){if(!career.interact())streetEvents.interact()}if(k==='j'&&!e.repeat)$('jobsBtn').click();if(k==='g'&&!e.repeat)$('gpsBtn').click();if(k==='p'&&!e.repeat)$('handbrake').click();if(k==='c'&&!e.repeat)$('camera').click()};window.onkeyup=e=>{const physical={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyX:'x',Space:' ',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',ShiftLeft:'shift',ShiftRight:'shift'};keys[physical[e.code]||e.key.toLowerCase()]=false};window.onblur=()=>{pedal=0;brakePedal=false;reverseKeyHeld=false;reversePressed=false;jumpRequested=false;keys={};driftHeldV34=false;resetPad();sprint=false;streetLaptopV41.close()};
const pad=$('joy'),knob=$('knob'),worldCanvas=$('world');
function resetPad(){joy.x=0;joy.y=0;if(knob)knob.style.transform='translate(0px,0px)'}
function stickMove(e){
 const r=pad.getBoundingClientRect(),radius=Math.max(20,Math.min(r.width,r.height)*.5-22);
 const x=e.clientX-r.left-r.width*.5,y=e.clientY-r.top-r.height*.5;
 joy=tuneStickV40(stickFromPointer(x,y,radius),mobileV40.getSettings().deadzone);
 knob.style.transform='translate('+Math.round(joy.x*radius)+'px,'+Math.round(joy.y*radius)+'px)';
}
pad.onpointerdown=e=>{
 e.preventDefault();pad.setPointerCapture(e.pointerId);stickMove(e);
};
pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId)){e.preventDefault();stickMove(e)}};
pad.onpointerup=pad.onpointercancel=pad.onlostpointercapture=()=>resetPad();
$('camera').onclick=()=>{
 if(driving)cameraMode=cameraMode==='wide'?'near':cameraMode==='near'?'cockpit':'wide';
 else cameraMode=cameraMode==='near'?'wide':'near';
 cameraNear=cameraMode==='near';cockpitLook=0;
 toast(cameraMode==='cockpit'?'🎥 كاميرا داخل العربية':cameraNear?'🎥 كاميرا قريبة':'🎥 كاميرا واسعة');
 saveWorld(true);
};
worldCanvas.oncontextmenu=e=>e.preventDefault();
worldCanvas.onpointerdown=e=>{
 if(!active)return;
 e.preventDefault();
 drag={id:e.pointerId,x:e.clientX,y:e.clientY};
 worldCanvas.setPointerCapture?.(e.pointerId);
};
worldCanvas.onpointermove=e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const sensitivity=mobileV40.getSettings().sensitivity;
 const dx=(e.clientX-drag.x)*sensitivity,dy=(e.clientY-drag.y)*sensitivity;
 if(driving&&cameraMode==='cockpit'){
  cockpitLook=Math.max(-.70,Math.min(.70,cockpitLook-dx*.0042));
 }else{
  cameraYaw-=dx*.0053;cameraPitch=Math.max(-.24,Math.min(.52,cameraPitch+dy*.0035));
 }
 cameraFreeUntil=performance.now()+2800;
 drag.x=e.clientX;drag.y=e.clientY;
};
worldCanvas.onpointerup=worldCanvas.onpointercancel=worldCanvas.onlostpointercapture=e=>{
 if(drag&&drag.id===e.pointerId)drag=null;
};
function blocked(x,z,radius=.45){
 if(isRaceArenaV32(x,z)){
  if(!raceModeV32)return true;
  const b=RACE_ARENA_BOUNDS_V32;
  return x<b.left+radius||x>b.right-radius||
         z<b.top+radius||z>b.bottom-radius;
 }
 if(Math.abs(x)>218-radius||Math.abs(z)>168-radius||cairo.isWater(x,z))return true;
 return solids.some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius)
}
function roadGrip(x,z){
 if(raceModeV32&&isRaceArenaV32(x,z))return 1.09;
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
 const small=currentRaceVehicleId()==='motorbike';
 const halfL=small?.91:1.83,halfW=small?.36:.87,bumper=small?1.05:2.05;
 for(const [front,right] of [[halfL,halfW],[halfL,-halfW],[-halfL,halfW],[-halfL,-halfW],[bumper,0],[-bumper,0]]){
  const px=x+sin*front+cos*right,pz=z+cos*front-sin*right;
  if(blocked(px,pz,.12))return true;
 }
 // Oriented car silhouettes and pedestrian capsules replace circular distance traps.
 // Returning contact details lets physics transfer impact instead of freezing the car.
 return collisionWorld.probe(x,z,angle);
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}onresize=resize;resize();let last=0,gait=0;const map=$('map').getContext('2d');function minimap(p){
 map.clearRect(0,0,180,180);
 if(raceModeV32){
  // V37: a racetrack-only minimap, no Cairo streets overlaying the arena.
  map.fillStyle='#344c3c';map.fillRect(0,0,180,180);
  const circuit=raceSystem.getCourses()[0].points;
  const scale=.56,mx=x=>90+(x-p.x)*scale,mz=z=>90+(z-p.z)*scale;
  map.lineCap='round';map.lineJoin='round';
  map.beginPath();map.moveTo(mx(circuit[0][0]),mz(circuit[0][1]));
  for(const [x,z] of circuit.slice(1))map.lineTo(mx(x),mz(z));
  map.closePath();map.strokeStyle='#272c32';map.lineWidth=11;map.stroke();
  map.strokeStyle='#efbd64';map.lineWidth=1.5;map.stroke();
  const next=raceSystem.getRace()?.waypoint;
  if(next){map.beginPath();map.arc(mx(next.x),mz(next.z),6,0,Math.PI*2);
    map.strokeStyle='#ffcb6c';map.lineWidth=2;map.stroke()}
  const ghost=raceSystem.getGhostPosition?.();
  if(ghost){map.beginPath();map.arc(mx(ghost.x),mz(ghost.z),4.6,0,Math.PI*2);
    map.fillStyle='#65fff0';map.fill();
    map.fillStyle='#c3fffd';map.font='bold 10px Arial';
    map.fillText('👻',mx(ghost.x)+5,mz(ghost.z)-6)}
  map.beginPath();map.arc(90,90,5.5,0,Math.PI*2);
  map.fillStyle='#ff756b';map.fill();
  map.fillStyle='#fff0bf';map.font='bold 10px Arial';
  map.fillText('🏁 حلبة السباق',7,14);
  map.lineCap='butt';map.lineJoin='miter';
  return;
 }
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
 const ridePoint=rideDispatch.getPoint();
 if(ridePoint){
  map.fillStyle='#ffe29b';map.beginPath();map.arc(mx(ridePoint.x),mz(ridePoint.z),6,0,Math.PI*2);map.fill();
  map.fillStyle='#172c32';map.font='bold 11px Arial';map.fillText('🚕',mx(ridePoint.x)-6,mz(ridePoint.z)-8);
 }
 const eventWaypoint=streetEvents.waypoint();
 if(eventWaypoint){
  map.strokeStyle='#67e6eb';map.lineWidth=2;
  map.beginPath();map.arc(mx(eventWaypoint.x),mz(eventWaypoint.z),7,0,Math.PI*2);map.stroke();
 }
 const worldRaceState=raceSystem?.getRace();
 const v100NavigationPoint=raceLeagueV100?.getWaypoint();
 if(v100NavigationPoint&&!worldRaceState){
  map.beginPath();map.arc(mx(v100NavigationPoint.x),mz(v100NavigationPoint.z),8,0,Math.PI*2);
  map.fillStyle='#55f0b9';map.fill();
  map.strokeStyle='#102e31';map.lineWidth=2;map.stroke();
  map.fillStyle='#153b31';map.font='bold 11px Arial';
  map.fillText('🏁',mx(v100NavigationPoint.x)-6,mz(v100NavigationPoint.z)-11);
 }
 if(!worldRaceState){
  for(const race of raceSystem.getCourses().filter(c=>c.world)){
   const [sx,sz]=race.points[0],d=Math.hypot(sx-p.x,sz-p.z);
   if(d>135)continue;
   map.fillStyle='#62ebbe';map.beginPath();map.arc(mx(sx),mz(sz),5.2,0,Math.PI*2);map.fill();
   map.fillStyle='#0b3239';map.font='bold 10px Arial';map.fillText('S',mx(sx)-3.5,mz(sz)+3.4);
  }
 }
 const racePoint=worldRaceState?.waypoint;
 if(racePoint){
  const circuit=raceSystem.getCourses().find(c=>c.id===worldRaceState.id)?.points||raceSystem.getCourses()[0].points;
  map.strokeStyle='#f0bd69';map.lineWidth=5;
  map.beginPath();map.moveTo(mx(circuit[0][0]),mz(circuit[0][1]));
  for(const [rx,rz] of circuit.slice(1))map.lineTo(mx(rx),mz(rz));
  map.closePath();map.stroke();
  map.strokeStyle='#ffca62';map.lineWidth=3;
  map.beginPath();map.arc(mx(racePoint.x),mz(racePoint.z),8,0,Math.PI*2);map.stroke();
  map.fillStyle='#ffce79';map.font='bold 11px Arial';map.fillText('🏁',mx(racePoint.x)-5,mz(racePoint.z)-10);
 }
 // V41 laptop desk: turquoise 💻 marker near the spawn intersection.
 if(!raceModeV32){
  const laptopPos=streetLaptopV41.position;
  map.fillStyle='#57f1d4';map.beginPath();
  map.arc(mx(laptopPos.x),mz(laptopPos.z),5.4,0,Math.PI*2);map.fill();
  map.font='bold 12px Arial';
  map.fillText('💻',mx(laptopPos.x)-7,mz(laptopPos.z)-10);
 }
 const questMarker=cityQuestsV50.getMarker();
 if(questMarker){map.strokeStyle='#ffd16e';map.lineWidth=2.5;map.beginPath();map.arc(mx(questMarker.x),mz(questMarker.z),6,0,Math.PI*2);map.stroke();map.fillStyle='#fff4ba';map.font='bold 12px Arial';map.fillText('⭐',mx(questMarker.x)-7,mz(questMarker.z)-8)}
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
let saveClockV55=0,lastMapV51=-10000,lastStreetV51=-10000,lastLandscapeV51=-10000,crowdClockV51=0;
// Reuse camera vectors: avoid per-frame allocations on mobile browsers.
const seatV60=new T.Vector3(),chaseV60=new T.Vector3();
let speedLabelV60=-1,lastDashV60=-1000;
window.addEventListener?.('pagehide',()=>saveWorld(true));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)saveWorld(true);
});
function frame(t){
 requestAnimationFrame(frame);
 if(mobileLiteV51.enabled&&last&&t-last<mobileLiteV51.frameInterval())return;
 const dt=last?Math.min((t-last)/1000,.04):1/60;last=t;
 mobilePerformanceV50.sample(t);
 mobileLiteV51.update(t);
 const p=driving?taxi.position:player.position;
 if(active&&!paused){
  cityLife.update(dt,t,p);
  realisticRoads.update(cityLife.getState().weather,dt);
  if(!mobileLiteV51.enabled||t-lastStreetV51>180){streetDetails.update(cityLife.illumination());lastStreetV51=t;}
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
   if(autoDriver.getState().enabled&&
      (Math.abs(manualSteer)>.24||driftHeldV34||keys.x)){
     autoDriver.stop();updateAutoPilotLabel();
   }
   if(raceSystem?.isRunning()&&autoDriver.getState().enabled){
    autoDriver.stop();updateAutoPilotLabel();
   }
   const autopilot=autoDriver.controls(vehicleState,traffic,walkers,dt,{cruiseKmh:fuelSystem.getState().target});
   const racingId=currentRaceVehicleId();
   const tune={...garage.getTuning(),...getVehicleDynamicsV19(racingId)};
   // V33: quicker steering all over Cairo, extra turning authority at the
   // dedicated track. Existing garage steering upgrades still stack.
   const racingNow=raceSystem?.isRunning();
   tune.steerScale=Math.min(1.75,(tune.steerScale||1)*
      (racingNow?(racingId==='motorbike'?1.24:1.22):1.06));
   tune.turnAssist=racingNow?(racingId==='motorbike'?4.9:5.15):4.0;
   if(racingId==='sport'&&raceSystem?.isFormula()){tune.topSpeed=52;tune.engineForce=10100}
   const roadSurface=raceModeV32&&isRaceArenaV32(vehicleState.x,vehicleState.z)?
    {grip:1.05,bump:0,height:0,onRoad:true,roadType:'race circuit'}:
    realisticRoads.surfaceAt(vehicleState.x,vehicleState.z);
   const tyreGrip=roadGrip(p.x,p.z)*Math.min(cityLife.grip(),1-.24*(roadSurface.wet||0))*streetDetails.grip(p.x,p.z)*
       roadSurface.grip*tune.gripScale;
   const steer=autopilot.active?autopilot.steer:manualSteer;
   const braking=brakePedal||sprint||keys.shift||keys[' ']||
      $('jobsPanel').style.display==='block'||$('garagePanel').style.display==='block'||
      $('gpsPanel').style.display==='block'||autopilot.brake||parkingBrake||reverseBraking||
      raceSystem?.getRace()?.phase==='countdown';
   const driftNowV34=!!(driftHeldV34||keys.x)&&!braking&&!paused;
   const demandedThrottle=autopilot.active?
      (braking||fuelSystem.getState().fuel<=.01||!fuelSystem.getState().auto?
        0:Math.min(fuelSystem.throttle({manual:1}),autopilot.throttle)):
     fuelSystem.throttle({
       reverse:reverseKeyHeld,
       brake:braking||(matchMedia('(pointer:fine)').matches&&!reverseKeyHeld&&!(keys.w||keys.arrowup)),manual:(keys.w||keys.arrowup)?1:0
     });
   v9Live=drivingRealism.update(dt,{
      driving:true,speed:vehicleState.speed,throttle:demandedThrottle,brake:braking,
      steer:vehicleState.steer,yaw:vehicleState.yaw,fuel:fuelSystem.getState().fuel,
      parking:parkingBrake,skid:vehicleState.skid,vehicleId:garage.getVehicle().id
   });
   const throttle=demandedThrottle*v9Live.throttleScale*
      (raceSystem?.getRace()?.phase==='countdown'?0:1);
   const oldPos={x:vehicleState.x,z:vehicleState.z};
   const result=stepVehiclePhysics(vehicleState,{
     throttle,steer,brake:braking,driftBrake:driftNowV34,absEnabled:true,
     grip:tyreGrip,tuning:tune
   },dt,carCollision);
   if(t-lastAbsUiV21>170){
    $('v21AbsStatus').textContent=braking&&result.absActive>.045?
      '🟠 ABS بينظّم ضغط الفرامل • تماسك '+Math.round(tyreGrip*100)+'%':
      braking?'🔵 فرملة متحكم فيها • ABS جاهز':'🟢 ABS جاهز';
    lastAbsUiV21=t;
   }
   if(!raceModeV32)cityLife.observeDriving(oldPos,vehicleState);
   taxi.position.x=vehicleState.x;taxi.position.z=vehicleState.z;
   taxi.position.y=T.MathUtils.damp(taxi.position.y,roadSurface.height||0,5.5,dt);
   fuelSystem.update(dt,t,throttle,v9Live.engineOn);
   taxi.rotation.y=vehicleState.yaw;yaw=vehicleState.yaw;speed=vehicleState.speed;
   if(activeVehicle!==taxi){activeVehicle.position.copy(taxi.position);activeVehicle.rotation.y=taxi.rotation.y;}
   if(activeVehicle.userData.headlights)activeVehicle.userData.headlights.emissiveIntensity=
     cityLife.illumination()<.22?2.6:.35;
   if(activeVehicle.userData.tailLights)activeVehicle.userData.tailLights.emissiveIntensity=braking?2.8:.55;
   updateV9Lamps();
   // Visual suspension: natural lateral roll, braking dive and tiny road vibrations.
   const chassis=activeVehicle.userData.chassis;
   if(chassis){chassis.position.y=vehicleState.heave+roadSurface.bump*.032;chassis.rotation.z=vehicleState.roll;chassis.rotation.x=vehicleState.pitch;}
   else activeVehicle.rotation.z=Math.min(.16,Math.max(-.16,vehicleState.roll*.75));
   player.position.copy(taxi.position);
   updateCarWheels(activeVehicle,vehicleState,dt);
   updateCrashBodyVisual(activeVehicle,fuelSystem.getState().condition);
   if(result.collision){
    // V19 reports every touched body in one frame, including chain collisions.
    const contacts=result.contact?.contacts|| (result.contact?[result.contact]:[]);
    const triggered=[];
    let maxSeverity=0;
    for(const contact of contacts){
     const event=collisionWorld.onCollision(contact,vehicleState,result.impact,t);
     if(event){triggered.push(contact);maxSeverity=Math.max(maxSeverity,event.severity);}
    }
    if(triggered.length){
      multiBodyV19.resolve(triggered,vehicleState,result.impact,t);
      if(navigator.vibrate)navigator.vibrate(Math.min(150,Math.round(maxSeverity*6)));
    }
    if(!result.contact&&t>bumpCooldown){
      toast(result.impact>6?'💥 خبطت رصيف أو حائط! راجع حالة العربية.':'في عائق قدّامك');
      if(result.impact>4&&navigator.vibrate)navigator.vibrate(Math.min(85,Math.round(result.impact*4)));
      fuelSystem.registerImpact(result.impact);
      sound.impact(result.impact,'structure');
      bumpCooldown=t+1600;
    }
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
   const currentSpeed=d.actualCruise??d.cruise;
   // Driver perception and following distance scale with speed; cars slow early.
   const sight=7+currentSpeed*1.0;
   const approaching=obj=>{
     const ahead=(obj.position[axis]-c.position[axis])*d.direction;
     const lateral=Math.abs(obj.position[otherAxis]-c.position[otherAxis]);
     return ahead>0&&ahead<sight&&lateral<2.2;
   };
   const laneBlocked=traffic.some(other=>other!==c&&
     other.userData.axis===axis&&other.userData.direction===d.direction&&approaching(other));
   const pedAhead=walkers.some(w=>approaching(w));
   const carAhead=driving&&approaching(taxi);
   const redLight=cityLife.trafficMustBrake(c);
   const hazard=laneBlocked||pedAhead||carAhead||redLight;
   // Ease into a stop rather than instantaneously dropping to zero velocity.
   d.actualCruise=T.MathUtils.damp(currentSpeed,hazard?0:d.cruise,
      hazard?(pedAhead||carAhead?5.5:3.5):1.6,dt);
   const step=dt*d.actualCruise*d.direction;
   if(c.userData.headlights)c.userData.headlights.emissiveIntensity=
       cityLife.illumination()<.22?2.1:.4;
   if(c.userData.tailLights)c.userData.tailLights.emissiveIntensity=hazard?1.8:.5;
   // Swept traffic collision prevents NPC cars and bikes passing through each other.
   const safeStep=collisionWorld.trafficStep(c,step,t,taxi,driving);
   spinTrafficWheels(c,safeStep);
   c.position[axis]+=safeStep;
   collisionWorld.animateTraffic(c,dt);
   if(c.position[axis]>82)c.position[axis]=-82;
   if(c.position[axis]<-82)c.position[axis]=82;
  }
  gait+=dt*Math.abs(speed)*2.8;
  animateHeroV31(player,gait,driving?0:Math.min(1,Math.abs(speed)/4.3),{dt,speed:driving?0:speed,grounded:driving||onFoot.grounded,vertical:onFoot.vy});
  crowdClockV51+=dt;
  if(!mobileLiteV51.enabled||crowdClockV51>=.08){crowd.update(Math.min(.12,crowdClockV51),t,p,traffic,taxi,driving?vehicleState.speed:0);crowdClockV51=0;}
  streetEvents.update(dt,t);
  career.update(dt,t);
  rideDispatch.update(dt);
  gps.update(dt);
  raceSystem.update(dt,t);
  raceLeagueV100?.update(t);
  driftV34.update({vehicle:vehicleState,dt,t,
   holding:driftHeldV34||!!keys.x,driving,paused,
   racing:raceSystem.isRunning(),vehicleType:currentRaceVehicleId()});
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
 // V15: alternate between chase, near chase and a first-person driver seat.
 const interior=driving&&cameraMode==='cockpit';
 cockpit.setVisible(interior);
 if(interior)document.body.classList.add('cockpitActive');
 else document.body.classList.remove('cockpitActive');
 if(driving)activeVehicle.visible=!interior;
 else activeVehicle.visible=true;
 const desiredFov=interior?68:(driving?62:58)+(driving&&!mobileV40.getSettings().steady?Math.min(6,Math.abs(speed)*.16):0);
 const nextFov=camera.fov+(desiredFov-camera.fov)*(1-Math.exp(-dt*2.5));
 if(Math.abs(nextFov-camera.fov)>.018){camera.fov=nextFov;camera.updateProjectionMatrix();}
 if(interior){
   const vehicleAngle=vehicleState.yaw;
   const forwardX=Math.sin(vehicleAngle),forwardZ=Math.cos(vehicleAngle);
   const rightX=Math.cos(vehicleAngle),rightZ=-Math.sin(vehicleAngle);
   const seat=seatV60.set(p.x+forwardX*.40-rightX*.31,1.65+taxi.position.y,
     p.z+forwardZ*.40-rightZ*.31);
   camera.position.lerp(seat,1-Math.exp(-dt*12));
   const lookAngle=vehicleAngle+cockpitLook;
   camera.lookAt(p.x+Math.sin(lookAngle)*12,1.62+taxi.position.y,p.z+Math.cos(lookAngle)*12);
   cockpit.update(vehicleState.steer,vehicleState.speed,garage.getVehicle().id==='motorbike');
 }else{
   // Smooth chase camera or walking orbit; wall avoidance stays intact.
   if(driving&&t>cameraFreeUntil)cameraYaw=blendHeading(cameraYaw,vehicleState.yaw,1.8,dt);
   const angle=cameraYaw;
   let distance=driving?(cameraNear?6.5:10.8)+Math.min(2.0,Math.abs(speed)*.08):(cameraNear?3.2:4.8);
   for(let i=1;i<=10;i++){
    const f=i/10, cx=p.x-Math.sin(angle)*distance*f,cz=p.z-Math.cos(angle)*distance*f;
    if(blocked(cx,cz,.16)){distance=Math.max(2.35,distance*((i-1)/10));break;}
   }
   const baseH=driving?4.2:2.35;
   const height=baseH+Math.sin(cameraPitch)*distance+(driving?Math.min(1.0,Math.abs(speed)*.03):0);
   const chase=chaseV60.set(p.x-Math.sin(angle)*distance,height,p.z-Math.cos(angle)*distance);
   camera.position.lerp(chase,1-Math.exp(-dt*(driving?5.3:7.0)));
   const lookAhead=driving?Math.min(2.6,Math.abs(speed)*.13):.4;
   camera.lookAt(p.x+Math.sin(angle)*lookAhead,driving?1.42:1.35,p.z+Math.cos(angle)*lookAhead);
 }
 const speedKmhV60=Math.round(Math.abs(speed)*3.6);
 if(speedLabelV60!==speedKmhV60){speedLabelV60=speedKmhV60;$('speed').innerHTML=speedKmhV60+'<small>كم / س</small>';}
 // Keep driving instrumentation responsive while avoiding repeated DOM layout on touch devices.
 if(driving&&(!mobileLiteV51.enabled||t-lastDashV60>=110)){
  lastDashV60=t;
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
 if(!mobileLiteV51.enabled||t-lastMapV51>=250){if(!mobileLiteV51.enabled||$('map').getClientRects().length)minimap(p);lastMapV51=t;}
 if(active&&Math.round(t/1200)%2===0)$('toast').dataset.district=cairo.district(p.x,p.z);
 if(active&&!paused){
  if(activeVehicle!==taxi&&!driving){activeVehicle.position.copy(taxi.position);activeVehicle.rotation.y=taxi.rotation.y;}
  if(!driving)updateCrashBodyVisual(activeVehicle,fuelSystem.getState().condition);
  saveClockV55+=dt;
  if(saveClockV55>=2.5){saveClockV55=0;saveWorld(true)}
 }
 const v56Brake=!!(brakePedal||parkingBrake||sprint||keys.shift);
 const v56Engine=!!(driving&&drivingRealism.getState().engineOn);
 drivingFXV56.update({dt,vehicle:activeVehicle,active,paused,driving,speed,
  skid:driving?vehicleState.skid:0,night:cityLife.illumination()<.22,braking:v56Brake,
  engineOn:v56Engine,weather:cityLife.getState().weather});
 roadFeedbackV60.update({dt,vehicle:activeVehicle,active,paused,driving,speed,
  skid:driving?vehicleState.skid:0,weather:cityLife.getState().weather,
  motorbike:garage.getVehicle().id==='motorbike'});
 const v56Fuel=fuelSystem.getState();
 mobileInstrumentsV56.update(t,{speed,rpm:v9Live.rpm,gear:driving?v9Live.gear:'N',
  fuel:v56Fuel.fuel,capacity:v56Fuel.capacity,braking:v56Brake});
 sound.tick({active,paused,driving,speed,traffic,p,dt,
 rpm:v9Live.rpm,engineOn:v56Engine,gear:v9Live.gear,turn:v9Live.turn,hazards:v9Live.hazards,braking:v56Brake,
 throttle:driving?Math.max(0,v9Live.throttleScale):0,
 skid:driving?vehicleState.skid:0,weather:cityLife.getState().weather
});v30.update(dt);cityQuestsV50.update(dt);mobileV40.update();streetLaptopV41.update(t);visualPolishV31.update({driving,vehicle:activeVehicle,night:cityLife.illumination()<.22,grounded:onFoot.grounded,dt});desktopWorldV43.update(dt);travelLightingV44.update(dt);cairoGraphicsV45.update(dt);if(!mobileLiteV51.enabled||t-lastLandscapeV51>=110){updateLandscapeV48(dt,cityLife.getState().weather==='مطر');lastLandscapeV51=t;}mobilePalmsV60.update(t*.001,cityLife.getState().weather==='مطر');
 cinematicV60.update({dt,time:t*.001,active,paused,driving,speed,
 steer:driving?vehicleState.steer:0,yawRate:driving?vehicleState.yawRate:0,
 skid:driving?vehicleState.skid:0,braking:v56Brake,interior,
 weather:cityLife.getState().weather,daylight:cityLife.illumination()});
 renderer.render(scene,camera);
 royalHudV49?.recordFrame?.(t);
}
try { installRealismRender({T,scene,renderer,sun}); } catch(error) { console.warn('Material quality pass unavailable',error); }
const v30=createV30({getPlayer:()=>driving?taxi.position:player.position,getDriving:()=>driving,getActive:()=>active,getPaused:()=>paused,renderer,fresh:freshStartV55,onReward:amount=>{cash+=amount;$('money').textContent='ج.م '+Math.round(cash);saveWallet();toast('مكافأة رحلتك • +'+amount+' جنيه')}});
const cityQuestsV50=createCityQuestsV50({getPosition:()=>driving?taxi.position:player.position,getDriving:()=>driving,getSpeed:()=>vehicleState.speed,getActive:()=>active,getPaused:()=>paused,getInRace:()=>raceModeV32,fresh:freshStartV55,onReward:(amount,q)=>{cash+=amount;$('money').textContent='ج.م '+Math.round(cash);saveWallet();saveWorld(true);toast('🎉 تحدي '+q.id+' اكتمل! +'+amount+' جنيه')}});
const visualPolishV31=createVisualPolishV31({T,scene,renderer,player});
const drivingFXV56=createDrivingEffectsV56({T,scene,renderer,mobile:isMobileOptimized});
const roadFeedbackV60=createRoadFeedbackV60({T,scene,renderer,mobile:isMobileOptimized});
const mobileV40=createMobileExperienceV40({getActive:()=>active,getPaused:()=>paused,setPaused:value=>{paused=value;$('pause').textContent=paused?'▶':'Ⅱ'},resetInput:()=>{keys={};pedal=0;brakePedal=false;sprint=false;reverseKeyHeld=false;reversePressed=false;driftHeldV34=false;jumpRequested=false;drag=null;resetPad()},notify:toast});
const desktopWorldV43=installDesktopWorldV43({T,scene,renderer,sun,getVehicle:()=>activeVehicle,getState:()=>({driving,illumination:cityLife.illumination(),weather:cityLife.getState().weather,yaw:vehicleState.yaw,speed:vehicleState.speed,skid:vehicleState.skid}),notify:toast});
const travelLightingV44=installTravelLightingV44({T,scene,renderer,sun,getPosition:()=>driving?taxi.position:player.position,getDaylight:()=>cityLife.illumination()});
const cairoGraphicsV45=installCairoGraphicsV45({T,scene,renderer,camera,sun,getFocus:()=>driving?taxi.position:player.position,getState:()=>({illumination:cityLife.illumination(),weather:cityLife.getState().weather})});
const facadeDepthV60=installFacadeDepthV46({T,scene,renderer});
const citySculptV60=installCitySculptV60({T,scene,renderer,mobile:isMobileOptimized,
 lowEnd:isMobileOptimized&&((Number(navigator.deviceMemory)||4)<=3||(Number(navigator.hardwareConcurrency)||4)<=4)});
installReferenceHudV47();
const royalHudV49=installRoyalHudV49({desktopWorldV43,mobileV40,renderer,getActive:()=>active,getCompleted:()=>completed,getDriving:()=>driving});
const mobileLiteV51=installMobileLiteV51({getActive:()=>active,getDriving:()=>driving,getSpeed:()=>speed,getFpsSetting:()=>royalHudV49?.getSettings?.()?.fpsTarget||'auto',getFps:()=>royalHudV49?.getFps?.()||0,getShowFps:()=>!!royalHudV49?.getSettings?.()?.showFpsMobile,
 getRacing:()=>!!raceSystem?.isRunning(),openRaces:()=>raceSystem?.openPanel()});
const mobileInstrumentsV56=installMobileInstrumentsV56({getActive:()=>active,getDriving:()=>driving});
const mobilePerformanceV50=installAdaptiveMobileV50({renderer,getActive:()=>active,getPaused:()=>paused,getQuality:()=>royalHudV49?.getSettings?.()?.quality||'auto',getTargetFps:()=>mobileLiteV51.targetFps(),getSharpness:()=>royalHudV49?.getSettings?.()?.sharpness||1});
const cinematicV60=installCinematicGraphicsV60({T,scene,renderer,camera,sun,mobile:isMobileOptimized,
 getEnabled:()=>royalHudV49?.getSettings?.()?.cinematic!==false,
 getSteady:()=>!!mobileV40.getSettings().steady,
 getQuality:()=>royalHudV49?.getSettings?.()?.quality||'auto'});
if(!renderer.isWebGLRenderer){
 const notice=document.createElement('div');notice.id='graphicsFallbackV48';notice.setAttribute('role','status');
 notice.textContent='عرض رسومي مبسّط — WebGL غير متاح. فعّل تسريع الرسومات لظهور التفاصيل.';
 notice.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:76px;max-width:60vw;padding:7px 12px;border:1px solid #d5b77a70;border-radius:10px;background:#201e1bde;color:#e8d1a6;font:10px/1.7 Tahoma;text-align:center;z-index:70;pointer-events:none';document.body.append(notice);
}
requestAnimationFrame(frame);
