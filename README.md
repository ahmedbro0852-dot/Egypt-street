# شوارع مصر — Egypt Street

Desktop-first browser open-world driving game built with Three.js. The playable city includes traffic, cars and motorcycles, driving physics, walking, missions, garage upgrades, races, GPS, weather and local save data.

## Play locally

`python3 -m http.server 8080 --directory public`

Open `http://localhost:8080` in a modern desktop browser with WebGL enabled. No build step is needed. `vercel.json` serves `public/` on Vercel; the same folder is compatible with static hosting.

## Desktop controls

- **WASD / arrows:** move, accelerate and steer
- **Mouse drag:** rotate camera
- **E:** enter/exit a nearby vehicle
- **C:** cycle camera angles, including cockpit
- **Shift / Space:** brake while driving
- **X:** drift/handbrake handling
- **M:** game menu
- **F:** interact with people and nearby objects
- **G / B / J / L:** GPS, garage, jobs, street laptop
- **F8:** cycle V43 graphic quality (Balanced / High / Ultra)
- **F9:** photo view — hide HUD; press again to return

## V43 desktop upgrade

The `desktop-world-v43.js` module adds GPU-instanced street reflectors, rooftop A/C details, night-time vehicle headlights, pooled tyre dust or rain spray, live FPS display, and three desktop graphics presets with persisted preference. On touch devices and browsers without WebGL, the game preserves its earlier control and rendering paths.

All V43 art effects are generated locally; there is no background music or tracking. Existing missions and saved game data are retained.

**Rendering note:** The protagonist and parts of the city are stylized 3D. This game is not photorealistic, and the higher desktop presets require a capable graphics processor.

### V44 — persistent road wetness and travelling sunlight

- Asphalt gains a nonmetallic clearcoat as rain accumulates, with shaded puddles instead of unlit blue overlays. Surface wetness rises over about 7 seconds and dries over about 55 seconds per exponential time constant.
- Residual water continues to reduce tyre grip after the rain stops; rain grip is not multiplied twice.
- The bounded sunlight shadow camera follows the player, with up to 150 nearby building casters. Sun direction remains consistent when city time updates.
- Environment reflections dim with daylight so metallic vehicles do not retain midday brightness at night. WebGL-only lighting enhancements preserve the software fallback.

### V45 — Cairo graphics and atmosphere

- Procedural sky dome with a daylight-to-night gradient, soft cloud bands and a directional sun glow; follows the camera without downloading images.
- Upgraded facade response to lighting and batched, selectively illuminated apartment windows after dark.
- The Nile uses an animated fine-ripple PBR water material with subtle reflections and weather-sensitive roughness.
- Up to three nearby street lamps provide pooled real-time light spill. Balanced mode skips their dynamic light cost.
- Weather-dependent atmospheric fog. Existing V44 travelling shadows, V43 graphics presets and all gameplay systems remain in place.

V45 is a **visual improvement, not photorealism**. Its effects require desktop WebGL, and may cost additional GPU time on older computers.

### V48 — detailed palms and atmospheric sky

- Replaces the original box palm leaves and sphere crowns on WebGL with tapered bark trunks and pinnate fronds (1,870 leaf triangles per tree). Geometry and materials are shared; each tree uses two visible meshes.
- Wind deforms foliage and its shadow using shared shader uniforms; strength increases in rain.
- Atmospheric sky now includes smooth multi-octave clouds, a sun disc, sunset tint and sparse night stars, with renderer tone mapping and output color conversion.
- Software-rendered sessions now display an honest graphics fallback notice. Original lightweight trees remain available in that path.
- Validation: finite geometry/color attributes, shared resources, synchronized wind/shadow uniforms, JavaScript syntax and headless OpenGL compilation of the custom sky fragment shader. Full game WebGL visual QA remains limited by the browser environment.

### V60 — lightweight 3D tyre feedback and mobile frame polish

- Adds pooled, procedural **skid marks** behind driven wheels during substantial slip, fading over time (shorter lifetime when raining).
- Adds **rain wheel spray** when driving in wet weather, using a single instanced mesh. Across both effects there are only two additional WebGL draw calls when active, bounded to 28 trail slots + 10 droplets on touch devices (64 + 22 on desktop). The software fallback creates neither mesh.
- Reuses the chase/cockpit camera vectors instead of allocating them every rendered frame and reduces redundant on-screen speed/HUD writes on mobile, without altering steering or vehicle physics.
- Refreshes the offline service-worker cache for V60 and includes the new module; existing mission, money and garage saves are untouched.
- Validation: `node --test tests/road-feedback-v60.test.mjs` (Node 22+) plus static module parsing and integration checks. Browser GPU/frame-rate QA is still required before a production release.

#### V60 cinematic graphics + animation pass

- Mobile WebGL gains a cheap animated sky gradient (day/night horizon, golden-hour sun glow, weather-sensitive clouds) instead of the flat fallback. The richer V45 desktop sky remains unchanged.
- Devices with sufficient resources get a single procedural sun-halo sprite. No external asset downloads, additional WebGL postprocessing passes or shadow-casting lights.
- Camera follows turns with spring-smoothed micro-roll and subtle heading anticipation, plus restrained speed-dependent road vibration. First-person movement is gentler than third-person; reduced-motion preferences and the existing steady-camera option disable those motions.
- Added **جرافيك وحركة سينمائية** toggle in Graphics Settings; balanced mode scales the effects down. The on-screen vignette is CSS-only.
- The mobile adaptive renderer continues controlling pixel density to prioritize frame pacing; no promise of a fixed FPS on all devices.
- Regression checks: `node --test tests/cinematic-graphics-v60.test.mjs tests/road-feedback-v60.test.mjs`. Full-device visual QA remains necessary before production release.

