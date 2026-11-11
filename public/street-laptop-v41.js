// Egypt Streets V41 — interactive street laptop, used inside the 3D world.
// A real scene prop + an offline desktop UI. No external network or paid services.
const LAPTOP_POSITION_V41={x:-4,z:1};
const NOTE_KEY_V41='egypt-streets-laptop-notes-v41';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const safeText=(x)=>String(x??'').slice(0,120);
export function createStreetLaptopV41({
 T,scene,storage=null,document=globalThis.document,
 getPlayer=()=>({x:0,z:12}),getActive=()=>false,
 isDriving=()=>false,isPaused=()=>false,isRacing=()=>false,
 getStatus=()=>({}),notify=()=>{},onOpen=()=>{},fresh=false
}={}){
 if(fresh)try{storage?.removeItem(NOTE_KEY_V41)}catch(e){}
 const position={...LAPTOP_POSITION_V41};const reach=4.3;
 const group=new T.Group();scene.add(group);
 group.position.set(position.x,0,position.z);group.rotation.y=0;
 const materials={
  desk:new T.MeshStandardMaterial({color:0x695649,roughness:.82}),
  leg:new T.MeshStandardMaterial({color:0x343d46,metalness:.55,roughness:.45}),
  body:new T.MeshStandardMaterial({color:0x252f3a,metalness:.5,roughness:.36}),
  keys:new T.MeshStandardMaterial({color:0x101c25,roughness:.78}),
  screen:new T.MeshBasicMaterial({color:0x153943}),
  glow:new T.MeshBasicMaterial({color:0x3ed8c0}),
  soft:new T.MeshBasicMaterial({color:0x6fd4cf}),
  white:new T.MeshBasicMaterial({color:0xd9efe9}),
  amber:new T.MeshBasicMaterial({color:0xeabb74})
 };
 function cube(w,h,d,x,y,z,m,container=group){
  const obj=new T.Mesh(new T.BoxGeometry(w,h,d),m);
  obj.position.set(x,y,z);container.add(obj);return obj;
 }
 cube(3.4,.15,2.1,0,1.04,0,materials.desk);
 for(const x of [-1.42,1.42])for(const z of [-.77,.77])
  cube(.16,1.0,.16,x,.53,z,materials.leg);
 const notebook=new T.Group();group.add(notebook);
 notebook.position.set(0,1.16,0);
 cube(1.87,.12,1.26,0,.02,.20,materials.body,notebook);
 cube(1.63,.02,.97,0,.087,.15,materials.keys,notebook);
 // Simple keyboard grid, pooled dark keycaps. No image downloads.
 for(let row=0;row<4;row++)for(let col=0;col<12;col++)
  cube(.102,.012,.13,-.66+col*.12,.105,-.17+row*.19,materials.body,notebook);
 cube(.58,.007,.30,0,.114,.59,materials.leg,notebook);
 cube(1.92,1.20,.09,0,.77,-.46,materials.body,notebook);
 cube(1.70,.96,.024,0,.76,-.393,materials.screen,notebook);
 // Geometric fake desktop visible in the 3D model.
 cube(1.60,.10,.026,0,1.15,-.370,materials.glow,notebook);
 cube(.55,.12,.027,-.40,.83,-.370,materials.soft,notebook);
 cube(.45,.12,.027,.36,.83,-.370,materials.amber,notebook);
 cube(1.36,.028,.028,0,.44,-.368,materials.white,notebook);
 cube(.16,.16,.027,-.52,.64,-.365,materials.soft,notebook);
 cube(.16,.16,.027,-.26,.64,-.365,materials.amber,notebook);
 cube(.16,.16,.027,0,.64,-.365,materials.white,notebook);
 cube(.13,.035,.035,0,1.245,-.45,materials.glow,notebook);
 // Place marker above the desk, readable even on a low-resolution phone.
 const beacon=new T.Mesh(new T.SphereGeometry(.18,10,8),
   new T.MeshBasicMaterial({color:0x6cf8e1,transparent:true,opacity:.85}));
 beacon.position.set(0,3.12,0);group.add(beacon);
 const style=document.createElement('style');
 style.textContent=`
 #v41LaptopNear{position:fixed;z-index:62;left:50%;bottom:135px;
 transform:translateX(-50%);background:#132e39eb;color:#e6ffea;
 border:1px solid #74e8c9;border-radius:12px;padding:10px 15px;
 font:bold 13px Tahoma,Arial;box-shadow:0 7px 27px #0009;
 min-height:43px;touch-action:manipulation}
 #v41LaptopNear[hidden],#v41LaptopPanel[hidden]{display:none!important}
 #v41LaptopPanel{position:fixed;inset:0;z-index:300;display:grid;place-items:center;
 background:#07151bd9;direction:rtl;touch-action:auto}
 #v41LaptopShell{width:min(760px,95vw);height:min(500px,85dvh);
 background:linear-gradient(140deg,#183b46,#08242d);
 border:8px solid #293a44;border-bottom:16px solid #41464d;border-radius:19px;
 box-shadow:0 26px 100px #000f;overflow:hidden;display:flex;flex-direction:column;
 font:13px Tahoma,Arial;color:#dff9f4}
 #v41LaptopBar{display:flex;align-items:center;justify-content:space-between;
 padding:11px 14px;background:#102d38;border-bottom:1px solid #518b8d}
 #v41LaptopBar strong{font-size:15px;color:#a7ffdd}
 #v41LaptopClose{background:#86413d;color:#fff;border:1px solid #f5a293;
 border-radius:8px;padding:7px 13px;font-weight:bold}
 #v41LaptopTabs{display:flex;gap:6px;flex-wrap:wrap;padding:10px;
 background:#153945;border-bottom:1px solid #376779}
 #v41LaptopTabs button{background:#294d58;border:1px solid #50808d;color:#edf9f0;
 border-radius:8px;padding:7px 10px;min-height:35px}
 #v41LaptopTabs button[aria-selected="true"]{background:#287966;border-color:#8ef0cc}
 #v41LaptopBody{flex:1;overflow-y:auto;padding:17px;line-height:1.9}
 #v41LaptopBody h3{font-size:18px;color:#ffdf95;margin:0 0 11px}
 #v41LaptopBody p{margin:7px 0;color:#deeee9}
 #v41LaptopBody .v41Card{padding:12px;margin:9px 0;background:#17414b;
 border:1px solid #386778;border-radius:10px}
 #v41LaptopNote{display:block;width:100%;height:155px;resize:vertical;
 background:#102631;color:#ebfbea;border:1px solid #65a69a;border-radius:10px;
 padding:12px;font:13px Tahoma,Arial;direction:rtl}
 #v41LaptopSave{margin-top:11px;background:#3c947b;color:white;padding:9px 17px;
 border-radius:9px;border:1px solid #a3e8c9}
 #v41LaptopFoot{border-top:1px solid #436d75;padding:7px 14px;
 font-size:10px;color:#c4d9d6}
 @media(max-width:760px){#v41LaptopShell{height:min(550px,85dvh);width:97vw}
 #v41LaptopNear{bottom:128px;font-size:12px;padding:9px 12px}
 #v41LaptopBody{padding:10px}#v41LaptopTabs{padding:7px;gap:4px}
 #v41LaptopTabs button{font-size:11px;padding:6px 8px}}
 `;
 document.head.append(style);
 const nearButton=document.createElement('button');
 nearButton.id='v41LaptopNear';nearButton.type='button';
 nearButton.textContent='💻 افتح اللابتوب';nearButton.hidden=true;
 document.body.append(nearButton);
 const overlay=document.createElement('section');
 overlay.id='v41LaptopPanel';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','لابتوب شوارع مصر');
 overlay.setAttribute('aria-modal','true');
 document.body.append(overlay);
 const shell=document.createElement('div');shell.id='v41LaptopShell';overlay.append(shell);
 const bar=document.createElement('header');bar.id='v41LaptopBar';shell.append(bar);
 const title=document.createElement('strong');title.textContent='💻 EgyptOS • لابتوب شوارع مصر';bar.append(title);
 const closeButton=document.createElement('button');closeButton.id='v41LaptopClose';closeButton.type='button';
 closeButton.textContent='✕ إغلاق';bar.append(closeButton);
 const tabs=document.createElement('nav');tabs.id='v41LaptopTabs';shell.append(tabs);
 const body=document.createElement('main');body.id='v41LaptopBody';shell.append(body);
 const footer=document.createElement('footer');footer.id='v41LaptopFoot';
 footer.textContent='لابتوب داخل اللعبة • يعمل بدون إنترنت • زر L للفتح والإغلاق';
 shell.append(footer);
 let open=false,currentTab='home',wasNear=false,lastNearAt=-Infinity;
 const views=[['home','🏠 الرئيسية'],['jobs','📦 المهمات'],['cars','🚗 الجراج'],
   ['races','🏁 السباقات'],['notes','📝 الملاحظات']];
 const tabButtons=new Map();
 function el(tag,text,parent,klass=''){
  const n=document.createElement(tag);
  if(klass)n.className=klass;
  if(text!=null)n.textContent=String(text);
  parent.append(n);return n;
 }
 for(const [id,label] of views){
  const b=el('button',label,tabs);
  b.type='button';b.onclick=()=>showTab(id);tabButtons.set(id,b);
 }
 function readNotes(){try{return String(storage?.getItem(NOTE_KEY_V41)||'').slice(0,2000)}catch(e){return ''}}
 function writeNotes(value){try{storage?.setItem(NOTE_KEY_V41,String(value||'').slice(0,2000));return true}catch(e){return false}}
 function showTab(id){
  currentTab=views.some(v=>v[0]===id)?id:'home';
  for(const [key,b] of tabButtons)b.setAttribute('aria-selected',String(key===currentTab));
  body.replaceChildren();
  const status=getStatus()||{};
  const heading=(text)=>el('h3',text,body);
  const card=(text)=>el('div',text,body,'v41Card');
  if(currentTab==='home'){
   heading('أهلًا بيك في EgyptOS 🖥️');
   card('📍 المكتب موجود جنب بداية اللعب. افتحه وإنت ماشي، مش وإنت سايق.');
   card('💰 رصيدك الحالي: '+Math.round(Number(status.cash)||0)+' جنيه');
   card('🧭 مكانك: X '+Math.round(getPlayer().x)+' / Z '+Math.round(getPlayer().z));
  }else if(currentTab==='jobs'){
   heading('📦 لوحة المهمات');
   card('✅ الطلبات اللي خلصتها: '+Math.max(0,Number(status.completed)||0));
   card('💼 قائمة الوظائف متاحة من زر «وظائف» في اللعبة. الشغل اللي خلصته بيتحفظ هناك.');
   card('🚗 اخرج من اللابتوب وبعدها تقدر تكمّل المهمات والطلبات.');
  }else if(currentTab==='cars'){
   heading('🚗 حالة الجراج');
   card('🚘 عربيتك: '+safeText(status.vehicle||'تاكسي'));
   card('⛽ البنزين المتبقي: '+Math.round(Number(status.fuel)||0)+'%');
   card('🔧 افتح الجراج بعد ما تقفل اللابتوب لتبديل العربية أو ترقيتها.');
  }else if(currentTab==='races'){
   heading('🏁 البطولات والأرقام القياسية');
   const races=status.races||{};
   card('🏆 الانتصارات: '+Math.max(0,Number(races.wins)||0)+
    ' • السباقات: '+Math.max(0,Number(races.races)||0));
   card('🔥 أعلى درفت: '+Math.max(0,Number(races.bestDrift)||0)+' نقطة');
   const best=status.bestLap;
   card('👻 أفضل تحدي ضد الزمن: '+(Number.isFinite(best)?best.toFixed(2)+' ثانية':'لسه ما سجلتش زمن'));
   card('🏟️ ادخل «سباقات القاهرة» لاختيار البطولة في الحلبة الفاضية.');
  }else if(currentTab==='notes'){
   heading('📝 مفكرة اللاعب');
   el('p','اكتب ملاحظاتك أو أهدافك داخل اللعبة. بتتحفظ على نفس الجهاز.',body);
   const note=el('textarea',null,body);note.id='v41LaptopNote';
   note.maxLength=2000;note.value=readNotes();
   note.placeholder='مثلاً: أجيب عربية سباق وأكسر الرقم القياسي...';
   const save=el('button','💾 احفظ الملاحظة',body);save.id='v41LaptopSave';
   save.type='button';
   save.onclick=()=>{notify(writeNotes(note.value)?'💾 الملاحظة اتحفظت':'تعذّر حفظ الملاحظة')};
  }
 }
 const canUse=()=>getActive()&&!isPaused()&&!isDriving()&&!isRacing()&&
    distance(getPlayer(),position)<=reach;
 function openLaptop(){
  if(open)return true;
  if(!canUse()){notify('💻 قرّب من المكتب وإنت ماشي عشان تفتح اللابتوب');return false}
  open=true;overlay.hidden=false;nearButton.hidden=true;
  showTab('home');onOpen();notify('💻 فتحت اللابتوب • L للإغلاق');return true;
 }
 function closeLaptop(){if(!open)return false;open=false;overlay.hidden=true;
  nearButton.hidden=!canUse();return true}
 function toggle(){return open?closeLaptop():openLaptop()}
 function update(t=0){
  const near=canUse();
  if(open&&!near){closeLaptop();return}
  if(!open&&t-lastNearAt>150){nearButton.hidden=!near;lastNearAt=t}
  if(near!==wasNear){wasNear=near;beacon.material.opacity=near?1:.73}
  group.visible=true;
  beacon.position.y=3.12+Math.sin(t*.003)*.08;
 }
 nearButton.onclick=openLaptop;closeButton.onclick=closeLaptop;
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeLaptop()});
 return {update,open:openLaptop,close:closeLaptop,toggle,isOpen:()=>open,
  isNear:()=>canUse(),position,group,getTab:()=>currentTab,readNotes,writeNotes,
  showTab,nearButton,panel:overlay};
}
