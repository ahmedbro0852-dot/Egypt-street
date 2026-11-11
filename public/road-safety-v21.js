// Egypt Streets V21 — active driver-assistance: predictive AEB, pedestrian radar and ABS.
// Lightweight forward radar for the mobile browser game (not a real safety system).
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const KEY='egypt-streets-safety-v21';
const HEIGHT={taxi:[2.03,.95],sedan:[2.06,.96],sport:[2.13,1.03],motorbike:[1.08,.44]};
const dot=(x,z,u,v)=>x*u+z*v;
export function predictHazardV21({vehicle,traffic=[],pedestrians=[],grip=1,vehicleId='taxi'}={}){
 if(!vehicle)return {level:0,target:null,brake:false,throttleScale:1};
 const speed=Number(vehicle.speed)||0,absolute=Math.abs(speed);
 if(absolute<1.65)return {level:0,target:null,brake:false,throttleScale:1,distance:Infinity};
 const direction=speed<0?-1:1,yaw=Number(vehicle.yaw)||0;
 const fX=Math.sin(yaw)*direction,fZ=Math.cos(yaw)*direction;
 const sX=Math.cos(yaw),sZ=-Math.sin(yaw);
 const ownSize=HEIGHT[vehicleId]||HEIGHT.taxi;
 const mu=clamp((Number(grip)||.7)*.82,.30,1.05);
 const stopping=absolute*.42+absolute*absolute/(2*mu*9.81)+1.5;
 const horizon=Math.min(62,Math.max(17,stopping*1.9+5));
 let closest=null;
 function consider(obj,kind,size,velX=0,velZ=0){
  const dx=obj.position.x-vehicle.x,dz=obj.position.z-vehicle.z;
  const ahead=dot(dx,dz,fX,fZ);
  const side=Math.abs(dot(dx,dz,sX,sZ));
  // Only actual driving corridor. Ignore people safely standing on the pavement.
  const corridor=ownSize[1]+size[1]+(kind==='pedestrian'?.18:.24);
  if(side>corridor||ahead<.2||ahead>horizon+size[0])return;
  const gap=Math.max(0,ahead-ownSize[0]-size[0]);
  const closing=absolute-dot(velX,velZ,fX,fZ);
  if(closing<.7)return;
  const ttc=gap/closing;
  const effectiveStopping=stopping*clamp(closing/absolute,.5,1.45);
  let level=0;
  if(gap<2.2||ttc<.95||gap<=effectiveStopping*.91)level=3;
  else if(ttc<2||gap<=effectiveStopping*1.20)level=2;
  else if(ttc<3.7||gap<=effectiveStopping*1.68+3)level=1;
  if(!level)return;
  const candidate={kind,other:obj,distance:gap,closingSpeed:closing,
    ttc,stoppingDistance:effectiveStopping,level};
  if(!closest||candidate.level>closest.level||
     candidate.level===closest.level&&candidate.ttc<closest.ttc)closest=candidate;
 }
 for(const c of traffic){
  if(!c?.position)continue;
  const d=c.userData||{},v=(d.actualCruise||0)*(d.direction||1);
  consider(c,'vehicle',d.wheels?.length===2?HEIGHT.motorbike:HEIGHT.taxi,
    d.axis==='x'?v:0,d.axis==='z'?v:0);
 }
 for(const p of pedestrians){
  if(!p?.position)continue;
  // Recently struck pedestrians are handled by the collision-response system.
  if(p.userData?.impactMotion&&p.userData.impactMotion.stage!=='done')continue;
  consider(p,'pedestrian',[.15,.31]);
 }
 return closest?{...closest,target:closest.other,brake:closest.level>=3,
   throttleScale:closest.level>=3?0:closest.level===2?.12:.60}:{
    level:0,target:null,brake:false,throttleScale:1,distance:Infinity,
    stoppingDistance:stopping};
}
export function createRoadSafetyV21({storage,ui={},notify=()=>{},haptic=()=>{}}={}){
 let enabled=true,warnings=0,interventions=0,lastLevel=0,lastAlertAt=-Infinity,
     current={level:0,brake:false,throttleScale:1,distance:Infinity};
 try{const state=JSON.parse(storage?.getItem(KEY)||'null');
  if(state&&typeof state.enabled==='boolean')enabled=state.enabled;
  if(state&&Number.isFinite(state.warnings))warnings=clamp(Math.floor(state.warnings),0,100000);
  if(state&&Number.isFinite(state.interventions))interventions=clamp(Math.floor(state.interventions),0,100000);
 }catch(e){}
 const save=()=>{try{storage?.setItem(KEY,JSON.stringify({enabled,warnings,interventions}))}catch(e){}};
 function show(){
  if(ui.button){ui.button.textContent=enabled?'🛡️ فرامل الطوارئ: شغالة':'🛡️ فرامل الطوارئ: متوقفة';
   ui.button.setAttribute?.('aria-pressed',String(enabled))}
  if(ui.status){
   const label=current.kind==='pedestrian'?'ماشي قدامك':current.kind==='vehicle'?'عربية قدامك':'';
   const distance=Number.isFinite(current.distance)?' • '+current.distance.toFixed(1)+'م':'';
   const messages=['🟢 الطريق آمن','🟡 انتبه: '+label+distance,
     '🟠 خطر قريب: '+label+distance,'🔴 فرملة طوارئ! '+label+distance];
   ui.status.textContent=enabled?messages[current.level]:'⚪ نظام الطوارئ متوقف';
   ui.status.dataset.level=enabled?String(current.level):'0';
  }
  if(ui.abs)ui.abs.textContent='🚗 ABS '+(enabled?'جاهز':'متاح أثناء الفرملة')+
    ' • تدخلات: '+interventions;
 }
 function update({vehicle,traffic,pedestrians,grip=1,vehicleId='taxi',driving=true,
                  t=0,autopilot=false}={}){
  current=driving?predictHazardV21({vehicle,traffic,pedestrians,grip,vehicleId}):
    {level:0,target:null,brake:false,throttleScale:1,distance:Infinity};
  // Warn even if assistance is disabled; only automatic braking depends on toggle.
  if(current.level>=2&&lastLevel<2){warnings++;save()}
  if(enabled&&current.level===3&&lastLevel<3&&driving){
   interventions++;save();
   if(t-lastAlertAt>2100){notify('🚨 فرامل طوارئ! خطر '+(current.kind==='pedestrian'?'ماشي':'عربية')+' قدامك');
    haptic();lastAlertAt=t}
  }
  const levelChanged=current.level!==lastLevel;
  lastLevel=current.level;
  // Critical warning colour must update immediately, not on the 180ms UI timer.
  if(levelChanged||t-(update.lastUI??-Infinity)>180){show();update.lastUI=t}
  // ABS remains available for manual braking even when AEB is switched off.
  return {...current,brake:enabled&&driving&&current.level===3,
    throttleScale:enabled&&driving?current.throttleScale:1,absEnabled:driving,
    autoPilot:!!autopilot,enabled};
 }
 function toggle(){enabled=!enabled;save();show();notify(enabled?
   '🛡️ نظام فرامل الطوارئ اتفعل':'⚠️ فرامل الطوارئ الأوتوماتيك اتوقفت');return enabled}
 function restore(data){if(!data||typeof data!=='object')return;
  if(typeof data.enabled==='boolean')enabled=data.enabled;
  if(Number.isFinite(data.warnings))warnings=clamp(Math.floor(data.warnings),0,100000);
  if(Number.isFinite(data.interventions))interventions=clamp(Math.floor(data.interventions),0,100000);
  save();show();
 }
 if(ui.button)ui.button.onclick=toggle;
 show();
 return {update,toggle,restore,getState:()=>({enabled,warnings,interventions}),
  getLive:()=>({...current}),refresh:show};
}
