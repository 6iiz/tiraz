// The clay table: a real 3D set. A light tabletop in the brand's lighter colour, one warm key light from the top left that casts soft
// shadows, a cool fill, and a camera looking down at the table from the viewer's side. Words, numbers and the logo are made of clay:
// extruded solids with round bevels, a matte surface with a pressed, thumb-worked texture, and slightly lumpy outlines.
//
//   const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
//   const piece = await world.word('*مية*', { size: 110, key: true });       // one clay word, centred on its own middle
//   const set = await world.text(fitted, { x0, x1, y, align });           // a kit.fit() text laid out word by word, in clay
//   world.frame(ctx, t, (tq, k) => { ...move pieces for the pose tq...; return [[objects, 'text'], ...] });
//
// Time steps in poses (motion.js, 12 a second). frame() only renders when the pose changes; in between it repeats the last picture,
// which is both the stop-motion look and the reason a long reel renders fast. All the scenes of a reel share one WebGL canvas.
import { THREE, stage, screenBox, solids, shapePath } from '/engine/three3d.js';
import { shapeText } from '/engine/type/shape.js';
import { mix, rng, hasArabic } from '/engine/kit.js';
import { pose, jitter, plop, hop } from './motion.js';

let shared = null;                                         // one WebGL canvas for every scene of the page
function gl(W, H) {
  if (!shared) {
    shared = stage({ W, H, background: '#808080', shadows: true });
    shared.renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the brand's hues truer than a filmic curve
    shared.renderer.toneMappingExposure = 1.0;
  }
  return shared;
}

const lum = (h) => { const n = parseInt(mix(h, h, 0).slice(1), 16); return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };

