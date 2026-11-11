// Street interactions and repeatable side events for Egypt Street.
// Uses existing 40 residents and keeps all geometry local/low-poly for mobile.
export const STREET_EVENTS = [
 {id:'wallet',title:'محفظة واقعة',ask:'محفظتي وقعت مني في الشارع، ممكن تساعدني ألاقيها؟',found:'لقيت المحفظة! رجّعها لصاحبها.',thanks:'تسلم يا جدع، ربنا يكرمك!',reward:90,color:0xf3be62,shape:'wallet'},
 {id:'tools',title:'عدة الميكانيكي',ask:'شنطة العِدّة وقعت مني، تجيبها من عند الناصية؟',found:'جبت شنطة العدة. ارجع لصاحبها.',thanks:'كتر خيرك يا معلم، أنقذت اليوم!',reward:120,color:0x79c5cf,shape:'toolbox'},
 {id:'groceries',title:'طلب البقالة',ask:'الكيس اتساب هناك، تساعدني أرجّعه قبل ما المحل يقفل؟',found:'الطلب معاك. سلّمه لصاحبه.',thanks:'الله ينور عليك، إيدك تتلف في حرير!',reward:70,color:0x8ccc86,shape:'parcel'},
 {id:'phone',title:'موبايل ضايع',ask:'موبايلي ضاع وأنا ماشي، شوفه قريب من هنا لو سمحت.',found:'الموبايل معاك. ارجع وسلّمه.',thanks:'أنا كنت هتجنن عليه، ألف شكر!',reward:110,color:0xc89cef,shape:'phone'},
 {id:'papers',title:'أوراق مهمة',ask:'الورق طار مني بسبب الهوا، هاته من قدام العمارة!',found:'جمعت الأوراق، رجعها لصاحبها.',thanks:'إنت أصيل والله، تسلم!',reward:85,color:0xf39c79,shape:'papers'}
];
const sq=n=>n*n;
const dist2=(a,b)=>sq(a.x-b.x)+sq(a.z-b.z);
export function createStreetEvents({T,scene,people,getPlayer,getDriving,isWalkable,onReward,ui}){
 const card=ui.card,interactButton=ui.interact,dialog=ui.dialog,eventTitle=ui.title,eventText=ui.text;
 let running=false,elapsed=0,phase='idle',current=null,npc=null,target=null,remaining=0,eventIndex=-1,near=null,lastMessage=0,nextTime=0,ambientTime=26;
 const clean=(value)=>String(value||'');
 function showMessage(message,seconds=3.4){
  dialog.textContent=clean(message);dialog.style.display='block';
  lastMessage=elapsed+seconds;
 }
 function material(color,opacity=1){return new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1})}
 const gold=material(0xffd476),white=material(0xfff3c7);
 function mesh(group,geometry,m,x,y,z){
  const obj=new T.Mesh(geometry,m);obj.position.set(x,y,z);group.add(obj);return obj;
 }
 function makeMarker(){
  const root=new T.Group();
  const ring=mesh(root,new T.TorusGeometry(1.15,.11,6,20),gold,0,.24,0);
  ring.rotation.x=Math.PI/2;
  mesh(root,new T.CylinderGeometry(.075,.075,2.2,8),material(0xffc95d,.65),0,1.5,0);
  mesh(root,new T.SphereGeometry(.24,10,7),white,0,2.85,0);
  root.visible=false;scene.add(root);return root;
 }
 function makeObject(){
  const root=new T.Group(),wood=material(0x8f593f),steel=material(0x4e6570),tan=material(0xd6b77b);
  const base=mesh(root,new T.BoxGeometry(.76,.42,.52),wood,0,.28,0);
  const lid=mesh(root,new T.BoxGeometry(.82,.10,.56),tan,0,.54,0);
  mesh(root,new T.BoxGeometry(.12,.12,.07),steel,0,.38,.29);
  root.visible=false;scene.add(root);return {root,base,lid};
 }
 const marker=makeMarker(),itemMarker=makeMarker(),item=makeObject();
 // Choose a person who is not standing inside a wall and is reachable from the player.
 function choosePerson(){
  const p=getPlayer();
  return [...people].filter(c=>c.visible!==false&&isWalkable(c.position.x,c.position.z))
    .sort((a,b)=>dist2(a.position,p)-dist2(b.position,p))
    .find(c=>dist2(c.position,p)>18) ||
   [...people].filter(c=>isWalkable(c.position.x,c.position.z))
    .sort((a,b)=>dist2(a.position,p)-dist2(b.position,p))[0]||null;
 }
 function clearMarkers(){
  marker.visible=false;itemMarker.visible=false;item.root.visible=false;
  if(npc&&npc.userData?.streetEventLock){
   npc.userData.rest=0;delete npc.userData.streetEventLock;
  }
  npc=null;target=null;near=null;
 }
 function reachable(a,b){
  const n=Math.max(2,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.75));
  for(let i=1;i<=n;i++){
   const f=i/n, x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;
   if(!isWalkable(x,z))return false;
  }
  return true;
 }
 function chooseTarget(){
  // Prefer a location on the same clear sidewalk as the NPC; no impossible path through a building.
  const a=npc.position;
  const offsets=[[9,0],[-9,0],[0,9],[0,-9],[13,0],[-13,0],[0,13],[0,-13],
   [6,6],[-6,6],[6,-6],[-6,-6]];
  for(let j=0;j<offsets.length;j++){
   const [dx,dz]=offsets[(j+(eventIndex*3+offsets.length)%offsets.length)%offsets.length];
   const goal={x:a.x+dx,z:a.z+dz};
   if(reachable(a,goal))return goal;
  }
  // Always retain a reachable fallback close to a resident.
  return {x:a.x,z:a.z};
 }
 function setPhase(next){phase=next;updateUI()}
 function spawnEvent(){
  clearMarkers();
  npc=choosePerson();
  if(!npc){phase='idle';nextTime=elapsed+8;return}
  eventIndex=(eventIndex+1)%STREET_EVENTS.length;
  current=STREET_EVENTS[eventIndex];
  npc.userData.streetEventLock=true;
  npc.userData.rest=1e9;
  target=chooseTarget();
  phase='offer';remaining=150;
  showMessage('حدث في الشارع: '+current.title+' — شوف العلامة الصفراء على الخريطة',4.8);
  updateUI();
 }
 function start(){
  if(running)return;
  running=true;nextTime=2;ambientTime=18;
 }
 function nearestResident(){
  const p=getPlayer();
  let best=null,closest=3.3*3.3;
  for(const person of people){
   const d=dist2(person.position,p);
   if(d<closest){closest=d;best=person}
  }
  return best;
 }
 function markNPC(){
  if(!npc)return;
  marker.visible=(phase==='offer'||phase==='return');
  if(marker.visible)marker.position.set(npc.position.x,0,npc.position.z);
 }
 function updateUI(){
  const hasEvent=phase==='offer'||phase==='collect'||phase==='return';
  card.style.display=hasEvent?'block':'none';
  if(hasEvent){
   eventTitle.textContent=(phase==='offer'?'📢 ':phase==='collect'?'🔎 ':'✅ ')+current.title;
   const npcName=clean(npc.userData.name);
   eventText.textContent=phase==='offer'?'اتكلم مع '+npcName+' عند العلامة الصفراء':
     phase==='collect'?'دور على الحاجة عند العلامة الزرقاء':
     'ارجع لـ'+npcName+' عشان تخلص المهمة';
  }
 }
 function interact(){
  if(!running||getDriving())return false;
  const p=getPlayer(),p2=(o)=>dist2(p,o);
  if((phase==='offer'||phase==='return')&&npc&&p2(npc.position)<sq(3.8)){
   const u=npc.userData;
   u.waveUntil=performance.now()+2200;
   if(phase==='offer'){
    showMessage(u.name+': '+current.ask,6);
    setPhase('collect');
   }else{
    showMessage(u.name+': '+current.thanks+' +'+current.reward+' جنيه',5);
    onReward(current.reward,current);
    clearMarkers();phase='idle';current=null;nextTime=elapsed+13;
    updateUI();
   }
   return true;
  }
  if(phase==='collect'&&target&&p2(target)<sq(3.2)){
   showMessage(current.found,4.8);
   setPhase('return');return true;
  }
  const person=nearestResident();
  if(person){
   const role=person.userData.role;
   const lines=[
    'إزيك يا باشا! الدنيا زحمة النهارده.',
    'صباح الفل، خلي بالك من العربيات.',
    'نورت الشارع يا كبير!',
    'ربنا يسهّل أمورك يا محترم.'
   ];
   const id=person.userData.id||0;
   showMessage(person.userData.name+' ('+role+'): '+lines[id%lines.length],4.5);
   person.userData.waveUntil=performance.now()+2200;
   return true;
  }
  showMessage('قرب من أي حد في الشارع واضغط اتفاعل.',2.5);
  return false;
 }
 function horn(){
  if(!running)return;
  const p=getPlayer();
  let react=0;
  for(const person of people){
   if(dist2(person.position,p)<sq(14)){
    person.userData.startledUntil=performance.now()+1300;
    react++;
   }
  }
  if(react>0&&elapsed>8)showMessage('الناس بصّت ناحية العربية بعد الكلاكس!',2);
 }
 function update(dt,t){
  if(!running)return;
  elapsed+=dt;
  if(lastMessage&&elapsed>lastMessage){dialog.style.display='none';lastMessage=0}
  if(phase==='idle'&&elapsed>=nextTime)spawnEvent();
  if((phase==='offer'||phase==='collect'||phase==='return')&&remaining>0){
   remaining-=dt;
   if(remaining<=0){
    showMessage('الحدث انتهى، هيظهر موقف جديد بعد شوية.',3.3);
    clearMarkers();current=null;phase='idle';nextTime=elapsed+12;updateUI();
   }
  }
  const player=getPlayer(),foot=!getDriving();
  near=null;let label='';
  if(foot){
   if((phase==='offer'||phase==='return')&&npc&&dist2(player,npc.position)<sq(3.8)){
    near=npc;label=phase==='offer'?'اتكلم':'سلّم الطلب';
   }else if(phase==='collect'&&target&&dist2(player,target)<sq(3.2)){
    near=target;label='التقط';
   }else if(nearestResident()){
    near=nearestResident();label='اتكلم';
   }
  }
  interactButton.style.display=near?'block':'none';
  interactButton.textContent=near?'💬 '+label:'';
  markNPC();
  marker.position.y=Math.sin(t*.0028)*.13;
  if(phase==='collect'&&target){
   item.root.visible=itemMarker.visible=true;
   item.root.position.set(target.x,0,target.z);
   item.root.rotation.y+=dt*.65;
   itemMarker.position.set(target.x,Math.sin(t*.003)*.13,target.z);
  }else{item.root.visible=false;itemMarker.visible=false}
  if(phase!=='idle'&&elapsed>ambientTime&&elapsed>14){
   ambientTime=elapsed+38;
   // Ambient street-life messages without adding heavy audio/assets.
   const snippets=['الشارع زحمة والناس رايحة شغلها.','صوت عربية فول من بعيد!','قهوة البلد مليانة ناس.','بياع بينادي على بضاعته في الناصية.'];
   showMessage(snippets[Math.floor(elapsed/38)%snippets.length],2.4);
  }
 }
 function waypoint(){
  if(phase==='collect')return target;
  if(phase==='offer'||phase==='return')return npc?.position||null;
  return null;
 }
 return {start,update,interact,horn,waypoint,getState:()=>({phase,event:current?.id||null,remaining,hasNPC:!!npc,target})};
}
