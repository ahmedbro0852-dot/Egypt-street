// V151: select an actual nearby world vehicle, independently of paint or garage ownership.
export const RIDE_RADIUS_V151=6;
const finite=v=>Number.isFinite(v);
export function nearestRideV151({player,vehicles=[],radius=RIDE_RADIUS_V151}={}){
 if(!player||!finite(player.x)||!finite(player.z))return null;
 const max=Math.max(1,Math.min(12,Number(radius)||RIDE_RADIUS_V151));
 let best=null,bestD=max*max;
 for(const vehicle of vehicles){
  if(!vehicle||vehicle.visible===false||!vehicle.position)continue;
  const {x,z}=vehicle.position;
  if(!finite(x)||!finite(z))continue;
  const distance=(x-player.x)**2+(z-player.z)**2;
  if(distance<=bestD){best=vehicle;bestD=distance}
 }
 return best;
}
export function rideKindV151(vehicle){
 const id=vehicle?.userData?.streetRideKind;
 return id==='motorbike'?'motorbike':id==='sport'?'sport':
   id==='taxi'?'taxi':'sedan';
}
