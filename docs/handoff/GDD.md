# Junctioneer — Game Design Document

**Version:** 1.0.0 (implementation handoff baseline)  
**Date:** 2026-10-23  
**Status:** Approved mechanics; production acceptance subject to creative-director review  
**Standard:** UGDS v1.0.0, tag `v1.0.0`, commit `d5c6696efdd6efc028118600466db44aecae0c9b`  
**Standard source:** https://github.com/jaychtw/game-development-standards/releases/tag/v1.0.0

## Governing standards and requirements
This GDD defines game-specific creative direction, mechanics, content, and acceptance criteria. For matters not specified or fully detailed here, the applicable pinned UGDS governs. Applicable laws, regulations, and platform policies take precedence. The GDD may strengthen but must not silently waive mandatory UGDS requirements. Apparent conflicts require a documented creative-director decision before affected implementation. **No verified access to pinned UGDS, no implementation.**

## Identity and audience
**Junctioneer** is a cheerful, thoughtful, untimed railway-routing puzzle game for families and general audiences. The player is a miniature railway junction operator: inspect an existing network, configure switches, dispatch one train, and watch the consequences. The player controls the railway **before**, not during, the journey. Foresight over reflexes. Intended sessions: 2–8 minutes per level. Original title and visual assets; avoid copying existing railway games or Thomas & Friends branding. Title availability is not legally cleared; check before public marketing.

## Locked gameplay
- One train active at a time; no timers, competitive scoring, procedural maps, or track rotation/construction.
- All track is pre-laid; only configurable junctions can be toggled in planning mode.
- Each standard junction has **one stem and two branches**, and connects stem to exactly one selected branch. The unselected branch is disconnected. Branch-to-branch travel is never allowed. The selected connection can be traversed either way; the train's movement direction follows its incoming edge, never teleports or reverses implicitly.
- Player may toggle switches repeatedly before Dispatch. Dispatch freezes a snapshot of all settings; no switching during motion.
- Train follows deterministic rail connectivity. Invalid connection, dead end, or obstacle yields a safe stop and intelligible failure. Do not invent crashes or penalties.
- Starting position and heading are defined for each level. No mid-run decisions or randomness.
- Intermediate stations can be traversed without stopping unless an objective requires a stop; for required stops, show a brief automatic dwell then resume. The final destination terminates the run. Wrong-order arrival at a required station or premature arrival at the final terminus is failure; ordinary non-objective stations may be traversed.
- Detect nonproductive loops using repeated **(directed rail-edge / position, fixed switch configuration, objective index)** state, not merely revisited cells. End with explanatory feedback.
- On failure, player can return to planning with prior switch choices retained; unlimited free retries. A replay/speed-up/skip-animation option does not alter outcome. Replay must not advance completion twice.
- Success requires visiting all required stops in order and then the final terminus. Multiple valid configurations are allowed; no uniqueness requirement unless specified for a particular puzzle.
- Players can inspect all decision-relevant geometry, obstacles, start direction, switch states, and objectives before Dispatch. Never hide essential routing information.

## Level scope and progression
**15 handcrafted, verified levels**, three chapters. The board sizes are authoring grids, not visible square-tile graphics.

| Levels | Chapter | Grid | Core curriculum |
|---|---|---|---|
| 1–5 | First Departure | 5×5 | One switch; two switches; blocked shortcut; nonproductive loop; combined exam |
| 6–10 | The Long Way Around | 6×6 | Detours, misleading branches, ordered stops, legitimate track revisits, chapter synthesis |
| 11–15 | Connected Consequences | 7×7 | Mechanically linked switches, cascading consequences, multi-stage objectives, final synthesis |

**Level 1** All Aboard: one junction, one destination, teach selection and dispatch. **2** Two Decisions: two independent junctions. **3** Scenic Route: blocked apparent shortcut; valid detour. **4** Around We Go: incorrect configuration enters detectable loop. **5** Junction Master: branching, obstruction and loop combined.

For levels 6–15, Codex may author the precise layouts and narrative names **within the chapter curriculum**. For all 15, Codex must provide machine-readable authored topology, explicit initial settings, at least one solver-verified winning configuration, failure-path tests, and evidence of progressive complexity. A puzzle may have multiple solutions. Do not ship filler levels or change rules to force a layout to work. If a chapter mechanic proves unsound or unfun, escalate before altering scope. Linked switches are allowed in chapter 3 only: a clearly marked group toggles atomically when any member is selected; each member's branch flips, with all affected junctions highlighted before dispatch. Do not introduce extra controls or hidden linkages.

