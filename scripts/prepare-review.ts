import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

// Publish the original review evidence verbatim. Never regenerate or overwrite it here.
const original = "95711eaeaf4d43b5cf8e19439f73e5eea629b274";
const manifest = JSON.parse(
  await readFile("docs/evidence/capture-manifest.json", "utf8"),
);
for (const [file, expected] of Object.entries(manifest.hashes)) {
  const actual = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  if (actual !== expected)
    throw new Error(`Preserved checkpoint hash mismatch: ${file}`);
}
await mkdir("dist/review", { recursive: true });
await cp("docs/evidence", "dist/review/evidence", { recursive: true });
await cp("docs/QA-REPORT.md", "dist/review/ORIGINAL-QA-REPORT.md");
await cp("docs/DECISIONS.md", "dist/review/DECISIONS.md");
const cards = [
  ["poc-1440-en.png", "Desktop · English"],
  ["poc-390-zh-TW.png", "Phone · 繁體中文"],
  ["poc-desktop-two-switches.png", "Two junctions · selected route"],
  ["poc-desktop-moving.png", "Train moving · switches locked"],
  ["poc-desktop-blocked.png", "Safe stop · closed siding"],
  ["poc-desktop-arrival.png", "Successful arrival"],
  ["poc-desktop-scenic.png", "Scenic detour"],
  ["poc-mobile-zoom-zh-TW.png", "Phone · zoom and pan"],
  ["poc-320-en.png", "320 px · English"],
  ["poc-320-zh-TW.png", "320 px · 繁體中文"],
  ["poc-390-en.png", "390 px · English"],
  ["poc-768-en.png", "768 px · English"],
  ["poc-768-zh-TW.png", "768 px · 繁體中文"],
  ["poc-1440-zh-TW.png", "1440 px · 繁體中文"],
];
await writeFile(
  "dist/review/index.html",
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Junctioneer — checkpoint review</title>
<style>body{margin:0;background:#f6f3ea;color:#25483d;font:16px/1.6 system-ui,sans-serif}main{max-width:1150px;margin:auto;padding:28px 20px}h1{font:38px/1.2 Georgia,serif}h2{font-size:20px}a{color:#285a46;text-underline-offset:3px}a:focus-visible{outline:3px solid #a55e18;outline-offset:4px}.banner{border:1px solid #b7c5ad;background:#e8eddf;border-radius:12px;padding:18px;margin:24px 0}.links{display:flex;gap:18px;flex-wrap:wrap}.play{display:inline-block;padding:12px 20px;background:#285a46;color:white;border-radius:8px}video{width:100%;max-height:80vh;background:#e8eddf;border-radius:12px}figure{margin:0;border:1px solid #d3dac9;border-radius:10px;background:#fffdf7;overflow:hidden}figcaption{padding:14px;font-weight:600}figure a{display:block}figure img{display:block;width:100%;height:440px;object-fit:contain;object-position:top;background:#e8eddf}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}code{overflow-wrap:anywhere;font-size:12px}small{font-size:13px}summary{cursor:pointer}details{margin-top:20px}@media(max-width:650px){.grid{grid-template-columns:1fr}h1{font-size:32px}figure img{height:430px}}</style></head><body><main>
<p>JUNCTIONEER · PRESERVED CHECKPOINT 01 / 保留的視覺檢查點</p><h1>A little railway, ready for review.</h1>
<div class="banner"><strong>Visual approval pending / 視覺方向尚待核准</strong><p>This is the preserved three-level POC, not the full v1.0 release. No production art has been scaled. Gameplay decision: track revisits are allowed when valid; only repeated complete simulation states indicate a nonproductive loop.</p><p lang="zh-TW">這是保留的三關概念驗證，並非完整 v1.0。視覺方向仍待核准，尚未擴大美術製作。</p></div>
<nav class="links" aria-label="Review resources"><a class="play" href="../">Play the POC / 試玩</a><a href="https://github.com/jaychtw/junctioneer/tree/poc-visual-checkpoint-01">Original source checkpoint</a><a href="ORIGINAL-QA-REPORT.md">Original QA report</a><a href="DECISIONS.md">Review decisions</a></nav>
<h2>Actual in-engine playthrough / 實際遊玩錄影</h2><p>A 31-second recording showing a blocked route, retained-setting retry and successful station arrival. Original evidence, without regeneration.</p>
<video controls playsinline preload="metadata" aria-label="Junctioneer failure, retry and successful arrival recording"><source src="evidence/poc-playthrough.webm" type="video/webm"><a href="evidence/poc-playthrough.webm">Download the playthrough</a></video><p><a href="evidence/poc-playthrough.webm">Open or download recording</a></p>
<h2>Desktop and mobile screenshots / 桌機與行動版畫面</h2><p>Open any image to inspect it at full resolution. Screenshots preserve the original checkpoint.</p><div class="grid">${cards.map(([file, label]) => `<figure><figcaption>${label}</figcaption><a href="evidence/${file}"><img src="evidence/${file}" alt="Junctioneer POC: ${label}" loading="lazy"></a></figure>`).join("")}</div>
<details><summary>Evidence identity / 證據識別</summary><p>Original source commit: <code>${original}</code>. The original QA report is historical: its pending gameplay-decision and deployment statements are superseded by the current decision/deployment records. Physical-device and independent-player tests remain unperformed.</p><a href="evidence/capture-manifest.json">Original source and artifact SHA-256 hashes</a></details>
</main></body></html>`,
);
await writeFile("dist/.nojekyll", "");
console.log(
  "Prepared review gallery; preserved source and evidence hashes verified.",
);