// The pressed-clay surface: soft dents and a few fingertip ridges, as a tiling bump texture (built once per page).
let texCache = null;
function clayTexture() {
  if (texCache) return texCache;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(4711);
  x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
  const wrap = (fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { x.save(); x.translate(dx, dy); fn(); x.restore(); } };
  for (let i = 0; i < 260; i++) {
    const px = r() * S, py = r() * S, rad = 4 + r() * 22, up = r() > 0.5, a = 0.05 + r() * 0.09;
    wrap(() => { const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, up ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(128,128,128,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill(); });
  }
  for (let j = 0; j < 4; j++) {                                // fingertip ridges: short runs of parallel arcs
    const cx = r() * S, cy = r() * S, a0 = r() * Math.PI * 2;
    for (let k = 0; k < 7; k++) wrap(() => { x.strokeStyle = `rgba(${k % 2 ? 255 : 0},${k % 2 ? 255 : 0},${k % 2 ? 255 : 0},0.07)`; x.lineWidth = 1.6;
      x.beginPath(); x.arc(cx, cy, 10 + k * 3.2, a0, a0 + 1.3); x.stroke(); });
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  texCache = t; return t;
}

// Smooth lumps: the same point in space always moves the same way, so glyphs that overlap inside a word stay joined.
function lumpy(root, amp, seed) {
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3(), inv = new THREE.Matrix4();
  root.traverse((m) => {
    if (!m.isMesh) return;
    const pos = m.geometry.attributes.position, mw = m.matrixWorld; inv.copy(mw).invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mw);
      const X = v.x, Y = v.y, Z = v.z;
      v.x += amp * (Math.sin(X * 0.041 + seed) * Math.sin(Y * 0.033 + 1.3) + 0.5 * Math.sin((X + Y) * 0.087 + seed * 2.1));
      v.y += amp * (Math.sin(Y * 0.047 + seed * 1.7) * Math.sin(X * 0.029 + 0.4) + 0.5 * Math.sin((X - Y) * 0.079 + seed));
      v.z += amp * 0.6 * Math.sin(X * 0.05 + Y * 0.04 + seed * 3.1);
      v.applyMatrix4(inv); pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere();
  });
}

// SVG path data -> THREE.ShapePath (y up), every command including arcs, which the base's logo reader skips (a round logo drawn
// with A came out empty). Arcs become short straight runs.
function svgPath(d) {
  const t = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [], sp = new THREE.ShapePath();
  let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, prev = '';
  const n = () => +t[i++], P = (X, Y) => [X, -Y];
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { sp.currentPath?.closePath?.(); x = sx; y = sy; prev = C; continue; }
    if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; sp.moveTo(...P(x, y)); cmd = rel ? 'l' : 'L'; prev = 'M'; continue; }
    if (C === 'L') { x = ox + n(); y = oy + n(); sp.lineTo(...P(x, y)); }
    else if (C === 'H') { x = ox + n(); sp.lineTo(...P(x, y)); }
    else if (C === 'V') { y = oy + n(); sp.lineTo(...P(x, y)); }
    else if (C === 'C' || C === 'S') {
      let x1, y1; if (C === 'C') { x1 = ox + n(); y1 = oy + n(); } else { x1 = /[CS]/.test(prev) ? 2 * x - cx : x; y1 = /[CS]/.test(prev) ? 2 * y - cy : y; }
      const x2 = ox + n(), y2 = oy + n(), ex = ox + n(), ey = oy + n();
      sp.bezierCurveTo(...P(x1, y1), ...P(x2, y2), ...P(ex, ey)); cx = x2; cy = y2; x = ex; y = ey;
    } else if (C === 'Q' || C === 'T') {
      let x1, y1; if (C === 'Q') { x1 = ox + n(); y1 = oy + n(); } else { x1 = /[QT]/.test(prev) ? 2 * x - cx : x; y1 = /[QT]/.test(prev) ? 2 * y - cy : y; }
      const ex = ox + n(), ey = oy + n(); sp.quadraticCurveTo(...P(x1, y1), ...P(ex, ey)); cx = x1; cy = y1; x = ex; y = ey;
    } else if (C === 'A') {
      let rx = Math.abs(n()), ry = Math.abs(n()); const phi = n() * Math.PI / 180, fa = n(), fs = n(), ex = ox + n(), ey = oy + n();
      if (!rx || !ry) { sp.lineTo(...P(ex, ey)); }
      else {                                                           // endpoint -> centre form (SVG spec, appendix F.6)
        const cs = Math.cos(phi), sn = Math.sin(phi), dx = (x - ex) / 2, dy = (y - ey) / 2;
        const x1 = cs * dx + sn * dy, y1 = -sn * dx + cs * dy, lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry);
        if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
        const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
        const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den)), cxp = co * rx * y1 / ry, cyp = -co * ry * x1 / rx;
        const ccx = cs * cxp - sn * cyp + (x + ex) / 2, ccy = sn * cxp + cs * cyp + (y + ey) / 2;
        const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        const a1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry); let da = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
        if (!fs && da > 0) da -= 2 * Math.PI; else if (fs && da < 0) da += 2 * Math.PI;
        const steps = Math.max(4, Math.ceil(Math.abs(da) / (Math.PI / 24)));
        for (let j = 1; j <= steps; j++) { const a = a1 + da * j / steps;
          sp.lineTo(...P(ccx + rx * Math.cos(a) * cs - ry * Math.sin(a) * sn, ccy + rx * Math.cos(a) * sn + ry * Math.sin(a) * cs)); }
      }
      x = ex; y = ey;
    } else { i++; }
    prev = C;
  }
  return sp;
}

// Outline -> solid shapes with holes, by the non-zero rule fonts are drawn with. (The base's solids() decides by nesting, which
// misreads variable fonts whose contours overlap: the counter of a final ه sits inside two overlapping strokes and came out filled.)
// A contour is filled when the point just inside it has a winding number other than 0; a hole goes to the smallest filled contour
// around it.
function solidsByWinding(sp) {
  const polys = sp.subPaths.map((s) => ({ s, pts: s.getPoints(6) })).filter((p) => p.pts.length > 2);
  const wind = (pt, poly) => { let w = 0; for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], cr = (b.x - a.x) * (pt.y - a.y) - (pt.x - a.x) * (b.y - a.y);
    if (a.y <= pt.y) { if (b.y > pt.y && cr > 0) w++; } else if (b.y <= pt.y && cr < 0) w--; } return w; };
  const inside = (pt, poly) => wind(pt, poly) !== 0 || wind(pt, [...poly].reverse()) !== 0;
  for (const p of polys) {
    p.area = THREE.ShapeUtils.area(p.pts);
    let a = p.pts[0], b = p.pts[1], k = 1;                                    // a point a hair inside the contour, off its longest early edge
    for (let i = 1; i < Math.min(p.pts.length, 40); i++) { const c = p.pts[i], d = p.pts[(i + 1) % p.pts.length]; if (Math.hypot(d.x - c.x, d.y - c.y) > Math.hypot(b.x - a.x, b.y - a.y)) { a = c; b = d; } }
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, side = p.area > 0 ? 1 : -1;
    const probe = { x: (a.x + b.x) / 2 - (b.y - a.y) / len * 0.25 * side * k, y: (a.y + b.y) / 2 + (b.x - a.x) / len * 0.25 * side * k };
    p.fill = polys.reduce((w, q) => w + wind(probe, q.pts), 0) !== 0;
  }
  const fills = polys.filter((p) => p.fill), holes = polys.filter((p) => !p.fill), shapes = new Map();
  for (const p of fills) { const sh = new THREE.Shape(); sh.curves = p.s.curves; sh.autoClose = true; shapes.set(p, sh); }
  for (const h of holes) {
    const host = fills.filter((f) => inside(h.pts[0], f.pts)).sort((x, y) => Math.abs(x.area) - Math.abs(y.area))[0];
    if (!host) continue;
    const ph = new THREE.Path(); ph.curves = h.s.curves; shapes.get(host).holes.push(ph);
  }
  return [...shapes.values()];
}

