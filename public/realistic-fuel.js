// Egypt Street V4: automatic driving, economy fuel tank, and playable petrol stations.
// Prices are fictional IN-GAME pounds. Fuel burn scales with actual distance, load and idle time.
const LIMIT=(v,a,b)=>Math.max(a,Math.min(b,v));
export const PETROL_STATIONS=[
 {name:'بنزينة المحروسة',x:-60,z:-73,signX:-69,signZ:-73},
 {name:'محطة بنزين النيل',x:60,z:73,signX:69,signZ:73},
 {name:'محطة الكورنيش',x:94,z:-125,signX:86,signZ:-125}
];
export const TANK_CAPACITY=45;
export const FUEL_PRICE=6; // purely fictional gameplay rate, not a real-world price.
const SAVE_KEY='egypt-street-fuel-v4';
export function createFuelSystem({T,scene,box,sign,ui,storage,getPosition,getSpeed,isDriving,getMoney,charge,notify}){
 let fuel=16,auto=true,target=60,spent=0,totalKm=0,lastSave=0,warning=false,atStation=null;
 try{
  const saved=JSON.parse(storage?.getItem(SAVE_KEY)||'null');
  if(saved&&Number.isFinite(saved.fuel)){
    fuel=LIMIT(saved.fuel,0,TANK_CAPACITY);
    if(Number.isFinite(saved.totalKm))totalKm=Math.max(0,saved.totalKm);
  }
 }catch(e){}
 // Build three lightweight real 3D fuel stops, visible along existing roads.
 const baseMaterials=['#d33e36','#1e8075','#dbb552'];
 for(let i=0;i<PETROL_STATIONS.length;i++){
  const s=PETROL_STATIONS[i],dx=s.signX-s.x;
  const pumpX=s.signX, pumpZ=s.signZ;
  box(pumpX,.18,pumpZ,5,.35,8,'#b6bcb8');
  box(pumpX,4.5,pumpZ,7,.28,9,'#ecddc2');
  for(const dz of [-3.4,3.4]){
    box(pumpX-2.7,2.25,pumpZ+dz,.25,4.4,.25,'#ebe0c7');
    box(pumpX+2.7,2.25,pumpZ+dz,.25,4.4,.25,'#ebe0c7');
  }
  for(const dz of [-1.8,1.8]){
    box(pumpX,1.05,pumpZ+dz,1.13,2.1,1.04,baseMaterials[i]);
    box(pumpX,1.45,pumpZ+dz+(dx<0?.535:-.535),.66,.45,.04,'#cde2dc');
    box(pumpX+.65,.9,pumpZ+dz,.16,1.1,.16,'#303d40');
  }
  // High price board, fictitious price in the game currency.
  box(pumpX,3,pumpZ+5,.65,6,.65,'#67767a');
  sign('بنزينة • ٦ ج/لتر',pumpX,6.5,pumpZ+5,8);
  box(pumpX,.08,pumpZ,5,.13,8,'#838980');
 }
 function persist(){
  try{storage?.setItem(SAVE_KEY,JSON.stringify({fuel,totalKm}))}catch(e){}
 }
 const clock={lastUI:-1};
 function station(){
  if(!isDriving())return null;
  const p=getPosition();
  return PETROL_STATIONS.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<9.5)||null;
 }
 function isStopped(){return Math.abs(getSpeed())<.9;}
 function updateUI(){
  ui.hud.style.display=isDriving()?'block':'none';
  if(!isDriving())return;
  const percentage=100*fuel/TANK_CAPACITY;
  ui.bar.style.width=percentage.toFixed(2)+'%';
  ui.bar.style.background=percentage<15?'#ec5145':percentage<33?'#f7bd60':'#62e1a2';
  ui.amount.textContent=fuel.toFixed(1)+' / '+TANK_CAPACITY+' لتر';
  ui.mode.textContent=auto?'🚗 بنزين تلقائي • '+target+' كم/س':'⏸️ البنزين التلقائي متوقف';
  ui.toggle.textContent=auto?'⏸️ وقف التلقائي':'▶️ شغّل التلقائي';
  ui.slower.textContent='− سرعة';
  ui.faster.textContent='+ سرعة';
  ui.warning.style.display=fuel<8?'block':'none';
  ui.warning.textContent=fuel<.04?'العربية من غير بنزين! لازم تفوّل.':'⚠️ البنزين قرب يخلص، روح أقرب محطة.';
  atStation=station();
  if(atStation){
   ui.station.style.display='block';
   ui.station.textContent=atStation.name+(isStopped()?' • جاهز للتفويل':' • فرمل ووقف عشان تفوّل');
  }else{ui.station.style.display='none'}
  ui.refuel.style.display=atStation&&isStopped()&&fuel<TANK_CAPACITY-.05?'block':'none';
  ui.refuel.textContent='⛽ فوّل العربية ('+FUEL_PRICE+' ج/لتر)';
 }
 function enter(){
  auto=fuel>.01;
  target=60;warning=false;updateUI();
  if(!auto)notify('التانك فاضي! لازم توقف عند بنزينة أو تكلم الدعم.');
 }
 function exit(){auto=false;updateUI();persist()}
 function toggle(){
  if(!isDriving())return;
  if(!auto&&fuel<.01){notify('التانك فاضي. لازم تفوّل الأول.');return;}
  auto=!auto;
  notify(auto?'البنزين تلقائي، دوس فرامل وقت ما تحب توقف.':'وقفت البنزين التلقائي — العربية هتهدى تدريجيًا.');
  updateUI();
 }
 function changeSpeed(delta){
  if(!isDriving())return;
  if(fuel<.01){notify('مافيش بنزين. لازم تفوّل الأول.');return}
  target=LIMIT(target+delta,20,115);
  auto=true;updateUI();
  notify('السرعة المستهدفة '+target+' كم/ساعة');
 }
 function reverse(){
  if(!isDriving())return false;
  if(Math.abs(getSpeed())>1.4){notify('لازم تقف تقريبًا قبل ما ترجع للخلف.');return false;}
  auto=false;updateUI();return fuel>.01;
 }
 function throttle({reverse=false,brake=false,manual=0}={}){
  if(fuel<=.001)return 0;
  if(brake)return 0;
  if(reverse)return -.73;
  if(manual>0)return 1;
  if(!auto)return 0;
  const speed=Math.max(0,getSpeed())*3.6;
  const difference=target-speed;
  return LIMIT(difference*.028+.11,0,1);
 }
 function update(dt,time,actualThrottle=0,engineOn=false){
  dt=LIMIT(Number.isFinite(dt)?dt:0,0,.05);
  spent+=dt;lastSave+=dt;
  if(engineOn&&isDriving()&&fuel>0){
   const speed=Math.abs(getSpeed());
   // About 7–13 litres/100 km at typical city driving and 0.5 L/hour at idle.
   const idle=.50/3600;
   const perMeter=.000078+.000060*LIMIT(Math.abs(actualThrottle),0,1)+.000009*speed/32.5;
   const consumption=dt*(idle+speed*perMeter+Math.abs(actualThrottle)*.00017);
   fuel=LIMIT(fuel-consumption,0,TANK_CAPACITY);
   totalKm+=speed*dt/1000;
   if(!warning&&fuel<8){notify('⚠️ البنزين قليل. قرب من بنزينة ووقف عشان تفوّل.');warning=true;}
   if(fuel===0&&auto){auto=false;notify('⛽ البنزين خلص، الموتور فصل. تقدر تفوّل عند المحطة.');}
  }
  if(spent-clock.lastUI>.25){clock.lastUI=spent;updateUI();}
  if(lastSave>8){lastSave=0;persist();}
 }
 function refuel(){
  const nearStation=station();
  if(!isDriving()||!nearStation){notify('لازم تكون بالعربية جنب محطة بنزين.');return false}
  if(!isStopped()){notify('وقف العربية تمام قبل التفويل.');return false}
  const short=TANK_CAPACITY-fuel;
  const litres=Math.floor(Math.min(short,getMoney()/FUEL_PRICE)*10)/10;
  if(litres<.1){notify('الفلوس مش كفاية لتفويل العربية.');return false}
  const cost=Math.round(litres*FUEL_PRICE*10)/10;
  if(!charge(cost)){notify('الفلوس مش كفاية.');return false}
  fuel=LIMIT(fuel+litres,0,TANK_CAPACITY);
  auto=false;warning=false;persist();updateUI();
  notify('⛽ اتفولت '+litres.toFixed(1)+' لتر مقابل '+cost.toFixed(0)+' جنيه. شغّل البنزين التلقائي لما تحب تتحرك.');
  return true;
 }
 ui.toggle.onclick=toggle;ui.slower.onclick=()=>changeSpeed(-15);
 ui.faster.onclick=()=>changeSpeed(15);ui.refuel.onclick=refuel;
 updateUI();
 return {
  enter,exit,toggle,changeSpeed,reverse,throttle,update,refuel,updateUI,station,
  getState:()=>({fuel,capacity:TANK_CAPACITY,auto,target,totalKm,atStation:atStation?.name||null})
 };
}
