#!/usr/bin/env bash
set -euo pipefail
cd /workspace/junctioneer
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Junctioneer expects Node 24; tested with 24.19.0")'
npm ci --cache /workspace/shared/npm-cache --no-fund
npm test
npm run validate:levels
npm run build
