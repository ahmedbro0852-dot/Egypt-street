// Egypt Streets V56 — lightweight procedural 3D driving effects.
// Instanced drifting dust/exhaust and ground-lit headlight pools; no downloads,
// textures from third parties, lights casting shadows or gameplay changes.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function createDrivingEffectsV56({T,scene,renderer,mobile=false}={}){
 if(!renderer?.isWebGLRenderer||!T?.InstancedMesh)return {enabled:false,update(){},dispose(){}};
 // V150: cap GPU particle work on touch devices while preserving drift feedback.
 const maxParticles=mobile?8:20;
 const geometry=new T.SphereGeometry(.12,6,4);
 const dustMat=new T.MeshBasicMaterial({color:0xbac0bb,transparent:true,opacity:.28,depthWrite:false,fog:true});
 const particles=new T.InstancedMesh(geometry,dustMat,maxParticles);
 particles.name='V56 lightweight engine exhaust and tyre dust';
 particles.frustumCulled=false;
 particles.userData.skipFallback=true;
 particles.castShadow=false;particles.receiveShadow=false;
 const dummy=new T.Object3D(),state=Array.from({length:maxParticles},()=>({age:2,life:1,x:0,y:-50,z:0,vx:0,vy:0,vz:0,size:0}));
 const zero=new T.Vector3(0,-1000,0);
 for(let i=0;i<maxParticles;i++){dummy.position.copy(zero);dummy.scale.setScalar(.001);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix)}
 particles.instanceMatrix.needsUpdate=true;scene.add(particles);
 // A single 64x128 procedural falloff map is shared by two front pools.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=128;
 const painter=glowCanvas.getContext('2d');
 const gradient=painter.createRadialGradient(32,14,2,32,50,78);
 gradient.addColorStop(0,'rgba(255,242,190,.53)');
 gradient.addColorStop(.35,'rgba(255,231,169,.22)');
 gradient.addColorStop(1,'rgba(255,223,152,0)');
 painter.fillStyle=gradient;painter.fillRect(0,0,64,128);
 const glowTex=new T.CanvasTexture(glowCanvas);
 const lights=new T.Group();lights.name='V56 road light and brake glow';
 const beamGeo=new T.PlaneGeometry(2,8);
 const beamMat=new T.MeshBasicMaterial({map:glowTex,transparent:true,opacity:.58,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-1});
 for(const x of [-.56,.56]){
  const lamp=new T.Mesh(beamGeo,beamMat);lamp.rotation.x=-Math.PI/2;lamp.position.set(x,.125,5.7);
  lamp.castShadow=false;lamp.userData.skipFallback=true;lights.add(lamp);
 }
 const brakeGeo=new T.SphereGeometry(.17,6,4);
 const brakeMat=new T.MeshBasicMaterial({color:0xff2e19,transparent:true,opacity:.45,depthWrite:false});
 const brakes=[];
 for(const x of [-.65,.65]){
  const lamp=new T.Mesh(brakeGeo,brakeMat);lamp.position.set(x,.83,-2.25);
  lamp.scale.set(1.5,.8,.25);lamp.userData.skipFallback=true;lights.add(lamp);brakes.push(lamp);
 }
 lights.visible=false;
 let parent=null,emissionTimer=0,pointer=0,elapsed=0;
 function emit({vehicle,speed,skid,engineOn,weather}){
  const p=state[pointer++%state.length],yaw=vehicle.rotation.y,sin=Math.sin(yaw),cos=Math.cos(yaw);
  const tyreSmoke=skid>.26&&Math.abs(speed)>4;
  const left=tyreSmoke?(pointer%2?-.88:.88):-.45;
  const rear=tyreSmoke?-1.4:-2.25;
  // transform local chassis coordinates into the shared world exhaust pool.
  p.x=vehicle.position.x+cos*left+sin*rear;
  p.z=vehicle.position.z-sin*left+cos*rear;
  p.y=vehicle.position.y+(tyreSmoke?.20:.53);
  p.vx=-sin*(tyreSmoke?.8:.42)+(pointer%3-1)*.13;
  p.vz=-cos*(tyreSmoke?.8:.42)+(pointer%3-1)*.10;
  p.vy=tyreSmoke?.25:.32;
  p.age=0;p.life=tyreSmoke?.62:.85;
  p.size=tyreSmoke?.50:.30;
 }
 function update({dt=0,vehicle=null,active=true,driving=false,paused=false,speed=0,skid=0,night=false,braking=false,engineOn=false,weather='صحو'}={}){
  dt=clamp(Number(dt)||0,0,.08);
  if(vehicle&&vehicle!==parent){
   if(lights.parent)lights.parent.remove(lights);
   parent=vehicle;vehicle.add(lights);
  }
  const running=!!(active&&!paused&&driving&&vehicle);
  lights.visible=running;
  if(running){
   const glow=night?1:weather==='مطر'?.58:0;
   beamMat.opacity=.58*glow;
   for(let i=0;i<2;i++)lights.children[i].visible=glow>.05;
   const stop=braking&&Math.abs(speed)>.3;
   brakeMat.opacity=stop?.68:night?.29:.10;
   const pulse=stop?1.1:1;
   for(const lamp of brakes)lamp.scale.set(1.5*pulse,.8*pulse,.25);
   const slip=Number(skid)||0;
   const tyreSmoke=slip>.26&&Math.abs(speed)>4;
   const interval=tyreSmoke?(mobile?.11:.065):engineOn?(mobile?.45:.30):1e9;
   emissionTimer+=dt;
   if(emissionTimer>=interval){
    emissionTimer=0;
    if((engineOn||tyreSmoke)&&weather!=='مطر')emit({vehicle,speed,skid:slip,engineOn,weather});
   }
  }else emissionTimer=0;
  elapsed+=dt;
  for(let i=0;i<maxParticles;i++){
   const p=state[i];p.age+=dt;
   if(!running||p.age>=p.life){dummy.position.copy(zero);dummy.scale.setScalar(.001)}
   else{
    p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;
    const life=p.age/p.life;
    dummy.position.set(p.x,p.y,p.z);
    dummy.scale.setScalar(Math.max(.001,p.size*(.46+life)*Math.max(.08,1-life)));
   }
   dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
  }
  particles.visible=running;
  if(running||particles.visible)particles.instanceMatrix.needsUpdate=true;
 }
 function dispose(){
  if(lights.parent)lights.parent.remove(lights);
  scene.remove(particles);geometry.dispose();dustMat.dispose();
  beamGeo.dispose();beamMat.dispose();glowTex.dispose();brakeGeo.dispose();brakeMat.dispose();
 }
 return {enabled:true,update,dispose,getStats:()=>({particleBudget:maxParticles})};
}
