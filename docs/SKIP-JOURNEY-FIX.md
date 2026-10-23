# Skip Journey — correction and regression evidence

## Root cause

The authoritative deterministic simulation already ran to its terminal result at dispatch, and Skip invoked its result callback. The shared rendering path was faulty: it advanced the animation clock, cleared the animation, and then relied on a future animation frame or ResizeObserver callback to draw the final train position. With no subsequent frame, the visible train stayed where it had been when Skip was pressed. A Level 2 layout resize could mask this problem; this was not a Level 1/3 rule difference.

A browser reproduction disabled future animation and resize callbacks after dispatch and counted real WebGL draw calls. All three original levels reported success but issued **zero GPU draw calls during Skip**. The original snapshot and all images/recording remain untouched in `poc-visual-checkpoint-01`.

## Shared correction

`Diorama.completeAnimation()` is used by both natural completion and Skip. It takes the terminal path directly, places the train at its exact endpoint (avoiding accumulated-distance floating-point misses), explicitly draws the frame, and invokes completion once. It does not wait for another frame or resize and contains no level-specific conditions.

`Session.finish()` returns the stored terminal simulator result only once. The UI commits success persistence from that result and displays its objective progression. Replay, failures and duplicate completion calls cannot incorrectly award progress. The simulation's locked switch snapshot and exact ordered-stop/loop rules are unchanged.

## Regression scope

- Unit: all three POC levels, winning and incorrect configurations, early and halfway through playback; exact terminal pose and draw-before-commit ordering; idempotent completion; equality with natural completion; ordered intermediate objectives; floating-point endpoint protection.
- Browser: all three POC levels × success/failure × early/midway = 12 cases. After reaching the chosen frame, the tests deliberately suppress future RAF and resize callbacks, then assert real WebGL drawing, the exact terminal train position, correct result, objective count and persistence. This catches the original rendering defect even if a layout resize would otherwise hide it.
- Level 2 bilingual input, retained choices, persistence and reduced-motion natural completion remain covered. Shared animated natural completion and speed-up are also exercised in the browser suite.

Local unit suite: **72 passed**. Local browser suite: **32 passed**, including all 12 frame-independent Skip cases. Build and original-evidence hash validation passed. Hosted/live verification will be recorded after deployment.

Physical-device performance, screen readers and independent-player testing remain unperformed. The reviewed visual direction is approved; final full-production acceptance is separate.

Hosted setup correction: the dependency-install step on `ubuntu-latest` stalled. QA now pins the supported Ubuntu 24.04 runner and uses its preinstalled Google Chrome (`/usr/bin/google-chrome`), verified against the official runner image software manifest. The same 32 tests still execute; no browser assertion or scenario is removed.

## Public-build verification — passed

- Hosted QA: https://github.com/jaychtw/junctioneer/actions/runs/39971314038 — passed (72 unit / 32 browser tests).
- Deployment: https://github.com/jaychtw/junctioneer/actions/runs/39971779830 — passed.
- Public site: https://jaychtw.github.io/junctioneer/ .
- All **12 live Skip regressions passed**, 0 failed, 0 skipped. Full run data: [live-skip-results.json](fix-evidence/live-skip-results.json). HTTPS checks remained enabled.
- The post-fix GPU reproduction shows an immediate terminal draw in all three levels (145 / 153 / 145 draw calls), compared with zero before the correction.
- The user’s condition for starting production is now met. Original POC snapshot remains `poc-visual-checkpoint-01`; the fixed source is separately tagged `poc-skip-fixed-01`.

## Full-game continuation

The unit completion harness now covers all 15 levels × success/failure × early/midway (60 cases), with additional lifecycle/geometry assertions. The original 12 browser regressions remain active. Interrupted curved arrivals now follow the actual displayed rail; the L03 failure endpoint is derived from its port vectors rather than the off-rail cell centre. Level 2's straight terminal geometry and results remain unchanged. See [production QA](PRODUCTION-QA.md) for current counts and new deployment evidence; the fixed POC evidence above remains historical and unchanged.


Full-game source `8bb78b9` passed **163 unit / 56 browser tests** locally and on hosted QA, then **all 12 frame-frozen Skip regressions** again on its actual public deployment (within 14 passing live tests). Level 2 remains correct in early/midway winning and incorrect configurations. Current reports and evidence are linked from [production QA](PRODUCTION-QA.md).
