import * as T from './three.js';
// Skeleton matrices must be current before the first bounds computation.
// Otherwise this civilian is measured at ~0.49m and enlarged to ~6.4m.
// A separate parent keeps normalization outside animated model transforms.
export function fitCharacter(model,height=1.72){
 model.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox()}});
 const bounds=new T.Box3().setFromObject(model),size=bounds.max.y-bounds.min.y;
 if(!Number.isFinite(size)||size<.01)throw new Error('Invalid character dimensions');
 const fitted=new T.Group(),factor=height/size;
 fitted.name='Character world-size correction';fitted.scale.setScalar(factor);
 fitted.position.y=-bounds.min.y*factor;fitted.add(model);
 return fitted;
}
