# POC publication and review access

The user authorized source push and POC deployment to make the visual review accessible. Visual production and full v1.0 acceptance remain pending. See [decisions](DECISIONS.md).

## Preserved checkpoint

- Original POC: `95711eaeaf4d43b5cf8e19439f73e5eea629b274`.
- Immutable review tag pushed: [`poc-visual-checkpoint-01`](https://github.com/jaychtw/junctioneer/tree/poc-visual-checkpoint-01).
- All original engine, level, UI, visual, test, screenshot, recording and QA-report files are preserved. Packaging verifies their hashes before creating a review site.
- Original source was pushed successfully to `main`.
- Generated static POC and gallery were also pushed to `gh-pages` at `707b0ba0a5a61e540580d21a1c8918b27bc62c2c`. The repository's configured Pages mode is **GitHub Actions**, so this branch alone does not deploy the configured site.

## Configured publication path

`.github/workflows/pages.yml` builds the app and original-evidence gallery from `main`, runs unit and solver checks, and deploys the generated `dist/` through GitHub Pages. It uses the repository's existing Pages configuration and `github-pages` environment, which permits `main`. No repository visibility or protection policy is changed.

Expected app address: `https://jaychtw.github.io/junctioneer/`.
Expected gallery address: `https://jaychtw.github.io/junctioneer/review/`.

**Current status:** source push and local deployment artifact verified; hosted workflow deployment and live gameplay not yet verified. This record will be updated with actual run evidence.

## Local publication checks

- `npm test`: 57 passed.
- `npm run build:review`: TypeScript + production build + original hash validation passed.
- `npx tsx scripts/check-review.ts`: production app tested under the actual `/junctioneer/` subpath; safe failure, retained retry and zh-TW completion passed; all 14 gallery images returned the original bytes; video metadata loaded; gallery layouts had no horizontal overflow at 320/390/768/1440 widths; no page errors.
- Detailed result: [review-publication-check.json](review-publication-check.json).

The historical QA report is preserved unchanged. Its no-push/no-deployment and pending gameplay-decision statements describe the original checkpoint, and are superseded by this record and the decision log as new milestones complete.
