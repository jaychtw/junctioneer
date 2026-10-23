import { chromium, expect, type Page } from "@playwright/test";
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  mkdtemp,
  rm,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { levels } from "../src/levels";
import { controls, initialSettings, toggle } from "../src/engine";
const base = process.env.CAPTURE_BASE_URL || "http://127.0.0.1:4173";
const dir = process.env.CAPTURE_OUTPUT_DIR || "docs/production-evidence";
if (dir.replace(/\/$/, "") === "docs/evidence")
  throw new Error("The original checkpoint is immutable");
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});
const sha = async (file: string) =>
  createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
const sourceHashes: Record<string, string> = {};
for (const file of await readdir("src"))
  sourceHashes[`src/${file}`] = await sha(`src/${file}`);
const buildHashes: Record<string, string> = {};
for (const file of [
  "index.html",
  ...(await readdir("dist/assets")).map((n) => `assets/${n}`),
])
  buildHashes[`dist/${file}`] = await sha(`dist/${file}`);
const errors: string[] = [];
const captures: Record<string, unknown>[] = [];
async function choose(p: Page, i: number) {
  await p.locator("#levels").click();
  await p.locator(`#menu-levels [data-level="${i}"]`).click();
}
async function winning(p: Page, i: number) {
  const l = levels[i];
  let s = initialSettings(l);
  for (const g of controls(l))
    if (s[g[0]] !== l.canonical[g[0]]) {
      await p.locator(`#route-${g[0]}`).click();
      s = toggle(l, s, g[0]);
    }
}
async function capture(p: Page, file: string, state: string) {
  await p.screenshot({ path: `${dir}/${file}`, fullPage: true });
  captures.push({
    file,
    state,
    viewport: p.viewportSize(),
    language: await p.locator("html").getAttribute("lang"),
    renderCalls: await p.locator("canvas").getAttribute("data-render-calls"),
    triangles: await p.locator("canvas").getAttribute("data-render-triangles"),
  });
}
for (const width of [320, 390, 768, 1440]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 1080 },
    isMobile: width < 600,
    hasTouch: width < 600,
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(
    (completed) =>
      localStorage.setItem(
        "junctioneer.v1",
        JSON.stringify({
          version: 1,
          completed,
          language: "en",
          reducedMotion: false,
        }),
      ),
    levels.slice(0, 14).map((l) => l.id),
  );
  await p.goto(base);
  const script = await p.locator('script[type="module"]').getAttribute("src");
  const served = await p.evaluate(async (url) => {
    const r = await fetch(url);
    return Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", await r.arrayBuffer()),
      ),
    )
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
  }, new URL(script!, base).href);
  expect(served).toBe(buildHashes[`dist/assets/${script!.split("/").at(-1)}`]);
  await expect(p.locator("#map-J1")).toBeVisible();
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await p.locator("#language").click();
    for (const i of [2, 7, 14]) {
      await choose(p, i);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await capture(
        p,
        `chapter-${levels[i].chapter}-${width}-${language}.png`,
        `${levels[i].id} planning`,
      );
    }
  }
  if (width === 1440) {
    await p.locator("#language").click();
    for (let i = 0; i < 15; i++) {
      await choose(p, i);
      await winning(p, i);
      await capture(
        p,
        `level-${String(i + 1).padStart(2, "0")}-desktop.png`,
        `${levels[i].id} canonical selected route`,
      );
    }
  }
  if (width === 390) {
    await choose(p, 14);
    await p.locator('[data-view="in"]').click();
    await p.locator('[data-view="in"]').click();
    await p.locator('[data-view="right"]').click();
    await capture(
      p,
      "chapter-3-mobile-inspection.png",
      "L15 zoom and pan, zh-TW",
    );
  }
  await context.close();
}
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
});
const p = await context.newPage();
p.on("pageerror", (e) => errors.push(e.message));
await p.addInitScript(
  (completed) =>
    localStorage.setItem(
      "junctioneer.v1",
      JSON.stringify({
        version: 1,
        completed,
        language: "en",
        reducedMotion: false,
      }),
    ),
  levels.slice(0, 7).map((l) => l.id),
);
await p.goto(base);
await choose(p, 7);
const framesDir = await mkdtemp("/tmp/junctioneer-production-recording-");
const frames: { path: string; timestamp: number }[] = [];
const writes: Promise<void>[] = [];
const cdp = await context.newCDPSession(p);
cdp.on("Page.screencastFrame", (e) => {
  if (e.metadata.timestamp === undefined) throw new Error("Missing timestamp");
  const path = `${framesDir}/${String(frames.length).padStart(6, "0")}.jpg`;
  frames.push({ path, timestamp: e.metadata.timestamp });
  writes.push(writeFile(path, Buffer.from(e.data, "base64")));
  void cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId });
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 85,
  maxWidth: 1440,
  maxHeight: 1080,
  everyNthFrame: 1,
});
await p.locator("#dispatch").click();
await expect(p.locator("#outcome h3")).toHaveText("A station too soon.", {
  timeout: 30000,
});
await capture(p, "ordered-wrong-arrival.png", "L08 wrong-order failure");
await p.locator("#retry").click();
await winning(p, 7);
await p.locator("#dispatch").click();
await p.locator("#speed").click();
await expect(p.locator("#ordered-stops .visited")).toHaveCount(1, {
  timeout: 30000,
});
await capture(
  p,
  "ordered-stop-dwell.png",
  "L08 live first objective, train paused at station",
);
await expect(p.locator("#outcome h3")).toHaveText("Right on track.", {
  timeout: 30000,
});
await capture(
  p,
  "ordered-arrival.png",
  "L08 two ordered stops, successful arrival",
);
await cdp.send("Page.stopScreencast");
await Promise.all(writes);
expect(frames.length).toBeGreaterThan(10);
await writeFile(
  `${framesDir}/frames.txt`,
  frames
    .map(
      (f, i) =>
        `file '${f.path}'\nduration ${Math.max(0.016, (frames[i + 1]?.timestamp ?? f.timestamp + 0.25) - f.timestamp).toFixed(6)}`,
    )
    .join("\n") + `\nfile '${frames.at(-1)!.path}'\n`,
);
await new Promise<void>((resolve, reject) => {
  const encoder = spawn(
    "/usr/bin/ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      `${framesDir}/frames.txt`,
      "-vsync",
      "vfr",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "35",
      "-pix_fmt",
      "yuv420p",
      `${dir}/production-playthrough.webm`,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  encoder.on("error", reject);
  encoder.on("exit", (code) =>
    code === 0 ? resolve() : reject(Error(`ffmpeg ${code}`)),
  );
});
await rm(framesDir, { recursive: true, force: true });
await context.close();
const browserVersion = browser.version();
await browser.close();
expect(errors).toEqual([]);
for (const [file, expected] of Object.entries({
  ...sourceHashes,
  ...buildHashes,
}))
  expect(await sha(file), `Capture input changed: ${file}`).toBe(expected);
const hashes: Record<string, string> = {};
for (const file of [
  ...(await readdir("src")).map((n) => `src/${n}`),
  ...(await readdir(dir))
    .filter((n) => /\.(png|webm)$/.test(n))
    .map((n) => `${dir}/${n}`),
])
  hashes[file] = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
await writeFile(
  `${dir}/capture-manifest.json`,
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      browser: browserVersion,
      build: "Production Vite build served by vite preview",
      captures,
      buildHashes,
      video: "production-playthrough.webm",
      videoMethod:
        "Actual Chrome DevTools screencast frames, original timestamps, system FFmpeg VP9",
      videoFrames: frames.length,
      errors,
      hashes,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${captures.length} production screenshots, ${frames.length} video frames, no page errors.`,
);
