# Junctioneer v1.0 — checkpoint QA report

**Milestone:** functional core + representative in-engine visual POC. **Not a completed v1.0 release.**

**Date:** 2026-10-23 (Asia/Taipei). Automated validation ran in the provided Linux cloud machine. Creative approval and full content production are pending.

## Mandatory UGDS preflight — PASS

- Private source: https://github.com/jaychtw/game-development-standards/blob/v1.0.0/UGDS.md
- Immutable source: https://github.com/jaychtw/game-development-standards/blob/d5c6696efdd6efc028118600466db44aecae0c9b/UGDS.md
- Fetched tag: `v1.0.0`.
- Resolved commit: **`d5c6696efdd6efc028118600466db44aecae0c9b`**, exactly matching the handoff.
- Read-only `git ls-remote` succeeded using existing platform GitHub authentication. A shallow bare fetch then independently verified the tag's commit object. No new token was requested.
- **Full-read confirmation:** complete pinned UGDS, `CODEX-HANDOFF.md`, `GDD.md`, `LEVEL-AUTHORING.md`, `QA-CHECKLIST.md`, and handoff `README.md`, before code, art or prototype work began.
- Private standard retained outside this game checkout in `/workspace/shared/ugds-preflight.git`. Its text is not copied into this repository.
- Supplied archive SHA-256: `b0043288efbe83a138298c84753b1d1e15762a26b6d23625c4cd5f4255a842d9`.

## Conflicts, questions and gates

No rule waiver or material mechanics change has been assumed. One curriculum requirement needs creative-director interpretation before affected level production:

Every fixed switch setting gives each port graph vertex active degree at most two, with reversible internal and external connections. A moving train follows a path or cycle. Without reversal or changing switches, a route that repeats a directed segment is periodic; it cannot subsequently escape to a successful final terminus. Thus a _winning route that revisits the same track_ cannot be authored under the locked rules. Wrong configurations can validly enter loops when starting on an internal directed rail. A valid loop-with-an-escape-setting fixture is tested separately.

Asked whether to interpret the successful-revisit requirement as objective-aware loop detection and ordinary station traversal, without requiring an impossible winning revisit puzzle. **Decision pending.** No affected later curriculum has been implemented or silently dropped.

The handoff says to “pause for explicit creative-director visual approval before scaling art production.” [Visual direction and evidence](VISUAL-REVIEW.md) are prepared. **Representative direction approval: Not Verified / pending. Final art acceptance: Not Verified / pending.**

## Engineering and art decisions

- Static, web-first TypeScript + Vite app. Consequential rail rules are independent of presentation and share the exact production simulator with the exhaustive solver.
- Explicit authored cardinal port graph; no visual grid, hidden connectors, random maps, teleportation, implicit reversal, branch-to-branch travel, mid-run switching, timers, scores, accounts or telemetry.
- Three.js renders original dimensional model assemblies and graph-derived track curves. Train movement follows those same continuous curves. Static geometry is batched by material; device pixel ratio is capped at 2. Idle scenes do not redraw. Hidden tabs suspend advancement/rendering.
- All text and accessibility labels are centralized in EN/zh-TW resources; live switching preserves the session. System fonts support Latin/CJK; no web font or remote asset is fetched.
- Local completed levels, language and reduced-motion preference are saved. Bad or blocked storage produces a localized warning and session-only operation; corrupt original data is not overwritten. Completion is idempotent on replay.
- Desktop controls, keyboard activation and touch-emulated controls work. Large map switches have collision-avoiding label placement and equivalent sidebar controls. Zoom, four-direction pan and view reset permit inspection on small phones.
- No audio is included; mute is N/A. No third-party art, external runtime services, paid services or telemetry were added. Dependencies retain their own package licenses; original work has not been assigned a new public license.

## Actual local checks

