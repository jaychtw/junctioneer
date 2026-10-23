import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { levels } from "../../src/levels";
import { controls, initialSettings, toggle, simulate } from "../../src/engine";

async function seed(page: Page, count: number, language = "en") {
  await page.addInitScript(
    ({ completed, language }) => {
      localStorage.setItem(
        "junctioneer.v1",
        JSON.stringify({
          version: 1,
          completed,
          language,
          reducedMotion: false,
        }),
      );
    },
    { completed: levels.slice(0, count).map((l) => l.id), language },
  );
}
async function choose(page: Page, index: number) {
  await page.locator("#levels").click();
  await page.locator(`#menu-levels [data-level="${index}"]`).click();
}
async function setWinning(page: Page, index: number) {
  const level = levels[index];
  let settings = initialSettings(level);
  for (const group of controls(level))
    if (settings[group[0]] !== level.canonical[group[0]]) {
      await page.locator(`#route-${group[0]}`).click();
      settings = toggle(level, settings, group[0]);
    }
}

test("all 15 journeys: real input, unique canonical wins, ordered progress, chapter unlocks, save and final celebration", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator('#level-cards [data-level="1"]')).toBeDisabled();
  for (let i = 0; i < levels.length; i++) {
    await expect(page.locator("#level-title")).toContainText(levels[i].name[0]);
    await expect(page.locator("#chapter-heading")).toContainText(
      String(levels[i].chapter).padStart(2, "0"),
    );
    await setWinning(page, i);
    await page.locator("#dispatch").click();
    await expect(page.locator("#route-J1")).toBeDisabled();
    await page.locator("#skip").click();
    await expect(page.locator("#outcome")).toHaveAttribute(
      "data-objectives",
      String(levels[i].stops.length),
    );
    await expect(page.locator("#ordered-stops .visited")).toHaveCount(
      levels[i].stops.length,
    );
    await expect(page.locator("#outcome h3")).toHaveText(
      i === 14 ? "A whole railway of lovely journeys." : "Right on track.",
    );
    const completed = await page.evaluate(
      () => JSON.parse(localStorage.getItem("junctioneer.v1")!).completed,
    );
    expect(completed).toEqual(levels.slice(0, i + 1).map((l) => l.id));
    if (i < 14) await page.locator("#next").click();
  }
  await page.reload();
  await expect(page.locator("#preview-count")).toContainText("15 / 15");
  await choose(page, 14);
  await page.locator("#language").click();
  await expect(page.locator("#level-title")).toContainText(levels[14].name[1]);
  await setWinning(page, 14);
  await page.locator("#dispatch").click();
  await page.locator("#skip").click();
  await expect(page.locator("#outcome h3")).toHaveText(
    "整座鐵道，滿載美好旅程。",
  );
  expect(errors).toEqual([]);
});

