// studio.js · the workshop behind metal-cast: one shared WebGL renderer with a studio reflection map, the brand's colours as metals,
// words and the logo cast as solid metal, and the fall of a heavy piece onto the table as a function of time.
//
// Why words are traced here instead of using text3d() from /engine/three3d.js: that builder extrudes every glyph on its own, so a
// bevel cuts a groove at every Arabic join, and some closed loops (the ring of a final ة) come out as holes. Here each word is filled
// once on a canvas (the browser shapes it, joins it and fills overlaps), the filled shape is traced into outlines (marching squares,
// then simplified), and the whole word is extruded as one piece: no seams, holes where the letter really has them. Built once in
// create(), cached by text and style, so a word used in two scenes is traced once.
import { THREE } from '/engine/three3d.js';
import { mix, contrast, hasArabic, clamp } from '/engine/kit.js';

// ---------- colour ----------
const lum = (h) => contrast(h, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  // The table always takes the brand's text colour and the cast letters the background colour, so the two always contrast:
  // a light identity gives a dark table with light metal (as before); a dark identity gives a light table with dark metal,
  // instead of light letters on a black table in a black room. `dark` names the table side, `light` the metal side.
  const dark = text, light = bg;
  return {
    dark, light, accent,
    table: dark,                                   // the studio table: the brand's text colour
    pool: lum(dark) > lum(light) ? mix(dark, '#FFFFFF', 0.45) : mix(dark, light, 0.20),   // where the key light falls: always brighter
    old: mix(light, dark, 0.26),                   // a dulled metal for what is struck out
    soft: mix(light, dark, 0.10),                  // lead-ins and labels: the same metal, a step back
    plate: mix(dark, light, 0.17),                 // stamped plates
    note: mix(light, dark, 0.5),
  };
}

// ---------- one renderer for every scene on the page ----------
let R = null;
export function renderer(W, H) {
  if (R) return R;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1;     // keeps the accent's hue (ACES pushes it)
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  R = { r, canvas, env: studioEnv(r) };
  return R;
}

// The reflection map: a dark room with soft boxes. The big one sits behind the camera, so the polished faces (which look at the
// camera) mirror it; two strips at the sides and one overhead catch the bevels and the walls of the letters.
function studioEnv(r) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.055, 0.055, 0.055), side: THREE.BackSide })));
  const panel = (w, h, x, y, z, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(70, 26, 0, 30, 80, 2.60);       // the big soft box, upper half (faces looking up the table see it brighter)
  panel(70, 26, 0, 5, 85, 1.00);       // and its lower half, dimmer: a gradient down each face
  panel(18, 86, -85, 10, 20, 3.20);     // strip, left
  panel(18, 86, 85, 10, 20, 2.00);      // strip, right
  panel(84, 18, 0, 85, 10, 2.60);       // overhead
  const pm = new THREE.PMREMGenerator(r), tex = pm.fromScene(s, 0.035).texture; pm.dispose();
  return tex;
}

// ---------- tracing a filled shape into outlines ----------
// alpha: coverage 0..1 per pixel (w*h). Returns closed loops of [x, y] in pixel coordinates, all wound the same way around the inside.
function trace(alpha, w, h) {
  const next = new Int32Array(w * h * 2).fill(-1);
  const v = (x, y) => alpha[y * w + x];
  const cut = (a, b) => { const t = (0.5 - a) / (b - a); return t < 0.001 ? 0.001 : t > 0.999 ? 0.999 : t; };
  const pt = (id) => { const k = id >> 1, x = k % w, y = (k - x) / w;
    return id & 1 ? [x, y + cut(v(x, y), v(x, y + 1))] : [x + cut(v(x, y), v(x + 1, y)), y]; };
  const CX = [0, 1, 1, 0], CY = [0, 0, 1, 1];
  const E = [0, 0, 0, 0], ins = [false, false, false, false];
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const c0 = v(x, y), c1 = v(x + 1, y), c2 = v(x + 1, y + 1), c3 = v(x, y + 1);
    ins[0] = c0 >= 0.5; ins[1] = c1 >= 0.5; ins[2] = c2 >= 0.5; ins[3] = c3 >= 0.5;
    if (ins[0] === ins[1] && ins[1] === ins[2] && ins[2] === ins[3]) continue;
    E[0] = (y * w + x) * 2; E[1] = (y * w + x + 1) * 2 + 1; E[2] = ((y + 1) * w + x) * 2; E[3] = (y * w + x) * 2 + 1;   // top, right, bottom, left
    const add = (ea, eb, rx, ry, rin) => {             // a segment between two edges, oriented so the inside is always on one side
      const P = pt(E[ea]), Q = pt(E[eb]);
      const cr = (Q[0] - P[0]) * (y + ry - P[1]) - (Q[1] - P[1]) * (x + rx - P[0]);
      if ((cr > 0) === rin) next[E[ea]] = E[eb]; else next[E[eb]] = E[ea];
    };
    const cross = []; for (let e = 0; e < 4; e++) if (ins[e] !== ins[(e + 1) % 4]) cross.push(e);
    if (cross.length === 2) {
      let sx = 0, sy = 0, n = 0; for (let k = 0; k < 4; k++) if (ins[k]) { sx += CX[k]; sy += CY[k]; n++; }
      add(cross[0], cross[1], sx / n, sy / n, true);
    } else {
      const mid = (c0 + c1 + c2 + c3) / 4 >= 0.5;
      for (let k = 0; k < 4; k++) if (ins[k] !== mid) add(k, (k + 3) % 4, CX[k], CY[k], ins[k]);
    }
  }
  const loops = [];
  for (let id = 0; id < next.length; id++) {
    if (next[id] < 0) continue;
    const loop = []; let cur = id;
    while (cur >= 0 && next[cur] >= 0) { loop.push(pt(cur)); const n = next[cur]; next[cur] = -1; cur = n; }
    if (loop.length > 3) loops.push(loop);
  }
  return loops;
}

