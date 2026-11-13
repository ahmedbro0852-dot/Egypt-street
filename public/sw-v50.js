// Egypt Streets V50: network-first navigation, cached local assets for repeat play.
// Gameplay progress stays in localStorage, not in the service worker.
const CACHE='egypt-streets-static-v180-motion-speed';
const SHELL=["./character-pose-v180.js","./taxi-design-v179.js","./street-detail-v178.js","./character-size-v175.js","./nile-bridges-v174.js","./character-body-v171.js","./street-character-v166.js","./character-surface-v170.js","./models/civilian-v169.glb","./living-rooftops-v164.js","./grounded-city-v160.js","./ui-skin-v162.js","./street-design-v162.css","./kenney-car-visuals-v157.js","./character-mixer-v161.js","./external-physics-v157.js","./","./index.html","./game.js","./three.js","./egypt-streets-icon.svg","./icon-192.png","./icon-512.png","./egypt-streets-logo.svg","./manifest.webmanifest","./mobile-performance-v50.js","./mobile-lite-v51.js","./ui/lucide-wallet.svg","./ui/lucide-gauge.svg","./ui/lucide-settings.svg","./ui/lucide-camera.svg","./ui/lucide-footprints.svg","./ui/lucide-car-front.svg","./ui/lucide-list-checks.svg","./ui/LICENSE-lucide.txt","./mobile-static-batching-v52.js","./city-quests-v50.js","./install-v50.js","./GLTFLoader.js","./BufferGeometryUtils.js","./animation-polish-v31.js","./auto-drive-v55.js","./auto-drive-v6.js","./cairo-city.js","./cairo-graphics-v45.js","./cairo-races-v31.js","./race-league-v100.js","./race-opponents-v150.js","./race-preview-v152.js","./vehicle-entry-v151.js","./vehicle-entry-cinema-v153.js","./driver-avatar-v154.js","./driver-attention-v155.js","./ride-camera-v156.js","./race-league-v100.css","./city-life-v5.js","./cockpit-v15.js","./collision-physics-v18.js","./controls-v3.js","./desktop-world-v43.js","./detailed-car-v42.js","./drift-challenge-v35.js","./drift-system-v34.js","./driving-realism-v9.js","./egyptian-crowd.js","./facade-depth-v46.js","./game-save-v55.js","./garage-v8.js","./gps-v6.js","./mobile-experience-v40.js","./palm-landscape-v48.js","./pedestrian-physics-v20.js","./race-arena-v32.js","./realism-render-v16.js","./realistic-fuel.js","./reference-look-v47.js","./road-safety-v21.js","./roads-realism-v17.js","./royal-hud-v49.js","./street-audio.js","./driving-effects-v56.js","./road-feedback-v60.js","./cinematic-graphics-v60.js","./city-sculpt-v60.js","./mobile-palms-v60.js","./mobile-instruments-v56.js","./street-careers.js","./street-details-v15.js","./street-events.js","./street-laptop-v41.js","./taxi-dispatch-v15.js","./time-attack-v37.js","./travel-lighting-v44.js","./v30-expedition.js","./vehicle-dynamics-v19.js","./vehicle-physics.js","./wheel-rig.js","./design-pc-v41.css","./reference-hud-v47.css","./royal-hud-v49.css","./cairo-menu-bg.svg","./cairo-dusk-v41.svg","./character-reference.jpg"];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('egypt-streets-static-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(/\/(?:game|cairo-races-v31|race-league-v100|mobile-lite-v51)\.js$/.test(new URL(request.url).pathname)){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
   return response;
  }).catch(async()=>await caches.match(request,{ignoreSearch:true})||Response.error()));
  return;
 }
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
   return response;
  }).catch(async()=>await caches.match(request)||await caches.match('./index.html')||Response.error()));
  return;
 }
 event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>{
  const refreshing=fetch(request).then(response=>{
   if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
   return response;
  });
  if(cached){event.waitUntil(refreshing.catch(()=>{}));return cached}
  return refreshing.catch(()=>Response.error());
 }));
});
