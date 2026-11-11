// Egypt Streets V43 — desktop-first atmospheric polish, quality settings and road detail.
// Local procedural assets only; no music, telemetry or new external dependencies.
export function installDesktopWorldV43({T,scene,renderer,sun,getVehicle,getState,notify=()=>{}}){
 const noop={update(){},setQuality(){},enabled:false};
 const desktop=!!(renderer?.isWebGLRenderer && window.matchMedia?.('(pointer: fine)').matches);
 if(!desktop)return noop;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const key='egypt-street-desktop-quality-v43';
 const presets=[
  {id:'balanced',name:'متوازن',ratio:1.0,shadow:768,light:false,particles:8,exposure:.91},
  {id:'high',name:'عالي',ratio:1.3,shadow:1536,light:true,particles:16,exposure:.94},
  {id:'ultra',name:'فائق',ratio:1.7,shadow:2048,light:true,particles:28,exposure:.96}
 ];
 let selected='high';
 try{const saved=localStorage.getItem(key);if(presets.some(p=>p.id===saved))selected=saved}catch(e){}
 let quality=presets.find(p=>p.id===selected);
 const style=document.createElement('style');
 style.textContent=[
  '@media(min-width:850px) and (pointer:fine){body.desktop-v43 #joy,body.desktop-v43 #knob,body.desktop-v43 .pedals{display:none!important} body.desktop-v43 .bottom{bottom:18px;right:20px} body.desktop-v43 #controlsHint{left:22px;bottom:20px;max-width:none;font-size:12px}}',
  '#v43Panel{position:fixed;left:20px;bottom:55px;z-index:28;direction:rtl;background:#101c27e6;border:1px solid #b8d1cf53;box-shadow:0 8px 35px #0008;backdrop-filter:blur(12px);border-radius:13px;padding:9px 12px;color:#eff6ed;font:12px Tahoma,Arial;display:flex;align-items:center;gap:10px}',
  '#v43Panel strong{font:700 11px Tahoma,Arial;letter-spacing:.5px;color:#f8cb86;white-space:nowrap}#v43Panel button{width:auto;height:auto;border-radius:8px;font:700 11px Tahoma,Arial;padding:8px 10px;white-space:nowrap;background:#274c55;border:1px solid #7fc0b5}',
  '#v43Panel .fps{color:#b5e8ce;font:11px monospace;min-width:43px;text-align:center}',
  '#v43PhotoNotice{display:none;position:fixed;left:50%;top:25px;transform:translateX(-50%);z-index:600;pointer-events:none;color:#f1e6c5;background:#0f1b25ab;border:1px solid #ffffff37;padding:7px 13px;border-radius:10px;font:12px Tahoma,Arial}',
  'body.v43-photo .hud,body.v43-photo .mission,body.v43-photo .bottom,body.v43-photo #joy,body.v43-photo #map,body.v43-photo #controlsHint,body.v43-photo #heroCard,body.v43-photo #sound,body.v43-photo .pedals,body.v43-photo #v43Panel,body.v43-photo #toast,body.v43-photo #pause,body.v43-photo #jobsBtn,body.v43-photo #garageBtn,body.v43-photo #gpsBtn,body.v43-photo #workHud,body.v43-photo #v9Hud,body.v43-photo #v43PhotoNotice~#none{display:none!important}',
  'body.v43-photo #v43PhotoNotice{display:block}',
  '@media(max-width:850px){#v43Panel{display:none!important}}'
 ].join('\n');
 document.head.append(style);
 document.body.classList.add('desktop-v43');
 const panel=document.createElement('aside');panel.id='v43Panel';
 panel.setAttribute('aria-label','إعدادات جرافيك الكمبيوتر');
 const title=document.createElement('strong');title.textContent='شوارع مصر • V45';
 const button=document.createElement('button');button.type='button';button.title='F8 لتغيير جودة الرسوم';
 const fps=document.createElement('span');fps.className='fps';fps.textContent='-- FPS';
 const photoBtn=document.createElement('button');photoBtn.type='button';photoBtn.title='F9 لإخفاء الواجهة والتصوير';photoBtn.textContent='📷 F9';
 panel.append(title,button,fps,photoBtn);document.body.append(panel);
 const photoNotice=document.createElement('div');photoNotice.id='v43PhotoNotice';
 photoNotice.textContent='وضع التصوير • F9 للعودة';document.body.append(photoNotice);
 function applyQuality(id){
  const p=presets.find(v=>v.id===id)||presets[1];quality=p;selected=p.id;
  // Preserve retina sharpness without rendering at unbounded device pixel ratios.
  const dpr=Number(window.devicePixelRatio)||1;
  renderer.setPixelRatio(Math.min(2,Math.max(1,dpr)*p.ratio));
  if(sun?.shadow?.mapSize){
   const old=sun.shadow.mapSize.x;
   if(old!==p.shadow){
    sun.shadow.map?.dispose?.();sun.shadow.map=null;
    sun.shadow.mapSize.set(p.shadow,p.shadow);
    renderer.shadowMap.needsUpdate=true;
   }
  }
  renderer.toneMappingExposure=p.exposure;
  button.textContent='جرافيك: '+p.name+' (F8)';
  try{localStorage.setItem(key,p.id)}catch(e){}
 }
 function cycle(){const i=presets.findIndex(p=>p.id===selected);applyQuality(presets[(i+1)%presets.length].id);notify('🖥️ جودة الجرافيك: '+quality.name)}
 function photo(){const enabled=document.body.classList.toggle('v43-photo');photoBtn.textContent=enabled?'↩ F9':'📷 F9';notify(enabled?'📷 وضع التصوير — F9 للخروج':'✅ رجعنا للعبة')}
 button.addEventListener('click',cycle);photoBtn.addEventListener('click',photo);
 const onKey=(event)=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;
  if(event.code==='F8'){event.preventDefault();cycle()}
  else if(event.code==='F9'){event.preventDefault();photo()}
 };
 window.addEventListener('keydown',onKey);
 applyQuality(selected);
 // Low-draw-call reflective road studs, recessed below tyre height and not part of collisions.
 const markers=[];const streets=[-60,-30,0,30,60];
 for(const street of streets)for(let k=-74;k<=74;k+=7.7){
  if(streets.some(c=>Math.abs(k-c)<7.6))continue;
  for(const side of [-1,1]){
   markers.push({x:street+side*4.95,z:k,angle:0});
   markers.push({x:k,z:street+side*4.95,angle:Math.PI/2});
  }
 }
 if(markers.length){
  const geo=new T.BoxGeometry(.20,.025,.33);
  const material=new T.MeshStandardMaterial({color:0xe3d3a5,metalness:.25,roughness:.38,emissive:0x3e3016,emissiveIntensity:.06});
  const mesh=new T.InstancedMesh(geo,material,markers.length);
  const dummy=new T.Object3D();
  markers.forEach((m,i)=>{dummy.position.set(m.x,.084,m.z);dummy.rotation.y=m.angle;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.receiveShadow=false;scene.add(mesh);
 }
 // Physical roof silhouettes: air-conditioning compressors and radiator fans.
 scene.updateMatrixWorld(true);
 const roofs=[];
 const temp=new T.Vector3();
 scene.traverse(o=>{
  if(roofs.length>=42||!o.isMesh||o.geometry?.type!=='BoxGeometry')return;
  const g=o.geometry.parameters;
  if(!(g.height>8&&g.width>8&&g.depth>12))return;
  o.getWorldPosition(temp);
  if(Math.abs(temp.x)>90||Math.abs(temp.z)>90||temp.y<4)return;
  roofs.push({x:temp.x,z:temp.z,y:temp.y+g.height*.5});
 });
 if(roofs.length){
  const base=new T.InstancedMesh(new T.BoxGeometry(1.1,.62,.78),
   new T.MeshStandardMaterial({color:0x7a8785,metalness:.62,roughness:.53}),roofs.length);
  const fans=new T.InstancedMesh(new T.CylinderGeometry(.26,.26,.05,12),
   new T.MeshStandardMaterial({color:0x293538,metalness:.5,roughness:.56}),roofs.length);
  const dummy=new T.Object3D();
  roofs.forEach((r,i)=>{
   const x=r.x+((i*13)%7-3)*.55,z=r.z+((i*11)%7-3)*.62;
   dummy.rotation.set(0,(i%4)*Math.PI/2,0);
   dummy.position.set(x,r.y+.40,z);dummy.updateMatrix();base.setMatrixAt(i,dummy.matrix);
   dummy.position.y=r.y+.74;dummy.updateMatrix();fans.setMatrixAt(i,dummy.matrix);
  });
  base.instanceMatrix.needsUpdate=true;fans.instanceMatrix.needsUpdate=true;scene.add(base,fans);
 }
 // Two localized headlights. Disabled in daylight and on balanced graphics.
 const lights=[];
 for(const side of [-1,1]){
  const lamp=new T.SpotLight(0xffe6b2,0,30,.42,.74,1.8);
  lamp.castShadow=false;lamp.visible=false;scene.add(lamp,lamp.target);
  lights.push({lamp,side});
 }
 // Reusable tyre-dust sprites: no allocations on the render loop.
 const c=document.createElement('canvas');c.width=c.height=64;
 const ctx=c.getContext('2d');const grad=ctx.createRadialGradient(32,32,4,32,32,32);
 grad.addColorStop(0,'rgba(255,255,255,.7)');grad.addColorStop(.5,'rgba(255,255,255,.28)');grad.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const dustTexture=new T.CanvasTexture(c);const particles=[];
 for(let i=0;i<28;i++){
  const mat=new T.SpriteMaterial({map:dustTexture,color:0xc5af93,transparent:true,opacity:0,depthWrite:false});
  const sprite=new T.Sprite(mat);sprite.visible=false;scene.add(sprite);
  particles.push({sprite,life:0,max:.8,vx:0,vz:0});
 }
 let cursor=0,spawnClock=0,frameClock=0,frameCount=0,lastFps=60;
 function emit(x,y,z,speed,rain){
  const d=particles[cursor++%particles.length];
  d.life=d.max=.55+Math.random()*.45;
  d.sprite.position.set(x,y,z);d.sprite.scale.set(.55,.55,.55);
  d.sprite.material.color.setHex(rain?0xc9d7de:0xb9a58c);
  d.sprite.visible=true;
  d.vx=(Math.random()-.5)*1.4;
  d.vz=(Math.random()-.5)*1.4-Math.min(1.8,speed*.04);
 }
 function update(dt){
  dt=clamp(dt||0,0,.05);
  frameClock+=dt;frameCount++;
  if(frameClock>=1){
   lastFps=Math.round(frameCount/frameClock);
   fps.textContent=lastFps+' FPS';frameClock=0;frameCount=0;
  }
  const state=getState?.()||{};
  const car=getVehicle?.();
  const night=clamp((.58-(Number(state.illumination) || 0))/.43,0,1);
  const active=!!(car&&state.driving);
  for(const {lamp,side} of lights){
   lamp.visible=quality.light&&active&&night>.04;
   if(!lamp.visible)continue;
   const yaw=Number(state.yaw)||0;
   const sx=Math.sin(yaw),sz=Math.cos(yaw);
   const rx=Math.cos(yaw),rz=-Math.sin(yaw);
   lamp.position.set(car.position.x+sx*1.70+rx*side*.62,car.position.y+.86,
     car.position.z+sz*1.70+rz*side*.62);
   lamp.target.position.set(lamp.position.x+sx*17,car.position.y+.35,lamp.position.z+sz*17);
   lamp.intensity=night*23;
  }
  const rain=['rain','storm','rainy','عاصف','مطر'].some(w=>String(state.weather||'').toLowerCase().includes(w));
  if(active&&quality.particles>0){
   const skid=clamp(Number(state.skid)||0,0,1);
   const speed=Math.abs(Number(state.speed)||0);
   if(speed>4&&(skid>.23||rain&&speed>9)){
    spawnClock+=dt*(rain?20:10+skid*20);
    while(spawnClock>=1){
     spawnClock--;
     const yaw=Number(state.yaw)||0,side=cursor%2?1:-1;
     emit(car.position.x-Math.sin(yaw)*1.4+Math.cos(yaw)*side*.8,.26,
      car.position.z-Math.cos(yaw)*1.4-Math.sin(yaw)*side*.8,speed,rain);
    }
   }else spawnClock=0;
  }
  for(let i=0;i<particles.length;i++){
   const d=particles[i],s=d.sprite;if(!s.visible)continue;
   d.life-=dt;if(d.life<=0||i>=quality.particles){s.visible=false;continue}
   const age=1-d.life/d.max;
   s.position.x+=d.vx*dt;s.position.z+=d.vz*dt;s.position.y+=dt*.25;
   const scale=.55+age*1.5;s.scale.set(scale,scale,1);
   s.material.opacity=(1-age)*.28;
  }
 }
 return {enabled:true,update,setQuality:applyQuality,dispose(){
  window.removeEventListener('keydown',onKey);
  document.body.classList.remove('desktop-v43','v43-photo');
  panel.remove();photoNotice.remove();style.remove();dustTexture.dispose();
 }};
}
