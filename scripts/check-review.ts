import { chromium, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = process.env.REVIEW_CHECK_ORIGIN ?? "http://127.0.0.1:4180";
const base = `${origin}/junctioneer/`;
const local = ["127.0.0.1", "localhost"].includes(new URL(origin).hostname);
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const response = await page.goto(base);
expect(response?.status()).toBe(200);
await expect(page.locator("#map-J1")).toBeVisible();
const appScript = await page
  .locator('script[type="module"]')
  .getAttribute("src");
async function digestURL(url: string) {
  return page.evaluate(async (url) => {
    const r = await fetch(url);
    return {
      status: r.status,
      sha256: Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", await r.arrayBuffer()),
        ),
      )
        .map((v) => v.toString(16).padStart(2, "0"))
        .join(""),
    };
  }, url);
}
const scriptURL = new URL(appScript!, base);
const scriptHash = await digestURL(scriptURL.href);
expect(scriptHash.status).toBe(200);
expect(scriptHash.sha256).toBe(
  createHash("sha256")
    .update(
      await readFile(`dist/assets/${scriptURL.pathname.split("/").at(-1)}`),
    )
    .digest("hex"),
);
await page.locator("#dispatch").click();
await page.locator("#skip").click();
await expect(page.locator("#outcome h3")).toHaveText("A little roadblock.");
await page.locator("#retry").click();
await page.locator("#map-J1").click();
await page.locator("#language").click();
await page.locator("#dispatch").click();
await page.locator("#skip").click();
await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
await page.locator("#levels").click();
await expect(page.locator("#menu-levels [data-level]")).toHaveCount(15);
await page.keyboard.press("Escape");
const gallery = await page.goto(`${base}review/`);
expect(gallery?.status()).toBe(200);
await expect(
  page.getByRole("heading", { name: "Fifteen little railway journeys." }),
).toBeVisible();
const manifest = JSON.parse(
  await readFile("docs/production-evidence/capture-manifest.json", "utf8"),
);
const expectedImages = 14 + manifest.captures.length;
await expect(page.locator("figure")).toHaveCount(expectedImages);
for (const img of await page.locator("figure img").all()) {
  const src = (await img.getAttribute("src"))!;
  const actual = await digestURL(`${base}review/${src}`);
  const file = src.startsWith("production/")
    ? src.replace("production/", "production-evidence/")
    : src;
  expect(actual.status).toBe(200);
  expect(actual.sha256).toBe(
    createHash("sha256")
      .update(await readFile(`docs/${file}`))
      .digest("hex"),
  );
}
const videos = [];
for (const video of await page.locator("video").all()) {
  await video.evaluate((v: HTMLVideoElement) => v.load());
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThanOrEqual(1);
  const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);
  expect(duration).toBeGreaterThan(10);
  videos.push(duration);
}
for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
expect(errors).toEqual([]);
await browser.close();
await writeFile(
  `docs/production-evidence/${local ? "local" : "live"}-publication-check.json`,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      scope: local
        ? "Local production artifact under /junctioneer/"
        : "Live GitHub Pages gameplay and both galleries",
      url: base,
      checks: {
        appScript,
        appScriptSHA256: scriptHash.sha256,
        meaningfulGameplay: "failure/retry/zh-TW success; 15 menu entries",
        galleryImages: expectedImages,
        imageHashes:
          "all match preserved originals and current production captures",
        videoDurationsSeconds: videos,
        layoutWidths: [320, 390, 768, 1440],
        pageErrors: errors,
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `PASS: current application bytes, real gameplay, ${expectedImages} image hashes, both videos and four gallery widths.`,
);
