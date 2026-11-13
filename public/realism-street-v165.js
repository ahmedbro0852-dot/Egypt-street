import * as T from './three.js';
import {createStreetCharacter} from './street-character-v166.js?v=170.0';
import {createCharacterCamera,createFootContactShadow} from './character-camera-v168.js';
import {stepCharacterMotion} from './character-motion-v167.js';
import {mergeGeometries} from './BufferGeometryUtils.js';
const canvas=document.getElementById('scene'),mobile=matchMedia('(pointer:coarse)').matches;
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch{document.getElementById('loading').textContent='المشهد يحتاج متصفحًا يدعم WebGL. افتح المدينة السابقة من الرابط أسفل الشاشة.';throw new Error('WebGL unavailable')}
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.8));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#b7c9d6');scene.fog=new T.Fog('#b7c9d6',40,105);
const camera=new T.PerspectiveCamera(62,1,.08,120);camera.position.set(1,1.68,13);camera.rotation.order='YXZ';
const hemi=new T.HemisphereLight('#dbeafa','#736552',1.5);scene.add(hemi);
const sun=new T.DirectionalLight('#fff1d7',3.2);sun.position.set(-16,26,12);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:30,bottom:-30,near:1,far:85});sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;scene.add(sun);
// A local sky reflection makes glass and metal respond to their surroundings.
const sky=new T.Scene();sky.background=new T.Color('#c5d4dc');sky.add(new T.HemisphereLight('#f5f7fa','#7b7466',2));
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshBasicMaterial({color:'#766b58'}));floor.rotation.x=-Math.PI/2;floor.position.y=-8;sky.add(floor);
const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(sky,.06);scene.environment=environment.texture;pmrem.dispose();
let seed=165;const random=()=>((seed=seed*16807%2147483647)/2147483647);
function surface(kind,base,repeat){const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');q.fillStyle=base;q.fillRect(0,0,512,512);
 const image=q.getImageData(0,0,512,512),p=image.data;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,n=(random()-.5)*(kind==='road'?42:21)+Math.sin(x*.023+y*.017)*4;for(let k=0;k<3;k++)p[i+k]=Math.max(0,Math.min(255,p[i+k]+n));}q.putImageData(image,0,0);
 if(kind==='road'){q.strokeStyle='#343632';q.lineWidth=1;for(let i=0;i<8;i++){let x=random()*512,y=random()*512;q.beginPath();q.moveTo(x,y);for(let j=0;j<9;j++){x+=random()*22-11;y+=random()*22;q.lineTo(x,y)}q.stroke()}}
 if(kind==='stone'){q.strokeStyle='#78796f';q.lineWidth=3;for(let y=0;y<512;y+=128){q.beginPath();q.moveTo(0,y);q.lineTo(512,y);q.stroke();for(let x=(y%256?64:0);x<512;x+=128){q.beginPath();q.moveTo(x,y);q.lineTo(x,y+128);q.stroke()}}}
 if(kind==='wall'){for(let i=0;i<36;i++){const x=random()*512;const g=q.createLinearGradient(x,0,x+12,512);g.addColorStop(0,'#594c3c00');g.addColorStop(1,'#594c3c20');q.fillStyle=g;q.fillRect(x,0,3+random()*8,512)}}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(...repeat);map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const relief=map.clone();relief.colorSpace=T.NoColorSpace;relief.needsUpdate=true;
 return new T.MeshStandardMaterial({map,bumpMap:relief,bumpScale:kind==='road'?.025:.035,roughness:kind==='road'?.96:.88,metalness:0});}
