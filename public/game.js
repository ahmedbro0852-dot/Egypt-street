import * as T from './three.js';
import { installCairo } from './cairo-city.js';
import { createVehiclePhysics, stepVehiclePhysics } from './vehicle-physics.js';
const $=id=>document.getElementById(id),scene=new T.Scene();scene.background=new T.Color('#b9d0cf');scene.fog=new T.Fog('#b9d0cf',65,190);let renderer;try{renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true})}catch(e){const old=$('world'),c=old.cloneNode();old.replaceWith(c);const ctx=c.getContext('2d');let sw=0,sh=0;renderer={setPixelRatio(){},setSize(w,h){sw=c.width=w;sh=c.height=h},render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();const view=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];ctx.fillStyle='#b9d0cf';ctx.fillRect(0,0,sw,sh);scene.traverse(o=>{if(!o.isMesh||!o.visible||!o.parent.visible||o.userData.skipFallback)return;for(let ancestor=o.parent;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;const center=new T.Vector3().setFromMatrixPosition(o.matrixWorld);if(center.distanceTo(camera.position)>95)return;const m=new T.Matrix4().multiplyMatrices(view,o.matrixWorld),pos=o.geometry.attributes.position,idx=o.geometry.index;const verts=[];for(let i=0;i<pos.count;i++)verts.push(new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m));for(let i=0;i<(idx?idx.count:pos.count);i+=3){const a=verts[idx?idx.getX(i):i],b=verts[idx?idx.getX(i+1):i+1],d=verts[idx?idx.getX(i+2):i+2];if([a,b,d].some(v=>v.z>1||v.z< -1))continue;if((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x)<0)continue;let color=o.material.color||new T.Color('#647b72');faces.push({a,b,d,z:(a.z+b.z+d.z)/3,color:'#'+color.getHexString()})}});faces.sort((a,b)=>b.z-a.z);for(let f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo((f.a.x+1)*sw/2,(1-f.a.y)*sh/2);ctx.lineTo((f.b.x+1)*sw/2,(1-f.b.y)*sh/2);ctx.lineTo((f.d.x+1)*sw/2,(1-f.d.y)*sh/2);ctx.fill()}}};}renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new T.PerspectiveCamera(62,1,.1,240);scene.add(new T.HemisphereLight(0xffe9c8,0x637278,2.6));const sun=new T.DirectionalLight(0xffd7a1,2.6);sun.position.set(-30,70,20);scene.add(sun);const solids=[];const mat=c=>new T.MeshLambertMaterial({color:c});const materials=new Map();function box(x,y,z,w,h,d,c,parent=scene){if(!materials.has(c))materials.set(c,mat(c));let m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(c));m.position.set(x,y,z);parent.add(m);return m}box(0,-.2,0,460,.3,460,'#baa88a');
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
 for(const side of [-1,1]){cub(side*.63,.82,2.08,.43,.17,.07,lamp);cub(side*.66,.82,-2.09,.39,.17,.06,tail);cub(side*.67,.56,2.13,.20,.075,.04,lamp)}
 for(const z of [-2.18,2.18]){cub(0,.60,z,.40,.14,.018,mat('#e5e8de'));cub(0,.65,z*1.001,.40,.032,.022,mat('#4b8daf'))}
 for(const x of [-.94,.94])for(const z of [-1.35,1.32]){
 const pivot=new T.Group();pivot.position.set(x,.43,z);g.add(pivot);wheels.push(pivot);
 const tire=part(new T.CylinderGeometry(.405,.405,.26,24),rubber,0,0,0,pivot);tire.rotation.z=Math.PI/2;
 const sx=Math.sign(x);const rim=part(new T.CylinderGeometry(.28,.28,.025,24),black,sx*.142,0,0,pivot);rim.rotation.z=Math.PI/2;
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const spoke=cub(sx*.159,Math.cos(a)*.13,Math.sin(a)*.13,.025,.25,.045,chrome,pivot);spoke.rotation.x=a}
 const hub=part(new T.CylinderGeometry(.075,.075,.035,16),chrome,sx*.17,0,0,pivot);hub.rotation.z=Math.PI/2;
 }
 // Soft contact shadow, no expensive shadow maps on mobile.
 const cv=document.createElement('canvas');cv.width=cv.height=64;const ctx=cv.getContext('2d'),grad=ctx.createRadialGradient(32,32,8,32,32,32);grad.addColorStop(0,'rgba(0,0,0,.5)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);let shadow=part(new T.PlaneGeometry(3.5,5.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false}),0,.105,0);shadow.rotation.x=-Math.PI/2;shadow.userData.skipFallback=true;
 g.userData.wheels=wheels;scene.add(g);return g;
}
const taxi=car('#d7a52f');taxi.position.set(2,0,8);box(0,1.72,0,.52,.20,.32,'#fff1c8',taxi);
function motorcycle(color){
 const g=new T.Group();g.userData.wheels=[];
 box(0,.52,0,.26,.13,1.22,'#35383b',g);box(0,.85,-.25,.40,.13,.68,'#25272b',g);
 const tank=new T.Mesh(new T.SphereGeometry(1,12,8),mat(color));tank.scale.set(.23,.22,.36);tank.position.set(0,.81,.27);g.add(tank);
 box(0,1.12,.66,.70,.055,.055,'#a5a8aa',g);box(0,.87,.77,.10,.55,.10,'#969b9e',g);
 box(0,1,.85,.23,.19,.10,'#fff0bd',g);box(0,.74,-.86,.22,.10,.06,'#bb2828',g);
 for(const z of [-.70,.72]){const pivot=new T.Group();pivot.position.set(0,.34,z);g.add(pivot);g.userData.wheels.push(pivot);const w=new T.Mesh(new T.CylinderGeometry(.32,.32,.16,16),mat('#171a1d'));w.rotation.z=Math.PI/2;pivot.add(w);for(const x of [-.09,.09]){const hub=new T.Mesh(new T.CylinderGeometry(.20,.20,.018,12),mat('#9da5ac'));hub.position.x=x;hub.rotation.z=Math.PI/2;pivot.add(hub)}}
 // Seated rider and helmet.
 box(0,1.15,-.12,.36,.48,.26,'#3a5260',g);const helmet=new T.Mesh(new T.SphereGeometry(.19,12,10),mat('#222b32'));helmet.position.set(0,1.55,-.06);g.add(helmet);box(0,1.57,.10,.28,.09,.06,'#6d8b95',g);
 for(const x of [-.25,.25]){box(x,.73,-.27,.13,.42,.20,'#334352',g);box(x,1.12,.28,.11,.12,.57,'#3a5260',g)}scene.add(g);return g;
}
const traffic=[];for(let i=0;i<22;i++){let c=i%4===3?motorcycle(['#b94536','#32657e','#b9ad82'][i%3]):car(['#d5d7d4','#466878','#742e2e','#b8b2a4','#34393e','#e0d2ad','#47745e'][i%7]);if(i%4!==3){if(i%3===0)c.scale.set(1.08,1.15,1.12);else if(i%3===1)c.scale.set(.94,.96,.90)}const direction=i%2?1:-1;c.userData.direction=direction;c.userData.axis=i<12?'z':'x';c.userData.cruise=i%4===3?5:3+i%3;const lane=roads[i%5]+direction*2.6;const along=-76+(i%11)*14;if(c.userData.axis==='z')c.position.set(lane,0,along);else c.position.set(along,0,lane);c.rotation.y=(c.userData.axis==='x'?Math.PI/2:0)+(direction<0?Math.PI:0);traffic.push(c)}
// Articulated lightweight protagonist, based on the approved character reference.
function makeHero(){
 const root=new T.Group(),rig=new T.Group();root.add(rig);
 const skin=new T.MeshStandardMaterial({color:'#b78260',roughness:.88}),shirt=new T.MeshStandardMaterial({color:'#393b3e',roughness:1}),jeans=new T.MeshStandardMaterial({color:'#48627b',roughness:1}),hair=new T.MeshStandardMaterial({color:'#25201d',roughness:1}),shoe=new T.MeshStandardMaterial({color:'#d4cfc1',roughness:.95});
 function ell(parent,x,y,z,a,b,c,m){const mesh=new T.Mesh(new T.SphereGeometry(1,16,12),m);mesh.position.set(x,y,z);mesh.scale.set(a,b,c);parent.add(mesh);return mesh}
 function limb(x,y,len,r,m){let pivot=new T.Group();pivot.position.set(x,y,0);rig.add(pivot);ell(pivot,0,-len/2,0,r,len/2+.035,r,m);return pivot}
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
 for(const arm of [leftArm,rightArm]){ell(arm,0,-.41,.005,.065,.17,.065,skin);ell(arm,0,-.60,.018,.061,.085,.043,skin)}
 const watch=new T.Mesh(new T.CylinderGeometry(.071,.071,.045,12),hair);watch.position.set(0,-.51,.005);leftArm.add(watch);
 const leftLeg=limb(-.135,.86,.70,.105,jeans),rightLeg=limb(.135,.86,.70,.105,jeans);
 for(const leg of [leftLeg,rightLeg]){ell(leg,0,-.74,.055,.112,.085,.20,shoe);ell(leg,0,-.79,.055,.116,.025,.205,mat('#b5ae9f'))}
 root.userData={rig,leftArm,rightArm,leftLeg,rightLeg};return root;
}
function animateHero(hero,phase,amount){const r=hero.userData;r.leftLeg.rotation.x=Math.sin(phase)*.65*amount;r.rightLeg.rotation.x=-Math.sin(phase)*.65*amount;r.leftArm.rotation.x=-Math.sin(phase)*.5*amount;r.rightArm.rotation.x=Math.sin(phase)*.5*amount;r.rig.position.y=Math.abs(Math.sin(phase))*.035*amount;}
const player=makeHero();scene.add(player);player.position.set(0,0,12);
const walkers=[];for(let i=0;i<18;i++){let g=makeHero();g.position.set(roads[i%5]+7,0,-70+i*8);scene.add(g);walkers.push(g)}

