// Keep sunlight and its bounded shadow map around the player across the whole city.
export function installTravelLightingV44({T,scene,renderer,sun,getPosition,getDaylight}){
 if(!renderer?.isWebGLRenderer||!sun||window.matchMedia?.('(pointer: coarse)')?.matches)return {update(){}};
 if(!sun.target.parent)scene.add(sun.target);
 const candidates=[],position=new T.Vector3(),delta=new T.Vector3();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!o.isMesh||o.geometry?.type!=='BoxGeometry')return;
  const g=o.geometry.parameters;
  if(g.height<2||g.width<1||g.depth<1)return;
  const p=o.getWorldPosition(new T.Vector3());
  candidates.push({mesh:o,x:p.x,z:p.z});
 });
 let clock=1;
 function update(dt){
  const focus=getPosition();if(!focus)return;
  position.set(Math.round(focus.x*2)/2,0,Math.round(focus.z*2)/2);
  delta.copy(position).sub(sun.target.position);
  sun.position.add(delta);sun.target.position.copy(position);
  sun.target.updateMatrixWorld();
  clock+=Math.max(0,Math.min(.1,dt||0));if(clock<.5)return;clock=0;
  // Bound caster count and disable offscreen buildings as the player travels.
  const near=candidates.filter(c=>Math.abs(c.x-focus.x)<50&&Math.abs(c.z-focus.z)<50)
   .sort((a,b)=>(a.x-focus.x)**2+(a.z-focus.z)**2-(b.x-focus.x)**2-(b.z-focus.z)**2);
  const visible=new Set(near.slice(0,150).map(c=>c.mesh));
  for(const c of candidates)c.mesh.castShadow=visible.has(c.mesh);
  const daylight=Math.max(0,Math.min(1,getDaylight()));
  const materials=new Set();
  scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(!m?.isMeshStandardMaterial||materials.has(m))continue;materials.add(m);
   // An unchanging midday reflection made polished cars glow after sunset.
   m.envMapIntensity=(m.metalness>.3?.85:.30)*(.12+.88*daylight);
  }});
 }
 return {update};
}
