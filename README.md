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
