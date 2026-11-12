// Egypt Streets V100 — local-only Cairo Racing League.
// Designed to keep existing garage, wallet, race engine and offline saves intact.
export const V100_LEAGUE_KEY='egypt-streets-race-league-v100';
export const V100_TIERS=[
 {name:'مبتدئ',min:0,icon:'🚗'},
 {name:'منافس',min:180,icon:'🥉'},
 {name:'محترف',min:500,icon:'🥈'},
 {name:'نجم الشوارع',min:1050,icon:'🥇'},
 {name:'بطل القاهرة',min:1900,icon:'🏆'},
 {name:'أسطورة مصر',min:3200,icon:'👑'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const pad=n=>String(n).padStart(2,'0');
const formatTime=t=>Number.isFinite(t)&&t>=0?
  Math.floor(t/60)+':'+pad(Math.floor(t%60))+'.'+Math.floor(t%1*10):'--:--';
export function pointsForResultV100({completed=false,rank=4,world=false,kind='street'}={}){
 if(!completed)return 0;
 const base=({1:110,2:72,3:45,4:25})[clamp(Math.trunc(finite(rank,4)),1,4)];
 return base+(world?30:0)+(kind==='timeattack'?15:0);
}
export function tierForPointsV100(value){
 const xp=clamp(finite(value),0,999999);
 let tier=V100_TIERS[0],next=null;
 for(let i=0;i<V100_TIERS.length;i++)if(xp>=V100_TIERS[i].min)tier=V100_TIERS[i];
 else {next=V100_TIERS[i];break}
 return {tier,next,percent:next?clamp(Math.round((xp-tier.min)/(next.min-tier.min)*100),0,100):100};
}
export function sanitizeLeagueV100(raw){
 const obj=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const rows={};
 for(const [id,entry] of Object.entries(obj.events||{}).slice(0,60)){
  if(!/^[a-z0-9-]{1,48}$/.test(id)||!entry||typeof entry!=='object')continue;
  rows[id]={
   finished:clamp(Math.trunc(finite(entry.finished)),0,9999),
   wins:clamp(Math.trunc(finite(entry.wins)),0,9999),
   best:clamp(finite(entry.best,1e9),0,1e9),
   bestRank:clamp(Math.trunc(finite(entry.bestRank,4)),1,4)
  };
 }
 return {
  xp:clamp(Math.trunc(finite(obj.xp)),0,999999),
  completed:clamp(Math.trunc(finite(obj.completed)),0,999999),
  wins:clamp(Math.trunc(finite(obj.wins)),0,999999),
  streak:clamp(Math.trunc(finite(obj.streak)),0,9999),
  bestStreak:clamp(Math.trunc(finite(obj.bestStreak)),0,9999),
  events:rows
 };
}
export function createRaceLeagueV100({
 storage=null,fresh=false,getCourses=()=>[],getRace=()=>null,
 getVehicle=()=>({x:0,z:0,yaw:0,speed:0}),
 getActive=()=>false,getPaused=()=>false,
 startRace=()=>false,openRaces=()=>{},notify=()=>{}
}={}){
 if(fresh){try{storage?.removeItem(V100_LEAGUE_KEY)}catch{}}
 let league=sanitizeLeagueV100();
 try{league=sanitizeLeagueV100(JSON.parse(storage?.getItem(V100_LEAGUE_KEY)||'null'))}catch{}
 let navigation=null,previousCourse=null,lastUi=-Infinity,lastPanel=-Infinity;
 const panel=document.getElementById('v31RacePanel');
 const raceHud=document.getElementById('v31RaceHud');
 const info=document.createElement('section');
 info.id='v100LeagueBoard';info.setAttribute('aria-label','بطولة شوارع مصر V100');
 info.innerHTML='<header><span>🏆 EGYPT STREETS / V100 LEAGUE</span><b id="v100Tier"></b></header>'+
  '<div class="v100XpRow"><b id="v100XP">0 XP</b><small id="v100Next"></small></div>'+
  '<div class="v100Track"><i id="v100Progress"></i></div>'+
  '<div class="v100Stats"><span id="v100Record"></span><span id="v100Streak"></span></div>'+
  '<p id="v100Hint">اكسب سباقات القاهرة وارتقِ من مبتدئ لأسطورة مصر.</p>';
 panel?.insertBefore(info,document.getElementById('v31RaceList'));
 const live=document.createElement('section');live.id='v100LiveTelemetry';live.hidden=true;
 live.setAttribute('aria-label','معلومات السباق المباشرة');
 live.innerHTML='<div class="v100LiveTop"><span id="v100RaceStage">RACE LIVE</span><b id="v100Turn">⬆</b><span id="v100Gap">0 م</span></div>'+
  '<div class="v100LiveTrack"><i id="v100LiveProgress"></i></div>'+ 
  '<div class="v150RaceExtras"><span id="v150RaceLap">لفة 1/1</span><span id="v150RaceClock">⏱ 0:00.0</span></div>';
 raceHud?.insertBefore(live,document.getElementById('v31RaceHint'));
 const nav=document.createElement('aside');nav.id='v100Navigation';nav.hidden=true;
 nav.setAttribute('aria-label','الملاحة إلى سباق القاهرة');
 nav.innerHTML='<div class="v100NavTop"><b>🧭 نحو خط البداية</b><button type="button" id="v100NavClose" aria-label="إلغاء الملاحة">✕</button></div>'+
  '<div class="v100NavCourse" id="v100NavCourse"></div>'+
  '<div class="v100NavDistance"><strong id="v100NavArrow">⬆</strong><span id="v100NavKm"></span></div>'+
  '<button type="button" id="v100NavAction">🏁 ابدأ السباق</button>';
 document.body.append(nav);
 const $=id=>document.getElementById(id);
 $('v100NavClose').onclick=()=>{navigation=null;nav.hidden=true;notify('تم إلغاء الملاحة')};
 $('v100NavAction').onclick=()=>{
  if(!navigation||!getActive()||getPaused())return;
  const course=navigation.course;
  if(startRace(course.id)){navigation=null;nav.hidden=true}
 };
 function persist(){try{storage?.setItem(V100_LEAGUE_KEY,JSON.stringify(league))}catch{}}
 function renderPanel(){
  if(!panel)return;
  const level=tierForPointsV100(league.xp);
  $('v100Tier').textContent=level.tier.icon+' '+level.tier.name;
  $('v100XP').textContent=league.xp.toLocaleString('en-US')+' XP';
  $('v100Next').textContent=level.next?'التالي: '+level.next.name+' • '+level.next.min+' XP':'وصلت لأعلى مستوى';
  $('v100Progress').style.width=level.percent+'%';
  $('v100Record').textContent='🥇 '+league.wins+' فوز • ✅ '+league.completed+' سباق';
  $('v100Streak').textContent='🔥 '+league.streak+' سلسلة • أفضل سلسلة '+league.bestStreak;
  const tracks=getCourses().filter(c=>c.world);
  const crowns=tracks.filter(c=>league.events[c.id]?.wins>0).length;
  $('v100Hint').textContent='🗺️ بطولات المدينة: '+crowns+'/'+tracks.length+
   ' انتصارات أولى • سباقات الشوارع بتفتح لك نقاط دوري أعلى. اختار «اتجه للبداية» لتبدأ من داخل القاهرة.';
 }
 function bearing(dx,dz,yaw){
  const target=Math.atan2(dx,dz),angle=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));
  return Math.abs(angle)<.42?'⬆':angle>.42&&angle<1.9?'↗':angle<-.42&&angle>-1.9?'↖':angle>=1.9?'➡':'⬅';
 }
 function navigate(course,point){
  if(!course?.world||!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return false;
  navigation={course,point:{x:point.x,z:point.z}};
  nav.hidden=false;
  const listPanel=document.getElementById('v31RacePanel');if(listPanel)listPanel.hidden=true;
  renderNavigation(true);
  notify('📍 اتبع السهم لخط بداية '+course.name+' ثم هدي سرعتك.');
  return true;
 }
 function renderNavigation(force=false){
  if(!navigation||getRace()||!getActive()||document.hidden){
   nav.hidden=true;return;
  }
  const {course,point}=navigation,car=getVehicle();
  const distance=Math.hypot(point.x-car.x,point.z-car.z);
  const ready=distance<=18&&Math.abs(finite(car.speed))<3;
  nav.hidden=false;nav.classList.toggle('ready',ready);
  $('v100NavCourse').textContent=course.icon+' '+course.name;
  $('v100NavArrow').textContent=bearing(point.x-car.x,point.z-car.z,finite(car.yaw));
  $('v100NavKm').textContent=ready?'✅ وصلت لخط البداية':distance<=18?'🛑 هدي سرعتك عشان تبدأ':
    Math.round(distance)+' متر لبداية السباق';
  const action=$('v100NavAction');
  action.disabled=!ready;
  action.textContent=ready?'🏁 ابدأ '+course.name:'📍 اتجه للعلامة، ثم ابدأ';
 }
 function complete(course,completed,rank,details={}){
  if(!completed||!course?.id){league.streak=0;persist();renderPanel();return 0}
  const pts=pointsForResultV100({completed,rank,world:!!course.world,kind:course.kind});
  const oldTier=tierForPointsV100(league.xp).tier.name;
  const previous=league.events[course.id]||{finished:0,wins:0,best:1e9,bestRank:4};
  const won=rank===1;
  const t=finite(details.elapsed,1e9);
  previous.finished=Math.min(9999,previous.finished+1);
  if(won)previous.wins=Math.min(9999,previous.wins+1);
  if(t>0&&t<previous.best)previous.best=t;
  previous.bestRank=Math.min(previous.bestRank,clamp(Math.trunc(finite(rank,4)),1,4));
  league.events[course.id]=previous;
  league.completed=Math.min(999999,league.completed+1);
  league.wins+=Number(won);
  league.streak=won?Math.min(9999,league.streak+1):0;
  league.bestStreak=Math.max(league.bestStreak,league.streak);
  league.xp=Math.min(999999,league.xp+pts);
  persist();renderPanel();
  const now=tierForPointsV100(league.xp);
  if(now.tier.name!==oldTier)notify('👑 مستوى جديد في دوري V100: '+now.tier.name+'!');
  else notify('🏆 دوري الشوارع: +'+pts+' XP • '+now.tier.name);
  return pts;
 }
 function update(t=0){
  if(document.hidden)return;
  if(t-lastUi<130)return;lastUi=t;
  const race=getRace(),car=getVehicle();
  if(race){
   if(navigation){navigation=null;nav.hidden=true}
   if(!live.hidden||race.phase==='racing'){
    live.hidden=false;
    const total=Math.max(1,Number(race.totalSteps)||1);
    const progress=Math.min(100,Math.max(0,Math.round((Number(race.steps)||0)/total*100)));
    $('v100LiveProgress').style.width=progress+'%';
     const laps=Math.max(1,Math.trunc(finite(race.laps,1)));
     $('v150RaceLap').textContent='🔁 اللفة '+Math.min(laps,Math.max(1,Math.trunc(finite(race.lap))+1))+'/'+laps;
     $('v150RaceClock').textContent='⏱ '+formatTime(Math.max(0,finite(race.elapsed)));
    $('v100RaceStage').textContent=race.phase==='countdown'?'🚦 استعد':
      '🏁 '+progress+'% • المركز '+race.rank+'/4';
    if(race.waypoint){
     $('v100Gap').textContent=Math.round(Math.hypot(race.waypoint.x-car.x,race.waypoint.z-car.z))+' م';
     $('v100Turn').textContent=bearing(race.waypoint.x-car.x,race.waypoint.z-car.z,finite(car.yaw));
    }else{
     $('v100Gap').textContent='🔥 درفت';$('v100Turn').textContent='↝';
    }
   }
  }else{live.hidden=true;if(navigation)renderNavigation()}
  if(panel&&!panel.hidden&&t-lastPanel>700){lastPanel=t;renderPanel()}
 }
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)nav.hidden=true;
  else if(navigation&&!getRace())renderNavigation(true);
 });
 window.addEventListener('pagehide',persist);
 renderPanel();
 return {
  update,complete,navigate,getWaypoint:()=>navigation?.point||null,
  getState:()=>({...league,events:{...league.events}}),
  render:renderPanel,dispose:()=>{info.remove();live.remove();nav.remove()}
 };
}
