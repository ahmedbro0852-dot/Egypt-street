// V60: physical depth for Cairo's painted wall atlas, now supported on touch GPUs.
// Instanced geometry; reduced window/awning density on memory-constrained phones.
export function installFacadeDepthV46({T,scene,renderer}){
 const mobile=!!(window.matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>1);
 if(!renderer?.isWebGLRenderer)return {enabled:false,stats:()=>({facades:0,fixtures:0})};
 const lowEnd=mobile&&((Number(navigator.deviceMemory)||4)<=3||(Number(navigator.hardwareConcurrency)||4)<=4);
 const budget=mobile?(lowEnd?52:72):Infinity;
 const facades=[];
 scene.traverse(o=>{
  const g=o.geometry?.parameters,image=o.material?.map?.image;
  if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&Math.abs(o.rotation.x)<.1&&
   g.width>8&&g.width<23&&g.height>7&&g.height<30&&image?.width>=256&&image?.height===image?.width*2)
   facades.push({x:o.position.x,y:o.position.y,z:o.position.z,w:g.width,h:g.height});
 });
 const batches={stone:[],metal:[],ac:[],vents:[],shade:[]};
 const piece=(key,x,y,z,w,h,d)=>batches[key].push([x,y,z,w,h,d]);
 const source=facades.slice(0,budget);
 const floors=mobile?(lowEnd?[0,2,4]:[0,1,2,3,4]):[0,1,2,3,4];
 const columns=mobile?(lowEnd?[0,2]:[0,1,2]):[0,1,2];
 source.forEach((f,index)=>{
  for(const floor of floors)for(const col of columns){
   const x=f.x+((40+84*col)/256-.5)*f.w;
   const y=f.y+(.5-(44+100*floor)/512)*f.h;
   const w=f.w*52/256,h=f.h*60/512,z=f.z+.10;
   // Mobile: keep four real raised window edges and a sill; desktop unchanged.
   for(const side of [-1,1])piece('stone',x+side*(w/2+.05),y,z,.10,h+.16,.14);
   piece('stone',x,y+h/2+.06,z,w+.20,.12,.17);
   piece('stone',x,y-h/2-.08,z+.07,w+.28,.15,.30);
   if(!lowEnd)piece('metal',x,y,z+.035,.045,h,.09);
   if((index+floor+col)%(lowEnd?8:4)===0){
    const bottom=y-h/2-.13,front=z+.68;
    piece('stone',x,bottom,z+.31,w+.45,.13,.85);
    piece('metal',x,bottom+.76,front,w+.32,.045,.045);
    for(let rail=0;rail<(lowEnd?4:7);rail++){const n=lowEnd?3:6;piece('metal',x-w/2+rail*w/n,bottom+.38,front,.035,.75,.035)}
    for(const side of [-1,1])piece('metal',x+side*(w/2+.16),bottom+.76,z+.34,.035,.045,.69);
   }
   if((index*3+floor+col)%(lowEnd?13:7)===0){
    const ax=x+w*.36,ay=y-h*.17;
    piece('ac',ax,ay,z+.28,.62,.40,.42);
    piece('vents',ax,ay,z+.498,.44,.28,.016);
    if(!lowEnd)for(let line=0;line<5;line++)piece('ac',ax,ay-.11+line*.055,z+.51,.43,.014,.016);
    piece('metal',ax,ay-.25,z+.25,.70,.035,.38);
   }
   if((index+floor*2+col)%(mobile?13:8)===0){
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
  mesh.receiveShadow=!mobile;
  // No costly dynamic caster flags for mobile; retain desktop shadows.
  mesh.castShadow=!mobile&&(key==='stone'||key==='metal');mesh.userData.skipFallback=true;scene.add(mesh);meshes.push(mesh);fixtures+=parts.length;
 }
 return {enabled:true,stats:()=>({facades:source.length,fixtures,drawCalls:meshes.length,lowEnd}),dispose(){for(const mesh of meshes){scene.remove(mesh);mesh.material.dispose()}geometry.dispose()}};
}
