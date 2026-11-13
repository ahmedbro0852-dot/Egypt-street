// Street-scale detail pass: shared geometry, instanced props and one sign atlas.
// Every solid prop is outside the carriageways; covers and paint are visual only.
export function installStreetDetailV178({T,scene,solids}){
 const cubes=[],poles=[],covers=[],shrubs=[],signs=[[],[],[]];
 const cube=(x,y,z,w,h,d,color,angle=0)=>cubes.push({x,y,z,w,h,d,color,angle});
 const cylinder=(list,x,y,z,w,h,d,color)=>list.push({x,y,z,w,h,d,color,angle:0});
 const streets=[-60,-30,0,30,60];
 for(const road of streets){
  // Short stone kerb modules, expansion gaps and alternating weathered paint.
  for(const [start,end] of [[-82,-69],[-51,-39],[-21,-9],[9,21],[39,51],[69,82]]){
   for(const side of [-1,1])for(let z=start;z<end;z+=1.5){
    cube(road+side*5.79,.145,z+.71,.22,.16,1.40,
     Math.floor((z+90)/1.5)%2?0xd1cdbf:0x666966);
   }
  }
  for(const [i,z] of [-47,-17,13,43].entries()){
   const side=i%2?1:-1,x=road+side*6.55;
   // Grounded cast-iron bollard and pale reflector band.
   cylinder(poles,x,.28,z,.17,.44,.17,0x3c4b49);
   cylinder(poles,x,.54,z,.12,.13,.12,0xc4c9b7);
   cylinder(poles,x,.66,z,.13,.12,.13,0x3c4b49);
   cube(x,.078,z,.45,.05,.45,0x9c998e);
   solids.push({x,z,w:.16,d:.16});
   // Maintenance cover with inset rim, concentric disc and cast tread ribs.
   const mx=road+side*3.75,mz=z+3;
   cylinder(covers,mx,.074,mz,.57,.018,.57,0x3e4848);
   cylinder(covers,mx,.085,mz,.48,.014,.48,0x727873);
   for(let k=-3;k<=3;k++)cube(mx,.095,mz+k*.105,.62-Math.abs(k)*.07,.007,.028,0x454e4c);
  }
  // A small planted pavement bay breaks the long repeated concrete strip.
  for(const z of [-18,42]){
   const x=road-6.7;
   cube(x,.23,z,1.05,.34,1.9,0xaaa491);
   cube(x,.405,z,.91,.025,1.74,0x574f3d);
   for(const offset of [-.5,.45])cylinder(shrubs,x,.69,z+offset,.48,.35,.50,offset<0?0x67724c:0x76805a);
   solids.push({x,z,w:.52,d:.95});
  }
  // Speed signs and junction warnings face approaching traffic.
  for(const [z,side,type] of [[-46,1,0],[46,-1,1]]){
   const x=road+side*6.85,angle=side>0?Math.PI:0;
   cylinder(poles,x,1.35,z,.055,2.55,.055,0x707c78);
   signs[type].push({x,y:2.43,z,w:.86,h:.86,d:1,color:0xffffff,angle});
   solids.push({x,z,w:.09,d:.09});
  }
 }
 // Subtle road studs guide the long Corniche straights without extra lights.
 for(const road of [94,170])for(let z=-162;z<164;z+=12){
  if([-60,0,60].some(n=>Math.abs(z-n)<9))continue;
  for(const side of [-1,1])cube(road+side*5.12,.111,z,.11,.025,.20,0xc8b77f);
 }
 for(const z of [-60,0,60])for(const [x,angle] of [[100,-Math.PI/2],[164,Math.PI/2]]){
  const sz=z+7.9;
  cylinder(poles,x,1.7,sz,.07,3.2,.07,0x6e7b78);
  signs[2].push({x,y:2.8,z:sz,w:2.35,h:.88,d:1,color:0xffffff,angle});
 }
 const atlas=document.createElement('canvas');atlas.width=768;atlas.height=256;
 const q=atlas.getContext('2d');
 q.fillStyle='#767d76';q.fillRect(0,0,768,256);
 q.fillStyle='#eeeee2';q.beginPath();q.arc(128,128,109,0,Math.PI*2);q.fill();q.strokeStyle='#ac493f';q.lineWidth=20;q.stroke();
 q.fillStyle='#303a38';q.font='bold 110px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText('40',128,135);
 q.fillStyle='#eee9d6';q.strokeStyle='#b24d3e';q.lineWidth=16;q.beginPath();q.moveTo(384,24);q.lineTo(492,220);q.lineTo(276,220);q.closePath();q.fill();q.stroke();
 q.fillStyle='#38423e';q.fillRect(374,103,20,73);q.fillRect(379,187,10,10);
 q.fillStyle='#345c51';q.fillRect(512,0,256,256);q.strokeStyle='#d7dfcd';q.lineWidth=7;q.strokeRect(523,13,234,230);
 q.fillStyle='#eef0df';q.font='bold 45px Arial';q.fillText('الكورنيش',640,94);q.font='bold 34px Arial';q.fillText('CORNICHE',640,151);q.font='48px Arial';q.fillText('←',640,207);
 // A little staining belongs in the sign image, not in dozens of decals.
 q.fillStyle='rgba(80,66,40,.06)';for(let i=0;i<160;i++)q.fillRect((i*131)%768,(i*83)%256,1+(i%4),2);
 const texture=new T.CanvasTexture(atlas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const dummy=new T.Object3D(),meshes=[];
 const batch=(items,geometry,material,name,sign=false)=>{
  const mesh=new T.InstancedMesh(geometry,material,items.length);mesh.name=name;
  items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,sign?p.angle:0,sign?0:p.angle);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(p.color))});
  mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.userData.skipFallback=true;scene.add(mesh);meshes.push(mesh);
 };
 for(const [items,geometry,name] of [[cubes,new T.BoxGeometry(1,1,1),'Kerb joints and cast iron ribs'],[poles,new T.CylinderGeometry(1,1,1,8),'Bollards and sign posts'],[covers,new T.CylinderGeometry(1,1,1,24),'Maintenance covers'],[shrubs,new T.IcosahedronGeometry(1,1),'Pavement planting']]){
  batch(items,geometry,new T.MeshLambertMaterial({color:0xffffff}),name);
 }
 const signMaterial=new T.MeshLambertMaterial({map:texture,side:T.DoubleSide});
 signs.forEach((items,index)=>{const geometry=new T.PlaneGeometry(1,1),uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+index)/3);batch(items,geometry,signMaterial,'Street signs '+index,true)});
 return {stats:()=>({drawCalls:meshes.length,props:cubes.length+poles.length+covers.length+shrubs.length+signs.flat().length}),dispose(){
  const materials=new Set();for(const mesh of meshes){scene.remove(mesh);mesh.geometry.dispose();materials.add(mesh.material)}for(const m of materials)m.dispose();texture.dispose();
 }};
}
