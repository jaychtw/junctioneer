import { describe, it, expect } from "vitest";
import { levels } from "../src/levels";
import {
  validate,
  simulate,
  solve,
  initialSettings,
  exitPort,
  toggle,
  settingsValid,
  Session,
  type Rail,
  type Level,
  type Settings,
} from "../src/engine";
import { readSave, writeSave, defaults, complete } from "../src/storage";
const clone = <T>(v: T): T => structuredClone(v);
const line = (): Level => ({
  id: "test",
  number: 1,
  chapter: 1,
  size: 5,
  name: ["Test", "測試"],
  hint: ["", ""],
  rationale: "test",
  rails: [
    { id: "start", x: 0, z: 0, ports: ["E"], kind: "terminus", end: "start" },
    { id: "a", x: 1, z: 0, ports: ["W", "E"], kind: "station" },
    { id: "b", x: 2, z: 0, ports: ["W", "E"], kind: "station" },
    { id: "destination", x: 3, z: 0, ports: ["W"], kind: "terminus" },
  ],
  start: { node: "start", exit: "E" },
  stops: ["a", "b"],
  destination: "destination",
  groups: [],
  canonical: {},
});
describe("authored puzzles — exhaustive production-simulator proof", () => {
  for (const l of levels) {
    it(`${l.id}: complete and valid authored geometry`, () =>
      expect(validate(l)).toEqual([]));
    it(`${l.id}: canonical route reaches the correct destination`, () => {
      const run = simulate(l, l.canonical);
      expect(run.reason).toBe("success");
      expect(run.steps.at(-1)?.node).toBe(l.destination);
    });
    it(`${l.id}: exhaustive reachable settings include winners and meaningful failures`, () => {
      const wins = solve(l);
      expect(wins).toContainEqual(l.canonical);
      expect(wins.length).toBe(1);
      const ids = Object.keys(initialSettings(l));
      const wrongs = [];
      for (let mask = 0; mask < 2 ** ids.length; mask++) {
        const s: Settings = {};
        ids.forEach((id, i) => (s[id] = ((mask >> i) & 1) as 0 | 1));
        if (!settingsValid(l, s)) continue;
        const run = simulate(l, s);
        if (run.reason !== "success") wrongs.push(run.reason);
        expect(run.reason).not.toBe("step-limit");
      }
      expect(wrongs.length).toBeGreaterThan(0);
      expect(
        wrongs.every((r) =>
          [
            "blocked",
            "dead-end",
            "disconnected",
            "loop",
            "wrong-order",
            "early-terminal",
          ].includes(r),
        ),
      ).toBe(true);
    });
  }
});
describe("junction semantics", () => {
  const j: Rail = {
    id: "j",
    x: 1,
    z: 1,
    ports: ["W", "N", "E"],
    kind: "junction",
    stem: "W",
    branches: ["N", "E"],
    initial: 0,
  };
  for (const selected of [0, 1] as const) {
    it(`stem to selected branch, selection ${selected}`, () =>
      expect(exitPort(j, "W", { j: selected })).toBe(j.branches![selected]));
    it(`selected branch to stem, selection ${selected}`, () =>
      expect(exitPort(j, j.branches![selected], { j: selected })).toBe("W"));
    it(`unselected branch is blocked, selection ${selected}`, () =>
      expect(
        exitPort(j, j.branches![1 - selected], { j: selected }),
      ).toBeNull());
  }
  it("nonjunction connects bidirectionally", () => {
    const r = line().rails[1];
    expect(exitPort(r, "W", {})).toBe("E");
    expect(exitPort(r, "E", {})).toBe("W");
  });
  it("does not connect an absent incoming port", () =>
    expect(exitPort(line().rails[1], "N", {})).toBeNull());
  it("linked members flip atomically and preserve their initial phase", () => {
    const l = clone(levels[1]);
    l.chapter = 3;
    l.groups = [["J1", "J2"]];
    const s = initialSettings(l),
      next = toggle(l, s, "J2");
    expect(next).toEqual({ J1: 1, J2: 0 });
    expect(s).toEqual({ J1: 0, J2: 1 });
    expect(toggle(l, next, "J1")).toEqual(s);
    expect(settingsValid(l, { J1: 0, J2: 0 })).toBe(false);
    expect(settingsValid(l, next)).toBe(true);
  });
  it("solver enumerates only reachable group assignments", () => {
    const l = clone(levels[1]);
    l.chapter = 3;
    l.groups = [["J1", "J2"]];
    expect(solve(l)).toEqual([{ J1: 1, J2: 0 }]);
  });
  it("invalid settings are rejected", () =>
    expect(() =>
      simulate(levels[0], { J1: 2 } as unknown as Settings),
    ).toThrow());
});
describe("deterministic directed travel and objectives", () => {
  it("visits stops in order with dwell and does not reverse", () => {
    const run = simulate(line(), {});
    expect(run.reason).toBe("success");
    expect(run.steps.map((s) => s.node)).toEqual([
      "start",
      "a",
      "b",
      "destination",
    ]);
    expect(run.steps.filter((s) => s.dwell).map((s) => s.node)).toEqual([
      "a",
      "b",
    ]);
  });
  it("fails wrong-order stop arrival", () => {
    const l = line();
    l.stops = ["b", "a"];
    expect(simulate(l, {}).reason).toBe("wrong-order");
  });
  it("ordinary stations are pass-through", () => {
    const l = line();
    l.stops = [];
    expect(simulate(l, {}).reason).toBe("success");
    expect(simulate(l, {}).steps.some((s) => s.dwell)).toBe(false);
  });
  it("fails premature destination", () => {
    const l = line();
    l.stops = ["a", "b", "missing"];
    expect(simulate(l, {}).reason).toBe("early-terminal");
  });
  it("stops at an obstacle", () => {
    const l = line();
    l.rails[1].blocked = true;
    const run = simulate(l, {});
    expect(run.reason).toBe("blocked");
    expect(run.steps.at(-1)?.node).toBe("a");
  });
  it("stops at an intentional dead end", () => {
    const l = line();
    l.destination = "unreachable";
    expect(simulate(l, {}).reason).toBe("dead-end");
  });
  it("detects broken external connectivity", () => {
    const l = line();
    l.rails.splice(1, 1);
    expect(simulate(l, {}).reason).toBe("disconnected");
  });
  it("detects a directed loop while respecting progress", () => {
    const l = line();
    l.rails = [
      { id: "a", x: 0, z: 0, ports: ["E", "S"], kind: "rail" },
      { id: "b", x: 1, z: 0, ports: ["W", "S"], kind: "station" },
      { id: "c", x: 1, z: 1, ports: ["N", "W"], kind: "rail" },
      { id: "d", x: 0, z: 1, ports: ["E", "N"], kind: "rail" },
    ];
    l.start = { node: "a", exit: "E" };
    l.stops = ["d"];
    l.rails[3].kind = "station";
    const run = simulate(l, {});
    expect(run.reason).toBe("loop");
    expect(run.objectives).toBe(1);
    const visits = run.steps.filter((s) => s.node === "b");
    expect(visits[0].objective).toBe(0);
    expect(visits[1].objective).toBe(1);
    expect(visits.length).toBe(2);
    expect(run.steps.at(-1)?.node).toBe("d");
  });
  it("hard step limit remains a distinct defect", () =>
    expect(simulate(line(), {}, 1).reason).toBe("step-limit"));
  it("is repeatable and copies dispatch settings", () => {
    const s = clone(levels[1].canonical),
      a = simulate(levels[1], s);
    s.J1 = 0;
    expect(a).toEqual(simulate(levels[1], levels[1].canonical));
    expect(a.settings.J1).toBe(1);
  });
});
describe("authored loop with a real escape setting", () => {
  it("validates the physical graph, solves its exit, and detects its wrong-setting cycle", () => {
    const l: Level = {
      id: "loop-proof",
      number: 4,
      chapter: 1,
      size: 5,
      name: ["Loop proof", "迴圈驗證"],
      hint: ["", ""],
      rationale:
        "Fixed reversible cycle with one selectable escape, starting on an internal directed rail.",
      start: { node: "start", exit: "W" },
      stops: [],
      destination: "destination",
      groups: [],
      canonical: { J1: 1 },
      rails: [
        { id: "destination", x: 0, z: 1, ports: ["E"], kind: "terminus" },
        {
          id: "J1",
          x: 1,
          z: 1,
          ports: ["E", "S", "W"],
          kind: "junction",
          stem: "E",
          branches: ["S", "W"],
          initial: 0,
        },
        { id: "start", x: 2, z: 1, ports: ["W", "E"], kind: "rail" },
        { id: "ne", x: 3, z: 1, ports: ["W", "S"], kind: "rail" },
        { id: "se", x: 3, z: 2, ports: ["N", "W"], kind: "rail" },
        { id: "bottom", x: 2, z: 2, ports: ["W", "E"], kind: "rail" },
        { id: "sw", x: 1, z: 2, ports: ["E", "N"], kind: "rail" },
      ],
    };
    expect(validate(l)).toEqual([]);
    expect(solve(l)).toEqual([{ J1: 1 }]);
    expect(simulate(l, { J1: 0 }).reason).toBe("loop");
    expect(simulate(l, l.canonical).reason).toBe("success");
  });
});
describe("planning and dispatch lifecycle", () => {
  it("locks toggles and dispatch during motion", () => {
    const s = new Session(levels[0]);
    s.dispatch();
    expect(s.toggle("J1")).toBe(false);
    expect(s.dispatch()).toBeNull();
    expect(s.settings).toEqual({ J1: 0 });
  });
  it("retry retains choices and has no mid-run reset", () => {
    const s = new Session(levels[0]);
    s.toggle("J1");
    s.dispatch();
    s.reset();
    s.retry();
    expect(s.phase).toBe("running");
    s.finish();
    s.retry();
    expect(s.phase).toBe("planning");
    expect(s.settings).toEqual({ J1: 1 });
    expect(s.run).toBeNull();
  });
  it("resets switches only in planning", () => {
    const s = new Session(levels[0]);
    s.toggle("J1");
    s.reset();
    expect(s.settings).toEqual({ J1: 0 });
  });
});
describe("authoring diagnostics", () => {
  for (const [name, mutate] of [
    ["duplicate IDs", (l: Level) => (l.rails[1].id = l.rails[0].id)],
    [
      "overlapping cells",
      (l: Level) => {
        l.rails[1].x = l.rails[0].x;
        l.rails[1].z = l.rails[0].z;
      },
    ],
    ["outside board", (l: Level) => (l.rails[1].x = 9)],
    ["dangling ports", (l: Level) => (l.rails[1].ports = ["N", "S"])],
    ["missing destination", (l: Level) => (l.destination = "missing")],
    ["invalid stop", (l: Level) => (l.stops = ["missing"])],
    ["invalid start", (l: Level) => (l.start.exit = "N")],
    ["blocked start", (l: Level) => (l.rails[0].blocked = true)],
    [
      "isolated railway",
      (l: Level) => {
        l.size = 7;
        l.rails.push(
          { id: "isolated-a", x: 0, z: 6, ports: ["E"], kind: "terminus" },
          { id: "isolated-b", x: 1, z: 6, ports: ["W"], kind: "terminus" },
        );
      },
    ],
    [
      "invalid junction",
      (l: Level) =>
        (l.rails.find((r) => r.kind === "junction")!.branches = ["E", "E"]),
    ],
    ["linked groups too early", (l: Level) => (l.groups = [["J1", "J2"]])],
    [
      "duplicate group members",
      (l: Level) => {
        l.chapter = 3;
        l.groups = [["J1", "J1"]];
      },
    ],
  ] as const)
    it(`rejects ${name}`, () => {
      const l = clone(levels[1]);
      mutate(l);
      expect(validate(l).length).toBeGreaterThan(0);
    });
});
describe("local saves", () => {
  it("loads defaults when absent", () =>
    expect(readSave({ getItem: () => null })).toEqual({
      value: defaults(),
      warning: false,
    }));
  it("loads validated bilingual preferences and deduplicates progress", () => {
    const value = {
      ...defaults(),
      language: "zh-TW",
      completed: ["L01", "L01"],
    };
    expect(readSave({ getItem: () => JSON.stringify(value) }).value).toEqual({
      ...value,
      completed: ["L01"],
    });
  });
  for (const raw of [
    "{",
    "null",
    '{"version":2}',
    JSON.stringify({ ...defaults(), completed: ["L99"] }),
    JSON.stringify({ ...defaults(), reducedMotion: "yes" }),
    JSON.stringify({ ...defaults(), language: "zh" }),
  ])
    it(`recovers without writing over corrupt data ${raw}`, () => {
      const result = readSave({ getItem: () => raw });
      expect(result.warning).toBe(true);
      expect(result.value).toEqual(defaults());
    });
  it("handles blocked reads and writes", () => {
    expect(
      readSave({
        getItem: () => {
          throw Error("blocked");
        },
      }).warning,
    ).toBe(true);
    expect(
      writeSave(
        {
          setItem: () => {
            throw Error("quota");
          },
        },
        defaults(),
      ),
    ).toBe(false);
  });
  it("replaying a completed level does not advance progress twice", () => {
    const once = complete(defaults(), "L01");
    expect(complete(once, "L01").completed).toEqual(["L01"]);
  });
  it("serializes only the public save schema", () => {
    let raw = "";
    expect(writeSave({ setItem: (_k, v) => (raw = v) }, defaults())).toBe(true);
    expect(JSON.parse(raw)).toEqual(defaults());
  });
});
