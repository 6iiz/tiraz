// Glass and light: the motion and the materials of the style, shared by every part.
//  - one WebGL renderer for the whole reel (every scene renders into it in turn and copies the picture out), and one studio light
//    map for the glass to reflect;
//  - glassText(): Arabic text as thick glass solids, one merged mesh per word, frosted on its face and polished on its sides;
//  - the signature moves: a pane turns into the light (turnIn), turns on past it (turnOut), and a slow band of light sweeps across the
//    studio between scenes (sweep), carried over the cut by joint.js.
// Everything is built once; per frame only positions, angles and a few uniforms change.
import { THREE, stage, shapePath } from '/engine/three3d.js';
import { shapeText } from '/engine/type/shape.js';
import { marks, clamp, mix } from '/engine/kit.js';
export { THREE };

// ---------- curves (by role, see guides/motion.md) ----------
export const land = (p) => 1 - (1 - clamp(p)) ** 3;          // a pane settles
export const settle = (p) => 1 - (1 - clamp(p)) ** 6;        // the hero lands and holds
export const away = (p) => clamp(p) ** 2.6;                   // leaves, accelerating
export const soft = (p) => { const q = clamp(p); return q * q * (3 - 2 * q); };

// ---------- the brand's colours, read as a dark studio ----------
const lum = (h) => { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export function palette(brand) {
  const { bg, text, accent } = brand.colors, dark = lum(bg) <= lum(text);
  const ground = dark ? bg : text, ink = dark ? text : bg;
  // the accent as glass: a dark accent is lifted a little towards the ink so it still glows on the dark studio
  const la = lum(accent), glow = la < 0.25 ? mix(accent, ink, la < 0.1 ? 0.35 : 0.25) : accent;
  return { ground, ink, accent, glow, dim: mix(ground, ink, 0.62), faint: mix(ground, ink, 0.4) };
}

// ---------- one renderer for the reel ----------
let GL = null;
export function gl(W, H, P) {
  if (GL) return GL;
  const st = stage({ W, H, background: P.ground, shadows: false });
  st.renderer.toneMapping = THREE.NeutralToneMapping; st.renderer.toneMappingExposure = 1.0;
  // the light map the glass reflects: a dark room with three soft boxes (two tall strips at the sides, one wide panel overhead-front)
  const room = new THREE.Scene(), lit = (k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(P.ink).multiplyScalar(k), side: THREE.DoubleSide });
  room.add(new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.ground).multiplyScalar(0.6), side: THREE.BackSide })));
  const box = (w, h, x, y, z, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit(k)); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  box(14, 120, -70, 10, -30, 6); box(14, 120, 70, 10, -30, 6);      // the two strips behind and to the sides: the edges
  box(120, 40, 0, 60, 60, 1.6);                                    // overhead, in front: a soft sheen on the faces
  box(60, 10, 0, -40, 80, 0.8);                                    // a low bounce from the floor
  const pm = new THREE.PMREMGenerator(st.renderer);
  GL = { ...st, env: pm.fromScene(room, 0.03).texture };
  pm.dispose();
  return GL;
}

// ---------- glass ----------
// kind: 'clear' (the brand's light colour), 'key' (the accent), 'smoke' (a value being replaced). Each is [face, sides]:
// the face is frosted, so the letter reads as one milky shape over the dark studio; the sides are polished and catch the edge light.
export function glass(P, env, kind = 'clear', depth = 40) {
  const tint = kind === 'key' ? P.glow : kind === 'smoke' ? P.dim : P.ink;
  const base = { transmission: 1, thickness: depth, ior: 1.48, metalness: 0, envMap: env, specularIntensity: 1, attenuationColor: new THREE.Color(tint), attenuationDistance: depth * 2.2 };
  const face = new THREE.MeshPhysicalMaterial({ ...base, color: new THREE.Color(mix(tint, '#ffffff', kind === 'key' ? 0.15 : 0.35)), roughness: 0.1,
    envMapIntensity: 1.1, clearcoat: 1, clearcoatRoughness: 0.12, emissive: new THREE.Color(tint), emissiveIntensity: kind === 'key' ? 0.6 : kind === 'smoke' ? 0.34 : 0.5 });
  const side = new THREE.MeshPhysicalMaterial({ ...base, color: new THREE.Color(mix(tint, '#ffffff', 0.5)), roughness: 0.06, envMapIntensity: 2.2,
    emissive: new THREE.Color(tint), emissiveIntensity: kind === 'key' ? 1.1 : kind === 'smoke' ? 0.6 : 0.95 });
  return [face, side];
}

