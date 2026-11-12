// V60: sculpted Cairo storefronts, rooftop equipment and sidewalk planters.
// Static instanced meshes keep additional draw calls below six.
export function installCitySculptV60({T,scene,renderer,mobile=false,lowEnd=false}={}){
 const off={enabled:false,stats:()=>({enabled:false,drawCalls:0}),dispose(){},update(){}};
 if(!renderer?.isWebGLRenderer||!T?.InstancedMesh||!T?.BoxGeometry)return off;
 const facades=[];
 scene.traverse(o=>{
  const g=o.geometry?.parameters,map=o.material?.map?.image;
  if(o.isMesh&&o.geometry?.type==='PlaneGeometry'&&Math.abs(o.rotation.x)<.1&&
     g.width>8&&g.width<23&&g.height>7&&g.height<30&&map?.height===map?.width*2&&map.width>=256){
   facades.push({x:o.position.x,y:o.position.y,z:o.position.z,w:g.width,h:g.height});
  }
 });
 const limit=mobile?(lowEnd?16:34):44;
 const step=lowEnd?3:2;
 const targets=facades.filter((_,i)=>i%step===0).slice(0,limit);
 const batches={canopy:[],trim:[],steel:[],planter:[],leaves:[],roof:[]};
 const item=(key,x,y,z,w,h,d,tilt=0,color=0xffffff)=>batches[key].push({x,y,z,w,h,d,tilt,color});
 for(let i=0;i<targets.length;i++){
  const f=targets[i],front=f.z+.17,awningWidth=f.w*.65;
  // A real overhanging three-dimensional fabric shop awning, not a flat decal.
  item('canopy',f.x,2.83,front+.52,awningWidth,.11,.98,-.11,
   [0x446d68,0xa26848,0x9d7f4f,0x607b92][i%4]);
  item('trim',f.x,2.36,front+.94,awningWidth,.16,.10,0,0xdfd1aa);
  for(const side of [-1,1]){
   item('steel',f.x+side*awningWidth*.46,1.79,front+.91,.06,1.34,.06);
  }
  // Painted 3D signs and miniature rooftop equipment provide skyline depth.
  item('trim',f.x,3.41,front+.09,f.w*.60,.38,.12,0,0xe4bf81);
  if(i%2===0){
   const height=f.y+f.h*.5+1.24;
   item('roof',f.x+f.w*.20,height,f.z-1.75,1.18,.83,.76);
   item('steel',f.x+f.w*.20,height+.43,f.z-1.75,.55,.07,.63);
  }
  if(i%3===0&&!lowEnd){
   // Compact planters sit against the wall and do not change collision.
   const px=f.x+f.w*.31,pz=front+.38;
   item('planter',px,.33,pz,.66,.62,.58);
   item('leaves',px,.78,pz,.77,.54,.67);
  }
 }
 const colors={canopy:0xffffff,trim:0xffffff,steel:0x536269,
  planter:0xb69b70,leaves:0x547f4b,roof:0x8c938d};
 const material=new Map(),meshes=[],owned=[];
 const cube=new T.BoxGeometry(1,1,1),leafGeo=new T.SphereGeometry(1,7,5),dummy=new T.Object3D();
 owned.push(cube,leafGeo);
 const color=new T.Color();
 for(const [key,items] of Object.entries(batches)){
  if(items.length===0)continue;
  const mat=new T.MeshLambertMaterial({color:colors[key]});
  material.set(key,mat);owned.push(mat);
  const mesh=new T.InstancedMesh(key==='leaves'?leafGeo:cube,mat,items.length);
  mesh.name='V60 Cairo 3D '+key;
  items.forEach((p,i)=>{
   dummy.position.set(p.x,p.y,p.z);
   dummy.rotation.set(p.tilt,0,0);
   dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);
   if(key==='canopy'||key==='trim'){color.setHex(p.color);mesh.setColorAt(i,color)}
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.userData.skipFallback=true;
  mesh.computeBoundingSphere?.();scene.add(mesh);meshes.push(mesh);
 }
 function dispose(){for(const mesh of meshes)scene.remove(mesh);for(const resource of owned)resource.dispose?.()}
 return {enabled:meshes.length>0,update(){},dispose,stats:()=>({
  enabled:true,shops:targets.length,drawCalls:meshes.length,
  geometryInstances:Object.values(batches).reduce((n,a)=>n+a.length,0)
 })};
}
