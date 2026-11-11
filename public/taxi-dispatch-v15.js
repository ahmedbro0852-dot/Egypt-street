// Egypt Streets V15 — passenger pickup and fare simulation, stored locally.
export const V15_RIDES=[
 {from:{x:0,z:60},to:{x:60,z:0},name:'رمسيس — التحرير',start:'رمسيس',end:'التحرير',fare:145},
 {from:{x:-30,z:0},to:{x:60,z:60},name:'وسط البلد — المعادي',start:'وسط البلد',end:'المعادي',fare:170},
 {from:{x:94,z:0},to:{x:0,z:-60},name:'الكورنيش — مصر القديمة',start:'الكورنيش',end:'مصر القديمة',fare:195},
 {from:{x:-60,z:-60},to:{x:0,z:30},name:'مصر القديمة — القهوة',start:'مصر القديمة',end:'القهوة',fare:155},
 {from:{x:30,z:60},to:{x:-60,z:0},name:'المعادي — رمسيس',start:'المعادي',end:'رمسيس',fare:185}
];
const KEY='egypt-streets-rides-v15';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createTaxiDispatchV15({T,scene,storage,ui,getCar,getSpeed,isDriving,getVehicle,navigate,onReward,notify,onChange=()=>{}}){
 let trips=0,earned=0,active=null,dwell=0;
 try{
  const s=JSON.parse(storage?.getItem(KEY)||'null');
  if(s){
   trips=Number.isFinite(s.trips)?Math.max(0,s.trips):0;
   earned=Number.isFinite(s.earned)?Math.max(0,s.earned):0;
   if(Number.isInteger(s.active?.index)&&V15_RIDES[s.active.index]&&['pickup','dropoff'].includes(s.active.stage))
    active={index:s.active.index,stage:s.active.stage};
  }
 }catch(e){}
 const amber=new T.MeshBasicMaterial({color:0xffce73,transparent:true,opacity:.82});
 const marker=new T.Group();
 const ring=new T.Mesh(new T.TorusGeometry(1.7,.13,6,20),amber);
 ring.rotation.x=Math.PI/2;ring.position.y=.2;marker.add(ring);
 const orb=new T.Mesh(new T.SphereGeometry(.25,8,7),amber);orb.position.y=3.25;marker.add(orb);
 const beam=new T.Mesh(new T.CylinderGeometry(.08,.09,2.8,7),amber);beam.position.y=1.65;marker.add(beam);
 scene.add(marker);
 const passenger=new T.Group();
 const skin=new T.MeshLambertMaterial({color:0xa17a58}),shirt=new T.MeshLambertMaterial({color:0x468177}),pants=new T.MeshLambertMaterial({color:0x37444d});
 function part(g,m,x,y,z){
  const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);passenger.add(mesh);
 }
 part(new T.CylinderGeometry(.23,.26,.7,7),shirt,0,1.13,0);
 part(new T.SphereGeometry(.19,8,6),skin,0,1.63,0);
 for(const x of [-.12,.12])part(new T.CylinderGeometry(.09,.09,.65,7),pants,x,.42,0);
 scene.add(passenger);
 let passengerVehicle=null;
 const getRide=()=>active?V15_RIDES[active.index]:null;
 const getPoint=()=>{const r=getRide();return r?(active.stage==='pickup'?r.from:r.to):null};
 function save(){try{storage?.setItem(KEY,JSON.stringify({trips,earned,active}))}catch(e){}}
 function passengerToScene(){
  if(passengerVehicle){passengerVehicle.remove(passenger);passengerVehicle=null}
  if(passenger.parent!==scene)scene.add(passenger);
 }
 function visual(){
  const p=getPoint();marker.visible=!!p;
  if(!p){passengerToScene();passenger.visible=false;return}
  marker.position.set(p.x,.05,p.z);
  if(active.stage==='pickup'){
   passengerToScene();passenger.visible=true;passenger.position.set(p.x+5.4,0,p.z+5.4);
  }else{
   const v=getVehicle();
   if(v){
    passengerToScene();v.add(passenger);passengerVehicle=v;
    passenger.position.set(.36,.12,-.20);passenger.visible=true;
   }else{passengerToScene();passenger.visible=false}
  }
 }
 function hud(){
  const r=getRide();
  ui.start.disabled=!!r;
  ui.start.textContent=r?'🚕 مشوار شغال':'🚕 ابدأ مشوار راكب';
  ui.counter.textContent='مشاوير: '+trips+' • أجور: '+Math.round(earned)+' جنيه';
  ui.hud.style.display=r?'block':'none';
  ui.cancel.style.display=r?'block':'none';
  ui.title.textContent=r?(active.stage==='pickup'?'📍 اركب الراكب: '+r.start:'✅ وصّل الراكب: '+r.end):'🚕 مشاوير التاكسي';
  ui.text.textContent=r?'وقف عند العلامة وأنت سايق عشان '+(active.stage==='pickup'?'الراكب يركب':'توصّله وتاخد '+r.fare+' جنيه'):'استلم راكب ووصّله بالأجرة، والمشوار بيتحفظ.';
 }
 function nav(){const p=getPoint();if(p)navigate(p,active.stage==='pickup'?'استلام راكب':'توصيل راكب')}
 function start(){
  if(active){notify('عندك مشوار شغال.');return false}
  active={index:trips%V15_RIDES.length,stage:'pickup'};
  dwell=0;save();visual();hud();nav();onChange();
  notify('📞 راكب مستني عند '+getRide().start+' — اتجه للعلامة وقف.');return true;
 }
 function cancel(){
  if(!active)return false;
  active=null;dwell=0;save();visual();hud();onChange();notify('اتلغى المشوار من غير غرامة.');return true;
 }
 function update(dt){
  const r=getRide();if(!r)return;
  const near=isDriving()&&dist(getCar(),getPoint())<5.5&&Math.abs(getSpeed())<.95;
  dwell=near?dwell+Math.max(0,Math.min(.1,dt)):Math.max(0,dwell-dt*2.5);
  if(dwell<.75)return;
  dwell=0;
  if(active.stage==='pickup'){
   active.stage='dropoff';save();visual();hud();nav();onChange();
   notify('✅ الراكب ركب! روح '+r.end+' وخد '+r.fare+' جنيه.');
  }else{
   const fare=r.fare;
   trips++;earned+=fare;active=null;save();visual();hud();
   onReward(fare);onChange();notify('🎉 المشوار خلص! +'+fare+' جنيه • مشاويرك '+trips);
  }
 }
 function restore(data){
  if(data&&typeof data==='object'){
   if(Number.isFinite(data.trips))trips=Math.max(trips,data.trips);
   if(Number.isFinite(data.earned))earned=Math.max(earned,data.earned);
   if(V15_RIDES[data.active?.index]&&['pickup','dropoff'].includes(data.active.stage))
    active={index:data.active.index,stage:data.active.stage};
   save();
  }
  visual();hud();return true;
 }
 ui.start.onclick=start;ui.cancel.onclick=cancel;
 visual();hud();
 return {start,cancel,update,restore,routeToCurrent:nav,getPoint,getRide,getState:()=>({trips,earned,active:active?{...active}:null})};
}