// A glyph outline as solids: a contour wound like the largest one is a solid, one wound the other way is a hole of the smallest solid
// around it. (Variable fonts draw overlapping contours; the nesting rule in three3d.js takes some of them for holes. Winding does not.)
function solids(sp) {
  const polys = sp.subPaths.map((s) => ({ s, pts: s.getPoints(6) })).filter((p) => p.pts.length > 2);
  if (!polys.length) return [];
  polys.forEach((p) => { p.a = THREE.ShapeUtils.area(p.pts); });
  const sgn = Math.sign(polys.reduce((a, b) => (Math.abs(b.a) > Math.abs(a.a) ? b : a)).a);
  const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const outer = polys.filter((p) => Math.sign(p.a) === sgn), shapes = new Map();
  for (const p of outer) { const sh = new THREE.Shape(); sh.curves = p.s.curves; sh.autoClose = true; shapes.set(p, sh); }
  for (const h of polys.filter((p) => Math.sign(p.a) !== sgn)) {
    const host = outer.filter((q) => Math.abs(q.a) > Math.abs(h.a) && inside(h.pts[Math.floor(h.pts.length / 2)], q.pts)).sort((a, b) => Math.abs(a.a) - Math.abs(b.a))[0];
    if (!host) { const sh = new THREE.Shape(); sh.curves = h.s.curves; sh.autoClose = true; shapes.set(h, sh); continue; }   // a dot drawn the other way round is still a solid
    const path = new THREE.Path(); path.curves = h.s.curves; shapes.get(host).holes.push(path);
  }
  return [...shapes.values()];
}

// Several extruded glyphs as one geometry with two groups (0 faces, 1 sides), so a word is one mesh and two draw calls.
function merge(geos) {
  const parts = [[], []]; let n = 0;
  for (const g of geos) for (const gr of g.groups) { parts[gr.materialIndex].push([g, gr.start, gr.count]); n += gr.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), out = new THREE.BufferGeometry();
  let o = 0;
  parts.forEach((list, mi) => {
    const s = o;
    for (const [g, st, c] of list) {
      pos.set(g.attributes.position.array.subarray(st * 3, (st + c) * 3), o * 3);
      nor.set(g.attributes.normal.array.subarray(st * 3, (st + c) * 3), o * 3);
      uv.set(g.attributes.uv.array.subarray(st * 2, (st + c) * 2), o * 2); o += c;
    }
    if (o > s) out.addGroup(s, o - s, mi);
  });
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geos.forEach((g) => g.dispose());
  return out;
}

