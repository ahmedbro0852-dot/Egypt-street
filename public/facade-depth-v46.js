// Physical architectural depth over the existing Cairo wall atlas.
// Shared instanced geometry keeps thousands of fixtures within five draw calls.
export function installFacadeDepthV46({T,scene,renderer}){
 if(!renderer?.isWebGLRenderer)return {enabled:false,stats:()=>({facades:0,fixtures:0})};
 const facades=[];
 scene.traverse(o=>{
  const g=o.geometry?.parameters,image=o.material?.map?.image;
  if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&Math.abs(o.rotation.x)<.1&&
   g.width>8&&g.width<23&&g.height>7&&g.height<30&&image?.width===512&&image?.height===1024)
   facades.push({x:o.position.x,y:o.position.y,z:o.position.z,w:g.width,h:g.height});
 });
 const batches={stone:[],metal:[],ac:[],vents:[],shade:[]};
 const piece=(key,x,y,z,w,h,d)=>batches[key].push([x,y,z,w,h,d]);
 facades.forEach((f,index)=>{
  for(let floor=0;floor<5;floor++)for(let col=0;col<3;col++){
   const x=f.x+((40+84*col)/256-.5)*f.w;
   const y=f.y+(.5-(44+100*floor)/512)*f.h;
   const w=f.w*52/256,h=f.h*60/512,z=f.z+.10;
   // Recess edges, projecting sills and a slim center mullion cast actual shadows.
   for(const side of [-1,1])piece('stone',x+side*(w/2+.05),y,z,.10,h+.16,.14);
   piece('stone',x,y+h/2+.06,z,w+.20,.12,.17);
   piece('stone',x,y-h/2-.08,z+.07,w+.28,.15,.30);
   piece('metal',x,y,z+.035,.045,h,.09);
   if((index+floor+col)%4===0){
    const bottom=y-h/2-.13,front=z+.68;
    piece('stone',x,bottom,z+.31,w+.45,.13,.85);
    piece('metal',x,bottom+.76,front,w+.32,.045,.045);
    for(let rail=0;rail<7;rail++)piece('metal',x-w/2+rail*w/6,bottom+.38,front,.035,.75,.035);
    for(const side of [-1,1])piece('metal',x+side*(w/2+.16),bottom+.76,z+.34,.035,.045,.69);
   }
   if((index*3+floor+col)%7===0){
    const ax=x+w*.36,ay=y-h*.17;
    piece('ac',ax,ay,z+.28,.62,.40,.42);
    piece('vents',ax,ay,z+.498,.44,.28,.016);
    for(let line=0;line<5;line++)piece('ac',ax,ay-.11+line*.055,z+.51,.43,.014,.016);
    piece('metal',ax,ay-.25,z+.25,.70,.035,.38);
   }
   if((index+floor*2+col)%8===0){
    // A shallow metal awning above sun-exposed windows.
    piece('shade',x,y+h/2+.17,z+.26,w+.24,.07,.58);
   }
  }
 });
 const colors={stone:0xb2a18a,metal:0x434c4c,ac:0xc3c2b5,vents:0x303b3c,shade:0x57756d};
 const geometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),meshes=[];
 let fixtures=0;
 for(const [key,parts] of Object.entries(batches)){
  if(!parts.length)continue;
  const material=new T.MeshStandardMaterial({color:colors[key],roughness:key==='stone'?.92:.65,metalness:key==='metal'?.65:.05});
  const mesh=new T.InstancedMesh(geometry,material,parts.length);
  parts.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  mesh.receiveShadow=true;
  // Main architectural edges cast shadows; tiny vent grilles only receive them.
  mesh.castShadow=key==='stone'||key==='metal';mesh.userData.skipFallback=true;scene.add(mesh);meshes.push(mesh);fixtures+=parts.length;
 }
 return {enabled:true,stats:()=>({facades:facades.length,fixtures,drawCalls:meshes.length}),dispose(){for(const mesh of meshes){scene.remove(mesh);mesh.material.dispose()}geometry.dispose()}};
}
