// Egypt Streets V60 — bounded, procedurally drawn tyre marks and rain spray.
// Two instanced draw calls, no textures, shadow maps, sound files or network use.
const clampV60=(n,a,b)=>Math.max(a,Math.min(b,n));

export function createRoadFeedbackV60({T,scene,renderer,mobile=false}={}){
 if(!T?.InstancedMesh||!renderer?.isWebGLRenderer||!scene)return {enabled:false,update(){},dispose(){},getStats:()=>({enabled:false})};
 const marksLimit=mobile?28:64,sprayLimit=mobile?10:22;
 const markGeometry=new T.BoxGeometry(.17,.014,.65);
 const markMaterial=new T.MeshBasicMaterial({color:0x253035,transparent:true,opacity:.34,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const sprayGeometry=new T.SphereGeometry(.12,6,4);
 const sprayMaterial=new T.MeshBasicMaterial({color:0xb6d2d7,transparent:true,opacity:.30,depthWrite:false,fog:true});
 const marksMesh=new T.InstancedMesh(markGeometry,markMaterial,marksLimit);
 const sprayMesh=new T.InstancedMesh(sprayGeometry,sprayMaterial,sprayLimit);
 marksMesh.name='V60 pooled tyre skid marks';
 sprayMesh.name='V60 pooled rain tyre spray';
 for(const mesh of [marksMesh,sprayMesh]){
  mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.skipFallback=true;scene.add(mesh);
 }
 const dummy=new T.Object3D();
 const marks=Array.from({length:marksLimit},()=>({age:99,life:1,x:0,y:0,z:0,yaw:0}));
 const spray=Array.from({length:sprayLimit},()=>({age:99,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0}));
 for(const [mesh,count] of [[marksMesh,marksLimit],[sprayMesh,sprayLimit]]){
  for(let i=0;i<count;i++){
   dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.001);
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
 }
 let markCursor=0,sprayCursor=0,sprayClock=0,lastX=NaN,lastZ=NaN,lastVehicle=null;
 function wheel(x,z,yaw,side,rear){
  const sine=Math.sin(yaw),cosine=Math.cos(yaw);
  return {x:x+cosine*side+sine*rear,z:z-sine*side+cosine*rear};
 }
 function spawnMarks(vehicle,motorbike,wet){
  const yaw=vehicle.rotation.y,x=vehicle.position.x,z=vehicle.position.z;
  const y=vehicle.position.y+.035;
  for(const side of [-1,1]){
   const p=wheel(x,z,yaw,side*(motorbike?.22:.78),motorbike?-.64:-1.46);
   const m=marks[markCursor++%marksLimit];
   m.age=0;m.life=wet?3.2:11;m.x=p.x;m.y=y;m.z=p.z;m.yaw=yaw;
  }
 }
 function spawnSpray(vehicle,motorbike,speed){
  const yaw=vehicle.rotation.y,x=vehicle.position.x,z=vehicle.position.z;
  const sine=Math.sin(yaw),cosine=Math.cos(yaw);
  for(const side of [-1,1]){
   const p=wheel(x,z,yaw,side*(motorbike?.26:.80),motorbike?-.66:-1.49);
   const w=spray[sprayCursor++%sprayLimit];
   w.x=p.x;w.z=p.z;w.y=vehicle.position.y+.20;
   w.vx=-sine*(.55+Math.abs(speed)*.035)+cosine*side*.28;
   w.vz=-cosine*(.55+Math.abs(speed)*.035)-sine*side*.28;
   w.vy=.50;w.age=0;w.life=.52;
  }
 }
 function update({dt=0,vehicle=null,active=true,paused=false,driving=false,speed=0,skid=0,weather='صحو',motorbike=false}={}){
  dt=clampV60(Number(dt)||0,0,.06);
  const running=!!(active&&!paused&&driving&&vehicle);
  if(vehicle!==lastVehicle){lastVehicle=vehicle;lastX=NaN;lastZ=NaN;sprayClock=0;}
  if(running){
   const x=vehicle.position.x,z=vehicle.position.z;
   const distance=Math.hypot(x-lastX,z-lastZ);
   const sliding=Math.abs(speed)>4&&Number(skid)>.33;
   if(sliding&&(!Number.isFinite(distance)||distance>.42)){
    spawnMarks(vehicle,motorbike,weather==='مطر');lastX=x;lastZ=z;
   }
   if(!sliding){lastX=NaN;lastZ=NaN;}
   if(weather==='مطر'&&Math.abs(speed)>3){
    sprayClock+=dt;
    if(sprayClock>=.15){sprayClock=0;spawnSpray(vehicle,motorbike,speed);}
   }else sprayClock=0;
  }else{lastX=NaN;lastZ=NaN;sprayClock=0;}
  // Keep old marks visible briefly, but never keep animating after game pause.
  if(!active){marksMesh.visible=false;sprayMesh.visible=false;return;}
  marksMesh.visible=true;sprayMesh.visible=true;
  const elapsed=paused?0:dt;
  let visibleMarks=0,visibleSpray=0;
  for(let i=0;i<marksLimit;i++){
   const m=marks[i];m.age+=elapsed;
   const left=clampV60(1-m.age/m.life,0,1);
   if(left>0){visibleMarks++;dummy.position.set(m.x,m.y,m.z);dummy.rotation.set(0,m.yaw,0);dummy.scale.set(left,1,1);}
   else{dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.001);}
   dummy.updateMatrix();marksMesh.setMatrixAt(i,dummy.matrix);
  }
  for(let i=0;i<sprayLimit;i++){
   const p=spray[i];p.age+=elapsed;
   const left=clampV60(1-p.age/p.life,0,1);
   if(left>0){
    visibleSpray++;p.x+=p.vx*elapsed;p.y+=p.vy*elapsed;p.z+=p.vz*elapsed;
    dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.35+left*.95);
   }else{dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.001);}
   dummy.updateMatrix();sprayMesh.setMatrixAt(i,dummy.matrix);
  }
  marksMesh.count=visibleMarks?marksLimit:0;
  sprayMesh.count=visibleSpray?sprayLimit:0;
  marksMesh.instanceMatrix.needsUpdate=visibleMarks>0;
  sprayMesh.instanceMatrix.needsUpdate=visibleSpray>0;
 }
 function dispose(){
  scene.remove(marksMesh);scene.remove(sprayMesh);
  markGeometry.dispose();markMaterial.dispose();sprayGeometry.dispose();sprayMaterial.dispose();
 }
 return {enabled:true,update,dispose,getStats:()=>({enabled:true,marksLimit,sprayLimit})};
}