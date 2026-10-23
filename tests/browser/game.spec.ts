import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const ready = async (page: Page) => {
  await page.goto("./");
  await expect(page.locator("#map-J1")).toBeVisible();
  await expect(page.locator("#world canvas")).toBeVisible();
};
const dispatchSkip = async (page: Page) => {
  await page.locator("#dispatch").click();
  await expect(page.locator("#map-J1")).toBeDisabled();
  await page.locator("#skip").click();
  await expect(page.locator("#outcome h3")).toBeVisible();
};
test("desktop real input: failure, retained retry, selected route, win, replay, persisted progress", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await dispatchSkip(page);
  await expect(page.locator("#outcome h3")).toHaveText("A little roadblock.");
  await page.locator("#retry").click();
  await expect(page.locator("#route-J1")).toContainText("North");
  await page.locator("#map-J1").click();
  await expect(page.locator("#route-J1")).toContainText("East");
  await dispatchSkip(page);
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.");
  await expect(page.locator("#level-cards .level-card").first()).toContainText(
    "✓",
  );
  await page.locator("#retry").click();
  await expect(page.locator("#route-J1")).toContainText("East");
  await dispatchSkip(page);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("junctioneer.v1")!),
  );
  expect(saved.completed).toEqual(["L01"]);
  await page.reload();
  await expect(page.locator("#preview-count")).toContainText("1 / 15");
  expect(errors).toEqual([]);
});
test("live bilingual state, motion preference and complete second/third authored journeys", async ({
  page,
}) => {
  await page.addInitScript(
    () =>
      !localStorage.getItem("junctioneer.v1") &&
      localStorage.setItem(
        "junctioneer.v1",
        JSON.stringify({
          version: 1,
          completed: ["L01"],
          language: "en",
          reducedMotion: false,
        }),
      ),
  );
  await ready(page);
  await page.locator('#level-cards [data-level="1"]').click();
  await page.locator("#route-J1").click();
  await page.locator("#route-J2").click();
  await page.locator("#language").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect(page.locator("#route-J1")).toContainText("北");
  await expect(page.locator("#route-J2")).toContainText("北");
  await page.locator("#motion").click();
  await expect(page.locator("#motion")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#dispatch").click();
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
  await page.locator("#next").click();
  await expect(page.locator("#level-title")).toContainText("沿途風景");
  await page.locator("#map-J1").click();
  await page.locator("#dispatch").click();
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
  await page.locator("#language").click();
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.");
  await page.reload();
  await expect(page.locator("#motion")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#preview-count")).toContainText("3 / 15");
});
test("mid-dispatch language toggle preserves locked state and input snapshot", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#map-J1").click();
  await page.locator("#dispatch").click();
  await page.locator("#language").click();
  await expect(page.locator("#route-J1")).toBeDisabled();
  await expect(page.locator("#route-J1")).toContainText("東");
  await page.locator("#skip").click();
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
});
test("full animated path completes without skip and speed-up works", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#route-J1").click();
  await page.locator("#dispatch").click();
  await page.locator("#speed").click();
  await expect(page.locator("#speed")).toHaveText("Speed · 2×");
  // Hosted software WebGL is slower than the local machine. Still require
  // a bounded, unskipped animated journey and the exact winning outcome.
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.", {
    timeout: 20000,
  });
});
test("keyboard gameplay, focus recovery and help dialog", async ({ page }) => {
  await ready(page);
  await page.locator("#route-J1").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#route-J1")).toContainText("East");
  await expect(page.locator("#route-J1")).toBeFocused();
  await page.locator("#dispatch").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#next")).toBeFocused();
  await page.locator("#help").click();
  await expect(page.locator("#instructions")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#instructions")).not.toBeVisible();
  await expect(page.locator("#help")).toBeFocused();
});
test("corrupt save remains untouched and session remains playable", async ({
  page,
}) => {
  await page.addInitScript(
    () =>
      !localStorage.getItem("junctioneer.v1") &&
      localStorage.setItem("junctioneer.v1", "{corrupt"),
  );
  await ready(page);
  await expect(page.locator("#storage-warning")).toBeVisible();
  await page.locator("#language").click();
  await page.locator("#map-J1").click();
  await dispatchSkip(page);
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
  expect(
    await page.evaluate(() => localStorage.getItem("junctioneer.v1")),
  ).toBe("{corrupt");
});
test("blocked storage does not prevent gameplay", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await ready(page);
  await expect(page.locator("#storage-warning")).toBeVisible();
  await page.locator("#map-J1").click();
  await dispatchSkip(page);
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.");
});
for (const width of [320, 390, 768, 1440]) {
  for (const language of ["en", "zh-TW"] as const) {
    test(`layout/accessibility and real route controls: ${width}px ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1080 });
      await ready(page);
      if (language === "zh-TW") await page.locator("#language").click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const switchBox = await page.locator("#map-J1").boundingBox();
      expect(switchBox!.height).toBeGreaterThanOrEqual(44);
      expect(switchBox!.width).toBeGreaterThanOrEqual(44);
      const worldBox = await page.locator("#world").boundingBox();
      expect(switchBox!.x).toBeGreaterThan(worldBox!.x);
      expect(switchBox!.x + switchBox!.width).toBeLessThan(
        worldBox!.x + worldBox!.width,
      );
      await page.locator('[data-view="in"]').click();
      await expect(page.locator(".pan-tools")).toBeVisible();
      await page.locator('[data-view="right"]').click();
      await page.locator('[data-view="left"]').click();
      await page.locator('[data-view="up"]').click();
      await page.locator('[data-view="down"]').click();
      await page.locator('[data-view="home"]').click();
      await expect(page.locator(".pan-tools")).not.toBeVisible();
      await page.locator("#map-J1").click();
      await dispatchSkip(page);
      await expect(page.locator("#outcome h3")).toHaveText(
        language === "en" ? "Right on track." : "順利到站。",
      );
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    });
  }
}
test("touch-emulated phone: map tap, zoom/pan, bilingual completion", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await ready(page);
  await page.locator('[data-view="in"]').tap();
  await page.locator('[data-view="right"]').tap();
  await page.locator('[data-view="home"]').tap();
  await page.locator("#map-J1").tap();
  await page.locator("#language").tap();
  await page.locator("#dispatch").tap();
  await page.locator("#skip").tap();
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
  await context.close();
});
test("system reduced motion completes without prolonged animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.locator("#map-J1").click();
  await page.locator("#dispatch").click();
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.", {
    timeout: 1500,
  });
});
test("mobile two-switch targets stay separate and complete via map taps", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(
    () =>
      !localStorage.getItem("junctioneer.v1") &&
      localStorage.setItem(
        "junctioneer.v1",
        JSON.stringify({
          version: 1,
          completed: ["L01"],
          language: "en",
          reducedMotion: false,
        }),
      ),
  );
  await ready(page);
  await page.locator('#level-cards [data-level="1"]').tap();
  const a = await page.locator("#map-J1").boundingBox(),
    b = await page.locator("#map-J2").boundingBox();
  expect(
    a!.x + a!.width <= b!.x ||
      b!.x + b!.width <= a!.x ||
      a!.y + a!.height <= b!.y ||
      b!.y + b!.height <= a!.y,
  ).toBe(true);
  await page.locator("#map-J1").tap();
  await page.locator("#map-J2").tap();
  await page.locator("#dispatch").tap();
  await expect(page.locator("#stage-skip")).toBeVisible();
  await page.locator("#stage-skip").tap();
  await expect(page.locator("#outcome h3")).toHaveText("Right on track.");
  await expect(page.locator("#stage-next")).toBeFocused();
  await context.close();
});
test("planning and help dialog pass automated accessibility audit", async ({
  page,
}) => {
  await ready(page);
  let results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.locator("#help").click();
  results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
test("unavailable WebGL gives a localized explanation without a broken dispatch button", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("./");
  await expect(page.locator(".render-error")).toContainText(
    "3D rendering is unavailable",
  );
  await expect(page.locator("#dispatch")).toHaveCount(0);
  await page.locator("#language").click();
  await expect(page.locator(".render-error")).toContainText("無法啟用 3D 顯示");
  await expect(page.locator("#dispatch")).toHaveCount(0);
});
