import { createPedestrianMotionV20, stepPedestrianMotionV20 } from './pedestrian-physics-v20.js';
import { createCitizenBehaviorV112 } from './citizen-behavior-v112.js?v=112.1';
import { citizenHeadingV112, animateCitizenStrideV112 } from './citizen-locomotion-v112.js?v=112.2';
// Forty distinct Egyptian street residents for the existing mobile 3D game.
// Shared geometry/materials keep models lightweight; nearby NPCs animate, distant ones sleep.
export const EGYPTIAN_RESIDENTS = [
  ['أحمد','سائق تاكسي','m','casual','#d5a25b','short','none'],
  ['محمد','موظف','m','formal','#4c657e','short','bag'],
  ['محمود','طالب جامعي','m','casual','#327b79','curly','backpack'],
  ['علي','بائع عصير','m','work','#c67842','short','apron'],
  ['حسن','عامل بناء','m','work','#d9ac3d','cap','vest'],
  ['مصطفى','طبيب','m','coat','#e9e5dd','short','bag'],
  ['خالد','مهندس','m','formal','#6a7983','short','bag'],
  ['يوسف','مندوب توصيل','m','sports','#c45335','cap','backpack'],
  ['عمر','شاب رياضي','m','sports','#3e7394','short','none'],
  ['إبراهيم','رجل مسن','m','galabeya','#b8ad96','white','cane'],
  ['سعيد','بائع خضار','m','galabeya','#aeb39c','short','apron'],
  ['أشرف','صاحب كشك','m','work','#527f67','short','apron'],
  ['طارق','موظف خدمات','m','formal','#465c70','short','none'],
  ['سامح','ميكانيكي','m','work','#444f68','cap','vest'],
  ['كريم','مصور','m','casual','#708a56','curly','camera'],
  ['رامي','موسيقي','m','casual','#925c78','long','bag'],
  ['مينا','خباز','m','work','#b8946c','cap','apron'],
  ['عم سيد','رجل مسن','m','galabeya','#c5bfaa','white','cane'],
  ['فادي','محاسب','m','formal','#5a6d87','short','glasses'],
  ['ياسين','بائع كتب','m','casual','#9c7560','curly','backpack'],
  ['فاطمة','مدرّسة','f','formal','#566e8a','hijab','bag'],
  ['نور','طالبة جامعية','f','casual','#b86f8b','hijab','backpack'],
  ['مريم','طبيبة','f','coat','#e9e5dc','hijab','bag'],
  ['سلمى','مهندسة','f','formal','#9a7aaf','long','bag'],
  ['منى','سيدة مصرية','f','galabeya','#6e8d76','hijab','none'],
  ['هدى','بائعة','f','work','#bf8b52','hijab','apron'],
  ['سارة','صحفية','f','casual','#466f9c','ponytail','phone'],
  ['روان','رياضية','f','sports','#8a6492','ponytail','none'],
  ['إيمان','موظفة','f','formal','#7d697c','hijab','bag'],
  ['أميرة','ممرضة','f','coat','#e5e4de','hijab','glasses'],
  ['ليلى','طالبة جامعية','f','casual','#c07e60','long','backpack'],
  ['حبيبة','مصورة','f','casual','#5c807f','ponytail','camera'],
  ['دينا','موظفة بنك','f','formal','#3d6987','long','bag'],
  ['عبير','صاحبة محل','f','work','#a7637e','hijab','apron'],
  ['بسمة','مندوبة توصيل','f','sports','#d58b4b','cap','backpack'],
  ['نجلاء','معلمة','f','formal','#74649c','hijab','glasses'],
  ['ريم','مصممة','f','casual','#9d7260','long','bag'],
  ['هاجر','طالبة','f','casual','#b97c8a','hijab','backpack'],
  ['آية','فنانة','f','casual','#527b70','ponytail','phone'],
  ['الحاجة زينب','سيدة مسنّة','f','galabeya','#aa9f83','hijab','cane']
];
// Mobile-aware Egyptian pedestrian rigs: better anatomy, facial identity and local clothing.
export function createEgyptianCrowd(T,scene,isBlocked,options={}){
 const skintones=['#bb8565','#cb9777','#ad7555','#d3a17d','#99664e','#c48e6c','#b47c5c','#dda988'];
 const denim=['#40536d','#3b4a51','#4c4c53','#606057','#263f62','#4e4d48'];
 const haircolors=['#221c19','#332822','#201d1b','#413127'];
 const skinMat=new Map();
 function mat(color,unlit=false){
  const k=color+(unlit?'b':'s');
  if(!skinMat.has(k))skinMat.set(k,unlit?
    new T.MeshBasicMaterial({color,side:T.DoubleSide}):
    new T.MeshStandardMaterial({color,roughness:.89,metalness:0}));
  return skinMat.get(k);
 }
 // Reuse geometry between all forty models to keep VRAM and CPU allocations down.
 const geom={
  egg:new T.SphereGeometry(1,12,9),
  small:new T.SphereGeometry(1,8,6),
  box:new T.BoxGeometry(1,1,1),
  cone:new T.ConeGeometry(1,1,12),
  cyl:new T.CylinderGeometry(1,1,1,10),
  flat:new T.CircleGeometry(1,14)
 };
 const root=new T.Group();root.name='EgyptianResidents';scene.add(root);
 let seed=1997;
 const rand=()=>{seed=(seed*48271)%2147483647;return seed/2147483647};
 function group(parent,x=0,y=0,z=0){
  const o=new T.Group();o.position.set(x,y,z);parent.add(o);return o;
 }
 function shape(parent,kind,color,x,y,z,sx,sy,sz,material=null){
  const o=new T.Mesh(geom[kind],material||mat(color));
  o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
 }
 const egg=(parent,color,x,y,z,w,h,d)=>shape(parent,'egg',color,x,y,z,w,h,d);
 const box=(parent,color,x,y,z,w,h,d)=>shape(parent,'box',color,x,y,z,w,h,d);
 const cyl=(parent,color,x,y,z,w,h,d)=>shape(parent,'cyl',color,x,y,z,w,h,d);
 function makeResident(profile,index){
  const [name,role,gender,style,cloth,headwear,accessory]=profile;
  const elderly=role.includes('مسن')||role.includes('مسنّة')||name==='الحاجة زينب';
  const size=(elderly?.91:1)*(0.94+(index%8)*.017);
  const frame=gender==='f'?.92:1;
  const build=.9+(index%5)*.042;
  const skin=skintones[(index*11+Math.floor(index/3))%skintones.length];
  const pants=denim[index%denim.length];
  const hair=haircolors[index%haircolors.length];
  const outer=style==='coat'?'#edece5':cloth;
  const longRobe=style==='galabeya';
  const man=group(root),rig=group(man),details=group(rig),faceDetails=group(rig);
  man.scale.set(size,size,size);
  man.name=name+' | '+role;
  // Grounding shadow tracks the person but never pretends to be physical lighting.
  const sh=shape(man,'flat','#111c1c',0,.025,0,.43,.34,.34,
    new T.MeshBasicMaterial({color:'#142126',transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide}));
  sh.rotation.x=-Math.PI/2;
  // Anatomical proportions: pelvis, waist, chest, shoulders, neck.
  egg(rig,pants,0,.92,0,.235*frame,.16,.16);
  egg(rig,outer,0,1.20,0,.29*build*frame,.35,.18*build);
  egg(rig,outer,0,1.42,0,.30*build*frame,.15,.18*build);
  egg(rig,skin,0,1.565,.007,.085,.112,.077);
  if(longRobe){
    shape(rig,'cone',outer,0,.72,0,.43,.98,.43);
    box(details,'#d4c6b1',0,.96,.196,.035,.57,.01);
  } else if(style==='formal'){
    box(details,'#dfd7c7',0,1.29,.169,.15,.27,.022);
    box(details,'#394459',0,1.21,.193,.048,.26,.018);
    for(const side of [-1,1]){
      const lapel=box(details,outer,side*.11,1.30,.202,.095,.22,.027);
      lapel.rotation.z=side*.27;
    }
  } else if(style==='work'&&accessory==='vest'){
    box(details,'#e1b538',0,1.24,.190,.51,.39,.045);
    box(details,'#e7eadc',0,1.25,.218,.042,.37,.022);
    for(const side of [-1,1])box(details,'#e7eadc',side*.13,1.1,.222,.16,.035,.025);
  } else if(style==='coat'){
    box(details,'#c5d2cf',0,1.2,.181,.075,.59,.018);
    for(const side of [-1,1])box(details,'#d3d3cd',side*.12,1.28,.191,.09,.35,.025);
    box(details,'#b8d2d0',.18,1.30,.185,.085,.06,.024);
  } else if(style==='sports'){
    box(details,'#d6dedc',0,1.30,.18,.22,.056,.02);
  }else{
    box(details,'#927866',0,1.44,.163,.15,.025,.018);
  }
  // Hip pivots with proper knee hinges and long shoes.
  const legs=[],knees=[],feet=[];
  for(const side of [-1,1]){
    const leg=group(rig,side*.135,.87,0);legs.push(leg);
    const upper=egg(leg,longRobe?outer:pants,0,-.20,0,.116,.232,.125);
    const knee=group(leg,0,-.39,0);knees.push(knee);
    egg(knee,longRobe?outer:pants,0,-.16,0,.098,.20,.112);
    // V153: articulated ankle — turn the shoe from the heel, not from the knee.
    // Same meshes/materials as before; just one additional parent per leg.
    const foot=group(knee,0,-.31,0);feet.push(foot);
    egg(foot,index%6===0?'#d6d0c3':'#34383b',0,0,.096,.128,.074,.217);
    box(foot,index%6===0?'#b9b3a8':'#858582',0,-.047,.11,.22,.024,.30);
  }
  // Shoulder + elbow hierarchy, open hands with subtle sleeves.
  const arms=[],elbows=[];
  for(const side of [-1,1]){
    const arm=group(rig,side*.335*frame,1.44,0);arms.push(arm);
    arm.rotation.z=side*.08;
    const sleeve=style==='coat'?'#eae7df':outer;
    egg(arm,sleeve,0,-.155,0,.092,.199,.112);
    const elbow=group(arm,0,-.33,0);elbows.push(elbow);
    egg(elbow,style==='formal'?outer:sleeve,0,-.115,0,.079,.149,.091);
    egg(elbow,skin,0,-.245,.012,.067,.094,.07);
  }
  // Face: eye whites, pupils, brows, nose, ears, mouth, haircut, scarf, glasses.
  const head=group(rig,0,1.77,0);
  const breadth=.161+(index%4)*.006;
  egg(head,skin,0,0,0,breadth,.204,.152);
  egg(head,skin,0,-.037,.15,.035,.056,.044);
  for(const side of [-1,1])egg(head,skin,side*breadth,-.014,-.004,.027,.054,.032);
  const eyes=[],brows=[];
  for(const side of [-1,1]){
    egg(faceDetails,'#f3e8d7',side*.064,1.792,.144,.039,.022,.017);
    const pupil=egg(faceDetails,'#2b241e',side*.064,1.792,.158,.014,.019,.008);
    eyes.push(pupil);
    const brow=box(faceDetails,hair,side*.062,1.837,.141,.08,.012,.015);
    brow.rotation.z=-side*.06;brows.push(brow);
    // Under-eye anatomy gives near residents more sculpted faces.
    egg(faceDetails,skin,side*.073,1.752,.145,.049,.011,.020);
    egg(faceDetails,skin,side*.112,1.726,.115,.039,.030,.022);
  }
  const mouth=box(faceDetails,elderly?'#77574e':'#946258',0,1.688,.148,.069,.010,.012);
  mouth.rotation.x=-.08;
  if(gender==='m'&&index%4===1){
    egg(faceDetails,hair,0,1.688,.125,.109,.061,.066); // short beard
    box(faceDetails,skin,0,1.726,.165,.063,.035,.014);
  }else if(gender==='m'&&index%3===0){
    egg(faceDetails,hair,0,1.713,.161,.064,.018,.017);
  }
  const scarfColor=index%4===0?'#ded3b4':index%4===1?'#d0b0a5':index%4===2?cloth:'#9caeb5';
  let scarfTail=null;
  if(headwear==='hijab'){
    egg(head,scarfColor,0,.105,-.077,.195,.145,.158);
    egg(head,scarfColor,-.155,-.075,-.05,.062,.175,.119);
    egg(head,scarfColor,.155,-.075,-.05,.062,.175,.119);
    egg(rig,scarfColor,0,1.485,-.063,.25,.175,.166);
    // Separate side fold moves gently in the rain without additional cloth simulation.
    scarfTail=egg(rig,scarfColor,-.18,1.40,-.15,.070,.23,.085);
  }else if(headwear==='white'){
    egg(head,'#b4b4ab',0,.117,-.027,.17,.115,.16);
    egg(head,'#b4b4ab',-.12,.065,-.05,.085,.1,.1);
  }else if(headwear==='cap'){
    egg(head,index%2?'#455c66':'#77654c',0,.131,-.019,.185,.098,.169);
    box(head,index%2?'#455c66':'#77654c',0,.10,.162,.27,.028,.14);
  }else{
    egg(head,hair,0,.128,-.035,.172,.115,.168);
    if(headwear==='long'){
      egg(head,hair,-.145,-.075,-.06,.058,.245,.09);
      egg(head,hair,.145,-.075,-.06,.058,.245,.09);
    }else if(headwear==='ponytail'){
      egg(head,hair,0,.00,-.175,.087,.205,.092);
    }else if(headwear==='curly'){
      for(let k=0;k<4;k++)egg(head,hair,-.133+k*.087,.183,-.025,.062,.062,.07);
    }
  }
  if(accessory==='glasses'){
    for(const side of [-1,1])box(faceDetails,'#403e3b',side*.064,1.791,.176,.092,.056,.012);
    box(faceDetails,'#403e3b',0,1.792,.178,.04,.008,.014);
  }
  // Sparse garment stitching, cuffs and layered 3D silhouettes share existing mesh geometry.
  if(style==='formal'||style==='coat'){
    for(const side of [-1,1]){
      box(details,'#b9ac98',side*.27,1.12,.155,.018,.24,.015);
      box(details,'#aaa49a',side*.23,.97,.174,.070,.024,.016);
    }
  }else if(style==='sports'){
    box(details,'#d6d1c7',0,1.51,-.02,.23,.028,.19);
  }
  // Profession accessories: no branding or skin-color stereotyping.
  if(accessory==='backpack'){
    egg(rig,'#394956',0,1.19,-.235,.248,.29,.13);
    for(const side of [-1,1])box(details,'#9d8f75',side*.232,1.18,.045,.027,.44,.042);
  }else if(accessory==='bag'){
    box(rig,'#7c604b',.32,.78,.025,.235,.31,.14);
    box(details,'#b5a48a',.245,1.13,.06,.025,.49,.025);
  }else if(accessory==='apron'){
    box(details,'#e7dac0',0,1.05,.2,.43,.59,.032);
    box(details,'#bca88e',0,.94,.222,.21,.15,.013);
  }else if(accessory==='camera'){
    box(details,'#292b32',.20,.85,.225,.23,.20,.14);
    shape(details,'cyl','#778286',.20,.9,.318,.068,.026,.068);
  }else if(accessory==='phone'){
    box(elbows[1],'#262d37',.01,-.27,.085,.108,.16,.035);
  }else if(accessory==='cane'){
    box(elbows[1],'#9b7451',.105,-.50,.055,.041,.59,.04);
  }
  // A nine-mesh distant silhouette is substituted for the full animated rig.
  // No extra textures, requests or skeletal GPU draws on low-end phones.
  const proxy=group(man),proxyLegs=[],proxyArms=[];
  egg(proxy,outer,0,1.16,0,.29*build*frame,.37,.19);
  if(longRobe)shape(proxy,'cone',outer,0,.73,0,.39,.96,.39);
  else egg(proxy,pants,0,.89,0,.23,.17,.16);
  egg(proxy,skin,0,1.75,0,.17,.20,.15);
  egg(proxy,headwear==='hijab'?scarfColor:hair,0,1.87,-.03,.17,.10,.15);
  for(const side of [-1,1]){
   const leg=group(proxy,side*.135,.86,0);
   egg(leg,longRobe?outer:pants,0,-.31,0,.109,.33,.11);
   egg(leg,'#34383b',0,-.63,.08,.12,.068,.19);
   proxyLegs.push(leg);
   const arm=group(proxy,side*.32,1.43,0);
   egg(arm,outer,0,-.26,0,.08,.27,.09);
   proxyArms.push(arm);
  }
  const u={id:index+1,name,role,style,gender,accessory,
    arms,elbows,legs,knees,feet,head,body:rig,details,faceDetails,eyes,brows,mouth,scarfTail,proxy,proxyLegs,proxyArms,
    phase:index*1.07,speed:(elderly?.57:.72+(index%5)*.08),
    dir:index%2?1:-1,minX:-73,maxX:75,rest:index%11===0?.5:0,
    motion:0,blink:0,blinkTimer:1.4+(index%5)*.61};
  man.userData=u;
  return man;
 }
 const residents=[],paths=[-93,-60,-30,0,30,60,93,133],occupied=[];
 const citizenBehaviorV112=createCitizenBehaviorV112({mobile:options.mobileLite===true});
 for(let i=0;i<EGYPTIAN_RESIDENTS.length;i++){
   if(options.mobileLite&&i%3===2)continue;
   const g=makeResident(EGYPTIAN_RESIDENTS[i],i);
   const lane=Math.floor(i/5),z=paths[lane]+(i%2? -4.5:4.5),u=g.userData;
   u.minX=lane===7?-117:-77;u.maxX=lane===7?67:74;
   let x=u.minX+2;
   for(let t=0;t<90;t++){
    const candidate=u.minX+rand()*(u.maxX-u.minX);
    if(isBlocked?.(candidate,z))continue;
    if(occupied.some(v=>Math.hypot(candidate-v.x,z-v.z)<3.4))continue;
    x=candidate;break;
   }
   g.position.set(x,0,z);
   residents.push(g);occupied.push({x,z});
 }
 const setLerp=(current,target,k,dt)=>current+(target-current)*(1-Math.exp(-k*dt));
 function reactCollision(person,away,power,timeMs,impactDetails=null){
  if(!person?.userData)return false;
  const u=person.userData;
  const force=Math.max(.15,Math.min(1,Number(power)||.2));
  // A physical contact starts a bounded, gravity-driven fall rather than a
  // fixed wobble. Existing recovery animation remains a visual fallback.
  if(u.impactMotion?.stage!=='done'&&u.impactMotion&&timeMs-u.impactMotion.time<900)
   return false;
  u.impactMotion=createPedestrianMotionV20(
   impactDetails||{horizontalSpeed:.55+force*2,loftSpeed:.2+force*.4,
    stumbleAngle:.2+force*.6,downDurationMs:750},away,timeMs
  );
  u.stumbleAt=timeMs;u.stumbleUntil=timeMs+650+force*900;
  u.stumbleForce=force;
  // Deterministic character-specific motion: sidestep, brace or crouch/recover.
  u.stumbleStyle=u.id%3;
  u.stumbleSide=Math.sign(away?.x||u.dir||1);
  u.startledUntil=Math.max(u.startledUntil||0,u.stumbleUntil);
  u.nextTrafficReact=Math.max(u.nextTrafficReact||0,timeMs+2500);
  u.rest=Math.max(u.rest,1.2+force*1.1);
  u.motion=0;
  // Small safe evasive step. Never throw a resident through geometry or shops.
  const magnitude=.32+force*.50;
  const dx=(Number(away?.x)||0)*magnitude,dz=(Number(away?.z)||0)*magnitude;
  const nx=person.position.x+dx,nz=person.position.z+dz;
  if(nx>u.minX&&nx<u.maxX&&!isBlocked?.(nx,nz,.38))person.position.set(nx,0,nz);
  return true;
 }
 // NPCs move only within the current districts; visual LOD has three tiers.
 function update(dt,t,focus,cars=[],controlledCar=null,playerCarSpeed=0,isPlayerDriving=false,weather='صحو'){
  citizenBehaviorV112.beginFrame();
  dt=Math.min(Math.max(dt||0,0),.05);
  const f=focus||{x:0,z:0},mobile=typeof innerWidth==='number'&&innerWidth<760;
  const maxDraw=mobile?76:112;
  for(const p of residents){
   const u=p.userData;
   const dx=p.position.x-f.x,dz=p.position.z-f.z;
   const distSq=dx*dx+dz*dz;
   p.visible=distSq<maxDraw*maxDraw;
   if(distSq>(maxDraw+16)*(maxDraw+16))continue;
   const highNear=distSq<(mobile?25*25:34*34);
   const faceNear=distSq<20*20,detailNear=distSq<34*34;
   u.body.visible=highNear;u.proxy.visible=!highNear;
   u.faceDetails.visible=highNear&&faceNear;
   u.details.visible=highNear&&detailNear;
   let nearCar=false;
   if(controlledCar){
     const dxCar=p.position.x-controlledCar.position.x;
     const dzCar=p.position.z-controlledCar.position.z;
     const d=Math.hypot(dxCar,dzCar);
     nearCar=d<3.25;
     // Predict the car's future path, not just the distance to its bumper.
     const yaw=controlledCar.rotation.y||0;
     const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
     const ahead=dxCar*fx+dzCar*fz,lateral=dxCar*rx+dzCar*rz;
     const approaching=Math.abs(playerCarSpeed)>5&&ahead>0&&
       ahead<Math.min(11,4+Math.abs(playerCarSpeed)*.36)&&Math.abs(lateral)<2.25;
     if((approaching||d<5.5&&Math.abs(playerCarSpeed)>6.5)&&t>(u.nextTrafficReact||0)){
       u.startledUntil=t+1000;u.nextTrafficReact=t+2800+(u.id%3)*350;
       u.rest=Math.max(u.rest,.75);
       // Sidestep away from the approaching lane, respecting shops and pavements.
       const moveSide=Math.sign(lateral||u.dir||1);
       const step=.48+(u.id%4)*.10;
       const moveX=p.position.x+rx*moveSide*step;
       const moveZ=p.position.z+rz*moveSide*step;
       if(!u.streetEventLock&&moveX>u.minX&&moveX<u.maxX&&
         !isBlocked?.(moveX,moveZ,.35)){
         p.position.set(moveX,0,moveZ);
       }
       u.lookUntil=t+1150;
       u.trafficDodgeUntil=t+700+(u.id%3)*180;
     }
   }
   if(!nearCar&&distSq<57*57)for(const c of cars){
    if(Math.hypot(p.position.x-c.position.x,p.position.z-c.position.z)<2.7){nearCar=true;break;}
   }
   // Integrate mass-based horizontal momentum and vertical gravity once per
   // animation frame; bounds and shop collisions prevent passing through walls.
   let impactPose=null;
   if(u.impactMotion){
    impactPose=stepPedestrianMotionV20(u.impactMotion,dt,t,{
     x:p.position.x,z:p.position.z,
     canMove:(x,z)=>x>u.minX&&x<u.maxX&&!isBlocked?.(x,z,.28)
    });
    p.position.set(impactPose.x,0,impactPose.z);
    if(!impactPose.active){u.impactMotion=null;impactPose=null;}
   }
   const frightened=(u.startledUntil||0)>t;
   const stumbling=(u.stumbleUntil||0)>t||!!impactPose;
   const stumbleAmount=impactPose?0:stumbling?Math.min(1,(u.stumbleUntil-t)/600)*(u.stumbleForce||0):0;
   const style=u.stumbleStyle||0;
   const locked=!!u.streetEventLock;
   // Occasional local conversations: two neighbours stop and greet one another.
   if(!locked&&distSq<34*34&&u.id%5===0&&t>(u.nextGreeting||0)){
     const other=residents.find(q=>q!==p&&!q.userData.streetEventLock&&
       Math.hypot(q.position.x-p.position.x,q.position.z-p.position.z)<2.9);
     u.nextGreeting=t+14000+(u.id%4)*1700;
     if(other){
       u.waveUntil=t+1750;other.userData.waveUntil=t+1100;
       u.rest=Math.max(u.rest,1.7);
       other.userData.rest=Math.max(other.userData.rest,1.0);
     }
   }
   const walking=!locked&&!nearCar&&!stumbling&&distSq>2.45*2.45&&!frightened&&u.rest<=0;
   u.motion=setLerp(u.motion,walking?1:0,walking?7:11,dt);
   const nx=p.position.x+u.dir*u.motion*u.speed*dt;
   if(walking){
    if(nx<u.minX||nx>u.maxX||isBlocked?.(nx,p.position.z)){
     u.dir*=-1;u.rest=.36+(u.id%4)*.18;
    }else p.position.x=nx;
   }
   if(u.rest>0&&u.rest<1e8)u.rest=Math.max(0,u.rest-dt);
   p.rotation.y=citizenHeadingV112(p.rotation.y,u.dir>0?Math.PI/2:-Math.PI/2,dt,8);
   const phase=u.phase+=dt*u.speed*7*u.motion,step=Math.sin(phase),lift=Math.max(0,Math.sin(phase+Math.PI/2));
   u.proxy.position.y=-stumbleAmount*.20+(impactPose?.height||0)-(impactPose?.fall||0)*.16;
   u.proxy.rotation.z=(u.stumbleSide||1)*(stumbleAmount*(style===0?.32:style===1?.18:.08)+
    (impactPose?.fall||0)*.46);
   u.proxy.rotation.x=(impactPose?.fall||0)*.85;
   if(!highNear){
     u.proxyLegs[0].rotation.x=step*.31*u.motion;
     u.proxyLegs[1].rotation.x=-step*.31*u.motion;
     u.proxyArms[0].rotation.x=-step*.20*u.motion;
     u.proxyArms[1].rotation.x=step*.20*u.motion;
     animateCitizenStrideV112(p,{dt,phase,near:false,walking,nearCar,frightened,stumbling,
      raining:weather==='مطر'});
     continue;
   }
   u.legs[0].rotation.x=step*.50*u.motion;
   u.legs[1].rotation.x=-step*.50*u.motion;
   u.knees[0].rotation.x=-Math.max(0,-step)*.40*u.motion;
   u.knees[1].rotation.x=-Math.max(0,step)*.40*u.motion;
   u.arms[0].rotation.x=-step*.33*u.motion;
   u.arms[1].rotation.x=step*.33*u.motion;
   u.elbows[0].rotation.x=.13+Math.max(0,step)*.13*u.motion;
   u.elbows[1].rotation.x=.13+Math.max(0,-step)*.13*u.motion;
   u.body.position.y=Math.max(0,Math.sin(phase*2))*.025*u.motion;
   u.body.rotation.z=step*.015*u.motion;
   u.head.rotation.y=(u.lookUntil>t?Math.sin(t*.008+u.id)*.22:Math.sin(t*.0007+u.id)*.065);
   // Slow idle breathing with occasional blinking.
   u.body.scale.y=1+.006*Math.sin(t*.0022+u.id);
   u.blinkTimer-=dt;
   if(u.blinkTimer<0){u.blinkTimer=1.7+(u.id%6)*.44;u.blink=.11;}
   if(u.blink>0)u.blink-=dt;
   if(faceNear)for(const eye of u.eyes)eye.scale.y=u.blink>0?.15:.019;
   if((u.waveUntil||0)>t){
    u.arms[1].rotation.x=-1.22;u.arms[1].rotation.z=-.24;
    u.elbows[1].rotation.x=-.56+Math.sin(t*.012)*.20;
    u.body.rotation.y=Math.sin(t*.004)*.055;
   }else{u.arms[1].rotation.z=0;u.body.rotation.y=0;}
   if(frightened){u.arms[0].rotation.x=-.7;u.arms[1].rotation.x=-.43;u.head.rotation.z=.12;u.body.rotation.z=.055;}
   else u.head.rotation.z=0;
   // A brief stumble and recovery: readable, non-graphic, no ragdoll CPU cost.
   u.body.position.y-=stumbleAmount*.22;
   u.body.rotation.x=stumbleAmount*.15;
   if(stumbling){
     if(style===0){ // catch balance by stepping sideways
       u.body.rotation.z=(u.stumbleSide||1)*stumbleAmount*.34;
       u.legs[0].rotation.x+=stumbleAmount*.43;
       u.legs[1].rotation.x-=stumbleAmount*.32;
       u.arms[0].rotation.z=-stumbleAmount*.7;
       u.arms[1].rotation.z=stumbleAmount*.5;
     }else if(style===1){ // brace with the arms raised
       u.body.rotation.z=(u.stumbleSide||1)*stumbleAmount*.16;
       u.arms[0].rotation.x=-1.1*stumbleAmount;
       u.arms[1].rotation.x=-.94*stumbleAmount;
       u.legs[0].rotation.x+=stumbleAmount*.24;
     }else{ // crouch then recover
       u.body.position.y-=stumbleAmount*.17;
       u.body.rotation.x=stumbleAmount*.28;
       u.legs[0].rotation.x+=stumbleAmount*.27;
       u.legs[1].rotation.x+=stumbleAmount*.30;
       u.arms[0].rotation.z=-stumbleAmount*.22;
     }
   }else{u.body.rotation.x=0;u.arms[0].rotation.z=0;}
   if(impactPose){
    // Ground-anchored lean and crouch; no graphic injury effects or heavy ragdoll rig.
    const fall=impactPose.fall,side=u.stumbleSide||1;
    u.body.position.y+=impactPose.height-fall*.19;
    u.body.rotation.x+=fall*(style===2?.65:1.04);
    u.body.rotation.z+=side*fall*(style===0?.52:.31);
    u.knees[0].rotation.x+=fall*.75;
    u.knees[1].rotation.x+=fall*.66;
    u.arms[0].rotation.x-=fall*.72;
    u.arms[1].rotation.x-=fall*.48;
   }
   animateCitizenStrideV112(p,{dt,phase,near:true,walking,nearCar,frightened,stumbling,
    raining:weather==='مطر'});
   citizenBehaviorV112.update(p,{dt,time:t,focus:f,driving:isPlayerDriving,
    distanceSq:distSq,visible:p.visible,faceNear,walking,frightened,stumbling,
    raining:weather==='مطر',nearCar});
  }
 }
 return {people:residents,update,reactCollision,profiles:EGYPTIAN_RESIDENTS,
  characterStats:()=>citizenBehaviorV112.stats()};
}