for (const level of levels.slice(3)) {
  test(`${level.id}: initial wrong route, retry retains linked configuration, reset and success`, async ({
    page,
  }) => {
    await seed(page, level.number - 1);
    await page.goto("./");
    await choose(page, level.number - 1);
    const wrong = simulate(level, initialSettings(level));
    expect(wrong.reason).not.toBe("success");
    await page.locator("#dispatch").click();
    await page.locator("#skip").click();
    await expect(page.locator("#world canvas")).toHaveAttribute(
      "data-terminal-reason",
      wrong.reason,
    );
    await expect(page.locator("#outcome")).toHaveAttribute(
      "data-objectives",
      String(wrong.objectives),
    );
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("junctioneer.v1")!).completed,
    );
    expect(saved).not.toContain(level.id);
    await page.locator("#retry").click();
    await setWinning(page, level.number - 1);
    await page.locator("#reset").click();
    await setWinning(page, level.number - 1);
    await page.locator("#dispatch").click();
    await page.locator("#skip").click();
    await expect(page.locator("#outcome h3")).toHaveText(
      level.number === 15
        ? "A whole railway of lovely journeys."
        : "Right on track.",
    );
  });
}
for (const width of [320, 390, 768, 1440])
  for (const language of ["en", "zh-TW"]) {
    test(`production chapters / accessible map targets ${width}px ${language}`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1080 });
      await seed(page, 14, language);
      await page.goto("./");
      for (const index of [4, 9, 14]) {
        await choose(page, index);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const world = await page.locator("#world").boundingBox();
        const boxes = await page.locator(".map-switch").evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return {
              hidden: (n as HTMLElement).hidden,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
            };
          }),
        );
        expect(boxes.every((b) => !b.hidden)).toBe(true);
        for (const b of boxes) {
          expect(b.width).toBeGreaterThanOrEqual(44);
          expect(b.height).toBeGreaterThanOrEqual(44);
          expect(b.x).toBeGreaterThanOrEqual(world!.x);
          expect(b.x + b.width).toBeLessThanOrEqual(world!.x + world!.width);
          expect(b.y + b.height).toBeLessThanOrEqual(world!.y + world!.height);
        }
        for (let a = 0; a < boxes.length; a++)
          for (let b = a + 1; b < boxes.length; b++) {
            const x = boxes[a],
              y = boxes[b];
            expect(
              x.x + x.width <= y.x ||
                y.x + y.width <= x.x ||
                x.y + x.height <= y.y ||
                y.y + y.height <= x.y,
            ).toBe(true);
          }
        if (index === 14) {
          await page.locator("#route-J1").focus();
          await expect(page.locator("#map-J1")).toHaveClass(/linked-preview/);
          await expect(page.locator("#map-J3")).toHaveClass(/linked-preview/);
          await expect(page.locator("#map-J2")).not.toHaveClass(
            /linked-preview/,
          );
        }
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(
          audit.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ).toEqual([]);
      }
    });
  }
test("touch linked pair toggles atomically, opposite directions, language and ordered arrival", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await seed(page, 11);
  await page.goto("./");
  await choose(page, 11);
  await expect(page.locator("#route-J1")).toContainText("North");
  await expect(page.locator("#route-J2")).toContainText("South");
  await page.locator("#map-J1").tap();
  await expect(page.locator("#route-J1")).toContainText("East");
  await expect(page.locator("#route-J2")).toContainText("East");
  await page.locator("#language").tap();
  await page.locator("#dispatch").tap();
  await page.locator("#stage-skip").tap();
  await expect(page.locator("#outcome h3")).toHaveText("順利到站。");
  await expect(page.locator("#ordered-stops .visited")).toHaveCount(1);
  await context.close();
});
test("ordered station dwell and live progress occur before the terminal arrival", async ({
  page,
}) => {
  test.setTimeout(60000);
  await seed(page, 7);
  await page.goto("./");
  await choose(page, 7);
  await setWinning(page, 7);
  await page.locator("#dispatch").click();
  await page.locator("#speed").click();
  await expect(page.locator("#ordered-stops .visited")).toHaveCount(1, {
    timeout: 25000,
  });
  await expect(page.locator("#skip")).toBeVisible();
  await page.locator("#skip").click();
  await expect(page.locator("#ordered-stops .visited")).toHaveCount(2);
});

test("all fifteen mobile boards retain separate, in-bounds 44px controls", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 320, height: 844 });
  await seed(page, 14);
  await page.goto("./");
  for (let i = 0; i < 15; i++) {
    await choose(page, i);
    const board = await page.locator("#world").boundingBox();
    const boxes = await page
      .locator(".map-switch")
      .evaluateAll((ns) =>
        ns.map((n) => ({
          id: n.id,
          hidden: (n as HTMLElement).hidden,
          ...n.getBoundingClientRect().toJSON(),
        })),
      );
    for (const b of boxes) {
      expect(b.hidden, `${levels[i].id} ${b.id}`).toBe(false);
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.x).toBeGreaterThanOrEqual(board!.x);
      expect(b.x + b.width).toBeLessThanOrEqual(board!.x + board!.width);
      expect(b.y + b.height).toBeLessThanOrEqual(board!.y + board!.height);
    }
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) {
        const x = boxes[a],
          y = boxes[b];
        expect(
          x.x + x.width <= y.x ||
            y.x + y.width <= x.x ||
            x.y + x.height <= y.y ||
            y.y + y.height <= x.y,
          `${levels[i].id}: ${x.id}/${y.id}`,
        ).toBe(true);
      }
  }
});
