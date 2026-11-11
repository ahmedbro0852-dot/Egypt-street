// V56: crisp circular mobile speed, RPM, gears and fuel. No extra WebGL calls.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function installMobileInstrumentsV56({getActive=()=>false,getDriving=()=>false}={}){
 const touch=!!(window.matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>1);
 if(!touch||window.innerWidth>=920)return {enabled:false,update(){},dispose(){}};
 const css=document.createElement('style');css.id='v56-instrument-styles';
 css.textContent="\nbody.mobile-v51 #v56Dial{position:fixed;left:50%;bottom:max(13px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:42;width:120px;height:125px;padding:0;color:#fff2d0;pointer-events:none;font-family:Tahoma,Arial;filter:drop-shadow(0 4px 12px #0009)}\nbody.mobile-v51 #v56Dial[hidden]{display:none!important}\nbody.mobile-v51 #v56Dial .v56-shell{position:relative;width:112px;height:112px;margin:auto;border-radius:50%;background:radial-gradient(circle at 40% 32%,#203b46 0%,#091923 74%);border:2px solid #bba46d99;box-shadow:inset 0 0 0 3px #07141a,inset 0 -12px 20px #0007}\nbody.mobile-v51 #v56Dial svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}\nbody.mobile-v51 #v56Dial .v56-track{fill:none;stroke:#72838a55;stroke-width:5;stroke-linecap:round}\nbody.mobile-v51 #v56Dial .v56-progress{fill:none;stroke:#f5c872;stroke-width:5;stroke-linecap:round}\nbody.mobile-v51 #v56Dial .v56-needle{stroke:#ef705d;stroke-width:2.5;stroke-linecap:round}\nbody.mobile-v51 #v56Dial .v56-center{fill:#f3d2a2}\nbody.mobile-v51 #v56Dial .v56-digits{position:absolute;top:54%;width:100%;text-align:center;font-variant-numeric:tabular-nums}\nbody.mobile-v51 #v56Dial .v56-value{font:900 24px/1 Tahoma,Arial;color:#fff2cf;text-shadow:0 1px 4px #000c}\nbody.mobile-v51 #v56Dial .v56-unit{font:700 8px/1.6 Tahoma;letter-spacing:1.5px;color:#b6d4d4}\nbody.mobile-v51 #v56Dial .v56-bottom{position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;justify-content:center;align-items:center;gap:9px;padding:4px 9px;min-width:115px;white-space:nowrap;border:1px solid #ad9c7180;border-radius:7px;background:#102b35f5;color:#f6d8a2;font:700 10px Tahoma}\nbody.mobile-v51 #v56Dial .v56-gear{min-width:17px;text-align:center;color:#9cfee1}\nbody.mobile-v51 #v56Dial .v56-rpm{color:#d5dadd}\nbody.mobile-v51 #v56Dial .v56-fuel-track{position:absolute;bottom:14px;left:21px;right:21px;height:3px;background:#485259;overflow:hidden;border-radius:10px}\nbody.mobile-v51 #v56Dial .v56-fuel-fill{height:100%;width:100%;background:#7fd3a4;border-radius:10px}\n@media(max-width:370px){body.mobile-v51 #v56Dial{bottom:132px;transform:translateX(-50%) scale(.82);transform-origin:center bottom}}\n@media(max-height:430px){body.mobile-v51 #v56Dial{bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%) scale(.82);transform-origin:center bottom}}\n";
 document.head.append(css);
 const root=document.createElement('aside');root.id='v56Dial';root.hidden=true;
 root.setAttribute('role','status');root.setAttribute('aria-label','عداد السرعة والغيار ولفات الموتور');
 root.setAttribute('aria-live','off');root.innerHTML="<div class=\"v56-shell\">\n  <svg viewBox=\"0 0 120 120\" aria-hidden=\"true\">\n   <path class=\"v56-track\" d=\"M26 94 A46 46 0 1 1 94 94\"/>\n   <path class=\"v56-progress\" pathLength=\"100\" stroke-dasharray=\"0 100\" d=\"M26 94 A46 46 0 1 1 94 94\"/>\n   <line class=\"v56-needle\" x1=\"60\" y1=\"60\" x2=\"60\" y2=\"27\" transform=\"rotate(-135 60 60)\"/>\n   <circle class=\"v56-center\" cx=\"60\" cy=\"60\" r=\"4\"/>\n  </svg>\n  <div class=\"v56-digits\"><div class=\"v56-value\">0</div><div class=\"v56-unit\">KM/H</div></div>\n  <div class=\"v56-fuel-track\"><div class=\"v56-fuel-fill\"></div></div>\n </div><div class=\"v56-bottom\"><span class=\"v56-gear\">N</span><span class=\"v56-rpm\">0 RPM</span></div>";
 document.body.append(root);
 const digits=root.querySelector('.v56-value'),needle=root.querySelector('.v56-needle'),arc=root.querySelector('.v56-progress'),
  gearEl=root.querySelector('.v56-gear'),rpmEl=root.querySelector('.v56-rpm'),fuelEl=root.querySelector('.v56-fuel-fill');
 let shown=0,last=0;
 function update(time=0,{speed=0,rpm=0,gear='N',fuel=0,capacity=45,braking=false}={}){
  const visible=!!(getActive()&&getDriving());root.hidden=!visible;
  if(!visible){last=0;shown=0;return;}
  if(last&&time-last<65)return;
  const dt=last?clamp((time-last)/1000,0,.14):.08;last=time;
  const goal=Math.max(0,Math.abs(Number(speed)||0)*3.6);
  shown+=(goal-shown)*(1-Math.exp(-dt*10));
  const kph=Math.round(shown),fraction=clamp(shown/180,0,1),degrees=-135+fraction*270;
  digits.textContent=String(kph);
  arc.setAttribute('stroke-dasharray',(fraction*100).toFixed(1)+' 100');
  arc.style.stroke=braking?'#ef765c':kph>=125?'#f7aa5a':'#f5c872';
  needle.setAttribute('transform','rotate('+degrees.toFixed(1)+' 60 60)');
  gearEl.textContent=String(gear||'N').slice(0,3);
  rpmEl.textContent=(Math.max(0,Number(rpm)||0)/1000).toFixed(1)+'k RPM';
  const remaining=clamp((Number(fuel)||0)/Math.max(1,Number(capacity)||45),0,1);
  fuelEl.style.width=(remaining*100).toFixed(1)+'%';
  fuelEl.style.background=remaining<.15?'#f47b5b':'#7fd3a4';
 }
 return {enabled:true,update,dispose(){root.remove();css.remove()}};
}
