// Three Nile crossings, four shared instanced batches, no downloaded assets.
export const NILE_BRIDGE_CENTERS=[-60,0,60];
export function bridgeRiseAt(x){
 const t=Math.max(0,Math.min(1,(x-87)/14,(177-x)/14));
 return t*t*(3-2*t);
}
export function bridgeSurfaceHeightAt(x){
 const base=x<132?.096:.076;
 return base+(.405-base)*bridgeRiseAt(x);
}
export function createNileBridges({T,scene,solids}){
 const concrete=[],steel=[],paving=[],lights=[];
 const piece=(batch,x,y,z,w,h,d,angle=0)=>batch.push({x,y,z,w,h,d,angle});
 for(const z of NILE_BRIDGE_CENTERS){
  piece(concrete,132,.20,z,62,.40,14.6);
  // Short sloped deck segments follow the same profile as asphalt and physics.
  for(const [start,end] of [[87,101],[163,177]])for(let x=start;x<end;x++){
   const a=bridgeSurfaceHeightAt(x)-.005,b=bridgeSurfaceHeightAt(x+1)-.005;
   const angle=Math.atan2(b-a,1);
   piece(concrete,x+.5+.2*Math.sin(angle),(a+b)/2-.2*Math.cos(angle),z,Math.hypot(1,b-a),.4,14.6,angle);
  }
  for(const side of [-1,1]){
   const edge=z+side*6.95;
   piece(paving,132,.48,z+side*6.25,91,.14,1.05);
   piece(concrete,132,.55,z+side*5.75,91,.22,.24);
   piece(steel,132,.96,edge,91,.10,.10);
   piece(steel,132,1.47,edge,91,.10,.12);
   for(let x=88;x<=176;x+=2.75)piece(steel,x,1.01,edge,.085,1.02,.085);
   // The arch and hangers sit outside the vehicle envelope.
   const point=t=>({x:104+t*54,y:1.5+4.8*Math.sin(Math.PI*t)});
   for(let i=0;i<24;i++){
    const a=point(i/24),b=point((i+1)/24);
    piece(steel,(a.x+b.x)/2,(a.y+b.y)/2,edge,
     Math.hypot(b.x-a.x,b.y-a.y),.24,.24,Math.atan2(b.y-a.y,b.x-a.x));
   }
   for(let i=2;i<24;i+=2){const p=point(i/24);piece(steel,p.x,(p.y+.48)/2,edge,.055,p.y-.48,.055)}
   for(const x of [100,116,132,148,164]){
    piece(steel,x,2.6,z+side*6.45,.10,4.15,.10);
    piece(steel,x,4.63,z+side*6.1,.16,.10,.8);
    piece(lights,x,4.57,z+side*5.83,.30,.045,.52);
    piece(lights,x,.72,z+side*5.60,.40,.10,.035);
   }
   // Physical rails stop the car before the visible balustrade.
   solids.push({x:132,z:edge,w:45.5,d:.12});
  }
  for(const x of [113,133,154]){
   piece(concrete,x,-1.7,z,2.6,4,10.5);
   piece(concrete,x,-.12,z,4.2,.45,13.4);
  }
  for(const side of [-1,1])piece(steel,132,.13,z+side*4.9,89,.32,.25);
 }
 const geometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),meshes=[];
 for(const [parts,color,emissive] of [[concrete,0xb6b1a6,false],[steel,0x365d62,false],[paving,0xd2c8b5,false],[lights,0xffdf9b,true]]){
  const material=emissive?new T.MeshBasicMaterial({color}):new T.MeshLambertMaterial({color});
  const mesh=new T.InstancedMesh(geometry,material,parts.length);
  mesh.name='Nile bridge '+(emissive?'lamps':color.toString(16));mesh.userData.skipFallback=true;
  parts.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,p.angle);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;scene.add(mesh);meshes.push(mesh);
 }
 return {meshes,stats:{bridges:3,drawCalls:meshes.length,parts:concrete.length+steel.length+paving.length+lights.length}};
}
