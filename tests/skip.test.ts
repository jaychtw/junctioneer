import { describe, expect, it, vi } from "vitest";
import * as T from "three";
import { Diorama } from "../src/scene";
import { Session, initialSettings, simulate, type Level } from "../src/engine";
import { levels } from "../src/levels";

function harness(level: Level, winning: boolean) {
  const session = new Session(level);
  session.settings = winning ? { ...level.canonical } : initialSettings(level);
  const run = session.dispatch()!;
  const train = new T.Group();
  const paints: number[][] = [];
  const order: string[] = [];
  const done = vi.fn(() => {
    order.push("commit");
    return session.finish();
  });
  // Exercise the production scene lifecycle without constructing a GPU/context.
  const scene = Object.create(Diorama.prototype) as Diorama;
  Object.assign(scene, {
    level,
    train,
    active: true,
    disposed: false,
    animation: null,
    scene: new T.Scene(),
    camera: new T.OrthographicCamera(),
    renderer: {
      domElement: { dataset: {} },
      info: { render: { calls: 1, triangles: 1 } },
      render: () => {
        paints.push(train.position.toArray());
        order.push("paint");
      },
    },
  });
  scene.play(run, false, done);
  const advance = (seconds: number) =>
    Reflect.get(scene, "animate").call(scene, seconds);
  const duration = () => Reflect.get(scene, "animation").duration as number;
  const terminal = level.rails.find((r) => r.id === run.steps.at(-1)!.node)!;
  const offset = (level.size - 1) / 2;
  return {
    scene,
    session,
    run,
    train,
    paints,
    done,
    order,
    advance,
    duration,
    expected: [terminal.x - offset, 0.115, terminal.z - offset],
  };
}
for (const level of levels)
  for (const winning of [true, false])
    for (const timing of ["early", "midway"] as const) {
      it(`${level.id}: ${timing} skip commits and paints exact ${winning ? "success" : "failure"} independently of future frames`, () => {
        const h = harness(level, winning);
        if (timing === "midway") h.advance(h.duration() * 0.5);
        h.order.length = 0;
        h.scene.skip();
        expect(h.order).toEqual(["paint", "commit"]);
        h.train.position
          .toArray()
          .forEach((v, i) => expect(v).toBeCloseTo(h.expected[i], 12));
        expect(h.paints.at(-1)).toEqual(h.train.position.toArray());
        expect(h.session.phase).toBe("result");
        expect(h.session.run?.reason).toBe(h.run.reason);
        expect(h.done).toHaveBeenCalledTimes(1);
        h.scene.skip();
        h.advance(100);
        expect(h.done).toHaveBeenCalledTimes(1);
        expect(h.session.finish()).toBeNull();
      });
    }
it("skip and natural completion produce exactly the same terminal pose and result", () => {
  for (const level of levels) {
    const skipped = harness(level, true),
      natural = harness(level, true);
    skipped.scene.skip();
    natural.advance(natural.duration() + 0.01);
    expect(skipped.train.position.toArray()).toEqual(
      natural.train.position.toArray(),
    );
    expect(skipped.session.run).toEqual(natural.session.run);
    expect(natural.order).toEqual(["paint", "commit"]);
  }
});
it("skip keeps all ordered objective progression from the production simulator", () => {
  const level = structuredClone(levels[2]);
  level.stops = ["rise", "ridge"];
  for (const r of level.rails)
    if (level.stops.includes(r.id)) r.kind = "station";
  const h = harness(level, true);
  h.scene.skip();
  expect(h.session.run?.objectives).toBe(2);
  expect(h.session.run?.reason).toBe("success");
  expect(h.session.run).toEqual(simulate(level, level.canonical));
});
it("terminal placement does not depend on subtracting floating-point lengths", () => {
  const h = harness(levels[2], true);
  const a = Reflect.get(h.scene, "animation");
  a.total *= 1 + Number.EPSILON;
  h.scene.skip();
  h.train.position
    .toArray()
    .forEach((v, i) => expect(v).toBeCloseTo(h.expected[i], 12));
  expect(h.done).toHaveBeenCalledTimes(1);
});