function simplifyOpen(p, eps) {
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const stack = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let far = -1, dmax = eps;
    const ax = p[a][0], ay = p[a][1], dx = p[b][0] - ax, dy = p[b][1] - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dx * (p[i][1] - ay) - dy * (p[i][0] - ax)) / L; if (d > dmax) { dmax = d; far = i; } }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
function simplifyLoop(loop, eps) {
  let far = 0, dm = 0; for (let i = 1; i < loop.length; i++) { const d = (loop[i][0] - loop[0][0]) ** 2 + (loop[i][1] - loop[0][1]) ** 2; if (d > dm) { dm = d; far = i; } }
  const a = simplifyOpen(loop.slice(0, far + 1), eps), b = simplifyOpen(loop.slice(far).concat([loop[0]]), eps);
  return a.concat(b.slice(1, -1));
}
const area = (p) => { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]); return s / 2; };
const inside = (q, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
  const a = poly[i], b = poly[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };

// A canvas painted by paint(g) at scale S -> THREE.Shapes in frame pixels, y up, centred on (ox, oy) of the canvas.
function shapesFrom(canvas, S, ox, oy) {
  const g = canvas.getContext('2d', { willReadFrequently: true }), { width: w, height: h } = canvas;
  const px = g.getImageData(0, 0, w, h).data, alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = px[i * 4 + 3] / 255;
  const loops = trace(alpha, w, h).map((l) => simplifyLoop(l, 0.45)).filter((l) => l.length > 2 && Math.abs(area(l)) > 2);
  if (!loops.length) return [];
  const biggest = loops.reduce((a, b) => (Math.abs(area(b)) > Math.abs(area(a)) ? b : a)), outerSign = Math.sign(area(biggest));
  const outers = loops.filter((l) => Math.sign(area(l)) === outerSign), holes = loops.filter((l) => Math.sign(area(l)) !== outerSign);
  const toV = (p) => new THREE.Vector2((p[0] - ox) / S, -(p[1] - oy) / S);
  const shapes = outers.map((l) => ({ l, a: Math.abs(area(l)), sh: new THREE.Shape(l.map(toV)) }));
  for (const hl of holes) {
    const host = shapes.filter((o) => inside(hl[0], o.l)).sort((a, b) => a.a - b.a)[0];
    if (host) host.sh.holes.push(new THREE.Path(hl.map(toV)));
  }
  return shapes.map((o) => o.sh);
}

const SHAPES = new Map();
// One word (or any short run of text) as shapes, centred on the middle of its advance and on its middle line, like kit.drawText places it.
export function textShapes(text, { family, weight, size }) {
  const key = `${family}|${weight}|${size}|${text}`;
  if (SHAPES.has(key)) return SHAPES.get(key);
  const S = clamp(300 / size, 1.25, 4), px = size * S, cv = document.createElement('canvas');
  let g = cv.getContext('2d'); g.font = `${weight} ${px}px "${family}"`;
  const adv = g.measureText(text).width;
  cv.width = Math.ceil(adv + px * 0.9); cv.height = Math.ceil(px * 2.2);
  g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${weight} ${px}px "${family}"`; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.direction = hasArabic(text) ? 'rtl' : 'ltr'; g.fillStyle = '#fff';
  g.fillText(text, cv.width / 2, cv.height / 2);
  const out = { shapes: shapesFrom(cv, S, cv.width / 2, cv.height / 2), width: adv / S };
  SHAPES.set(key, out); return out;
}

// The brand's logo (any SVG path, arcs included, with its own fill rule) as shapes `size` pixels wide, centred.
export function logoShapes(brand, size) {
  const L = brand.logo, box = L.box || 256, S = clamp(1100 / size, 1, 5), k = size * S / box, pad = 8;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(box * k + pad * 2); cv.height = cv.width;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.translate(pad, pad); g.scale(k, k); g.fillStyle = '#fff'; g.fill(new Path2D(L.path), L.rule === 'evenodd' ? 'evenodd' : 'nonzero');
  return shapesFrom(cv, S, cv.width / 2, cv.height / 2);
}

const GEO = new Map();
// Shapes -> a solid resting on z = 0, its face at z = depth + 2·bevel.
export function cast(shapes, { depth, bevel, key }) {
  const k = key && `${key}|${depth}|${bevel}`;
  if (k && GEO.has(k)) return GEO.get(k);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, steps: 1, curveSegments: 6, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.55, bevelSegments: 2 });
  geo.translate(0, 0, bevel);
  if (k) GEO.set(k, geo);
  return geo;
}

// A rounded plate w x h with corner radius r, resting on z = 0.
export function plateShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return [s];
}

// The metal of one piece: its face polished, its walls and bevel a shade deeper and a little rougher, so edges read.
export function metal(hex, dark, { rough = 0.3, metalness = 0.88 } = {}) {
  const face = new THREE.MeshStandardMaterial({ color: hex, metalness, roughness: rough });
  const side = new THREE.MeshStandardMaterial({ color: mix(hex, dark, 0.3), metalness, roughness: rough + 0.14 });
  return [face, side];
}
export const tone = (mats, hex, dark) => { mats[0].color.set(hex); mats[1].color.set(mix(hex, dark, 0.3)); };

// ---------- laying text out like kit.drawText, word by word ----------
export function layout(f, { x0, x1, y, align = 'center', rtl = true }) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ w, cx: wl + w.width / 2, cy: yy, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// A fitted text (kit.fit) cast in metal and laid on the table. color(word) -> hex. Returns pieces in reading order:
// { text, key, group, mats, base: Vector3 (its resting place), size }.
export function castText(ground, f, { x0, x1, y, align = 'center', rtl = true, color, depth, bevel }) {
  return layout(f, { x0, x1, y, align, rtl }).map(({ w, cx, cy }, i) => {
    const sh = textShapes(w.w, f), mats = metal(color(w), ground.pal.dark);
    const mesh = new THREE.Mesh(cast(sh.shapes, { depth: depth ?? f.size * 0.26, bevel: bevel ?? Math.max(0.8, f.size * 0.02), key: `${f.family}|${f.weight}|${f.size}|${w.w}` }), mats);
    mesh.castShadow = true;
    const group = new THREE.Group(); group.add(mesh); group.visible = false;
    const base = ground.at(cx, cy); group.position.copy(base); ground.scene.add(group);
    return { text: w.w, key: w.key, group, mats, base, up: ground.up(base), size: f.size, half: { x: sh.width / 2, y: f.size * 0.5 }, seed: i };
  });
}

// ---------- the fall ----------
// A heavy piece dropped from h0 above the table: it falls under gravity in `fall` seconds, tilted a little, lands flat, hops once
// (restitution e) and rings: a fast rocking that dies out. A function of the time since it was let go, nothing else.
export function fallAt(tau, { fall = 0.28, h0 = 320, e = 0.15, ring = 0.03, seed = 0 } = {}) {
  if (tau < 0) return null;
  const sg = seed % 2 ? 1 : -1;
  if (tau < fall) {
    const s = tau / fall, k = (1 - s) * (1 - s);
    return { h: h0 * (1 - s * s), rx: 0.2 * k, ry: 0.09 * k * sg, op: clamp(tau / (fall * 0.45)), landed: false };
  }
  const u = tau - fall, Tb = 2 * e * fall, q = u / Tb;
  const h = u < Tb ? 4 * e * e * h0 * q * (1 - q) : 0, a = ring * Math.exp(-6.5 * u);
  return { h, rx: a * Math.sin(2 * Math.PI * 5.5 * u), ry: 0.7 * a * sg * Math.sin(2 * Math.PI * 7.3 * u + 1.1), op: 1, landed: true };
}
// Puts a piece where its fall says; returns false while it has not been let go.
export function place(p, st, base = p.base) {
  if (!st) { p.group.visible = false; return false; }
  p.group.visible = st.op > 0.001;
  const lift = Math.abs(st.rx) * p.half.y + Math.abs(st.ry) * p.half.x;      // rocking on an edge, never into the table
  const up = p.up, k = (st.h + lift) / (up ? up.z : 1);          // falls along the line of sight, so it keeps its place on screen
  p.group.position.set(base.x + (up ? up.x * k : 0), base.y + (up ? up.y * k : 0), base.z + (up ? up.z * k : k));
  p.group.rotation.set(st.rx, st.ry, 0);
  for (const m of p.mats) { m.opacity = st.op; m.transparent = st.op < 0.999; }
  const sh = st.op > 0.75 && st.h < 110; p.group.traverse((o) => { if (o.isMesh) o.castShadow = sh; });   // a piece still fading in casts no shadow yet
  return true;
}
