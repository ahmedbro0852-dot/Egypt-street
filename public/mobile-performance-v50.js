// V50 — adaptive GPU resolution for touch-first Egypt Streets.
// Keeps physics, mission state and saves unchanged; no timers or telemetry.
const clamp=(v,low,high)=>Math.min(high,Math.max(low,v));
export function installAdaptiveMobileV50({renderer,getActive=()=>true,getPaused=()=>false,getQuality=()=> 'auto',getTargetFps=()=>60}={}){
 const touch=!!(window.matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>1);
 const enabled=!!(touch&&renderer?.isWebGLRenderer&&typeof renderer.setPixelRatio==='function');
 if(!enabled)return {enabled:false,sample(){},getStatus:()=>({enabled:false})};
 const memory=Number(navigator.deviceMemory)||4;
 const cores=Number(navigator.hardwareConcurrency)||4;
 const lowEnd=memory<=3||cores<=4;
 const dpr=clamp(Number(window.devicePixelRatio)||1,1,4);
 let resolution=lowEnd?.78:.88,first=true;
 let last=0,start=0,count=0,slow=0,fast=0,lastAdjustment=0,observedFps=0,lastQuality='';
 function limit(quality){
  const requested={balanced:.78,high:1.1,ultra:1.35,auto:lowEnd?.8:1}[quality]??.8;
  return clamp(Math.min(dpr,requested),.5,1.35);
 }
 function apply(quality,force=false){
  const target=clamp(limit(quality)*resolution,.45,limit(quality));
  if(force||Math.abs((renderer.getPixelRatio?.()||0)-target)>.045){
   renderer.setPixelRatio(target);
  }
 }
 function sample(time){
  if(document.hidden||!getActive()||getPaused()){
   last=0;start=0;count=0;slow=0;fast=0;
   return;
  }
  const quality=getQuality()||'auto';
  if(first||quality!==lastQuality){
   lastQuality=quality;first=false;lastAdjustment=time;resolution=lowEnd?.78:.88;
   slow=fast=0;apply(quality,true);
  }
  if(last){
   const delta=time-last;
   if(delta>0&&delta<130)count++;
   else {count=0;start=time;}
  }
  last=time;if(!start)start=time;
  const span=time-start;
  if(span>=1800&&count>=12){
   observedFps=Math.round(count*1000/span);
   start=time;count=0;
   const desired=getTargetFps()<=30?30:60;
   if(observedFps<desired*.77){slow++;fast=0}
   else if(observedFps>desired*.95){fast++;slow=0}
   else {slow=0;fast=0}
   if(slow>=2&&time-lastAdjustment>2200&&resolution>.53){
    resolution=clamp(resolution-.12,.5,1);
    lastAdjustment=time;slow=0;
   }else if(fast>=3&&time-lastAdjustment>5000&&resolution<1){
    resolution=clamp(resolution+.055,.5,1);
    lastAdjustment=time;fast=0;
   }
  }
  // Sync after another graphics menu applies a fixed DPR.
  apply(quality);
 }
 function onVisibility(){last=0;start=0;count=0;slow=fast=0}
 document.addEventListener('visibilitychange',onVisibility);
 return {enabled:true,sample,getStatus:()=>({enabled:true,fps:observedFps,resolution:Math.round(resolution*100),pixelRatio:renderer.getPixelRatio?.(),lowEnd}),dispose(){document.removeEventListener('visibilitychange',onVisibility)}};
}
