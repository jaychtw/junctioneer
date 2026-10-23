import "./style.css";
import { levels } from "./levels";
import { Session, validate, type Port, type Reason } from "./engine";
import { copy, type Key } from "./i18n";
import {
  complete,
  defaults,
  readSave,
  writeSave,
  unlockedThrough,
  type Save,
} from "./storage";
import { Diorama } from "./scene";
const icons = {
  train:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 16h14M6 16V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11M5 9h14M9 3v6m6-6v6M8 20l2-4m6 4-2-4M7 21h10"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 7a8 8 0 1 1-1 9M5 3v5h5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg>',
};
let save: Save = defaults(),
  storagePaused = false;
try {
  const loaded = readSave(localStorage);
  save = loaded.value;
  storagePaused = loaded.warning;
} catch {
  storagePaused = true;
}
for (const level of levels) {
  const errors = validate(level);
  if (errors.length) throw new Error(errors.join("; "));
}
let rendererFailed = false;
let index = 0,
  session = new Session(levels[0]),
  scene: Diorama | null = null,
  speed = 1;
let objectiveProgress = 0;
const t = (key: Key): string => copy[save.language][key];
const direction = (port: Port) =>
  t(({ N: "north", E: "east", S: "south", W: "west" } as const)[port]);
const reduced = () =>
  save.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
const persist = () => {
  if (!storagePaused && !writeSave(localStorage, save)) {
    storagePaused = true;
    render();
  }
};
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header class="site-header"><a class="brand" href="./">${icons.train}<span>Junctioneer<span class="brand-sub" data-i="tagline"></span></span></a><div class="header-tools"><span class="workshop" data-i="workshop"></span><button id="language" class="text-button lang-button">繁中</button><button id="help" class="icon-button" data-label="help">?</button><button id="motion" class="icon-button" data-label="motion">${icons.sun}</button></div></header>
<main>
 <div class="page-heading"><div><p class="eyebrow" id="chapter-heading"></p><h1 id="level-title"></h1></div><button id="levels" class="outline-button">${icons.grid}<span data-i="levels"></span></button></div>
 <div class="game-layout">
  <section class="scene-card" aria-labelledby="level-title"><div class="scene-top"><span class="phase"><span class="status-dot"></span><span id="phase"></span></span><span class="scene-meta" data-i="engineStatus"></span></div>
    <div id="world"><div id="switches"></div><div id="landmarks" aria-hidden="true"></div></div>
    <div id="stage-actions" class="stage-actions"></div><div class="view-tools" role="group" data-group="view"><button data-view="out" data-label="zoomOut">−</button><button data-view="home" data-label="viewHome">⌂</button><button data-view="in" data-label="zoomIn">+</button><span class="pan-tools" hidden><button data-view="left" data-label="panLeft">←</button><button data-view="up" data-label="panUp">↑</button><button data-view="down" data-label="panDown">↓</button><button data-view="right" data-label="panRight">→</button></span></div><div class="scene-bottom"><span class="legend"><i></i><span data-i="legend"></span></span><span class="scene-count" id="scene-count"></span></div>
  </section>
  <aside class="planning-panel"><div class="panel-intro"><p class="eyebrow" data-i="ready"></p><h2 id="panel-title" data-i="intro"></h2><p id="hint"></p></div>
    <div class="journey-card"><p class="eyebrow" data-i="goal"></p><div class="stop"><span class="stop-dot"></span><div><span class="small-label" data-i="from"></span><strong data-i="start"></strong></div></div><div class="stop"><span class="stop-dot finish-dot"></span><div><span class="small-label" data-i="to"></span><strong data-i="destination"></strong></div>${icons.train}</div></div>
    <div id="ordered-stops"></div><div id="route-controls"></div>
    <div id="outcome" role="status" aria-live="polite" aria-atomic="true"></div>
    <div id="actions"></div><p class="reassurance" data-i="note"></p>
  </aside>
 </div>
 <div class="below-board"><p data-i="touchHint"></p><details><summary data-i="routeDescription"></summary><p id="route-description"></p></details></div>
 <div class="journey-strip"><div class="strip-heading"><p class="eyebrow" id="strip-title"></p><span id="preview-count"></span></div><div id="level-cards"></div></div>
 <p id="storage-warning" role="status"></p>