const target=new T.Vector3(62,0,-50);let beacon=new T.Mesh(new T.CylinderGeometry(2,2,.12,32),new T.MeshBasicMaterial({color:0xffcd68,transparent:true,opacity:.7}));scene.add(beacon);let pillar=new T.Mesh(new T.CylinderGeometry(.25,.25,13,12),new T.MeshBasicMaterial({color:0xffd57e,transparent:true,opacity:.45}));scene.add(pillar);
let active=false,paused=false,driving=false,yaw=0,speed=0,cash=250,completed=0,joy={x:0,y:0},keys={},sprint=false;const vehicleState=createVehiclePhysics(taxi.position.x,taxi.position.z,taxi.rotation.y);let dragSteer=0,bumpCooldown=0;let toastTimer;function toast(s){$('toast').textContent=s;clearTimeout(toastTimer);$('toast').style.opacity=1;toastTimer=setTimeout(()=>$('toast').style.opacity=.15,4500)}$('start').onclick=()=>{active=true;$('intro').style.display='none';toast('قرب من العربية الصفرا واضغط اركب')};function enter(){
 if(driving){
  if(Math.abs(vehicleState.speed)>1.1){toast('وقف العربية الأول عشان تنزل بأمان');return}
  const side=3.4, sin=Math.sin(vehicleState.yaw),cos=Math.cos(vehicleState.yaw);
  const exits=[[taxi.position.x+cos*side,taxi.position.z-sin*side],
   [taxi.position.x-cos*side,taxi.position.z+sin*side],
   [taxi.position.x-sin*side,taxi.position.z-cos*side]];
  const safe=exits.find(([x,z])=>!blocked(x,z,.55));
  if(!safe){toast('حرّك العربية شوية عشان تلاقي مكان تنزل فيه');return}
  driving=false;player.visible=true;player.position.set(safe[0],0,safe[1]);
  speed=0;vehicleState.speed=0;vehicleState.yawRate=0;taxi.rotation.z=0;
  $('modeLabel').textContent='وضع المشي';$('enter').textContent='اركب';$('run').textContent='جري';
 }else if(player.position.distanceTo(taxi.position)<6){
  driving=true;player.visible=false;
  Object.assign(vehicleState,{x:taxi.position.x,z:taxi.position.z,yaw:taxi.rotation.y,speed:0,steer:0,yawRate:0});
  yaw=taxi.rotation.y;speed=0;dragSteer=0;
  $('modeLabel').textContent='وضع القيادة';$('enter').textContent='انزل';$('run').textContent='فرامل';
  toast('حرّك العصاية لقدّام للتسارع، واسحب يمين أو شمال للتوجيه، واضغط فرامل للتوقف');
 }else toast('قرب من العربية الصفرا الأول')
} $('enter').onclick=enter;$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';toast(paused?'اللعبة متوقفة مؤقتًا':'يلا نكمل')};let audio; $('horn').onclick=()=>{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sawtooth';o.frequency.value=320;g.gain.value=.06;o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.25)};$('run').onpointerdown=e=>{sprint=true;e.currentTarget.setPointerCapture(e.pointerId)};$('run').onpointerup=$('run').onpointercancel=()=>sprint=false;window.onkeydown=e=>{const k=e.key.toLowerCase();keys[k]=true;if(k===' '){e.preventDefault()}if(k==='e'&&!e.repeat)enter()};window.onkeyup=e=>keys[e.key.toLowerCase()]=false;window.onblur=()=>{keys={};joy.x=joy.y=0;sprint=false;dragSteer=0};
const pad=$('joy');function move(e){let r=pad.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/40,y=(e.clientY-r.top-r.height/2)/40,l=Math.max(1,Math.hypot(x,y));joy={x:x/l,y:y/l};$('knob').style.transform=`translate(${joy.x*34}px,${joy.y*34}px)`}pad.onpointerdown=e=>{pad.setPointerCapture(e.pointerId);move(e)};pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))move(e)};pad.onpointerup=pad.onpointercancel=()=>{joy={x:0,y:0};$('knob').style.transform=''};$('camera').onclick=()=>{cameraNear=!cameraNear;toast(cameraNear?'كاميرا قريبة':'كاميرا واسعة')};let cameraNear=false;let drag=null;$('world').onpointerdown=e=>drag={id:e.pointerId,x:e.clientX};$('world').onpointermove=e=>{if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x;if(driving)dragSteer=Math.max(-1,Math.min(1,dragSteer+dx*.018));else yaw-=dx*.007;drag.x=e.clientX}};$('world').onpointerup=$('world').onpointercancel=()=>drag=null;
function blocked(x,z,radius=.45){
 if(Math.abs(x)>218-radius||Math.abs(z)>168-radius||cairo.isWater(x,z))return true;
 return solids.some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius)
}
function carCollision(x,z,angle){
 const sin=Math.sin(angle),cos=Math.cos(angle);
 // Rectangular footprint for all four corners and bumper centres.
 for(const [front,right] of [[1.83,.87],[1.83,-.87],[-1.83,.87],[-1.83,-.87],[2.05,0],[-2.05,0]]){
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
 for(const [v,color,r] of [[target,'#ffd373',4],[taxi.position,'#e7b542',3],[p,'#fff',5]]){
  map.fillStyle=color;map.beginPath();map.arc(mx(v.x),mz(v.z),r,0,Math.PI*2);map.fill()
 }
 map.fillStyle='#fff';map.font='bold 10px Arial';map.fillText('N',9,14);
}
function frame(t){
 requestAnimationFrame(frame);
 const dt=last?Math.min((t-last)/1000,.04):1/60;last=t;
 const p=driving?taxi.position:player.position;
 if(active&&!paused){
  let f=-joy.y+(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  let turn=joy.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  f=Math.max(-1,Math.min(1,f));turn=Math.max(-1,Math.min(1,turn));
  if(driving){
   // Steering from the phone screen springs gently back to centre.
   dragSteer*=Math.exp(-1.9*dt);
   const steer=Math.max(-1,Math.min(1,turn+dragSteer));
   const result=stepVehiclePhysics(vehicleState,{
    throttle:f,steer:-steer,brake:sprint||keys.shift||keys[' ']
   },dt,carCollision);
   taxi.position.x=vehicleState.x;taxi.position.z=vehicleState.z;
   taxi.rotation.y=vehicleState.yaw;yaw=vehicleState.yaw;speed=vehicleState.speed;
   taxi.rotation.z=-vehicleState.steer*Math.min(Math.abs(speed)/18,1)*.08;
   taxi.rotation.x=Math.max(-.04,Math.min(.04,-result.acceleration*.004));
   player.position.copy(taxi.position);
   for(const wheel of taxi.userData.wheels){
    wheel.rotation.x+=speed*dt/.405;
    if(wheel.position.z>0)wheel.rotation.y=vehicleState.steer*.8;
   }
   if(result.collision&&t>bumpCooldown){
    toast(result.impact>6?'خد بالك من الطريق! العربية خبطت':'في عائق قدّامك');
    bumpCooldown=t+1700;
   }
  }else{
   yaw-=turn*dt*2.3;
   // Acceleration and stopping inertia also apply to the walking character.
   const desired=f*(sprint||keys.shift?7.5:4.3);
   speed=T.MathUtils.damp(speed,desired,desired?9:13,dt);
   const nx=p.x+Math.sin(yaw)*speed*dt,nz=p.z+Math.cos(yaw)*speed*dt;
   if(!blocked(nx,p.z,.43)&&!traffic.some(c=>Math.hypot(nx-c.position.x,p.z-c.position.z)<1.15))p.x=nx;else speed*=.23;
   if(!blocked(p.x,nz,.43)&&!traffic.some(c=>Math.hypot(p.x-c.position.x,nz-c.position.z)<1.15))p.z=nz;else speed*=.23;
   player.rotation.y=yaw;
  }
  // Existing ambient traffic, pedestrians and delivery tasks remain active.
  for(const c of traffic){
   const d=c.userData,step=dt*d.cruise*d.direction;
   for(const wheel of d.wheels)wheel.rotation.x+=step/.405;
   c.position[d.axis]+=step;
   if(c.position[d.axis]>82)c.position[d.axis]=-82;
   if(c.position[d.axis]<-82)c.position[d.axis]=82;
   if(driving&&Math.hypot(c.position.x-p.x,c.position.z-p.z)<2.3){
    vehicleState.speed=Math.sign(vehicleState.speed)*Math.min(Math.abs(vehicleState.speed),1.4);
    speed=vehicleState.speed;
   }
  }
  gait+=dt*Math.abs(speed)*2.8;
  animateHero(player,gait,driving?0:Math.min(1,Math.abs(speed)/4.3));
  for(const [i,g] of walkers.entries()){
   animateHero(g,t*.0025+i,.45);
   g.position.z+=dt*.65;
   if(g.position.z>80)g.position.z=-80;
  }
  if(driving&&p.distanceTo(target)<4&&Math.abs(speed)<10){
   cash+=150;completed++;
   $('money').textContent='ج.م '+cash;
   $('task').textContent=`تم توصيل ${completed} طلب • +١٥٠ جنيه. الطلب التالي عند العلامة الدهبية.`;
   target.set(completed%2?-62:62,0,completed%2?50:-50);
   toast('عاش! الطلب وصل • +١٥٠ جنيه')
  }
 }
 beacon.position.set(target.x,.15,target.z);
 pillar.position.set(target.x,6.5,target.z);
 beacon.scale.setScalar(1+Math.sin(t*.003)*.12);
 const angle=active?yaw:.55;
 const dist=driving?(cameraNear?6:10):(cameraNear?4:7);
 const cp=new T.Vector3(p.x-Math.sin(angle)*dist,driving?6:5,p.z-Math.cos(angle)*dist);
 camera.position.lerp(cp,1-Math.exp(-dt*5));camera.lookAt(p.x,1.5,p.z);
 $('speed').innerHTML=Math.round(Math.abs(speed)*3.6)+'<small>كم / س</small>';
 minimap(p);
 if(active&&Math.round(t/1200)%2===0)$('toast').dataset.district=cairo.district(p.x,p.z);
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
