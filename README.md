# Junctioneer

A cheerful, untimed railway-routing puzzle for English and Traditional Chinese speakers. TypeScript + Three.js, static deployable, with locally bundled code and original runtime-built 3D assets. No accounts, telemetry, audio, or runtime network services.

**Current milestone: functional and visual POC, awaiting explicit creative-director visual approval. This is not the completed v1.0 release.** Three playable authored puzzles are implemented. The full assignment remains 15 levels across three chapters. See [QA evidence](docs/QA-REPORT.md), [visual review](docs/VISUAL-REVIEW.md), and the supplied [handoff](docs/handoff/CODEX-HANDOFF.md).

## Develop

Use the existing checkout; cloud tasks are already isolated. Do not create a worktree unless explicitly requested.

Node 24 (tested: 24.19.0), npm 11 (tested: 11.9.0):

```sh
npm ci --cache /workspace/shared/npm-cache
npm run dev -- --port 5173 --strictPort
```

The absolute cache path is for the cloud environment. On a normal local machine, use `npm ci` and your usual writable npm cache instead. No environment variables or credentials are required to play or test the game.

## Verify

```sh
npm test
npm run validate:levels
npm run build
npm run test:e2e
```

Browser tests use `/usr/bin/chromium` when present; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another system Chromium. If neither is present, install the Playwright-managed browser with `npx playwright install --with-deps chromium`. The cloud machine already has Chromium and needs no browser download. Software WebGL is enabled for headless validation. This does not establish physical-device GPU performance.

The capture script also uses the installed system FFmpeg at `/usr/bin/ffmpeg` to encode Chrome DevTools screencast frames with their original timing. It does not require a separate Playwright FFmpeg download.

Regenerate actual production-build visual evidence:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
# In a second terminal:
npm run capture
```

`CAPTURE_BASE_URL` can select another locally served build. Captures assert meaningful gameplay outcomes and write source/artifact SHA-256 hashes. Do not describe an unexecuted capture as verified.

## Implementation map

- `src/engine.ts`: explicit cardinal ports, graph validation, deterministic simulator, linked-group settings, exhaustive solver, planning/dispatch lifecycle.
- `src/levels.ts`: handcrafted topologies, localized metadata, explicit initial/canonical settings and difficulty rationale.
- `src/scene.ts`: original 3D assemblies, graph-derived rails and curves, dimensional lighting, batched static geometry, train traversal, zoom/pan.
- `src/i18n.ts`: centralized English / zh-TW copy and accessibility text.
- `src/main.ts`, `src/style.css`: live state-preserving localization, mouse/keyboard/touch controls, responsive UI, result/retry flows.
- `src/storage.ts`: validated local progress and preferences; invalid storage is preserved and session-only operation continues.
- `tests/`: engine, authoring and storage unit tests; Chromium gameplay, responsive, input and axe audits.

## Mandatory continuation gates

Read the project handoff before extending this checkpoint. UGDS is private and is deliberately not copied into this repository. Verify access to tag `v1.0.0` in `jaychtw/game-development-standards`, resolving to `d5c6696efdd6efc028118600466db44aecae0c9b`, and fully read it before implementation. See the recorded preflight in the QA report.

Do not scale art production before explicit creative-director approval of the in-engine visual POC. The successful track-revisit curriculum item also needs the documented interpretation resolved; no mechanics change has been assumed. After approval, implement and validate the remaining levels, chapter progression, full-content teaching and final production art. Human puzzle enjoyment, final art acceptance, physical devices, screen readers, and independent first-time players remain separate checks.

A CI workflow is included. No hosted CI run, remote source push, public deployment, or live URL verification is claimed. Public publication requires authorization.
