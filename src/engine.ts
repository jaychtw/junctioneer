export type Port = "N" | "E" | "S" | "W";
export type Settings = Record<string, 0 | 1>;
export interface Rail {
  id: string;
  x: number;
  z: number;
  ports: Port[];
  kind: "rail" | "junction" | "station" | "terminus";
  stem?: Port;
  branches?: [Port, Port];
  initial?: 0 | 1;
  blocked?: boolean;
  end?: "start" | "dead";
}
export interface Level {
  id: string;
  number: number;
  chapter: number;
  size: number;
  name: [string, string];
  hint: [string, string];
  rationale: string;
  rails: Rail[];
  start: { node: string; exit: Port };
  stops: string[];
  destination: string;
  groups: string[][];
  canonical: Settings;
}
export type Reason =
  | "success"
  | "blocked"
  | "disconnected"
  | "dead-end"
  | "loop"
  | "wrong-order"
  | "early-terminal"
  | "step-limit";
export interface Step {
  node: string;
  incoming: Port | null;
  outgoing: Port | null;
  objective: number;
  dwell: boolean;
}
export interface Run {
  reason: Reason;
  steps: Step[];
  settings: Settings;
  objectives: number;
}
export const delta: Record<Port, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};
export const opposite: Record<Port, Port> = { N: "S", E: "W", S: "N", W: "E" };
export const initialSettings = (l: Level): Settings =>
  Object.fromEntries(
    l.rails.filter((r) => r.kind === "junction").map((r) => [r.id, r.initial!]),
  );
