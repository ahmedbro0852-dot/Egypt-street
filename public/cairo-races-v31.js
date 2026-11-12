// Egypt Streets V32 — Cairo championships now take place at an empty dedicated racetrack.
import { createRaceArenaV32, RACE_CIRCUIT_V32 } from './race-arena-v32.js';
import { targetOpponentSpeedV150, evolveOpponentSpeedV150 } from './race-opponents-v150.js';
import { createTimedDriftV35, DRIFT_CHALLENGE_V35 } from './drift-challenge-v35.js';
import { createTimeAttackV37, TIME_ATTACK_V37 } from './time-attack-v37.js';
// Sequential checkpoints prohibit shortcut victories; NPCs race on actual road-grid segments.
export const CAIRO_RACES_V31=[
 {id:'formula',name:'فورملا القاهرة',icon:'🏎️',laps:2,reward:900,kind:'formula',difficulty:'محترفين',
  color:0xffc85e,speed:17.5,
  points:RACE_CIRCUIT_V32},
 {id:'street',name:'كأس شوارع القاهرة',icon:'🚗',laps:1,reward:550,kind:'street',difficulty:'متوسط',
  color:0x6fe0f1,speed:14.2,
  points:RACE_CIRCUIT_V32},
 {id:'moto',name:'بطولة الموتوسيكلات',icon:'🏍️',laps:2,reward:700,kind:'moto',difficulty:'مهارة',
  color:0xc5f39c,speed:16.3,
  points:RACE_CIRCUIT_V32},
 {id:'drift',name:'تحدّي درفت القاهرة',icon:'🔥',laps:0,reward:950,kind:'drift',
  difficulty:'مهارة وتحكم',duration:90,color:0xffa85e,speed:0,
  points:RACE_CIRCUIT_V32},
 {id:'timeattack',name:'تحدّي الرقم القياسي',icon:'⏱️',laps:1,reward:850,
  kind:'timeattack',difficulty:'ضد نفسك',duration:150,color:0x67dbf3,speed:0,
  points:RACE_CIRCUIT_V32},
 // V61: actual navigable Cairo streets; all vertices lie on paved existing roads.
 // No separate scene, loading screen, or teleport from outside the city.
 {id:'world-downtown',name:'سبرنت وسط البلد',icon:'🌆',laps:1,reward:580,
  kind:'street',world:true,difficulty:'مبتدئ',color:0x68f0c6,speed:12.4,
  points:[[0,0],[0,30],[30,30],[30,60],[60,60],[60,30],[60,0],[30,0]]},
 {id:'world-giza',name:'جائزة الجيزة',icon:'🏙️',laps:2,reward:800,
  kind:'street',world:true,difficulty:'متوسط',color:0xfbb96b,speed:13.8,
  points:[[-60,-60],[-30,-60],[0,-60],[0,-30],[-30,-30],[-60,-30]]},
 {id:'world-nile',name:'تحدّي كوبري النيل',icon:'🌉',laps:1,reward:1050,
  kind:'street',world:true,difficulty:'محترفين',color:0x79c9ff,speed:15.2,
  points:[[60,60],[94,60],[130,60],[170,60],[170,0],[170,-60],
          [130,-60],[94,-60],[60,-60],[60,0]]},
 // V100: three more long-form championships on existing paved Cairo grid.
 {id:'world-south',name:'جولة جنوب القاهرة',icon:'🌴',laps:2,reward:850,
  kind:'street',world:true,difficulty:'متوسط',color:0x7cf5cf,speed:13.6,
  points:[[-60,60],[-30,60],[-30,30],[0,30],[0,0],[-30,0],[-60,0],[-60,30]]},
 {id:'world-night',name:'سباق ليل القاهرة',icon:'🌙',laps:2,reward:980,
  kind:'street',world:true,difficulty:'محترفين',color:0xd69dff,speed:14.5,
  points:[[-30,-30],[0,-30],[30,-30],[30,0],[0,0],[0,30],[-30,30],[-30,0]]},
 {id:'world-marathon',name:'ماراثون شوارع مصر',icon:'🏆',laps:3,reward:1600,
  kind:'street',world:true,difficulty:'أسطوري',color:0xf4c463,speed:16.4,
  points:[[-60,-60],[-30,-60],[0,-60],[30,-60],[60,-60],[60,-30],
          [60,0],[60,30],[60,60],[30,60],[0,60],[-30,60],
          [-60,60],[-60,30],[-60,0],[-60,-30]]}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const toPoints=track=>track.points.map(([x,z])=>({x,z}));
export function checkpointProgressV31(points,x,z,steps=0,radius=8.4){
 const current=(steps+1)%points.length;
 const target=points[current];
 return dist({x,z},target)<=radius?steps+1:steps;
}
export function raceProgressV31(points,steps,position){
 const previous=points[steps%points.length],next=points[(steps+1)%points.length];
 const segment=Math.max(1,dist(previous,next));
 return steps+clamp(1-dist(position,next)/segment,0,.999);
}
export function rankRacersV31(entries){
 return [...entries].sort((a,b)=>b.progress-a.progress||a.time-b.time);
}
function createRacerModel(T,kind,color){
 const root=new T.Group(),chassis=new T.Group();
 root.add(chassis);
 const body=new T.MeshStandardMaterial({color,metalness:.55,roughness:.3});
 const dark=new T.MeshStandardMaterial({color:0x12171c,metalness:.25,roughness:.72});
 const metal=new T.MeshStandardMaterial({color:0xd7e5e7,metalness:.8,roughness:.25});
 const glass=new T.MeshStandardMaterial({color:0x24414c,roughness:.18,metalness:.36});
 const rubber=new T.MeshStandardMaterial({color:0x101317,roughness:.93});
 function box(w,h,d,x,y,z,m,parent=chassis){
  const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;
 }
 const wheels=[];
 function wheel(x,z,r=.39,width=.33){
  const mount=new T.Group();mount.position.set(x,r,z);root.add(mount);
  const rolling=new T.Group();mount.add(rolling);
  const tire=new T.Mesh(new T.CylinderGeometry(r,r,width,14),rubber);
  tire.rotation.z=Math.PI/2;rolling.add(tire);
  const cap=new T.Mesh(new T.CylinderGeometry(r*.56,r*.56,width+.025,12),metal);
  cap.rotation.z=Math.PI/2;rolling.add(cap);
  mount.userData={front:z>0,side:Math.sign(x),radius:r,baseY:r,rolling};
  wheels.push(mount);
 }
 if(kind==='formula'){
  // Distinct open-wheel single seater: pointed nose, exposed tyres, cockpit and wings.
  box(1.02,.35,3.15,0,.60,0,body);
  box(.60,.18,1.45,0,.54,1.55,body);
  box(1.62,.12,.46,0,.46,2.20,dark);
  box(1.85,.12,.42,0,.95,-1.78,dark);
  for(const side of [-1,1]){
   box(.08,.48,.13,side*.73,.73,-1.7,metal);
   box(.48,.30,1.25,side*.66,.56,-.22,body);
  }
  box(.67,.45,.87,0,.92,-.30,glass);
  const helmet=new T.Mesh(new T.SphereGeometry(.24,12,8),metal);
  helmet.position.set(0,1.21,-.24);chassis.add(helmet);
  for(const z of [-1.24,1.37])for(const x of [-1.01,1.01])wheel(x,z,.45,.30);
 }else if(kind==='moto'){
  box(.35,.19,1.40,0,.60,0,body);box(.48,.21,.55,0,.91,-.24,dark);
  box(.65,.08,.09,0,1.13,.72,metal);
  const tank=new T.Mesh(new T.SphereGeometry(.34,12,8),body);
  tank.position.set(0,.84,.27);chassis.add(tank);
  const helmet=new T.Mesh(new T.SphereGeometry(.19,10,8),metal);
  helmet.position.set(0,1.34,-.21);chassis.add(helmet);
  for(const z of [-.75,.80])wheel(0,z,.34,.20);
 }else{
  box(1.80,.46,3.85,0,.66,0,body);
  box(1.58,.47,1.75,0,1.13,-.26,glass);
  box(1.75,.11,.45,0,1.42,-1.72,dark);
  box(.72,.10,.22,0,.61,2.0,metal);
  for(const z of [-1.25,1.18])for(const x of [-.94,.94])wheel(x,z,.37,.27);
 }
 const shadow=new T.Mesh(new T.PlaneGeometry(2.5,4.7),
  new T.MeshBasicMaterial({color:0x172329,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide}));
 shadow.position.set(0,.08,0);shadow.rotation.x=-Math.PI/2;root.add(shadow);
 root.userData.wheels=wheels;root.userData.chassis=chassis;
 root.userData.raceModel=true;
 root.visible=false;
 return root;
}
export function createCairoRacesV31({T,scene,getActive=()=>true,getPaused=()=>false,
 getDriving=()=>false,getVehicle=()=>({x:0,z:0,speed:0}),
 getDriftInput=()=>({holding:false}),
 requestDrive=()=>false,prepareCar=()=>{},restoreCar=()=>{},
 onReward=()=>{},onFinish=()=>{},onNavigate=()=>{},onCountdown=()=>{},notify=()=>{},storage=null,fresh=false}={}){
 const KEY='egypt-streets-races-v31';
 if(fresh){try{storage?.removeItem(KEY)}catch(e){}}
 let history={wins:0,races:0,earned:0,best:{},bestLap:{},bestDrift:0,driftChallenges:0};
 try{const v=JSON.parse(storage?.getItem(KEY)||'null');
  if(v&&typeof v==='object')history={
   wins:clamp(Number(v.wins)||0,0,99999),races:clamp(Number(v.races)||0,0,99999),
   earned:clamp(Number(v.earned)||0,0,1e7),best:v.best&&typeof v.best==='object'?v.best:{},
   bestLap:v.bestLap&&typeof v.bestLap==='object'?v.bestLap:{},
   bestDrift:clamp(Number(v.bestDrift)||0,0,1e8),
   driftChallenges:clamp(Number(v.driftChallenges)||0,0,99999)
  };
 }catch(e){}
 let active=null,lastUiAt=0,lastCountdown=0;
 const style=document.createElement('style');
 style.textContent=`
 #v31RaceOpen{position:fixed;z-index:57;left:16px;bottom:245px;min-height:42px;
 padding:7px 13px;border-radius:13px;background:linear-gradient(120deg,#ba6431,#f6bc63);
 color:#211a18;border:1px solid #ffdf99;font:bold 12px Tahoma,Arial;box-shadow:0 5px 22px #0008}
 #v31RacePanel{position:fixed;z-index:210;left:50%;top:7vh;transform:translateX(-50%);
 width:min(440px,94vw);max-height:86vh;overflow:auto;overscroll-behavior:contain;
 touch-action:pan-y;direction:rtl;border:1px solid #e9b869;border-radius:22px;padding:19px;
 background:#122732f7;color:#f2f4ef;box-shadow:0 20px 100px #000b;font:13px Tahoma,Arial}
 #v31RacePanel[hidden],#v31RaceHud[hidden]{display:none}
 #v31RacePanel h2{color:#ffcf7b;font-size:22px;margin:0 0 10px}
 #v31RacePanel p{color:#c6d5d9;line-height:1.7}
 #v31RacePanel article{background:#213b47;border:1px solid #5b7682;border-radius:14px;
 padding:12px;margin:10px 0}
 #v31RacePanel article strong{font-size:15px;display:block;color:#ffe3a3}
 #v31RacePanel article small{display:block;color:#c7d4db;margin:8px 0;line-height:1.6}
 #v31RacePanel button{min-height:38px;border-radius:10px;padding:7px 12px;
 border:1px solid #91b4be;background:#2b5362;color:white;font:bold 12px Tahoma,Arial}
 #v31RacePanel .start{background:#d7a34e;border-color:#f7dc98;color:#192b30;width:100%}
 #v31RaceResult{background:#244936;color:#f5e9bd;padding:12px;margin:12px 0;
 border:1px solid #c5d479;border-radius:12px;line-height:1.8;font-weight:700}
 #v31RaceResult[hidden]{display:none}
 #v31RaceClose{float:left}
 #v31RaceHud{position:fixed;z-index:56;top:84px;left:50%;transform:translateX(-50%);
 width:min(340px,92vw);background:#112630ed;border:1px solid #f0bc68;border-radius:15px;
 color:#fff1d7;text-align:center;direction:rtl;box-shadow:0 9px 28px #0008;
 pointer-events:auto;padding:10px;font:bold 12px Tahoma,Arial}
 #v31RaceHud b{display:block;color:#ffcf7b;font-size:15px;margin-bottom:4px}
 #v31RaceStats{font-size:12px;line-height:1.8}
 #v31RaceLeaderboard{font-size:10px;line-height:1.6;color:#e3e6c3;
 border-top:1px solid #75868c8c;border-bottom:1px solid #75868c8c;padding:3px}
 #v31RaceHint{font-size:11px;color:#b9e7d6;line-height:1.5}
 #v31RaceQuit{border:1px solid #a57b68;border-radius:8px;color:#ffd4c1;background:#513129;
 padding:4px 9px;margin-top:5px;min-height:28px;font:10px Tahoma}
 #v31RaceCountdown{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);
 z-index:58;color:#ffe2a0;font:bold 66px Tahoma,Arial;text-shadow:0 4px 14px #111,
 0 0 35px #c87440;pointer-events:none}
 #v31RaceCountdown[hidden]{display:none}
 @media(max-width:760px){#v31RaceOpen{bottom:242px;left:9px;font-size:11px;min-height:38px}
 #v31RaceHud{top:70px;width:min(310px,90vw);font-size:11px;padding:7px}
 #v31RaceCountdown{font-size:52px}}
 @media(max-height:510px){#v31RaceOpen{bottom:93px;left:8px}
 #v31RacePanel{top:2vh;max-height:96vh}#v31RaceHud{top:8px;left:auto;right:12px;
 transform:none;width:250px}}
 #v31RacePanel article.worldRace{border-color:#55c6b48a;background:linear-gradient(120deg,#1c4448,#213641)}
 #v31RacePanel article.worldRace small{color:#c0f6ec}
 #v31RaceCountdown.go{color:#8affc5;text-shadow:0 0 35px #23d3a6;animation:v61RaceGo .42s ease-out}
 @keyframes v61RaceGo{from{opacity:.45;transform:translate(-50%,-50%) scale(1.6)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
 @media(prefers-reduced-motion:reduce){#v31RaceCountdown.go{animation:none}}
 `;
 document.head.append(style);
 const make=(tag,id,parent)=>{const el=document.createElement(tag);el.id=id;parent.append(el);return el};
 const open=make('button','v31RaceOpen',document.body);
 open.type='button';open.textContent='🏁 سباقات V100';
 const panel=make('section','v31RacePanel',document.body);
 panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','بطولات سباقات القاهرة');
 const hud=make('section','v31RaceHud',document.body);hud.hidden=true;
 const countdown=make('div','v31RaceCountdown',document.body);countdown.hidden=true;
 const header=make('h2','v31RaceTitle',panel);header.textContent='🏆 بطولات شوارع مصر';
 const close=make('button','v31RaceClose',panel);close.textContent='✕ إغلاق';
 const summary=make('p','v31RaceSummary',panel);
 const podium=make('div','v31RaceResult',panel);podium.hidden=true;
 const list=make('div','v31RaceList',panel);
 const hudTitle=make('b','v31RaceHudTitle',hud),stats=make('div','v31RaceStats',hud),
 leaderboard=make('div','v31RaceLeaderboard',hud),
 hint=make('div','v31RaceHint',hud),quit=make('button','v31RaceQuit',hud);
 quit.textContent='إلغاء السباق';quit.type='button';
 function persist(){try{storage?.setItem(KEY,JSON.stringify(history))}catch(e){}}
 const fmt=seconds=>{
  if(!Number.isFinite(seconds))return '--:--';
  const s=Math.max(0,seconds);return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')+'.'+String(Math.floor(s%1*10));
 };
 const pointsById=Object.fromEntries(CAIRO_RACES_V31.map(r=>[r.id,toPoints(r)]));
 // Mobile-friendly start beacons: shared geometry, no shadows, only visible nearby.
 const worldBeacons=[];
 if(T.TorusGeometry&&T.CylinderGeometry){
  const ringGeo=new T.TorusGeometry(3.2,.22,6,28);
  const beamGeo=new T.CylinderGeometry(.11,.11,4.4,6);
  const pinGeo=new T.SphereGeometry(.43,10,7);
  for(const course of CAIRO_RACES_V31.filter(c=>c.world)){
   const [x,z]=course.points[0],node=new T.Group();
   node.position.set(x,0,z);
   const mat=new T.MeshBasicMaterial({color:course.color,transparent:true,opacity:.88,depthWrite:false});
   const soft=new T.MeshBasicMaterial({color:course.color,transparent:true,opacity:.28,depthWrite:false});
   const ring=new T.Mesh(ringGeo,mat);ring.rotation.x=Math.PI/2;ring.position.y=.25;
   const beam=new T.Mesh(beamGeo,soft);beam.position.y=2.3;
   const pin=new T.Mesh(pinGeo,mat);pin.position.y=4.6;
   node.add(ring,beam,pin);node.visible=false;scene.add(node);
   worldBeacons.push({node,ring,pin,x,z});
  }
 }
 const raceArena=createRaceArenaV32({T,scene});
 const timeAttackV37=createTimeAttackV37({storage});
 function renderPanel(){
  summary.textContent='🏅 انتصارات: '+history.wins+' • سباقات: '+history.races+
    ' • أرباح مسابقات: '+history.earned+' ج.م • 🌆 6 بطولات في العالم المفتوح';
  list.replaceChildren();
  for(const course of CAIRO_RACES_V31){
   const c=make('article','',list);
   if(course.world)c.className='worldRace';
   const b=make('strong','',c);b.textContent=course.icon+' '+course.name;
   const small=make('small','',c);
   const best=history.best[course.id];
   small.textContent=course.world?
    '🌆 سباق مباشر في شوارع المدينة بدون انتقال للحلبة • 🏁 البداية '+Math.round(dist(getVehicle(),pointsById[course.id][0]))+
    'م من عربيتك • 🔁 '+course.laps+' لفة • 🚘 3 منافسين • ⭐ '+course.difficulty+
    ' • 🏆 المركز الأول +'+course.reward+' جنيه • أفضل زمن '+fmt(best)+
    ' • اقرب للعلامة المضيئة على الخريطة ووقف العربية عند البداية':course.kind==='drift'?
    '🏟️ الحلبة الفاضية • ⏱️ 90 ثانية • 🔥 درفت بالنقاط على الأسفلت • 🏅 برونز 200 / فضة 480 / ذهب 850 / أسطوري 1350 • 🏆 حتى 950 جنيه • أفضل رقم: '+history.bestDrift:
    course.kind==='timeattack'?
    '⏱️ لفة واحدة ضد الساعة • 👻 عربية شبح من أسرع محاولة سابقة • 🥇 أقل من 48ث / 🥈 72ث / 🥉 110ث • أفضل زمن: '+fmt(timeAttackV37.getHistory().bestTime):
    '🏟️ في الحلبة الفاضية بعيد عن زحمة المدينة • 🔁 '+course.laps+' لفة • 👥 3 منافسين • ⭐ '+course.difficulty+
     ' • 🏆 الأول +'+course.reward+' جنيه • أفضل زمن: '+fmt(best);
   const btn=make('button','',c);
   btn.type='button';btn.className='start';
   btn.textContent=course.world?'🚦 ابدأ سباق الشوارع':course.kind==='drift'?'🔥 ابدأ تحدّي الدرفت':
    course.kind==='timeattack'?'⏱️ اكسر رقمك القياسي':'🏁 ابدأ السباق';
   btn.disabled=!!active;
   btn.onclick=()=>start(course.id);
   if(course.world){
    const navButton=make('button','',c);
    navButton.type='button';
    navButton.className='v100RaceNavigate';
    navButton.textContent='🧭 اتجه إلى خط بداية السباق';
    navButton.disabled=!!active;
    navButton.onclick=()=>onNavigate(course,pointsById[course.id][0]);
   }
  }
 }
 function openPanel(){if(!getActive()){notify('ابدأ اللعب الأول');return}
  renderPanel();panel.hidden=false}
 open.onclick=openPanel;
 close.onclick=()=>{panel.hidden=true};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});
 const models=[];
 for(let i=0;i<3;i++){
  const m=createRacerModel(T,'formula',[0x387ca6,0xd44440,0xeec864][i]);
  scene.add(m);models.push(m);
 }
 const formulaPlayer=createRacerModel(T,'formula',0xd52e3e);
 const motoPlayer=createRacerModel(T,'moto',0xc83b3b);
 const timeGhostV37=createRacerModel(T,'street',0x63eee1);
 timeGhostV37.traverse(node=>{
  if(node.material){node.material.transparent=true;node.material.opacity=.26;
   node.material.depthWrite=false}
 });
 scene.add(formulaPlayer,motoPlayer,timeGhostV37);
 timeGhostV37.visible=false;
 let marker=null,beam=null,startingLine=null;
 if(T.TorusGeometry&&T.CylinderGeometry){
  marker=new T.Mesh(new T.TorusGeometry(2.3,.22,6,24),
   new T.MeshBasicMaterial({color:0xffd26e,transparent:true,opacity:.93,side:T.DoubleSide}));
  marker.rotation.x=Math.PI/2;scene.add(marker);marker.visible=false;
  beam=new T.Mesh(new T.CylinderGeometry(.10,.10,4.7,8),
   new T.MeshBasicMaterial({color:0xf8d57b,transparent:true,opacity:.26}));
  scene.add(beam);beam.visible=false;
  startingLine=new T.Mesh(new T.BoxGeometry(9,.03,.38),
   new T.MeshBasicMaterial({color:0xfff4d9}));
  scene.add(startingLine);startingLine.visible=false;
 }
 function updateMarker(){
  if(!active||!marker)return;
  const next=active.points[(active.steps+1)%active.points.length];
  marker.position.set(next.x,.23,next.z);
  beam.position.set(next.x,2.15,next.z);
  marker.visible=beam.visible=true;
 }
 function resetModels(){
  for(const m of models)m.visible=false;
  if(marker)marker.visible=beam.visible=startingLine.visible=false;
  formulaPlayer.visible=false;motoPlayer.visible=false;
  timeGhostV37.visible=false;
 }
 function configureModels(kind){
  for(let i=0;i<3;i++){
   const old=models[i];scene.remove(old);
   old.traverse?.(obj=>{obj.geometry?.dispose?.();obj.material?.dispose?.()});
   models[i]=createRacerModel(T,kind,[0x3c89ad,0xd34143,0xe8be58][i]);
   scene.add(models[i]);models[i].visible=true;
  }
 }
 function start(id){
  if(active){notify('خلّص السباق الحالي الأول');return false}
  if(!getActive()||getPaused()){notify('شغّل اللعبة وافتحها قبل السباق');return false}
  const course=CAIRO_RACES_V31.find(c=>c.id===id);
  if(!course)return false;
  const pts=pointsById[id],first=pts[0],second=pts[1];
  if(course.world){
   const away=dist(getVehicle(),first);
   if(away>18){notify('📍 روح لنقطة بداية '+course.name+' — لسه '+Math.round(away)+' متر');return false}
   if(Math.abs(Number(getVehicle().speed)||0)>3){notify('🛑 هدي سرعتك تحت 11 كم/س عند خط البداية');return false}
  }
  if(!getDriving()&&!requestDrive()){notify('🚗 اركب العربية الأول، وبعدها ابدأ السباق');return false}
  const yaw=Math.atan2(second.x-first.x,second.z-first.z);
  if(prepareCar(course,{x:first.x,z:first.z,yaw})===false)return false;
  if(!course.world)raceArena.show();
  const driftMode=course.kind==='drift',timeMode=course.kind==='timeattack';
  if(driftMode||timeMode)resetModels();
  else configureModels(course.kind);
  const enemies=driftMode||timeMode?[]:models.map((model,i)=>{
   // Real starting grid: competitors are staged ahead on the actual asphalt,
   // not in the unpaved infield or outside the circuit.
   const gap=Math.min((i+1)*5.8,Math.max(0,dist(first,second)-2)),side=[-1.8,1.8,0][i];
   model.position.set(first.x+Math.sin(yaw)*gap+Math.cos(yaw)*side,0,
    first.z+Math.cos(yaw)*gap-Math.sin(yaw)*side);
   model.rotation.y=yaw;
   return {model,name:['الأزرق','الأحمر','الذهبي'][i],steps:0,
    segment:gap,seconds:0,finished:false,finishTime:Infinity,
    speed:course.speed*[1.03,.94,1.10][i],pace:course.speed*.48,lane:[-1.35,1.35,0][i],
    progress:gap/Math.max(1,dist(first,second))};
  });
  active={id,course,points:pts,steps:0,lap:0,elapsed:0,lapStart:0,bestLap:Infinity,
   count:3.0,phase:'countdown',enemies,lastPosition:null,rank:4,startingHealth:100,
   driftChallenge:driftMode?createTimedDriftV35({points:pts,duration:course.duration}):null,
   timeAttack:timeMode?timeAttackV37:null,
   driftScore:0,driftMedal:'none'};
  panel.hidden=true;podium.hidden=true;hud.hidden=false;
  document.body.classList.add('racingActive');
  if(startingLine){
   startingLine.position.set(first.x,.11,first.z);startingLine.rotation.y=yaw;
   startingLine.visible=true;
  }
  if(course.kind==='formula')formulaPlayer.visible=true;
  if(course.kind==='moto')motoPlayer.visible=true;
  if(driftMode){if(marker)marker.visible=false;if(beam)beam.visible=false}
  else updateMarker();
  if(timeMode&&timeAttackV37.getHistory().hasGhost){
   const p=timeAttackV37.getGhost(0);
   timeGhostV37.position.set(p.x,0,p.z);
   timeGhostV37.rotation.y=p.yaw;timeGhostV37.visible=true;
  }
  lastCountdown=0;
  notify(course.world?'🚦 '+course.name+' — اتبع النقاط على الخريطة ونافس 3 عربيات من غير ما تخرج من القاهرة!':driftMode?'🔥 تحدّي الدرفت 90 ثانية: لف واضغط زر درفت على الأسفلت!':
    timeMode?'⏱️ لفة واحدة: اكسر رقمك القياسي! عربيتك الشبح من أسرع لفة سابقة 👻':
    '🏁 وصلت حلبة السباق الفاضية! '+course.name+' — '+course.laps+' لفة');
  updateHud(true);return true;
 }
 function updateHud(force=false){
  if(!active){hud.hidden=true;countdown.hidden=true;return}
  const a=active,course=a.course;
  hudTitle.textContent=course.icon+' '+course.name;
  if(a.timeAttack){
   const record=a.timeAttack.getHistory(),remaining=Math.max(0,a.course.duration-a.elapsed);
   stats.textContent='⏱️ '+fmt(a.elapsed)+' • باقي '+Math.ceil(remaining)+'ث • لفة 1/1';
   leaderboard.textContent=record.hasGhost?'👻 أسرع شبح: '+fmt(record.bestTime):
      '👻 أول محاولة: احفظ رقمك القياسي';
   const next=a.points[(a.steps+1)%a.points.length];
   hint.textContent=a.phase==='countdown'?'🚦 استعد! ابدأ بعد العدّ التنازلي':
      '🏁 نقطة '+(a.steps%a.points.length+1)+'/'+a.points.length+
      ' • '+Math.round(dist(getVehicle(),next))+'م • أسرع من '+fmt(record.bestTime)+'؟';
   return;
  }
  if(a.driftChallenge){
   const result=a.driftChallenge.getState();
   stats.textContent='🔥 نقاط '+result.score+' • ⏱️ متبقي '+Math.ceil(result.remaining)+' ثانية';
   leaderboard.textContent='🥉 200 • 🥈 480 • 🥇 850 • 👑 1350';
   hint.textContent=a.phase==='countdown'?'🚦 جهّز الدركسيون وزر درفت':
     (result.onTrack?'✅ على الأسفلت':'⚠️ ارجع لمسار الحلبة')+
     ' • '+(result.quality>0?'🔥 درفت ×'+result.comboMultiplier.toFixed(1):'ابدأ اللفة واثبت الانزلاق')+
     ' • رقمك: '+history.bestDrift;
   return;
  }
  stats.textContent='🏆 الترتيب '+a.rank+'/4 • 🔁 اللفة '+Math.min(course.laps,a.lap+1)+'/'+course.laps+
   ' • ⏱️ '+fmt(a.elapsed);
  leaderboard.textContent=a.standings?.length?
   a.standings.map((p,i)=>(i+1)+'-'+p.name).join(' • '):
   '1-الذهبي • 2-الأزرق • 3-الأحمر • 4-إنت';
  const next=a.points[(a.steps+1)%a.points.length];
  hint.textContent=a.phase==='countdown'?'🚦 الاستعداد للانطلاق...':
   '🟡 نقطة المرور: '+(a.steps%a.points.length+1)+'/'+a.points.length+
   ' • متبقّي '+Math.round(dist(getVehicle(),next))+'م • أفضل لفة '+fmt(a.bestLap);
 }
 function finish(won=false,forfeit=false){
  if(!active)return;
  const a=active,course=a.course,driftMode=!!a.driftChallenge,
   driftResult=driftMode?a.driftChallenge.getState():null,
   rank=a.timeAttack?1:driftMode?(driftResult.medal==='elite'||driftResult.medal==='gold'?1:
        driftResult.medal==='silver'?2:driftResult.medal==='bronze'?3:4):
        (forfeit?4:a.rank),
   completed=a.phase==='racing'&&!forfeit&&won;
  if(a.timeAttack&&!completed)a.timeAttack.abort();
  if(completed&&a.timeAttack){
   const result=a.timeAttack.finish(a.elapsed,getVehicle(),{valid:true});
   if(result.accepted){
    history.races++;history.wins++;history.earned+=result.reward;
    history.best[a.id]=result.best;persist();
    if(result.reward>0)onReward(result.reward,course,1);
    const medal=result.medal==='gold'?'🥇 ذهب':result.medal==='silver'?'🥈 فضة':
      result.medal==='bronze'?'🥉 برونز':'🏁 إكمال';
    podium.hidden=false;
    podium.textContent='⏱️ تحدّي الرقم القياسي • '+fmt(result.time)+' • '+medal+
     ' • '+(result.personalBest?'🎉 رقم قياسي جديد!':'أفضل رقم '+fmt(result.best))+
     ' • +'+result.reward+' جنيه';
    notify('🏁 '+(result.personalBest?'رقم قياسي جديد! ':'')+
       'زمنك '+fmt(result.time)+' • +'+result.reward+' جنيه');
   }
  }else if(completed&&driftMode){
   // Only time expiry ends a drift event. Quitting or closing gives no prize.
   history.races++;history.driftChallenges++;
   if(rank===1)history.wins++;
   history.bestDrift=Math.max(history.bestDrift,driftResult.score);
   const amount=driftResult.reward;
   history.earned+=amount;
   if(amount>0)onReward(amount,course,rank);
   persist();
   podium.hidden=false;
   const medal=driftResult.medal==='elite'?'👑 أسطوري':
      driftResult.medal==='gold'?'🥇 ذهب':driftResult.medal==='silver'?'🥈 فضة':
      driftResult.medal==='bronze'?'🥉 برونز':'بدون ميدالية';
   podium.textContent='🔥 تحدّي الدرفت انتهى • '+medal+
    ' • '+driftResult.score+' نقطة • مكافأة '+amount+' جنيه • أفضل رقم '+history.bestDrift;
   notify('🏁 التحدّي انتهى! '+driftResult.score+' نقطة • '+medal);
  }else if(completed){
   history.races++;
   if(rank===1)history.wins++;
   if(!Number.isFinite(history.best[a.id])||a.elapsed<history.best[a.id])
    history.best[a.id]=a.elapsed;
   if(!Number.isFinite(history.bestLap[a.id])||a.bestLap<history.bestLap[a.id])
    history.bestLap[a.id]=a.bestLap;
   const amount=rank===1?course.reward:rank===2?Math.round(course.reward*.50):
    rank===3?Math.round(course.reward*.22):100;
   history.earned+=amount;
   onReward(amount,course,rank);persist();
   podium.hidden=false;
   podium.textContent=(rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'🏁')+
     ' '+course.name+' — المركز '+rank+'/4 • الزمن '+fmt(a.elapsed)+
     ' • أسرع لفة '+fmt(a.bestLap)+' • المكافأة +'+amount+' جنيه';
   notify('🏆 خلصت '+course.name+' • المركز '+rank+'/4 • +'+amount+' جنيه');
  }else{podium.hidden=true;notify('⛔ خرجت من سباق '+course.name)}
  active=null;resetModels();if(!course.world)raceArena.hide();restoreCar(course);
  hud.hidden=true;countdown.hidden=true;document.body.classList.remove('racingActive');
  onFinish(course,completed,rank,{elapsed:a.elapsed,bestLap:a.bestLap,driftScore:a.driftScore});
  renderPanel();
  if(completed)panel.hidden=false;
 }
 quit.onclick=()=>finish(false,true);
 function updateOpponents(a,dt,t){
  const n=a.points.length;
  for(const enemy of a.enemies){
   if(enemy.finished)continue;
   // V150: AI anticipates corners and gives the player's car space.
   // Velocity changes are acceleration-limited, never instant multipliers.
   const u=enemy.model.userData;
   const targetPace=targetOpponentSpeedV150({
    baseSpeed:enemy.speed,points:a.points,steps:enemy.steps,
    segment:enemy.segment,player:getVehicle(),
    position:enemy.model.position,lane:enemy.lane,crashHold:u.crashHold>t
   });
   enemy.pace=evolveOpponentSpeedV150(enemy.pace,targetPace,dt);
   let remaining=enemy.pace*dt;
   u.actualCruise=enemy.pace;
   let len=0;
   for(let guard=0;guard<3&&remaining>0;guard++){
    const index=enemy.steps%n,pointA=a.points[index],pointB=a.points[(index+1)%n];
    len=Math.max(.01,dist(pointA,pointB));
    const run=Math.min(remaining,len-enemy.segment);
    enemy.segment+=run;remaining-=run;
    if(enemy.segment>=len-.001){
     enemy.steps++;enemy.segment=0;
     if(enemy.steps>=a.course.laps*n){
      enemy.finished=true;enemy.finishTime=a.elapsed;enemy.progress=a.course.laps*n;
      break;
     }
    }
   }
   const index=enemy.steps%n,p0=a.points[index],p1=a.points[(index+1)%n],
    segmentLength=Math.max(1,dist(p0,p1)),fraction=clamp(enemy.segment/segmentLength,0,1);
   const face=Math.atan2(p1.x-p0.x,p1.z-p0.z);
   const sideX=Math.cos(face)*enemy.lane,sideZ=-Math.sin(face)*enemy.lane;
   enemy.model.position.set(p0.x+(p1.x-p0.x)*fraction+sideX,0,
    p0.z+(p1.z-p0.z)*fraction+sideZ);
   // Continuous steering animation; avoid instant 90-degree yaw snaps.
   const turn=Math.atan2(Math.sin(face-enemy.model.rotation.y),Math.cos(face-enemy.model.rotation.y));
   enemy.model.rotation.y+=turn*clamp(dt*6.5,0,1);
   enemy.model.userData.axis=Math.abs(Math.sin(face))>.5?'x':'z';
   enemy.model.userData.direction=enemy.model.userData.axis==='x'?
      (Math.sin(face)>=0?1:-1):(Math.cos(face)>=0?1:-1);
   enemy.progress=enemy.steps+fraction;
   for(const wheel of enemy.model.userData.wheels||[])
    wheel.userData.rolling.rotation.x+=enemy.pace*dt/(wheel.userData.radius||.4);
  }
 }
 function update(dt,t=0){
  open.hidden=!getActive();
  // Show 3D event pins only within visual range; hide them during races.
  for(const b of worldBeacons){
   const near=!!getActive()&&!active&&!document.hidden&&dist(getVehicle(),b)<125;
   b.node.visible=near;
   if(near){b.ring.rotation.z+=Math.min(.04,dt*.65);
    b.pin.position.y=4.6+Math.sin(t*.002)*.18}
  }
  if(!active||!getActive()||getPaused()||document.hidden)return;
  const a=active,car=getVehicle();
  if(!getDriving()){finish(false,true);return}
  if(a.phase==='countdown'){
   a.count-=clamp(dt,0,.05);
   const num=a.count>0?Math.ceil(a.count):0;
   countdown.hidden=false;countdown.textContent=num?String(num):'GO!';
   countdown.classList.toggle('go',num===0);
   if(num!==lastCountdown){lastCountdown=num;onCountdown(num)}
   if(a.count<=-.65){
    a.phase='racing';countdown.hidden=true;a.elapsed=0;a.lapStart=0;
    if(a.timeAttack)a.timeAttack.begin(car);
   }
   updateHud();return;
  }
  const delta=clamp(dt,0,.05);
  if(a.driftChallenge){
   const control=getDriftInput()||{};
   const result=a.driftChallenge.update(delta,{
    vehicle:car,holding:!!control.holding
   });
   a.elapsed=result.elapsed;a.driftScore=result.score;a.driftMedal=result.medal;
   if(result.finished){finish(true);return}
   if(t-lastUiAt>130){updateHud();lastUiAt=t}
   return;
  }
  a.elapsed+=delta;
  if(a.timeAttack){
   a.timeAttack.record(a.elapsed,car);
   if(timeGhostV37.visible){
    const ghost=a.timeAttack.getGhost(a.elapsed);
    if(ghost){timeGhostV37.position.set(ghost.x,0,ghost.z);
      timeGhostV37.rotation.y=ghost.yaw}
   }
   if(a.elapsed>=a.course.duration){finish(false,true);
    notify('⌛ وقت الرقم القياسي خلص! جرّب من جديد');return}
  }
  // Sequential ordered checkpoints; unrelated shortcuts never advance a race.
  const updated=checkpointProgressV31(a.points,car.x,car.z,a.steps);
  if(updated>a.steps){
   a.steps=updated;
   updateMarker();
   if(a.steps%a.points.length===0){
    const lapSeconds=a.elapsed-a.lapStart;
    a.bestLap=Math.min(a.bestLap,lapSeconds);
    a.lapStart=a.elapsed;a.lap++;
    notify(a.lap>=a.course.laps?'🏁 خط النهاية!':'✅ لفة '+a.lap+' خلصت في '+fmt(lapSeconds));
   }
  }
  updateOpponents(a,delta,t);
  const playerProgress=raceProgressV31(a.points,a.steps,car);
  const standings=rankRacersV31([
   {name:'إنت',player:true,progress:playerProgress,time:a.elapsed},
   ...a.enemies.map(enemy=>({name:enemy.name,progress:enemy.progress,time:enemy.finishTime}))
  ]);
  a.standings=standings;
  a.rank=standings.findIndex(x=>x.player)+1;
  if(a.steps>=a.course.laps*a.points.length){finish(true);return}
  // Race timeout: players cannot farm awards by leaving the game idling.
  if(a.elapsed>Math.max(210,a.course.laps*200)){finish(false,true);notify('⏱️ وقت السباق خلص');return}
  if(t-lastUiAt>160){updateHud();lastUiAt=t}
 }
 open.hidden=!getActive();
 window.addEventListener('pagehide',persist);
 renderPanel();
 return {start,update,finish,openPanel,getRace:()=>active?{
   id:active.id,kind:active.course.kind,phase:active.phase,steps:active.steps,
   totalSteps:active.course.laps*active.points.length,lap:active.lap,laps:active.course.laps,rank:active.rank,
   elapsed:active.elapsed,waypoint:active.driftChallenge?null:
      active.points[(active.steps+1)%active.points.length],
   driftScore:active.driftScore,driftMedal:active.driftMedal
  }:null,
  getArena:()=>raceArena,
  isFormula:()=>active?.id==='formula',
  getPlayerRaceModel:kind=>kind==='moto'?motoPlayer:formulaPlayer,
  getPlayerFormula:()=>formulaPlayer,
  getOpponents:()=>active?active.enemies.filter(x=>!x.finished).map(x=>x.model):[],
  getGhostPosition:()=>active?.timeAttack&&timeGhostV37.visible?
    {x:timeGhostV37.position.x,z:timeGhostV37.position.z}:null,
  getHistory:()=>({...history}),getTimeAttackHistory:()=>timeAttackV37.getHistory(),
  getCourses:()=>CAIRO_RACES_V31,
  isRunning:()=>!!active};
}
