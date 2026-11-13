import * as T from './three.js';
export function applyTaxiDesign3(root){
 if(root.userData.design3Taxi)return;
 root.userData.design3Taxi=true;
 const chassis=root.userData.chassis,paint=root.userData.damagePanels?.paint;
 if(paint){paint.color.set('#f5bb23');paint.metalness=.55;paint.roughness=.26}
 const dark=new T.MeshStandardMaterial({color:'#171c21',roughness:.32,metalness:.35});
 chassis.traverse(mesh=>{
  if(!mesh.isMesh||mesh.material!==paint)return;
  mesh.geometry.computeBoundingBox();
  if(mesh.geometry.boundingBox.min.y>1.48||mesh.position.y>1.1)mesh.material=dark;
 });
 const add=(x,y,z,w,h,d,material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);chassis.add(mesh);return mesh};
 const glow=new T.MeshStandardMaterial({color:'#e5eff1',emissive:'#c0d6e0',emissiveIntensity:.4,roughness:.22});
 // Low splitter, black side skirts and narrow light signatures.
 add(0,.43,2.15,1.64,.055,.16,dark);
 for(const side of [-1,1]){
  add(side*.96,.43,0,.07,.065,2.55,dark);
  add(side*.62,.91,2.15,.47,.035,.035,glow);
 }
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
 const q=canvas.getContext('2d');q.fillStyle='#f5c545';q.fillRect(0,0,256,96);q.fillStyle='#182026';q.textAlign='center';q.font='bold 64px Arial';q.fillText('TAXI',128,73);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sign=new T.Mesh(new T.PlaneGeometry(.52,.195),new T.MeshLambertMaterial({map:texture,side:T.DoubleSide}));sign.position.set(0,1.74,.17);chassis.add(sign);
}
