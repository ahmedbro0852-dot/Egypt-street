// Continuous camera collision against the city's existing solid footprints.
// Slab intersections avoid tunnelling through thin walls between sampled points.
export function cameraClearFraction(origin, desired, solids, radius=.24){
 let nearest=1;
 const dx=desired.x-origin.x,dz=desired.z-origin.z;
 if(![origin.x,origin.z,dx,dz].every(Number.isFinite))return 0;
 for(const b of solids){
  if(![b.x,b.z,b.w,b.d].every(Number.isFinite)||b.w<0||b.d<0)continue;
  let enter=0,exit=nearest;
  for(let axis=0;axis<2;axis++){
   const start=axis?origin.z:origin.x,delta=axis?dz:dx;
   const center=axis?b.z:b.x,extent=(axis?b.d:b.w)+radius;
   if(Math.abs(delta)<1e-9){if(Math.abs(start-center)>extent){enter=1;exit=0;break}continue}
   let lo=(center-extent-start)/delta,hi=(center+extent-start)/delta;
   if(lo>hi)[lo,hi]=[hi,lo];
   enter=Math.max(enter,lo);exit=Math.min(exit,hi);
  }
  if(enter<=exit&&exit>=0&&enter<=nearest)nearest=Math.max(0,enter-1e-4);
 }
 return nearest;
}
export function constrainWorldCamera(origin,position,solids){
 const f=cameraClearFraction(origin,position,solids);
 if(f<1){position.x=origin.x+(position.x-origin.x)*f;position.y=origin.y+(position.y-origin.y)*f;position.z=origin.z+(position.z-origin.z)*f}
 return f;
}
// Look into the direction of travel, including reverse, without sudden jumps
// when the gearbox changes direction. Speeds are metres per second.
export function updateTravelLook(previous,speed,dt){
 const target=Math.max(-2.6,Math.min(2.6,(Number.isFinite(speed)?speed:0)*.13));
 return previous+(target-previous)*(1-Math.exp(-5*Math.max(0,Math.min(.05,dt||0))));
}
