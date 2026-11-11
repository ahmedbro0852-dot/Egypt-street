// Egypt Streets V34: handbrake drift combos, skid marks and saved records.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const KEY='egypt-streets-drift-v34';
export function driftQualityV34({speed=0,lateralSpeed=0,yawRate=0,driftAngle=0,holding=false}={}){
 const v=Math.abs(speed),angle=Math.abs(driftAngle||Math.atan2(lateralSpeed,Math.max(v,1.8)));
 if(!holding||v<7.5||angle<.10||Math.abs(yawRate)<.12)return 0;
 return clamp(((angle-.10)*3+Math.abs(yawRate)*.34)*(v/18),0,1.8);
}
export function createDriftV34({T,scene,storage,ui={},notify=()=>{},fresh=false}={}){
 if(fresh){try{storage?.removeItem(KEY)}catch(e){}}
 let records={total:0,best:0,chains:0,bestRace:0},chain=0,activeTime=0,grace=0,
  lastUiAt=-Infinity,lastMarkAt=-Infinity,marked=0,markIndex=0,lastMode='';
 try{const old=JSON.parse(storage?.getItem(KEY)||'null');if(old&&typeof old==='object'){
  for(const key of Object.keys(records))if(Number.isFinite(old[key]))
   records[key]=clamp(Math.round(old[key]),0,1e8);
 }}catch(e){}
 function save(){try{storage?.setItem(KEY,JSON.stringify(records))}catch(e){}}
 const marks=[],group=T&&scene?new T.Group():null;
 if(group){
  const geometry=new T.BoxGeometry(.19,.012,.80);
  const material=new T.MeshBasicMaterial({color:0x162126,opacity:.45,transparent:true,depthWrite:false});
  for(let i=0;i<64;i++){const m=new T.Mesh(geometry,material);m.visible=false;group.add(m);marks.push(m)}
  scene.add(group);group.visible=false;
 }
 function addTracks(car,t,kind){
  if(!group||t-lastMarkAt<130)return;
  lastMarkAt=t;const width=kind==='motorbike'?.16:kind==='sport'?.88:.76;
  const yaw=car.yaw||0,s=Math.sin(yaw),c=Math.cos(yaw),
   x=car.x-s*1.26,z=car.z-c*1.26;
  for(const side of [-1,1]){
   const m=marks[markIndex++%marks.length];
   m.position.set(x+c*width*side,.16,z-s*width*side);
   m.rotation.y=yaw;m.visible=true;marked++;
  }
 }
 function bank(racing){
  const points=Math.round(chain);
  if(points>=8){
   records.total+=points;records.best=Math.max(records.best,points);
   if(racing)records.bestRace=Math.max(records.bestRace,points);
   records.chains++;save();
   if(points>=150)notify('🔥 درفت ممتاز! '+points+' نقطة');
  }
  chain=0;activeTime=0;grace=0;
 }
 function show(driving,quality,racing){
  if(ui.hud){ui.hud.hidden=!driving;ui.hud.dataset.drifting=quality>0?'true':'false'}
  if(ui.score)ui.score.textContent=(quality>0?'🔥 درفت ':'🏁 نقاط الدرفت ')+Math.round(chain);
  if(ui.info)ui.info.textContent='أفضل سلسلة: '+records.best+' • الإجمالي: '+records.total+(racing?' • 🏎️ سباق':'');
  if(ui.pedal)ui.pedal.setAttribute?.('aria-pressed',quality>0?'true':'false');
 }
 function update({vehicle,dt=1/60,t=0,holding=false,driving=false,paused=false,
                  racing=false,vehicleType='taxi'}={}){
  const delta=clamp(Number.isFinite(dt)?dt:0,0,.05),mode=racing?'race':'city';
  if(lastMode&&lastMode!==mode&&chain>0)bank(lastMode==='race');
  lastMode=mode;
  if(group)group.visible=driving;
  const quality=driving&&!paused?driftQualityV34({...vehicle,holding}):0;
  if(quality>0){
   chain+=delta*(35+Math.abs(vehicle.speed||0)*1.7)*quality*(1+Math.min(1.75,activeTime/7));
   activeTime+=delta;grace=0;addTracks(vehicle,t,vehicleType);
  }else if(chain>0){
   grace+=delta;if(!driving||paused||grace>.85)bank(racing);
  }
  if(t-lastUiAt>120||!driving){show(driving,quality,racing);lastUiAt=t}
  return {quality,chain:Math.round(chain),record:records.best,active:quality>0,marks:marked};
 }
 function reset(){bank(lastMode==='race');for(const m of marks)m.visible=false;
  marked=0;markIndex=0;lastMode='';if(group)group.visible=false;show(false,0,false)}
 show(false,0,false);
 return {update,reset,getState:()=>({...records,chain:Math.round(chain)}),getMarkCount:()=>marked};
}
