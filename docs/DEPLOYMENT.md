# Junctioneer publication

The user authorized source pushes and public deployment to the existing `jaychtw/junctioneer` repository. The original POC and its review evidence remain preserved. The user subsequently approved the miniature art direction and authorized full production after the live Skip Journey fix.

- App: https://jaychtw.github.io/junctioneer/
- Review gallery: https://jaychtw.github.io/junctioneer/review/
- Original source: [`poc-visual-checkpoint-01`](https://github.com/jaychtw/junctioneer/tree/poc-visual-checkpoint-01), `95711eaeaf4d43b5cf8e19439f73e5eea629b274`.
- Fixed POC source: [`poc-skip-fixed-01`](https://github.com/jaychtw/junctioneer/tree/poc-skip-fixed-01), `ddaf2d21d3aa4cb789f9103c268ee734c84b1702`.

## Publication path

GitHub Pages uses **GitHub Actions**, not the retained `gh-pages` static backup. Pushes to main trigger Junctioneer QA. After successful QA, Publish Junctioneer builds that exact source SHA, verifies unit/solver checks, packages the game and both evidence galleries, and deploys through the existing `github-pages` environment. No repository visibility or protection changes are required. Review builds verify all original and current capture hashes.

## Verified historical milestones

- Original POC hosted QA: [39964345850](https://github.com/jaychtw/junctioneer/actions/runs/39964345850), 57 unit / 20 browser checks passed.
- Original deployment: [39964617303](https://github.com/jaychtw/junctioneer/actions/runs/39964617303). Actual browser failure/retry/zh-TW success, all 14 original image hashes, video metadata and gallery layouts verified. Evidence: `live-publication-check.json`.
- Shared Skip fix hosted QA: [39971314038](https://github.com/jaychtw/junctioneer/actions/runs/39971314038), 72 unit / 32 browser checks passed.
- Fixed POC deployment: [39971779830](https://github.com/jaychtw/junctioneer/actions/runs/39971779830). All 12 early/midway, success/failure Skip Journey cases passed against the actual live site with future animation/resize callbacks frozen. Evidence: `fix-evidence/live-skip-results.json`. This completed the user's continuation condition before full production.

## Production milestone

**LIVE AND VERIFIED:** source `8bb78b972e8af0bd0f092e9270f4c30aeecfcfe7` passed hosted [QA 39976924448](https://github.com/jaychtw/junctioneer/actions/runs/39976924448) (163 unit / 56 browser), deployed through [39977669754](https://github.com/jaychtw/junctioneer/actions/runs/39977669754), and passed all 14 live browser tests including all-15 progression and all 12 POC Skip cases. A separate public check verified current app bytes, all 57 screenshots, both videos and gallery layouts at all four widths. See [production QA](PRODUCTION-QA.md) and `production-evidence/delivery-summary.json` for exact identities and limitations. Later documentation-only publication retains identical tested application bytes. A build alone is never recorded as deployment; a successful deploy alone is never recorded as a live gameplay check.

## Reproduction

`npm run build:review` builds the game, verifies capture identities and packages both galleries. `JUNCTIONEER_BASE_URL=https://jaychtw.github.io/junctioneer/ npm run test:e2e` exercises actual public gameplay. `REVIEW_CHECK_ORIGIN=https://jaychtw.github.io npx tsx scripts/check-review.ts` verifies original-gallery publication under the repository subpath and writes a separate live report.

TLS verification stays enabled. In this cloud environment, Chromium uses the platform-provided proxy CA in its supported NSS store. No certificate or checksum checks are bypassed. Runtime dependency notices ship in `THIRD-PARTY-NOTICES.txt`. Human/physical-device acceptance limits remain explicit in production QA.
