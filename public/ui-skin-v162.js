// V162: interactive clean HUD layer with a compact mobile vehicle dashboard.
// Uses existing controls and does not replace any gameplay event listeners.
export function installStreetDesignV162({doc=globalThis.document}={}){
 if(!doc?.getElementById||!doc?.createElement)return {enabled:false};
 const fuel=doc.getElementById('fuelHud');
 const body=doc.body;
 if(!fuel||!body)return {enabled:false};
 const prev=doc.getElementById('v162DriveDetails');
 if(prev)return {enabled:true,expand:()=>prev.click(),getExpanded:()=>fuel.classList.contains('v162-expanded')};
 const overlay=doc.createElement('div');
 overlay.id='v162Vignette';
 overlay.setAttribute('aria-hidden','true');
 body.insertBefore(overlay,doc.getElementById('world')?.nextSibling||body.firstChild);
 const button=doc.createElement('button');
 button.id='v162DriveDetails';
 button.type='button';
 button.setAttribute('aria-controls','fuelActions');
 button.setAttribute('aria-expanded','false');
 const setExpanded=expanded=>{
  fuel.classList.toggle('v162-expanded',!!expanded);
  button.setAttribute('aria-expanded',String(!!expanded));
  button.textContent=expanded?'↑ إخفاء تفاصيل العربية':'⚙ خيارات العربية والتفاصيل';
 };
 setExpanded(false);
 button.addEventListener('click',()=>setExpanded(!fuel.classList.contains('v162-expanded')));
 const meter=fuel.querySelector('#fuelTrack');
 if(meter?.nextSibling)fuel.insertBefore(button,meter.nextSibling);
 else fuel.append(button);
 return {enabled:true,setExpanded,getExpanded:()=>fuel.classList.contains('v162-expanded'),
  dispose:()=>{button.remove();overlay.remove();fuel.classList.remove('v162-expanded')}};
}
