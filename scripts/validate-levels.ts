import { levels } from "../src/levels";
import {
  solve,
  simulate,
  validate,
  controls,
  initialSettings,
  toggle,
} from "../src/engine";
const reports = levels.map((level) => {
  const errors = validate(level);
  if (errors.length) throw new Error(`${level.id}: ${errors.join("; ")}`);
  const solutions = solve(level),
    canonical = simulate(level, level.canonical),
    cs = controls(level);
  if (!solutions.length || canonical.reason !== "success")
    throw new Error(`${level.id}: unsolved`);
  const outcomes: Record<string, number> = {};
  const failures = [];
  for (let mask = 0; mask < 2 ** cs.length; mask++) {
    let settings = initialSettings(level);
    cs.forEach((c, i) => {
      if ((mask >> i) & 1) settings = toggle(level, settings, c[0]);
    });
    const run = simulate(level, settings);
    outcomes[run.reason] = (outcomes[run.reason] ?? 0) + 1;
    if (run.reason === "step-limit") throw new Error("Hard limit reached");
    if (run.reason !== "success")
      failures.push({
        settings,
        reason: run.reason,
        at: run.steps.at(-1)?.node,
      });
  }
  if (!failures.length)
    throw new Error(`${level.id}: no meaningful failure settings`);
  return {
    id: level.id,
    name: level.name[0],
    switches: Object.keys(level.canonical).length,
    independentControls: cs.length,
    settingsChecked: 2 ** cs.length,
    solutionCount: solutions.length,
    canonical: level.canonical,
    route: canonical.steps.map((s) => s.node),
    routeLength: canonical.steps.length,
    outcomes,
    failures,
    difficulty: level.rationale,
  };
});
console.log(
  JSON.stringify(
    {
      scope:
        "Visual-gate POC: three representative levels. Levels 4–15 pending approval and production.",
      levels: reports,
    },
    null,
    2,
  ),
);
