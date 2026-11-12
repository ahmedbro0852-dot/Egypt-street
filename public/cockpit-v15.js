// Egypt Streets V15: low-cost first-person dashboard for a car or motorcycle.
// The cockpit follows the game's perspective camera; no textures or network resources.
export function createCockpitV15({T,scene,camera,lowEnd=false}){
 const root=new T.Group();root.visible=false;
 const dark=new T.MeshStandardMaterial({color:0x17232b,roughness:.88}),
       trim=new T.MeshStandardMaterial({color:0x374b54,metalness:.25,roughness:.56}),
       glass=new T.MeshStandardMaterial({color:0x8aa5ae,metalness:.35,roughness:.38}),
       leather=new T.MeshStandardMaterial({color:0x242c32,roughness:.92}),
       golden=new T.MeshBasicMaterial({color:0xf2c87b});
 const parts=[];
 function mesh(geo,mat,x,y,z,parent=root){
  const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);
  parts.push(m);return m;
 }
 // Low mounted dashboard and short bonnet edge.
 mesh(new T.BoxGeometry(2.7,.39,.44),dark,0,-.62,-.88);
 mesh(new T.BoxGeometry(2.6,.055,.16),trim,0,-.44,-.88);
 mesh(new T.BoxGeometry(.73,.22,.14),trim,-.32,-.46,-.67);
 mesh(new T.BoxGeometry(.34,.13,.08),dark,-.32,-.45,-.57);
 // Steering wheel, only the wheel and hub rotate as a unit.
 const steering=new T.Group();
 steering.position.set(-.26,-.50,-.56);root.add(steering);
 const rim=new T.Mesh(new T.TorusGeometry(.24,.031,8,20),leather);
 steering.add(rim);parts.push(rim);
 for(let i=0;i<3;i++){
  const spoke=mesh(new T.BoxGeometry(.2,.035,.04),trim,
    Math.cos(i*Math.PI*2/3)*.105,Math.sin(i*Math.PI*2/3)*.105,0,steering);
  spoke.rotation.z=i*Math.PI*2/3;
 }
 mesh(new T.CylinderGeometry(.065,.065,.042,10),trim,0,0,.024,steering).rotation.x=Math.PI/2;
 // V154: visible first-person forearms and hands follow the steering wheel.
 // One shared lightweight limb geometry; no animation files or extra draw loop.
 const skin=new T.MeshLambertMaterial({color:0xb98262});
 const sleeve=new T.MeshLambertMaterial({color:0x344853});
 const armGeometry=new T.CylinderGeometry(.048,.065,1,7);
 const handGeometry=new T.SphereGeometry(.071,10,7);
 const armAxis=new T.Vector3(0,1,0),armDelta=new T.Vector3();
 const cockpitArms=[];
 for(const side of [-1,1]){
  const upper=mesh(armGeometry,sleeve,0,0,0);
  const forearm=mesh(armGeometry,skin,0,0,0);
  const hand=mesh(handGeometry,skin,0,0,0);
  hand.scale.set(.95,.75,.75);
  cockpitArms.push({side,upper,forearm,hand});
 }
 function poseCockpitLimb(segment,x1,y1,z1,x2,y2,z2){
  armDelta.set(x2-x1,y2-y1,z2-z1);
  const length=armDelta.length();
  segment.position.set((x1+x2)*.5,(y1+y2)*.5,(z1+z2)*.5);
  segment.scale.y=length;
  if(length>.0001){
   armDelta.multiplyScalar(1/length);
   segment.quaternion.setFromUnitVectors(armAxis,armDelta);
  }
 }
 // Glanceable gauges, mirrors and frame in the lower screen area.
 const speedNeedle=mesh(new T.BoxGeometry(.018,.11,.018),golden,.08,-.51,-.62);
 mesh(new T.BoxGeometry(.29,.03,.05),glass,.08,-.55,-.64);
 mesh(new T.BoxGeometry(.36,.09,.1),trim,.52,-.49,-.7);
 mesh(new T.BoxGeometry(.3,.10,.035),glass,.52,-.47,-.64);
 mesh(new T.BoxGeometry(.42,.055,.08),leather,0,.27,-.66);
 mesh(new T.BoxGeometry(.53,.17,.045),glass,0,.30,-.69);
 // V155: rear-view mirror and understated interior trim.
 // These are mirror surfaces only; no second scene camera or expensive reflection.
 const rearMirrorCase=mesh(new T.BoxGeometry(.56,.17,.065),dark,0,.225,-.74);
 const rearMirrorGlass=mesh(new T.BoxGeometry(.49,.104,.012),glass,0,.225,-.697);
 const mirrorDetailCount=lowEnd?1:3;
 if(!lowEnd){
  for(const side of [-1,1]){
   const frame=mesh(new T.BoxGeometry(.30,.14,.05),trim,side*.94,-.21,-.82);
   const surface=mesh(new T.BoxGeometry(.25,.095,.012),glass,side*.94,-.21,-.782);
   frame.rotation.y=side*.14;surface.rotation.y=side*.14;
  }
 }
 const turnLeft=mesh(new T.SphereGeometry(.018,6,5),golden,-.19,-.515,-.57);
 const turnRight=mesh(new T.SphereGeometry(.018,6,5),golden,-.04,-.515,-.57);
 turnLeft.visible=turnRight.visible=false;
 // Windshield side bars stay mostly outside portrait-phone field of view.
 for(const side of [-1,1]){
  const pillar=mesh(new T.BoxGeometry(.07,1.1,.08),trim,side*.90,-.10,-.85);
  pillar.rotation.z=side*-.18;
 }
 scene.add(camera);camera.add(root);
 function setVisible(v){root.visible=!!v}
 function update(steer=0,speed=0,bike=false,signals={}){
  steering.rotation.z=-Math.max(-1,Math.min(1,steer/.55))*.66;
  // Hand destinations rotate around the rim, with elbows bending naturally.
  const spin=steering.rotation.z,cs=Math.cos(spin),sn=Math.sin(spin);
  for(const arm of cockpitArms){
   const side=arm.side;
   const localX=side*.195,localY=side*.045;
   const handX=steering.position.x+localX*cs-localY*sn;
   const handY=steering.position.y+localX*sn+localY*cs;
   const handZ=steering.position.z+.055;
   const shoulderX=side<0?-.73:.24;
   const shoulderY=-.99,shoulderZ=-.10;
   const elbowX=shoulderX*.52+handX*.48;
   const elbowY=-.72+Math.abs(steer)*.014,elbowZ=-.34;
   poseCockpitLimb(arm.upper,shoulderX,shoulderY,shoulderZ,elbowX,elbowY,elbowZ);
   poseCockpitLimb(arm.forearm,elbowX,elbowY,elbowZ,handX,handY,handZ);
   arm.hand.position.set(handX,handY,handZ);
  }
  speedNeedle.rotation.z=-Math.max(-.2,Math.min(1.1,Math.abs(speed)/40));
  root.scale.set(bike?.81:1,bike?.85:1,1);
  turnLeft.visible=!!(signals?.left);
  turnRight.visible=!!(signals?.right);
 }
 return {setVisible,update,getState:()=>({visible:root.visible,parts:parts.length,steering:steering.rotation.z,driverHands:cockpitArms.length,mirrorSurfaces:mirrorDetailCount,signals:{left:turnLeft.visible,right:turnRight.visible}})};
}
