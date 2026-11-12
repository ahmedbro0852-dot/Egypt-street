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

### V111 preview — repaired 3D world + vehicle cinematics

- **Critical launch recovery:** the published V61 entrypoint requested `city-sculpt-v60.js` and `mobile-palms-v60.js`, but both files were absent in production (HTTP 404). V111 restores both modules on the release branch and restores the budgeted mobile facade-depth code.
- Preserves the V61 Cairo street-racing championships and existing player saves, jobs, traffic and physics.
- Adds a new lightweight vehicle 3D exterior pass to the player's taxi and garage cars, with batched chrome body trim, radiator grille and molded hood accents. It never adds geometry to traffic cars or bikes.
- Two animated windshield wipers respond to **rain + running engine**, and park when the rain stops. The effects are cosmetic and do not change collisions or controls.
- V111 entrypoint and PWA cache version changed to avoid stale mixed assets. The three required city/car modules are precached for repeat play.
- Regression tests: `node --test tests/vehicle-details-v111.test.mjs tests/v111-entry-smoke.test.mjs`. The import smoke test guards against the V61-style missing-module regression.
- Browser WebGL visuals and device FPS still require hands-on testing. V111 is a draft preview, not an automatic production promotion.
