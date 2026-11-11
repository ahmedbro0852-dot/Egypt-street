// Egypt Streets V15: low-cost first-person dashboard for a car or motorcycle.
// The cockpit follows the game's perspective camera; no textures or network resources.
export function createCockpitV15({T,scene,camera}){
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
 // Glanceable gauges, mirrors and frame in the lower screen area.
 const speedNeedle=mesh(new T.BoxGeometry(.018,.11,.018),golden,.08,-.51,-.62);
 mesh(new T.BoxGeometry(.29,.03,.05),glass,.08,-.55,-.64);
 mesh(new T.BoxGeometry(.36,.09,.1),trim,.52,-.49,-.7);
 mesh(new T.BoxGeometry(.3,.10,.035),glass,.52,-.47,-.64);
 mesh(new T.BoxGeometry(.42,.055,.08),leather,0,.27,-.66);
 mesh(new T.BoxGeometry(.53,.17,.045),glass,0,.30,-.69);
 // Windshield side bars stay mostly outside portrait-phone field of view.
 for(const side of [-1,1]){
  const pillar=mesh(new T.BoxGeometry(.07,1.1,.08),trim,side*.90,-.10,-.85);
  pillar.rotation.z=side*-.18;
 }
 scene.add(camera);camera.add(root);
 function setVisible(v){root.visible=!!v}
 function update(steer=0,speed=0,bike=false){
  steering.rotation.z=-Math.max(-1,Math.min(1,steer/.55))*.66;
  speedNeedle.rotation.z=-Math.max(-.2,Math.min(1.1,Math.abs(speed)/40));
  root.scale.set(bike?.81:1,bike?.85:1,1);
 }
 return {setVisible,update,getState:()=>({visible:root.visible,parts:parts.length,steering:steering.rotation.z})};
}