// A line of text (with *key* words) as glass. Returns { root, words: [{ text, key, group, x, width }], width, height }.
// root is centred on its em box; each word group sits at its own middle (x) so it can turn alone. No bevel: joined Arabic letters are
// separate outlines that touch, and a bevel would cut a groove at every join.
export async function glassText(brand, text, { size, weight = 800, depth = size * 0.32, mats }) {
  const ws = marks(text, 'the glass text'), plain = ws.map((w) => w.w).join(' ');
  const sh = await shapeText({ fontUrl: brand.fonts.display.file, text: plain, size, dir: brand.dir === 'ltr' ? 'ltr' : 'rtl', wght: weight });
  const cx = sh.width / 2, cy = (sh.ascent - sh.descent) / 2, root = new THREE.Group(), words = [];
  sh.words.forEach((sw, wi) => {
    const key = !!ws[wi]?.key, mx = (sw.x0 + sw.x1) / 2 - cx, geos = [];
    for (const gi of sw.ids) {
      const g = sh.glyphs[gi]; if (!g.d) continue;
      const shapes = solids(shapePath(g.d)); if (!shapes.length) continue;
      const geo = new THREE.ExtrudeGeometry(shapes, { depth, curveSegments: 6, bevelEnabled: false });
      geo.translate(g.x - cx - mx, -g.y - cy, -depth / 2); geos.push(geo);
    }
    const group = new THREE.Group(); group.position.x = mx;
    if (geos.length) group.add(new THREE.Mesh(merge(geos), mats(key ? 'key' : 'clear')));
    root.add(group); words.push({ text: sw.text, key, group, x: mx, width: sw.x1 - sw.x0 });
  });
  return { root, words, width: sh.width, height: sh.ascent + sh.descent, size };
}

// ---------- the signature moves ----------
// A pane turns into the light: it starts edge-on, set back, and swings to face the camera. dir = +1 for right-to-left brands.
export function turnIn(obj, p, dir = 1, base = { z: 0, yaw: 0.09 }) {
  const e = land(p);
  obj.visible = p > 0;
  obj.rotation.y = dir * ((1 - e) * 1.35 + (base.yaw ?? 0));
  obj.position.z = (base.z ?? 0) - (1 - e) * 280;
  return e;
}
// …and turns on past it to leave, faster.
export function turnOut(obj, p, dir = 1) {
  if (p <= 0) return;
  const e = away(p);
  obj.rotation.y = -dir * e * 1.5; obj.position.z -= e * 200;
  if (p >= 1) obj.visible = false;
}

// The light band that crosses the studio between scenes. J = the joint's length. A scene that follows another sees the band's second
// half at its start (u = t), every scene sees its first half at its end (u = t - (d - J)). Returns the band's screen x (or null) and its strength.
export function sweep(t, d, J, W, first) {
  const at = (u) => (u < -0.5 || u > J + 0.5 ? null : W + 570 - (u / J) * (W + 1140));
  const a = first ? null : at(t), b = at(t - (d - J));
  const x = a ?? b; if (x == null) return { x: -9999, k: 0 };
  return { x, k: 1 };
}

