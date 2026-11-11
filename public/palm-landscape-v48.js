// Detailed date palms replace the original box leaves and spherical tree crowns.
import * as T from './three.js';
const wind={value:0},strength={value:.35};
let shared;
export function updateLandscapeV48(dt,raining=false){wind.value+=Math.min(.05,Math.max(0,dt||0));strength.value+=( (raining?.85:.35)-strength.value)*Math.min(1,dt*2);}
function patchWind(shader){
 shader.uniforms.uPalmTime=wind;shader.uniforms.uPalmWind=strength;
 shader.vertexShader='uniform float uPalmTime;uniform float uPalmWind;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float bend=clamp((position.y-4.3)/3.5,0.0,1.0);
 transformed.x+=sin(uPalmTime*1.1+position.z*.7+position.x*.4)*bend*.13*uPalmWind;
 transformed.z+=cos(uPalmTime*.83+position.x*.8)*bend*.09*uPalmWind;`);
}
function prepare(){
 if(shared)return shared;
 const c=document.createElement('canvas');c.width=128;c.height=512;const q=c.getContext('2d');q.fillStyle='#9a8062';q.fillRect(0,0,128,512);
 let seed=4748;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647};
 for(let y=0;y<512;y+=17){q.fillStyle='#4d3e2b';q.fillRect(0,y,128,3);q.fillStyle='#c5ac81';q.fillRect(0,y+4,128,2);for(let x=0;x<128;x+=16){q.fillStyle='#6f563b';q.fillRect(x+rnd()*4,y+6,2+rnd()*3,9)}}
 for(let i=0;i<1800;i++){q.fillStyle=i%2?'#e6c79830':'#31261d26';q.fillRect(rnd()*128,rnd()*512,1,1+rnd()*4)}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(2,3);map.anisotropy=4;
 const trunkMat=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.035,roughness:.97,color:0xc8b99b});
 const trunkGeo=new T.CylinderGeometry(.135,.235,6.4,12,12);
 const pos=trunkGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const y=pos.getY(i)+3.2;pos.setXYZ(i,pos.getX(i)+.17*(y/6.4)**2,y,pos.getZ(i));}pos.needsUpdate=true;trunkGeo.computeVertexNormals();
 const positions=[],colors=[];
 function tri(a,b,c,color){for(const v of [a,b,c]){positions.push(...v);colors.push(color.r,color.g,color.b)}}
 const dark=new T.Color('#3f6333'),light=new T.Color('#6d813f'),dry=new T.Color('#9a8b52');
 for(let frond=0;frond<17;frond++){
  const a=frond*2.39996,layer=frond%3,len=2.9+(.5-rnd())*.7,fall=layer===0?1.4:layer===1?.65:-.15;
  const axis=[Math.cos(a),Math.sin(a)],side=[-axis[1],axis[0]];
  const point=t=>[.17+axis[0]*len*t,6.35+Math.sin(t*Math.PI)*.7-fall*t*t,axis[1]*len*t];
  const base=frond>13?dry:dark;
  for(let i=0;i<22;i++){
   const t=.07+i*.039,p=point(t),next=point(Math.min(1,t+.045));
   tri([p[0]-.012,p[1],p[2]],[p[0]+.012,p[1],p[2]],next,light);
   for(const s of [-1,1]){
    const length=Math.sin(t*Math.PI)*(.50+rnd()*.17),width=.044*(1-t*.65);
    const tip=[p[0]+side[0]*s*length+axis[0]*.15,p[1]-.10-length*.24,p[2]+side[1]*s*length+axis[1]*.15];
    const mid=[(p[0]+tip[0])*.5,(p[1]+tip[1])*.5+.035,(p[2]+tip[2])*.5];
    const left=[mid[0]+axis[0]*width,mid[1],mid[2]+axis[1]*width],right=[mid[0]-axis[0]*width,mid[1]-.025,mid[2]-axis[1]*width];
    const col=base.clone().lerp(light,rnd()*.4);tri(p,left,tip,col);tri(p,tip,right,col.clone().multiplyScalar(.85));
   }
  }
 }
 const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));leafGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));leafGeo.computeVertexNormals();leafGeo.computeBoundingSphere();leafGeo.boundingSphere.radius+=.2;
 const leaves=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.86,metalness:0});leaves.onBeforeCompile=patchWind;leaves.customProgramCacheKey=()=> 'palm-wind-v48';
 const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide});depth.onBeforeCompile=patchWind;depth.customProgramCacheKey=()=> 'palm-depth-v48';
 shared={trunkGeo,trunkMat,leafGeo,leaves,depth};return shared;
}
export function createDetailedPalmV48(scene,x,z,height=6.4){
 const s=prepare(),root=new T.Group();root.name='Detailed date palm';root.position.set(x,0,z);
 const scale=height/6.4;root.scale.set(scale,scale,scale);root.rotation.y=((x*13+z*7)%17)*.31;
 const trunk=new T.Mesh(s.trunkGeo,s.trunkMat),leaves=new T.Mesh(s.leafGeo,s.leaves);
 trunk.castShadow=trunk.receiveShadow=true;leaves.castShadow=leaves.receiveShadow=true;leaves.customDepthMaterial=s.depth;
 root.add(trunk,leaves);root.userData.skipFallback=true;trunk.userData.skipFallback=leaves.userData.skipFallback=true;scene.add(root);return root;
}
