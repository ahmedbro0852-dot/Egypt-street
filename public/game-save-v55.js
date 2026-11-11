// Egypt Streets V5.5 — resilient local autosaves for the same browser/device.
export const SAVE_KEY_V55='egypt-street-world-v55';
export const GAME_KEYS_V55=[
 SAVE_KEY_V55,'egypt-street-wallet-v4','egypt-street-fuel-v4',
 'egypt-street-careers-v1','egypt-street-quests-v50','egypt-street-life-v5','egypt-streets-garage-v8','egypt-streets-rides-v15','egypt-streets-collisions-v18','egypt-streets-safety-v21','egypt-streets-races-v31','egypt-street-race-return-v32','egypt-streets-drift-v34','egypt-street-time-attack-v37','egypt-streets-laptop-notes-v41'
];
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function sanitizeSnapshot(data){
 if(!data||data.version!==1||!data.player||!data.taxi)return null;
 const place=(p,def,arenaAllowed=false)=>{
  const x=finite(p?.x,def.x),z=finite(p?.z,def.z);
  // Keep the isolated racetrack x range only for player/car positions.
  // GPS targets and mission destinations remain restricted to old Cairo.
  const inRace=arenaAllowed&&x>254&&x<515&&z>-122&&z<122;
  return {
   x:clamp(x,-215,inRace?515:215),
   z:clamp(z,-166,166),
   yaw:clamp(finite(p?.yaw,0),-10000,10000)
  };
 };
 const mission=data.mission||{};
 return {
  version:1,
  savedAt:clamp(finite(data.savedAt,0),0,1e15),
  player:place(data.player,{x:0,z:12},true),
  taxi:place(data.taxi,{x:2,z:8},true),
  driving:!!data.driving,
  parkingBrake:!!data.parkingBrake,
  cameraYaw:finite(data.cameraYaw,0),
  cameraPitch:clamp(finite(data.cameraPitch,.13),-.24,.52),
  cameraMode:['wide','near','cockpit'].includes(data.cameraMode)?data.cameraMode:'wide',
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
  rideDispatch:data.rideDispatch&&typeof data.rideDispatch==='object'?{
    trips:clamp(Math.floor(finite(data.rideDispatch.trips,0)),0,100000),
    earned:clamp(finite(data.rideDispatch.earned,0),0,10000000),
    active:data.rideDispatch.active&&Number.isInteger(data.rideDispatch.active.index)&&
      data.rideDispatch.active.index>=0&&data.rideDispatch.active.index<5&&
      ['pickup','dropoff'].includes(data.rideDispatch.active.stage)?
      {index:data.rideDispatch.active.index,stage:data.rideDispatch.active.stage}:null
  }:null,
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
  gps:{mode:['job','delivery','side','fuel','tour'].includes(data.gps?.mode)?data.gps.mode:'tour'},
  roadSafety:data.roadSafety&&typeof data.roadSafety==='object'?{
    enabled:data.roadSafety.enabled!==false,
    warnings:clamp(Math.floor(finite(data.roadSafety.warnings,0)),0,100000),
    interventions:clamp(Math.floor(finite(data.roadSafety.interventions,0)),0,100000)
  }:null,
  drivingRealism:data.drivingRealism&&typeof data.drivingRealism==='object'?{
    engineOn:!!data.drivingRealism.engineOn,
    turn:['left','right'].includes(data.drivingRealism.turn)?data.drivingRealism.turn:'off',
    hazards:!!data.drivingRealism.hazards
  }:null,
  garage:data.garage&&typeof data.garage==='object'?{
    selected:['taxi','sedan','sport','motorbike'].includes(data.garage.selected)?data.garage.selected:'taxi',
    owned:Array.isArray(data.garage.owned)?data.garage.owned.filter(x=>['taxi','sedan','sport','motorbike'].includes(x)):['taxi'],
    upgrades:Object.fromEntries(['engine','brakes','tyres'].map(k=>[k,Math.max(0,Math.min(3,Math.floor(Number(data.garage.upgrades?.[k])||0)))]))
  }:null
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
