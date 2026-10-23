import { describe, it, expect } from "vitest";
import { levels } from "../src/levels";
import { defaults, complete, unlockedThrough } from "../src/storage";
import { simulate, initialSettings, controls, toggle } from "../src/engine";
import { railCurve, travelCurve } from "../src/scene";
import { copy } from "../src/i18n";
describe("production progression", () => {
  it("opens exactly the next journey through all three chapters, caps at 15", () => {
    let save = defaults();
    expect(unlockedThrough(save)).toBe(0);
    for (let i = 0; i < 15; i++) {
      save = complete(save, levels[i].id);
      expect(unlockedThrough(save)).toBe(Math.min(i + 1, 14));
    }
    expect(save.completed.length).toBe(15);
  });
  it("preserves nonsequential POC saves", () => {
    expect(unlockedThrough({ ...defaults(), completed: ["L03"] })).toBe(3);
  });
  it("contains three complete authored chapters with localized teaching", () => {
    for (const chapter of [1, 2, 3])
      expect(levels.filter((l) => l.chapter === chapter)).toHaveLength(5);
    expect(Object.keys(copy.en).sort()).toEqual(
      Object.keys(copy["zh-TW"]).sort(),
    );
    for (const l of levels) {
      expect(l.hint.every(Boolean)).toBe(true);
      expect(l.name.every(Boolean)).toBe(true);
    }
  });
  it("authored complete-state cycles retain progress and allow rail revisits", () => {
    const l = levels[8],
      run = simulate(l, initialSettings(l));
    expect(run.reason).toBe("loop");
    expect(run.objectives).toBe(1);
    const visits = run.steps.filter((s) => s.node === "scenic1");
    expect(visits.length).toBeGreaterThan(1);
    expect(visits[0].objective).toBe(0);
    expect(visits[1].objective).toBe(1);
  });
  it("every linked production member has exactly the same atomic reachable action", () => {
    for (const l of levels.slice(10))
      for (const group of l.groups)
        for (const id of group) {
          expect(toggle(l, initialSettings(l), id)).toEqual(
            toggle(l, initialSettings(l), group[0]),
          );
        }
  });
  it("production includes wrong-order, premature final, disconnected, works, dead-end and full-state loop cases", () => {
    const reasons = new Set<string>();
    for (const l of levels) {
      const cs = controls(l);
      for (let m = 0; m < 2 ** cs.length; m++) {
        let s = initialSettings(l);
        cs.forEach((g, i) => {
          if ((m >> i) & 1) s = toggle(l, s, g[0]);
        });
        reasons.add(simulate(l, s).reason);
      }
    }
    expect([...reasons].sort()).toEqual(
      [
        "success",
        "wrong-order",
        "early-terminal",
        "disconnected",
        "blocked",
        "dead-end",
        "loop",
      ].sort(),
    );
  });
});
it("every interrupted curved arrival remains on the actual rendered rail", () => {
  for (const l of levels)
    for (const r of l.rails.filter((r) => r.ports.length === 2))
      for (const incoming of r.ports) {
        const other = r.ports.find((p) => p !== incoming)!;
        const visible = railCurve(r, incoming, other),
          arrival = travelCurve(r, incoming, null, initialSettings(l));
        for (const t of [0, 0.25, 0.5, 0.75, 1])
          expect(
            arrival.getPoint(t).distanceTo(visible.getPoint(t * 0.5)),
          ).toBeLessThan(1e-12);
      }
});
