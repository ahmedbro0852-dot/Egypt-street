# 3D vehicle attribution
CarConcept: model and textures by Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH. Licensed under Creative Commons Attribution 4.0 International: https://creativecommons.org/licenses/by/4.0/
Source and original notices: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/8f492390ddc7a2ae221a1369ef560589cf8c70fb/Models/CarConcept
Adaptations in Egypt Streets: paint colors, coordinate and scale conversion, steering and wheel animation, dynamic lighting integration. Khronos/3D Commerce marks remain the property of their owners; no endorsement is implied.

GLTFLoader and BufferGeometryUtils: Three.js r160, copyright Three.js authors, MIT. https://github.com/mrdoob/three.js/blob/r160/LICENSE


## Mobile HD UI icon set (V53)
Three small SVG HUD icons (wallet, gauge, settings-2) from Lucide Icons, Copyright (c) 2026 Lucide Icons and Contributors; licensed under ISC (with MIT terms for specified Feather-derived icons). Source: https://github.com/lucide-icons/lucide (icons/wallet.svg, icons/gauge.svg, icons/settings-2.svg). Full upstream license notice is included in ui/LICENSE-lucide.txt. The SVG stroke colors were adapted for the Egypt Streets HUD. No external network requests are needed at runtime for these local assets.

## Mobile controls icon additions (V54)
Camera, footprints and car-front SVG icons from Lucide Icons, Copyright (c) 2026 Lucide Icons and Contributors. Licensed under ISC with the full upstream notice in `ui/LICENSE-lucide.txt`. The SVG stroke colors were adapted for the in-game mobile HUD. Sources: https://github.com/lucide-icons/lucide/blob/main/icons/camera.svg, https://github.com/lucide-icons/lucide/blob/main/icons/footprints.svg, https://github.com/lucide-icons/lucide/blob/main/icons/car-front.svg.

## Mobile quest shortcut icon (V55)
`list-checks.svg` from Lucide Icons (Copyright 2026 Lucide Icons and Contributors, ISC license). Source: https://github.com/lucide-icons/lucide/blob/main/icons/list-checks.svg. Full third-party license retained in `ui/LICENSE-lucide.txt`.

## V166 character study

The small street loads the rigged **Soldier / Vanguard** demonstration model and its embedded Idle, Walk and Run clips from the official Three.js r180 example asset:
https://github.com/mrdoob/three.js/blob/r180/examples/models/gltf/Soldier.glb
The source example is https://github.com/mrdoob/three.js/blob/r180/examples/webgl_animation_skinning_blending.html .
This is an externally hosted demonstration character, not a newly authored civilian mesh. Its outfit is field clothing. The binary is not bundled in this repository; loading requires network access. No assertion is made that the Three.js code license grants unrestricted redistribution rights to third-party model assets.

## V169 civilian replacement (current street character)

The street now uses a locally hosted civilian mesh adapted from Innerscene's **Sam**, based on MakeHuman/MPFB body, skin, hair and clothes assets, dedicated under **CC0 1.0**. It replaces the V166 Soldier model entirely in the small street.

- Walk source and license: https://www.innerscene.com/tools/library/3d-parts/relaxed-walk-sam-3d-person-animated-732f1206
- Idle source and license: https://www.innerscene.com/tools/library/3d-parts/idle-standing-sam-3d-person-animated-1f9f1217
- Modifications: charcoal long-sleeved top, blue trousers, darker shoes, accessory removal, selective mesh simplification, reduced texture sizes and a combined rig/clip export. `Run` is an accelerated variant of the authored walk, not new running motion capture.
- No source-site account, remote runtime model download or personal likeness is used. The derived GLB keeps CC0 attribution metadata.
