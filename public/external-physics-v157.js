// V157: real rigid-body street props powered by cannon-es 0.20.0 (MIT).
// Soft opt-in overlay: existing car steering/ABS/mission physics remain stable.
// If the CDN cannot load, game continues with the procedural city unaffected.
export const CANNON_ES_V157='https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
export const STREET_PROP_LAYOUT_V157=Object.freeze([
 [-56.2,-44.0,'box'],[-25.4,-14.5,'cone'],[5.1,15.0,'box'],
 [34.8,43.8,'box'],[64.4,-44.5,'cone'],[-25.1,47.8,'box'],
 [35.3,-15.9,'cone'],[-55.6,16.2,'box'],[64.2,15.1,'box'],
 [4.2,-45.3,'cone'],[-55.9,45.2,'box'],[35.4,16.4,'box']
]);
export function createStreetRigidBodiesV157({T,scene,mobile=false,
  loadEngine=url=>import(url),maxProps=mobile?4:10}={}){
 let status='idle',error='',world=null,C=null,carBody=null,stepCount=0,models=[];
 const count=Math.max(0,Math.min(mobile?6:12,Math.floor(maxProps)));
 let lastCar=null;
 function initialize(module){
  C=module.default?.World?module.default:module;
  if(!C?.World||!C.Body||!C.Box||!C.Plane||!C.Vec3)throw Error('Incomplete cannon-es module');
  world=new C.World({gravity:new C.Vec3(0,-9.81,0)});
  world.allowSleep=true;
  if(C.SAPBroadphase)world.broadphase=new C.SAPBroadphase(world);
  if(world.solver)world.solver.iterations=mobile?4:7;
  world.defaultContactMaterial.friction=.62;
  world.defaultContactMaterial.restitution=.19;
  const floor=new C.Body({mass:0,shape:new C.Plane(),position:new C.Vec3(0,.10,0)});
  floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
  carBody=new C.Body({mass:0,type:C.Body.KINEMATIC,
   shape:new C.Box(new C.Vec3(.92,.67,2.08)),position:new C.Vec3(0,-40,0)});
  world.addBody(carBody);
  const boxGeo=new T.BoxGeometry(.74,.74,.74);
  const coneGeo=new T.CylinderGeometry(.11,.34,.77,8);
  const boxMat=new T.MeshStandardMaterial({color:0x946d48,roughness:.95});
  const coneMat=new T.MeshStandardMaterial({color:0xf58b2c,roughness:.83});
  const stripeMat=new T.MeshStandardMaterial({color:0xf5e9d1,roughness:.9});
  for(let i=0;i<count;i++){
   const [x,z,kind]=STREET_PROP_LAYOUT_V157[i];
   const cone=kind==='cone';
   const mass=cone?2.4:12;
   const shape=cone?new C.Cylinder(.11,.34,.77,8):new C.Box(new C.Vec3(.37,.37,.37));
   const body=new C.Body({
    mass,shape,position:new C.Vec3(x,.54,z),
    linearDamping:.20,angularDamping:.28,
    allowSleep:true,sleepSpeedLimit:.12,sleepTimeLimit:1.2
   });
   world.addBody(body);
   const mesh=new T.Mesh(cone?coneGeo:boxGeo,cone?coneMat:boxMat);
   mesh.castShadow=false;mesh.receiveShadow=false;
   // One high-contrast reflective cone stripe, no real-time light source.
   if(cone){const stripe=new T.Mesh(new T.CylinderGeometry(.17,.24,.08,8),stripeMat);
    stripe.position.y=.12;mesh.add(stripe);}
   scene.add(mesh);models.push({mesh,body,cone});
  }
  status='ready';
 }
 function start(){
  if(status!=='idle'||!count||!T?.Mesh||!scene)return false;
  status='loading';
  Promise.resolve().then(()=>loadEngine(CANNON_ES_V157)).then(initialize).catch(e=>{
   error=String(e?.message||e).slice(0,160);status='fallback';
   if(world){for(const item of models)scene.remove(item.mesh);models=[];world=null;}
  });
  return true;
 }
 function update(dt=1/60,{active=true,paused=false,driving=false,position,
  speed=0,yaw=0}={}){
  if(!active||paused)return;
  if(status==='idle')start();
  if(status!=='ready')return;
  const delta=clamp(dt,0,.04);
  const x=Number.isFinite(position?.x)?position.x:0;
  const z=Number.isFinite(position?.z)?position.z:0;
  const moving=!!driving&&Math.abs(speed)>.08;
  if(moving){
   const forward=Math.sign(speed),velocity=clamp(Math.abs(speed),0,42);
   carBody.position.set(x,.76,z);
   carBody.quaternion.setFromAxisAngle(new C.Vec3(0,1,0),Number.isFinite(yaw)?yaw:0);
   carBody.velocity.set(Math.sin(yaw)*velocity,0,Math.cos(yaw)*velocity);
   if(lastCar){
    const teleported=Math.hypot(x-lastCar.x,z-lastCar.z)>10;
    if(teleported)carBody.velocity.set(0,0,0);
   }
   lastCar={x,z};
  }else{
   // Kinematic chassis is parked below the simulation when not driving.
   carBody.position.set(0,-40,0);carBody.velocity.set(0,0,0);lastCar=null;
  }
  world.step(1/60,delta,2);
  stepCount++;
  for(const {mesh,body} of models){
   mesh.position.copy(body.position);
   mesh.quaternion.copy(body.quaternion);
  }
 }
 function dispose(){
  for(const item of models){
   scene.remove(item.mesh);item.body.sleep?.();
  }
  models=[];world=null;carBody=null;status='disposed';
 }
 return {start,update,dispose,getStats:()=>({
  status,count:models.length,engine:'cannon-es 0.20.0',steps:stepCount,error
 })};
}
