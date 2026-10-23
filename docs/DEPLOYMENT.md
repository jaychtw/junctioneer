# POC publication and review access

The user authorized source push and POC deployment to make the visual review accessible. Visual production and full v1.0 acceptance remain pending. See [decisions](DECISIONS.md).

## Preserved checkpoint

- Original POC: `95711eaeaf4d43b5cf8e19439f73e5eea629b274`.
- Immutable review tag pushed: [`poc-visual-checkpoint-01`](https://github.com/jaychtw/junctioneer/tree/poc-visual-checkpoint-01).
- All original engine, level, UI, visual, test, screenshot, recording and QA-report files are preserved in the checkpoint tag. Game code, visuals and original captured evidence remain unchanged on main. Packaging verifies their hashes before creating a review site.
- Original source was pushed successfully to `main`.
- Generated static POC and gallery were also pushed to `gh-pages` at `707b0ba0a5a61e540580d21a1c8918b27bc62c2c`. The repository's configured Pages mode is **GitHub Actions**, so this branch alone does not deploy the configured site.

## Configured publication path

`.github/workflows/pages.yml` builds the app and original-evidence gallery from `main`, runs unit and solver checks, and deploys the generated `dist/` through GitHub Pages. It uses the repository's existing Pages configuration and `github-pages` environment, which permits `main`. No repository visibility or protection policy is changed.

Expected app address: `https://jaychtw.github.io/junctioneer/`.
Expected gallery address: `https://jaychtw.github.io/junctioneer/review/`.

**Current status: LIVE AND VERIFIED.**

- App: https://jaychtw.github.io/junctioneer/
- Review gallery: https://jaychtw.github.io/junctioneer/review/
- Hosted QA: [39964345850](https://github.com/jaychtw/junctioneer/actions/runs/39964345850), successful on `e77eb72971550f425440de3a18751cae678ab6d6`; 57 unit and 20 browser tests.
- First successful publication: [39964617303](https://github.com/jaychtw/junctioneer/actions/runs/39964617303), build and deploy jobs both successful.
- Live Chromium check: safe failure, retained-setting retry and zh-TW success; all 14 published images matched the preserved originals byte-for-byte; the 31.32-second video loaded; gallery layouts at 320/390/768/1440 had no horizontal overflow; zero page errors. See [live-publication-check.json](live-publication-check.json).
- HTTPS verification remained enabled. Cloud Chromium used the platform-provided proxy CA through its supported NSS trust store; no certificate checks were bypassed.
- Runtime dependency notices are retained in `public/THIRD-PARTY-NOTICES.txt` and are included by Vite in the published artifact. This packaging follow-up does not alter game source, visual assets or evidence.

## Local publication checks

- `npm test`: 57 passed.
- `npm run build:review`: TypeScript + production build + original hash validation passed.
- `npx tsx scripts/check-review.ts`: production app tested under the actual `/junctioneer/` subpath; safe failure, retained retry and zh-TW completion passed; all 14 gallery images returned the original bytes; video metadata loaded; gallery layouts had no horizontal overflow at 320/390/768/1440 widths; no page errors.
- Detailed result: [review-publication-check.json](review-publication-check.json).

The historical QA report is preserved unchanged. Its no-push/no-deployment and pending gameplay-decision statements describe the original checkpoint, and are superseded by this record and the decision log as new milestones complete.

## Hosted QA diagnosis

Initial hosted run [39962260320](https://github.com/jaychtw/junctioneer/actions/runs/39962260320): unit checks, solver checks and build passed; browser QA had 19 passes and one failure. The full-animation success assertion timed out at its default five seconds while the train was still moving on the hosted software renderer. The assertion now permits a bounded 20 seconds for that unskipped journey, retaining the exact success outcome check. No game timing, mechanics, visual assets or original test evidence were changed. The hosted rerun subsequently passed all 20 browser tests, and publication and live verification succeeded as recorded above.

## Reproduction

`npm run build:review` builds the frozen app and evidence gallery. To repeat the live check, use `REVIEW_CHECK_ORIGIN=https://jaychtw.github.io npx tsx scripts/check-review.ts` in a Chromium execution context that trusts the platform CA. This writes a separate live report rather than overwriting the preserved local evidence.

A follow-up publication includes runtime license notices and verification records only. The app and original evidence hashes remain identical to the successfully tested checkpoint. Hosted browser QA need not be repeated for documentation/license-only changes; the publication workflow still runs the unit, solver, build and preservation checks.
