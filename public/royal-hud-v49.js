// V49 HUD / settings skin uses the existing running game, not a screenshot.
const V49_KEY='egypt-street-gold-ui-v49';
const defaults=()=>({quality:window.matchMedia?.('(pointer: coarse)')?.matches?'auto':'high',sharpness:1,showMap:true,showTasks:true,showActions:true,showFps:true,sensitivity:1,deadzone:.06,compact:true,steady:false});
const bound=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||a));
export function installRoyalHudV49({desktopWorldV43,mobileV40,renderer,getActive=()=>false,getCompleted=()=>0,getDriving=()=>false}={}){
 const $=id=>document.getElementById(id);
 const existing=$('v40Panel');
 if(!existing)return;
 let stored={};try{stored=JSON.parse(localStorage.getItem(V49_KEY)||'{}')||{}}catch{}
 const control=mobileV40?.getSettings?.()||{};
 let state={...defaults(),...stored,sensitivity:control.sensitivity??1,deadzone:control.deadzone??.06,compact:control.compact??true,steady:control.steady??false};
 if(window.matchMedia?.('(pointer: coarse)')?.matches&&!stored.v50QualityChosen&&stored.quality==='high')state.quality='auto';
 let draft={...state},currentTab='graphics';
 const tabs=[['graphics','▣','الرسومات'],['audio','◖','الصوت'],['controls','⌘','عناصر التحكم'],['ui','▦','الواجهة'],['sensitivity','⊕','الحساسية'],['game','⚑','اللعب'],['language','◎','اللغة']];
 const quick=document.createElement('nav');quick.id='v49-quick';quick.setAttribute('aria-label','اختصارات العالم المفتوح');
 for(const [target,icon,label] of [['garageBtn','🚘','الجراج والمركبات'],['gpsBtn','🧭','الخريطة والملاحة'],['jobsBtn','🎒','الوظائف والمهام'],['camera','📷','تغيير الكاميرا']]){
  const button=document.createElement('button');button.type='button';button.textContent=icon;button.title=label;button.setAttribute('aria-label',label);button.onclick=()=>$(target)?.click();quick.append(button);
 }
 const stateHud=document.createElement('div');stateHud.id='v49-state';stateHud.setAttribute('aria-label','حالة اللاعب والمركبة');
 stateHud.innerHTML='<span>♥ <b id="v49-state-label">100%</b></span><i></i>';
 const fps=document.createElement('div');fps.id='v49-fps';fps.textContent='-- FPS';
 document.body.append(quick,stateHud,fps);document.body.classList.add('royal-v49');
 // The V40 sheet stays in the DOM and keeps ownership of pause / input bindings.
 existing.classList.add('v49-settings');
 const shell=document.createElement('div');shell.className='v49-shell';
 shell.innerHTML='<div class="v49-header"><span>⚙ الإعدادات</span><button type="button" class="v49-close" aria-label="إغلاق الإعدادات">✕</button></div><div class="v49-body"><nav class="v49-tabs" role="tablist" aria-label="أقسام الإعدادات"></nav><div class="v49-main" role="tabpanel"></div></div><div class="v49-foot"><button type="button" id="v49-reset">⟲ استعادة الافتراضي</button><span style="flex:1"></span><button type="button" id="v49-cancel">إلغاء</button><button type="button" id="v49-apply" class="v49-apply">✓ تطبيق</button></div>';
 existing.append(shell);
 const nav=shell.querySelector('.v49-tabs'),main=shell.querySelector('.v49-main');
 for(const [id,icon,label] of tabs){const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.textContent=icon+'   '+label;b.role='tab';b.onclick=()=>{currentTab=id;render()};nav.append(b)}
 function title(s){const h=document.createElement('h3');h.textContent=s;main.append(h)}
 function note(s){const p=document.createElement('p');p.className='v49-desc';p.textContent=s;main.append(p)}
 function row(label){const line=document.createElement('div');line.className='v49-row';const cap=document.createElement('span');cap.textContent=label;line.append(cap);main.append(line);return line}
 function choices(label,options,value,act){const line=row(label),group=document.createElement('div');group.className='v49-choices';for(const [id,text] of options){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-pressed',String(value===id));b.onclick=()=>{act(id);render()};group.append(b)}line.append(group)}
 function slider(label,key,min,max,step,unit){const line=row(label),area=document.createElement('label');area.style.display='flex';area.style.alignItems='center';area.style.gap='10px';const out=document.createElement('output');out.textContent=Number(draft[key]).toFixed(2)+unit;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=draft[key];input.oninput=()=>{draft[key]=Number(input.value);out.textContent=Number(draft[key]).toFixed(2)+unit};area.append(input,out);line.append(area)}
 function flip(label,key){choices(label,[[true,'تشغيل'],[false,'إيقاف']],!!draft[key],id=>draft[key]=id)}
 function action(label,buttonLabel,fn){const line=row(label),group=document.createElement('div');group.className='v49-choices';const button=document.createElement('button');button.textContent=buttonLabel;button.onclick=fn;group.append(button);line.append(group)}
 function render(){
  [...nav.children].forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.tab===currentTab)));
  main.replaceChildren();
  if(currentTab==='graphics'){
   title('▣ إعدادات الرسومات');
   choices('جودة الرسومات',[['auto','تلقائية ✦'],['balanced','متوازنة'],['high','عالية'],['ultra','فائقة ✦']],draft.quality,id=>{draft.quality=id;draft.v50QualityChosen=true});
   if(window.matchMedia?.('(pointer: coarse)')?.matches)choices('حدة ووضوح الصورة',[['0.85','أسرع'],['1','HD واضح'],['1.15','أوضح'],['1.3','فائق']],String(draft.sharpness??1),id=>draft.sharpness=Number(id));
   action('معدل الإطارات (FPS)','تلقائي حسب الجهاز',()=>{});
   note('V53: جودة HD أوضح للموبايل، بدون النزول لدقة شديدة البكسلة. لو حصل بطء اختر «أسرع»؛ الإطارات الفعلية حسب الجهاز.');
   flip('إظهار عدّاد الأداء', 'showFps');
   action('التصوير بدون واجهة','📷 F9',()=>{const b=$('v43Panel')?.querySelectorAll('button')?.[1];$('v40Resume')?.click();b?.click()});
  }else if(currentTab==='audio'){
   title('◖ إعدادات الصوت');
   action('أصوات المحرك والمدينة والطقس','🔊 تبديل كتم الصوت',()=>{$('sound')?.click()});
   note('أصوات اللعبة الطبيعية فقط، من غير موسيقى خلفية.');
  }else if(currentTab==='controls'){
   title('⌘ عناصر التحكم');
   flip('واجهة مختصرة للأنشطة','compact');flip('إظهار أزرار الإجراءات','showActions');
   note('اللابتوب: WASD حركة · E ركوب · F تفاعل · C كاميرا · G خريطة · B جراج · J وظائف · M القائمة · F8 جودة الرسوم.');
   note('التابلت: العصاية على الشمال، وأزرار القيادة والتفاعل على اليمين.');
  }else if(currentTab==='ui'){
   title('▦ تخصيص الواجهة');
   flip('إظهار الخريطة المصغرة','showMap');flip('إظهار لوحة المهام','showTasks');flip('إظهار أزرار الإجراءات','showActions');flip('إظهار عداد FPS','showFps');
  }else if(currentTab==='sensitivity'){
   title('⊕ الحساسية');
   slider('حساسية الكاميرا','sensitivity',.45,1.8,.05,'×');
   slider('منطقة سكون العصاية','deadzone',0,.28,.01,'');
   flip('كاميرا ثابتة ومريحة','steady');
  }else if(currentTab==='game'){
   title('⚑ إعدادات العالم المفتوح');
   action('الوقت داخل المدينة','🌙 تبديل الليل والنهار',()=>{$('cityNight')?.click()});
   action('الطقس','☁ تغيير الطقس',()=>{$('cityWeatherBtn')?.click()});
   action('ملاحة المهمات','🧭 فتح GPS',()=>{$('v40Resume')?.click();$('gpsBtn')?.click()});
   note('يتم الاحتفاظ بتقدم اللعب عبر نظام الحفظ الحالي دون مسحه عند تغيير الواجهة.');
  }else{
   title('◎ اللغة');
   note('اللغة الحالية: العربية. واجهة شوارع مصر والأوصاف والمهمات متاحة بالعربية.');
  }
 }
 function applyV40(id,value,type){const el=$(id);if(!el)return;el[type==='checkbox'?'checked':'value']=value;el.dispatchEvent(new Event(type==='checkbox'?'change':'input',{bubbles:true}))}
 function applyQuality(id){if(desktopWorldV43?.enabled){desktopWorldV43.setQuality(id==='auto'?'high':id);return}if(id==='auto')return;if(renderer?.isWebGLRenderer&&renderer.setPixelRatio){const dpr=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(Math.min(2,dpr*({balanced:.75,high:1,ultra:1.3}[id]||1)))}}
 function paint(){
  document.body.classList.toggle('v49-no-map',!state.showMap);
  document.body.classList.toggle('v49-no-tasks',!state.showTasks);
  document.body.classList.toggle('v49-no-actions',!state.showActions);
  document.body.classList.toggle('v49-no-fps',!state.showFps);
 }
 function save(){state={...draft};applyQuality(state.quality);applyV40('v40Sensitivity',bound(state.sensitivity,.45,1.8),'range');applyV40('v40Deadzone',bound(state.deadzone,0,.28),'range');applyV40('v40Compact',state.compact,'checkbox');applyV40('v40Steady',state.steady,'checkbox');paint();try{localStorage.setItem(V49_KEY,JSON.stringify(state))}catch{}}
 function close(){const b=$('v40Resume');b?.click()}
 shell.querySelector('.v49-close').onclick=close;
 shell.querySelector('#v49-cancel').onclick=close;
 shell.querySelector('#v49-apply').onclick=()=>{save();close()};
 shell.querySelector('#v49-reset').onclick=()=>{draft={...defaults()};render()};
 const observer=new MutationObserver(()=>{if(!existing.hidden){draft={...state};currentTab='graphics';render();setTimeout(()=>shell.querySelector('.v49-close')?.focus(),0)}});
 observer.observe(existing,{attributes:true,attributeFilter:['hidden']});
 existing.addEventListener('keydown',e=>{if(!existing.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}},true);
 paint();
 const portrait=document.querySelector('.royal-v49 .v47-profile-name');
 const originalName=portrait?.textContent||'اللاعب';
 let seconds=0,frames=0,origin=performance.now();
 function frame(time){frames++;if(time-origin>=1000){fps.textContent=Math.round(frames*1000/(time-origin))+' FPS';frames=0;origin=time}requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
 setInterval(()=>{
  const active=!!getActive();quick.style.display=active?'grid':'none';stateHud.style.display=active?'flex':'none';fps.style.display=active?'block':'none';
  const lvl=Math.max(1,Math.floor((Number(getCompleted())||0)/5)+1);
  if(portrait)portrait.textContent='Lv. '+lvl+' · '+originalName;
  const driving=!!getDriving(),cond=($('fuelCondition')?.textContent||'').match(/(\d{1,3})\s*%/);
  const value=driving&&cond?Math.min(100,Number(cond[1])):100;
  $('v49-state-label').textContent=driving?'المركبة '+value+'%':'الحالة 100%';
  stateHud.querySelector('i').style.background=driving&&value<30?'linear-gradient(90deg,#b33,#edaa50)':'linear-gradient(90deg,#55bd38,#b8e854)';
 },700);
 save();return {getSettings:()=>state,dispose(){observer.disconnect();quick.remove();stateHud.remove();fps.remove();shell.remove();document.body.classList.remove('royal-v49')}};
}