</main><footer><span>JUNCTIONEER</span><span data-i="previewFooter"></span><span>01 — 15</span></footer>
<dialog id="menu" aria-labelledby="menu-title"><button class="dialog-close" id="menu-close" data-label="close">×</button><p class="eyebrow" data-i="workshop"></p><h2 id="menu-title" data-i="previewTitle"></h2><p data-i="previewBody"></p><div id="menu-levels"></div></dialog>
<dialog id="instructions" aria-labelledby="help-title"><button class="dialog-close" id="help-close" data-label="close">×</button><p class="eyebrow" data-i="help"></p><h2 id="help-title" data-i="helpTitle"></h2>${[1, 2, 3].map((n) => `<h3 data-i="help${n}"></h3><p data-i="help${n}Body"></p>`).join("")}<p class="keyboard-note" data-i="controls"></p></dialog><div id="announcer" class="sr-only" role="status" aria-live="polite"></div>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
function button(id: string, key: Key, cls = "primary-button", icon = "") {
  return `<button id="${id}" class="${cls}">${icon}<span>${t(key)}</span></button>`;
}
const reasonKeys: Record<Reason, [Key, Key]> = {
  success: ["success", "successBody"],
  blocked: ["blocked", "blockedBody"],
  disconnected: ["disconnected", "disconnectedBody"],
  "dead-end": ["dead", "deadBody"],
  loop: ["loop", "loopBody"],
  "wrong-order": ["wrong", "wrongBody"],
  "early-terminal": ["early", "earlyBody"],
  "step-limit": ["defect", "defectBody"],
};
const chapterName = (n: number) => t(`chapter${n}` as Key);
const localName = (id: string) =>
  session.level.stationNames?.[id]?.[save.language === "en" ? 0 : 1] ??
  (id === session.level.destination ? t("destination") : id);
const groupFor = (id: string) =>
  session.level.groups.findIndex((g) => g.includes(id));
const groupLabel = (id: string) =>
  groupFor(id) < 0
    ? ""
    : `${t("linked")} ${String.fromCharCode(65 + groupFor(id))}`;
