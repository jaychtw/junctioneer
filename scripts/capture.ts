import { chromium, expect } from "@playwright/test";
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
const base = process.env.CAPTURE_BASE_URL || "http://127.0.0.1:4173";
const dir = process.env.CAPTURE_OUTPUT_DIR ?? "docs/production-evidence";
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
const errors: string[] = [];
const captures: {
  file: string;
  width: number;
  language: string;
  state: string;
  renderCalls?: string;
  triangles?: string;
}[] = [];
for (const width of [320, 390, 768, 1440]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 1080 },
    isMobile: width < 600,
    hasTouch: width < 600,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.locator("#world canvas")).toBeVisible();
  await expect(page.locator("#map-J1")).toBeVisible();
  await page.waitForTimeout(300);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("#language").click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const file = `poc-${width}-${language}.png`;
    await page.screenshot({ path: `${dir}/${file}`, fullPage: true });
    const canvas = page.locator("#world canvas");
    captures.push({
      file,
      width,
      language,
      state: "L01 planning",
      renderCalls:
        (await canvas.getAttribute("data-render-calls")) ?? undefined,
      triangles:
        (await canvas.getAttribute("data-render-triangles")) ?? undefined,
    });
  }
  if (width === 390) {
    await page.locator('[data-view="in"]').tap();
    await page.locator('[data-view="in"]').tap();
    const before = await page.locator("#map-J1").boundingBox();
    await page.locator('[data-view="right"]').tap();
    const after = await page.locator("#map-J1").boundingBox();
    expect(Math.abs(before!.x - after!.x)).toBeGreaterThan(5);
    await page.screenshot({
      path: `${dir}/poc-mobile-zoom-zh-TW.png`,
      fullPage: true,
    });
    captures.push({
      file: "poc-mobile-zoom-zh-TW.png",
      width,
      language: "zh-TW",
      state: "1.8× zoom with pan",
    });
  }
  await context.close();
}
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const frameDir = await mkdtemp("/tmp/junctioneer-capture-");
const frames: { path: string; timestamp: number }[] = [];
const writes: Promise<void>[] = [];
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
cdp.on("Page.screencastFrame", (event) => {
  const path = `${frameDir}/${String(frames.length).padStart(6, "0")}.jpg`;
  const timestamp = event.metadata.timestamp;
  if (timestamp === undefined) throw new Error("Missing screencast timestamp");
  frames.push({ path, timestamp });
  writes.push(writeFile(path, Buffer.from(event.data, "base64")));
  void cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId });
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 85,
  maxWidth: 1440,
  maxHeight: 1000,
  everyNthFrame: 1,
});
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await expect(page.locator("#map-J1")).toBeVisible();
await page.locator("#dispatch").click();
await page.waitForTimeout(2100);
await page.screenshot({
  path: `${dir}/poc-desktop-moving.png`,
  fullPage: true,
});
captures.push({
  file: "poc-desktop-moving.png",
  width: 1440,
  language: "en",
  state: "L01 train moving, switches locked",
});
await expect(page.locator("#outcome h3")).toHaveText("A little roadblock.", {
  timeout: 20000,
});
await page.screenshot({
  path: `${dir}/poc-desktop-blocked.png`,
  fullPage: true,
});
captures.push({
  file: "poc-desktop-blocked.png",
  width: 1440,
  language: "en",
  state: "L01 blocked siding, safe stop",
});
await page.locator("#retry").click();
await page.locator("#map-J1").click();
await page.locator("#dispatch").click();
await expect(page.locator("#outcome h3")).toHaveText("Right on track.", {
  timeout: 20000,
});
await page.screenshot({
  path: `${dir}/poc-desktop-arrival.png`,
  fullPage: true,
});
captures.push({
  file: "poc-desktop-arrival.png",
  width: 1440,
  language: "en",
  state: "L01 successful station arrival",
});
await page.locator("#next").click();
await page.locator("#route-J1").click();
await page.locator("#route-J2").click();
await page.screenshot({
  path: `${dir}/poc-desktop-two-switches.png`,
  fullPage: true,
});
captures.push({
  file: "poc-desktop-two-switches.png",
  width: 1440,
  language: "en",
  state: "L02 selected route through two junctions",
});
await page.locator('#level-cards [data-level="2"]').click();
await page.locator("#map-J1").click();
await page.screenshot({
  path: `${dir}/poc-desktop-scenic.png`,
  fullPage: true,
});
captures.push({
  file: "poc-desktop-scenic.png",
  width: 1440,
  language: "en",
  state: "L03 selected detour, visibly blocked shortcut",
});
await cdp.send("Page.stopScreencast");
await Promise.all(writes);
await context.close();
expect(frames.length).toBeGreaterThan(10);
const list =
  frames
    .map(
      (f, i) =>
        `file '${f.path}'\nduration ${Math.max(0.016, (frames[i + 1]?.timestamp ?? f.timestamp + 0.25) - f.timestamp).toFixed(6)}`,
    )
    .join("\n") + `\nfile '${frames.at(-1)!.path}'\n`;
await writeFile(`${frameDir}/frames.txt`, list);
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
      `${frameDir}/frames.txt`,
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
      `${dir}/poc-playthrough.webm`,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  encoder.on("error", reject);
  encoder.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
  );
});
await rm(frameDir, { recursive: true, force: true });
await browser.close();
expect(errors).toEqual([]);
// Hash source and capture files so review evidence identifies the exact artifact.
const hashes: Record<string, string> = {};
for (const file of [
  ...(await readdir("src")).map((n) => `src/${n}`),
  ...(await readdir(dir))
    .filter((n) => n.endsWith(".png") || n.endsWith(".webm"))
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
      browser: browser.version(),
      build: "Production Vite build served by vite preview",
      captures,
      video: "poc-playthrough.webm",
      videoMethod:
        "Chrome DevTools screencast frames with original timestamps, encoded with installed system FFmpeg",
      videoFrames: frames.length,
      errors,
      hashes,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${captures.length} production screenshots and animated failure/retry/success recording; no page errors.`,
);
