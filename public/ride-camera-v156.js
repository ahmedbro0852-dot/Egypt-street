// Egypt Streets V156 — one cinematic camera blend for boarding any street vehicle.
// Plays inside the existing frame loop. No extra scene, shadows, or camera render.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export function rideCameraEaseV156(progress=0){
 const p=clamp(finite(progress),0,1);
 const smooth=n=>{const x=clamp(n,0,1);return x*x*(3-2*x)};
 return clamp(Math.min(smooth(p/.22),1-smooth((p-.65)/.33)),0,1);
}
export function rideCameraShotV156(vehicle,side=-1,mode='enter'){
 const yaw=finite(vehicle?.rotation?.y);
 const x=finite(vehicle?.position?.x),z=finite(vehicle?.position?.z);
 const height=finite(vehicle?.position?.y);
 const s=side<0?-1:1,cs=Math.cos(yaw),sn=Math.sin(yaw);
 const longitudinal=mode==='exit'?-3.9:-4.5;
 const lateral=s*2.65;
 return {
  position:{x:x+cs*lateral+sn*longitudinal,
   y:height+2.45,z:z-sn*lateral+cs*longitudinal},
  target:{x:x+cs*s*1.0+sn*.15,y:height+1.05,
   z:z-sn*s*1.0+cs*.15}
 };
}
export function createRideCameraV156({T,camera,reducedMotion=false,lowEnd=false}={}){
 const position=new T.Vector3(),target=new T.Vector3();
 const baseQuaternion=new T.Quaternion(),shotQuaternion=new T.Quaternion();
 let state=null;
 function start(vehicle,{side=-1,mode='enter'}={}){
  if(!vehicle||!camera?.position||!['enter','exit'].includes(mode))return false;
  state={vehicle,side,mode,elapsed:0,duration:lowEnd?1.04:1.46};
  return true;
 }
 function update(dt=1/60){
  if(!state)return false;
  state.elapsed+=clamp(finite(dt),0,.05);
  const p=clamp(state.elapsed/state.duration,0,1);
  const weight=reducedMotion?0:rideCameraEaseV156(p)*(lowEnd?.48:.76);
  if(weight>.0001){
   const shot=rideCameraShotV156(state.vehicle,state.side,state.mode);
   position.set(shot.position.x,shot.position.y,shot.position.z);
   target.set(shot.target.x,shot.target.y,shot.target.z);
   // Blend on top of the game's existing follow/cockpit camera. At the
   // beginning and end weight reaches zero, so there is no snapping.
   camera.position.lerp(position,weight);
   baseQuaternion.copy(camera.quaternion);
   camera.lookAt(target);
   shotQuaternion.copy(camera.quaternion);
   camera.quaternion.copy(baseQuaternion).slerp(shotQuaternion,weight);
  }
  if(p>=1){state=null;return false}
  return true;
 }
 return {start,update,cancel:()=>{state=null},isActive:()=>!!state,
  getState:()=>state?{mode:state.mode,elapsed:state.elapsed,duration:state.duration}:null};
}
