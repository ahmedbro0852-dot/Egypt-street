// Egypt Streets V5.5 — steering-aware auto-driving on existing Cairo road grid.
// Auto pilot is an optional gameplay assist, not a real autonomous vehicle.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const CAIRO_DRIVE_LOOP=[
 [0,40],[0,60],[30,60],[60,60],[60,30],[60,0],[60,-30],[60,-60],
 [30,-60],[0,-60],[-30,-60],[-60,-60],[-60,-30],[-60,0],
 [-60,30],[-60,60],[-30,60],[0,60]
];
export function createAutoDriver({signalStop=()=>false,onStatus=()=>{}}={}){
 let index=0,enabled=false,notice=false;
 function nearestIndex(x,z){
  // Select a waypoint ahead of the vehicle; don't navigate through buildings.
  let best=0,dist=Infinity;
  CAIRO_DRIVE_LOOP.forEach(([xx,zz],i)=>{
   const d=Math.hypot(xx-x,zz-z);
   if(d<dist){dist=d;best=i}
  });
  return best;
 }
 function restore(s,p){
  if(!s||typeof s!=='object'){enabled=false;return}
  const n=Math.floor(Number.isFinite(s.index)?s.index:nearestIndex(p?.x||0,p?.z||0));
  index=((n%CAIRO_DRIVE_LOOP.length)+CAIRO_DRIVE_LOOP.length)%CAIRO_DRIVE_LOOP.length;
  enabled=!!s.enabled;
 }
 function start(x,z,chooseNearest=true){
  if(chooseNearest){
   index=nearestIndex(x,z);
   const wp=CAIRO_DRIVE_LOOP[index];
   if(Math.hypot(wp[0]-x,wp[1]-z)<8)index=(index+1)%CAIRO_DRIVE_LOOP.length;
  }
  enabled=true;notice=false;
  onStatus('🚗 القيادة الذاتية شغالة — العربية هتلف الشوارع وتبطّأ عند العوائق.');
 }
 function stop(){enabled=false;notice=false;onStatus('✋ القيادة الذاتية اتوقفت — الدريكسيون بقى معاك.')}
 function toggle(p){
  if(enabled)stop();else start(p.x,p.z,true);
  return enabled;
 }
 function controls(vehicle,traffic=[],walkers=[],dt=1/60){
  if(!enabled)return {steer:0,throttle:0,brake:false,active:false,targetSpeed:0};
  const point=()=>CAIRO_DRIVE_LOOP[index];
  let dest=point(),dx=dest[0]-vehicle.x,dz=dest[1]-vehicle.z;
  let distance=Math.hypot(dx,dz);
  if(distance<6.5){index=(index+1)%CAIRO_DRIVE_LOOP.length;dest=point();dx=dest[0]-vehicle.x;dz=dest[1]-vehicle.z;distance=Math.hypot(dx,dz)}
  const heading=Math.atan2(dx,dz),error=norm(heading-vehicle.yaw);
  let steer=clamp(error*1.95-vehicle.yawRate*.30,-1,1);
  // Cut speed before corners; preserve grip instead of snapping yaw.
  const sharp=Math.abs(error)>1.12;
  let desiredSpeed=sharp?3.1:Math.abs(error)>.55?5.8:9.5; // m/s: ~11–34 km/h
  if(distance<14)desiredSpeed=Math.min(desiredSpeed,4.8);
  if(distance<7)desiredSpeed=Math.min(desiredSpeed,3.5);
  const vx=Math.sin(vehicle.yaw),vz=Math.cos(vehicle.yaw);
  let danger=false;
  function ahead(obstacle,threshold){
   const dx=obstacle.position.x-vehicle.x,dz=obstacle.position.z-vehicle.z;
   const front=dx*vx+dz*vz;
   const lateral=Math.abs(dx*vz-dz*vx);
   return front>0&&front<Math.max(6,Math.abs(vehicle.speed)*1.55+3)&&lateral<threshold;
  }
  for(const c of traffic){if(ahead(c,2.35)){danger=true;break}}
  if(!danger)for(const p of walkers){if(ahead(p,1.65)){danger=true;break}}
  // Read signal state from the same V5 signal logic used by AI vehicles.
  const axis=Math.abs(vx)>Math.abs(vz)?'x':'z';
  const fake={position:{x:vehicle.x,z:vehicle.z},userData:{axis,direction:axis==='x'?(vx>=0?1:-1):(vz>=0?1:-1)}};
  if(signalStop(fake))danger=true;
  const speed=Math.max(0,vehicle.speed);
  const braking=danger||speed>desiredSpeed+1.3;
  const throttle=braking?0:clamp(.25+(desiredSpeed-speed)*.19,0,.9);
  if(danger&&!notice){onStatus('🚦 العربية هتقف لحد الطريق يفتح.');notice=true}
  if(!danger)notice=false;
  return {steer,throttle,brake:braking,active:true,targetSpeed:desiredSpeed,
    waypoint:{x:dest[0],z:dest[1]},danger};
 }
 return {start,stop,toggle,controls,restore,getState:()=>({enabled,index}),getTarget:()=>enabled?{x:pointSafe(index)[0],z:pointSafe(index)[1]}:null};
}
function pointSafe(i){return CAIRO_DRIVE_LOOP[Math.max(0,i)%CAIRO_DRIVE_LOOP.length]}
