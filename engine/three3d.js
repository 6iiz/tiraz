// three3d.js · the shared base for 3D styles: a WebGL stage drawn into the reel's 2D canvas, Arabic text and the brand's logo as
// real extruded solids, and a way to tell the safe-area check where 3D text landed on screen.
//
//   import { THREE, stage, text3d, logo3d, screenBox } from '/engine/three3d.js';
//   const st = stage({ W, H, background: brand.colors.bg });          // st.scene, st.camera, st.render(ctx)
//   const tx = await text3d(brand, 'بتشبه *مية* شركة', { size: 90, depth: 24 });
//   st.scene.add(tx.root);                                            // tx.words[i] = { text, key, group } in reading order
//   kit.rec(...screenBox(tx.root, st.camera, W, H), 'بتشبه مية شركة');   // so the check measures it like flat text
//
// Shaping is HarfBuzz (engine/type/shape.js), so letters join and marks sit right; each glyph becomes an ExtrudeGeometry from its
// own outline. Everything is built once in create(); draw(t) only moves things and renders. Frames stay a function of time.
import * as THREE from '/vendor/three/three.module.min.js';
import { shapeText } from '/engine/type/shape.js';
import { marks } from '/engine/kit.js';
export { THREE };

// A WebGL canvas the size of the frame. render(ctx) draws the scene and copies it into the reel's 2D context.
export function stage({ W, H, background = null, fov = 35, near = 1, far = 20000, shadows = true, toneMapping = true } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: background == null, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (toneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  const scene = new THREE.Scene(); if (background != null) scene.background = new THREE.Color(background);
  const camera = new THREE.PerspectiveCamera(fov, W / H, near, far);
  return { canvas, renderer, scene, camera, render(ctx) { renderer.render(scene, camera); ctx.drawImage(canvas, 0, 0); } };
}

// SVG path data (absolute M L Q C Z, y down, as HarfBuzz gives it) -> THREE.ShapePath with y up.
export function shapePath(d) {
  const sp = new THREE.ShapePath(), tok = d.match(/[MLQCZ]|-?[\d.]+(?:e[-+]?\d+)?/gi) || []; let i = 0, c = 'M';
  const P = () => [+tok[i++], -tok[i++]];
  while (i < tok.length) {
    if (/^[MLQCZ]$/i.test(tok[i])) { c = tok[i++].toUpperCase(); if (c === 'Z') continue; }
    if (c === 'M') sp.moveTo(...P()); else if (c === 'L') sp.lineTo(...P());
    else if (c === 'Q') sp.quadraticCurveTo(...P(), ...P()); else if (c === 'C') sp.bezierCurveTo(...P(), ...P(), ...P());
    else i++;
  }
  return sp;
}


// ShapePath -> solid shapes with their holes. Font outlines (non-zero, and variable fonts often overlap their contours): a hole is a
// contour wound against the outer contours, placed in the smallest outer around it. A logo whose contours all wind the same way
// (even-odd) falls back to nesting parity: inside an odd number of others = a hole.
export function solids(sp) {
  const polys = sp.subPaths.map((s) => ({ s, pts: s.getPoints(8) })).filter((p) => p.pts.length > 2);
  if (!polys.length) return [];
  const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const mid = (pts) => { let x = 0, y = 0; for (const q of pts) { x += q.x; y += q.y; } return { x: x / pts.length, y: y / pts.length }; };
  polys.forEach((p) => { p.signed = THREE.ShapeUtils.area(p.pts); p.area = Math.abs(p.signed); });
  const outerSign = Math.sign(polys.reduce((m, p) => (p.area > m.area ? p : m)).signed);
  const mixed = polys.some((p) => Math.sign(p.signed) !== outerSign);
  const isHole = (p) => {
    const host = polys.filter((q) => q !== p && q.area > p.area && (inside(p.pts[0], q.pts) || inside(mid(p.pts), q.pts)));
    if (mixed) return Math.sign(p.signed) !== outerSign && host.length > 0;
    return host.length % 2 === 1;
  };
  polys.forEach((p) => { p.hole = isHole(p); });
  const shapes = new Map();
  for (const p of polys.filter((p) => !p.hole)) { const sh = new THREE.Shape(); sh.curves = p.s.curves; sh.autoClose = true; shapes.set(p, sh); }
  for (const p of polys.filter((p) => p.hole)) {
    const host = [...shapes.keys()].filter((q) => q.area > p.area && (inside(p.pts[0], q.pts) || inside(mid(p.pts), q.pts))).sort((a, b) => a.area - b.area)[0];
    if (!host) continue;
    const h = new THREE.Path(); h.curves = p.s.curves; shapes.get(host).holes.push(h);
  }
  return [...shapes.values()];
}

const extrude = (shapes, depth, bevel, curve) => new THREE.ExtrudeGeometry(shapes, {
  depth, curveSegments: curve, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 3 });

// A line of text as solids. text may carry *key* words. Returns { root, words, width, height, size }:
//  root is centred on the origin (x and y), front face at z = depth; words[i].group holds that word's glyphs (in reading order),
//  each word group is itself centred on its own middle so it can be lifted, spun or dropped alone.
//  material(word) -> a THREE.Material, or one material for all; default: brand text colour, key words in the accent.
export async function text3d(brand, text, { size = 90, weight = 800, depth = 20, bevel = 2, curve = 6, face = 'display', material, perGlyph = false } = {}) {
  const ws = marks(text, 'the 3D text'), plain = ws.map((w) => w.w).join(' ');
  const font = brand.fonts[face] || brand.fonts.display;
  const sh = await shapeText({ fontUrl: font.file, text: plain, size, dir: brand.dir === 'ltr' ? 'ltr' : 'rtl', wght: weight });
  const mats = new Map(), matFor = (w) => {
    if (typeof material === 'function') return material(w);
    if (material) return material;
    const k = w.key ? 'k' : 'n';
    if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: w.key ? brand.colors.accent : brand.colors.text, metalness: 0.1, roughness: 0.45 }));
    return mats.get(k);
  };
  const root = new THREE.Group(), words = [];
  const cx = sh.width / 2, cy = (sh.ascent - sh.descent) / 2;
  for (const [wi, sw] of sh.words.entries()) {
    const w = { text: sw.text, key: !!ws[wi]?.key, group: new THREE.Group() };
    const mx = (sw.x0 + sw.x1) / 2 - cx;
    w.group.position.set(mx, 0, 0); w.center = new THREE.Vector3(mx, 0, 0);
    if (!perGlyph) {                                  // default: the whole word as one traced solid, centred on its advance
      await document.fonts.load(`${weight} ${size}px "${font.family}"`);
      const tr = traceText(sw.text, { family: font.family, weight, size });
      if (tr.shapes.length) { const mesh = new THREE.Mesh(extrude(tr.shapes, depth, bevel, curve), matFor(w)); mesh.position.set(0, cy - (sh.ascent - sh.descent) / 2, 0); mesh.castShadow = true; mesh.receiveShadow = true; w.group.add(mesh); }
      root.add(w.group); words.push(w); continue;
    }
    for (const gi of sw.ids) {
      const g = sh.glyphs[gi]; if (!g.d) continue;
      const shapes = solids(shapePath(g.d)); if (!shapes.length) continue;
      const mesh = new THREE.Mesh(extrude(shapes, depth, bevel, curve), matFor(w));
      mesh.position.set(g.x - cx - mx, -g.y + cy, 0); mesh.castShadow = true; mesh.receiveShadow = true;
      w.group.add(mesh);
    }
    root.add(w.group); words.push(w);
  }
  return { root, words, width: sh.width, height: sh.ascent + sh.descent, size };
}

