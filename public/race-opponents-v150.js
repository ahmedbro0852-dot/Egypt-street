// Egypt Streets V150 — deterministic racing opponent pace controller.
// Uses road geometry and actual player position, not artificial rubber-banding.
// Pure functions: safe in the render loop and directly testable with Node.
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const number=(value,fallback=0)=>Number.isFinite(value)?value:fallback;

export function cornerDemandV150(points,steps=0,segment=0){
 if(!Array.isArray(points)||points.length<3)return {severity:0,remaining:Infinity};
 const n=points.length,i=((Math.trunc(number(steps))%n)+n)%n;
 const a=points[i],b=points[(i+1)%n],c=points[(i+2)%n];
 if(!a||!b||!c)return {severity:0,remaining:Infinity};
 const ax=number(b.x)-number(a.x),az=number(b.z)-number(a.z);
 const bx=number(c.x)-number(b.x),bz=number(c.z)-number(b.z);
 const len=Math.hypot(ax,az),nextLen=Math.hypot(bx,bz);
 if(len<.01||nextLen<.01)return {severity:0,remaining:Infinity};
 const cos=clamp((ax*bx+az*bz)/(len*nextLen),-1,1);
 return {severity:clamp((1-cos)*.60,0,1),
  remaining:Math.max(0,len-clamp(number(segment),0,len))};
}

export function targetOpponentSpeedV150({
 baseSpeed=14,points=[],steps=0,segment=0,
 player=null,position=null,lane=0,crashHold=false
}={}){
 const base=clamp(number(baseSpeed,14),3,40);
 const corner=cornerDemandV150(points,steps,segment);
 // Anticipatory braking 14m before a turn; right-angle corner ~33% slower.
 const approach=clamp((14-corner.remaining)/14,0,1);
 const cornerFactor=1-.55*corner.severity*approach;
 let trafficFactor=1;
 const n=points.length;
 if(player&&position&&n>1){
  const i=((Math.trunc(number(steps))%n)+n)%n;
  const a=points[i],b=points[(i+1)%n];
  if(a&&b){
   const dx=number(b.x)-number(a.x),dz=number(b.z)-number(a.z);
   const len=Math.hypot(dx,dz);
   if(len>.01){
    const fwd=((number(player.x)-number(position.x))*dx+
      (number(player.z)-number(position.z))*dz)/len;
    const sideways=Math.abs(((number(player.x)-number(position.x))*(-dz)+
      (number(player.z)-number(position.z))*dx)/len);
    // Give the player's car room rather than driving straight through it.
    // No random speed boost or teleportation to keep an AI driver close.
    if(fwd>0&&fwd<11&&sideways<2.3)
     trafficFactor=clamp(.48+fwd*.047, .48, 1);
   }
  }
 }
 const collisionFactor=crashHold?.14:1;
 return clamp(base*cornerFactor*trafficFactor*collisionFactor,0,base);
}

export function evolveOpponentSpeedV150(current,target,dt){
 const h=clamp(number(dt),0,.05);
 const speed=Math.max(0,number(current)),goal=Math.max(0,number(target));
 // Braking can be stronger than acceleration; no frame-rate dependent jumps.
 return clamp(speed+clamp(goal-speed,-8.8*h,3.3*h),0,40);
}