// ---------- the logo as glass ----------
// brand.logo.path may use any SVG command, arcs included (three3d's logo3d does not read arcs, so a round logo came out empty):
// here it is rewritten as absolute M L C Z, arcs as cubic curves, then nested into solids with holes (logos are even-odd).
function absolutePath(d) {
  const t = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) || []; let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0, prev = ''; const out = [];
  const n = () => +t[i++], f = (v) => +v.toFixed(3);
  const arc = (x1, y1, rx, ry, phi, fa, fs, x2, y2) => {
    if (!rx || !ry) { out.push(`L${f(x2)},${f(y2)}`); return; }
    rx = Math.abs(rx); ry = Math.abs(ry); const c = Math.cos(phi), s = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, x1p = c * dx + s * dy, y1p = -s * dx + c * dy;
    const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den)), cxp = k * rx * y1p / ry, cyp = -k * ry * x1p / rx;
    const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const a1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry); let da = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fs && da > 0) da -= 2 * Math.PI; if (fs && da < 0) da += 2 * Math.PI;
    const segs = Math.ceil(Math.abs(da) / (Math.PI / 2)), h = da / segs, kk = 4 / 3 * Math.tan(h / 4);
    const P = (a) => [cx + rx * Math.cos(a) * c - ry * Math.sin(a) * s, cy + rx * Math.cos(a) * s + ry * Math.sin(a) * c];
    const Dv = (a) => [-rx * Math.sin(a) * c - ry * Math.cos(a) * s, -rx * Math.sin(a) * s + ry * Math.cos(a) * c];
    for (let j = 0; j < segs; j++) {
      const a = a1 + j * h, b = a + h, [p0x, p0y] = P(a), [p1x, p1y] = P(b), [d0x, d0y] = Dv(a), [d1x, d1y] = Dv(b);
      out.push(`C${f(p0x + kk * d0x)},${f(p0y + kk * d0y)} ${f(p1x - kk * d1x)},${f(p1y - kk * d1y)} ${f(p1x)},${f(p1y)}`);
    }
  };
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { out.push('Z'); x = sx; y = sy; prev = 'Z'; continue; }
    if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; out.push(`M${f(x)},${f(y)}`); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { x = ox + n(); y = oy + n(); out.push(`L${f(x)},${f(y)}`); }
    else if (C === 'H') { x = ox + n(); out.push(`L${f(x)},${f(y)}`); }
    else if (C === 'V') { y = oy + n(); out.push(`L${f(x)},${f(y)}`); }
    else if (C === 'C' || C === 'S') {
      const a = C === 'C' ? [ox + n(), oy + n()] : (prev === 'C' || prev === 'S' ? [2 * x - px, 2 * y - py] : [x, y]);
      const b = [ox + n(), oy + n()], e = [ox + n(), oy + n()];
      out.push(`C${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(e[0])},${f(e[1])}`); px = b[0]; py = b[1]; x = e[0]; y = e[1];
    } else if (C === 'Q' || C === 'T') {
      const a = C === 'Q' ? [ox + n(), oy + n()] : (prev === 'Q' || prev === 'T' ? [2 * x - px, 2 * y - py] : [x, y]), e = [ox + n(), oy + n()];
      out.push(`Q${f(a[0])},${f(a[1])} ${f(e[0])},${f(e[1])}`); px = a[0]; py = a[1]; x = e[0]; y = e[1];
    } else if (C === 'A') {
      const rx = n(), ry = n(), rot = n() * Math.PI / 180, fa = n(), fs = n(), ex = ox + n(), ey = oy + n();
      arc(x, y, rx, ry, rot, fa, fs, ex, ey); x = ex; y = ey;
    } else i++;
    prev = C;
  }
  return out.join(' ');
}
export function logoGlass(brand, { size, depth, material }) {
  const L = brand.logo, k = size / (L.box || 256);
  const geo = new THREE.ExtrudeGeometry(nested(shapePath(absolutePath(L.path))), { depth: depth / k, curveSegments: 16, bevelEnabled: false });
  geo.center();
  const mesh = new THREE.Mesh(geo, material); mesh.scale.set(k, k, k);
  const g = new THREE.Group(); g.add(mesh); return g;
}
// logos are even-odd: a contour inside an odd number of others is a hole of the smallest one around it
function nested(sp) {
  const polys = sp.subPaths.map((s) => ({ s, pts: s.getPoints(16) })).filter((p) => p.pts.length > 2);
  const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  polys.forEach((p) => { p.area = Math.abs(THREE.ShapeUtils.area(p.pts)); });
  polys.forEach((p) => { p.parents = polys.filter((q) => q !== p && q.area > p.area && inside(p.pts[0], q.pts)); });
  const shapes = new Map();
  for (const p of polys.filter((p) => p.parents.length % 2 === 0)) { const sh = new THREE.Shape(); sh.curves = p.s.curves; shapes.set(p, sh); }
  for (const p of polys.filter((p) => p.parents.length % 2 === 1)) {
    const host = p.parents.filter((q) => shapes.has(q)).sort((a, b) => a.area - b.area)[0]; if (!host) continue;
    const h = new THREE.Path(); h.curves = p.s.curves; shapes.get(host).holes.push(h);
  }
  return [...shapes.values()];
}
