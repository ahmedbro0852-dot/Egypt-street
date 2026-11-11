// Egypt Streets — realistic Egyptian road surfaces, lane rules, curbs and wet asphalt.
// Draw-call efficient procedural batching: no downloaded textures, no external resources.
const MAIN=[-60,-30,0,30,60],OTHER_X=[-139,-95,84,94,170],OTHER_Z=[-133,-93,93,133];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const length=(a,b)=>Math.abs(a-b);
function makeTexture(T,kind){
 const c=document.createElement('canvas');c.width=c.height=512;
 const q=c.getContext('2d');
 let seed=kind==='asphalt'?5903:8971;
 const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647};
 const pavement=kind==='pavement';
 q.fillStyle=pavement?'#b8ab93':'#626767';
 q.fillRect(0,0,512,512);
 const grains=pavement?4900:11500;
 for(let i=0;i<grains;i++){
  const v=Math.round(pavement?130+rand()*65:62+rand()*78);
  const a=pavement?.10+rand()*.16:.16+rand()*.20;
  q.fillStyle='rgba('+v+','+v+','+(pavement?Math.max(40,v-20):v)+','+a.toFixed(2)+')';
  const r=(pavement?1+rand()*2:.45+rand()*2.1);
  q.fillRect(rand()*512,rand()*512,r,r);
 }
 if(pavement){
  q.strokeStyle='rgba(74,66,56,.30)';q.lineWidth=2.0;
  for(let k=0;k<512;k+=75){
   q.beginPath();q.moveTo(k,0);q.lineTo(k,512);q.stroke();
   q.beginPath();q.moveTo(0,k);q.lineTo(512,k);q.stroke();
  }
  for(let i=0;i<26;i++){
   q.fillStyle='rgba(80,69,57,.13)';
   q.fillRect(rand()*512,rand()*512,6+rand()*45,1+rand()*5);
  }
 }else{
  // Longitudinal tar repairs, aggregate and fine irregular cracks.
  for(let i=0;i<16;i++){
   const x=rand()*512,y=rand()*512;
   q.fillStyle=i%2?'rgba(19,26,27,.19)':'rgba(159,161,157,.11)';
   q.fillRect(x,y,3+rand()*35,14+rand()*98);
  }
  for(let i=0;i<31;i++){
   q.beginPath();
   let x=rand()*512,y=rand()*512;
   q.moveTo(x,y);
   for(let j=0;j<7;j++){x+=rand()*30-15;y+=rand()*26-13;q.lineTo(x,y)}
   q.strokeStyle=i%3?'rgba(24,31,32,.45)':'rgba(147,154,149,.27)';
   q.lineWidth=i%3?.7:1.2;q.stroke();
  }
 }
 const texture=new T.CanvasTexture(c);
 texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.colorSpace=T.SRGBColorSpace||undefined;
 texture.anisotropy=2;texture.needsUpdate=true;
 return texture;
}
function sheet(){
 return {p:[],uv:[],count:0};
}
function quad(batch,x1,z1,x2,z2,y,uvScale=1/8,local=false){
 if(x2<=x1||z2<=z1)return;
 const pts=[[x1,z1],[x1,z2],[x2,z2],[x2,z1]];
 const order=[0,1,2,0,2,3];
 for(const n of order){
  const p=pts[n];
  batch.p.push(p[0],y,p[1]);
  batch.uv.push(local?(n===1||n===2?0:1):p[0]*uvScale,local?(n===1||n===0?1:0):p[1]*uvScale);
 }
 batch.count++;
}
function build(T,scene,batch,material){
 if(!batch.count)return null;
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(batch.p,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(batch.uv,2));
 geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,material);
 mesh.frustumCulled=true;mesh.userData.isRoadRealism=true;
 scene.add(mesh);
 return mesh;
}
function segments(min,max,breaks,margin=9){
 const ordered=breaks.filter(x=>x>min&&x<max).sort((a,b)=>a-b);
 let current=min;const out=[];
 for(const p of ordered){
  if(p-margin>current)out.push([current,p-margin]);
  current=Math.max(current,p+margin);
 }
 if(current<max)out.push([current,max]);
 return out.filter(([a,b])=>b-a>4);
}
export function createRealisticRoads({T,scene,enableWet=true}={}){
 const surfaces=sheet(),pavements=sheet(),curbStone=sheet(),
   edge=sheet(),center=sheet(),zebra=sheet(),warning=sheet(),repairs=sheet(),
   puddles=sheet(),reflectors=sheet();
 const asphalt=makeTexture(T,'asphalt'),sidewalk=makeTexture(T,'pavement');
 const roads=[],speedBumps=[],patches=[],puddlePoints=[];
 const vertical=[
  ...MAIN.map(x=>({axis:'z',value:x,min:-85,max:85,width:11,height:.065,kind:'inner'})),
  ...[-139,-95,84].map(x=>({axis:'z',value:x,min:-169,max:169,width:10,height:.075,kind:'outer'})),
  {axis:'z',value:94,min:-172,max:172,width:11,height:.096,kind:'corniche'},
  {axis:'z',value:170,min:-172,max:172,width:11,height:.076,kind:'corniche'}
 ];
 const horizontal=[
  ...MAIN.map(z=>({axis:'x',value:z,min:-85,max:85,width:11,height:.065,kind:'inner'})),
  ...OTHER_Z.map(z=>({axis:'x',value:z,min:-149,max:114,width:10.8,height:.076,kind:'outer'})),
  ...[-60,0,60].map(z=>({axis:'x',value:z,min:87,max:177,width:11.5,height:.405,kind:'bridge'}))
 ];
 const verticalCross=[...MAIN,...OTHER_X];
 const horizontalCross=[...MAIN,...OTHER_Z];
 for(const road of [...vertical,...horizontal]){
  roads.push(road);
  const half=road.width/2,y=road.height;
  const along=road.axis==='z';
  // Main road surface. Crossings are trimmed on horizontal stretches, avoiding
  // overlapping coplanar triangles and the resulting flickering.
  const crossings=along?horizontalCross:verticalCross;
  const surfaceIntervals=along?[[road.min,road.max]]:
    segments(road.min,road.max,vertical.filter(v=>v.min<=road.value&&v.max>=road.value).map(v=>v.value),5.5);
  for(const [a,b] of surfaceIntervals){
   if(along)quad(surfaces,road.value-half,a,road.value+half,b,y);
   else quad(surfaces,a,road.value-half,b,road.value+half,y);
  }
  // Continuous, non-colliding concrete pavements and painted kerbs.
  const safe=segments(road.min,road.max,crossings,9.0);
  for(const [a,b] of safe){
   for(const side of [-1,1]){
    const outer=road.value+side*(half+.17);
    const centre=road.value+side*(half+.90);
    if(along){
     quad(pavements,centre-.55,a,centre+.55,b,y+.018);
     quad(curbStone,outer-.18,a,outer+.18,b,y+.061);
     quad(edge,road.value+side*(half-.35)-.05,a,road.value+side*(half-.35)+.05,b,y+.020);
    }else{
     quad(pavements,a,centre-.55,b,centre+.55,y+.018);
     quad(curbStone,a,outer-.18,b,outer+.18,y+.061);
     quad(edge,a,road.value+side*(half-.35)-.05,b,road.value+side*(half-.35)+.05,y+.020);
    }
    // Faded reflective marker slabs along pavement edges, every 30 metres.
    for(let k=Math.ceil(a/30)*30;k<b-1;k+=30){
     if(along)quad(reflectors,outer-.13,k,outer+.13,k+.95,y+.064);
     else quad(reflectors,k,outer-.13,k+.95,outer+.13,y+.064);
    }
   }
  }
  // Faded dashed centerline with road-conscious intersection gaps.
  for(let k=road.min+6;k<road.max-2;k+=10){
   if(crossings.some(j=>Math.abs(j-k)<10))continue;
   if(along)quad(center,road.value-.08,k,road.value+.08,k+3.7,y+.022);
   else quad(center,k,road.value-.08,k+3.7,road.value+.08,y+.022);
  }
 }
 // The main 3x3 grid has safe zebra crossings before each signal.
 for(const x of [-60,0,60])for(const z of [-60,0,60]){
  for(const direction of [-1,1]){
   for(let j=-4;j<=4;j++){
    const offset=j*1.05;
    quad(zebra,x+offset-.38,z+direction*11.4-1.15,
       x+offset+.38,z+direction*11.4+1.15,.091);
    quad(zebra,x+direction*11.4-1.15,z+offset-.38,
       x+direction*11.4+1.15,z+offset+.38,.091);
   }
  }
 }
 // Raised-but-safe visual speed bumps away from traffic lights. The force is
 // simulated as a brief suspension shudder, not a physics collider.
 const bumps=[
  {x:0,z:43,axis:'z'}, {x:30,z:-44,axis:'z'},
  {x:-30,z:45,axis:'z'},{x:60,z:-44,axis:'z'},
  {x:-44,z:-30,axis:'x'}, {x:43,z:30,axis:'x'}
 ];
 for(const b of bumps){
  b.radius=1.3;speedBumps.push(b);
  for(let k=-4;k<=4;k++){
   const p=k*1.05,color=k%2===0?warning:repairs;
   if(b.axis==='z')quad(color,b.x+p-.53,b.z-.65,b.x+p+.53,b.z+.65,.105);
   else quad(color,b.x-.65,b.z+p-.53,b.x+.65,b.z+p+.53,.105);
  }
 }
 const patched=[
  {x:-60,z:44},{x:0,z:-43},{x:30,z:20},{x:60,z:38},
  {x:-95,z:29},{x:94,z:-101},{x:-139,z:94}
 ];
 for(const p of patched){
  patches.push(p);
  quad(repairs,p.x-1.40,p.z-2.20,p.x+1.40,p.z+2.20,.099);
  quad(edge,p.x-1.42,p.z-2.20,p.x-1.38,p.z+2.20,.105);
 }
 const puddleCenters=[
  {x:-58,z:20},{x:2.9,z:51},{x:32,z:-17},{x:62,z:17},{x:-31,z:66},
  {x:-92,z:-52},{x:96,z:54},{x:-139,z:-38},{x:170,z:14}
 ];
 for(const p of puddleCenters){
  puddlePoints.push(p);const road=roads.find(r=>r.axis==='z'&&Math.abs(r.value-p.x)<6);
  const y=(road?.height||.065)+.028;
  quad(puddles,p.x-1.25,p.z-2.1,p.x+1.25,p.z+2.1,y,1,true);
 }
 const asphaltMat=new T.MeshStandardMaterial({map:asphalt,color:0xf9f8f4,roughness:.95,metalness:.015,side:T.DoubleSide});
 const kerbMat=new T.MeshLambertMaterial({color:0xb9aa8c,side:T.DoubleSide});
 const pathMat=new T.MeshLambertMaterial({map:sidewalk,color:0xe6d5b2,side:T.DoubleSide});
 const paint=(color,alpha=1)=>new T.MeshBasicMaterial({
  color,transparent:alpha<1,opacity:alpha,depthWrite:alpha>=1,side:T.DoubleSide
 });
 const all=[
  build(T,scene,surfaces,asphaltMat),build(T,scene,pavements,pathMat),
  build(T,scene,curbStone,kerbMat),build(T,scene,edge,paint(0xe9e4d6,.78)),
  build(T,scene,center,paint(0xecc66d,.81)),
  build(T,scene,zebra,paint(0xf3eee0,.89)),
  build(T,scene,warning,paint(0xf9c75e,.94)),
  build(T,scene,repairs,paint(0x33383a,.92)),
  build(T,scene,reflectors,paint(0xf8d18a,.95))
 ].filter(Boolean);
 // Puddle surfaces are only visible during rain, with a low-cost shared material.
 const pondCanvas=document.createElement('canvas');pondCanvas.width=pondCanvas.height=128;
 const pc=pondCanvas.getContext('2d'),rad=pc.createRadialGradient(64,64,6,64,64,64);
 rad.addColorStop(0,'rgba(115,153,168,.70)');rad.addColorStop(.65,'rgba(95,139,150,.44)');
 rad.addColorStop(1,'rgba(95,139,150,0)');
 pc.fillStyle=rad;pc.fillRect(0,0,128,128);
 const pondTexture=new T.CanvasTexture(pondCanvas);pondTexture.needsUpdate=true;
 const pondMat=new T.MeshBasicMaterial({map:pondTexture,color:0xb4ced0,
   transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
 const pondMesh=build(T,scene,puddles,pondMat);
 if(pondMesh){all.push(pondMesh);pondMesh.visible=false}
 let lastWet=-1;
 function update(weather='صحو'){
  const isWet=weather==='مطر',wet=isWet?1:weather==='غائم'?.28:0;
  if(wet===lastWet)return;
  lastWet=wet;
  asphaltMat.roughness=.95-wet*.43;
  asphaltMat.metalness=.015+wet*.095;
  asphaltMat.color.setHex(isWet?0xc5d2d4:weather==='غائم'?0xe2e3de:0xf9f8f4);
  asphaltMat.needsUpdate=true;
  pondMat.opacity=isWet?.64:weather==='غائم'?.15:0;
  if(pondMesh)pondMesh.visible=pondMat.opacity>.02;
 }
 function surfaceAt(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return {grip:1,bump:0,onRoad:false};
  const lane=roads.find(r=>(r.axis==='z'?
    Math.abs(x-r.value)<r.width*.55&&z>=r.min&&z<=r.max:
    Math.abs(z-r.value)<r.width*.55&&x>=r.min&&x<=r.max));
  let grip=1,bump=0;
  for(const b of speedBumps){
   const down=b.axis==='z'?Math.abs(z-b.z):Math.abs(x-b.x);
   const side=b.axis==='z'?Math.abs(x-b.x):Math.abs(z-b.z);
   if(down<1.6&&side<5.3){
    bump=Math.max(bump,(1-down/1.6)*clamp(Math.abs(x)+Math.abs(z)>0?1:1,0,1));
    grip=Math.min(grip,.96);
   }
  }
  if(patches.some(p=>Math.abs(x-p.x)<1.9&&Math.abs(z-p.z)<2.6))grip=Math.min(grip,.93);
  return {grip,bump,onRoad:!!lane,wet:lastWet,roadType:lane?.kind||'unpaved'};
 }
 update();
 return {update,surfaceAt,stats:()=>({
  roadSegments:roads.length,roadMeshes:all.length,
  batchCount:surfaces.count+pavements.count+curbStone.count+edge.count+center.count+zebra.count+warning.count+repairs.count+puddles.count+reflectors.count,
  crossings:9,speedBumps:speedBumps.length,roadPatches:patches.length,puddles:puddlePoints.length
 }),dispose(){
  for(const m of all){m.geometry?.dispose?.();scene.remove(m)}
  [asphalt,sidewalk,pondTexture].forEach(t=>t.dispose?.());
  [asphaltMat,kerbMat,pathMat,pondMat].forEach(m=>m.dispose?.());
 }};
}
