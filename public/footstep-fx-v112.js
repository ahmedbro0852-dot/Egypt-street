// Egypt Streets V112 — one draw-call pooled walking dust / rainy pavement splashes.
// Cosmetic procedural particles, no textures, collision, saves, downloads or timers.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function createFootstepFXV112({T,scene,renderer,mobile=false}={}){
 const off={enabled:false,update(){},dispose(){},stats:()=>({enabled:false})};
 if(!renderer?.isWebGLRenderer||!T?.InstancedMesh||!T?.SphereGeometry||!scene)return off;
 const memory=Number(navigator.deviceMemory)||4,cores=Number(navigator.hardwareConcurrency)||4;
 const lowEnd=mobile&&(memory<=3||cores<=4);
 const poolSize=lowEnd?8:mobile?14:24;
 const geometry=new T.SphereGeometry(1,6,4);
 const material=new T.MeshBasicMaterial({
  color:0xffffff,transparent:true,opacity:.28,depthWrite:false,fog:true
 });
 const mesh=new T.InstancedMesh(geometry,material,poolSize);
 mesh.name='V112 pooled footsteps';mesh.userData.skipFallback=true;
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
 mesh.count=0;scene.add(mesh);
 const slots=Array.from({length:poolSize},()=>({
  age:99,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,wet:false
 }));
 const dummy=new T.Object3D(),color=new T.Color();
 let cursor=0,side=1,lastX=NaN,lastZ=NaN,travel=0,clock=0;
 function spawn(pos,heading,wet,speed){
  const current=slots[cursor++%poolSize];
  side*=-1;
  const sideways=Math.cos(heading)*side*.17,sidez=-Math.sin(heading)*side*.17;
  const behind=.16;
  current.x=pos.x+sideways-Math.sin(heading)*behind;
  current.z=pos.z+sidez-Math.cos(heading)*behind;
  current.y=Math.max(.09,pos.y+.10);
  const scale=clamp(speed/5,0,1);
  current.vx=sideways*.6;current.vz=sidez*.6;
  current.vy=wet?.32+scale*.20:.18+scale*.11;
  current.wet=wet;current.age=0;current.life=wet?.48:.66;
  color.setHex(wet?0x9dcbd8:0xb7a48c);
  mesh.setColorAt?.((cursor-1)%poolSize,color);
 }
 function update({dt=0,player=null,active=true,paused=false,driving=false,
  grounded=true,speed=0,weather='صحو',heading=0}={}){
  dt=clamp(Number(dt)||0,0,.06);
  if(!active){mesh.count=0;lastX=lastZ=NaN;travel=0;return;}
  if(!paused)clock+=dt;
  const walking=!paused&&!driving&&grounded&&player&&Math.abs(speed)>.75;
  if(walking){
   const pos=player.position||player;
   const dx=pos.x-lastX,dz=pos.z-lastZ,dist=Math.hypot(dx,dz);
   if(Number.isFinite(dist)&&dist<5)travel+=dist;
   else travel=0;
   lastX=pos.x;lastZ=pos.z;
   const step=clamp(1.15-Math.abs(speed)*.085,.56,1.0);
   if(travel>=step){travel-=step;spawn(pos,heading,weather==='مطر',Math.abs(speed));}
  }else{lastX=lastZ=NaN;travel=0;}
  let living=0;
  for(let i=0;i<poolSize;i++){
   const p=slots[i];
   if(!paused)p.age+=dt;
   const life=clamp(1-p.age/p.life,0,1);
   if(life>0){
    living++;
    if(!paused){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
    const s=(p.wet?.095:.12)*(.3+life)*Math.min(1,1-p.age*.26);
    dummy.position.set(p.x,p.y,p.z);
    dummy.rotation.set(0,0,0);
    dummy.scale.set(s,s*(p.wet?.6:.75),s);
   }else{
    dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);
    dummy.scale.set(.001,.001,.001);
   }
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.count=living?poolSize:0;
  mesh.instanceMatrix.needsUpdate=living>0;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=living>0;
 }
 function dispose(){scene.remove(mesh);geometry.dispose();material.dispose();}
 return {enabled:true,update,dispose,stats:()=>({enabled:true,poolSize,drawCalls:1,lowEnd})};
}
