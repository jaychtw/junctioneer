# Junctioneer checkpoint decisions

## 2026-10-23 — user checkpoint review

- UGDS preflight: acknowledged by the user.
- Gameplay decision: **approved**. A train may revisit previously traversed track when its journey remains valid and can still advance its objectives. Detect nonproductive loops using repeated complete simulation states: position, direction, fixed switch configuration and objective progress. Do not reject a route merely because a segment is revisited.
- Existing engine behavior: already uses `node + incoming direction + fixed switch snapshot + objective progress`; no segment-only visited check exists. The objective-progress loop regression remains applicable. No engine, level, visual or original test evidence was changed for this review request.
- This decision is not a waiver of authored-level solvability or a mechanics change. Future levels must be validated under the approved rules. It supersedes the pending interpretation discussion in the historical QA report.
- Visual direction: **pending review**. No visual production scaling is authorized yet.
- Preservation: original POC source, all 14 screenshots, recording and test evidence retained at commit `95711eaeaf4d43b5cf8e19439f73e5eea629b274` and tag `poc-visual-checkpoint-01`. Evidence hashes remain unchanged.
- Publication: the user explicitly authorized pushing and deploying this POC to the existing `jaychtw/junctioneer` repository to make review accessible. This does not constitute creative approval or full v1.0 acceptance.
