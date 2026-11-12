// Egypt Streets V154 — one reusable seated 3D driver for every four-wheel car.
// The avatar is built once, shares simple materials and never costs a second RAF.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const safe=(v,defaultValue=0)=>Number.isFinite(v)?v:defaultValue;
export function driverPoseV154({steer=0,speed=0,braking=false,turn=0}={}){
 const wheel=clamp(safe(steer)/.55,-1,1);
 const pace=clamp(Math.abs(safe(speed))/28,0,1);
 return {
  wheelAngle:-wheel*.72,
  headYaw:clamp(-wheel*.22+safe(turn)*.11,-.37,.37),
  headRoll:clamp(-wheel*.065,-.08,.08),
  upperBodyPitch:braking?.065:-.025*pace,
  handLift:braking?.022:0,
  shoulderLean:-wheel*.025
 };
}
export function isDriverCarV154(vehicle){
 return !!(vehicle?.userData?.chassis&&vehicle.userData?.wheels?.length!==2);
}
export function createSeatedDriverV154({T,lowEnd=false}={}){
 if(!T?.Group||!T?.Mesh||!T?.BoxGeometry||!T?.SphereGeometry)
  return {update(){},clear(){},dispose(){},getState:()=>({visible:false,vehicle:null,builds:0})};
 const root=new T.Group();
 root.name='seated-driver-v154';
 root.position.set(-.43,0,.025);
 const skin=new T.MeshLambertMaterial({color:0xb98262});
 const shirt=new T.MeshLambertMaterial({color:0x344853});
 const trousers=new T.MeshLambertMaterial({color:0x374b68});
 const hairMat=new T.MeshLambertMaterial({color:0x27282a});
 const wheelMat=new T.MeshLambertMaterial({color:0x171c20});
 const sphere=new T.SphereGeometry(1,lowEnd?7:10,lowEnd?5:8);
 const limbGeo=new T.CylinderGeometry(.068,.076,1,lowEnd?5:7);
 const boxGeo=new T.BoxGeometry(.41,.40,.26);
 const wheelGeo=new T.TorusGeometry(.19,.025,lowEnd?5:7,lowEnd?9:14);
 const yAxis=new T.Vector3(0,1,0);
 const delta=new T.Vector3(),mid=new T.Vector3();
 function put(geometry,material,parent,x,y,z,sx=1,sy=1,sz=1){
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
 }
 const torso=new T.Group();root.add(torso);
 put(boxGeo,shirt,torso,0,1.035,-.09);
 put(sphere,trousers,root,0,.77,-.14,.24,.13,.26);
 const legs=[];
 for(const side of [-1,1]){
  legs.push(put(sphere,trousers,root,side*.14,.62,.30,.105,.12,.34));
 }
 const headPivot=new T.Group();headPivot.position.set(0,1.39,-.095);root.add(headPivot);
 put(sphere,skin,headPivot,0,0,0,.148,.19,.148);
 put(sphere,hairMat,headPivot,0,.105,-.018,.153,.09,.154);
 put(sphere,skin,headPivot,0,-.055,.143,.034,.036,.025);
 const steering=new T.Group();
 steering.position.set(0,1.035,.68);root.add(steering);
 put(wheelGeo,wheelMat,steering,0,0,0);
 put(sphere,wheelMat,steering,0,0,.01,.058,.058,.04);
 const arms=[];
 for(const side of [-1,1]){
  const upper=put(limbGeo,shirt,root,0,0,0);
  const lower=put(limbGeo,skin,root,0,0,0);
  const hand=put(sphere,skin,root,0,0,0,.067,.070,.056);
  arms.push({side,upper,lower,hand});
 }
 let current=null,previousGlass=null,builds=1;
 function moveSegment(mesh,x1,y1,z1,x2,y2,z2){
  delta.set(x2-x1,y2-y1,z2-z1);
  const len=delta.length();
  mesh.position.set((x1+x2)*.5,(y1+y2)*.5,(z1+z2)*.5);
  mesh.scale.y=len;
  if(len>.0001){delta.multiplyScalar(1/len);mesh.quaternion.setFromUnitVectors(yAxis,delta);}
 }
 function release(){
  if(current){
   const glass=previousGlass?.material;
   if(glass){
    glass.transparent=previousGlass.transparent;
    glass.opacity=previousGlass.opacity;
    glass.depthWrite=previousGlass.depthWrite;
    glass.needsUpdate=true;
   }
   root.parent?.remove(root);
  }
  current=null;previousGlass=null;root.visible=false;
 }
 function setVehicle(vehicle){
  if(current===vehicle)return;
  release();
  if(!isDriverCarV154(vehicle))return;
  current=vehicle;
  vehicle.userData.chassis.add(root);
  root.visible=true;
  const glass=vehicle.userData.driverGlassV154;
  if(glass){
   previousGlass={material:glass,transparent:glass.transparent,
    opacity:glass.opacity,depthWrite:glass.depthWrite};
   // Only the currently driven vehicle gets transparent glazing.
   glass.transparent=true;glass.opacity=lowEnd?.66:.49;
   glass.depthWrite=false;glass.needsUpdate=true;
  }
 }
 function update({vehicle=null,driving=false,interior=false,steer=0,speed=0,braking=false,turn=0}={}){
  if(!driving||interior||!isDriverCarV154(vehicle)){release();return}
  setVehicle(vehicle);
  const pose=driverPoseV154({steer,speed,braking,turn});
  headPivot.rotation.y+=(pose.headYaw-headPivot.rotation.y)*.18;
  headPivot.rotation.z+=(pose.headRoll-headPivot.rotation.z)*.16;
  torso.rotation.x+=(pose.upperBodyPitch-torso.rotation.x)*.12;
  torso.rotation.z+=(pose.shoulderLean-torso.rotation.z)*.15;
  steering.rotation.z=pose.wheelAngle;
  const cs=Math.cos(pose.wheelAngle),sn=Math.sin(pose.wheelAngle);
  for(const arm of arms){
   const side=arm.side;
   const sx=side*.20,sy=1.16,sz=.005;
   const wx=side*.172,wy=side*.02;
   const hx=wx*cs-wy*sn,hy=wx*sn+wy*cs;
   const ex=side*.23+(hx-side*.172)*.22,ey=1.03+pose.handLift,ez=.30;
   const handX=hx,handY=1.035+hy+pose.handLift,handZ=.685;
   moveSegment(arm.upper,sx,sy,sz,ex,ey,ez);
   moveSegment(arm.lower,ex,ey,ez,handX,handY,handZ);
   arm.hand.position.set(handX,handY,handZ);
  }
 }
 function dispose(){
  release();sphere.dispose();limbGeo.dispose();boxGeo.dispose();wheelGeo.dispose();
  skin.dispose();shirt.dispose();trousers.dispose();hairMat.dispose();wheelMat.dispose();
 }
 return {update,clear:release,dispose,getState:()=>({visible:root.visible,vehicle:current,builds,meshCount:root.children.length}),getRoot:()=>root};
}
