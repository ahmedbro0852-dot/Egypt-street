// Egypt Streets V6 — GPS-aware autonomous city driving with signal and obstacle yielding.
// Route planner uses only paved road corridors; optional driving assist, not real autonomy.
import {planRoadRoute} from './gps-v6.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const CAIRO_DRIVE_LOOP=[
 [0,40],[0,60],[30,60],[60,60],[60,30],[60,0],[60,-30],[60,-60],
 [30,-60],[0,-60],[-30,-60],[-60,-60],[-60,-30],[-60,0],
 [-60,30],[-60,60],[-30,60],[0,60]
];
export function createAutoDriver({signalStop=()=>false,onStatus=()=>{}}={}){
 let enabled=false,index=0,mode='patrol',path=[],pathIndex=0,goal=null,label='',arrived=false;
 let hazardShown=false,stuckTime=0,lastX=null,lastZ=null,replanCooldown=0;
 function nearestIndex(x,z,yaw){
  let best=0,value=Infinity;
  CAIRO_DRIVE_LOOP.forEach(([xx,zz],i)=>{
   const dx=xx-x,dz=zz-z,d=Math.hypot(dx,dz);
   const heading=dx*Math.sin(yaw||0)+dz*Math.cos(yaw||0);
   const score=d+(d>3&&heading<0?16:0);
   if(score<value){value=score;best=i}
  });
  return best;
 }
 function plan(pos){
  if(!goal)return false;
  const r=planRoadRoute(pos,goal,pos.yaw);
  if(!r||!r.path?.length)return false;
  path=r.path;pathIndex=0;arrived=false;
  while(pathIndex<path.length-1&&dist(pos,path[pathIndex])<5.5)pathIndex++;
  return r;
 }
 function setDestination(point,name='',pos=null,announce=true){
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return null;
  const start=pos||{x:0,z:0,yaw:0};
  const result=planRoadRoute(start,point,start.yaw);
  if(!result)return null;
  mode='gps';goal={x:point.x,z:point.z};label=String(name||'الوجهة');
  path=result.path;pathIndex=0;arrived=false;enabled=true;hazardShown=false;
  while(pathIndex<path.length-1&&dist(start,path[pathIndex])<5.5)pathIndex++;
  if(announce)onStatus('🧭 الطريق اتحدد لـ'+label+' • '+Math.round(result.distance)+' متر.');
  return result;
 }
 function clearDestination(pos){
  goal=null;label='';mode='patrol';path=[];pathIndex=0;arrived=false;
  if(enabled)start(pos?.x||0,pos?.z||0,true,pos?.yaw||0);
 }
 function start(x,z,chooseNearest=true,yaw=0){
  if(mode==='gps'&&goal){
   if(!plan({x,z,yaw}))return false;
  }else{
   if(chooseNearest){
    index=nearestIndex(x,z,yaw);
    const target=CAIRO_DRIVE_LOOP[index];
    if(Math.hypot(target[0]-x,target[1]-z)<7)index=(index+1)%CAIRO_DRIVE_LOOP.length;
   }
  }
  enabled=true;hazardShown=false;stuckTime=0;lastX=x;lastZ=z;arrived=false;
  onStatus(mode==='gps'?'🧭 رايح لـ'+label+' بالقيادة الذاتية.':'🚗 العربية بتلف شوارع القاهرة لوحدها.');
  return true;
 }
 function stop(){
  if(!enabled)return;
  enabled=false;hazardShown=false;
  onStatus('✋ القيادة الذاتية اتوقفت — الدريكسيون معاك.');
 }
 function toggle(pos){
  if(enabled)stop();else start(pos.x,pos.z,true,pos.yaw);
  return enabled;
 }
 function restore(state,pos){
  if(!state||typeof state!=='object'){enabled=false;return}
  index=Number.isFinite(state.index)?((Math.floor(state.index)%CAIRO_DRIVE_LOOP.length)+CAIRO_DRIVE_LOOP.length)%CAIRO_DRIVE_LOOP.length:nearestIndex(pos.x,pos.z,pos.yaw);
  mode=state.mode==='gps'&&state.goal?'gps':'patrol';
  goal=mode==='gps'&&Number.isFinite(state.goal.x)&&Number.isFinite(state.goal.z)?
    {x:state.goal.x,z:state.goal.z}:null;
  label=goal?String(state.label||'الوجهة').slice(0,90):'';
  path=[];pathIndex=0;arrived=false;
  if(goal)plan(pos);
  arrived=!!state.arrived&&!!goal;
  enabled=!!state.enabled;
 }
 function avoid(vehicle,traffic,walkers){
  const vx=Math.sin(vehicle.yaw),vz=Math.cos(vehicle.yaw),speed=Math.max(0,vehicle.speed);
  const safeGap=Math.max(7,speed*1.45+speed*speed/12);
  const ahead=(obstacle,width)=>{
   const dx=obstacle.position.x-vehicle.x,dz=obstacle.position.z-vehicle.z;
   const forward=dx*vx+dz*vz,lateral=Math.abs(dx*vz-dz*vx);
   return forward>0&&forward<safeGap&&lateral<width;
  };
  for(const c of traffic)if(ahead(c,2.2))return true;
  for(const p of walkers)if(ahead(p,1.5))return true;
  const axis=Math.abs(vx)>Math.abs(vz)?'x':'z';
  const d=axis==='x'?(vx>=0?1:-1):(vz>=0?1:-1);
  return signalStop({position:{x:vehicle.x,z:vehicle.z},userData:{axis,direction:d}});
 }
 function controls(vehicle,traffic=[],walkers=[],dt=1/60,options={}){
  const idle={steer:0,throttle:0,brake:false,active:false,targetSpeed:0};
  if(!enabled)return idle;
  if(mode==='gps'&&arrived)return {...idle,active:true,brake:true,arrived:true};
  const positions=mode==='gps'?path:CAIRO_DRIVE_LOOP;
  if(!positions.length)return {...idle,active:true,brake:true};
  const current=()=>mode==='gps'?positions[pathIndex]:{x:positions[index][0],z:positions[index][1]};
  let dest=current();
  // In GPS mode each waypoint is consumed only when physically near the road segment.
  for(let i=0;i<3&&dist(vehicle,dest)<(mode==='gps'?5.3:6.5);i++){
   if(mode==='gps'){
    if(pathIndex===path.length-1){
     arrived=true;onStatus('✅ وصلت لـ'+label+' — العربية وقفت. لو الهدف بعيد عن الرصيف انزل وكمل مشي.');
     return {...idle,active:true,brake:true,arrived:true};
    }
    pathIndex++;
   }else index=(index+1)%positions.length;
   dest=current();
  }
  const dx=dest.x-vehicle.x,dz=dest.z-vehicle.z;
  const remaining=Math.hypot(dx,dz);
  const heading=Math.atan2(dx,dz),err=angle(heading-vehicle.yaw);
  let steer=clamp(err*1.42-vehicle.yawRate*.30,-1,1);
  // Brake before sharp turns; do not cut through buildings to the next node.
  let corner=false;
  if(mode==='gps'&&pathIndex<path.length-1){
   const next=positions[pathIndex+1];
   const a=Math.atan2(next.x-dest.x,next.z-dest.z);
   corner=Math.abs(angle(a-heading))>.6;
  }
  const sharp=Math.abs(err)>.75;
  const chosen=Number.isFinite(options.cruiseKmh)?options.cruiseKmh:60;
  // City autopilot respects speed preset but caps itself for urban roads.
  let desired=sharp?3.3:Math.abs(err)>.32?5.9:clamp(chosen/3.6,8.5,17.0);
  // Slow down well *before* a sharp corner, not while already turning.
  if(corner&&remaining<35)desired=Math.min(desired,Math.max(3.7,(remaining-5)*.43));
  if(mode==='gps'&&pathIndex===path.length-1)desired=Math.min(desired,Math.max(1.1,(remaining-2.8)*.6));
  if(remaining<9)desired=Math.min(desired,3.8);
  let danger=avoid(vehicle,traffic,walkers);
  const speed=Math.max(0,vehicle.speed);
  if(danger&&!hazardShown){hazardShown=true;onStatus('🚦 ببطّأ عشان في عائق أو إشارة قدّامنا.')}
  if(!danger)hazardShown=false;
  const brake=danger||speed>desired+.85;
  const throttle=brake?0:clamp(.15+(desired-speed)*.20,0,.95);
  // Re-plan if the car is at a standstill for too long without a visible hazard.
  if(mode==='gps'&&!danger&&speed<.42&&throttle>.4){
   stuckTime+=dt;
   if(stuckTime>9){
    stuckTime=0;
    if(plan(vehicle))onStatus('🧭 غيّرت طريق الـGPS بسبب الوقفة الطويلة.');
   }
  }else stuckTime=0;
  return {steer,throttle,brake,active:true,targetSpeed:desired,
    waypoint:{x:dest.x,z:dest.z},danger,arrived:false};
 }
 function getState(){return {enabled,index,mode,goal:goal?{...goal}:null,label,routeIndex:pathIndex,arrived}}
 function getRoute(){return mode==='gps'?path.slice(pathIndex).map(v=>({x:v.x,z:v.z})):[]}
 function getTarget(){const p=mode==='gps'?path[pathIndex]:CAIRO_DRIVE_LOOP[index];return p?Array.isArray(p)?{x:p[0],z:p[1]}:{x:p.x,z:p.z}:null}
 return {start,stop,toggle,restore,setDestination,clearDestination,controls,getState,getRoute,getTarget};
}
