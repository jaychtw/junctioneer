import {
  delta,
  type Level,
  type Rail,
  type Port,
  type Settings,
} from "./engine";
export type Cell = [number, number];
interface Authored {
  number: number;
  size: 5 | 6 | 7;
  name: [string, string];
  hint: [string, string];
  rationale: string;
  // These are hand-authored, axis-aligned polylines, not generated layouts.
  paths: Cell[][];
  start: { at: Cell; exit: Port };
  destination: Cell;
  junctions: {
    id: string;
    at: Cell;
    stem: Port;
    branches: [Port, Port];
    initial: 0 | 1;
  }[];
  stops?: { at: Cell; name: [string, string] }[];
  ordinaryStations?: { at: Cell; name: [string, string] }[];
  blocked?: Cell[];
  deadEnds?: Cell[];
  groups?: string[][];
  canonical: Settings;
}
const key = ([x, z]: Cell) => `${x},${z}`;
export function authored(a: Authored): Level {
  const nodes = new Map<string, { at: Cell; ports: Set<Port> }>();
  const node = (at: Cell) => {
    const k = key(at);
    if (!nodes.has(k)) nodes.set(k, { at, ports: new Set() });
    return nodes.get(k)!;
  };
  for (const path of a.paths)
    for (let i = 1; i < path.length; i++) {
      const [x, z] = path[i - 1],
        [xx, zz] = path[i];
      if ((x !== xx && z !== zz) || (x === xx && z === zz))
        throw new Error(`Invalid authored stroke L${a.number}`);
      const dx = Math.sign(xx - x),
        dz = Math.sign(zz - z),
        distance = Math.abs(xx - x) + Math.abs(zz - z);
      const port = (Object.keys(delta) as Port[]).find(
        (p) => delta[p][0] === dx && delta[p][1] === dz,
      )!;
      const reverse = (Object.keys(delta) as Port[]).find(
        (p) => delta[p][0] === -dx && delta[p][1] === -dz,
      )!;
      for (let j = 0; j < distance; j++) {
        node([x + j * dx, z + j * dz]).ports.add(port);
        node([x + (j + 1) * dx, z + (j + 1) * dz]).ports.add(reverse);
      }
    }
  const stations = [
    ...(a.stops ?? []).map((s, i) => ({ ...s, id: `stop${i + 1}` })),
    ...(a.ordinaryStations ?? []).map((s, i) => ({
      ...s,
      id: `scenic${i + 1}`,
    })),
  ];
  const rails: Rail[] = [];
  for (const {
    at: [x, z],
    ports,
  } of nodes.values()) {
    const at: Cell = [x, z],
      j = a.junctions.find((j) => key(j.at) === key(at));
    const station = stations.find((s) => key(s.at) === key(at));
    const blocked = (a.blocked ?? []).some((b) => key(b) === key(at));
    const isStart = key(at) === key(a.start.at),
      isDestination = key(at) === key(a.destination);
    if (ports.size === 3 && !j)
      throw new Error(`Unspecified junction L${a.number} ${key(at)}`);
    if (
      ports.size === 1 &&
      !isStart &&
      !isDestination &&
      !blocked &&
      !(a.deadEnds ?? []).some((d) => key(d) === key(at))
    )
      throw new Error(`Unintentional end L${a.number} ${key(at)}`);
    rails.push({
      id:
        j?.id ??
        (isDestination
          ? "station"
          : isStart
            ? "start"
            : (station?.id ?? `rail_${x}_${z}`)),
      x,
      z,
      ports: [...ports],
      kind: j
        ? "junction"
        : ports.size === 1
          ? "terminus"
          : station
            ? "station"
            : "rail",
      ...(j ? { stem: j.stem, branches: j.branches, initial: j.initial } : {}),
      ...(blocked ? { blocked: true } : {}),
      ...(ports.size === 1 && !isDestination
        ? ({ end: isStart ? "start" : "dead" } as const)
        : {}),
    });
  }
  rails.sort((a, b) =>
    a.kind === "junction" && b.kind === "junction"
      ? a.id.localeCompare(b.id, undefined, { numeric: true })
      : a.kind === "junction"
        ? -1
        : b.kind === "junction"
          ? 1
          : 0,
  );
  const start = rails.find(
    (r) => r.x === a.start.at[0] && r.z === a.start.at[1],
  )!;
  return {
    id: `L${String(a.number).padStart(2, "0")}`,
    number: a.number,
    chapter: Math.ceil(a.number / 5),
    size: a.size,
    name: a.name,
    hint: a.hint,
    rationale: a.rationale,
    rails,
    start: { node: start.id, exit: a.start.exit },
    stops: (a.stops ?? []).map((_, i) => `stop${i + 1}`),
    stationNames: Object.fromEntries(stations.map((s) => [s.id, s.name])),
    destination: "station",
    groups: a.groups ?? [],
    canonical: a.canonical,
  };
}
