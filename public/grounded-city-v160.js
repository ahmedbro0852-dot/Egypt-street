// V160: tangible masonry, street furniture and pooled contact shadows.
// All assets are local; no postprocessing, shadow maps or extra render loop.
export function installGroundedCityV160({T,scene,renderer,mobile=false,getActors=()=>[]}={}){
 if(!renderer?.isWebGLRenderer)return {update(){},stats:()=>({enabled:false}),dispose(){}};
 const owned=[],meshes=[],changed=new Map();
 let seed=160;const random=()=>((seed=seed*16807%2147483647)/2147483647);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#d2c9b8';ctx.fillRect(0,0,256,256);
 for(let i=0;i<6500;i++){const v=100+Math.floor(random()*130);ctx.fillStyle=`rgba(${v},${v-8},${v-16},.18)`;ctx.fillRect(random()*256,random()*256,1+random()*3,1+random()*3)}
 for(let i=0;i<24;i++){ctx.fillStyle='rgba(65,53,40,.045)';ctx.fillRect(random()*256,0,1+random()*4,256)}
 ctx.strokeStyle='rgba(62,52,40,.2)';ctx.lineWidth=.6;
 for(let i=0;i<12;i++){let x=random()*256,y=random()*256;ctx.beginPath();ctx.moveTo(x,y);for(let k=0;k<7;k++){x+=random()*12-6;y+=random()*9;ctx.lineTo(x,y)}ctx.stroke()}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(2,4);owned.push(texture);
 let walls=0;
 // Run before static batching: keep Lambert materials so mobile batching survives.
 for(const o of scene.children){const p=o.geometry?.parameters,m=o.material;
  if(!o.isMesh||o.geometry?.type!=='BoxGeometry'||!m?.isMeshLambertMaterial||m.map||p.height<7||p.width<4||p.depth<4)continue;
  if(!changed.has(m)){const next=m.clone();next.map=texture;next.needsUpdate=true;changed.set(m,next);owned.push(next)}
  o.material=changed.get(m);walls++;
 }
 const cube=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();owned.push(cube);
 const batches={stone:[],iron:[],fabric:[]};
 const add=(key,x,y,z,w,h,d,color)=>batches[key].push({x,y,z,w,h,d,color});
 // Pavement furniture sits outside the 11-metre carriageways.
 for(const road of [-60,-30,0,30,60])for(const z of [-70,-40,-10,20,50,77]){
  const x=road+6.25;
  add('stone',x,.22,z,.38,.44,.38,0xb3a38b);
  add('iron',x,.73,z,.12,.66,.12,0x3c4947);
  if((z+70)%30===0){
   add('stone',x+.8,.21,z+2,1.3,.42,.52,0xaa9479);
   add('fabric',x+.8,.45,z+2,1.34,.08,.56,0x756144);
   add('iron',x+.8,.76,z+2.24,1.34,.45,.07,0x465951);
  }
 }
 for(const [key,items] of Object.entries(batches)){
  const material=new T.MeshLambertMaterial({color:0xffffff});owned.push(material);
  const mesh=new T.InstancedMesh(cube,material,items.length);mesh.name='V160 pavement '+key;
  items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(p.color))});
  mesh.computeBoundingSphere();mesh.userData.skipFallback=true;scene.add(mesh);meshes.push(mesh);
 }
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
 const q=shadowCanvas.getContext('2d'),gradient=q.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'rgba(20,16,12,.48)');gradient.addColorStop(.5,'rgba(20,16,12,.24)');gradient.addColorStop(1,'rgba(20,16,12,0)');q.fillStyle=gradient;q.fillRect(0,0,64,64);
 const shadowTexture=new T.CanvasTexture(shadowCanvas),shadowGeometry=new T.PlaneGeometry(1,1);
 const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});owned.push(shadowTexture,shadowGeometry,shadowMaterial);
 const capacity=mobile?32:64,shadows=new T.InstancedMesh(shadowGeometry,shadowMaterial,capacity);
 shadows.name='V160 pooled contact shadows';shadows.frustumCulled=false;shadows.userData.skipFallback=true;shadows.count=0;shadows.renderOrder=1;scene.add(shadows);meshes.push(shadows);
 function update(){let count=0;for(const actor of getActors()){
   const object=actor?.object||actor;if(!object?.position||object.visible===false||count>=capacity)continue;
   const pedestrian=actor?.pedestrian===true;
   dummy.position.set(object.position.x,.082,object.position.z);dummy.rotation.set(-Math.PI/2,0,-(object.rotation?.y||0));
   dummy.scale.set(pedestrian?.85:2.9,pedestrian?.65:5.5,1);dummy.updateMatrix();shadows.setMatrixAt(count++,dummy.matrix);
  }shadows.count=count;shadows.instanceMatrix.needsUpdate=true;
 }
 return {update,stats:()=>({enabled:true,walls,drawCalls:4,shadowCapacity:capacity}),dispose(){for(const mesh of meshes)scene.remove(mesh);for(const resource of owned)resource.dispose()}};
}