// The brand logo (brand.logo: { path, box, rule }) as a solid `size` pixels wide, centred, front face at z = depth.
export function logo3d(brand, { size = 300, depth = 40, bevel = 4, material } = {}) {
  const L = brand.logo, k = size / (L.box || 256);
  const shapes = traceLogo(brand, size);
  const geo = extrude(shapes, depth, bevel, 12); geo.center();
  const mesh = new THREE.Mesh(geo, material || new THREE.MeshStandardMaterial({ color: brand.colors.accent, metalness: 0.2, roughness: 0.35 })); mesh.castShadow = true; mesh.receiveShadow = true;
  const g = new THREE.Group(); g.add(mesh); return g;
}

// Logo paths may use H/V and relative commands; turn them into the absolute M L Q C Z that shapePath reads.
function absolute(d) {
  const t = d.match(/[a-zA-Z]|-?[\d.]+(?:e[-+]?\d+)?/g) || []; let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0; const out = [];
  const n = () => +t[i++];
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'Z') { out.push('Z'); x = sx; y = sy; continue; }
    if (C === 'M') { x = (rel ? x : 0) + n(); y = (rel ? y : 0) + n(); sx = x; sy = y; out.push(`M${x},${y}`); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { x = (rel ? x : 0) + n(); y = (rel ? y : 0) + n(); out.push(`L${x},${y}`); }
    else if (C === 'H') { x = (rel ? x : 0) + n(); out.push(`L${x},${y}`); }
    else if (C === 'V') { y = (rel ? y : 0) + n(); out.push(`L${x},${y}`); }
    else if (C === 'Q') { const a = [n(), n(), n(), n()].map((v, j) => v + (rel ? (j % 2 ? y : x) : 0)); out.push(`Q${a[0]},${a[1]} ${a[2]},${a[3]}`); x = a[2]; y = a[3]; }
    else if (C === 'C') { const a = [n(), n(), n(), n(), n(), n()].map((v, j) => v + (rel ? (j % 2 ? y : x) : 0)); out.push(`C${a[0]},${a[1]} ${a[2]},${a[3]} ${a[4]},${a[5]}`); x = a[4]; y = a[5]; }
    else if (C === 'A') {                                  // elliptical arc -> short line segments (SVG endpoint parametrisation)
      let rx = Math.abs(n()), ry = Math.abs(n()); const phi = n() * Math.PI / 180, large = n(), sweep = n();
      const x2 = n() + (rel ? x : 0), y2 = n() + (rel ? y : 0);
      if (!rx || !ry) { out.push(`L${x2},${y2}`); x = x2; y = y2; continue; }
      const cp = Math.cos(phi), sp = Math.sin(phi), dx = (x - x2) / 2, dy = (y - y2) / 2;
      const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
      const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
      const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
      const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx, cx = cp * cxp - sp * cyp + (x + x2) / 2, cy = sp * cxp + cp * cyp + (y + y2) / 2;
      const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry); let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
      if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
      const N = Math.max(8, Math.ceil(Math.abs(dt) / (Math.PI / 16)));
      for (let k = 1; k <= N; k++) { const a = t1 + dt * k / N; out.push(`L${cx + rx * Math.cos(a) * cp - ry * Math.sin(a) * sp},${cy + rx * Math.cos(a) * sp + ry * Math.sin(a) * cp}`); }
      x = x2; y = y2;
    }
    else i++;
  }
  return out.join(' ');
}