export function controls(l: Level): string[][] {
  const grouped = new Set(l.groups.flat());
  return [
    ...l.groups.map((g) => [...g]),
    ...l.rails
      .filter((r) => r.kind === "junction" && !grouped.has(r.id))
      .map((r) => [r.id]),
  ];
}
export function toggle(l: Level, settings: Settings, id: string): Settings {
  if (!l.rails.some((r) => r.id === id && r.kind === "junction"))
    throw new Error(`Unknown switch ${id}`);
  const result = { ...settings };
  for (const key of l.groups.find((g) => g.includes(id)) ?? [id])
    result[key] = result[key] === 0 ? 1 : 0;
  return result;
}
export function settingsValid(l: Level, settings: Settings): boolean {
  const initial = initialSettings(l);
  return (
    Object.keys(settings).length === Object.keys(initial).length &&
    Object.keys(initial).every((k) => settings[k] === 0 || settings[k] === 1) &&
    l.groups.every((g) =>
      g.every(
        (id) =>
          (settings[id] ^ initial[id]) === (settings[g[0]] ^ initial[g[0]]),
      ),
    )
  );
}
export function validate(l: Level): string[] {
  const errors: string[] = [];
  const ids = new Set<string>(),
    cells = new Set<string>();
  for (const r of l.rails) {
    if (ids.has(r.id)) errors.push(`Duplicate ID ${r.id}`);
    ids.add(r.id);
    const cell = `${r.x},${r.z}`;
    if (cells.has(cell)) errors.push(`Overlapping rail ${cell}`);
    cells.add(cell);
    if (
      !Number.isInteger(r.x) ||
      !Number.isInteger(r.z) ||
      r.x < 0 ||
      r.z < 0 ||
      r.x >= l.size ||
      r.z >= l.size
    )
      errors.push(`Outside board ${r.id}`);
    if (
      new Set(r.ports).size !== r.ports.length ||
      r.ports.some((p) => !delta[p])
    )
      errors.push(`Invalid ports ${r.id}`);
    const count = r.kind === "junction" ? 3 : r.kind === "terminus" ? 1 : 2;
    if (r.ports.length !== count) errors.push(`Port count ${r.id}`);
    if (
      r.kind === "junction" &&
      (!r.stem ||
        !r.branches ||
        new Set([r.stem, ...r.branches]).size !== 3 ||
        [r.stem, ...r.branches].some((p) => !r.ports.includes(p)) ||
        (r.initial !== 0 && r.initial !== 1))
    )
      errors.push(`Invalid junction ${r.id}`);
  }
  for (const r of l.rails)
    for (const p of r.ports) {
      if (!delta[p]) continue;
      const [dx, dz] = delta[p];
      const neighbor = l.rails.find(
        (n) => n.x === r.x + dx && n.z === r.z + dz,
      );
      if (!neighbor?.ports.includes(opposite[p]))
        errors.push(`Unconnected port ${r.id}.${p}`);
    }
  const reachable = new Set<string>();
  const pending = l.rails.filter((r) => r.id === l.start.node);
  while (pending.length) {
    const node = pending.pop()!;
    if (reachable.has(node.id)) continue;
    reachable.add(node.id);
    for (const p of node.ports) {
      if (!delta[p]) continue;
      const [dx, dz] = delta[p];
      const neighbor = l.rails.find(
        (r) =>
          r.x === node.x + dx &&
          r.z === node.z + dz &&
          r.ports.includes(opposite[p]),
      );
      if (neighbor && !reachable.has(neighbor.id)) pending.push(neighbor);
    }
  }
  if (l.rails.some((r) => !reachable.has(r.id)))
    errors.push("Disconnected physical railway");
  const start = l.rails.find((r) => r.id === l.start.node);
  if (
    !start?.ports.includes(l.start.exit) ||
    start.blocked ||
    l.start.node === l.destination
  )
    errors.push("Invalid start");
  if (l.rails.find((r) => r.id === l.destination)?.kind !== "terminus")
    errors.push("Invalid destination");
  if (
    l.stops.some(
      (id) => l.rails.find((r) => r.id === id)?.kind !== "station",
    ) ||
    new Set(l.stops).size !== l.stops.length
  )
    errors.push("Invalid stops");
  const members = new Set<string>();
  for (const g of l.groups) {
    if (l.chapter < 3 || g.length < 2) errors.push("Invalid linked group");
    for (const id of g) {
      if (
        members.has(id) ||
        l.rails.find((r) => r.id === id)?.kind !== "junction"
      )
        errors.push(`Invalid group member ${id}`);
      members.add(id);
    }
  }
  if (!settingsValid(l, l.canonical)) errors.push("Invalid canonical settings");
  return errors;
}
export function exitPort(
  r: Rail,
  incoming: Port,
  settings: Settings,
): Port | null {
  if (r.kind === "junction") {
    const branch = r.branches![settings[r.id]];
    return incoming === r.stem ? branch : incoming === branch ? r.stem! : null;
  }
  if (!r.ports.includes(incoming)) return null;
  return r.ports.find((p) => p !== incoming) ?? null;
}
export function simulate(l: Level, settings: Settings, ceiling = 10000): Run {
  if (!settingsValid(l, settings))
    throw new Error("Invalid switch configuration");
  const snapshot = { ...settings };
  let node = l.rails.find((r) => r.id === l.start.node)!;
  let outgoing: Port = l.start.exit;
  let progress = 0;
  const steps: Step[] = [
    { node: node.id, incoming: null, outgoing, objective: 0, dwell: false },
  ];
  const seen = new Set<string>();
  const finish = (reason: Reason): Run => ({
    reason,
    steps,
    settings: snapshot,
    objectives: progress,
  });
  const configKey = Object.keys(snapshot)
    .sort()
    .map((k) => `${k}:${snapshot[k]}`)
    .join(",");
  for (let i = 0; i < ceiling; i++) {
    const [dx, dz] = delta[outgoing];
    const next = l.rails.find(
      (r) => r.x === node.x + dx && r.z === node.z + dz,
    );
    const incoming = opposite[outgoing];
    if (!next?.ports.includes(incoming)) return finish("disconnected");
    node = next;
    const step: Step = {
      node: node.id,
      incoming,
      outgoing: null,
      objective: progress,
      dwell: false,
    };
    steps.push(step);
    if (node.blocked) return finish("blocked");
    if (node.id === l.destination)
      return finish(progress === l.stops.length ? "success" : "early-terminal");
    if (node.id === l.stops[progress]) {
      progress++;
      step.objective = progress;
      step.dwell = true;
    } else if (l.stops.slice(progress).includes(node.id))
      return finish("wrong-order");
    const key = `${node.id}:${incoming}:${configKey}:${progress}`;
    if (seen.has(key)) return finish("loop");
    seen.add(key);
    const exit = exitPort(node, incoming, snapshot);
    if (!exit)
      return finish(node.kind === "junction" ? "disconnected" : "dead-end");
    step.outgoing = exit;
    outgoing = exit;
  }
  return finish("step-limit");
}
export function solve(l: Level): Settings[] {
  const cs = controls(l);
  if (cs.length > 18) throw new Error("Exhaustive solver limit exceeded");
  const wins: Settings[] = [];
  for (let mask = 0; mask < 2 ** cs.length; mask++) {
    let s = initialSettings(l);
    cs.forEach((group, i) => {
      if ((mask >> i) & 1) s = toggle(l, s, group[0]);
    });
    if (simulate(l, s).reason === "success") wins.push(s);
  }
  return wins;
}
export class Session {
  settings: Settings;
  phase: "planning" | "running" | "result" = "planning";
  run: Run | null = null;
  constructor(public level: Level) {
    this.settings = initialSettings(level);
  }
  toggle(id: string): boolean {
    if (this.phase !== "planning") return false;
    this.settings = toggle(this.level, this.settings, id);
    return true;
  }
  reset(): void {
    if (this.phase === "planning") this.settings = initialSettings(this.level);
  }
  dispatch(): Run | null {
    if (this.phase !== "planning") return null;
    this.phase = "running";
    return (this.run = simulate(this.level, this.settings));
  }
  finish(): Run | null {
    if (this.phase !== "running" || !this.run) return null;
    this.phase = "result";
    return this.run;
  }
  retry(): void {
    if (this.phase !== "running") {
      this.phase = "planning";
      this.run = null;
    }
  }
}
