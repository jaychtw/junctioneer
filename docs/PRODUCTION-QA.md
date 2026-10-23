# Junctioneer v1.0 production verification

All 15 authored journeys are implemented across the three GDD chapters. The user approved the original miniature railway direction and authorized continued production after the live Skip Journey fix. This report supersedes historical pending statuses; the original POC reports and captures remain unchanged.

## Standards and checkpoint integrity

Private UGDS v1.0.0 was accessible, fully read, and verified at `d5c6696efdd6efc028118600466db44aecae0c9b` before implementation. A fresh remote-tag check before production matched. Private standards content is not copied into this public repository. Project requirements remain in `docs/handoff`.

Original source/evidence: tag `poc-visual-checkpoint-01`, source `95711eaeaf4d43b5cf8e19439f73e5eea629b274`. Fixed POC source: `poc-skip-fixed-01`, source `ddaf2d21d3aa4cb789f9103c268ee734c84b1702`. Original capture hashes are verified by every review build. New captures use a separate directory.

The shared Skip Journey correction explicitly places and renders the final simulation pose before its once-only completion transaction. It uses the dispatch simulation result regardless of animation position. All three original levels passed early/midway success/failure browser checks on the live fixed POC before production began. See [fix report](SKIP-JOURNEY-FIX.md) and `fix-evidence/live-skip-results.json` (12 passed).

## Full implementation

- Fifteen static, hand-authored port graphs; three chapters with 5×5, 6×6 and 7×7 authoring grids. Explicit initial/canonical settings, headings, ordered stops and linked memberships. Axis-aligned authoring strokes only expand authored data; no generated/random puzzles.
- Exhaustive enumeration of reachable linked-group settings with the actual deterministic simulator. Every level has one solution and meaningful wrong outcomes; no step-limit outcome. Complete expanded graphs, routes, settings, objective counts and difficulty rationale: [machine-readable validation](production-evidence/level-validation.json).
- Actual reversible stem/branch semantics; branch-to-branch traversal rejected. Objective-aware complete-state loop detection includes direction and fixed settings. L09 and L15 exercise repeated track after objective progress. The fixed reversible configured graph cannot support a successful cycle that later exits without changing state; no fabricated winning repeated-track example is claimed. See the accepted gameplay decision.
- Ordered stops dwell at the station position and update live progress; ordinary stations pass through. Wrong-order and premature-final arrivals have separate localized explanations. Linked A/B groups show every member, highlight together on focus/touch/pointer interaction, toggle atomically and retain phase differences.
- Sequential unlocks, chapter menu, retained-choice retry, planning reset, replay, completion celebration and validated local persistence. Existing nonsequential POC completions are retained. Corrupt/blocked saves remain untouched and gameplay continues without saving.
- Centralized English/Traditional Chinese UI and localized level/station metadata. Live language changes preserve simulation, switch settings and outcome. Mouse, keyboard and touch controls; reduced motion; zoom/pan; visible focus; minimum 44px controls. No accounts, telemetry, sound or runtime services.

## Art pipeline and evidence

The approved original Three.js locomotive geometry, materials, dimensional rail/sleeper/bolt assemblies, pitched-roof station with clock/trim/flower boxes, soft lighting and shadows are preserved. Larger slabs and cameras frame chapter layouts. Station placement chooses rail clearance. Chapter palettes, detailed water tower and signal cabin extend the same original runtime modelling pipeline. Static material batching bounds draw calls. No concept image, flat background substitute, downloaded asset, or placeholder is used.

Production captures are actual built gameplay, with SHA-256 identities in [capture manifest](production-evidence/capture-manifest.json). They cover every level's selected route, all three chapters at 320/390/768/1440px in both languages, mobile inspection, and wrong-order/retry/ordered arrival. The production recording uses actual browser screencast frames and original timestamps, encoded as VP9; it includes a complete unskipped two-stop winning journey. Original evidence remains independently browsable in the public review gallery.

## Automated checks and deployment

- `npm test`: **163 passed**, zero failed. Machine result: `production-evidence/unit-results.json`.
- `npm run validate:levels`: **15 levels / 66 reachable configurations / 15 unique solutions**. Every other reachable configuration has a meaningful failure, and none reaches the safety ceiling.
- `npm run build`: TypeScript and Vite production build passed. Application: approximately 166.55 KB gzip JavaScript / 5.40 KB gzip CSS. Vite reports its normal >500 KB uncompressed bundle advisory for the locally bundled Three.js renderer.
- Browser, evidence packaging, hosted CI, deployment and live verification identities are recorded below as they complete. These are distinct milestones.

Initial expanded-content browser runs exposed dense-board control clipping, visible/spoken linked-badge mismatch, and pointer events clearing keyboard group previews. These were corrected in the shared layout/interaction code. The retained final test reports identify checks against the corrected source; no assertions were removed. A test fixture was also corrected to retain saves on reload and to expect the final completion celebration.

## Remaining limits

Chromium software WebGL, touch emulation and automated axe checks do not establish physical-device GPU performance, Safari/Firefox compatibility, screen-reader usability, or independent first-player enjoyment. Those human/device checks have not been performed. Final human art acceptance remains separate from the user's approved production direction. On narrow phones the full 7×7 overview requires zoom/pan for detailed track inspection; equivalent labelled route controls remain available. The bundled Three.js renderer is the primary part of the approximately 166 KB gzip application script; it is locally served and does not contact a CDN. There is no audio.

## Local production evidence

The three-POC-level frame-frozen Skip suite passes **12/12** after the full-game presentation changes (`production-evidence/local-skip-results.json`). The earlier complete run passed 54 scenarios; its two failures were obsolete node-centre pose expectations for L03's curved blocked siding. The presentation now follows the actual rendered quadratic rail, and the test derives the precise midpoint from the authored port vectors. This is a shared geometric assertion, with no level-specific branch and no relaxed tolerance. A fresh complete run and hosted run use that corrected assertion.

`npm run build:review` passed: current production source/build hashes and all original evidence hashes verified. `scripts/check-review.ts` passed on the actual `/junctioneer/` subpath: current application SHA-256, failure/retry/zh-TW success, all 15 menu entries, all **57 image hashes**, both video metadata (66.56s production / 31.32s original), all four gallery widths and zero page errors. Evidence: `production-evidence/local-publication-check.json`. The recordings are genuine software-rendered browser capture, not a claim of physical-device frame rate.
