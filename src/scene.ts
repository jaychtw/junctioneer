import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  delta,
  type Level,
  type Rail,
  type Port,
  type Settings,
  type Run,
  type Step,
} from "./engine";

const colors = {
  grass: "#adc49a",
  side: "#819b72",
  cream: "#eadfc5",
  ballast: "#c5bba4",
  timber: "#755d47",
  steel: "#545e59",
  shine: "#aeb4a8",
  teal: "#24564e",
  amber: "#e9ad45",
  leaf: "#527d5a",
  trunk: "#806047",
};
const materialCache = new Map<string, T.MeshStandardMaterial>();
const material = (color: string, roughness = 0.85, metalness = 0) => {
  const key = `${color}:${roughness}:${metalness}`;
  if (!materialCache.has(key))
    materialCache.set(
      key,
      new T.MeshStandardMaterial({ color, roughness, metalness }),
    );
  return materialCache.get(key)!;
};
const mat = Object.fromEntries(
  Object.entries(colors).map(([k, v]) => [k, material(v)]),
);
mat.steel = material(colors.steel, 0.42, 0.55);
mat.shine = material(colors.shine, 0.35, 0.6);
function mesh(
  g: T.BufferGeometry,
  m: T.Material,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
): T.Mesh {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function box(
  p: T.Object3D,
  w: number,
  h: number,
  d: number,
  m: T.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  return mesh(new T.BoxGeometry(w, h, d), m, p, x, y, z);
}
function cylinder(
  p: T.Object3D,
  rt: number,
  rb: number,
  h: number,
  m: T.Material,
  x = 0,
  y = 0,
  z = 0,
  sides = 16,
) {
  return mesh(new T.CylinderGeometry(rt, rb, h, sides), m, p, x, y, z);
}
function roundedRect(w: number, h: number, r: number): T.Shape {
  const s = new T.Shape(),
    x = -w / 2,
    y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slab(
  parent: T.Object3D,
  w: number,
  d: number,
  height: number,
  m: T.Material,
  y: number,
) {
  const o = mesh(
    new T.ExtrudeGeometry(roundedRect(w, d, 0.24), {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      curveSegments: 12,
    }),
    m,
    parent,
    0,
    y,
    0,
  );
  o.rotation.x = -Math.PI / 2;
  return o;
}
const vport = (p: Port, scale = 0.5) =>
  new T.Vector3(delta[p][0] * scale, 0.035, delta[p][1] * scale);
export function railCurve(
  r: Rail,
  a: Port | null,
  b: Port | null,
): T.Curve<T.Vector3> {
  const start = a ? vport(a) : new T.Vector3(0, 0.035, 0),
    end = b ? vport(b) : new T.Vector3(0, 0.035, 0);
  if (
    !a ||
    !b ||
    (delta[a][0] === -delta[b][0] && delta[a][1] === -delta[b][1])
  )
    return new T.LineCurve3(start, end);
  return new T.QuadraticBezierCurve3(start, new T.Vector3(0, 0.035, 0), end);
}
function ribbon(
  curve: T.Curve<T.Vector3>,
  width: number,
  y: number,
  m: T.Material,
  parent: T.Object3D,
  offset = 0,
) {
  const vertices: number[] = [],
    indices: number[] = [],
    count = 32;
  for (let i = 0; i <= count; i++) {
    const pt = curve.getPoint(i / count),
      tangent = curve.getTangent(i / count).normalize(),
      n = new T.Vector3(-tangent.z, 0, tangent.x);
    for (const side of [-1, 1]) {
      const p = pt.clone().addScaledVector(n, offset + (side * width) / 2);
      vertices.push(p.x, y, p.z);
    }
    if (i < count) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(geo, m, parent);
}
function track(
  parent: T.Object3D,
  curve: T.Curve<T.Vector3>,
  active: boolean,
  junction: boolean,
) {
  ribbon(curve, 0.39, 0.008, mat.ballast, parent);
  const count = Math.max(3, Math.round(curve.getLength() * 10));
  for (let i = 0; i <= count; i++) {
    const t = (i + 0.25) / (count + 1),
      p = curve.getPoint(t),
      tangent = curve.getTangent(t);
    const tie = box(parent, 0.35, 0.033, 0.065, mat.timber, p.x, 0.035, p.z);
    tie.rotation.y = Math.atan2(tangent.x, tangent.z);
    for (const offset of [-0.098, 0.098]) {
      const n = new T.Vector3(-tangent.z, 0, tangent.x).normalize();
      const bolt = cylinder(
        parent,
        0.012,
        0.012,
        0.012,
        mat.steel,
        p.x + n.x * offset,
        0.06,
        p.z + n.z * offset,
        6,
      );
      bolt.castShadow = false;
    }
  }
  for (const o of [-0.105, 0.105]) {
    ribbon(curve, 0.027, 0.068, mat.steel, parent, o);
    ribbon(curve, 0.012, 0.073, mat.shine, parent, o);
  }
  if (active && junction) ribbon(curve, 0.028, 0.076, mat.amber, parent);
}
function tree(
  parent: T.Object3D,
  x: number,
  z: number,
  scale: number,
  variant = 0,
) {
  const group = new T.Group();
  group.position.set(x, 0.015, z);
  group.scale.setScalar(scale);
  parent.add(group);
  cylinder(group, 0.04, 0.065, 0.45, mat.trunk, 0, 0.23, 0, 7);
  if (variant % 2 === 0) {
    for (let i = 0; i < 3; i++) {
      const m = material(["#4e7555", "#5a845c", "#6a9164"][i]);
      const o = mesh(
        new T.ConeGeometry(0.29 - i * 0.055, 0.4, 9),
        m,
        group,
        0,
        0.5 + i * 0.19,
        0,
      );
      o.rotation.y = i * 0.31;
    }
  } else {
    const m = material("#729461");
    mesh(new T.IcosahedronGeometry(0.32, 1), m, group, 0, 0.61, 0);
    mesh(new T.IcosahedronGeometry(0.23, 1), m, group, 0.16, 0.44, 0.03);
    mesh(new T.IcosahedronGeometry(0.22, 1), m, group, -0.12, 0.46, -0.08);
  }
}
function bush(parent: T.Object3D, x: number, z: number, s: number) {
  for (let i = 0; i < 3; i++)
    mesh(
      new T.IcosahedronGeometry(s * (0.6 + i * 0.15), 1),
      mat.leaf,
      parent,
      x + i * s * 0.6,
      0.07 + i * 0.018,
      z + (i % 2) * s * 0.3,
    );
}
function fence(
  parent: T.Object3D,
  x: number,
  z: number,
  angle: number,
  length: number,
) {
  const g = new T.Group();
  g.position.set(x, 0.01, z);
  g.rotation.y = angle;
  parent.add(g);
  const paint = material("#e8dfc7");
  for (let i = 0; i <= 4; i++) {
    box(g, 0.035, 0.25, 0.04, paint, -length / 2 + (i * length) / 4, 0.12, 0);
    mesh(
      new T.ConeGeometry(0.032, 0.05, 4),
      paint,
      g,
      -length / 2 + (i * length) / 4,
      0.27,
      0,
    ).rotation.y = Math.PI / 4;
  }
  for (const y of [0.1, 0.2]) box(g, length, 0.025, 0.022, paint, 0, y, 0.02);
}
function flowers(parent: T.Object3D, x: number, z: number) {
  for (let i = 0; i < 7; i++) {
    const dx = Math.sin(i * 12.7) * 0.14,
      dz = Math.cos(i * 9.4) * 0.12;
    cylinder(parent, 0.007, 0.007, 0.08, mat.leaf, x + dx, 0.05, z + dz, 5);
    mesh(
      new T.SphereGeometry(0.025, 6, 4),
      material(i % 2 ? "#e9c061" : "#f1e1c0"),
      parent,
      x + dx,
      0.1,
      z + dz,
    );
  }
}
function station(parent: T.Object3D, r: Rail) {
  const g = new T.Group();
  parent.add(g);
  const off =
    r.ports[0] === "W" || r.ports[0] === "E"
      ? new T.Vector3(0, 0, 0.52)
      : new T.Vector3(0.52, 0, 0);
  g.position.copy(off);
  if (off.x) g.rotation.y = Math.PI / 2;
  box(g, 0.94, 0.06, 0.44, mat.cream, 0, 0.03, -0.07);
  for (let i = 0; i < 11; i++)
    box(
      g,
      0.075,
      0.008,
      0.42,
      material("#b7aa8e"),
      -0.43 + i * 0.085,
      0.065,
      -0.07,
    );
  box(g, 0.64, 0.41, 0.38, material("#edc878"), 0, 0.28, 0.08);
  for (let i = 0; i < 6; i++)
    box(
      g,
      0.65,
      0.014,
      0.009,
      material("#ddb668"),
      0,
      0.11 + i * 0.065,
      -0.116,
    );
  for (const x of [-0.2, 0.2]) {
    box(g, 0.15, 0.19, 0.012, mat.cream, x, 0.31, -0.12);
    box(g, 0.11, 0.15, 0.018, mat.teal, x, 0.31, -0.13);
    box(g, 0.008, 0.15, 0.02, mat.cream, x, 0.31, -0.14);
    box(g, 0.12, 0.008, 0.02, mat.cream, x, 0.31, -0.14);
  }
  box(g, 0.115, 0.27, 0.015, mat.teal, 0, 0.22, -0.125);
  cylinder(g, 0.012, 0.012, 0.01, mat.amber, 0.035, 0.24, -0.14, 6).rotation.x =
    Math.PI / 2;
  // Twin pitched roof halves with raised seams and eaves.
  for (const side of [-1, 1]) {
    const roof = box(
      g,
      0.77,
      0.035,
      0.31,
      mat.teal,
      0,
      0.55,
      0.08 + side * 0.12,
    );
    roof.rotation.x = side * 0.58;
    for (let i = 0; i < 6; i++) {
      const seam = box(
        g,
        0.009,
        0.012,
        0.31,
        material("#386a60"),
        -0.34 + i * 0.135,
        0.575,
        0.08 + side * 0.12,
      );
      seam.rotation.x = side * 0.58;
    }
  }
  box(g, 0.8, 0.03, 0.025, mat.teal, 0, 0.637, 0.08);
  box(g, 0.065, 0.24, 0.07, material("#a07657"), 0.2, 0.62, 0.13);
  box(g, 0.1, 0.025, 0.1, mat.cream, 0.2, 0.74, 0.13);
  for (const x of [-0.39, 0.39])
    cylinder(g, 0.015, 0.02, 0.35, mat.teal, x, 0.24, -0.22, 8);
  box(g, 0.86, 0.035, 0.24, mat.teal, 0, 0.43, -0.22);
  // Unlettered station clock: bilingual name is in accessible HTML.
  cylinder(g, 0.055, 0.055, 0.018, mat.cream, 0, 0.49, -0.235, 24).rotation.x =
    Math.PI / 2;
  box(g, 0.006, 0.04, 0.02, mat.teal, 0, 0.5, -0.25);
  box(g, 0.028, 0.006, 0.02, mat.teal, 0.012, 0.49, -0.25);
  for (const x of [-0.48, 0.48]) {
    box(g, 0.13, 0.07, 0.13, mat.timber, x, 0.07, 0.15);
    flowers(g, x, 0.15);
  }
}
function obstacle(parent: T.Object3D, r: Rail) {
  const g = new T.Group();
  parent.add(g);
  if (r.ports[0] === "N" || r.ports[0] === "S") g.rotation.y = Math.PI / 2;
  const orange = material("#ce7544");
  for (const x of [-0.18, 0.18]) {
    box(g, 0.04, 0.22, 0.045, mat.timber, x, 0.13, 0);
    box(g, 0.15, 0.035, 0.13, mat.timber, x, 0.03, 0);
  }
  box(g, 0.47, 0.12, 0.035, mat.cream, 0, 0.22, 0);
  for (let i = -2; i <= 2; i++) {
    const stripe = box(g, 0.05, 0.12, 0.04, orange, i * 0.09, 0.22, -0.002);
    stripe.rotation.z = -0.32;
  }
  cylinder(g, 0.045, 0.065, 0.11, orange, 0.27, 0.065, 0.18, 12);
  cylinder(g, 0.08, 0.08, 0.015, mat.cream, 0.27, 0.01, 0.18, 12);
}
function locomotive(parent: T.Object3D): T.Group {
  const g = new T.Group();
  parent.add(g);
  const red = material("#c66643"),
    dark = material("#293d38"),
    gold = material("#d6ad5c", 0.4, 0.35),
    glass = material("#b9d1bf");
  // Model faces +Z. Six separately modelled wheels, rims, axle caps and connecting rods.
  box(g, 0.28, 0.055, 0.58, red, 0, 0.145, 0);
  for (const z of [-0.2, 0, 0.2])
    for (const x of [-0.153, 0.153]) {
      const wheel = cylinder(g, 0.085, 0.085, 0.035, dark, x, 0.1, z, 18);
      wheel.rotation.z = Math.PI / 2;
      const rim = cylinder(g, 0.063, 0.063, 0.038, mat.steel, x, 0.1, z, 18);
      rim.rotation.z = Math.PI / 2;
      const hub = cylinder(g, 0.024, 0.024, 0.041, gold, x, 0.1, z, 12);
      hub.rotation.z = Math.PI / 2;
      box(g, 0.025, 0.018, 0.42, gold, x * 1.12, 0.1, 0);
    }
  const boiler = cylinder(g, 0.12, 0.12, 0.32, mat.teal, 0, 0.27, 0.09, 24);
  boiler.rotation.x = Math.PI / 2;
  for (const z of [-0.04, 0.17]) {
    const band = cylinder(g, 0.124, 0.124, 0.022, gold, 0, 0.27, z, 24);
    band.rotation.x = Math.PI / 2;
  }
  const front = cylinder(g, 0.106, 0.106, 0.015, dark, 0, 0.27, 0.26, 24);
  front.rotation.x = Math.PI / 2;
  cylinder(g, 0.048, 0.031, 0.12, dark, 0, 0.44, 0.16, 16);
  cylinder(g, 0.058, 0.058, 0.025, gold, 0, 0.5, 0.16, 16);
  cylinder(g, 0.042, 0.045, 0.065, gold, 0, 0.41, -0.015, 16);
  box(g, 0.27, 0.27, 0.23, mat.teal, 0, 0.31, -0.19);
  for (const x of [-0.139, 0.139]) {
    box(g, 0.012, 0.12, 0.13, gold, x, 0.365, -0.2);
    box(g, 0.016, 0.09, 0.1, glass, x * 1.015, 0.365, -0.2);
  }
  box(g, 0.31, 0.035, 0.29, dark, 0, 0.46, -0.2);
  box(g, 0.17, 0.12, 0.015, gold, 0, 0.36, -0.311);
  box(g, 0.135, 0.085, 0.02, glass, 0, 0.36, -0.32);
  box(g, 0.33, 0.025, 0.1, dark, 0, 0.12, 0.31);
  cylinder(g, 0.026, 0.026, 0.027, gold, 0, 0.34, 0.28, 16).rotation.x =
    Math.PI / 2;
  cylinder(
    g,
    0.02,
    0.02,
    0.031,
    material("#fff0c2"),
    0,
    0.34,
    0.3,
    16,
  ).rotation.x = Math.PI / 2;
  return g;
}

export class Diorama {
  readonly renderer: T.WebGLRenderer;
  readonly scene = new T.Scene();
  readonly camera = new T.OrthographicCamera();
  readonly root = new T.Group();
  private railway = new T.Group();
  private indicators = new T.Group();
  private train!: T.Group;
  private level!: Level;
  private settings!: Settings;
  private animation: {
    run: Run;
    elapsed: number;
    duration: number;
    done: () => void;
    paths: {
      curve: T.Curve<T.Vector3>;
      offset: T.Vector3;
      length: number;
      dwell: boolean;
    }[];
    total: number;
  } | null = null;
  private observer: ResizeObserver;
  private last = 0;
  private disposed = false;
  private active = true;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private raf = 0;
  speed = 1;
  onProject:
    ((positions: Record<string, { x: number; y: number }>) => void) | null =
    null;
  constructor(private container: HTMLElement) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    container.prepend(this.renderer.domElement);
    this.scene.add(this.root);
    const ambient = new T.HemisphereLight("#fff5db", "#71826a", 2.5);
    this.scene.add(ambient);
    const sun = new T.DirectionalLight("#fff1d4", 4.5);
    sun.position.set(-3, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.00015;
    this.scene.add(sun);
    const fill = new T.DirectionalLight("#dce8f2", 1.2);
    fill.position.set(5, 3, -5);
    this.scene.add(fill);
    const floor = mesh(
      new T.PlaneGeometry(200, 200),
      new T.ShadowMaterial({ opacity: 0.13 }),
      this.scene,
      0,
      -0.43,
      0,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    this.camera.position.set(7.5, 10, 11);
    this.camera.lookAt(0, 0, 0);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.tick(0);
    document.addEventListener("visibilitychange", this.visibility);
  }
  private visibility = () => {
    this.active = !document.hidden;
    this.last = 0;
  };
  private resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    // Frame complete physical slab, with room for tree and roof silhouettes.
    const viewW = 9.5,
      viewH = 7.3;
    const ch = Math.max(viewH, viewW / aspect),
      cw = ch * aspect;
    this.camera.left = -cw / 2;
    this.camera.right = cw / 2;
    this.camera.top = ch / 2;
    this.camera.bottom = -ch / 2;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.project();
    this.render();
  }
  private clear(group: T.Group) {
    for (const child of [...group.children]) {
      child.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      group.remove(child);
    }
  }
  load(level: Level, settings: Settings) {
    this.animation = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.setView();
    this.level = level;
    this.settings = settings;
    this.clear(this.root);
    this.railway = new T.Group();
    this.indicators = new T.Group();
    this.root.add(this.railway, this.indicators);
    slab(this.root, 6.45, 6.45, 0.16, mat.cream, -0.36);
    slab(this.root, 6.39, 6.39, 0.18, mat.side, -0.2);
    slab(this.root, 6.4, 6.4, 0.035, mat.grass, -0.035);
    const offset = (level.size - 1) / 2;
    for (const r of level.rails) {
      const g = new T.Group();
      g.position.set(r.x - offset, 0, r.z - offset);
      this.railway.add(g);
      if (r.kind === "junction")
        r.branches!.forEach((b) =>
          track(g, railCurve(r, r.stem!, b), false, true),
        );
      else track(g, railCurve(r, r.ports[0], r.ports[1] ?? null), false, false);
      if (r.id === level.destination) station(g, r);
      else if (r.blocked) obstacle(g, r);
      else if (r.kind === "terminus" && r.end === "dead") {
        box(g, 0.34, 0.045, 0.04, mat.timber, 0, 0.12, 0);
        for (const x of [-0.12, 0.12])
          box(g, 0.04, 0.14, 0.05, mat.timber, x, 0.07, 0);
      }
    }
    // Hand-composed scenery perimeter: never covers decision-relevant rail.
    [
      [-2.65, -2.3, 0.95],
      [-2.1, -2.55, 0.75],
      [-1.35, -2.65, 1.05],
      [0.0, -2.65, 0.74],
      [1, -2.7, 0.85],
      [-2.65, -1.1, 0.65],
      [-2.55, 1.5, 0.65],
      [2.65, -2.45, 0.78],
      [2.65, 2.6, 0.68],
    ].forEach(([x, z, s], i) => tree(this.root, x, z, s, i));
    for (const r of [
      { x: -1.6, z: 1.9 },
      { x: -0.7, z: 2.5 },
      { x: 0.8, z: 2.65 },
      { x: -2.6, z: 0.1 },
    ]) {
      bush(this.root, r.x, r.z, 0.12);
      flowers(this.root, r.x + 0.2, r.z + 0.1);
    }
    fence(this.root, -1.4, 2.72, 0, 1.4);
    fence(this.root, -2.77, 0.8, Math.PI / 2, 0.7);
    // Weathered wooden direction marker, lamp, and a cluster of smooth field stones.
    cylinder(this.root, 0.019, 0.025, 0.4, mat.timber, -2.1, 0.2, 0.6, 8);
    box(this.root, 0.29, 0.09, 0.025, mat.cream, -2.1, 0.37, 0.6);
    for (let i = 0; i < 6; i++) {
      const rock = mesh(
        new T.DodecahedronGeometry(0.07 + i * 0.006, 0),
        material("#a6ad8b"),
        this.root,
        1.4 + Math.sin(i * 7) * 0.2,
        0.045,
        2.55 + Math.cos(i * 4) * 0.12,
      );
      rock.scale.y = 0.65;
    }
    // Paint the departure arrow in world space so the visible heading matches the graph.
    const departure = level.rails.find((r) => r.id === level.start.node)!;
    const marker = new T.Shape();
    marker.moveTo(-0.06, -0.14);
    marker.lineTo(0.06, -0.14);
    marker.lineTo(0.06, 0.02);
    marker.lineTo(0.13, 0.02);
    marker.lineTo(0, 0.17);
    marker.lineTo(-0.13, 0.02);
    marker.lineTo(-0.06, 0.02);
    marker.closePath();
    const arrow = mesh(
      new T.ShapeGeometry(marker),
      mat.cream,
      this.root,
      departure.x - offset,
      0.09,
      departure.z - offset,
    );
    arrow.rotation.x = -Math.PI / 2;
    const heading = delta[level.start.exit];
    arrow.rotation.z = Math.atan2(heading[0], -heading[1]);
    arrow.position.x += heading[0] * 0.57;
    arrow.position.z += heading[1] * 0.57;
    this.batchStaticGeometry();
    this.train = locomotive(this.root);
    this.update(settings);
    this.home();
    this.project();
    this.render();
  }
  private batchStaticGeometry() {
    this.root.updateMatrixWorld(true);
    const batches = new Map<T.Material, T.BufferGeometry[]>();
    this.root.traverse((o) => {
      if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
      const geometry = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      geometry.applyMatrix4(o.matrixWorld);
      if (!geometry.getAttribute("uv"))
        geometry.setAttribute(
          "uv",
          new T.Float32BufferAttribute(
            new Float32Array(geometry.getAttribute("position").count * 2),
            2,
          ),
        );
      const batch = batches.get(o.material) ?? [];
      batch.push(geometry);
      batches.set(o.material, batch);
    });
    this.clear(this.root);
    for (const [m, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) throw new Error("Static geometry batching failed");
      mesh(geometry, m, this.root);
      geometries.forEach((g) => g.dispose());
    }
    this.root.add(this.indicators);
  }
  update(settings: Settings) {
    this.settings = { ...settings };
    this.clear(this.indicators);
    const offset = (this.level.size - 1) / 2;
    // Tiny physical switch levers and golden connection highlights; HTML provides large accessible controls.
    for (const r of this.level.rails.filter((r) => r.kind === "junction")) {
      const g = new T.Group();
      g.position.set(r.x - offset, 0, r.z - offset);
      this.indicators.add(g);
      const selected = r.branches![settings[r.id]];
      ribbon(railCurve(r, r.stem!, selected), 0.035, 0.081, mat.amber, g);
      cylinder(g, 0.07, 0.09, 0.04, mat.cream, -0.3, 0.05, 0.3, 16);
      const lever = box(g, 0.025, 0.2, 0.025, mat.teal, -0.3, 0.16, 0.3);
      lever.rotation.z = settings[r.id] === 0 ? -0.35 : 0.35;
      mesh(
        new T.SphereGeometry(0.037, 10, 8),
        mat.amber,
        g,
        -0.3 + (settings[r.id] === 0 ? 0.035 : -0.035),
        0.26,
        0.3,
      );
    }
    this.render();
  }
  home() {
    if (!this.level) return;
    const r = this.level.rails.find((r) => r.id === this.level.start.node)!,
      o = (this.level.size - 1) / 2;
    this.train.position.set(r.x - o, 0.08, r.z - o);
    const d = delta[this.level.start.exit];
    this.train.rotation.y = Math.atan2(d[0], d[1]);
    this.render();
  }
  play(run: Run, reduced: boolean, done: () => void) {
    const offset = (this.level.size - 1) / 2;
    const paths = run.steps.map((s: Step) => {
      const r = this.level.rails.find((r) => r.id === s.node)!;
      const curve = railCurve(r, s.incoming, s.outgoing);
      return {
        curve,
        offset: new T.Vector3(r.x - offset, 0.08, r.z - offset),
        length: curve.getLength(),
        dwell: s.dwell,
      };
    });
    const total = paths.reduce((a, p) => a + p.length + (p.dwell ? 0.4 : 0), 0);
    this.animation = {
      run,
      elapsed: 0,
      duration: reduced ? 0.12 : total * 0.95,
      done,
      paths,
      total,
    };
    this.speed = 1;
    this.renderer.domElement.dataset.journeyProgress = "0";
    delete this.renderer.domElement.dataset.terminalReason;
  }
  skip() {
    this.completeAnimation();
  }
  private place(
    path: NonNullable<Diorama["animation"]>["paths"][number],
    t: number,
  ) {
    this.train.position.copy(path.curve.getPointAt(t).add(path.offset));
    const tangent = path.curve.getTangentAt(t);
    this.train.rotation.y = Math.atan2(tangent.x, tangent.z);
  }
  private completeAnimation() {
    const animation = this.animation;
    if (!animation) return;
    // Dispatch already ran the authoritative simulator to its terminal result.
    // Resolve presentation directly: subtraction of accumulated curve lengths
    // can miss the last path by a floating-point epsilon, and there may be no
    // next RAF or resize after skipping to paint the final position.
    this.animation = null;
    this.place(animation.paths[animation.paths.length - 1], 1);
    this.renderer.domElement.dataset.journeyProgress = "1";
    this.renderer.domElement.dataset.terminalReason = animation.run.reason;
    this.render();
    animation.done();
  }
  private animate(dt: number) {
    const a = this.animation;
    if (!a) return;
    a.elapsed += dt * this.speed;
    if (a.elapsed >= a.duration) {
      this.completeAnimation();
      return;
    }
    const progress = Math.max(0, a.elapsed / a.duration);
    this.renderer.domElement.dataset.journeyProgress = String(progress);
    let distance = progress * a.total;
    for (const path of a.paths) {
      const len = path.length + (path.dwell ? 0.4 : 0);
      if (distance <= len) {
        this.place(path, Math.min(1, distance / Math.max(0.001, path.length)));
        break;
      }
      distance -= len;
    }
  }
  changeView(action: "in" | "out" | "left" | "right" | "up" | "down" | "home") {
    if (action === "in") this.zoom = Math.min(2.2, this.zoom + 0.4);
    if (action === "out") {
      this.zoom = Math.max(1, this.zoom - 0.4);
      if (this.zoom < 1.1) this.panX = this.panY = 0;
    }
    if (action === "left") this.panX = Math.max(-2.4, this.panX - 0.65);
    if (action === "right") this.panX = Math.min(2.4, this.panX + 0.65);
    if (action === "up") this.panY = Math.min(2.4, this.panY + 0.65);
    if (action === "down") this.panY = Math.max(-2.4, this.panY - 0.65);
    if (action === "home") {
      this.zoom = 1;
      this.panX = this.panY = 0;
    }
    this.setView();
    return this.zoom;
  }
  private setView() {
    const base = new T.Vector3(7.5, 10, 11),
      forward = base.clone().negate().normalize(),
      right = new T.Vector3()
        .crossVectors(forward, new T.Vector3(0, 1, 0))
        .normalize(),
      up = new T.Vector3().crossVectors(right, forward).normalize();
    const offset = right
      .multiplyScalar(this.panX)
      .add(up.multiplyScalar(this.panY));
    this.camera.position.copy(base.add(offset));
    this.camera.lookAt(offset);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.project();
    this.render();
  }
  private project() {
    if (!this.level || !this.onProject) return;
    const positions: Record<string, { x: number; y: number }> = {},
      o = (this.level.size - 1) / 2;
    for (const r of this.level.rails.filter(
      (r) =>
        r.kind === "junction" ||
        r.id === this.level.start.node ||
        r.id === this.level.destination ||
        r.blocked,
    )) {
      const v = new T.Vector3(r.x - o, 0.16, r.z - o).project(this.camera);
      positions[r.id] = {
        x: ((v.x + 1) / 2) * this.container.clientWidth,
        y: ((1 - v.y) / 2) * this.container.clientHeight,
      };
    }
    this.onProject(positions);
  }
  private render() {
    if (this.active && !this.disposed) {
      this.renderer.render(this.scene, this.camera);
      if (this.train) {
        this.renderer.domElement.dataset.trainX = String(this.train.position.x);
        this.renderer.domElement.dataset.trainZ = String(this.train.position.z);
      }
      this.renderer.domElement.dataset.renderCalls = String(
        this.renderer.info.render.calls,
      );
      this.renderer.domElement.dataset.renderTriangles = String(
        this.renderer.info.render.triangles,
      );
    }
  }
  private tick = (t: number) => {
    if (this.disposed) return;
    const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 0;
    this.last = t;
    if (this.active) {
      const moving = !!this.animation;
      this.animate(dt);
      if (moving) this.render();
    }
    this.raf = requestAnimationFrame(this.tick);
  };
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.visibility);
    this.observer.disconnect();
    this.clear(this.root);
    this.renderer.dispose();
  }
}
