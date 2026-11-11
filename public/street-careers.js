// Egypt Street: persistent in-game employment, applications and paid shifts.
// No accounts, personal information or backend required. Works offline in browser.
export const JOBS = [
 {id:'taxi',name:'سواق تاكسي',icon:'🚕',salary:420,mode:'drive',
  description:'استلم ركاب ووصّلهم لمشاويرهم في القاهرة.',
  stops:[[-60,30,'اركب الراكب'],[30,60,'وصّل الراكب'],[60,-30,'اركب الراكب'],[-30,-60,'وصل المشوار']]},
 {id:'courier',name:'مندوب توصيل',icon:'📦',salary:340,mode:'either',
  description:'وصّل ثلاث طلبات لمحلات وأهالي الحي.',
  stops:[[0,60,'سلّم الطلب الأول'],[-60,-30,'سلّم الطلب التاني'],[60,30,'سلّم الطلب التالت']]},
 {id:'microbus',name:'سواق ميكروباص',icon:'🚌',salary:390,mode:'drive',
  description:'امشِ على الخط وقف في كل محطة وانت سايق.',
  stops:[[-30,60,'محطة ١'],[-60,0,'محطة ٢'],[0,-60,'محطة ٣'],[60,0,'محطة النهاية']]},
 {id:'mechanic',name:'مساعد ميكانيكي',icon:'🔧',salary:300,mode:'foot',
  description:'انزل وصلّح أعطال العربيات عند 3 نقط.',
  stops:[[0,30,'افحص العطل'],[60,60,'غيّر الجزء التالف'],[-30,-30,'خلص الصيانة']]},
 {id:'cafe',name:'عامل قهوة',icon:'☕',salary:240,mode:'foot',
  description:'انقل طلبات الزباين للمحلات القريبة.',
  stops:[[30,0,'سلّم الشاي'],[-30,0,'سلّم القهوة'],[0,-30,'وصل الحساب']]}
];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const STORAGE_KEY='egypt-street-careers-v1';
export function createCareerSystem({
 T,scene,ui,getPosition,isDriving,getSpeed,onReward,notify,storage
}){
 const cards=ui.cards||{};
 let saved={};
 try{saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'{}')||{}}catch(e){}
 const hired=new Set(Array.isArray(saved.hired)?saved.hired.filter(id=>JOBS.some(j=>j.id===id)):[]);
 let earned=Number.isFinite(saved.earned)&&saved.earned>=0?Math.min(1e7,saved.earned):0;
 let shifts=Number.isFinite(saved.shifts)&&saved.shifts>=0?Math.min(100000,saved.shifts):0;
 let active=null,elapsed=0;
 const green=new T.MeshBasicMaterial({color:0x76f2b9,transparent:true,opacity:.9}),
       light=new T.MeshBasicMaterial({color:0xfdf5b6});
 const marker=new T.Group();
 const ring=new T.Mesh(new T.TorusGeometry(1.65,.13,6,20),green);
 ring.rotation.x=Math.PI/2;ring.position.y=.2;marker.add(ring);
 const orb=new T.Mesh(new T.SphereGeometry(.25,9,8),light);
 orb.position.y=3.4;marker.add(orb);
 const beam=new T.Mesh(new T.CylinderGeometry(.08,.13,2.8,7),green);
 beam.position.y=1.7;marker.add(beam);
 marker.visible=false;scene.add(marker);
 function persist(){
  try{storage?.setItem(STORAGE_KEY,JSON.stringify({hired:[...hired],earned,shifts}))}catch(e){}
 }
 function job(){return active?JOBS.find(j=>j.id===active.jobId):null;}
 function waypoint(){
  const j=job();if(!j||!active||active.step>=j.stops.length)return null;
  const [x,z]=j.stops[active.step];
  return {x,z,label:j.stops[active.step][2],job:j.name};
 }
 function setVisible(show){
  ui.panel.style.display=show?'block':'none';
 }
 function render(){
  ui.summary.textContent='وظايف مقبول فيها: '+hired.size+' • ورديات خلصتها: '+shifts+
    ' • فلوس الشغل: '+earned+' ج.م';
  for(const j of JOBS){
   const button=cards[j.id];if(!button)continue;
   if(active?.jobId===j.id){
    button.textContent='الوردية شغالة ✓';
    button.disabled=true;
   }else if(active){
    button.textContent=hired.has(j.id)?'مقبول — خلّص ورديتك':'قدّم بعد الوردية';
    button.disabled=true;
   }else if(!hired.has(j.id)){
    button.textContent='قدّم على الشغل';
    button.disabled=false;
   }else{
    button.textContent='ابدأ وردية';
    button.disabled=false;
   }
  }
  ui.cancel.style.display=active?'block':'none';
  ui.hud.style.display=active?'block':'none';
  if(active){
   const j=job(),stop=j.stops[active.step];
   ui.hudTitle.textContent=j.icon+' '+j.name+' — وردية';
   ui.hudText.textContent='المهمة '+(active.step+1)+' من '+j.stops.length+
      ' • '+stop[2]+' • مكافأة الوردية '+j.salary+' جنيه';
  }
 }
 function apply(id){
  const j=JOBS.find(j=>j.id===id);
  if(!j)return false;
  if(active){
   notify('خلص ورديتك الحالية الأول قبل شغل جديد.');
   return false;
  }
  if(!hired.has(id)){
   hired.add(id);persist();render();
   notify('🎉 مبروك! اتقبلت في شغل '+j.name+'. اضغط «ابدأ وردية» عشان تشتغل.');
   return true;
  }
  active={jobId:id,step:0};
  setVisible(false);render();
  notify('بدأت وردية '+j.name+'! روح للنقطة الخضرا على الخريطة.');
  return true;
 }
 function cancel(){
  if(!active)return;
  const j=job();active=null;render();
  notify('وقفت وردية '+j.name+' — تقدر تبدأ واحدة جديدة من قائمة الشغل.');
 }
 function complete(){
  const j=job();if(!j)return false;
  earned+=j.salary;shifts++;
  onReward(j.salary,j);
  active=null;persist();render();
  notify('✅ خلّصت وردية '+j.name+' وكسبت '+j.salary+' جنيه! مجموع وردياتك: '+shifts);
  return true;
 }
 function next(){
  if(!active)return false;
  const j=job();
  const [x,z,label]=j.stops[active.step];
  active.step++;
  if(active.step>=j.stops.length)return complete();
  notify('تمام! '+label+' ✓ — روح لمكان المهمة اللي بعدها.');
  render();return true;
 }
 function interact(){
  if(!active)return false;
  const j=job(),p=waypoint();
  if(j.mode!=='foot'||!p||isDriving()||dist(getPosition(),p)>4.9)return false;
  next();return true;
 }
 function update(dt,t){
  if(!active){marker.visible=false;ui.action.style.display='none';return;}
  elapsed+=Math.max(0,dt);
  const j=job(),p=waypoint();
  if(!j||!p){marker.visible=false;return}
  marker.visible=true;marker.position.set(p.x,Math.sin(t*.0022)*.13,p.z);
  const d=dist(getPosition(),p),near=d<6.4;
  if(j.mode==='foot'){
   const canAct=near&&!isDriving();
   ui.action.style.display=canAct?'block':'none';
   ui.action.textContent='🔧 '+p.label;
  }else{
   ui.action.style.display='none';
   const canProgress=near&&(j.mode==='either'||isDriving())&&
     (!isDriving()||Math.abs(getSpeed())<4.0);
   if(canProgress){
    next();
    elapsed=0;
   }
  }
 }
 ui.open.onclick=()=>{render();setVisible(ui.panel.style.display!=='block')};
 ui.close.onclick=()=>setVisible(false);
 ui.cancel.onclick=cancel;
 ui.action.onclick=()=>interact();
 for(const j of JOBS)if(cards[j.id])cards[j.id].onclick=()=>apply(j.id);
 render();
 return {
  apply,cancel,interact,update,waypoint,
  getStats:()=>({hired:[...hired],earned,shifts,active:active?{...active}:null}),
  getJobs:()=>JOBS,close:()=>setVisible(false)
 };
}