const road=surface('road','#62615b',[3,12]),stone=surface('stone','#b3b1a2',[2,9]),plaster=surface('wall','#c5b49a',[2,2]);
const trim=new T.MeshStandardMaterial({color:'#cec5b3',roughness:.87}),steel=new T.MeshStandardMaterial({color:'#4d514d',metalness:.7,roughness:.53}),glass=new T.MeshStandardMaterial({color:'#54616a',metalness:.55,roughness:.19,envMapIntensity:1.1}),wood=new T.MeshStandardMaterial({color:'#695443',roughness:.83}),dark=new T.MeshStandardMaterial({color:'#292d2c',roughness:.95});
const cube=new T.BoxGeometry(1,1,1);
function box(x,y,z,w,h,d,material,shadow=true){const m=new T.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m}
box(0,-.13,0,48,.2,95,trim,false);box(0,-.025,0,9,.1,70,road,false);
for(const side of [-1,1]){box(side*6,.07,0,3,.22,60,stone,false);box(side*4.55,.13,0,.18,.28,60,trim);
 for(let block=0;block<4;block++){const z=19-block*12,x=side*10.4,h=9+(block%3)*2.8;
 const wall=plaster.clone();wall.color.set(['#e0d3be','#bfb4a1','#d2c6b1','#c9bcaa'][block]);box(x,h/2,z,6,h,11.6,wall);
 const face=side*7.36;
 for(let level=0;level<3;level++)for(let j=0;j<3;j++){const wz=z-3.7+j*3.55,wy=3+level*2.9;
 box(face,wy,wz,.16,1.75,1.45,dark);box(face-side*.04,wy,wz,.18,1.49,1.18,glass);
 box(face-side*.12,wy-.9,wz,.42,.14,1.75,trim);box(face-side*.1,wy+.92,wz,.24,.12,1.68,trim);
 box(face-side*.13,wy,wz,.15,1.55,.045,steel);
 if((j+block+level)%3===0){box(face-side*.55,wy-.8,wz,1.1,.14,2,trim);for(let k=0;k<6;k++)box(face-side*1.03,wy-.35,wz-.83+k*.33,.045,.85,.045,steel);box(face-side*1.03,wy+.08,wz,.065,.065,1.85,steel)}
 }
 box(x,h+.2,z,6.25,.4,11.8,trim);
 // Recessed roller shutters and stone ground-floor surrounds.
 for(let j=0;j<2;j++){const wz=z-2.7+j*5.4;box(face-.04*side,1.2,wz,.18,2.3,4.2,dark);box(face-.13*side,1.18,wz,.12,2.05,3.85,wood);for(let k=0;k<13;k++)box(face-.21*side,.3+k*.145,wz,.04,.025,3.8,steel);box(face-.2*side,2.5,wz,.35,.22,4.5,trim)}
 // Air conditioner casing, louvers, drain pipe and facade cable.
 box(face-side*.38,5.2,z+3, .65,.7,1.1,trim);for(let k=0;k<6;k++)box(face-side*.72,4.95+k*.09,z+3,.025,.025,.87,steel);
 box(face-side*.18,h*.5,z-5.3,.1,h,.1,steel);box(face-side*.2,2.85,z,.05,.04,11.6,dark);
 }
 // Bollards remain on the pavement rather than the walking corridor.
 for(let z=-22;z<25;z+=7){box(side*5,.5,z,.12,.8,.12,steel);box(side*5,.92,z,.2,.08,.2,steel)}
}
// Street termination gives the small study an intentional physical boundary.
box(0,3.5,-29,27,7,2,plaster);box(0,2.2,-27.9,4,4.4,.15,wood);
// Merge architecture by material and shadow behavior instead of thousands of draw calls.
const batches=new Map();
for(const mesh of [...scene.children]){if(!mesh.isMesh)continue;mesh.updateMatrix();const key=mesh.material.uuid+':'+mesh.castShadow;
 if(!batches.has(key))batches.set(key,{material:mesh.material,shadow:mesh.castShadow,geometries:[]});
 batches.get(key).geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));scene.remove(mesh);
}
for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries);for(const g of batch.geometries)g.dispose();const mesh=new T.Mesh(geometry,batch.material);mesh.castShadow=batch.shadow;mesh.receiveShadow=true;scene.add(mesh)}
scene.updateMatrixWorld(true);
const cameraRig=createCharacterCamera({camera,occluders:scene.children.filter(o=>o.isMesh&&o.castShadow)}),footShadow=createFootContactShadow({scene});
let characterReady=false;
const character=createStreetCharacter({scene,onStatus:message=>document.getElementById('characterStatus').textContent=message});
character.ready.then(ready=>{characterReady=ready;document.getElementById("retryCharacter").hidden=ready});
document.getElementById("retryCharacter").onclick=()=>location.reload();
const zoomControl=document.getElementById("cameraZoom");
const actor=new T.Vector3(1,0,13),lookAt=new T.Vector3(),cameraGoal=new T.Vector3();
const motion={x:1,z:13,vx:0,vz:0};
let savedYaw=0,frontView=true,portrait=false;
const portraitButton=document.getElementById('portraitView');
portraitButton.onclick=()=>{portrait=!portrait;if(!frontView)document.getElementById('characterView').click();portraitButton.setAttribute('aria-pressed',String(portrait));portraitButton.textContent=portrait?'الجسم بالكامل':'تفاصيل الوجه'};
document.getElementById('characterView').setAttribute('aria-pressed','true');document.getElementById('characterView').textContent='ابدأ المشي';document.getElementById('characterView').onclick=()=>{frontView=!frontView;if(frontView){savedYaw=yaw;yaw=0}else{yaw=savedYaw}document.getElementById('characterView').setAttribute('aria-pressed',String(frontView));document.getElementById('characterView').textContent=frontView?'ابدأ المشي':'فحص الشخصية';portraitButton.hidden=!frontView;motion.vx=motion.vz=0};
const keys=new Set();let yaw=0,pitch=0,pointer=null,lastX=0,lastY=0;
addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyR'].includes(e.code)){e.preventDefault();keys.add(e.code)}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();motion.vx=motion.vz=0;pointer=null});
addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();motion.vx=motion.vz=0;pointer=null}});
for(const button of document.querySelectorAll('[data-move]')){const key='Key'+button.dataset.move.toUpperCase();button.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);keys.add(key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(key));}
canvas.addEventListener('pointerdown',e=>{pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;yaw-=(e.clientX-lastX)*.003;pitch=T.MathUtils.clamp(pitch-(e.clientY-lastY)*.003,-1.1,1.1);lastX=e.clientX;lastY=e.clientY});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
let last=0;function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;
 let f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
 let s=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
 const movement=stepCharacterMotion(motion,{forward:frontView?0:f,strafe:frontView?0:s,yaw,running:keys.has('KeyR')||keys.has('ShiftLeft')||keys.has('ShiftRight'),dt});
 actor.set(motion.x,0,motion.z);
 character.root.position.copy(actor);character.update(dt,{...movement,lookYaw:frontView?character.root.rotation.y:yaw+Math.PI});
 const angle=frontView?character.root.rotation.y+yaw: yaw;
 const zoom=Number(zoomControl.value);
 const distance=(frontView?(portrait?.82:zoom*.86):zoom)*Math.cos(pitch*.6);
 cameraGoal.set(T.MathUtils.clamp(actor.x+Math.sin(angle)*distance,-6.6,6.6),frontView?(portrait?1.66:1.18)+Math.sin(-pitch)*.6:2.05+Math.sin(-pitch)*1.7,T.MathUtils.clamp(actor.z+Math.cos(angle)*distance,-26.4,26));
 lookAt.set(actor.x,frontView?(portrait?1.64:.98):1.24,actor.z);cameraRig.update(dt,lookAt,cameraGoal);footShadow.update(actor,character.root.rotation.y,characterReady);renderer.render(scene,camera);
}
document.getElementById('loading').hidden=true;requestAnimationFrame(frame);