### V160 — grounded Cairo city

Masonry now has locally generated worn plaster textures on mobile while retaining static batching. Touch devices gain a bounded architectural pass (18 facades, three floors) with window sills, balconies and air conditioners. Pavement benches and bollards use three instanced batches. A fourth batch provides soft, pooled contact shadows under moving vehicles and residents (32 slots on mobile, 64 on desktop). No remote downloads, new shadow maps or postprocessing passes are introduced. Gameplay, street vehicle access, races and local progress remain intact.

Validation: `node --test tests/*.test.mjs`. Desktop/mobile browser visual and real-device frame-time checks remain pending; the local Chromium process cannot start in this execution environment. This is a city-detail upgrade, not a replacement with photorealistic scanned assets.

### V164 — living rooftops

Adds rooftop laundry with pinned, wind-deformed fabric and a flock of circling birds with animated wings. Geometry and materials are shared across three instanced batches; mobile is capped at eight rooftops and eight birds, desktop at sixteen rooftops and eighteen birds. Motion freezes while paused or inactive and follows the OS reduced-motion preference. The software renderer skips these decorative effects. Offline assets and entry-point version are refreshed.

Validation: 80 Node regression tests pass, including finite instance matrices, pause/reduced-motion behavior, mobile limits and disposal. Browser launch failed in this environment; visual quality and real-device frame timing remain unverified.

### V165 — focused street material study

V165 introduced a compact first-person street study at `realism.html`. As of V171 the production root opens the full game at `index.html`. This new scene prioritizes a bounded walking space, PBR surface response with procedural bump textures, real sun shadows, environment reflections, recessed windows, balconies, shutters and facade equipment. Static architecture is merged by material and shadow behavior. Touch movement supports simultaneous look drag and directional buttons; keyboard movement is normalized and the street bounds prevent walking through facades. This is an initial procedural material study, not a photogrammetry or photorealism claim. No driving or missions are implemented in this study yet.

Validation: JavaScript syntax checks and all 80 existing regression tests pass. These existing tests cover the previous game, not the new visual scene. Browser/GPU visual verification and phone performance remain pending.

### V166 — visible rigged character

The street study now follows a visible human model in third person. It loads Three.js r180's Soldier demonstration asset and blends embedded Idle/Walk/Run clips from actual displacement, so pressing into a street boundary returns to idle. Shift or the hold-to-run touch button enables running. Camera rotation, a front-view toggle, grounded height normalization and cast shadows are included. This is an externally hosted field-clothing placeholder, not a custom civilian character or photorealistic face. Network failure is shown in the status text. Visual/GPU verification remains pending; syntax and 81 Node tests pass.

### V167 — character handling refinement

Adds acceleration and braking with frame-rate-independent velocity smoothing, animation playback rate tied to measured movement speed, normalized diagonal movement, and boundary feedback that prevents walking animation while blocked. The close inspection view pauses locomotion and permits orbiting the character; returning restores the walking camera yaw. Focus loss and backgrounding clear motion input. The existing external character mesh and outfit are unchanged. Validation: 84 Node tests pass; visual/device QA remains pending.

### V168 — grounded character and camera safety

Adds two-pass camera occlusion checks against static architecture, including after follow smoothing, plus an adjustable viewing distance and a closer inspection target. A local radial contact shadow anchors the character's feet independently of the sun shadow map. Reduced-motion preferences disable camera easing. Failed external character loads reveal a reload button. Validation: 86 Node tests pass, including an actual raycast against a wall with the camera initially behind it. The live page was inspected in the cloud browser, which reports WebGL unavailable; GPU appearance and phone performance remain unverified.

### V169 — civilian appearance replaces the soldier

The character mesh itself is replaced with a locally hosted CC0 Sam/MakeHuman human: exposed face, short dark hair, charcoal long-sleeved top, blue trousers and dark shoes. The civilian rig has authored Idle and Walk clips; Run uses a faster walk variant. Source textures and geometry are reduced selectively to retain the face and garment silhouette. The previous third-person controls and inspection view remain. The exported optimized GLB is rendered in Blender for visual QA, and its structure/animation targets/size are tested. Browser WebGL and device frame-rate QA remain unavailable.

### V171 — open world entry and continuous camera collision

The production root opens the complete Cairo game again: walking, civilian character, vehicles, traffic, jobs and races. The character inspection study stays available at `realism.html`. Both GitHub Pages and Vercel now use the same game entry.

Camera obstruction uses continuous intersections against the existing city collision footprints, replacing ten sampled points and the minimum distance that could push the camera through nearby walls. The sweep runs before follow smoothing and again after cinematic boarding offsets. Directional look-ahead now smoothly follows signed speed, including reverse. The footprint sweep treats buildings as vertical columns; rooftop camera travel is outside its scope. No new render passes, lights or external assets are added.

Validation: `node --test tests/*.test.mjs`, including thin-wall, near-wall, diagonal, reversed-order and reverse-driving camera regressions. Browser WebGL appearance and phone frame timing still need device verification. This improves camera behavior and restores the open world entry; the procedural art is not GTA-level photorealism.
