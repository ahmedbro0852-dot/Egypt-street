// Egypt Streets V32: isolated purpose-built racetrack outside crowded Cairo.
// A shared 560m asphalt circuit in an open fenced field; no houses, shops or traffic.
export const RACE_CIRCUIT_V32=[
 [315,74],[352,74],[394,74],[438,66],[460,42],[461,0],[460,-43],
 [440,-68],[398,-75],[356,-75],[316,-70],[295,-44],[295,0],[299,44]
];
export const RACE_ARENA_BOUNDS_V32={left:272,right:495,top:-104,bottom:104};
export function isRaceArenaV32(x,z){
 return x>254&&x<515&&z>-122&&z<122;
}
export function createRaceArenaV32({T,scene}={}){
 const group=new T.Group();
 group.visible=false;scene.add(group);
 const asphalt=new T.MeshStandardMaterial({color:0x343d43,roughness:.96,metalness:.04});
 const gravel=new T.MeshLambertMaterial({color:0x9b8863});
 const grass=new T.MeshLambertMaterial({color:0x6d815d});
 const offWhite=new T.MeshBasicMaterial({color:0xf6edcf});
 const yellow=new T.MeshBasicMaterial({color:0xf4c655});
 const red=new T.MeshBasicMaterial({color:0xd34e38});
 const light=new T.MeshBasicMaterial({color:0xe1e5df});
 const rail=new T.MeshStandardMaterial({color:0xb7c2c4,metalness:.67,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:0x28373d,metalness:.15,roughness:.7});
 const stand=new T.MeshLambertMaterial({color:0x3e606d});
 // Group all static cuboids into material + 60m-cell meshes.
 // Hundreds of kerb, wall and stripe details become a few dozen draw calls.
 const buckets=new Map(),GRID=60;
 function slab(w,h,d,x,y,z,m,angle=0){
  const cx=Math.floor((x-270)/GRID)*GRID+300;
  const cz=Math.floor((z+110)/GRID)*GRID-80;
  const key=(m.uuid||m)+'/'+cx+'/'+cz;
  let bin=buckets.get(key);
  if(!bin){bin={material:m,cx,cz,parts:[]};buckets.set(key,bin)}
  bin.parts.push({w,h,d,x,y,z,angle});
 }
 function emitBatches(){
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const faces=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
  for(const bin of buckets.values()){
   const vertices=[];
   for(const part of bin.parts){
    const sin=Math.sin(part.angle),cos=Math.cos(part.angle);
    const positions=corners.map(([ix,iy,iz])=>{
     const lx=ix*part.w/2,lz=iz*part.d/2;
     return [part.x+lx*cos+lz*sin-bin.cx,part.y+iy*part.h/2,
      part.z-lx*sin+lz*cos-bin.cz];
    });
    for(const [a,b,c,d] of faces)for(const n of [a,b,c,a,c,d])
     vertices.push(...positions[n]);
   }
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
   geo.computeVertexNormals();
   const mesh=new T.Mesh(geo,bin.material);
   mesh.position.set(bin.cx,0,bin.cz);
   group.add(mesh);
  }
 }
 // Ground exists beyond the city ground mesh (city ends at x=230).
 for(const dx of [-59.75,59.75])for(const dz of [-54.5,54.5])
  slab(119.5,.24,109,383+dx,-.18,dz,gravel);
 for(const dx of [-55.25,55.25])for(const dz of [-50,50])
  slab(110.5,.07,100,383+dx,-.01,dz,grass);
 // Each road piece is aligned exactly between real waypoint coordinates.
 const points=RACE_CIRCUIT_V32;const half=6.4;
 for(let i=0;i<points.length;i++){
  const [ax,az]=points[i],[bx,bz]=points[(i+1)%points.length];
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
  const middleX=(ax+bx)/2,middleZ=(az+bz)/2,
   sideX=Math.cos(yaw),sideZ=-Math.sin(yaw);
  slab(half*2,.105,len+.38,middleX,.08,middleZ,asphalt,yaw);
  // Painted side edges and kerbs, outside the driving path.
  for(const side of [-1,1]){
   const sx=middleX+sideX*side*(half-.35),sz=middleZ+sideZ*side*(half-.35);
   slab(.20,.025,len,sx,.15,sz,offWhite,yaw);
   const curbs=Math.max(1,Math.ceil(len/5.3));
   for(let j=0;j<curbs;j++){
    const frac=(j+.5)/curbs-.5;
    slab(.44,.11,len/curbs,sx+sideX*side*.34+dx*frac,.175,
      sz+sideZ*side*.34+dz*frac,(j+i)%2===0?red:light,yaw);
   }
  }
  // Dashed guidance line is deliberately subtle and never blocks the car.
  if(i%2===0)for(let j=0;j<Math.floor(len/11);j++){
   const f=(j+.5)/(Math.floor(len/11))-.5;
   slab(.18,.008,2.8,middleX+dx*f,.139,middleZ+dz*f,yellow,yaw);
  }
 }
 // A wide striped finish line spanning the driving surface.
 const [ax,az]=points[0],[bx,bz]=points[1],
  face=Math.atan2(bx-ax,bz-az),rightX=Math.cos(face),rightZ=-Math.sin(face);
 for(let i=-6;i<=5;i++){
  const x=ax+(i+.5)*1.04*rightX,z=az+(i+.5)*1.04*rightZ;
  slab(1.04,.017,1.0,x,.149,z,i%2===0?offWhite:dark,face);
 }
 // Trackside perimeter guardrails have a generous empty buffer from corners.
 const bounds=RACE_ARENA_BOUNDS_V32;
 for(const x of [bounds.left,bounds.right]){
  for(let z=-95;z<=95;z+=10){
   slab(.20,1.05,9.5,x,.65,z,rail);
   slab(.65,1.52,.44,x,1.02,z,rail);
  }
 }
 for(const z of [bounds.top,bounds.bottom]){
  for(let x=282;x<488;x+=10){
   slab(9.5,1.05,.20,x,.65,z,rail);
   slab(.44,1.50,.65,x,1.02,z,rail);
  }
 }
 // Sparse stands OFF the tarmac, leaving the whole circuit free of obstructions.
 for(const z of [-92,92]){
  slab(53,.58,4.8,386,.5,z,stand);
  slab(51,.56,4.8,386,1.25,z+(z>0?2.4:-2.4),dark);
  slab(49,.56,4.8,386,2.0,z+(z>0?4.8:-4.8),stand);
 }
 slab(15,.34,.55,points[0][0]+3,5.4,points[0][1],dark,face);
 for(const side of [-1,1]){
  slab(.42,5.0,.45,points[0][0]+rightX*side*6.4,2.7,
    points[0][1]+rightZ*side*6.4,rail);
 }
 for(let i=-6;i<=6;i++){
  slab(.94,.25,.65,points[0][0]+rightX*i,5.4,points[0][1]+rightZ*i,
    i%2===0?offWhite:dark,face);
 }
 emitBatches();
 const stats={segments:points.length,emptyRoad:true,bounds:{...bounds},
  drawMeshes:group.children.length,batchedParts:[...buckets.values()].reduce((n,b)=>n+b.parts.length,0)};
 return {group,show:()=>{group.visible=true},hide:()=>{group.visible=false},
  inArea:isRaceArenaV32,bounds,stats:()=>({...stats})};
}