| Command / capability                                   | Outcome                  | Evidence / scope                                                                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci --cache /workspace/shared/npm-cache --no-fund` | Pass                     | Clean lockfile install; 58 packages installed; no dependency or lockfile drift                                                                                                                                           |
| `npm test`                                             | Pass                     | **57 tests passed, 0 failed, 0 skipped** in one test file                                                                                                                                                                |
| `npm run validate:levels`                              | Pass                     | **3 authored levels**, **8 reachable settings exhaustively checked**, **3 winning / 5 failing settings**; exact canonical wins and wrong-path outcomes recorded in [level-validation.txt](evidence/level-validation.txt) |
| `npm run build`                                        | Pass                     | TypeScript checks + production Vite bundle; build output in `dist/`                                                                                                                                                      |
| `npm run test:e2e`                                     | Pass                     | **20 Chromium browser tests**; full-run result confirmed before checkpoint commit                                                                                                                                        |
| Automated accessibility                                | Pass within tested scope | axe WCAG 2 A/AA + 2.1 A/AA: zero violations in tested result layouts at all four widths in both languages, plus planning and help dialog; this is not a complete accessibility certification                             |
| `npm run capture`                                      | Pass                     | **14 actual production-build screenshots**, no page errors; animated failure/retry/success recording                                                                                                                     |
| Video integrity                                        | Pass                     | `ffprobe`: VP9, 1440×1000, **31.32 s**, **521,202 bytes**; 196 Chrome DevTools frames with original timestamps, encoded by installed system FFmpeg                                                                       |
| Reusable install script                                | Pass                     | `bash scripts/cloud-install.sh` executed successfully: clean install, unit checks, level validation, build                                                                                                               |
| Dev / production startup                               | Pass                     | Actual Vite development server on 5173 and production preview on 4173; meaningful browser play on development and production builds                                                                                      |
| Environment configuration                              | Saved draft only         | Complete tested `install_script` and service `start_skill` saved. No network/secret requirements added. Save does not execute, publish or prove fresh-task restoration                                                   |

Build currently emits a non-failing warning for the Three.js-containing JavaScript chunk: approximately 611 kB minified / 160 kB gzip; CSS approximately 19 kB / 5 kB gzip. This is recorded, not suppressed. Rendering for the representative L01 capture reports 145 draw calls and 37,600 triangles. Headless SwiftShader validation establishes rendering and interactions, not frame-rate guarantees on physical phones.

Earlier exploratory checks found phone overflow, low-contrast supporting text, accessible-name mismatches and close map-switch targets. These were corrected and the affected tests passed. The initial loop-progress unit assertion expected one extra lap; diagnosis confirmed the simulator correctly stops earlier on an already-repeated full state, and the test now asserts that behavior. No assertion or mandatory check was disabled to get a passing result.

## Level proof at this checkpoint

| Level                        | Independent controls | Settings checked | Winners | Meaningful incorrect outcomes         | Winning route nodes |
| ---------------------------- | -------------------: | ---------------: | ------: | ------------------------------------- | ------------------: |
| L01 All Aboard / 準備出發    |                    1 |                2 |       1 | Blocked siding                        |                   5 |
| L02 Two Decisions / 兩次選擇 |                    2 |                4 |       1 | Dead end (2 settings), blocked siding |                   7 |
| L03 Scenic Route / 沿途風景  |                    1 |                2 |       1 | Blocked shortcut                      |                  10 |
| L04–L15                      |                    — |                — |       — | **Not implemented or verified yet**   |                   — |

The three POC levels have explicit initial settings, canonical winning settings, localized metadata, difficulty rationale, authored geometry and exhaustive wrong-setting checks. The loop test fixture is unit-test evidence, not a claimed fourth shipped level. Full chapter progression and final curriculum remain outstanding. Automated solvability is not evidence of human enjoyment.

## Test coverage and environment

**Unit coverage:** both stem→selected-branch and selected-branch→stem; blocked unselected branch; no branch-to-branch; ordinary bidirectional rail; absent ports; atomic linked toggles and reachable group settings; immutable deterministic dispatch; motion lock; retry retaining settings; reset; obstacles; dead ends; external disconnection; ordered stops and dwell; ordinary station traversal; premature final terminus; objective-aware directed loop state; a valid solvable graph with an incorrect loop setting; defensive step ceiling as a defect; duplicate IDs/cells; invalid geometry/stations/start/groups; blocked start; isolated railway; validated saves, corrupt/blocked storage and idempotent completion.

**Browser coverage:** real clicks, keyboard and touch taps; complete playthroughs of all three POC levels; safe failure/retry; preserved settings; replay persistence; saved preference restoration; mid-run language switching and lock; full animation and speed-up; reduced motion; dialog focus/Escape; all required layout widths; zoom/pan/reset; nonoverlapping mobile two-switch targets; no-WebGL localized fallback; automated axe audits.

| Dimension                    | Tested                                                                      |
| ---------------------------- | --------------------------------------------------------------------------- |
| Node / npm                   | 24.19.0 / 11.9.0                                                            |
| Chromium                     | 154.0.8037.57 (Debian Linux)                                                |
| TypeScript / Vite / Three.js | 7.0.2 / 8.3.5 / 0.186.1                                                     |
| Playwright / Vitest / axe    | 1.64.1 / 5.0.5 / 4.14.0                                                     |
| Widths                       | 320, 390, 768, 1440 CSS px                                                  |
| Languages                    | English, Traditional Chinese (zh-TW)                                        |
| Input                        | Desktop mouse and keyboard; touch-emulated phones                           |
| Rendering                    | Headless Chromium, software WebGL (SwiftShader), desktop/mobile screenshots |
| Storage                      | Valid, corrupt and access-blocked localStorage                              |

## UGDS acceptance ledger

Statuses are scoped to this checkpoint. A Pass here does not assert a finished 15-level release.

| Standard                                     | Status       | Evidence or outstanding work                                                     |
| -------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| P01 complete loop                            | Pass         | Playable goal, planning, dispatch, result and retry across 3 POC levels          |
| P02 input                                    | Pass         | Mouse, keyboard, touch-emulation tests                                           |
| P03 responsive                               | Pass         | Actual 320/390/768/1440 rendered layouts in both languages; inspectable zoom/pan |
| P04 fair observable rules                    | Pass         | Shared graph/curve geometry, explicit choices and obstacles, simulator checks    |
| P05 recovery                                 | Pass         | Unlimited retained-setting retry; no destructive progress reset control          |
| L01 bilingual                                | Pass         | Centralized UI, metadata, feedback and labels for implemented content            |
| L02 live switching                           | Pass         | Before, during and after dispatch without state loss                             |
| A01 accessible interaction                   | Pass         | Keyboard/focus/labels and tested automated contrast; human usability pending     |
| A02 motion/sound                             | Pass         | System and saved reduced-motion settings; sound N/A (none included)              |
| V01 original assets / no concept deliverable | Pass         | Actual original in-engine 3D models and rail geometry                            |
| V02 separate production gate                 | Not Verified | POC produced; final production remains gated                                     |
| V03 coherent integration                     | Not Verified | Technical graph alignment checked; human visual judgment pending                 |
| V04 representative visual POC                | Not Verified | Representative scene/evidence exists; explicit approval pending                  |
| V05 no silent downgrade                      | Pass         | Pipeline and sample presented honestly; approval not assumed                     |
| V06 final visual evidence                    | Not Verified | POC screenshots/video only; final build/art not yet produced                     |
| S01 persistence                              | Pass         | Tested completed levels, language, motion, corrupt/blocked recovery              |
| S02 runtime independence                     | Pass         | Locally bundled app and geometry; no remote runtime services                     |
| S03 performance                              | Not Verified | Batching and resource bounds implemented; physical-device performance untested   |
| S04 age-appropriate honesty                  | Pass         | Untimed family puzzle, safe stops, no real-world railway claims                  |
| Q01 engine                                   | Pass         | 57 tests and exhaustive POC solver checks                                        |
| Q02 browser gameplay                         | Pass         | 20 real interaction tests, both languages and desktop/touch                      |
| Q03 content balance/integrity                | Not Verified | 3 levels proven; remaining 12 and human enjoyment pending                        |
| Q04 accessibility validation                 | Pass         | Automated audits + keyboard checks with stated limitations                       |
| Q05 release integrity                        | Pass         | Local build, push, hosted CI, deployment and live verification kept distinct     |
| Q06 evidence                                 | Pass         | Commands/counts, screenshots/video, hashes, environment and limitations recorded |
| C01 decision ownership                       | Pass         | Engineering choices exercised; creative gate remains with director               |
| C02 escalation                               | Pass         | Visual approval and impossible successful-revisit requirement raised             |
| C03 versioned improvements                   | N/A          | No changes to UGDS requested or made                                             |

## Release, preservation and outstanding work

- Source checkout: `/workspace/junctioneer`; origin https://github.com/jaychtw/junctioneer . The origin was empty when this assignment began. A local checkpoint commit is created for review; use `git rev-parse HEAD` for its full SHA (also supplied in delivery). **No remote push is claimed.**
- Reproducible local development/build: verified. A new task's filesystem restoration: **Not Verified**. Preserve the local checkout/checkpoint; source is not remotely backed up yet.
- CI workflow: authored at `.github/workflows/qa.yml`; **hosted execution not performed**.
- Deployment: **not authorized or performed**. Live hosted gameplay: **Not Verified**. No public playable URL is claimed.
- Environment settings: install/start fields saved to the draft for review. Review and save relevant settings, then publish the environment if desired; this is separate from game deployment and does not constitute visual approval.
- Independent QA reviewer / independent first-time player: **not performed**. The implementation agent ran automated QA; no independent human sign-off is implied.
- Physical iOS/Android/desktop device performance, Safari/WebKit, Firefox, screen readers and human usability: **not performed**.
- Outstanding after explicit direction approval: remaining 12 authored levels; full chapter unlocking and teaching; playable ordered-stop and linked-switch curriculum; approved interpretation of track revisits; chapter-specific production art and final visual review; full-content regression QA and authorized release work.

Capture source/artifact hashes are in [capture-manifest.json](evidence/capture-manifest.json). See [VISUAL-REVIEW.md](VISUAL-REVIEW.md) for directly reviewable screenshots and video.
