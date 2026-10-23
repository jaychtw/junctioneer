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
- Existing Level 2 natural completion, speed-up, bilingual input, retry and persistence checks remain in the full browser suite.

Local unit suite: **72 passed**. Local browser suite: **32 passed**, including all 12 frame-independent Skip cases. Build and original-evidence hash validation passed. Hosted/live verification will be recorded after deployment.

Physical-device performance, screen readers and independent-player testing remain unperformed. The reviewed visual direction is approved; final full-production acceptance is separate.
