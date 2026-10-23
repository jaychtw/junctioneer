import { test, expect } from "@playwright/test";
import { levels } from "../../src/levels";
import { simulate, initialSettings } from "../../src/engine";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { freeze: false, draws: 0 };
    Object.assign(window, { railTest: state });
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) =>
      raf.call(window, (t) => {
        if (!state.freeze) cb(t);
      });
    const Observer = window.ResizeObserver;
    window.ResizeObserver = class extends Observer {
      constructor(cb: ResizeObserverCallback) {
        super((entries, o) => {
          if (!state.freeze) cb(entries, o);
        });
      }
    };
    for (const name of [
      "drawElements",
      "drawArrays",
      "drawElementsInstanced",
      "drawArraysInstanced",
    ] as const) {
      const original = WebGL2RenderingContext.prototype[name];
      Object.defineProperty(WebGL2RenderingContext.prototype, name, {
        value: function (...args: unknown[]) {
          state.draws++;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
});
for (const level of levels.slice(0, 3))
  for (const winning of [true, false])
    for (const timing of ["early", "midway"] as const) {
      test(`${level.id} ${winning ? "success" : "failure"} ${timing}: skip finishes, paints, persists without another frame`, async ({
        page,
      }) => {
        await page.goto("./");
        await page
          .locator(`#level-cards [data-level="${level.number - 1}"]`)
          .click();
        const settings = winning ? level.canonical : initialSettings(level);
        for (const [id, value] of Object.entries(settings))
          if (initialSettings(level)[id] !== value)
            await page.locator(`#route-${id}`).click();
        const run = simulate(level, settings);
        await page.locator("#dispatch").click();
        const canvas = page.locator("#world canvas");
        if (timing === "midway")
          await expect
            .poll(
              async () =>
                Number(await canvas.getAttribute("data-journey-progress")),
              { timeout: 20000 },
            )
            .toBeGreaterThan(0.4);
        const before = await page.evaluate(() => {
          const s = (
            window as unknown as {
              railTest: { freeze: boolean; draws: number };
            }
          ).railTest;
          s.freeze = true;
          return s.draws;
        });
        await page.locator("#skip").click();
        await expect(page.locator("#outcome h3")).toHaveText(
          run.reason === "success"
            ? "Right on track."
            : run.reason === "blocked"
              ? "A little roadblock."
              : "The end of this line.",
        );
        const after = await page.evaluate(
          () =>
            (window as unknown as { railTest: { draws: number } }).railTest
              .draws,
        );
        expect(after).toBeGreaterThan(before);
        const last = level.rails.find((r) => r.id === run.steps.at(-1)!.node)!,
          offset = (level.size - 1) / 2;
        expect(Number(await canvas.getAttribute("data-train-x"))).toBeCloseTo(
          last.x - offset,
          10,
        );
        expect(Number(await canvas.getAttribute("data-train-z"))).toBeCloseTo(
          last.z - offset,
          10,
        );
        await expect(canvas).toHaveAttribute("data-journey-progress", "1");
        await expect(page.locator("#outcome")).toHaveAttribute(
          "data-objectives",
          String(run.objectives),
        );
        const saved = await page.evaluate(() => {
          const raw = localStorage.getItem("junctioneer.v1");
          return raw ? JSON.parse(raw).completed : [];
        });
        expect(saved.includes(level.id)).toBe(winning);
        expect(await page.locator("#skip").count()).toBe(0);
      });
    }
