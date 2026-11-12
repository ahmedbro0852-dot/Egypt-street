// Egypt Streets V111 — lightweight procedural 3D exterior and rain wipers.
// Cosmetic only: no new hitboxes, driving physics, network requests or save keys.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function installVehicleDetailsV111({T,renderer,mobile=false}={}){
 const inactive={enabled:false,update(){},dispose(){},stats:()=>({enabled:false})};
 if(!renderer?.isWebGLRenderer||!T?.InstancedMesh||!T?.Group||!T?.Mesh)return inactive;
 const geometry=new T.BoxGeometry(1,1,1),bladeGeo=new T.BoxGeometry(1,1,1);
 const mats={
  chrome:new T.MeshStandardMaterial({color:0xabb8b9,metalness:.82,roughness:.25}),
  black:new T.MeshStandardMaterial({color:0x111b22,metalness:.18,roughness:.61}),
  accent:new T.MeshStandardMaterial({color:0x667f87,metalness:.43,roughness:.4})
 };
 const owns=[geometry,bladeGeo,...Object.values(mats)];
 const tracked=new Map(),dummy=new T.Object3D();
 const maxVehicleCount=3; // taxi + two optional player cars, never traffic
 function batch(parent,pieces,material,name){
  if(!pieces.length)return null;
  const mesh=new T.InstancedMesh(geometry,material,pieces.length);
  mesh.name='V111 '+name;mesh.userData.skipFallback=true;
  mesh.castShadow=false;mesh.receiveShadow=false;
  for(let i=0;i<pieces.length;i++){
   const [x,y,z,w,h,d]=pieces[i];
   dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.computeBoundingSphere?.();
  parent.add(mesh);return mesh;
 }
 function build(vehicle){
  if(!vehicle?.userData?.chassis||vehicle.userData?.detailedModel||
    vehicle.userData?.wheels?.length===2||tracked.size>=maxVehicleCount)return null;
  const host=vehicle.userData.chassis;
  const group=new T.Group();group.name='V111 fitted 3D exterior';
  host.add(group);
  // Chrome sill trim, hood lines, discreet rear garnish, boot lock and grille.
  const chrome=[
   [-.84,.53,0,.045,.018,2.32],[.84,.53,0,.045,.018,2.32],
   [-.74,.58,1.98,.28,.045,.08],[.74,.58,1.98,.28,.045,.08],
   [0,.61,-2.16,1.20,.065,.04],[0,.82,-2.16,.25,.08,.045],
   [-.52,1.04,-.55,.24,.025,.055],[.52,1.04,-.55,.24,.025,.055],
   [-.62,.87,2.18,.20,.035,.045],[.62,.87,2.18,.20,.035,.045]
  ];
  const black=[
   [0,.57,2.19,1.10,.21,.045],
   [-.25,.67,-2.19,.16,.05,.04],[.25,.67,-2.19,.16,.05,.04],
   [-.78,1.02,-.82,.07,.08,.20],[.78,1.02,-.82,.07,.08,.20]
  ];
  const accent=[
   [0,1.65,.10,.055,.065,1.08],
   [0,1.67,-.42,.08,.05,.60],
   [-.75,1.28,-.72,.08,.18,.05],[.75,1.28,-.72,.08,.18,.05]
  ];
  if(!mobile)for(let k=0;k<4;k++)black.push([-.43+k*.28,.63,2.215,.035,.22,.025]);
  const children=[
   batch(group,chrome,mats.chrome,'metal lines'),
   batch(group,black,mats.black,'grille and supports'),
   batch(group,accent,mats.accent,'body contours')
  ].filter(Boolean);
  const wipers=[];
  for(const side of [-1,1]){
   const pivot=new T.Group();
   pivot.position.set(side*.52,1.04,1.135);
   const bar=new T.Mesh(bladeGeo,mats.black);
   bar.position.set(-side*.35,.03,0);
   bar.scale.set(.69,.035,.045);
   bar.userData.skipFallback=true;bar.castShadow=false;bar.receiveShadow=false;
   pivot.add(bar);group.add(pivot);wipers.push({pivot,side});
  }
  const entry={vehicle,group,host,children,wipers,phase:0,amount:0,lastWipe:0};
  tracked.set(vehicle,entry);return entry;
 }
 function update({vehicle=null,driving=false,active=true,paused=false,
  rain=false,engineOn=false,dt=0}={}){
  if(!active)return;
  const selected=vehicle?(tracked.get(vehicle)||build(vehicle)):null;
  dt=clamp(Number(dt)||0,0,.07);
  for(const entry of tracked.values()){
   // Park wipers on previously selected vehicles.
   const moving=entry===selected&&driving&&!paused&&rain&&engineOn;
   entry.amount+=(Number(moving)-entry.amount)*(1-Math.exp(-dt*7));
   if(moving)entry.phase+=dt*3.5*Math.PI;
   const angle=entry.amount*Math.pow(Math.sin(entry.phase),2)*.72;
   for(const {pivot,side} of entry.wipers)pivot.rotation.z=-side*angle;
  }
 }
 function dispose(){
  for(const e of tracked.values())e.host.remove(e.group);
  tracked.clear();for(const r of owns)r.dispose?.();
 }
 return {enabled:true,update,dispose,stats:()=>({
  enabled:true,detailCars:tracked.size,maxCars:maxVehicleCount,
  instancedDrawsPerCar:3,wipersPerCar:2
 })};
}
