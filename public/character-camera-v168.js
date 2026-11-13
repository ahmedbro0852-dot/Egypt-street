import * as T from './three.js';
export function safeCameraDistance(hitDistance,desiredDistance,margin=.22){return Math.max(0,Math.min(desiredDistance,Number.isFinite(hitDistance)?hitDistance-margin:desiredDistance))}
export function createCharacterCamera({camera,occluders}){
 const ray=new T.Raycaster(),direction=new T.Vector3(),safe=new T.Vector3(),hits=[];
 const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 function clip(target,position){direction.subVectors(position,target);const distance=direction.length();if(distance<.001)return;
  direction.divideScalar(distance);ray.set(target,direction);ray.near=.08;ray.far=distance+.22;hits.length=0;ray.intersectObjects(occluders,false,hits);
  if(hits.length)position.copy(target).addScaledVector(direction,safeCameraDistance(hits[0].distance,distance));
 }
 return {update(dt,target,desired){safe.copy(desired);clip(target,safe);camera.position.lerp(safe,reducedMotion?.matches?1:1-Math.exp(-10*Math.max(0,Math.min(dt,.05))));clip(target,camera.position);camera.lookAt(target)}};
}
export function createFootContactShadow({scene}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const q=canvas.getContext('2d');
 const gradient=q.createRadialGradient(32,32,2,32,32,30);gradient.addColorStop(0,'rgba(22,19,16,.35)');gradient.addColorStop(.45,'rgba(22,19,16,.18)');gradient.addColorStop(1,'rgba(22,19,16,0)');q.fillStyle=gradient;q.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas),geometry=new T.PlaneGeometry(.8,.65),material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const mesh=new T.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=1;mesh.visible=false;scene.add(mesh);
 return {update(position,yaw,visible){mesh.visible=visible;mesh.position.set(position.x,.031,position.z);mesh.rotation.z=-yaw},dispose(){scene.remove(mesh);geometry.dispose();material.dispose();texture.dispose()}};
}
