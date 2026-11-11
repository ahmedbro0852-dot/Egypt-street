// Mobile-conscious material pass. Existing geometry, saves and gameplay are preserved.
export function installRealismRender({T,scene,renderer,sun}){
 if(!renderer.isWebGLRenderer)return {enabled:false,reason:'webgl-unavailable'};
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
 const textures=new Map(),converted=new Map();let seed=819;
 const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 function texture(kind){if(textures.has(kind))return textures.get(kind);const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');q.fillStyle=kind==='asphalt'?'#959595':'#ddd9d0';q.fillRect(0,0,256,256);
 for(let i=0;i<9000;i++){const v=Math.floor(100+random()*130);q.fillStyle=`rgba(${v},${v},${v},${kind==='asphalt'?.4:.19})`;const n=kind==='asphalt'?1:1+random()*3;q.fillRect(random()*256,random()*256,n,n)}
 if(kind==='plaster'){for(let i=0;i<22;i++){q.fillStyle='rgba(87,77,60,.035)';q.fillRect(random()*256,0,1+random()*5,256)}for(let i=0;i<9;i++){q.strokeStyle='rgba(60,52,40,.13)';q.lineWidth=.6;q.beginPath();let x=random()*256,y=random()*256;q.moveTo(x,y);for(let j=0;j<5;j++){x+=random()*12-6;y+=random()*10;q.lineTo(x,y)}q.stroke()}}
 if(kind==='asphalt'){q.strokeStyle='rgba(40,40,40,.23)';q.lineWidth=.8;for(let i=0;i<4;i++){q.beginPath();let x=random()*256,y=random()*256;q.moveTo(x,y);for(let j=0;j<8;j++){x+=random()*25-12;y+=random()*20;q.lineTo(x,y)}q.stroke()}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.set(kind,t);return t;}
 // A low resolution studio-sky reflection provides highlights without remote assets.
 const sides=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');const gr=q.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#8ea9bc');gr.addColorStop(.55,'#d2d5cd');gr.addColorStop(1,'#746f64');q.fillStyle=gr;q.fillRect(0,0,64,64);q.fillStyle='rgba(255,241,211,.4)';q.fillRect(i%2?12:40,5,10,17);sides.push(c)}const cube=new T.CubeTexture(sides);cube.needsUpdate=true;cube.colorSpace=T.SRGBColorSpace;
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromCubemap(cube);scene.environment=env.texture;pmrem.dispose();cube.dispose();
 let changed=0;
 scene.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m=o.material;if(m.map||m.transparent||m.emissive?.getHex()>0)return;
 const size=o.geometry?.parameters||{},h=size.height||0,w=size.width||0,d=size.depth||0;
 // Only masonry and broad road surfaces receive these UV textures.
 if(m.isMeshLambertMaterial&&o.geometry?.type==='BoxGeometry'&&((h>4&&w>3&&d>3)||(h<.4&&w>8&&d>8))){const road=h<.4&&m.color.r<.48;const kind=road?'asphalt':'plaster';const key=m.uuid+kind;let next=converted.get(key);if(!next){next=new T.MeshStandardMaterial({color:m.color.clone(),map:texture(kind),roughness:road?.97:.9,metalness:0,bumpMap:texture(kind),bumpScale:road?.025:.018});converted.set(key,next)}o.material=next;changed++}
 if(o.material.isMeshStandardMaterial){o.material.envMapIntensity=o.material.metalness>.3?.75:.13;o.material.needsUpdate=true;}
 });
 return {enabled:true,changed,dispose(){env.dispose();for(const t of textures.values())t.dispose()}};
}
