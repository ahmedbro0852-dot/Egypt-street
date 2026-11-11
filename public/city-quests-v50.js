// V50: 100 optional progressive Cairo challenges, preserving existing missions.
const KEY='egypt-street-quests-v50';
const kinds=['walk_to','walk_distance','drive_to','drive_distance','speed_run'];
const values=[0,30,-30,60,-60];
const points=values.flatMap(x=>values.map(z=>({x,z,name:'تقاطع '+x+' / '+z}))).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)).slice(0,20);
const tasks=Array.from({length:100},(_,i)=>{
 const kind=kinds[i%5],point=points[Math.floor(i/5)],level=Math.floor(i/5);
 const target=kind==='walk_distance'?80+level*10:kind==='drive_distance'?300+level*20:kind==='speed_run'?5+Math.floor(level/4):0;
 const title=kind==='walk_to'?'امشِ إلى '+point.name:kind==='drive_to'?'قد السيارة إلى '+point.name:kind==='walk_distance'?'امشِ '+target+' متر':kind==='drive_distance'?'قد السيارة '+target+' متر':'حافظ على السرعة لمدة '+target+' ثوانٍ';
 return {id:i+1,kind,point,target,title,reward:90+level*18};
});
export function createCityQuestsV50({getPosition,getDriving,getSpeed=()=>0,getActive=()=>false,getPaused=()=>false,getInRace=()=>false,onReward=()=>{},fresh=false}={}){
 let saved={};if(!fresh)try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
 let completed=Number.isInteger(saved.completed)?Math.max(0,Math.min(100,saved.completed)):0;
 let progress=Number.isFinite(saved.progress)?Math.max(0,saved.progress):0;
 let last=null,lastDriving=null,clock=0;
 const style=document.createElement('style');
 style.textContent='#v50QuestButton{position:fixed;left:12px;top:max(75px,env(safe-area-inset-top));z-index:56;width:auto;height:auto;border:1px solid #d6b37b77;border-radius:10px;background:#17323be9;color:#ffe8b6;padding:8px 12px;font:bold 12px Tahoma}#v50QuestPanel{position:fixed;inset:0;z-index:505;display:grid;place-items:center;overflow:auto;touch-action:pan-y;overscroll-behavior:contain;padding:15px;background:#06131be9;direction:rtl;color:#f8f1df;font:13px/1.8 Tahoma}#v50QuestPanel[hidden]{display:none!important}#v50QuestPanel .v50sheet{width:min(520px,95vw);max-height:88dvh;overflow-y:auto;overscroll-behavior:contain;background:#17313b;border:1px solid #dcb97088;border-radius:18px;padding:18px}#v50QuestPanel h2{font-size:19px;color:#ffdc93;margin:0}#v50QuestPanel p{color:#ccd9db}#v50QuestPanel button{position:static;width:auto;height:auto;border-radius:10px;padding:9px 14px;background:#32515b;font:bold 12px Tahoma}#v50QuestPanel .v50line{padding:9px 11px;margin:8px 0;border:1px solid #ffffff25;border-radius:11px;background:#203c43}#v50QuestPanel .v50line b{display:block;color:#ffde9e}#v50QuestPanel .v50line small{display:block;color:#c6d7db;font-size:11px}#v50QuestPanel .locked{opacity:.6}@media(max-width:600px){#v50QuestButton{left:6px;top:max(59px,env(safe-area-inset-top));padding:7px 9px;font-size:10px}#v50QuestPanel .v50sheet{max-height:94dvh;padding:12px}}';
 document.head.append(style);
 const button=document.createElement('button');button.id='v50QuestButton';button.type='button';button.hidden=true;
 const panel=document.createElement('section');panel.id='v50QuestPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','مهمات مدينة القاهرة');
 panel.innerHTML='<div class="v50sheet"><button id="v50QuestClose" type="button">✕ إغلاق</button><h2>📜 مهمات شوارع مصر — 100 تحدي</h2><p id="v50QuestSummary"></p><div id="v50QuestItems"></div><p>المهمات اختيارية، ومكافآتها من فلوس اللعبة. التقدم محفوظ في المتصفح. مهام السباق والشغل الأصلية موجودة زي ما هي.</p></div>';
 document.body.append(button,panel);
 const $=id=>panel.querySelector('#'+id);
 function current(){return tasks[completed]||null}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({completed,progress:Math.round(progress*100)/100}))}catch{}}
 function render(){
  button.textContent='📜 مهمات '+completed+'/100';
  $('v50QuestSummary').textContent='المكتمل '+completed+' من 100 — '+(current()?'المهمة الحالية: '+current().title:'كل التحديات اكتملت 🎉');
  const list=$('v50QuestItems');list.replaceChildren();
  for(let index=completed;index<Math.min(100,completed+5);index++){
   const q=tasks[index],row=document.createElement('article');row.className='v50line'+(index!==completed?' locked':'');
   const title=document.createElement('b');title.textContent=(index===completed?'▶ الحالية':'🔒 التالية')+' · #'+q.id+' '+q.title;
   const detail=document.createElement('small');detail.textContent=(index===completed?(q.target?'التقدم '+Math.floor(progress)+' / '+q.target:'⭐ الهدف على الخريطة المصغرة'):'تفتح بعد إنهاء المهمة الحالية')+' · مكافأة '+q.reward+' ج.م';
   row.append(title,detail);list.append(row);
  }
 }
 button.onclick=()=>{panel.hidden=false;render();$('v50QuestClose').focus()};
 const close=()=>{panel.hidden=true;button.focus()};
 $('v50QuestClose').onclick=close;
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
 function complete(q){
  completed++;progress=0;last=null;save();onReward(q.reward,q);render();
 }
 function update(dt){
  button.hidden=!getActive();
  if(!getActive()||getPaused()||getInRace()){last=null;return}
  const q=current(),p=getPosition?.();if(!q||!p)return;
  const driving=!!getDriving(),pos={x:Number(p.x)||0,z:Number(p.z)||0};
  if(last&&lastDriving===driving){
   const d=Math.hypot(pos.x-last.x,pos.z-last.z);
   if(d>0&&d<9&&((q.kind==='walk_distance'&&!driving)||(q.kind==='drive_distance'&&driving)))progress+=d;
  }
  last=pos;lastDriving=driving;
  if(q.kind==='speed_run')progress=driving&&Math.abs(getSpeed())>=12?progress+Math.min(.05,Math.max(0,dt)):0;
  if((((q.kind==='walk_to'&&!driving)||(q.kind==='drive_to'&&driving))&&Math.hypot(pos.x-q.point.x,pos.z-q.point.z)<8)||(q.target>0&&progress>=q.target)){complete(q);return}
  clock+=dt;if(clock>.85){clock=0;if(!panel.hidden)render()}
 }
 render();
 return {update,getMarker:()=>{const q=current();return q&&(q.kind==='walk_to'||q.kind==='drive_to')?q.point:null},getProgress:()=>({completed,remaining:100-completed}),dispose(){button.remove();panel.remove();style.remove()}};
}
