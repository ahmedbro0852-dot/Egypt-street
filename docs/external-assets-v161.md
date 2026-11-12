# V161 external tools and licensed assets

This release deliberately does **not** import or reproduce GTA/Rockstar textures, maps,
characters, audio, missions, or proprietary files. It uses independently licensed 3D
models and an open-source rigid-body engine to improve the existing game.

## Vehicle appearance — Kenney Car Kit (CC0 1.0)

Publisher and original asset source: https://kenney.nl/assets/car-kit
Kenney license: https://kenney.nl/support ("Creative Commons Zero", CC0)
Converted GLB asset archive: https://github.com/Hidencod/tge-assets
Exact immutable revision:
`3ddcc695adbba9fb918cf31b7c139b3f95b76910`

Files referenced on demand:
- `packs/car-kit/taxi.glb`
- `packs/car-kit/sedan.glb`
- `packs/car-kit/sedan-sports.glb`
- `packs/car-kit/suv.glb`

All meshes are optional and loaded only for nearby vehicles within a strict device
budget. When remote assets are offline/unavailable, the game's built-in car geometry
is used instead. No trademarked Rockstar assets are redistributed.

## Physical rigid bodies — cannon-es 0.20.0 (MIT)

Project: https://github.com/pmndrs/cannon-es
Pinned module: https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm
License: https://github.com/pmndrs/cannon-es/blob/master/LICENSE

Used for movable street crates/cones (real gravity, friction, angular velocity,
rigid-body collisions) and a kinematic vehicle collision proxy. The core vehicle
handling, traffic avoidance, race logic, character locomotion and saves remain
under the game's existing lightweight model. This is a **hybrid** physics system,
not a fully rigid-body car chassis / GTA-equivalent vehicle simulation.

To avoid WebAssembly setup costs and redundant dependencies on old phones, the
engine is lazy-loaded after gameplay starts. It does not initialize an external
physics instance for every car. It is optional: CDN failures leave the game playable.

## Existing animation and rendering stack

Three.js with GLTFLoader, the existing articulated character animation system,
wheel steering, suspension travel and impact reactions continue to work in parallel.
The V157 Kenney assets do not require a new WebGL renderer. They share the existing
canvas, camera and event loop, with a global cap on upgraded vehicle visuals.

Do not remove license tracking when replacing these sources. For future assets,
verify the author's specific license; an asset hosted in an MIT-licensed repository
does not automatically grant an MIT license for the artwork.