## Track data and simulation invariants
- Represent rail as an explicit **port/edge graph**, independent of decorative art and underlying cell grid. Each segment/junction exposes ports with physical direction and connected endpoints. Neighboring cells are connected only by explicit compatible ports. Curves are rendered smoothly but have exact logical endpoints.
- A normal non-junction segment has two ports and provides one bidirectional internal connection. A junction has three ports, one stem, two branches, and one bidirectional active internal connection. Stations are two-port pass-through nodes except termini, which have one port. Obstacles mark a blocked edge/segment. Linked junction toggles update all group members in a single planning transaction.
- Every segment and switch must have a visually traceable counterpart. No invisible connectors, overlapping ambiguous tracks, or unexplained turnarounds.
- Dispatch captures initial state. Movement transitions across directed edges and updates objective index when arriving at a required stop in sequence. If no next valid edge, stop and fail; if a repeated full simulation state occurs without new objective progress, fail as loop. Provide a hard step ceiling as a defensive fallback and flag it as a defect if reached on a valid authored level.
- Validate authoring data: no dangling unintentional connections, invalid port geometries, missing station references, duplicate IDs, inaccessible toggles, or unsolvable levels. Deliberate dead ends are permitted when visibly clear.
- The solution checker must simulate exactly the same rules as the player runtime, and enumerate reachable switch configurations where tractable (including linked-group dependencies). Store a canonical solution for regression tests.

## Art and experience
Visually ambitious **cohesive miniature/toy railway diorama**: expressive little locomotive, crafted rails/ties, terrain, bridges/tunnels where mechanically appropriate, recognizable stations, small scenic details, soft dimensional lighting, warm/vibrant palette, polished animation. Readability overrides ornamentation. Fixed elevated 2.5D/isometric-inspired camera is acceptable only if tracks and junctions stay legible and touch-friendly. Original asset pipeline; no reuse of concept stills as gameplay backgrounds, no generic placeholder art passed off as final. Desktop and mobile compositions must be evaluated separately. Selected rail route should be distinguishable by geometry/indicator as well as color. Junction affordances should have enlarged touch areas that do not obscure track. Train travel and success reveal should feel rewarding; failures informative, not punitive.

**Mandatory visual gate:** after functional core POC, build a representative **actual in-engine** polished scene including a switch, curve, station, moving train, obstacle, scenery, and both mobile and desktop layouts. Capture screenshots/video and propose art-production pipeline. **Obtain explicit creative-director approval before mass-producing assets or claiming visual acceptance.** This is a required checkpoint inside a full-implementation assignment, not a reason to downgrade scope.

## UI, accessibility, and localization
- Planning: selectable switches, clear active branch, start arrow, ordered stops, Dispatch, Reset Switches (confirmation only if consequential), level menu, language switch. During run: speed/skip and visual progress, switches locked. Result: reason/success, retry/next.
- Desktop mouse and keyboard; mobile touch. Support 320, 390, 768, and 1440 CSS-pixel viewport widths. If board cannot remain readable on narrow phones, implement tested zoom/pan or focused view rather than shrinking below usability. Avoid hover-only controls. Visible focus and labels, sufficient contrast, non-color cues, target sizes ~44px, reduced-motion support, sound mute if sound is added.
- Centralized **English and Traditional Chinese (zh-TW)** strings from day one, live toggle without state loss, localized chapter/level names, tutorials, all feedback, accessibility labels, errors and preferences.
- Local save: completed/unlocked levels, language, sound/motion preferences where applicable; validate and gracefully handle corrupt/blocked storage. No accounts, telemetry, or remote services without approval.

## Verification and delivery
- Tests for port graph, stem/branch semantics in both directions, linked groups, dispatch lock, dead ends, blocked tracks, loops with objective progress, ordered stations, repeatable simulation, retries, saved state, invalid level data.
- Verify all 15 authored levels solvable under real engine; record canonical winning settings and meaningful wrong-setting outcomes. Assess difficulty via switch count, route length, branches, and observed playtest limitations (automated solvability does not establish fun).
- Browser E2E for real input and complete representative runs in both languages, desktop/touch emulation, 320/390/768/1440 layouts, failure/retry, persistence, language switching, reduced motion, keyboard and accessibility audit.
- Production build, CI, deployment and live URL verification are separate milestones. Do not claim deployment without live gameplay check. Report screenshot/video paths, commit SHA, test commands/counts, known gaps, and human/physical-device testing not performed.
- **Full implementation includes all 15 levels**, not merely a prototype; visual quality requires creative-director acceptance. Deployment to GitHub Pages may be proposed, but repository creation, publishing, or deployment to public visibility requires user authorization if not already granted.

## Explicit exclusions
Multiple trains, real-time switching, track construction/rotation, multiplayer, timed challenges, procedural levels, online leaderboards/accounts. Potential future features, not v1.0 commitments.

## Definition of done
15 playable and validated levels; correct deterministic routing; engaging miniature presentation approved through visual gate; complete bilingual desktop/mobile UX; accessible interactions; reliable saves; automated/browser QA and honest evidence; all applicable UGDS requirements passed or approved exceptions documented. No unapproved material scope or visual downgrade.
