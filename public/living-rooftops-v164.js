// Shared geometry, three bounded draw calls; decorative elements have no collision.
export function installLivingRooftopsV164({T,scene,renderer,mobile=false,reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')}={}){
 const off={update(){},dispose(){},stats:()=>({enabled:false})};
 if(!renderer?.isWebGLRenderer)return off;
 const roofs=[];
 for(const o of scene.children){const p=o.geometry?.parameters;
  if(o.isMesh&&o.geometry.type==='BoxGeometry'&&p.width>=9&&p.width<=11&&p.depth>=17&&p.depth<=22&&p.height>=10)
   roofs.push({x:o.position.x,z:o.position.z,y:o.position.y+p.height/2+.8});
 }
 const sites=roofs.slice(0,mobile?8:16),dummy=new T.Object3D(),color=new T.Color();
 const cube=new T.BoxGeometry(1,1,1),cloth=new T.PlaneGeometry(1,1,6,4);
 // Pin the upper edge while wind bends the lower fabric, including vertex normals.
 const fabric=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide});
 const wind={value:0};
 fabric.onBeforeCompile=shader=>{shader.uniforms.roofWind=wind;
  shader.vertexShader='uniform float roofWind;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float loose = .5 - position.y;
   transformed.z += sin(position.x * 5.0 + roofWind) * loose * loose * .13;
  `).replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   float freeEdge = .5 - position.y;
   objectNormal = normalize(vec3(-cos(position.x * 5.0 + roofWind) * freeEdge * freeEdge * .65,
     sin(position.x * 5.0 + roofWind) * freeEdge * .26, 1.0));`);
 };
 fabric.customProgramCacheKey=()=> 'roof-cloth-v164';
 const iron=new T.MeshLambertMaterial({color:0x525d60}),birdMaterial=new T.MeshLambertMaterial({color:0x3b4148,side:T.DoubleSide});
 const fittings=new T.InstancedMesh(cube,iron,sites.length*3);
 const laundry=new T.InstancedMesh(cloth,fabric,sites.length*4);
 const birdCount=mobile?8:18,birds=new T.InstancedMesh(new T.PlaneGeometry(1,1),birdMaterial,birdCount*2);
 const meshes=[fittings,laundry,birds];
 function set(mesh,index,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix)}
 sites.forEach((r,i)=>{
  for(let side=0;side<2;side++)set(fittings,i*3+side,r.x+(side?2.7:-2.7),r.y+.85,r.z,.055,1.7,.055);
  set(fittings,i*3+2,r.x,r.y+1.65,r.z,5.5,.025,.025);
  for(let j=0;j<4;j++){set(laundry,i*4+j,r.x-1.9+j*1.25,r.y+1.03,r.z,.8,1.15,1);laundry.setColorAt(i*4+j,color.setHex([0xb8c9cb,0xc18d72,0xe4dac4,0x668a85][(i+j)%4]))}
 });
 fittings.name='V164 rooftop lines';laundry.name='V164 wind laundry';birds.name='V164 circling birds';
 for(const mesh of meshes){mesh.userData.skipFallback=true;mesh.frustumCulled=false;scene.add(mesh)}
 fittings.instanceMatrix.needsUpdate=true;laundry.instanceMatrix.needsUpdate=true;
 let clock=0;
 function update(dt=0,{active=true,paused=false}={}){
  if(active&&!paused&&!reducedMotion?.matches)clock+=Math.min(Math.max(dt,0),.05);
  wind.value=clock*1.8;
  for(let i=0;i<birdCount;i++){
   const phase=clock*(.18+(i%3)*.035)+i*2.399,radius=18+(i%4)*8;
   const x=Math.cos(phase)*radius,z=Math.sin(phase)*radius,y=30+(i%5)*1.4+Math.sin(phase*2)*.6;
   const flap=Math.sin(clock*6+i)*.55;
   for(let side=0;side<2;side++)set(birds,i*2+side,x+Math.cos(phase)*(side? .22:-.22),y,z+Math.sin(phase)*(side?.22:-.22),.48,.18,1,-Math.PI/2,0,phase+(side?flap:-flap));
  }
  birds.instanceMatrix.needsUpdate=true;
 }
 update();
 return {update,stats:()=>({enabled:true,roofs:sites.length,birds:birdCount,drawCalls:3}),dispose(){for(const mesh of meshes)scene.remove(mesh);for(const r of [cube,cloth,birds.geometry,fabric,iron,birdMaterial])r.dispose()}};
}
