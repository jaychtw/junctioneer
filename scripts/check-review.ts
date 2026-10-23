import { chromium, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = process.env.REVIEW_CHECK_ORIGIN ?? "http://127.0.0.1:4180";
const base = `${origin}/junctioneer/`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
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
await page.locator("#dispatch").click();
await page.locator("#skip").click();
await expect(page.locator("#outcome h3")).toHaveText("A little roadblock.");
await page.locator("#retry").click();
await page.locator("#map-J1").click();
await page.locator("#language").click();
await page.locator("#dispatch").click();
await page.locator("#skip").click();
await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
const gallery = await page.goto(`${base}review/`);
expect(gallery?.status()).toBe(200);
await expect(
  page.getByRole("heading", { name: "A little railway, ready for review." }),
).toBeVisible();
await expect(page.locator("figure")).toHaveCount(14);
for (const image of await page.locator("figure img").all()) {
  const src = await image.getAttribute("src");
  const result = await page.request.get(`${base}review/${src}`);
  expect(result.status()).toBe(200);
  const original = await readFile(`docs/${src}`);
  expect(
    createHash("sha256")
      .update(await result.body())
      .digest("hex"),
  ).toBe(createHash("sha256").update(original).digest("hex"));
}
await page.locator("video").evaluate((v: HTMLVideoElement) => v.load());
await expect
  .poll(() =>
    page.locator("video").evaluate((v: HTMLVideoElement) => v.readyState),
  )
  .toBeGreaterThanOrEqual(1);
const duration = await page
  .locator("video")
  .evaluate((v: HTMLVideoElement) => v.duration);
expect(duration).toBeGreaterThan(30);
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
  "docs/review-publication-check.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      scope:
        "Local production deployment artifact mounted under /junctioneer/; not a live GitHub Pages check",
      checks: {
        meaningfulGameplay: "failure/retry/zh-TW success",
        galleryImages: 14,
        imageHashes: "all identical to preserved originals",
        videoDurationSeconds: duration,
        layoutWidths: [320, 390, 768, 1440],
        pageErrors: errors,
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS: /junctioneer/ production gameplay; 14 preserved images; playable video metadata; gallery layout at all four widths.",
);
