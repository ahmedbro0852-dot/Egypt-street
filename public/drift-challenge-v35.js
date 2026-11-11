// Egypt Streets V35 — skill-based, timed drift competition on the isolated race circuit.
// No leaderboard server, external assets, music, or passive points.
import { driftQualityV34 } from './drift-system-v34.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const DRIFT_CHALLENGE_V35={duration:90,bronze:200,silver:480,gold:850,elite:1350,
 rewards:{none:0,bronze:180,silver:380,gold:720,elite:950}};
export function distanceToRaceTrackV35(points,x,z){
 if(!Array.isArray(points)||points.length<2)return Infinity;
 let closest=Infinity;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  const dx=b.x-a.x,dz=b.z-a.z,lenSq=dx*dx+dz*dz;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/Math.max(1,lenSq),0,1);
  closest=Math.min(closest,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
 }
 return closest;
}
export function driftMedalV35(score){
 const s=Math.max(0,Number(score)||0);
 return s>=DRIFT_CHALLENGE_V35.elite?'elite':s>=DRIFT_CHALLENGE_V35.gold?'gold':
        s>=DRIFT_CHALLENGE_V35.silver?'silver':s>=DRIFT_CHALLENGE_V35.bronze?'bronze':'none';
}
export function createTimedDriftV35({points=[],duration=DRIFT_CHALLENGE_V35.duration}={}){
 let elapsed=0,score=0,chainSeconds=0,lastQuality=0,onTrack=false,finished=false;
 function update(dt,{vehicle={},holding=false}={}){
  if(finished)return getState();
  const step=clamp(Number.isFinite(dt)?dt:0,0,.05);
  elapsed=Math.min(duration,elapsed+step);
  const distance=distanceToRaceTrackV35(points,vehicle.x||0,vehicle.z||0);
  onTrack=distance<=7.9;
  const quality=onTrack&&vehicle.drifting?
   driftQualityV34({...vehicle,holding:!!holding}):0;
  if(quality>.001){
   chainSeconds=Math.min(12,chainSeconds+step);
   score+=step*quality*56*(1+Math.min(1.15,chainSeconds*.10));
  }else chainSeconds=Math.max(0,chainSeconds-step*2.2);
  lastQuality=quality;
  if(elapsed>=duration-.0001)finished=true;
  return getState();
 }
 function getState(){
  const pointsEarned=Math.floor(score);
  const medal=driftMedalV35(pointsEarned);
  return {elapsed,remaining:Math.max(0,duration-elapsed),score:pointsEarned,
   medal,reward:DRIFT_CHALLENGE_V35.rewards[medal],finished,onTrack,
   quality:lastQuality,comboMultiplier:1+Math.min(1.15,chainSeconds*.10)};
 }
 return {update,getState};
}
