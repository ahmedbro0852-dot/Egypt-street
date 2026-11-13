import * as T from './three.js';

// Shared, small fabric relief maps. No extra meshes or remote assets.
export function finishCharacter(model){
 const cloth=document.createElement('canvas');cloth.width=cloth.height=128;
 const ctx=cloth.getContext('2d'),pixels=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const i=(y*128+x)*4,v=128+((x+y)%4===0?22:-6)+(x%2?7:-7);
  pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 const weave=new T.CanvasTexture(cloth);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(18,18);
 const materials=new Set();
 model.traverse(mesh=>{if(!mesh.isMesh)return;for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
  if(materials.has(material))continue;materials.add(material);
  const name=material.name||'';
  if(/original top|original bottom/.test(name)){
   material.color.set(/original top/.test(name)?'#69704a':'#292c2d');
   material.bumpMap=weave;material.bumpScale=.0012;material.roughness=.94;
   // Physical cloth sheen adds grazing-angle fibers without making fabric metallic.
   const physical=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(physical,material);physical.sheen=.35;physical.sheenRoughness=.9;physical.sheenColor.set('#7d8790');
   if(Array.isArray(mesh.material))mesh.material=mesh.material.map(m=>m===material?physical:m);else mesh.material=physical;
  }else if(/\.body$/.test(name)){material.roughness=.62;material.envMapIntensity=.45}
  else if(/short01|hair roots/.test(name)){material.roughness=.87;material.envMapIntensity=.35}
  else if(/low-poly/.test(name)){material.roughness=.28;material.envMapIntensity=.65}
  else if(/teeth_base/.test(name)){material.roughness=.42}
  else if(/shoes01/.test(name)){material.color.set('#262521');material.roughness=.68}
 }});
}
