// Egypt Streets V8 — real in-game garage, vehicle ownership and performance upgrades.
// Local-only game currency; no external purchases or personal data.
const KEY='egypt-streets-garage-v8';
const LIMIT=(v,a,b)=>Math.max(a,Math.min(b,v));
export const VEHICLES_V8=[
 {id:'taxi',name:'تاكسي القاهرة',icon:'🚕',price:0,top:50,engine:1.1,brake:1.16,grip:1.06,steer:1,
  description:'عربيتك الأساسية، عملية وثابتة في شوارع وسط البلد.'},
 {id:'sedan',name:'سيدان عائلية',icon:'🚙',price:550,top:37,engine:.96,brake:1.09,grip:1.07,steer:1.07,
  description:'أهدى في السواقة وفرامل أقوى وثبات أحسن.'},
 {id:'sport',name:'كوبيه رياضية',icon:'🏎️',price:1800,top:49,engine:1.34,brake:1.13,grip:1.06,steer:1.08,
  description:'تسارع أعلى وسرعة قصوى أكبر، بس محتاجة حذر في الملفات.'},
 {id:'motorbike',name:'موتوسيكل مصري',icon:'🏍️',price:900,top:44,engine:1.20,brake:.89,grip:.89,steer:1.20,
  description:'خفيف وسريع الاستجابة، وبيحتاج فرامل بدري في المطر.'}
];
export const UPGRADES_V8={
 engine:{icon:'⚡',name:'تطوير الموتور',prices:[180,350,650],description:'تسارع أقوى وسرعة أعلى.'},
 brakes:{icon:'🛑',name:'تطوير الفرامل',prices:[140,280,520],description:'قوة توقف أفضل.'},
 tyres:{icon:'🛞',name:'إطارات وثبات',prices:[160,330,580],description:'تماسك وتوجيه أدق.'}
};
export function createGarageV8({ui,storage,getMoney,charge,isDriving,notify,onSelect,onChanged}){
 let saved={};
 try{saved=JSON.parse(storage?.getItem(KEY)||'{}')||{}}catch(e){}
 const ids=new Set(VEHICLES_V8.map(v=>v.id));
 const owned=new Set(['taxi',...(Array.isArray(saved.owned)?saved.owned.filter(v=>ids.has(v)):[])]);
 let selected=owned.has(saved.selected)?saved.selected:'taxi';
 let upgrades={engine:0,brakes:0,tyres:0};
 if(saved.upgrades)for(const k of Object.keys(upgrades)){
  const n=saved.upgrades[k];
  upgrades[k]=Number.isFinite(n)?LIMIT(Math.floor(n),0,3):0;
 }
 function persist(){
  try{storage?.setItem(KEY,JSON.stringify({selected,owned:[...owned],upgrades}))}catch(e){}
 }
 function vehicle(){return VEHICLES_V8.find(v=>v.id===selected)||VEHICLES_V8[0]}
 function getTuning(){
  const v=vehicle();
  return {
   topSpeed:v.top+upgrades.engine*1.4,
   engineScale:v.engine*(1+upgrades.engine*.095),
   brakeScale:v.brake*(1+upgrades.brakes*.12),
   steerScale:v.steer*(1+upgrades.tyres*.025),
   gripScale:Math.min(1.25,v.grip*(1+upgrades.tyres*.048))
  };
 }
 function render(){
  const v=vehicle(),t=getTuning();
  ui.title.textContent=v.icon+' '+v.name;
  ui.stats.textContent='السرعة القصوى '+Math.round(t.topSpeed*3.6)+' كم/س • '+
   'التسارع '+(t.engineScale*100).toFixed(0)+'% • الفرامل '+(t.brakeScale*100).toFixed(0)+'%';
  ui.balance.textContent='رصيدك: '+Math.round(getMoney())+' جنيه';
  for(const car of VEHICLES_V8){
   const button=ui.cars[car.id];
   if(!button)continue;
   button.textContent=car.id===selected?'✓ مركبتك الحالية':
    owned.has(car.id)?'اختار '+car.name:'اشتري '+car.name+' • '+car.price+' ج.م';
   button.disabled=car.id===selected;
  }
  for(const [k,obj] of Object.entries(UPGRADES_V8)){
   const button=ui.upgrades[k],level=upgrades[k];
   if(!button)continue;
   button.textContent=level>=3?obj.icon+' '+obj.name+' • أقصى مستوى ✓':
    obj.icon+' '+obj.name+' '+(level+1)+'/3 • '+obj.prices[level]+' جنيه';
   button.disabled=level>=3;
  }
 }
 function select(id,silent=false){
  const v=VEHICLES_V8.find(c=>c.id===id);
  if(!v)return false;
  if(isDriving()){
   if(!silent)notify('لازم تنزل من العربية قبل ما تغيّر المركبة أو تشتري.');
   return false;
  }
  if(!owned.has(id)){
   if(!charge(v.price)){
    if(!silent)notify('معاك فلوس أقل من ثمن '+v.name+'. اشتغل في مهمات الأول.');
    render();return false;
   }
   owned.add(id);
  }
  selected=id;
  persist();render();
  onSelect(id,v);
  onChanged?.();
  if(!silent)notify('✅ بقيت تمتلك '+v.name+' — تقدر تركبها دلوقتي.');
  return true;
 }
 function upgrade(kind){
  const obj=UPGRADES_V8[kind];
  if(!obj||isDriving()){
   notify('انزل من العربية وافتح الجراج عشان تطوّرها.');
   return false;
  }
  const level=upgrades[kind];
  if(level>=3){notify('التطوير ده وصل لأقصى مستوى.');return false}
  const cost=obj.prices[level];
  if(!charge(cost)){notify('محتاج '+cost+' جنيه للتطوير ده.');return false}
  upgrades[kind]++;
  persist();render();onChanged?.();
  notify('✅ '+obj.name+' بقى مستوى '+upgrades[kind]+' — تأثيره شغال على سواقتك.');
  return true;
 }
 function open(){
  render();ui.panel.style.display=ui.panel.style.display==='block'?'none':'block';
 }
 ui.open.onclick=open;
 ui.close.onclick=()=>ui.panel.style.display='none';
 for(const car of VEHICLES_V8)if(ui.cars[car.id])ui.cars[car.id].onclick=()=>select(car.id);
 for(const kind of Object.keys(UPGRADES_V8))if(ui.upgrades[kind])ui.upgrades[kind].onclick=()=>upgrade(kind);
 render();
 return {select,upgrade,getTuning,getVehicle:vehicle,getState:()=>({selected,owned:[...owned],upgrades:{...upgrades}}),render};
}
