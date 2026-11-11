// Egypt Streets V5.5 — resilient local autosaves for the same browser/device.
export const SAVE_KEY_V55='egypt-street-world-v55';
export const GAME_KEYS_V55=[
 SAVE_KEY_V55,'egypt-street-wallet-v4','egypt-street-fuel-v4',
 'egypt-street-careers-v1','egypt-street-life-v5'
];
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function sanitizeSnapshot(data){
 if(!data||data.version!==1||!data.player||!data.taxi)return null;
 const place=(p,def)=>({
  x:clamp(finite(p?.x,def.x),-215,215),
  z:clamp(finite(p?.z,def.z),-166,166),
  yaw:clamp(finite(p?.yaw,0),-10000,10000)
 });
 const mission=data.mission||{};
 return {
  version:1,
  savedAt:clamp(finite(data.savedAt,0),0,1e15),
  player:place(data.player,{x:0,z:12}),
  taxi:place(data.taxi,{x:2,z:8}),
  driving:!!data.driving,
  parkingBrake:!!data.parkingBrake,
  cameraYaw:finite(data.cameraYaw,0),
  cameraPitch:clamp(finite(data.cameraPitch,.13),-.24,.52),
  money:clamp(finite(data.money,250),0,10000000),
  mission:{
    completed:clamp(Math.floor(finite(mission.completed,0)),0,100000),
    target:place(mission.target,{x:62,z:-50})
  },
  fuel:data.fuel&&typeof data.fuel==='object'?{
    fuel:clamp(finite(data.fuel.fuel,16),0,45),
    condition:clamp(finite(data.fuel.condition,100),0,100),
    target:clamp(finite(data.fuel.target,75),20,145),
    auto:!!data.fuel.auto,
    totalKm:clamp(finite(data.fuel.totalKm,0),0,1e9)
  }:null,
  career:data.career&&typeof data.career==='object'?data.career:null,
  sideEvent:data.sideEvent&&typeof data.sideEvent==='object'?data.sideEvent:null,
  autopilot:{
   enabled:!!data.autopilot?.enabled,
   index:Math.max(0,Math.floor(finite(data.autopilot?.index,0))),
   mode:data.autopilot?.mode==='gps'?'gps':'patrol',
   goal:data.autopilot?.goal&&Number.isFinite(data.autopilot.goal.x)&&Number.isFinite(data.autopilot.goal.z)?
     place(data.autopilot.goal,{x:0,z:0}):null,
   label:String(data.autopilot?.label||'').slice(0,90),
   routeIndex:Math.max(0,Math.floor(finite(data.autopilot?.routeIndex,0))),
   arrived:!!data.autopilot?.arrived
  },
  gps:{mode:['job','delivery','side','fuel','tour'].includes(data.gps?.mode)?data.gps.mode:'tour'}
 };
}
export function createWorldSave({storage,clock=()=>Date.now(),intervalMs=2500}={}){
 let lastSaved=-Infinity,lastError=false,latest=null;
 function load(){
  try{
   const parsed=JSON.parse(storage?.getItem(SAVE_KEY_V55)||'null');
   latest=sanitizeSnapshot(parsed);
   return latest;
  }catch(e){return null}
 }
 function hasSave(){return !!load()}
 function save(payload,force=false){
  const now=clock();
  if(!force&&now-lastSaved<intervalMs)return false;
  const safe=sanitizeSnapshot({...payload,version:1,savedAt:now});
  if(!safe)return false;
  try{
   storage?.setItem(SAVE_KEY_V55,JSON.stringify(safe));
   lastSaved=now;latest=safe;lastError=false;return true;
  }catch(e){lastError=true;return false}
 }
 function clear(){
  try{
   for(const key of GAME_KEYS_V55)storage?.removeItem(key);
   latest=null;lastSaved=-Infinity;return true;
  }catch(e){return false}
 }
 return {load,save,hasSave,clear,hasError:()=>lastError,getSnapshot:()=>latest};
}
