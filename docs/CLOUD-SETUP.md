# Cloud environment setup

The saved environment draft installs the pinned lockfile with Node 24, uses the existing checkout, and runs unit, authored-level and build checks. Runtime startup instructions now reflect the approved full-game production scope and both immutable POC tags. No application secrets or background services are required.

Draft save returned `status: saved`, `requires_publish: true`. The environment configuration must be published through its review/publish UI to become the reusable environment version; saving the draft is not publication. This is independent of GitHub Pages publishing the game. Existing supported package-manager network rules were retained, along with the GitHub API, public app and hosted-log domains used for verification.

Live processes are not restored from retained files. Start or reuse port 5173 for development and port 4173 for production preview. See README.md for commands. Do not regenerate the original checkpoint evidence when preparing the environment.
