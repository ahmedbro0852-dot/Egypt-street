// Clothing and equipment follow the existing articulated hero; no extra download.
export function dressReferenceHeroV47({T,player,renderer}){
 if(!renderer?.isWebGLRenderer)return;
 const r=player.userData,rig=r.rig;if(!rig)return;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const q=canvas.getContext('2d');q.fillStyle='#d9d3c7';q.fillRect(0,0,256,256);
 for(let i=0;i<256;i+=3){q.fillStyle=i%2?'#6f665d22':'#ffffff2a';q.fillRect(i,0,1,256);q.fillRect(0,i,256,1)}
 const weave=new T.CanvasTexture(canvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(3,3);weave.colorSpace=T.SRGBColorSpace;
 const cloth=new T.MeshStandardMaterial({color:0x988c77,map:weave,bumpMap:weave,bumpScale:.009,roughness:.94});
 const straps=new T.MeshStandardMaterial({color:0x4c5040,map:weave,roughness:.95});
 const trim=new T.MeshStandardMaterial({color:0x302e29,roughness:.72}),buckles=new T.MeshStandardMaterial({color:0x88857a,metalness:.75,roughness:.38});
 const seen=new Set();
 rig.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const m=o.material;if(seen.has(m))return;seen.add(m);
  if(m.color?.getHex()===0x393b3e){m.color.set(0xa3937c);m.map=weave;m.bumpMap=weave;m.bumpScale=.008;m.needsUpdate=true;}
  else if(m.color?.getHex()===0x48627b)m.color.set(0x424a48);
 });
 function box(parent,x,y,z,w,h,d,material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 function rounded(x,y,z,w,h,d,m){const shape=new T.Shape(),rad=.055;
  shape.moveTo(-w/2+rad,-h/2);shape.lineTo(w/2-rad,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+rad);shape.lineTo(w/2,h/2-rad);shape.quadraticCurveTo(w/2,h/2,w/2-rad,h/2);shape.lineTo(-w/2+rad,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-rad);shape.lineTo(-w/2,-h/2+rad);shape.quadraticCurveTo(-w/2,-h/2,-w/2+rad,-h/2);
  const geometry=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1});geometry.translate(0,0,-d/2);
  const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.castShadow=true;rig.add(mesh);return mesh;
 }
 rounded(0,1.23,-.255,.42,.51,.20,straps);rounded(0,1.10,-.389,.32,.22,.075,cloth);
 for(const side of [-1,1]){
  const path=new T.CatmullRomCurve3([new T.Vector3(side*.15,1.02,-.30),new T.Vector3(side*.20,1.45,-.22),new T.Vector3(side*.22,1.49,.02),new T.Vector3(side*.20,1.31,.16),new T.Vector3(side*.17,1.05,.15)]);
  const strap=new T.Mesh(new T.TubeGeometry(path,18,.023,6,false),straps);rig.add(strap);
  box(rig,side*.18,1.11,.18,.055,.075,.025,buckles);
  box(rig,side*.13,1.25,-.367,.026,.36,.025,trim);
  box(rig,side*.25,.92,-.02,.10,.14,.11,straps);
 }
 for(const y of [1.04,1.12,1.20])box(rig,0,y,-.44,.28,.022,.018,straps);
 box(rig,0,.92,.01,.47,.055,.34,trim);
 // Shirt placket, buttons, collar and sleeve cuffs belong to moving rig pieces.
 box(rig,0,1.25,.171,.022,.35,.014,cloth);
 for(let y=1.10;y<1.45;y+=.075)box(rig,0,y,.186,.012,.012,.008,trim);
 for(const side of [-1,1]){const collar=box(rig,side*.065,1.48,.085,.09,.12,.025,cloth);collar.rotation.z=side*.5;}
 for(const arm of [r.leftArm,r.rightArm])box(arm,0,-.16,0,.18,.055,.18,cloth);
 const scarfCanvas=document.createElement('canvas');scarfCanvas.width=scarfCanvas.height=128;const g=scarfCanvas.getContext('2d');g.fillStyle='#c6c3b7';g.fillRect(0,0,128,128);g.strokeStyle='#393a38';g.lineWidth=3;
 for(let i=-128;i<256;i+=12){g.beginPath();g.moveTo(i,0);g.lineTo(i+128,128);g.stroke();g.beginPath();g.moveTo(i,128);g.lineTo(i+128,0);g.stroke()}
 const scarfTexture=new T.CanvasTexture(scarfCanvas);scarfTexture.colorSpace=T.SRGBColorSpace;
 const scarfMat=new T.MeshStandardMaterial({map:scarfTexture,roughness:1});
 const scarf=new T.Mesh(new T.TorusGeometry(.119,.037,8,24),scarfMat);scarf.rotation.x=Math.PI/2;scarf.position.set(0,1.52,.015);rig.add(scarf);
 const drape=new T.Mesh(new T.PlaneGeometry(.18,.22,4,5),scarfMat);drape.position.set(.06,1.37,.178);drape.rotation.z=-.25;rig.add(drape);
 player.userData.referenceOutfit=true;
}
export function installReferenceHudV47(){
 document.body.classList.add('reference-v47');
 const hud=document.querySelector('.hud');
 const avatar=document.createElement('img');avatar.src='character-reference.jpg';avatar.alt='بطل شوارع مصر';avatar.className='v47-avatar';hud?.prepend(avatar);
 const brand=hud?.querySelector('.brand');if(brand){brand.classList.add('v47-brand');document.body.append(brand)}
 const money=document.getElementById('money');if(money)document.body.append(money);
 const name=document.createElement('strong');name.className='v47-profile-name';name.textContent='بطل شوارع مصر';hud?.insertBefore(name,document.getElementById('modeLabel'));
 const menu=document.getElementById('v40Menu');if(menu)menu.title='قائمة الأنشطة والإعدادات';
 const controls=document.getElementById('pcControlsV40');if(controls)controls.innerHTML='<b>WASD</b> حركة · <b>E</b> ركوب · <b>F</b> تفاعل · <b>Space</b> قفز/فرامل<br><b>Shift</b> جري · <b>C</b> كاميرا · <b>M</b> القائمة · <b>Esc</b> إيقاف';
}
