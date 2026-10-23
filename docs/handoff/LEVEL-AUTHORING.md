# Level authoring and solver contract

This is a technical acceptance contract, not a prescribed implementation language or art style.

## Required level metadata
Each authored level must include stable ID, chapter, board dimensions, descriptive localized name, track/port graph, start directed edge or position plus heading, ordered intermediate objectives, final terminus, switch IDs/stems/branches/initial states, linked-switch groups (if any), visibly blocked edges, at least one winning configuration, tutorial cues if applicable, and difficulty rationale.

## Simulation semantics
- Train has a current directed connection and progresses along active rail connectivity. Do not allow instantaneous reversal or teleportation.
- At a standard three-port junction, incoming stem exits selected branch; incoming selected branch exits stem; incoming unselected branch is blocked. The two branches never connect directly.
- A linked switch group toggles every member once, atomically, during planning. No linked toggles in dispatch.
- Stations that are not the next required stop are traversable unless explicitly a terminus. Arriving at a required stop in sequence advances objective index and resumes after brief dwell. Reaching an out-of-order required stop or final terminus too soon fails. The final terminus succeeds only when all intermediate objectives are complete.
- A simulation state key includes directed graph position, switch snapshot, and objective index. Repeated key means an infinite nonproductive loop; ordinary revisits with changed objective progress are permitted.
- If an authored graph yields ambiguous outgoing travel without an explicitly configured junction, the level data is invalid. Geometry and graph must agree.

## Verification procedure
For every level, run the exact production simulator over its canonical winning configuration. Where feasible enumerate independent switch/group assignments to find all winners, and test representative non-winning assignments. Record solution count or an explicitly bounded search limitation; assert no hidden dependencies. Validate each of the three chapters introduces the intended reasoning challenges, not just extra track length. Human puzzle enjoyment and art acceptance are separate checks.

## Example machine-readable schema (illustrative, not mandatory)
```json
{
  "id": "L01",
  "chapter": 1,
  "board": {"width": 5, "height": 5},
  "start": {"segmentId": "start", "headingPort": "east"},
  "segments": [],
  "junctions": [{"id": "J1", "stem": "west", "branches": ["north", "east"], "selected": 1}],
  "linkedGroups": [],
  "blockedEdges": [],
  "orderedStops": [],
  "finalDestination": "stationA",
  "canonicalWinningSettings": {"J1": 0}
}
```
The empty `segments` array means this is **not a playable level**. Codex must author and verify actual complete graphs. No fictional test results or invented solutions.
