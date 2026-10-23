# Codex Handoff — Junctioneer full implementation

**Assignment:** Build the complete v1.0 Junctioneer game described in `GDD.md`, with all 15 authored and verified levels. This is the **first pilot of our new two-document workflow**, but the game must be treated as a genuine polished product, not a disposable experiment.

## STOP: mandatory preflight
**NO VERIFIED UGDS, NO IMPLEMENTATION.** Before writing code, creating art, or building a prototype:

1. Access private `jaychtw/game-development-standards` (request GitHub authorization if needed).
2. Fetch `UGDS.md` at tag `v1.0.0`, **not** the mutable `main` branch. Confirm tag resolves to commit `d5c6696efdd6efc028118600466db44aecae0c9b`.
3. Read the complete pinned UGDS, `GDD.md`, this handoff, and `LEVEL-AUTHORING.md`.
4. Report the source URL, tag, resolved commit SHA, full-read confirmation, conflicts/ambiguities, and **preflight PASSED**. If access or verification fails, **STOP and ask for permission**; do not substitute memory, summaries, old games, or GDD for UGDS.
5. Resolve material conflicts before affected implementation. Applicable laws/platform rules override, and project-specific requirements may strengthen UGDS but not silently waive it.

## What changed from earlier projects
Prior games largely relied on their own GDD. Now **UGDS is the reusable universal baseline**; the project GDD contains only Junctioneer-specific design. Both are binding, and a verified read is a prerequisite to execution. Do not copy UGDS into a public repository without explicit permission.

## Authorized autonomy and gates
- You own implementation language/framework, repo organization, authored level topology, detailed art pipeline proposals, unit/browser testing, and routine engineering choices. Prefer web-first, responsive, static-deployable architecture with no unnecessary network dependencies.
- You may develop the **functional core POC** and representative polished **in-engine visual POC** after preflight, then **pause for explicit creative-director visual approval before scaling art production**. Do not treat the POC as the full product.
- After approval, implement **all 15 levels**, full UX, both languages, persistence, responsive layouts, QA and release evidence. If implementation can proceed without creative decisions, continue autonomously.
- Escalate material mechanics changes, scope cuts, visual pipeline compromises, inability to author compelling/solvable levels, third-party licensing, paid services, telemetry, security/privacy changes, or mandatory standard exceptions.
- **Do not** silently switch to flat placeholder SVGs, paste concept art into the game, or declare aesthetics approved based only on automated tests.
- Repository name suggestion: `junctioneer`. If the project repo does not yet exist, ask the owner to create/authorize it or use an approved local workspace; do not imply it already exists. Public deployment requires authorization.

## Work plan and required evidence
1. **Preflight:** UGDS access verified; record in `docs/QA-REPORT.md`.
2. **Engine and authored puzzle proof:** deterministic graph simulation, editor/validator or equivalent authoring workflow, solver; validate three representative puzzles and incorrect outcomes. Unit tests.
3. **Visual gate:** actual playable representative scene with selected/unselected junctions, train, curve, station, obstacle and scenery; mobile/desktop screenshots; coherent original asset strategy; seek creative-director approval.
4. **Full content:** all 15 handcrafted levels, chapter progression, teaching, linked switches in chapter 3, localized UI, save/retry, accessibility, mobile and desktop interactions.
5. **Independent QA:** unit, authored-level solver checks, browser E2E, screenshots, accessibility checks, build, CI and authorized deployment. No unverified success claims.
6. **Delivery:** commit SHA, repository link, playable URL only if verified, screenshots, actual test counts and commands, `docs/QA-REPORT.md`, known gaps, creative approvals, outstanding physical-device/independent-player testing.

## Acceptance gates
- All 15 levels exist and have solver-verified solutions and explicit wrong-path tests.
- Stem-to-selected-branch bidirectional, never branch-to-branch; correct blocked/dead-end/loop/ordered-stop behavior.
- No mid-dispatch toggling; no randomness; retry retains switch state.
- Distinctive polished original miniature railway visual treatment **approved by human creative director**.
- EN/zh-TW live switching; 320/390/768/1440 layouts; keyboard/mouse/touch; saved progress.
- Full reproducible QA and honest deployment evidence.

## Reporting template
- UGDS access URL / tag / resolved commit:
- Full UGDS read and conflicts / exceptions:
- Preflight outcome (PASS/BLOCKED):
- Engineering decisions and art pipeline:
- Functional POC and solver evidence:
- Visual POC screenshots and creative-director approval:
- Levels 1–15 validation results:
- Unit/browser/accessibility/build results and commands:
- Languages, devices and viewports tested:
- CI / deployment / live verification (each separately):
- Final commit SHA, links, outstanding risks:
- Physical device and independent-player testing (performed/not performed):