function renderObjectives() {
  el("ordered-stops").innerHTML = session.level.stops.length
    ? `<p class="eyebrow">${t("stops")}</p><ol class="objective-list">${session.level.stops.map((id, i) => `<li class="${i < objectiveProgress ? "visited" : ""}"><span class="objective-number">${i < objectiveProgress ? "✓" : i + 1}</span><span>${localName(id)}<small>${t(i < objectiveProgress ? "visited" : "pending")}</small></span></li>`).join("")}</ol>`
    : "";
}
function render() {
  const focusId = document.activeElement?.id;
  for (const id of session.level.stops) {
    const label = document.querySelector<HTMLElement>(
      `[data-landmark="${id}"]`,
    );
    if (label)
      label.textContent = `${session.level.stops.indexOf(id) + 1} · ${localName(id)}`;
  }
  document.documentElement.lang = save.language;
  document.title = `${t("brand")} · ${session.level.name[save.language === "en" ? 0 : 1]}`;
  document
    .querySelectorAll<HTMLElement>("[data-i]")
    .forEach((e) => (e.textContent = t(e.dataset.i as Key)));
  document.querySelectorAll<HTMLElement>("[data-label]").forEach((e) => {
    e.setAttribute("aria-label", t(e.dataset.label as Key));
    e.title = t(e.dataset.label as Key);
  });
  el("chapter-heading").textContent =
    `${t("chapterLabel")} ${String(session.level.chapter).padStart(2, "0")} / ${chapterName(session.level.chapter)}`;
  el("strip-title").textContent = chapterName(session.level.chapter);
  renderObjectives();
  document.querySelector<HTMLElement>(".scene-card")!.dataset.phase =
    session.phase;
  el("level-title").innerHTML =
    `<span class="title-number">${String(session.level.number).padStart(2, "0")}<span> / </span></span>${session.level.name[save.language === "en" ? 0 : 1]}`;
  el("language").textContent = save.language === "en" ? "繁中" : "EN";
  el("language").setAttribute(
    "aria-label",
    `${save.language === "en" ? "繁中" : "EN"} · ${t("language")}`,
  );
  el("motion").setAttribute("aria-pressed", String(save.reducedMotion));
  el("phase").textContent = t(
    session.phase === "planning"
      ? "planning"
      : session.phase === "running"
        ? "running"
        : "result",
  );
  document
    .querySelector(".status-dot")
    ?.classList.toggle("moving", session.phase === "running" && !reduced());
  el("hint").textContent = session.level.hint[save.language === "en" ? 0 : 1];
  el("scene-count").textContent =
    `${t("level")} ${String(session.level.number).padStart(2, "0")} / 15`;
  el("route-description").textContent =
    index < 3
      ? t((["path1", "path2", "path3"] as const)[index])
      : session.level.hint[save.language === "en" ? 0 : 1] +
        " " +
        session.level.rails
          .filter((r) => r.kind === "junction")
          .map(
            (r) =>
              `${t("switch")} ${r.id.slice(1)}: ${t("guideStem")} ${direction(r.stem!)}; ${t("guideBranches")} ${r.branches!.map(direction).join(" / ")}. ${groupLabel(r.id)}`,
          )
          .join(" ");
  const scenic = session.level.rails.filter(
    (r) => r.kind === "station" && !session.level.stops.includes(r.id),
  );
  if (scenic.length)
    el("route-description").textContent +=
      ` ${t("ordinary")}: ${scenic.map((r) => localName(r.id)).join(", ")}.`;
  el("preview-count").textContent =
    `${save.completed.filter((id) => levels.some((l) => l.id === id)).length} / 15 ${t("completed")}`;
  if (rendererFailed) {
    el("world").innerHTML =
      `<div class="render-error"><h2>${t("error")}</h2><p>${t("errorBody")}</p></div>`;
    el("phase").textContent = t("error");
    el("actions").innerHTML = "";
    el("route-controls").innerHTML = "";
    el("stage-actions").innerHTML = "";
    document
      .querySelectorAll<HTMLButtonElement>("[data-view],[data-level]")
      .forEach((b) => (b.disabled = true));
    return;
  }
  const switches = session.level.rails.filter((r) => r.kind === "junction");
  el("route-controls").innerHTML =
    `<p class="eyebrow">${t("choose")}</p>${switches.map((r, i) => `<button id="route-${r.id}" class="route-button" data-switch="${r.id}" ${session.phase !== "planning" ? "disabled" : ""}><span class="switch-number">${i + 1}</span><span><strong>${t("switch")} ${i + 1}${groupFor(r.id) < 0 ? "" : `<em class="group-badge">${String.fromCharCode(65 + groupFor(r.id))}</em>`}</strong><span class="route-value">${groupLabel(r.id) ? groupLabel(r.id) + " · " : ""}${t("selected")}: ${direction(r.branches![session.settings[r.id]])}</span></span><span class="change-icon" aria-hidden="true">⇄</span></button>`).join("")}<p class="route-explainer">${t(session.phase === "running" ? "settingsLocked" : "routeHint") + (session.level.groups.length ? " " + t("linkedHint") : "")}</p>`;
  if (session.phase === "planning")
    el("actions").innerHTML =
      button("dispatch", "dispatch", "primary-button", icons.train) +
      button("reset", "reset", "subtle-button", icons.reset);
  else if (session.phase === "running")
    el("actions").innerHTML =
      button("skip", "skip", "primary-button", icons.arrow) +
      `<button id="speed" class="subtle-button">${t("speed")} · ${speed}×</button>`;
  else
    el("actions").innerHTML =
      (session.run?.reason === "success" && index < levels.length - 1
        ? button("next", "next", "primary-button", icons.arrow)
        : "") +
      button(
        "retry",
        session.run?.reason === "success" ? "replay" : "retry",
        session.run?.reason === "success" && index < levels.length - 1
          ? "subtle-button"
          : "primary-button",
        icons.reset,
      );
  const result = session.phase === "result" && session.run;
  if (result) {
    const keys = reasonKeys[result.reason];
    el("outcome").dataset.objectives = String(result.objectives);
    el("outcome").className =
      `outcome ${result.reason === "success" ? "won" : ""}`;
    el("outcome").innerHTML =
      `<span class="outcome-icon" aria-hidden="true">${result.reason === "success" ? "✓" : "↳"}</span><h3>${t(keys[0])}</h3><p>${t(keys[1])}</p>`;
  } else {
    el("outcome").innerHTML = "";
    delete el("outcome").dataset.objectives;
    el("outcome").className = "";
  }
  el("stage-actions").innerHTML =
    session.phase === "running"
      ? button("stage-skip", "skip", "stage-button", icons.arrow) +
        `<button id="stage-speed" class="stage-button">${t("speed")} · ${speed}×</button>`
      : result
        ? `<strong>${t(reasonKeys[result.reason][0])}</strong>` +
          button(
            result.reason === "success" && index < levels.length - 1
              ? "stage-next"
              : "stage-retry",
            result.reason === "success" && index < levels.length - 1
              ? "next"
              : "retry",
            "stage-button",
            icons.arrow,
          )
        : "";
  if (
    result &&
    result.reason === "success" &&
    save.completed.length === 15 &&
    index === 14
  ) {
    el("outcome").innerHTML =
      `<span class="outcome-icon" aria-hidden="true">✦</span><h3>${t("finalTitle")}</h3><p>${t("finalBody")}</p>`;
    el("outcome").classList.add("all-complete");
  }
  el("storage-warning").textContent = storagePaused ? t("storageWarning") : "";
  const card = (l: (typeof levels)[number], i: number, menu = false) => {
    const locked = i > unlockedThrough(save);
    return `<button class="${menu ? "menu-level" : "level-card"} ${i === index ? "active" : ""}" data-level="${i}" ${locked || session.phase === "running" ? "disabled" : ""} ${i === index ? 'aria-current="step"' : ""}><span class="card-number">${String(l.number).padStart(2, "0")}</span><strong>${l.name[save.language === "en" ? 0 : 1]}</strong><span class="sr-only">${locked ? t("locked") : save.completed.includes(l.id) ? t("completed") : ""}</span><span class="card-state" aria-hidden="true">${save.completed.includes(l.id) ? "✓" : locked ? "○" : "→"}</span></button>`;
  };
  el("level-cards").innerHTML = levels
    .map((l, i) => (l.chapter === session.level.chapter ? card(l, i) : ""))
    .join("");
  el("menu-levels").innerHTML = [1, 2, 3]
    .map(
      (ch) =>
        `<h3>${t("chapterLabel")} ${ch} · ${chapterName(ch)}</h3>${levels.map((l, i) => (l.chapter === ch ? card(l, i, true) : "")).join("")}`,
    )
    .join("");
  document.querySelector("[data-group]")?.setAttribute("aria-label", t("view"));
  el("landmarks")
    .querySelectorAll<HTMLElement>("[data-i]")
    .forEach((e) => (e.textContent = t(e.dataset.i as Key)));
  el("switches")
    .querySelectorAll<HTMLButtonElement>("[data-switch]")
    .forEach((b, i) => {
      b.disabled = session.phase !== "planning";
      b.setAttribute(
        "aria-label",
        `${t("switch")} ${i + 1}${groupFor(switches[i].id) < 0 ? "" : " " + String.fromCharCode(65 + groupFor(switches[i].id))}, ${t("selected")}: ${direction(switches[i].branches![session.settings[switches[i].id]])}. ${groupLabel(switches[i].id)}. ${t("toggle")}`,
      );
    });
  if (focusId && document.activeElement?.id !== focusId)
    document.getElementById(focusId)?.focus({ preventScroll: true });
}
function load(i: number) {
  if (i < 0 || i >= levels.length || i > unlockedThrough(save)) return;
  objectiveProgress = 0;
  index = i;
  session = new Session(levels[i]);
  speed = 1;
  objectiveProgress = 0;
  el("switches").innerHTML = session.level.rails
    .filter((r) => r.kind === "junction")
    .map(
      (r, i) =>
        `<button id="map-${r.id}" class="map-switch" data-switch="${r.id}"><span>${i + 1} ${groupFor(r.id) < 0 ? "" : `<em class="group-badge">${String.fromCharCode(65 + groupFor(r.id))}</em>`}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13V8q0-4 7-5M3 8l7 5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="3" r="1.5" fill="currentColor"/></svg></button>`,
    )
    .join("");
  el("landmarks").innerHTML =
    `<span class="landmark start-tag" data-landmark="start" data-i="startArrow"></span><span class="landmark station-tag" data-landmark="${session.level.destination}" data-i="stationLabel"></span>`;
  for (const [n, id] of session.level.stops.entries())
    el("landmarks").insertAdjacentHTML(
      "beforeend",
      `<span class="landmark objective-tag" data-landmark="${id}">${n + 1} · ${localName(id)}</span>`,
    );
  document.querySelector<HTMLElement>(".pan-tools")!.hidden = true;
  scene?.load(session.level, session.settings);
  render();
  el("announcer").textContent = t("statusPlanning");
}
app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button",
  );
  if (!target || target.disabled) return;
  if (target.dataset.view) {
    const zoom = scene?.changeView(
      target.dataset.view as
        "in" | "out" | "home" | "left" | "right" | "up" | "down",
    );
    document.querySelector<HTMLElement>(".pan-tools")!.hidden =
      !zoom || zoom < 1.1;
    return;
  }
  if (target.dataset.switch) {
    if (session.toggle(target.dataset.switch)) {
      scene?.update(session.settings);
      render();
    }
    return;
  }
  if (target.dataset.level !== undefined) {
    load(Number(target.dataset.level));
    el<HTMLDialogElement>("menu").close();
    return;
  }
  switch (target.id) {
    case "language":
      save.language = save.language === "en" ? "zh-TW" : "en";
      persist();
      render();
      break;
    case "motion":
      save.reducedMotion = !save.reducedMotion;
      persist();
      if (reduced() && session.phase === "running") scene?.skip();
      render();
      break;
    case "help":
      el<HTMLDialogElement>("instructions").showModal();
      break;
    case "help-close":
      el<HTMLDialogElement>("instructions").close();
      break;
    case "levels":
      el<HTMLDialogElement>("menu").showModal();
      break;
    case "menu-close":
      el<HTMLDialogElement>("menu").close();
      break;
    case "reset":
      session.reset();
      scene?.update(session.settings);
      render();
      break;
    case "dispatch": {
      const run = session.dispatch();
      if (!run) break;
      speed = 1;
      objectiveProgress = 0;
      render();
      el("announcer").textContent = t("statusRunning");
      scene?.play(run, reduced(), () => {
        const completed = session.finish();
        if (!completed) return;
        if (completed.reason === "success") {
          save = complete(save, session.level.id);
          persist();
        }
        render();
        el("announcer").textContent = t(reasonKeys[run.reason][0]);
        const narrow = matchMedia("(max-width: 800px)").matches;
        const nextButton = document.getElementById(
          narrow ? "stage-next" : "next",
        );
        if (nextButton) nextButton.focus({ preventScroll: true });
        else
          el(narrow ? "stage-retry" : "retry").focus({ preventScroll: true });
      });
      const narrow = matchMedia("(max-width: 800px)").matches;
      el(narrow ? "stage-skip" : "skip").focus({ preventScroll: true });
      if (narrow)
        document.querySelector(".scene-card")?.scrollIntoView({
          behavior: reduced() ? "instant" : "smooth",
          block: "start",
        });
      break;
    }
    case "stage-skip":
    case "skip":
      scene?.skip();
      break;
    case "stage-speed":
    case "speed":
      speed = speed === 1 ? 2 : 1;
      if (scene) scene.speed = speed;
      render();
      break;
    case "stage-retry":
    case "retry":
      objectiveProgress = 0;
      session.retry();
      scene?.home();
      render();
      el("dispatch").focus({ preventScroll: true });
      break;
    case "stage-next":
    case "next":
      load(index + 1);
      el("dispatch").focus({ preventScroll: true });
      break;
  }
});
const highlightGroup = (event: Event) => {
  const control =
    document.activeElement?.closest<HTMLElement>("[data-switch]") ??
    (event.target as HTMLElement).closest<HTMLElement>("[data-switch]");
  const group = control
    ? (session.level.groups.find((g) => g.includes(control.dataset.switch!)) ??
      [])
    : [];
  document
    .querySelectorAll<HTMLElement>("[data-switch]")
    .forEach((b) =>
      b.classList.toggle("linked-preview", group.includes(b.dataset.switch!)),
    );
};
app.addEventListener("focusin", highlightGroup);
app.addEventListener("pointerover", highlightGroup);
try {
  scene = new Diorama(el("world"));
  scene.onProgress = (progress) => {
    if (objectiveProgress !== progress) {
      objectiveProgress = progress;
      renderObjectives();
    }
  };
  scene.onProject = (positions) => {
    const placed: { x: number; y: number; w: number }[] = [];
    const w = el("world").clientWidth,
      h = el("world").clientHeight;
    const lines: string[] = [];
    for (const [id, pos] of Object.entries(positions).sort(
      (a, b) => a[1].y - b[1].y,
    )) {
      const b = document.getElementById(`map-${id}`);
      if (!b) continue;
      // Find a nearby, in-bounds nonoverlapping 44px control. The leader
      // keeps its physical junction identifiable when dense points separate.
      const width = b.getBoundingClientRect().width || 68;
      const candidates: { x: number; y: number; score: number }[] = [];
      for (let dy = -5; dy <= 5; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const x = Math.max(
            width / 2 + 3,
            Math.min(w - width / 2 - 3, pos.x + dx * (width + 8)),
          );
          const y = pos.y + 30 + dy * 52;
          if (y < 3 || y + 44 > h - 3) continue;
          if (
            placed.some(
              (p) =>
                Math.abs(p.x - x) < (p.w + width) / 2 + 5 &&
                Math.abs(p.y - y) < 49,
            )
          )
            continue;
          candidates.push({
            x,
            y,
            score:
              Math.abs(x - pos.x) * 1.1 +
              Math.abs(y - pos.y - 30) +
              (dy < 0 ? 12 : 0),
          });
        }
      candidates.sort((a, b) => a.score - b.score);
      const best = candidates[0];
      b.hidden = pos.x < 0 || pos.x > w || pos.y < 0 || pos.y > h || !best;
      if (!best) continue;
      b.style.left = `${best.x}px`;
      b.style.top = `${best.y}px`;
      placed.push({ ...best, w: width });
      if (!b.hidden)
        lines.push(
          `<line x1="${pos.x}" y1="${pos.y}" x2="${best.x}" y2="${best.y > pos.y ? best.y : best.y + 44}"/>`,
        );
    }
    let leaders =
      el("switches").querySelector<SVGSVGElement>(".control-leaders");
    if (!leaders) {
      el("switches").insertAdjacentHTML(
        "afterbegin",
        '<svg class="control-leaders" aria-hidden="true"></svg>',
      );
      leaders = el("switches").querySelector(".control-leaders");
    }
    leaders!.setAttribute("viewBox", `0 0 ${w} ${h}`);
    leaders!.innerHTML = lines.join("");
    for (const [id, pos] of Object.entries(positions)) {
      const label = document.querySelector<HTMLElement>(
        `[data-landmark="${id}"]`,
      );
      if (label) {
        label.hidden =
          pos.x < 15 ||
          pos.x > el("world").clientWidth - 15 ||
          pos.y < 0 ||
          pos.y > el("world").clientHeight - 60;
        label.style.left = `${pos.x}px`;
        label.style.top = `${pos.y + (id === "start" ? -33 : 54)}px`;
      }
    }
  };
  load(0);
} catch (error) {
  console.error("Renderer initialization failed", error);
  rendererFailed = true;
  scene?.dispose();
  scene = null;
  render();
}
