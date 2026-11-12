// Egypt Streets V153 — low-cost cinematic entry/exit for any street vehicle.
// No animation assets, timers, allocations per frame, or render-loop listeners.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const smoothEntryV153=t=>{const x=clamp(Number.isFinite(t)?t:0,0,1);return x*x*(3-2*x)};
export function doorSwingV153(progress,mode='enter'){
 const p=clamp(Number.isFinite(progress)?progress:0,0,1);
 const opening=smoothEntryV153(p/.28);
 const closing=1-smoothEntryV153((p-(mode==='exit'?.61:.67))/.30);
 return clamp(Math.min(opening,closing),0,1);
}
export function rideSideV153(hero,vehicle){
 if(!hero?.position||!vehicle?.position)return -1;
 const yaw=Number.isFinite(vehicle.rotation?.y)?vehicle.rotation.y:0;
 const delta=(hero.position.x-vehicle.position.x)*Math.cos(yaw)-
  (hero.position.z-vehicle.position.z)*Math.sin(yaw);
 return delta>=0?1:-1;
}
export function rideDoorPointV153(vehicle,side,offset=1.62){
 const yaw=vehicle?.rotation?.y||0;
 const x=vehicle?.position?.x||0,z=vehicle?.position?.z||0;
 return {x:x+side*Math.cos(yaw)*offset-Math.sin(yaw)*.14,
  z:z-side*Math.sin(yaw)*offset-Math.cos(yaw)*.14,y:0};
}
export function createVehicleEntryCinemaV153({T,hero,lowEnd=false}={}){
 let current=null;
 // Owned geometry is allocated once and re-used by all vehicle doors.
 let panelGeo=null,openingGeo=null,openingMat=null;
 const makeDoor=(vehicle,side)=>{
  if(lowEnd||!T?.BoxGeometry||!T?.Group||!T?.Mesh||!T?.MeshBasicMaterial||
   !vehicle?.userData?.chassis)return null;
  const host=vehicle.userData.chassis;
  let state=vehicle.userData.entryDoorV153;
  if(!state){
   if(!panelGeo){
    panelGeo=new T.BoxGeometry(.065,.69,1.43);
    openingGeo=new T.BoxGeometry(.025,.64,1.39);
    openingMat=new T.MeshBasicMaterial({color:0x111c24,depthWrite:true});
   }
   const hinge=new T.Group();
   const paint=vehicle.userData.damagePanels?.paint||openingMat;
   const panel=new T.Mesh(panelGeo,paint);
   panel.position.set(0,0,-.70);panel.castShadow=false;panel.receiveShadow=false;
   hinge.add(panel);host.add(hinge);
   const opening=new T.Mesh(openingGeo,openingMat);
   host.add(opening);
   hinge.visible=opening.visible=false;
   state={hinge,opening};vehicle.userData.entryDoorV153=state;
  }
  const {hinge,opening}=state;
  hinge.position.set(side*1.035,.93,.67);
  opening.position.set(side*1.027,.93,-.03);
  return state;
 };
 const resetDoor=ride=>{
  if(!ride?.door)return;
  ride.door.hinge.rotation.y=0;
  ride.door.hinge.visible=false;
  ride.door.opening.visible=false;
 };
 function start({mode='enter',vehicle,from=null,to=null,onDone=()=>{}}={}){
  if(current||!vehicle||!hero?.position||!['enter','exit'].includes(mode))return false;
  const side=rideSideV153(mode==='exit'?{position:to||hero.position}:hero,vehicle);
  const doorway=rideDoorPointV153(vehicle,side,rideKind(vehicle)==='motorbike'?1.06:1.62);
  const seat=rideDoorPointV153(vehicle,side,.40);
  const startPoint=mode==='enter'?{x:hero.position.x,y:0,z:hero.position.z}:
   {x:seat.x,y:-.27,z:seat.z};
  const finishPoint=mode==='enter'?{x:seat.x,y:-.30,z:seat.z}:
   {x:to?.x??doorway.x,y:0,z:to?.z??doorway.z};
  const door=rideKind(vehicle)==='motorbike'?null:makeDoor(vehicle,side);
  current={vehicle,side,door,mode,from:startPoint,to:finishPoint,doorway,
   elapsed:0,duration:lowEnd?.65:mode==='exit'?.94:1.08,onDone};
  hero.visible=true;hero.position.set(startPoint.x,startPoint.y,startPoint.z);
  return true;
 }
 function rideKind(vehicle){return vehicle?.userData?.streetRideKind==='motorbike'||
  (vehicle?.userData?.wheels?.length===2)?'motorbike':'car'}
 function update(dt=1/60){
  if(!current)return false;
  const a=current;
  a.elapsed+=clamp(Number.isFinite(dt)?dt:0,0,.05);
  const p=clamp(a.elapsed/a.duration,0,1),swing=doorSwingV153(p,a.mode);
  if(a.door){
   a.door.hinge.visible=swing>.01;
   a.door.opening.visible=swing>.10;
   a.door.hinge.rotation.y=(a.side===-1?1:-1)*swing*1.16;
  }
  const entering=a.mode==='enter';
  const doorProgress=entering?smoothEntryV153(p/.69):smoothEntryV153((p-.18)/.48);
  const leaveProgress=entering?smoothEntryV153((p-.64)/.30):smoothEntryV153((p-.57)/.40);
  const intermediate=entering?{
   x:a.doorway.x,y:0,z:a.doorway.z
  }:{
   x:a.doorway.x,y:0,z:a.doorway.z
  };
  const start=a.from,end=a.to;
  const first=entering?doorProgress:smoothEntryV153(p/.54);
  const second=entering?leaveProgress:leaveProgress;
  const x=start.x+(intermediate.x-start.x)*first+
   (end.x-intermediate.x)*second;
  const z=start.z+(intermediate.z-start.z)*first+
   (end.z-intermediate.z)*second;
  const y=start.y+(intermediate.y-start.y)*first+
   (end.y-intermediate.y)*second;
  hero.position.set(x,y,z);
  const yaw=a.vehicle.rotation?.y||0;
  hero.rotation.y=yaw+(a.side===-1?Math.PI/2:-Math.PI/2);
  const rig=hero.userData?.rig;
  if(rig){
   rig.rotation.x=(entering?1:-1)*smoothEntryV153((p-.54)/.23)*.26;
   // Do not scale root transform: existing foot IK / avatar clothing stays intact.
  }
  if(p>=1){
   current=null;resetDoor(a);if(rig)rig.rotation.x=0;
   a.onDone();return false;
  }
  return true;
 }
 return {
  startEnter:(vehicle,onDone)=>start({mode:'enter',vehicle,onDone}),
  startExit:(vehicle,destination,onDone)=>start({mode:'exit',vehicle,to:destination,onDone}),
  update,isActive:()=>!!current,
  cancel:()=>{if(!current)return;resetDoor(current);current=null;const rig=hero?.userData?.rig;if(rig)rig.rotation.x=0}
 };
}
