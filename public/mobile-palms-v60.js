// V60: two draw-call palm grove for touch WebGL, replacing boxy mobile palm leaves.
// Geometry is shared and bounded; stronger phones get slow wind-sway animation.
export function installMobilePalmsV60({T,scene,renderer,positions=[],mobile=false}={}){
 const noop={enabled:false,update(){},dispose(){},stats:()=>({enabled:false})};
 if(!mobile||!renderer?.isWebGLRenderer||!T?.InstancedMesh||!positions.length)return noop;
 const memory=Number(navigator.deviceMemory)||4,cores=Number(navigator.hardwareConcurrency)||4;
 const lowEnd=memory<=3||cores<=4;
 const fronds=lowEnd?7:9,segments=lowEnd?2:3;
 const trunkGeo=new T.CylinderGeometry(.13,.24,1,7);
 const frondGeo=new T.BoxGeometry(1,1,1);
 const trunkMat=new T.MeshLambertMaterial({color:0x8b7250});
 const frondMat=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide});
 const trunks=new T.InstancedMesh(trunkGeo,trunkMat,positions.length);
 const leaves=new T.InstancedMesh(frondGeo,frondMat,positions.length*fronds*segments);
 trunks.name='V60 instanced palm trunks';leaves.name='V60 sculpted 3D palm leaves';
 for(const m of [trunks,leaves]){
  m.castShadow=false;m.receiveShadow=false;m.userData.skipFallback=true;m.frustumCulled=false;
 }
 const dummy=new T.Object3D(),color=new T.Color(),pieces=[];
 for(let n=0;n<positions.length;n++){
  const [x,z]=positions[n],height=5.7+(n%4)*.20;
  dummy.position.set(x,height*.5,z);dummy.scale.set(1,height,1);
  dummy.rotation.set(0,(n%5)*.31,0);dummy.updateMatrix();trunks.setMatrixAt(n,dummy.matrix);
  for(let leaf=0;leaf<fronds;leaf++){
   const azimuth=leaf*Math.PI*2/fronds+(n%4)*.16;
   for(let k=0;k<segments;k++){
    const range=(k+.5)*(lowEnd?.89:.78),rise=.26-k*.19;
    const length=lowEnd?(k===0?1.4:1.08):[1.36,1.12,.88][k];
    pieces.push({x:x+Math.sin(azimuth)*range,z:z+Math.cos(azimuth)*range,
      y:height+.18+rise,angle:azimuth,pitch:-.17+k*.24,
      width:.26-k*.034,length,phase:n*.31+leaf*.7});
   }
  }
 }
 trunks.instanceMatrix.needsUpdate=true;
 const tint=[0x365f3e,0x4a7d46,0x57844b,0x3f6a3d,0x648b50];
 function applyLeaves(time=0,rain=false){
  const wind=rain?.085:.038;
  for(let i=0;i<pieces.length;i++){
   const p=pieces[i];
   const shift=lowEnd?0:Math.sin(time*.72+p.phase)*wind;
   dummy.position.set(p.x,p.y+shift*.34,p.z);
   dummy.rotation.set(p.pitch+shift*.48,p.angle+shift,0);
   dummy.scale.set(p.width,.055,p.length);dummy.updateMatrix();
   leaves.setMatrixAt(i,dummy.matrix);
   if(time===0){color.setHex(tint[(i+Math.floor(i/segments))%tint.length]);leaves.setColorAt(i,color)}
  }
  leaves.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
 }
 applyLeaves();
 scene.add(trunks,leaves);
 let last=-1;
 function update(time=0,rain=false){
  if(lowEnd||!Number.isFinite(time)||last>=0&&time-last<.12)return;
  last=time;applyLeaves(time,rain);
 }
 function dispose(){
  scene.remove(trunks,leaves);
  trunkGeo.dispose();frondGeo.dispose();trunkMat.dispose();frondMat.dispose();
 }
 return {enabled:true,update,dispose,stats:()=>({
  enabled:true,trees:positions.length,fronds:pieces.length,drawCalls:2,lowEnd
 })};
}
