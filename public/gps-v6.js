// Egypt Streets V6: A* street navigation on the actual Cairo road corridors.
// All points are game coordinates, not real map geolocation.
const X=[-95,-60,-30,0,30,60,94],Z=[-133,-93,-60,-30,0,30,60,93,133];
const INNER_X=new Set([-60,-30,0,30,60]),INNER_Z=new Set([-60,-30,0,30,60]);
const OUTER_Z=new Set([-133,-93,93,133]);
const BRIDGE_Z=new Set([-60,0,60]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const id=(x,z)=>x+':'+z;
function roadHorizontal(z,x1,x2){
 if(OUTER_Z.has(z))return true;
 if(!INNER_Z.has(z))return false;
 return INNER_X.has(x1)&&INNER_X.has(x2)||
   BRIDGE_Z.has(z)&&((x1===60&&x2===94)||(x1===-95&&x2===-60));
}
function roadVertical(x,z1,z2){
 if(x===-95||x===94)return true;
 return INNER_X.has(x)&&INNER_Z.has(z1)&&INNER_Z.has(z2);
}
export const ROAD_NODES=X.flatMap(x=>Z.map(z=>({x,z,id:id(x,z)})));
const EDGES=new Map(ROAD_NODES.map(n=>[n.id,[]]));
for(const a of ROAD_NODES)for(const b of ROAD_NODES){
 if(a===b)continue;
 if(a.z===b.z&&Math.abs(X.indexOf(a.x)-X.indexOf(b.x))===1&&roadHorizontal(a.z,Math.min(a.x,b.x),Math.max(a.x,b.x))||
    a.x===b.x&&Math.abs(Z.indexOf(a.z)-Z.indexOf(b.z))===1&&roadVertical(a.x,Math.min(a.z,b.z),Math.max(a.z,b.z)))
   EDGES.get(a.id).push({id:b.id,cost:dist(a,b)});
}
export function nearestRoadNode(position,yaw=null){
 let best=null,value=Infinity;
 for(const n of ROAD_NODES){
  if(!EDGES.get(n.id).length)continue;
  const dx=n.x-position.x,dz=n.z-position.z,range=Math.hypot(dx,dz);
  const headingPenalty=(yaw===null||range<4)?0:Math.max(0,-(dx*Math.sin(yaw)+dz*Math.cos(yaw))/Math.max(1,range))*18;
  const score=range+headingPenalty;
  if(score<value){best=n;value=score}
 }
 return best;
}
function onRoad(x,z){
 // Main tarmac corridors and the western/eastern ring connectors.
 return (Math.abs(x+95)<4.8||Math.abs(x-94)<4.8)&&Math.abs(z)<=166 ||
   [...INNER_X].some(v=>Math.abs(x-v)<4.6)&&Math.abs(z)<=85 ||
   [...OUTER_Z].some(v=>Math.abs(z-v)<4.6)&&x>=-145&&x<=109 ||
   [...INNER_Z].some(v=>Math.abs(z-v)<4.8)&&x>=-85&&x<=105;
}
export function planRoadRoute(from,destination,yaw=null){
 if(!from||!destination||![from.x,from.z,destination.x,destination.z].every(Number.isFinite))return null;
 const first=nearestRoadNode(from,yaw),last=nearestRoadNode(destination);
 if(!first||!last)return null;
 const frontier=new Set([first.id]),score=new Map([[first.id,0]]),previous=new Map();
 const guess=id=>{const n=ROAD_NODES.find(v=>v.id===id);return dist(n,last)};
 while(frontier.size){
  let current=null,f=Infinity;
  for(const n of frontier){const t=(score.get(n)||0)+guess(n);if(t<f){current=n;f=t}}
  if(current===last.id)break;
  frontier.delete(current);
  for(const e of EDGES.get(current)){
   const cost=score.get(current)+e.cost;
   if(cost<(score.get(e.id)??Infinity)){
    score.set(e.id,cost);previous.set(e.id,current);frontier.add(e.id)
   }
  }
 }
 if(!score.has(last.id))return null;
 const path=[];
 for(let n=last.id;n;n=previous.get(n)){
  const point=ROAD_NODES.find(v=>v.id===n);
  if(point)path.push({x:point.x,z:point.z});
  if(n===first.id)break;
 }
 path.reverse();
 // Last approach only if the target itself is safely on a paved road.
 const lastRoad=path[path.length-1];
 const direct=dist(lastRoad,destination);
 const isAligned=onRoad(destination.x,destination.z)&&
  (Math.abs(destination.x-lastRoad.x)<4.2||Math.abs(destination.z-lastRoad.z)<4.2);
 const footDistance=direct;
 const walkLast=direct>5.5&&!isAligned;
 if(isAligned&&direct>4){
  path.push({x:clamp(destination.x,-211,211),z:clamp(destination.z,-164,164)});
 }
 // Return a safe street-access point; never command a car through an interior courtyard.
 if(!path.length)path.push({x:first.x,z:first.z});
 let total=dist(from,path[0]);
 for(let i=1;i<path.length;i++)total+=dist(path[i-1],path[i]);
 return {path,distance:total,walkLast,walkDistance:walkLast?footDistance:0,goal:{x:destination.x,z:destination.z}};
}
export function createGpsV6({ui,autoDriver,getCar,getJob,getDelivery,getSideEvent,getStations,notify,isDriving}){
 let mode='tour',label='لفة في القاهرة',lastPoint=null,refresh=0;
 const modes={job:'الشغل',delivery:'طلب توصيل',side:'حدث جانبي',fuel:'أقرب بنزينة',tour:'لفة في البلد'};
 function destinationFor(next){
  const car=getCar();
  if(next==='job')return getJob()||null;
  if(next==='delivery')return getDelivery()||null;
  if(next==='side')return getSideEvent()||null;
  if(next==='fuel'){
   const stations=getStations()||[];
   const p=[...stations].sort((a,b)=>dist(a,car)-dist(b,car))[0];
   return p?{x:p.x,z:p.z,label:p.name}:null;
  }
  return null;
 }
 function status(){
  const destination=destinationFor(mode);
  const state=autoDriver.getState();
  const point=state.goal||destination;
  const distance=point?Math.round(dist(getCar(),point)):0;
  ui.title.textContent='🧭 '+label;
  ui.detail.textContent=mode==='tour'?'جولة تلقائية في شوارع القاهرة':
   (point?'المسافة المباشرة: '+distance+' متر • الملاحة على الطرق':'لا توجد مهمة محددة حاليًا');
  ui.btn.textContent=mode==='tour'?'🧭 GPS • جولة':'🧭 GPS • '+label;
  ui.active.textContent=state.arrived?'✅ وصلت للمكان':
    state.enabled?'🚗 الطريق جاهز للقيادة الذاتية':'اختر الوجهة وابدأ القيادة';
 }
 function select(next,silent=false){
  if(!(next in modes))return false;
  if(next==='tour'){
   mode=next;label=modes[next];lastPoint=null;autoDriver.clearDestination(getCar());
   status();ui.panel.style.display='none';
   if(!silent)notify('🧭 لفة حرة في البلد — العربية هتمشي على طريق دائري.');
   return true;
  }
  const point=destinationFor(next);
  if(!point){
   if(!silent)notify(next==='job'?'قدّم على شغل وابدأ وردية الأول.':'مش موجودة مهمة جاهزة حاليًا.');
   return false;
  }
  const route=autoDriver.setDestination(point,point.label||modes[next],getCar());
  if(!route){
   if(!silent)notify('مش لاقي طريق آمن للنقطة دي دلوقتي.');
   return false;
  }
  mode=next;label=point.label||modes[next];lastPoint={x:point.x,z:point.z};
  status();ui.panel.style.display='none';
  if(!silent)notify('🧭 الطريق اتحدد لـ'+label+' • '+Math.round(route.distance)+' متر. اركب وخلي العربية تسوق.');
  return true;
 }
 function restore(data){
  const selected=data?.mode;
  if(typeof selected==='string'&&selected in modes){
   mode=selected;label=modes[mode];lastPoint=null;
   if(mode!=='tour'){
    const target=destinationFor(mode);
    if(target){label=target.label||modes[mode];lastPoint={x:target.x,z:target.z}}
    // Car controller restores its own active route.
   }
  }
  status();
 }
 function update(dt){
  refresh+=Math.max(0,dt||0);
  if(refresh<1.5)return;refresh=0;
  if(mode!=='tour'){
   const target=destinationFor(mode);
   if(target&&(!lastPoint||dist(target,lastPoint)>2)){
    lastPoint={x:target.x,z:target.z};
    autoDriver.setDestination(target,target.label||modes[mode],getCar(),false);
   }
  }
  status();
 }
 ui.btn.onclick=()=>{ui.panel.style.display=ui.panel.style.display==='block'?'none':'block';status()};
 ui.close.onclick=()=>{ui.panel.style.display='none'};
 for(const name of Object.keys(modes))if(ui.buttons[name])ui.buttons[name].onclick=()=>select(name);
 status();
 return {select,restore,update,getState:()=>({mode,label}),getMode:()=>mode,
   getRoute:()=>autoDriver.getRoute(),getGoal:()=>autoDriver.getState().goal,refresh:status};
}
