// V52: InstancedMesh batching for static Cairo scene boxes on touch devices.
// No modifications to physics/collision, vehicles, NPCs, missions or save state.
export function installMobileStaticBatchingV52({T,scene,renderer,mobileLite=false}={}){
 if(!mobileLite||!renderer?.isWebGLRenderer||!T?.InstancedMesh)return {enabled:false,batched:0,drawCallsSaved:0};
 const cells=new Map(),maxSize=40;
 for(const obj of [...scene.children]){
  if(!obj.isMesh||obj.children.length||obj.geometry?.type!=='BoxGeometry'||!obj.material?.isMeshLambertMaterial||obj.material.transparent||!obj.visible||obj.userData?.noBatch)continue;
  const p=obj.geometry.parameters||{},w=p.width,h=p.height,d=p.depth;
  if(![w,h,d].every(n=>Number.isFinite(n)&&n>0&&n<=maxSize))continue;
  const x=obj.position.x,z=obj.position.z;
  if(!Number.isFinite(x)||!Number.isFinite(z))continue;
  const key=obj.material.uuid+':'+Math.floor(x/58)+':'+Math.floor(z/58);
  if(!cells.has(key))cells.set(key,{material:obj.material,objects:[]});
  cells.get(key).objects.push(obj);
 }
 let batched=0,groups=0;
 const geometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),created=[];
 for(const group of cells.values()){
  if(group.objects.length<3)continue;
  const mesh=new T.InstancedMesh(geometry,group.material,group.objects.length);
  mesh.name='Mobile Cairo static block V52';
  for(let i=0;i<group.objects.length;i++){
   const original=group.objects[i],p=original.geometry.parameters;
   dummy.position.copy(original.position);
   dummy.rotation.copy(original.rotation);
   dummy.scale.set(p.width*original.scale.x,p.height*original.scale.y,p.depth*original.scale.z);
   dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.computeBoundingSphere?.();
  mesh.frustumCulled=true;
  mesh.receiveShadow=false;mesh.castShadow=false;
  mesh.userData.skipFallback=true;
  scene.add(mesh);created.push(mesh);groups++;
  for(const original of group.objects){
   scene.remove(original);
   original.geometry.dispose();
   batched++;
  }
 }
 if(!groups)geometry.dispose();
 return {enabled:groups>0,batched,groups,drawCallsSaved:Math.max(0,batched-groups),
  dispose(){for(const mesh of created)scene.remove(mesh);geometry.dispose()}};
}
