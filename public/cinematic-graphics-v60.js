// V60 cinematic graphics: phone-friendly atmospheric sky, sun halo and optional
// camera inertia. Purely visual: does not change physics, saves or mission state.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function installCinematicGraphicsV60({
 T,scene,renderer,camera,sun,mobile=false,
 getEnabled=()=>true,getSteady=()=>false,getQuality=()=> 'auto'
}={}){
 const noop={enabled:false,update(){},dispose(){},getStats:()=>({enabled:false})};
 if(!renderer?.isWebGLRenderer||!T?.Vector3||!camera||!scene)return noop;
 const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const memory=Number(navigator.deviceMemory)||4,cores=Number(navigator.hardwareConcurrency)||4;
 const lowEnd=mobile&&(memory<=3||cores<=4);
 let phase=0,roll=0,heading=0,clock=0,exposure=0;
 const direction=new T.Vector3(.38,.72,.30),sunTarget=new T.Vector3();
 const created=[],owned=[];
 let sky=null,skyMat=null,halo=null;
 // Desktop already has its richer V45 sky; supply a cheaper gradient to phones.
 if(mobile&&T.ShaderMaterial&&T.SphereGeometry&&T.Mesh){
  skyMat=new T.ShaderMaterial({
   uniforms:{
    daylight:{value:.85},
    rain:{value:0},
    elapsed:{value:0},
    sunDir:{value:direction}
   },
   depthWrite:false,side:T.BackSide,fog:false,
   vertexShader:'varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`
    varying vec3 vDir;
    uniform float daylight, rain, elapsed;
    uniform vec3 sunDir;
    void main(){
      vec3 d=normalize(vDir);
      float day=clamp(daylight,0.0,1.0);
      float horizon=smoothstep(-0.10,0.80,d.y);
      float dusk=day*(1.0-smoothstep(0.22,0.58,sunDir.y));
      vec3 low=mix(vec3(0.025,0.039,0.074),vec3(0.56,0.71,0.79),day);
      low=mix(low,vec3(0.98,0.55,0.30),dusk*0.57);
      vec3 high=mix(vec3(0.004,0.011,0.032),vec3(0.065,0.28,0.53),day);
      vec3 skyColor=mix(low,high,horizon);
      float aligned=max(dot(d,normalize(sunDir)),0.0);
      skyColor+=vec3(1.0,0.71,0.36)*pow(aligned,28.0)*day*(0.14+dusk*0.26);
      float wind=elapsed*0.007;
      float cloudWave=sin(d.x*28.0+wind)*0.34+sin(d.z*31.0-wind*0.65)*0.32+sin((d.x+d.z)*18.0)*0.24;
      float cloud=smoothstep(0.42,0.79,cloudWave+rain*0.20)*smoothstep(0.10,0.28,d.y);
      vec3 cloudColor=mix(vec3(0.060,0.10,0.16),vec3(0.90,0.91,0.88),day);
      cloudColor=mix(cloudColor,vec3(0.34,0.39,0.43),rain*0.65);
      skyColor=mix(skyColor,cloudColor,cloud*(0.35+rain*0.22));
      gl_FragColor=vec4(skyColor,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
   `
  });
  sky=new T.Mesh(new T.SphereGeometry(182,24,16),skyMat);
  sky.name='V60 mobile cinematic sky';
  sky.renderOrder=-1000;sky.frustumCulled=false;
  sky.userData.skipFallback=true;
  scene.add(sky);created.push(sky);owned.push(sky.geometry,skyMat);
 }
 // Sun glare is a single low-resolution sprite; no postprocess passes.
 if(!lowEnd&&T.Sprite&&T.SpriteMaterial&&T.CanvasTexture&&typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');
  if(ctx){
   const glow=ctx.createRadialGradient(48,48,0,48,48,47);
   glow.addColorStop(0,'rgba(255,247,207,0.66)');
   glow.addColorStop(.11,'rgba(255,221,160,0.26)');
   glow.addColorStop(.45,'rgba(255,181,96,0.075)');
   glow.addColorStop(1,'rgba(255,181,96,0)');
   ctx.fillStyle=glow;ctx.fillRect(0,0,96,96);
   const tex=new T.CanvasTexture(canvas);
   const mat=new T.SpriteMaterial({
    map:tex,transparent:true,opacity:0,depthWrite:false,depthTest:true,
    blending:T.AdditiveBlending,fog:false
   });
   halo=new T.Sprite(mat);
   halo.name='V60 warm sun bloom';
   halo.scale.set(47,47,1);
   halo.frustumCulled=false;halo.userData.skipFallback=true;
   scene.add(halo);created.push(halo);owned.push(tex,mat);
  }
 }
 // A tiny compositor-only vignette provides depth without a WebGL post-pass.
 let vignette=null;
 if(typeof document!=='undefined'){
  vignette=document.createElement('div');
  vignette.id='cinematic-v60-vignette';vignette.setAttribute('aria-hidden','true');
  vignette.style.cssText='position:fixed;inset:0;z-index:1;pointer-events:none;'+
   'background:radial-gradient(ellipse 82% 76% at 50% 50%,transparent 58%,rgba(2,11,20,.23) 100%);'+
   'opacity:0;transition:opacity .25s linear';
  document.body.append(vignette);
 }
 function update({
  dt=0,time=0,active=false,paused=false,driving=false,
  speed=0,steer=0,yawRate=0,skid=0,braking=false,
  interior=false,weather='صحو',daylight=.85
 }={}){
  dt=clamp(Number(dt)||0,0,.06);
  const enabled=getEnabled()!==false;
  const quality=String(getQuality()||'auto');
  const scale=quality==='balanced'?.35:quality==='ultra'?1:quality==='high'?.86:lowEnd?.42:.72;
  const sunlight=clamp(Number(daylight)||0,0,1);
  const rainy=weather==='مطر'?1:0;
  if(sun?.position){
   sunTarget.copy(sun.target?.position||sunTarget.set(0,0,0));
   direction.copy(sun.position).sub(sunTarget).normalize();
  }
  if(sky){
   sky.position.copy(camera.position);
   sky.visible=enabled;
   skyMat.uniforms.daylight.value=sunlight;
   skyMat.uniforms.rain.value=rainy;
   if(active&&!paused)skyMat.uniforms.elapsed.value=Number(time)||0;
  }
  if(halo){
   halo.position.copy(camera.position).addScaledVector(direction,157);
   halo.material.opacity=(enabled?scale:0)*sunlight*(1-rainy*.75)*.44;
   halo.visible=halo.material.opacity>.012;
  }
  const moving=active&&!paused&&driving&&enabled&&!reduced&&!getSteady();
  const velocity=clamp(Math.abs(Number(speed)||0)/33,0,1);
  const slip=clamp(Math.abs(Number(skid)||0),0,1);
  // Local camera yaw/roll are applied AFTER normal chase/cockpit lookAt.
  // User camera gestures and third-person wall avoidance remain authoritative.
  const targetRoll=moving?
   clamp((Number(steer)||0)*-.024+(Number(yawRate)||0)*-.020,-.038,.038)*
    velocity*(interior?.54:1)*scale:0;
  const targetHeading=moving?
    clamp((Number(steer)||0)*.010,-.014,.014)*velocity*scale:0;
  const response=1-Math.exp(-dt*(moving?4.8:8.5));
  roll+=(targetRoll-roll)*response;
  heading+=(targetHeading-heading)*response;
  if(Math.abs(roll)>.00001)camera.rotateZ(roll);
  if(Math.abs(heading)>.00001)camera.rotateY(heading);
  if(moving){
   phase+=dt*(3.4+velocity*10);
   const bump=(Math.sin(phase)*.006+Math.sin(phase*1.93)*.004)*
    (interior?.52:1)*scale*velocity*(1+slip*.55);
   camera.position.y+=bump;
   // Tiny forward nod on braking, no random shakes or nausea-inducing jumps.
   camera.position.y-=Math.min(.015,braking?.008*velocity*scale:0);
  }
  if(vignette){
   clock+=dt;
   if(clock>=.12){clock=0;
    const opacity=enabled&&(active||!paused)?Math.max(.12,scale*(moving?.7:.35)):0;
    if(Math.abs(opacity-exposure)>.018){exposure=opacity;vignette.style.opacity=opacity.toFixed(2);}
   }
  }
 }
 function dispose(){
  for(const item of created)scene.remove(item);
  for(const resource of owned)resource.dispose?.();
  vignette?.remove();
 }
 return {enabled:true,update,dispose,getStats:()=>({
  enabled:true,sky:!!sky,halo:!!halo,lowEnd,reducedMotion:reduced
 })};
}
