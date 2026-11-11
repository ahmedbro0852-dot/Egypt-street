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
