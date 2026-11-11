// Egypt Streets V45: richer Cairo atmosphere without external textures or audio.
// Designed for desktop WebGL, preserving gameplay, saves and mobile renderer.
export function installCairoGraphicsV45({T,scene,renderer,camera,sun,getFocus,getState}={}){
 const empty={enabled:false,update(){}};
 if(!renderer?.isWebGLRenderer||!window.matchMedia?.('(pointer:fine)').matches)return empty;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const created=[],ownedMaterials=[],ownedTextures=[],replaced=[];
 const add=o=>{scene.add(o);created.push(o);return o};
 let seed=80303;
 const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647};
 // Large inward-facing sky uses a color gradient rather than a flat clear color.
 // Its position tracks the active camera, with no external HDR/environment maps.
 const skyUniforms={
  daylight:{value:.8},cloudCover:{value:0},elapsed:{value:0},
  sunDir:{value:new T.Vector3(.5,.75,.2)}
 };
 const skyMat=new T.ShaderMaterial({
  uniforms:skyUniforms,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:[
   'varying vec3 direction;',
   'void main(){ direction=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'
  ].join('\n'),
  fragmentShader:`
   varying vec3 direction;
   uniform float daylight, cloudCover, elapsed;
   uniform vec3 sunDir;
   float hash3(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float noise3(vec3 p){
    vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
   float fbm(vec3 p){float n=0.0,a=.53;for(int i=0;i<4;i++){n+=a*noise3(p);p=p*2.03+vec3(13.7,9.2,4.1);a*=.5;}return n;}
   void main(){
    vec3 d=normalize(direction),sun=normalize(sunDir);
    float bright=clamp(daylight,0.0,1.0),y=d.y;
    float sunset=(1.0-smoothstep(.10,.52,sun.y))*bright;
    vec3 horizon=mix(vec3(.025,.038,.075),vec3(.73,.77,.78),bright);
    horizon=mix(horizon,vec3(1.0,.54,.29),sunset*.57);
    vec3 zenith=mix(vec3(.003,.008,.026),vec3(.055,.25,.53),bright);
    vec3 color=mix(horizon,zenith,smoothstep(-.05,.78,y));
    float alignment=max(dot(d,sun),0.0);
    color+=vec3(1.0,.66,.32)*pow(alignment,18.0)*bright*(.12+sunset*.28);
    color+=vec3(1.0,.88,.63)*smoothstep(.99982,.99996,alignment)*bright*2.4;
    vec3 cloudP=d*5.5+vec3(elapsed*.006,0.0,elapsed*.003);
    float cloudNoise=fbm(cloudP);
    float cloud=smoothstep(.57-cloudCover*.18,.78-cloudCover*.14,cloudNoise)*smoothstep(.02,.24,y);
    float edge=clamp((fbm(cloudP+sun*.3)-cloudNoise)*4.0+.5,0.0,1.0);
    vec3 cloudColor=mix(vec3(.025,.037,.065),mix(vec3(.47,.52,.56),vec3(.97,.92,.81),edge),bright);
    cloudColor=mix(cloudColor,vec3(.34,.37,.40)*(.2+.8*bright),cloudCover*.50);
    color=mix(color,cloudColor,cloud*(.55+cloudCover*.38));
    float star=step(.9992,hash3(floor(d*380.0)))*smoothstep(.04,.25,y)*(1.0-bright)*(1.0-bright);
    color+=vec3(.48,.58,.78)*star*(1.0-cloud)*(1.0-cloudCover);
    gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`

 });
 ownedMaterials.push(skyMat);
 const sky=add(new T.Mesh(new T.SphereGeometry(185,36,24),skyMat));
 sky.renderOrder=-1000;sky.frustumCulled=false;sky.userData.skipFallback=true;
 // The facade textures already include painted windows. Subtle physical relief
 // and a sparse overlay of warm light make them read as lived-in apartments.
 const facadePlanes=[],lamps=[];
 const vec=new T.Vector3();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!o.isMesh||!o.geometry?.parameters)return;
  const g=o.geometry.parameters;
  if(o.geometry.type==='PlaneGeometry'&&g.width>8&&g.width<23&&g.height>7&&g.height<30&&
     Math.abs(o.rotation.x)<.1&&o.material?.map){
   o.getWorldPosition(vec);
   if(Math.abs(vec.x)<225&&Math.abs(vec.z)<225){
    facadePlanes.push({x:vec.x,y:vec.y,z:vec.z,w:g.width,h:g.height});
    const old=o.material;
    const next=new T.MeshStandardMaterial({
     map:old.map,color:0xffffff,roughness:.91,metalness:0,
     bumpMap:old.map,bumpScale:.008,side:T.DoubleSide
    });
    o.material=next;ownedMaterials.push(next);replaced.push([o,old]);
   }
  }
  if(o.geometry.type==='SphereGeometry'&&g.radius>=.23&&g.radius<=.28&&
     o.material?.isMeshBasicMaterial){
   o.getWorldPosition(vec);
   if(vec.y>5.3&&vec.y<6.3)lamps.push(vec.clone());
  }
 });
 const panes=[];
 for(const wall of facadePlanes){
  const rows=5;
  for(let row=0;row<rows;row++)for(let col=0;col<3;col++){
   if(rand()<.54)continue;
   panes.push({x:wall.x+((40+col*84)/256-.5)*wall.w,
    y:wall.y+(.5-(44+row*100)/512)*wall.h,
    z:wall.z+.14,temperature:rand()});
  }
 }
 let windowMat=null;
 if(panes.length){
  windowMat=new T.MeshBasicMaterial({
   color:0xffffff,transparent:true,opacity:0,depthWrite:false,
   side:T.DoubleSide,toneMapped:false
  });
  ownedMaterials.push(windowMat);
  const panel=new T.InstancedMesh(new T.PlaneGeometry(.83,1.06),windowMat,panes.length);
  const dummy=new T.Object3D(),color=new T.Color();
  panes.forEach((p,i)=>{
   dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();
   panel.setMatrixAt(i,dummy.matrix);
   color.set(p.temperature<.18?0xb5d9f3:p.temperature<.77?0xffd08e:0xffefc6);
   panel.setColorAt(i,color);
  });
  panel.instanceMatrix.needsUpdate=true;
  if(panel.instanceColor)panel.instanceColor.needsUpdate=true;
  panel.frustumCulled=false;panel.renderOrder=3;
  panel.userData.skipFallback=true;add(panel);
 }
 // River uses small, repeated locally-generated ripples to catch sunlight.
 let nile=null;
 scene.traverse(o=>{
  if(nile||!o.isMesh||o.geometry?.type!=='PlaneGeometry')return;
  const g=o.geometry.parameters;
  if(g.width===52&&g.height===366&&Math.abs(o.position.x-131)<.5)nile=o;
 });
 let water=null;
 if(nile){
  const cv=document.createElement('canvas');cv.width=cv.height=256;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#7c9ca4';ctx.fillRect(0,0,256,256);
  for(let n=0;n<1200;n++){
   const x=rand()*256,y=rand()*256;
   ctx.strokeStyle='rgba(230,244,242,'+(.03+rand()*.16)+')';
   ctx.lineWidth=.4+rand();
   ctx.beginPath();ctx.moveTo(x,y);
   ctx.quadraticCurveTo(x+12,y-1,x+14+rand()*20,y);
   ctx.stroke();
  }
  water=new T.CanvasTexture(cv);
  water.colorSpace=T.SRGBColorSpace;
  water.wrapS=water.wrapT=T.RepeatWrapping;
  water.repeat.set(8,44);
  water.anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||2);
  water.needsUpdate=true;ownedTextures.push(water);
  const old=nile.material;
  const next=new T.MeshPhysicalMaterial({
   map:water,bumpMap:water,bumpScale:.033,color:0x397c8c,
   roughness:.35,metalness:.14,clearcoat:.78,
   clearcoatRoughness:.15,side:T.DoubleSide,
   transparent:true,opacity:.93,depthWrite:true
  });
  nile.material=next;ownedMaterials.push(next);replaced.push([nile,old]);
 }
 // Actual light spill from the nearest lamps. Dynamic pooling avoids excessive
 // point lights and shadow maps over a full open-world city.
 const localLights=[];
 for(let i=0;i<3;i++){
  const light=add(new T.PointLight(0xffc888,0,17,2));
  light.castShadow=false;light.visible=false;localLights.push(light);
 }
 let partial=1;
 function update(dt){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.06);
  const state=getState?.()||{};
  const brightness=clamp(Number(state.illumination)||0,0,1);
  const weather=String(state.weather||'');
  const isRain=weather.includes('مطر'),isCloud=weather.includes('غائم');
  sky.position.copy(camera.position);
  skyUniforms.daylight.value=brightness;
  skyUniforms.cloudCover.value=isRain?1:isCloud?.67:0;
  skyUniforms.elapsed.value+=dt;
  if(sun?.position&&sun?.target?.position){
   skyUniforms.sunDir.value.copy(sun.position).sub(sun.target.position).normalize();
  }
  if(water){
   water.offset.x=(water.offset.x+dt*.002)%1;
   water.offset.y=(water.offset.y+dt*.010)%1;
   nile.material.roughness=isRain?.24:.35;
  }
  partial+=dt;if(partial<.4)return;partial=0;
  const night=1-clamp((brightness-.09)/.40,0,1);
  if(windowMat)windowMat.opacity=night*.63;
  if(scene.fog){
   scene.fog.near=isRain?50:isCloud?68:85;
   scene.fog.far=isRain?173:isCloud?200:225;
  }
  const focus=getFocus?.();if(!focus)return;
  let quality='high';
  try{quality=localStorage.getItem('egypt-street-desktop-quality-v43')||'high'}catch(e){}
  const maxLights=quality==='ultra'?3:quality==='high'?2:0;
  const nearby=lamps.map(p=>({p,dist:(p.x-focus.x)**2+(p.z-focus.z)**2}))
   .filter(item=>item.dist<850).sort((a,b)=>a.dist-b.dist);
  for(let i=0;i<localLights.length;i++){
   const light=localLights[i],candidate=nearby[i];
   light.visible=night>.01&&i<maxLights&&!!candidate;
   if(light.visible){
    light.position.copy(candidate.p);
    light.intensity=night*15;
   }
  }
 }
 update(.4);
 return {enabled:true,update,
  stats:()=>({facades:facadePlanes.length,litWindows:panes.length,streetLights:lamps.length}),
  dispose(){
   for(const [mesh,material] of replaced)mesh.material=material;
   for(const object of created){scene.remove(object);object.geometry?.dispose?.();}
   for(const material of ownedMaterials)material.dispose();
   for(const texture of ownedTextures)texture.dispose();
  }
 };
}
