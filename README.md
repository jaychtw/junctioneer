# Junctioneer

Fifteen cheerful, untimed miniature railway puzzles in English and Traditional Chinese. TypeScript + Three.js, original runtime-built 3D art, and static hosting. No accounts, telemetry, audio or runtime services.

**Play:** https://jaychtw.github.io/junctioneer/ · **Screenshots and recordings:** https://jaychtw.github.io/junctioneer/review/

All 15 authored levels, three chapters, ordered stops, linked switches, progression and local saves are implemented. The original miniature art direction is approved; remaining independent human/device acceptance limits are recorded in [production QA](docs/PRODUCTION-QA.md). See the [Skip Journey fix](docs/SKIP-JOURNEY-FIX.md), [checkpoint decisions](docs/DECISIONS.md) and supplied [handoff](docs/handoff/CODEX-HANDOFF.md).

## Develop and verify

Use this checkout; do not create a worktree unless requested. Node 24.19.0 / npm 11.9.0:

```sh
npm ci --cache /workspace/shared/npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run validate:levels
npm run build
npm run test:e2e
```

The absolute cache path is for the cloud environment. Elsewhere use your normal npm cache. No game credentials or environment variables are required.

Browser tests use installed `/usr/bin/chromium`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; otherwise install Playwright Chromium. Hosted QA uses the supported runner's preinstalled Chrome. Headless software WebGL does not establish physical GPU performance. `JUNCTIONEER_BASE_URL` runs the same browser tests against a deployed URL.

Capture the actual production build (system FFmpeg is needed):

```sh
npm run build
npm run preview -- --port 4173 --strictPort
# In another terminal:
npm run capture
npm run build:review
```

Captures write `docs/production-evidence`, assert real outcomes and record source/artifact hashes. `CAPTURE_BASE_URL` and `CAPTURE_OUTPUT_DIR` can select a different build/output. Original `docs/evidence` is immutable. Review builds verify original and production capture hashes, then bundle the galleries for Pages.

## Source map

- `src/engine.ts`: explicit ports, graph validation, deterministic routing, objective-aware loops, atomic linked controls, exhaustive solver and session lifecycle.
- `src/levels.ts`, `src/levels-production.ts`, `src/authoring.ts`: 15 hand-authored layouts, bilingual metadata and expanded reciprocal graphs.
- `src/scene.ts`: original 3D assemblies, graph-derived rail/train curves, lighting, static batching, station dwell, frame-independent completion, zoom/pan.
- `src/main.ts`, `src/style.css`, `src/i18n.ts`: bilingual responsive accessible gameplay, chapter menu and progression.
- `src/storage.ts`: validated device-local completion/preferences, graceful storage failure.
- `tests/`: simulation, geometry, save, Skip Journey, real-input browser gameplay, all-level progression, responsive/touch/keyboard/axe coverage.

## Standards and preserved checkpoints

Before further implementation, verify/read private `jaychtw/game-development-standards` tag `v1.0.0`, exact SHA `d5c6696efdd6efc028118600466db44aecae0c9b`. Private UGDS content must remain outside this public repository.

`poc-visual-checkpoint-01` preserves the original source and unchanged evidence. `poc-skip-fixed-01` preserves the fixed POC before full production. Historical POC reports are deliberately unchanged; current decisions and production QA supersede their pending statuses. Public publishing/deployment and continuation after the approved visual direction are authorized by the user.
