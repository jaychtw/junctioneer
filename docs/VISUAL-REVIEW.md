# Visual approval checkpoint — direction 01

**Decision requested:** approve this representative in-engine miniature railway direction for production, or request specific changes. Approval has not been given. This checkpoint is part of the full 15-level assignment.

The handoff requires: “pause for explicit creative-director visual approval before scaling art production.” UGDS-V04 and the GDD's mandatory visual gate apply. Automated tests are not creative approval.

## Direction and actual scene

A warm tabletop railway: layered rounded terrain base, sage grass, wooden sleepers, double metal rails, curved points with a gold selected-connection stripe and physical lever, a teal/brass six-wheel locomotive, yellow clapboard station with a pitched standing-seam roof and clock, maintenance barrier, fences, field stones, flowers and trees. Soft directional shadows and a fixed elevated camera keep track geometry inspectable.

All gameplay objects are actual 3D scene objects built for Junctioneer, not a concept image pasted behind controls. Locomotive, station and props are authored as reusable dimensional assemblies. Rails, selected connections and train paths derive from the production simulator's authored port geometry. Selection is also communicated by numbered controls, a lever, and a localized direction label; color is not the sole cue. No external artwork, textures, remote fonts or proprietary game assets are used. System fonts supply Latin and CJK text.

## Pipeline proposed for approval

Continue the reusable TypeScript/Three.js mesh pipeline: refine original models and consistent material/scale rules, batch static objects by material, hand-compose scenery around validated rail layouts, and evaluate each chapter composition in engine on phones and desktop. Terrain/scenery must leave routes and barriers visible. Add chapter-specific landscape and station character only after this direction is approved. No mass asset set has been produced.

This is a stylized 3D POC for review, not a claim that the entire production art set or final visuals have been accepted. If its detail, lighting, expressiveness, or finish is below the desired target, revise this sample before scaling it.

## Review evidence

- [Desktop / English](evidence/poc-1440-en.png)
- [Phone / Traditional Chinese](evidence/poc-390-zh-TW.png)
- [Phone zoom and pan / Traditional Chinese](evidence/poc-mobile-zoom-zh-TW.png)
- [Moving locomotive, locked controls](evidence/poc-desktop-moving.png)
- [Safe stop at a closed siding](evidence/poc-desktop-blocked.png)
- [Successful station arrival](evidence/poc-desktop-arrival.png)
- [Two-junction composition](evidence/poc-desktop-two-switches.png)
- [Scenic detour composition](evidence/poc-desktop-scenic.png)
- [Animated in-engine failure / retry / success recording](evidence/poc-playthrough.webm)
- [Source and capture hashes](evidence/capture-manifest.json)

Additional planning screenshots cover 320, 390, 768, 1440 CSS px in both languages. All are from a locally served production build. No public deployment or physical-device capture is implied.

## Approval record

- Representative direction: **Not Verified — explicit creative-director approval pending**.
- Final production art: **Not Verified — not produced or approved**.
- Full 15-level release acceptance: **Not Verified — this checkpoint contains only levels 1–3**.
- Successful track revisit interpretation: **pending decision**, see QA report.
