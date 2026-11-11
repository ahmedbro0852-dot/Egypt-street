// Egypt Streets V15 — recognizable Cairo street props, road defects and night lights.
// Decorative geometry is intentionally small; all materials are reused for mobile performance.
export function installStreetDetailsV15({T,scene,box,sign,blocked=()=>false}){
 const lamps=[],props=[];
 const metal='#657377',stone='#bea991',gold='#d6a35a',teal='#23706a';
 const bulb=new T.MeshStandardMaterial({color:0xffe1a3,emissive:0xffdf9c,emissiveIntensity:.12,roughness:.85});
 const poleGeo=new T.CylinderGeometry(.10,.14,5.1,7);
 const lightGeo=new T.SphereGeometry(.28,8,6);
 function lamp(x,z){
  const pole=new T.Mesh(poleGeo,new T.MeshLambertMaterial({color:0x738180}));
  pole.position.set(x,2.55,z);scene.add(pole);
  box(x+.48,5.03,z,.95,.13,.13,metal);
  const light=new T.Mesh(lightGeo,bulb);
  light.position.set(x+.86,4.96,z);scene.add(light);lamps.push(light);
  props.push({x,z,type:'نور شارع'});
 }
 // Added by shops and cross streets, not in the drive lanes.
 for(const x of [-103,-70,70,101])for(const z of [-47,17,47]){
  if(!blocked(x,z,.65))lamp(x,z);
 }
 for(const [i,[x,z]] of [[-73,-42],[-39,76],[9,76],[73,-16],[-83,46],[87,-78]].entries()){
  if(blocked(x,z,1.2))continue;
  // Microbus shelters with a roof, waiting seat and timetable board.
  box(x,2.62,z,4.7,.17,2.3,'#ead8b4');
  box(x-2.10,1.27,z-1,.12,2.5,.12,metal);
  box(x+2.10,1.27,z-1,.12,2.5,.12,metal);
  box(x,1.24,z+1.0,4.5,2.15,.12,'#8aa09c');
  box(x,.79,z,.3,.08,1.65,gold);
  box(x,.83,z,.23,.12,1.7,'#765844');
  sign(i%2?'موقف ميكروباص':'موقف أتوبيس',x,3.22,z+1.18,4.7);
  props.push({x,z,type:'موقف'});
 }
 for(const [i,[x,z]] of [[-44,77],[-14,77],[18,77],[47,77],[-77,-79],[75,77]].entries()){
  if(blocked(x,z,1.0))continue;
  const canopy=i%2?'#d39852':'#3d9681';
  box(x,.9,z,3.3,1.8,1.8,stone);
  box(x,1.93,z,3.7,.13,2.15,canopy);
  box(x,1.20,z+1.0,2.8,.9,.12,'#5c4534');
  for(const j of [-1,0,1]){
   box(x+j*.8,1.73,z+.93,.52,.12,.4,j===0?'#cf9753':'#9db66e');
  }
  sign(i%2?'عصير قصب':'كشك عم سيد',x,2.35,z+1.20,3.1);
  props.push({x,z,type:'كشك'});
 }
 for(const [x,z] of [[-46,-72],[15,-72],[75,42],[-74,12],[75,-74]]){
  if(blocked(x,z,.7))continue;
  box(x,.53,z,1.85,.15,.48,'#906c4d');
  for(const dx of [-.68,.68])box(x+dx,.28,z,.18,.43,.42,metal);
  box(x,.95,z-.23,1.86,.76,.15,'#956c48');
  box(x+1.6,.54,z,.68,.85,.65,'#3f7169');
 }
 // Road imperfections are visible and have a measurable, mild grip penalty.
 const potholes=[
  {x:0,z:42,r:2.0},{x:-60,z:-14,r:2.1},{x:30,z:48,r:1.8},
  {x:60,z:-42,r:2.0},{x:-30,z:17,r:1.7}
 ];
 for(const p of potholes){
  box(p.x,.084,p.z,p.r*2,.012,p.r*1.05,'#404a4c');
  box(p.x+.3,.092,p.z+.2,p.r*.8,.012,p.r*.41,'#4d5b60');
 }
 // Police/safety limit boards are informational; the existing traffic system handles fines.
 for(const [x,z] of [[-70,-73],[70,-73],[-70,73],[70,73]]){
  box(x,1.75,z,.12,3.5,.12,metal);
  box(x,3.2,z,1.3,1.0,.16,'#d9ddd3');
  box(x,3.2,z+.10,.93,.73,.07,'#e6a352');
  props.push({x,z,type:'سرعة ٦٠'});
 }
 function update(illumination=1){
  const dark=illumination<.22;
  bulb.emissiveIntensity=dark?2.15:.17;
  bulb.color.set?.(dark?0xffebc3:0xffdcb0);
 }
 function grip(x,z){
  return potholes.some(p=>Math.hypot(x-p.x,z-p.z)<p.r*1.1)?.81:1;
 }
 update(1);
 return {update,grip,stats:()=>({lights:lamps.length,props:props.length,potholes:potholes.length})};
}
