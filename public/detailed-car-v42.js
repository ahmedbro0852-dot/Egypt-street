import {applyTaxiDesign3} from './taxi-design-v179.js';
// Detailed licensed car, shared asset download; gameplay keeps its existing physics anchor.
import * as T from './three.js';
import { GLTFLoader } from './GLTFLoader.js';
const URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/8f492390ddc7a2ae221a1369ef560589cf8c70fb/Models/CarConcept/glTF-Binary/CarConcept.glb';
let source;
export function prepareDetailedCar(root,color,{enabled=true,onReady=()=>{}}={}){
 if(color==='#d7a52f'){applyTaxiDesign3(root);return;}
 if(!enabled||root.userData.detailedRequested)return;
 root.userData.detailedRequested=true;
 source ||= new GLTFLoader().loadAsync(URL);
 source.then(gltf=>{
  const model=gltf.scene.clone(true),normalizer=new T.Group();
  normalizer.add(model);
  normalizer.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(normalizer),size=bounds.getSize(new T.Vector3());
  const scale=4.30/size.z;normalizer.scale.setScalar(scale);
  normalizer.position.set(-(bounds.min.x+bounds.max.x)*scale/2,.04-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
  // Commit the replacement only after all geometry and textures have loaded.
  const chassis=root.userData.chassis;
  const oldBody=[...chassis.children],oldWheels=root.userData.wheels;
  chassis.add(normalizer);root.updateMatrixWorld(true);
  const wheels=[];
  for(const name of ['WheelFrontL','WheelFrontR','WheelRearL','WheelRearR']){
   const mesh=model.getObjectByName(name);if(!mesh)continue;
   const center=root.worldToLocal(mesh.getWorldPosition(new T.Vector3()));
   const pivot=new T.Group(),rolling=new T.Group();pivot.position.copy(center);root.add(pivot);pivot.add(rolling);
   rolling.attach(mesh);
   // Remove the source showroom steering angle; retain tyre orientation around the axle.
   const axis=new T.Vector3(1,0,0).applyQuaternion(mesh.quaternion);
   mesh.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(axis.z,axis.x)));
   pivot.userData={front:name.includes('Front'),side:Math.sign(center.x),baseY:center.y,radius:.38,rolling};wheels.push(pivot);
  }
  model.traverse(o=>{
   if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   const copies=materials.map(m=>{const c=m.clone();
    if(/Color1|BodyHood$|BodyRoofPanel/.test(o.name)&&c.color){c.color.set(color);c.metalness=.82;c.roughness=.24;if('clearcoat' in c)c.clearcoat=1;}
    if(/BodyHeadlights/.test(o.name))root.userData.headlights=c;
    if(/BodyTaillights$/.test(o.name))root.userData.tailLights=c;
    return c;
   });o.material=Array.isArray(o.material)?copies:copies[0];
  });
  oldBody.forEach(o=>o.visible=false);oldWheels.forEach(o=>o.visible=false);
  root.userData.wheels=wheels;root.userData.detailedModel=model;
  root.userData.damagePanels=null;root.scale.set(1,1,1);
  onReady();
 }).catch(error=>{console.warn('Detailed car unavailable; retaining original vehicle',error);root.userData.detailedRequested=false;source=null;});
}
