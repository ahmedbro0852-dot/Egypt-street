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
// Different faces, complexions and silhouettes; styles are outfits, not identity labels.
export function createEgyptianCrowd(T,scene,isBlocked){
  let rngSeed=173;
  const rng=()=>{rngSeed=(rngSeed*16807)%2147483647;return rngSeed/2147483647};
  const skin=['#b77e5c','#cd9471','#a96f50','#d5a985','#926148','#b78563'];
  const trouser=['#253f5d','#454d58','#6c5d4d','#314f4b','#394254','#6c5145'];
  const hair='#29231f';
  const materialCache=new Map(),geometryCache=new Map();
  const mat=c=>{if(!materialCache.has(c))materialCache.set(c,new T.MeshLambertMaterial({color:c}));return materialCache.get(c)};
  const geo=(kind,vals)=>{
    const key=kind+vals.join(',');
    if(!geometryCache.has(key)){
      const g=kind==='sphere'?new T.SphereGeometry(...vals):
       kind==='box'?new T.BoxGeometry(...vals):
       kind==='cone'?new T.ConeGeometry(...vals):new T.CylinderGeometry(...vals);
      geometryCache.set(key,g);
    }
    return geometryCache.get(key);
  };
  const sphere=geo('sphere',[1,9,7]),cube=geo('box',[1,1,1]),cylinder=geo('cylinder',[1,1,1,9]);
  function mesh(parent,g,m,x,y,z,sx=1,sy=1,sz=1){
    const obj=new T.Mesh(g,mat(m));obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);parent.add(obj);return obj;
  }
  function ell(parent,m,x,y,z,sx,sy,sz){return mesh(parent,sphere,m,x,y,z,sx,sy,sz)}
  function rect(parent,m,x,y,z,sx,sy,sz){return mesh(parent,cube,m,x,y,z,sx,sy,sz)}
  function npc(row,i){
    const [name,role,gender,style,cloth,headwear,item]=row;
    const height=(i===9||i===17||i===39?.88:1)*(1+(i%7-3)*.026);
    const tone=skin[(i*7+Math.floor(i/5))%skin.length];
    const pants=trouser[(i+Math.floor(i/3))%trouser.length];
    const outer=style==='coat'?'#f0ece0':cloth;
    const group=new T.Group(),body=new T.Group();group.add(body);
    const skirt=(style==='galabeya'||(gender==='f'&&i%5===0));
    // Legs are pivoted to alternate a grounded walk cycle.
    const legs=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.115,.80,0);body.add(leg);legs.push(leg);
      ell(leg,skirt?outer:pants,0,-.325,0,.112,.37,.115);
      ell(leg,i%4===0?'#dfd9ca':'#393b3d',0,-.71,.075,.13,.08,.205);
    }
    ell(body,outer,0,1.17,0,gender==='f'?.29:.32,.39,.205);
    if(skirt){
      // Cone is wide at the bottom so the galabeya has a natural hem.
      mesh(body,geo('cone',[.37,.92,9]),outer,0,.59,0);
    }else{
      rect(body,pants,0,.84,0,.26,.17,.15);
    }
    if(style==='formal'){
      rect(body,'#e3d6c4',0,1.24,.195,.11,.27,.015);
      rect(body,'#4f4c55',0,1.19,.212,.042,.19,.02);
    }else if(style==='sports')rect(body,'#e8ddd1',0,1.22,.203,.17,.05,.016);
    else if(style==='coat'){
      rect(body,'#d6d0c5',0,1.12,.22,.075,.59,.026);
    }
    ell(body,tone,0,1.56,0,.075,.105,.075);
    const arms=[];
    for(const side of [-1,1]){
      const arm=new T.Group();arm.position.set(side*.34,1.38,0);body.add(arm);arms.push(arm);
      const sleeve=style==='coat'?'#eeeae0':cloth;
      ell(arm,sleeve,0,-.19,0,.094,.25,.105);
      ell(arm,tone,0,-.44,.018,.068,.12,.072);
    }
    // Personalised head proportions and facial details.
    const head=new T.Group();head.position.set(0,1.75,0);body.add(head);
    ell(head,tone,0,0,0,.16+(i%3)*.008,.195,.15);
    ell(head,tone,0,-.035,.153,.034,.057,.046);
    for(const side of [-1,1]){
      ell(head,'#2d2926',side*.064,.018,.142,.013,.012,.008);
      ell(head,hair,side*.063,.066,.146,.039,.009,.01);
      ell(head,tone,side*.16,-.025,0,.021,.045,.028);
    }
    if(headwear==='hijab'){
      ell(head,(i%2?'#d5bfab':cloth),0,.105,-.01,.184,.151,.175);
      rect(body,(i%2?'#d5bfab':cloth),0,1.47,-.045,.36,.25,.19);
    }else if(headwear==='white'){
      ell(head,'#c4c5c1',0,.115,-.026,.16,.105,.148);
      ell(head,'#c4c5c1',-.095,.06,0,.08,.073,.15);
    }else if(headwear==='cap'){
      ell(head,'#414b50',0,.145,-.011,.18,.091,.16);
      rect(head,'#414b50',0,.11,.17,.28,.035,.16);
    }else{
      ell(head,headwear==='curly'?'#302622':'#25221f',0,.116,-.035,.169,.13,.153);
      if(headwear==='long'){
        ell(head,'#302722',-.15,-.08,-.055,.07,.23,.12);
        ell(head,'#302722',.15,-.08,-.055,.07,.23,.12);
      }else if(headwear==='ponytail'){
        ell(head,'#2d2520',0,.0,-.19,.09,.19,.095);
      }else if(headwear==='curly'){
        for(let k=0;k<5;k++)ell(head,'#302622',-.145+k*.072,.17,-.02,.06,.065,.07);
      }
    }
    // Optional distinctive work accessories.
    if(item==='backpack'){
      rect(body,'#40474c',0,1.14,-.245,.43,.54,.19);
      for(const side of [-1,1])rect(body,'#77736f',side*.225,1.14,.07,.035,.43,.06);
    }else if(item==='bag'){
      rect(body,'#80604d',.31,.76,.06,.23,.35,.12);
      rect(body,'#b7a68f',.24,1.15,.025,.032,.54,.03);
    }else if(item==='apron'){
      rect(body,'#e7ddc2',0,.99,.215,.48,.60,.03);
      rect(body,'#c6bca4',0,.91,.244,.24,.17,.02);
    }else if(item==='vest'){
      rect(body,'#f4ca52',0,1.22,.214,.48,.41,.04);
      rect(body,'#d8ddcf',0,1.24,.244,.045,.40,.045);
    }else if(item==='camera'){
      rect(body,'#25272e',.20,.89,.225,.21,.18,.145);
      ell(body,'#6c7376',.20,.9,.311,.06,.06,.028);
    }else if(item==='glasses'){
      for(const side of [-1,1])rect(head,'#3e3c3a',side*.067,.014,.161,.10,.024,.022);
      rect(head,'#3e3c3a',0,.017,.169,.044,.013,.025);
    }else if(item==='phone'){
      rect(arms[1],'#242b38',.014,-.48,.095,.10,.16,.035);
    }else if(item==='cane'){
      rect(arms[1],'#967758',.09,-.79,.075,.045,.74,.045);
    }
    group.scale.set(height,height,height);
    group.userData={id:i+1,name,role,arms,legs,body,phase:(i*.73)%6.28,
      speed:style==='galabeya'?.63:.73+(i%5)*.075,dir:i%2?1:-1,
      walkZ:0,minX:-73,maxX:75,rest:i%11===0?0.5:0,groundY:0};
    return group;
  }
  const people=[];
  const rows=[-93,-60,-30,0,30,60,93,133];
  const occupied=[];
  for(let i=0;i<EGYPTIAN_RESIDENTS.length;i++){
    const g=npc(EGYPTIAN_RESIDENTS[i],i);const lane=Math.floor(i/5);
    const nearRoad=rows[lane];const z=nearRoad+(i%2===0?4.5:-4.5);
    const u=g.userData;u.walkZ=z;
    u.minX=(lane===7?-117:-77);u.maxX=(lane===7?67:74);
    let x=(lane===7?-108:-69)+(i%5)*31+(i%3)*3.6;
    let placed=false;
    // Avoid buildings, river and residents at spawn.
    for(let tries=0;tries<60;tries++){
      const nx=u.minX+rng()*(u.maxX-u.minX);
      if(tries===0&&x>u.minX&&x<u.maxX)x=nx;
      else x=nx;
      if(isBlocked?.(x,z))continue;
      if(occupied.some(v=>Math.hypot(v.x-x,v.z-z)<4))continue;
      placed=true;break;
    }
    if(!placed){x=u.minX+(i%5)*6;for(let j=0;j<30&&isBlocked?.(x,z);j++)x+=3;}
    g.position.set(x,0,z);
    occupied.push({x,z});scene.add(g);people.push(g);
  }
  // Time updates do not allocate geometry; far residents do not render on mobile.
  let tick=0;
  function update(dt,t,focus,cars,controlledCar){
    tick++;const f=focus || {x:0,z:0};
    const nearCars=cars || [];
    for(const p of people){
      const u=p.userData;
      const dx=p.position.x-f.x,dz=p.position.z-f.z;
      const dist2=dx*dx+dz*dz;
      const drawRange=(typeof innerWidth==='number'&&innerWidth<760)?78:112;
      p.visible=dist2<drawRange*drawRange;
      if(dist2>(drawRange+20)*(drawRange+20))continue;
      const pauseNearPlayer=dist2<2.8*2.8;
      let yieldCar=false;
      if(controlledCar){
        const dx2=p.position.x-controlledCar.position.x,dz2=p.position.z-controlledCar.position.z;
        yieldCar=(dx2*dx2+dz2*dz2<3.2*3.2);
      }
      // Check traffic only for NPCs near the player (avoids 400 distance checks/frame).
      if(!yieldCar && dist2<55*55){
        for(const car of nearCars){
          const xx=p.position.x-car.position.x,zz=p.position.z-car.position.z;
          if(xx*xx+zz*zz<2.7*2.7){yieldCar=true;break;}
        }
      }
      const startled=(u.startledUntil||0)>t;
      const moving=!pauseNearPlayer&&!yieldCar&&!u.rest&&!startled;
      const delta=moving?u.speed*dt*u.dir:0;
      const next=p.position.x+delta;
      if(next<u.minX||next>u.maxX||isBlocked?.(next,p.position.z)){
        u.dir*=-1;u.rest=.32+(u.id%3)*.16;
      }else p.position.x=next;
      if(u.rest>0)u.rest=Math.max(0,u.rest-dt);
      p.rotation.y=u.dir>0?Math.PI/2:-Math.PI/2;
      const phase=(u.phase+=moving?dt*u.speed*7:0);
      const swing=moving?Math.sin(phase)*.54:0;
      u.legs[0].rotation.x=swing;u.legs[1].rotation.x=-swing;
      u.arms[0].rotation.x=-swing*.7;u.arms[1].rotation.x=swing*.7;
      u.body.position.y=moving?Math.abs(Math.sin(phase))*.035:0;
      // Conversations trigger an actual wave; horns make nearby people flinch briefly.
      if((u.waveUntil||0)>t){
        u.arms[1].rotation.x=-1.2;u.arms[1].rotation.z=-.22;
        u.body.rotation.y=Math.sin(t*.005)*.10;
      }else{u.arms[1].rotation.z=0;u.body.rotation.y=0;}
      if(startled){
        u.body.rotation.x=-.08;
        u.arms[0].rotation.x=-.55;
      }else u.body.rotation.x=0;
    }
  }
  return {people,update,profiles:EGYPTIAN_RESIDENTS};
}