// ---------- words and logos as one solid each (no seams at Arabic joins) ----------
// The browser paints the word once on a canvas (it shapes it, joins it and fills every overlap), the filled shape is traced back
// into outlines (marching squares, then simplified) and extruded. This is the default for text3d and logo3d: per-glyph extrusion
// leaves a bevel seam at every join and can trip over overlapping contours in variable fonts.
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


const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
const TRACED = new Map();
// One word (or a short run of text) as THREE.Shapes in pixels, centred on the middle of its advance and its middle line.
export function traceText(text, { family, weight = 800, size = 90 }) {
  const key = `${family}|${weight}|${size}|${text}`;
  if (TRACED.has(key)) return TRACED.get(key);
  const S = clampN(300 / size, 1.25, 4), px = size * S, cv = document.createElement('canvas');
  let g = cv.getContext('2d'); g.font = `${weight} ${px}px "${family}"`;
  const adv = g.measureText(text).width;
  cv.width = Math.ceil(adv + px * 0.9); cv.height = Math.ceil(px * 2.2);
  g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${weight} ${px}px "${family}"`; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr'; g.fillStyle = '#fff';
  g.fillText(text, cv.width / 2, cv.height / 2);
  const out = { shapes: shapesFrom(cv, S, cv.width / 2, cv.height / 2), width: adv / S };
  TRACED.set(key, out); return out;
}
// The brand logo (any SVG path: arcs, relative commands, its own fill rule) as THREE.Shapes `size` pixels wide, centred.
export function traceLogo(brand, size) {
  const L = brand.logo, box = L.box || 256, S = clampN(1100 / size, 1, 5), k = size * S / box, pad = 8;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(box * k + pad * 2); cv.height = cv.width;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.translate(pad, pad); g.scale(k, k); g.fillStyle = '#fff'; g.fill(new Path2D(L.path), L.rule === 'evenodd' ? 'evenodd' : 'nonzero');
  return shapesFrom(cv, S, cv.width / 2, cv.height / 2);
}

// Where an object lands on screen, as [x0, x1, y0, y1] in frame pixels: pass it to kit.rec(...) so 3D text is measured too.
export function screenBox(obj, camera, W, H) {
  const b = new THREE.Box3().setFromObject(obj); if (b.isEmpty()) return [0, 0, 0, 0];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; const v = new THREE.Vector3();
  for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) {
    v.set(X, Y, Z).project(camera); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  return [x0, x1, y0, y1];
}
