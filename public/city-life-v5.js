// Egypt Street V5 — Cairo city life, light cycles, rainfall and traffic laws.
// Lightweight, deterministic 3D effects. All fines and rates are fictional game rules.
export const LIGHT_JUNCTIONS=[-60,0,60].flatMap(x=>[-60,0,60].map(z=>({x,z})));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const WEATHER=['صحو','غائم','مطر'];
export function createCityLife({T,scene,sun,ambient,box,ui,storage,getPosition,isDriving,getSpeed,charge,notify}){
 let gameHour=7.5,weather=0,secs=0,signalSecs=0,envClock=0,uiClock=0,weatherSince=0;
 let fines=0,lastFine=-100,lastSpeedFine=-100,seenRed=new Set();
 const prefix='egypt-street-life-v5';
 try{
  const s=JSON.parse(storage?.getItem(prefix)||'null');
  if(s&&Number.isFinite(s.hour))gameHour=clamp(s.hour,0,23.99);
  if(s&&Number.isFinite(s.weather))weather=clamp(Math.floor(s.weather),0,2);
  if(s&&Number.isFinite(s.fines))fines=Math.max(0,Math.floor(s.fines));
 }catch(e){}
 function save(){try{storage?.setItem(prefix,JSON.stringify({hour:gameHour,weather,fines}))}catch(e){}}
 const bright=new T.MeshBasicMaterial({color:0xff3434}),
       amber=new T.MeshBasicMaterial({color:0xffc94e}),
       green=new T.MeshBasicMaterial({color:0x45e880}),
       dimRed=new T.MeshBasicMaterial({color:0x512b2b}),
       dimAmber=new T.MeshBasicMaterial({color:0x50452b}),
       dimGreen=new T.MeshBasicMaterial({color:0x284337}),
       dark=new T.MeshLambertMaterial({color:0x37464a}),
       steel=new T.MeshLambertMaterial({color:0x717a79});
 const lamps=[],rain=new T.Group();scene.add(rain);
 const dropMat=new T.MeshBasicMaterial({color:0xc0d9e3,transparent:true,opacity:.63,depthWrite:false});
 const dropGeom=new T.BoxGeometry(.025,.69,.025);
 const drops=[];
 for(let i=0;i<36;i++){
  const drop=new T.Mesh(dropGeom,dropMat);
  drop.userData.seedX=Math.sin(i*12.971)*18;
  drop.userData.seedZ=Math.cos(i*8.813)*18;
  drop.userData.seedY=(i*137%31)/31;
  rain.add(drop);drops.push(drop);
 }
 function lamp(posX,posZ,axis,junction){
  const body=new T.Group();body.position.set(posX,0,posZ);scene.add(body);
  const pole=new T.Mesh(new T.CylinderGeometry(.1,.14,4.7,6),steel);
  pole.position.y=2.35;body.add(pole);
  const caseMesh=new T.Mesh(new T.BoxGeometry(.65,1.72,.44),dark);
  caseMesh.position.set(0,4.26,.0);body.add(caseMesh);
  const spheres=[],colors=[[bright,dimRed],[amber,dimAmber],[green,dimGreen]];
  for(let i=0;i<3;i++){
   const g=new T.Mesh(new T.SphereGeometry(.2,8,6),colors[i][1]);
   g.position.set(0,4.75-i*.46,.26);body.add(g);spheres.push(g);
  }
  lamps.push({junction,axis,spheres,colors});
 }
 for(const junction of LIGHT_JUNCTIONS){
   // Place signals outside the driving footprint and mark stopping lines.
   lamp(junction.x-7.5,junction.z-7.5,'z',junction);
   lamp(junction.x+7.5,junction.z+7.5,'x',junction);
   box(junction.x,.102,junction.z-7.2,10,.018,.18,'#dfd7ca');
   box(junction.x-7.2,.102,junction.z,.18,.018,10,'#dfd7ca');
 }
 function phase(x,z){
   const offset=((Math.round(x/30)*3+Math.round(z/30)*5+56)%7)*2;
   return (signalSecs+offset)%38;
 }
 function getSignal(axis,x,z){
  const t=phase(x,z),v=axis==='z'?t:(t+19)%38;
  return v<16?'green':v<19?'yellow':'red';
 }
 // Identify upcoming red/yellow in the current travel lane, before a stop line.
 function trafficMustBrake(car){
  const d=car.userData;
  if(!d?.axis)return false;
  const axis=d.axis,other=axis==='x'?'z':'x',direction=d.direction||1;
  for(const j of LIGHT_JUNCTIONS){
   if(Math.abs(car.position[other]-j[other])>6.8)continue;
   const ahead=(j[axis]-car.position[axis])*direction;
   if(ahead>6.6&&ahead<23&&getSignal(axis,j.x,j.z)!=='green')return true;
  }
  return false;
 }
 function sunshine(){
  const sunAngle=(gameHour-6)/12*Math.PI;
  const daylight=clamp(Math.sin(sunAngle),0,1);
  return daylight;
 }
 function setSky(){
  const light=sunshine();
  const haze=weather===2?.78:weather===1?.9:1;
  const d=light*haze;
  if(scene.background?.setRGB)scene.background.setRGB(.055+.65*d,.082+.73*d,.15+.69*d);
  if(scene.fog?.color?.setRGB)scene.fog.color.setRGB(.07+.63*d,.09+.66*d,.15+.65*d);
  if(sun){sun.intensity=.22+2.6*d;sun.position.set(Math.cos(gameHour*Math.PI/12)*85,14+75*light,42);}
  if(ambient)ambient.intensity=.40+1.6*d;
  rain.visible=weather===2;
  for(const l of lamps){
   const state=getSignal(l.axis,l.junction.x,l.junction.z);
   const active=state==='red'?0:state==='yellow'?1:2;
   for(let i=0;i<3;i++)l.spheres[i].material=l.colors[i][i===active?0:1];
  }
  return d;
 }
 function timeLabel(){
  const hh=Math.floor(gameHour),mm=Math.floor(gameHour%1*60);
  return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
 }
 function hud(){
  const d=sunshine();
  ui.time.textContent='🕒 '+timeLabel()+(d<.22?' • ليل':' • نهار');
  ui.weather.textContent=(weather===2?'🌧️ ':weather===1?'☁️ ':'☀️ ')+WEATHER[weather];
  ui.fines.textContent='🚦 مخالفات: '+fines+' • إشارات: '+(getSignal('z',0,0)==='green'?'شغالة':'متغيرة');
  ui.weatherBtn.textContent='غيّر الطقس';
  ui.nightBtn.textContent=d<.2?'☀️ جرّب النهار':'🌙 جرّب الليل';
 }
 function switchNight(){
  gameHour=sunshine()>.2?21:11;
  setSky();hud();save();
 }
 function switchWeather(){
  weather=(weather+1)%WEATHER.length;
  weatherSince=0;setSky();hud();save();
  notify('الطقس دلوقتي: '+WEATHER[weather]+(weather===2?' — الطريق هيبقى أزلق.':''));
 }
 function fine(reason,amount,key=''){
  if(secs-lastFine<6||key&&seenRed.has(key))return false;
  if(key){seenRed.add(key);if(seenRed.size>140)seenRed.clear();}
  lastFine=secs;fines++;
  const paid=charge(amount);
  notify('🚦 '+reason+(paid?' • غرامة '+amount+' جنيه داخل اللعبة':' • عليك غرامة غير مسددة'));
  save();hud();return true;
 }
 function observeDriving(before,after){
  if(!isDriving())return false;
  const speed=Math.abs(getSpeed())*3.6;
  if(speed<7)return false;
  for(const j of LIGHT_JUNCTIONS){
   if(Math.abs(after.z-j.z)<5.5&&Math.abs(before.z-j.z)<5.5&&
     (before.x-j.x)*(after.x-j.x)<=0&&Math.abs(after.x-before.x)>.015){
      if(getSignal('x',j.x,j.z)==='red')return fine('عدّيت إشارة حمرا',75,'x'+j.x+':'+j.z);
   }
   if(Math.abs(after.x-j.x)<5.5&&Math.abs(before.x-j.x)<5.5&&
     (before.z-j.z)*(after.z-j.z)<=0&&Math.abs(after.z-before.z)>.015){
      if(getSignal('z',j.x,j.z)==='red')return fine('عدّيت إشارة حمرا',75,'z'+j.x+':'+j.z);
   }
  }
  if(speed>103&&secs-lastSpeedFine>45){
   lastSpeedFine=secs;return fine('السرعة أعلى من الحد داخل وسط البلد',35);
  }
  return false;
 }
 function update(dt,t,focus){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.06);
  secs+=dt;signalSecs+=dt;weatherSince+=dt;envClock+=dt;uiClock+=dt;
  gameHour=(gameHour+dt/55)%24; // one in-game day lasts around 22 real minutes.
  if(weatherSince>270){weather=(weather+1)%3;weatherSince=0;save();}
  if(envClock>.18){envClock=0;setSky();}
  if(uiClock>.30){uiClock=0;hud();}
  if(weather===2&&focus){
   for(let i=0;i<drops.length;i++){
    const d=drops[i],f=d.userData;
    const y=(f.seedY*12-secs*13+i*.092)%12;
    d.position.set(focus.x+f.seedX+Math.sin(secs*.4+i)*1.3,Math.max(.2,((y+24)%12)),focus.z+f.seedZ);
   }
  }
  if((Math.floor(secs)%11)===0&&secs%11<dt)save();
 }
 ui.nightBtn.onclick=switchNight;ui.weatherBtn.onclick=switchWeather;
 setSky();hud();
 return {update,getSignal,trafficMustBrake,observeDriving,switchNight,switchWeather,
   grip:()=>weather===2?.76:weather===1?.94:1,
   illumination:()=>sunshine(),
   getState:()=>({hour:gameHour,weather:WEATHER[weather],fines,signals:LIGHT_JUNCTIONS.length,time:timeLabel()})};
}