export async function create({ W, H, brand, look, clock = 0, kit }) {
  const T = look.tokens, C = T.clay;
  const bg = brand.colors.bg, tx = brand.colors.text;
  const [light, dark] = lum(bg) >= lum(tx) ? [bg, tx] : [tx, bg];          // the table is always the lighter brand colour
  const accent = brand.colors.accent, grey = mix(dark, light, T.tone.grey), soft = mix(dark, light, T.tone.lead), ink = mix(dark, light, T.tone.ink);
  const world = { ink, roller: mix(light, dark, T.tone.roller) };
  const g = gl(W, H);

  const scene = new THREE.Scene(); scene.background = new THREE.Color(light);
  const fov = T.cam.fov, D = (H / 2) / Math.tan(fov / 2 * Math.PI / 180);
  const camera = new THREE.PerspectiveCamera(fov, W / H, 10, 20000);
  camera.position.set(0, -T.cam.tilt, D); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);

  scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color(light), T.light.sky));
  const key = new THREE.DirectionalLight(0xfff1df, T.light.key);                // warm key, top left
  key.position.set(-900, 1300, 2400); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1300, right: 1300, top: 1400, bottom: -1400, near: 100, far: 6000 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 1.5; key.shadow.radius = 6; scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4ecff, T.light.fill); fill.position.set(1200, -600, 1800); scene.add(fill);

  const tex = clayTexture();
  const mats = new Map();
  const clay = (color, rep = 1 / 150, bump = C.bump) => {
    const id = color + rep + bump; if (mats.has(id)) return mats.get(id);
    const map = tex.clone(); map.repeat.set(rep, rep); map.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, bumpMap: map, bumpScale: bump });
    mats.set(id, m); return m;
  };
  const table = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, H * 3), clay(light, 1 / 520, C.bump * 0.6));
  table.receiveShadow = true; scene.add(table);

  // screen pixel (x, y) -> the point on the plane at height z that shows there
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const at = (x, y, z = 0) => {
    ndc.set(x / W * 2 - 1, 1 - y / H * 2); ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin, d = ray.ray.direction, s = (z - o.z) / d.z;
    return new THREE.Vector3(o.x + d.x * s, o.y + d.y * s, z);
  };

  let seed = 1;
  // Clay letters. The base's text3d bevels outward, which turns the small counters of heavy Arabic letters (ه، ة، م) inside out at a
  // clay-sized bevel; here the bevel is cut inward from the outline instead (bevelOffset), so a round edge never eats a hole.
  const geoCache = new Map();
  async function solidText(str, { size, weight, depth, bevel, face }) {
    const font = brand.fonts[face] || brand.fonts.display;
    const sh = await shapeText({ fontUrl: font.file, text: str, size, dir: hasArabic(str) ? 'rtl' : 'ltr', wght: weight });   // a Latin handle keeps its @ in front
    const cx = sh.width / 2, cy = (sh.ascent - sh.descent) / 2, list = [];
    for (const gl of sh.glyphs) {
      if (!gl.d) continue;
      const id = [font.file, size, weight, depth, bevel, gl.d].join('|');
      let geo = geoCache.get(id);
      if (!geo) {
        const shapes = solidsByWinding(shapePath(gl.d)); if (!shapes.length) continue;
        const bs = bevel * 0.45;
        geo = new THREE.ExtrudeGeometry(shapes, { depth: Math.max(1, depth - 2 * bevel), curveSegments: 5, bevelEnabled: true,
          bevelThickness: bevel, bevelSize: bs, bevelSegments: 4 });
        geo.translate(0, 0, bevel); geoCache.set(id, geo);
      }
      list.push({ geo, x: gl.x - cx, y: -gl.y + cy });
    }
    return { list, width: sh.width };
  }
  // One clay word (or any short text). The returned piece: { obj, rest, key, size, depth, width }; obj is centred on the word,
  // its back resting on the table (z = 0).
  async function word(text, { size, weight = 800, key = false, color, face = 'display', fat = key } = {}) {
    if (fat) size = Math.round(size * C.fat);
    const depth = size * C.depth * (fat ? 1.5 : 1), bevel = size * C.bevel * (fat ? 1.25 : 1);
    const material = clay(color ?? (key ? accent : world.ink));
    const st = await solidText(text, { size, weight, depth, bevel, face });
    const root = new THREE.Group();
    for (const g of st.list) { const m = new THREE.Mesh(g.geo.clone(), material); m.position.set(g.x, g.y, 0); m.castShadow = m.receiveShadow = true; root.add(m); }
    lumpy(root, size * C.lump * (fat ? 1.3 : 1), seed++ * 1.37);
    const obj = new THREE.Group(); obj.add(root); scene.add(obj); obj.visible = false;
    return { obj, rest: new THREE.Vector3(), key, size, depth, width: st.width, i: seed };
  }
  // A text fitted by kit.fit (for its rows and size), laid out from the clay pieces' own widths: rows, reading side, one piece per word.
  // y is the middle of the first row.
  async function text(f, { x0, x1, y, align = 'center', color, keyColor, face = 'display', fatKeys = true } = {}) {
    const rows = [], pieces = [];
    for (let r = 0; r < f.rows.length; r++) {
      const yy = y + r * f.lead, mine = [];
      for (const w of f.rows[r].words) mine.push(await word(w.w, { size: f.size, weight: f.weight, key: w.key, fat: w.key && fatKeys, face, color: w.key ? (keyColor ?? accent) : color }));
      const gap = f.space * C.space, gaps = mine.slice(1).map((p, j) => gap + f.size * 0.07 * ((p.key ? 1 : 0) + (mine[j].key ? 1 : 0)));   // fat pieces need room
      const rw = mine.reduce((s, p) => s + p.width, 0) + gaps.reduce((s, g) => s + g, 0);
      const atStart = kit.rtl ? x1 - rw : x0, atEnd = kit.rtl ? x0 : x1 - rw;
      const left = align === 'center' ? (x0 + x1 - rw) / 2 : align === 'start' ? atStart : atEnd;
      let cur = kit.rtl ? left + rw : left;
      for (const [j, p] of mine.entries()) {
        const wl = kit.rtl ? cur - p.width : cur;
        p.rest.copy(at(wl + p.width / 2, yy, p.depth / 2)).setZ(0); p.obj.position.copy(p.rest); p.row = r; pieces.push(p);
        cur = kit.rtl ? wl - (gaps[j] ?? 0) : wl + p.width + (gaps[j] ?? 0);
      }
      rows.push({ text: f.rows[r].words.map((w) => w.w).join(' '), pieces: mine, width: rw });
    }
    return { rows, pieces };
  }
  async function logo(size, color = ink) {
    const L = brand.logo, k = size / (L.box || 256), sp = svgPath(L.path);
    const shapes = L.rule === 'evenodd' ? solids(sp) : solidsByWinding(sp);
    const dep = size * 0.16 / k, b = size * 0.03 / k;
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: dep, curveSegments: 12, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.6, bevelSegments: 4 });
    geo.center();
    const m = new THREE.Mesh(geo, clay(color, 1 / 150 * k)); m.scale.set(k, k, k); m.castShadow = m.receiveShadow = true;
    const lg = new THREE.Group(); lg.add(m); lumpy(lg, size * 0.006, seed++);
    const obj = new THREE.Group(); obj.add(lg); scene.add(obj); obj.visible = false; return obj;
  }
  // A rounded clay slab w x h (pixels), thickness d.
  function slab(w, h, d, color = accent) {
    const r = Math.min(w, h) * 0.18, s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const b = d * 0.45, geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 5, curveSegments: 10 });
    const m = new THREE.Mesh(geo, clay(color, 1 / 160)); m.position.z = b; m.castShadow = m.receiveShadow = true;
    const inner = new THREE.Group(); inner.add(m); lumpy(inner, Math.min(w, h) * 0.012, seed++);
    const obj = new THREE.Group(); obj.add(inner); scene.add(obj); obj.visible = false; return obj;
  }
  function ball(r, color = accent) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), clay(color, 1 / 90)); m.castShadow = m.receiveShadow = true;
    const inner = new THREE.Group(); inner.add(m); lumpy(inner, r * 0.06, seed++); m.position.z = r * 0.6; m.scale.z = 0.6;
    const obj = new THREE.Group(); obj.add(inner); scene.add(obj); obj.visible = false; return obj;
  }

  // Drop a piece at t0 (and hop it out at t1, if given), for the pose tq / k. dir: which side it falls from (-1, 0, 1).
  function drop(p, tq, k, t0, { t1 = null, amp = 1, rest = p.rest, dir = 0 } = {}) {
    const o = p.obj ?? p, i = p.i ?? 0;
    const a = plop(tq, t0, amp), b = t1 == null ? { on: true, up: 0, sx: 1, sy: 1, sz: 1 } : hop(tq, t1);
    o.visible = a.on && b.on; o.userData.air = a.lift > 0 || b.up > 0; if (!o.visible) return false;
    const f = a.lift * T.drop.z / (camera.position.z - rest.z), cp = camera.position;   // falls along the line of sight: same spot, nearer
    o.position.set(rest.x + (cp.x - rest.x) * f + dir * a.lift * 60 + jitter(k, i) * 1.2,
      rest.y + (cp.y - rest.y) * f + a.lift * T.drop.y + b.up * 1500 + jitter(i, k) * 1.2, rest.z + (cp.z - rest.z) * f + b.up * 260);
    o.scale.set(a.sx * b.sx, a.sy * b.sy, a.sz * b.sz);
    o.rotation.set(0, 0, jitter(k + 0.5, i) * 0.006 + a.lift * 0.12 * (dir || (i % 2 ? 1 : -1)));
    return true;
  }

  const box = (objs) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const o of objs) { if (!o.visible || o.userData.air) continue; const [a, b, c, d] = screenBox(o, camera, W, H); x0 = Math.min(x0, a); x1 = Math.max(x1, b); y0 = Math.min(y0, c); y1 = Math.max(y1, d); }
    return x0 < x1 ? [x0, x1, y0, y1] : null;
  };

  const cache = document.createElement('canvas'); cache.width = W; cache.height = H; const cc = cache.getContext('2d');
  const vig = cc.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.8);   // eased stops: no ring where it begins
  for (let i = 0; i <= 10; i++) { const u = i / 10, a = 0.15 * Math.max(0, (u - 0.25) / 0.75) ** 2; vig.addColorStop(u, `rgba(40,24,10,${a.toFixed(4)})`); }
  const keyI = key.intensity;
  let last = null, recs = [];
  return Object.assign(world, {
    scene, camera, at, light, dark, accent, grey, soft, clay, word, text, logo, slab, ball, drop,
    // update(tq, k) moves the pieces for that pose and returns [[objects, text, extra?], …] for the safe-area check.
    frame(ctx, t, update) {
      const { k, tq } = pose(clock, t);
      if (k !== last) {
        const list = update(tq, k) || [];
        scene.updateMatrixWorld(true);
        recs = list.map(([objs, s, extra]) => { const b = box(Array.isArray(objs) ? objs : [objs]); return b && [...b, s, extra]; }).filter(Boolean);
        key.intensity = keyI * (1 + jitter(k, 7) * 0.012);                   // a hand-lit set: the light breathes a hair between shots
        g.renderer.render(scene, camera);
        cc.drawImage(g.canvas, 0, 0); cc.fillStyle = vig; cc.fillRect(0, 0, W, H);
        last = k;
      }
      ctx.drawImage(cache, 0, 0);
      for (const r of recs) kit.rec(...r);
    },
  });
}
