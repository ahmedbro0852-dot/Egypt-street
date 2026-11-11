// Procedural environmental audio: no music, external files or tracking.
export function createStreetAudio(){
 let ctx,master,engine,engineGain,engineFilter,roadGain,windGain,rainGain,muted=false,nextStep=0,nextBird=0,nextHorn=0,nextSkid=0;
 function noise(){const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
 function bed(buffer,type,freq,gain){let source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=type;filter.frequency.value=freq;g.gain.value=gain;source.connect(filter).connect(g).connect(master);source.start();return g}
 function start(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.65;const limiter=ctx.createDynamicsCompressor();master.connect(limiter).connect(ctx.destination);let n=noise();windGain=bed(n,'lowpass',450,.018);
 roadGain=bed(n,'bandpass',700,0);
 rainGain=bed(n,'highpass',1150,0);
 engineGain=ctx.createGain();engineGain.gain.value=0;
 engine=ctx.createOscillator();engine.type='sawtooth';engine.frequency.value=38;
 engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=240;
 engine.connect(engineFilter).connect(engineGain).connect(master);engine.start();nextBird=ctx.currentTime+3;nextHorn=ctx.currentTime+8;}ctx.resume().catch(()=>{});}
 function tone(freq,duration,gain,type='sine',pan=0,end=freq){if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);p.pan.value=pan;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(p).connect(master);o.start();o.stop(t+duration+.02)}
 function horn(distant=false){start();const p=distant?Math.random()*1.6-.8:0,g=distant?.012:.06;tone(370,.28,g,'sawtooth',p);tone(465,.30,g*.6,'sawtooth',p)}
 function step(){const t=ctx.currentTime,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuffer||(noiseBuffer=noise());f.type='lowpass';f.frequency.value=850;g.gain.setValueAtTime(.095,t);g.gain.exponentialRampToValueAtTime(.0001,t+.10);s.connect(f).connect(g).connect(master);s.start();s.stop(t+.12);tone(95,.08,.04,'sine',0,55)}let noiseBuffer;
 function tick({active,paused,driving,speed,traffic=[],p,dt,rpm=0,engineOn=false,throttle=0,skid=0,weather='صحو'}){
  if(!ctx)return;
  const t=ctx.currentTime,running=active&&!paused&&!document.hidden;
  master.gain.setTargetAtTime(running&&!muted?.65:0,t,.08);
  const motorSpeed=Math.max(0,rpm||0);
  // RPM, not road speed, controls engine note. Gearshifts audibly drop the pitch.
  engine.frequency.setTargetAtTime(28+motorSpeed/47,t,.065);
  engineFilter.frequency.setTargetAtTime(180+motorSpeed*.105+Math.abs(throttle)*220,t,.10);
  engineGain.gain.setTargetAtTime(running&&driving&&engineOn?
    .021+Math.min(.065,motorSpeed/110000)+Math.abs(throttle)*.026:0,t,.085);
  windGain.gain.setTargetAtTime(running?Math.min(.055,.007+Math.abs(speed)*.0009):0,t,.24);
  rainGain.gain.setTargetAtTime(running&&weather==='مطر'?.036:0,t,.35);
  let near=0;
  for(const c of traffic)near+=Math.max(0,1-c.position.distanceTo(p)/22);
  roadGain.gain.setTargetAtTime(running?Math.min(.065,.006+near*.006+Math.abs(speed)*.0015):0,t,.2);
  if(!running||muted)return;
  if(!driving&&Math.abs(speed)>.6&&t>nextStep){
   step();nextStep=t+Math.max(.19,.48-Math.abs(speed)*.025);
  }
  if(driving&&Math.abs(speed)>5&&skid>.50&&t>nextSkid){
   tone(370,.18,Math.min(.025,.008+skid*.012),'triangle',0,250);
   nextSkid=t+.58;
  }
  if(t>nextBird){tone(2200,.11,.012,'sine',-.7,3100);tone(2900,.14,.009,'sine',.4,2400);nextBird=t+6+Math.random()*9}
  if(t>nextHorn){horn(true);nextHorn=t+12+Math.random()*16}
 }
 function impact(severity=4,kind='vehicle'){
  // Short mechanical impact, not music; respects mute and suspended audio.
  if(!ctx||muted)return;
  const size=Math.max(.15,Math.min(1,Number(severity)/19||.2));
  const low=kind==='vehicle'?68:95;
  tone(low+size*38,.10+size*.12,.012+size*.052,'triangle',0,low*.58);
  if(kind==='vehicle'&&severity>4)
    tone(135+size*75,.07+size*.10,.007+size*.018,'sawtooth',-.16,70);
 }
 function toggle(){start();muted=!muted;return muted}
 function suspend(){if(ctx)ctx.suspend().catch(()=>{})}
 return {start,tick,horn,impact,toggle,suspend};
}
