// V53: adaptive mobile HD rendering. Never degrade below a readable output.
// Graphics stay local to the device and do not affect physics or saves.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function installAdaptiveMobileV50({
 renderer,getActive=()=>true,getPaused=()=>false,
 getQuality=()=> 'auto',getTargetFps=()=>60,getSharpness=()=>1
}={}){
 const touch=!!(window.matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>1);
 const enabled=!!(touch&&renderer?.isWebGLRenderer&&typeof renderer.setPixelRatio==='function');
 if(!enabled)return {enabled:false,sample(){},getStatus:()=>({enabled:false})};
 const memory=Number(navigator.deviceMemory)||4,cores=Number(navigator.hardwareConcurrency)||4;
 const lowEnd=memory<=3||cores<=4;
 const dpr=clamp(Number(window.devicePixelRatio)||1,1,4);
 let adaptive=1,last=0,start=0,count=0,slow=0,fast=0,lastAdjustment=0,observedFps=0,lastQuality='',lastSharpness=0;
 function cap(quality,sharpness){
  const preset={balanced:1.08,auto:lowEnd?1.25:1.44,high:1.65,ultra:1.95}[quality]??1.3;
  const area=Math.max(1,window.innerWidth*window.innerHeight);
  // Cap large phones/tablets to avoid unexpectedly high GPU fill rate.
  const budget=lowEnd?1350000:2250000;
  return Math.max(.9,Math.min(dpr,preset*sharpness,Math.sqrt(budget/area)));
 }
 function pixelRatio(quality,sharpness){
  const upper=cap(quality,sharpness),lower=Math.min(upper,lowEnd?1.0:1.12);
  return clamp(upper*adaptive,lower,upper);
 }
 function apply(quality,sharpness,force=false){
  const value=pixelRatio(quality,sharpness);
  if(force||Math.abs((renderer.getPixelRatio?.()||0)-value)>.045)renderer.setPixelRatio(value);
 }
 function sample(time){
  if(document.hidden||!getActive()||getPaused()){
   last=0;start=0;count=0;slow=0;fast=0;return;
  }
  const quality=getQuality()||'auto';
  const sharpness=clamp(Number(getSharpness())||1,.85,1.35);
  if(quality!==lastQuality||sharpness!==lastSharpness){
   lastQuality=quality;lastSharpness=sharpness;adaptive=1;
   lastAdjustment=time;slow=fast=0;start=0;count=0;last=0;
   apply(quality,sharpness,true);
  }
  if(last){
   const delta=time-last;
   if(delta>0&&delta<160)count++;
   else{count=0;start=time}
  }
  last=time;if(!start)start=time;
  if(time-start>=2200&&count>=10){
   observedFps=Math.round(count*1000/(time-start));
   start=time;count=0;
   const desired=getTargetFps()<=30?30:60;
   if(observedFps<desired*.79){slow++;fast=0}
   else if(observedFps>desired*.94){fast++;slow=0}
   else{slow=fast=0}
   if(slow>=3&&time-lastAdjustment>6000){
    adaptive=clamp(adaptive-.055,.72,1);slow=0;lastAdjustment=time;
   }else if(fast>=3&&time-lastAdjustment>6500){
    adaptive=clamp(adaptive+.035,.72,1);fast=0;lastAdjustment=time;
   }
  }
  apply(quality,sharpness);
 }
 function onVisibility(){last=0;start=0;count=0;slow=fast=0}
 document.addEventListener('visibilitychange',onVisibility);
 return {
  enabled:true,sample,
  getStatus:()=>({enabled:true,fps:observedFps,pixelRatio:renderer.getPixelRatio?.(),lowEnd,adaptive:Math.round(adaptive*100)}),
  dispose(){document.removeEventListener('visibilitychange',onVisibility)}
 };
}
