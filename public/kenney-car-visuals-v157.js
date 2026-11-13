// V157: CC0 Kenney Car Kit glTF models (see docs/external-assets-v157.md).
// The browser can always keep its existing procedural car if the asset CDN fails.
import * as T from './three.js';
import {GLTFLoader} from './GLTFLoader.js';
const ROOT='https://raw.githubusercontent.com/Hidencod/tge-assets/3ddcc695adbba9fb918cf31b7c139b3f95b76910/packs/car-kit/';
export const KENNEY_CAR_URLS_V157=Object.freeze({
 taxi:ROOT+'taxi.glb',sedan:ROOT+'sedan.glb',sport:ROOT+'sedan-sports.glb',
 suv:ROOT+'suv.glb'
});
export function normalizeKenneyBoundsV157(size,minimum,kind='sedan'){
 const width=Math.max(.01,Number(size?.x)||1),height=Math.max(.01,Number(size?.y)||1),
  length=Math.max(.01,Number(size?.z)||1);
 const target=kind==='suv'?{w:2.03,h:1.80,l:4.43}:{w:1.90,h:1.60,l:4.24};
 const scale=Math.min(target.w/width,target.h/height,target.l/length);
 return {scale,offsetX:-(Number(minimum?.x)||0)*scale-width*scale*.5,
  offsetY:.36-(Number(minimum?.y)||0)*scale,
  offsetZ:-(Number(minimum?.z)||0)*scale-length*scale*.5};
}
export function createKenneyCarVisualsV157({enabled=true,maxCars=7,loader=null}={}){
 const requested=new WeakSet(),sources=new Map();
 const cars=new Set(),limit=Math.max(0,Math.min(12,Math.floor(maxCars)));
 const assetLoader=loader||new GLTFLoader();
 let lastError='',readyCount=0;
 function attach(vehicle,kind='sedan'){
  if(!enabled||!vehicle?.userData?.chassis||vehicle.userData.design3Taxi||requested.has(vehicle)||
   cars.size>=limit||vehicle.userData.detailedRequested||vehicle.userData.detailedModel)return false;
  const type=KENNEY_CAR_URLS_V157[kind]?kind:'sedan';
  requested.add(vehicle);cars.add(vehicle);
  let pending=sources.get(type);
  if(!pending){pending=assetLoader.loadAsync(KENNEY_CAR_URLS_V157[type]);sources.set(type,pending)}
  pending.then(asset=>{
   if(!vehicle.parent)return;
   const model=asset.scene.clone(true);
   model.name='Kenney CC0 '+type+' V157';
   const bounds=new T.Box3().setFromObject(model);
   const dimensions=bounds.getSize(new T.Vector3()),min=bounds.min;
   const norm=normalizeKenneyBoundsV157(dimensions,min,type);
   if(!Number.isFinite(norm.scale)||norm.scale<.0001)throw Error('Invalid car model bounds');
   model.scale.setScalar(norm.scale);
   model.position.set(norm.offsetX,norm.offsetY,norm.offsetZ);
   // Preserve functional indicators and lamps. Everything else keeps a
   // procedural fallback hidden underneath the imported car.
   const chassis=vehicle.userData.chassis;
   const original=chassis.children.slice();
   const retained=new Set([
    vehicle.userData.headlights,vehicle.userData.tailLights,
    vehicle.userData.indicators?.left,vehicle.userData.indicators?.right
   ]);
   for(const child of original){
    if(child.userData?.entryDoorV153||child.name==='seated-driver-v154')continue;
    if(!retained.has(child.material))child.visible=false;
   }
   const wheels=vehicle.userData.wheels||[];
   for(const wheel of wheels)wheel.visible=false;
   const moving=[];
   model.traverse(node=>{
    if(!node.isMesh)return;
    node.castShadow=false;node.receiveShadow=false;
    // Keep scene draw calls down and leave all model materials shared.
    if(/wheel|tyre|tire/i.test(node.name))moving.push({node,base:node.rotation.x});
   });
   chassis.add(model);
   vehicle.userData.kenneyModelV157={model,original,wheels,moving,type};
   readyCount++;
  }).catch(error=>{
   lastError=String(error?.message||error).slice(0,160);
   requested.delete(vehicle);cars.delete(vehicle);sources.delete(type);
  });
  return true;
 }
 function updateWheels(vehicle,spin=0,steer=0){
  const data=vehicle?.userData?.kenneyModelV157;
  if(!data)return;
  for(const {node,base} of data.moving){
   node.rotation.x=base+(Number.isFinite(spin)?spin:0);
   if(/front/i.test(node.name))node.rotation.y=Math.max(-.5,Math.min(.5,steer||0));
  }
 }
 return {attach,updateWheels,getStats:()=>({loaded:readyCount,requested:cars.size,limit,lastError})};
}
