// Egypt Streets V155 — deterministic mirror glances and eye blinks.
// Simulates driver attention without cameras, raycasts, timers or render passes.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const safe=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const ramp=(value)=>{const v=clamp(value,0,1);return v*v*(3-2*v)};
const blinkPulse=(time,center,width)=>{
 const distance=Math.abs(time-center);
 return ramp((width-distance)/Math.max(.00001,width));
};

export function blinkAmountV155(seconds=0){
 const t=Math.max(0,safe(seconds));
 const phase=t%5.2;
 // A short blink plus a softer occasional second blink. No random flicker.
 return clamp(Math.max(blinkPulse(phase,3.74,.105),
  blinkPulse(phase,3.98,.068)*.52),0,1);
}
export function mirrorGlanceV155({age=99,signal=0,steer=0}={}){
 const t=Math.max(0,safe(age,99));
 const side=Math.sign(clamp(safe(signal),-1,1));
 if(!side)return {strength:0,side:0,headYaw:0,pupilX:0};
 // Look toward the chosen side mirror briefly, then back onto the road.
 const up=ramp((t-.14)/.30),down=1-ramp((t-1.02)/.31);
 const strength=clamp(up*down,0,1);
 return {strength,side,headYaw:strength?side*.24*strength:0,
  pupilX:strength?side*.013*strength:0};
}
export function createDriverAttentionV155(){
 let elapsed=0,previousSignal=0,age=99,glance=0;
 function update({dt=1/60,signal=0,steer=0}={}){
  const step=clamp(safe(dt),0,.05);
  elapsed+=step;
  const side=Math.sign(clamp(safe(signal),-1,1));
  if(side!==previousSignal){
   age=side?0:99;
   previousSignal=side;
  }else if(side){
   age+=step;
   if(age>5.2)age=0;
  }
  const gaze=mirrorGlanceV155({age,signal:side,steer});
  glance=gaze.strength;
  return {eyeOpen:clamp(1-blinkAmountV155(elapsed)*.90,.10,1),
   pupilX:gaze.pupilX,
   headYaw:gaze.headYaw,
   mirrorStrength:gaze.strength,
   lookingSide:gaze.side};
 }
 function reset(){
  previousSignal=0;age=99;glance=0;
 }
 return {update,reset,getState:()=>({elapsed,previousSignal,age,glance})};
}
