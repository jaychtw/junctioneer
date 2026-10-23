# Junctioneer checkpoint decisions

## 2026-10-23 — user checkpoint review

- UGDS preflight: acknowledged by the user.
- Gameplay decision: **approved**. A train may revisit previously traversed track when its journey remains valid and can still advance its objectives. Detect nonproductive loops using repeated complete simulation states: position, direction, fixed switch configuration and objective progress. Do not reject a route merely because a segment is revisited.
- Existing engine behavior: already uses `node + incoming direction + fixed switch snapshot + objective progress`; no segment-only visited check exists. The objective-progress loop regression remains applicable. No engine, level, visual or original test evidence was changed for this review request.
- This decision is not a waiver of authored-level solvability or a mechanics change. Future levels must be validated under the approved rules. It supersedes the pending interpretation discussion in the historical QA report.
- Visual direction: **pending review**. No visual production scaling is authorized yet.
- Preservation: original POC source, all 14 screenshots, recording and test evidence retained at commit `95711eaeaf4d43b5cf8e19439f73e5eea629b274` and tag `poc-visual-checkpoint-01`. Evidence hashes remain unchanged.
- Publication: the user explicitly authorized pushing and deploying this POC to the existing `jaychtw/junctioneer` repository to make review accessible. This does not constitute creative approval or full v1.0 acceptance.

## Hosted QA portability follow-up

The original five-second full-animation test deadline failed on hosted software WebGL. Main now permits 20 seconds for that single assertion; no assertion was disabled, and the unchanged game must still complete the journey without skipping and report success. The original test file and all original evidence remain available in the preserved checkpoint tag.

## 2026-10-23 — visual direction approved, Skip Journey correction required

The creative director approved the existing miniature railway direction, particularly the locomotive's dimensional rendering. Production may continue after the shared Skip Journey defect is corrected, tested across all three POC levels, and verified in the redeployed build. No new visual approval is required to continue this approved direction. Final production art acceptance remains separate.

The POC checkpoint and its original evidence remain preserved under `poc-visual-checkpoint-01`. Production captures will be written under a separate directory, never over the original review evidence.

## Production continuation

The shared fix passed hosted QA (72 unit / 32 browser checks), redeployment, and all 12 live early/midway success/failure regressions across L01–L03 before production began. The fixed POC source is separately preserved as `poc-skip-fixed-01`. This satisfied the user's explicit continuation condition. Full production retains the approved original 3D locomotive and miniature modelling/lighting pipeline; new screenshots and recording use `docs/production-evidence`.
