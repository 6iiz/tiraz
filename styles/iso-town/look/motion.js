// Iso-town motion: a pop-up picture book. Things are not slid in, they unfold: a word stands up off the page, hinged on its baseline;
// a house stands up off its footprint; an awning unrolls down from its rail; a roof lifts like a paper flap. One soft curve, calm, no
// bounce. People walk at a walking pace and bob a little with each step. This file also holds the drawing kit every part shares: the
// palette (three paper tones per colour), the isometric projection, houses, trees, people, the awning and the key runs.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const S = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
export const C30 = Math.cos(Math.PI / 6);
// Grid point (x, y, z) in units -> screen. x runs down-right, y runs down-left, z runs up. (ox, oy) is where (0, 0, 0) lands.
export const project = (ox, oy, u) => (x, y, z = 0) => [ox + (x - y) * C30 * u, oy + (x + y) * 0.5 * u - z * u];

const lum = (c) => contrast(c, '#000000');
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const paper = mix(light, dark, T.tone.paper);
  const readable = (fg, k, against = paper) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  const three = (base) => ({ top: mix(base, light, 0.32), left: base, right: mix(base, dark, 0.22) });
  const onAccent = contrast(accent, light) >= contrast(accent, dark) ? light : dark;
  return {
    light, dark, accent, paper, readable, three, onAccent,
    ink: dark, muted: readable(dark, T.tone.muted),
    tile: mix(paper, dark, 0.07), path: mix(paper, dark, 0.05),
    walls: [mix(light, dark, 0.06), mix(light, accent, 0.2), mix(light, dark, 0.16), mix(accent, light, 0.6), mix(light, dark, 0.1)].map(three),
    roofs: [accent, mix(accent, dark, 0.28), mix(dark, light, 0.38), mix(accent, light, 0.32), mix(dark, light, 0.55)].map(three),
    glass: mix(dark, light, 0.3), lit: mix(accent, light, 0.55), door: mix(dark, light, 0.25),
    crown: three(mix(mix(dark, light, 0.42), accent, 0.22)), trunk: mix(dark, light, 0.3),
    coats: [accent, mix(dark, light, 0.32), mix(accent, dark, 0.3), mix(light, dark, 0.45), mix(accent, light, 0.35)],
    hair: mix(dark, light, 0.12), shadow: 'rgba(0,0,0,0.13)', awnEdge: mix(accent, dark, 0.3),
  };
}

const poly = (ctx, pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
// A house: walls w (along x) by d (along y), h high, a gable roof with its ridge along x, rh above the eaves. P: a projection.
// grow (0..1) unfolds it up off its footprint; lift (0..1) raises the roof off like a paper flap, hinged on its back eave.
export function house(ctx, P, w, d, h, rh, wall, roof, o = {}) {
  const grow = o.grow ?? 1, lift = o.lift ?? 0; if (grow <= 0) return;
  const hz = h * grow, rz = rh * grow;
  poly(ctx, [P(0.3, d + 0.3), P(w + 0.3, d + 0.3), P(w + 1.4, d - 0.2), P(w + 1.4, 0.4), P(w, 0)], 'rgba(0,0,0,0.10)');   // shadow on the page
  poly(ctx, [P(w, 0, 0), P(w, d, 0), P(w, d, hz), P(w, 0, hz)], wall.right);
  poly(ctx, [P(0, d, 0), P(w, d, 0), P(w, d, hz), P(0, d, hz)], wall.left);
  if (grow > 0.6) {
    const k = clamp((grow - 0.6) / 0.4);
    for (let i = 0; i < (o.windows ?? Math.floor(w / 1.6)); i++) {        // windows and a door on the front, a window on the side
      const a = 0.5 + i * 1.6; if (a + 0.8 > w - 0.3) break;
      const door = i === (o.doorAt ?? 1) && h >= 2;
      const z0 = door ? 0 : h * 0.45, zz = door ? Math.min(h * 0.62, 1.7) : Math.min(1, h * 0.3);
      poly(ctx, [P(a, d, z0 * k), P(a + 0.8, d, z0 * k), P(a + 0.8, d, (z0 + zz) * k), P(a, d, (z0 + zz) * k)], door ? roof.right : (o.lit && i % 2 ? o.lit : o.glass));
    }
    for (let b = 0.6; b + 0.8 < d - 0.3; b += 1.8) poly(ctx, [P(w, b, h * 0.45 * k), P(w, b + 0.8, h * 0.45 * k), P(w, b + 0.8, (h * 0.45 + Math.min(1, h * 0.3)) * k), P(w, b, (h * 0.45 + Math.min(1, h * 0.3)) * k)], o.glass);
  }
  if (o.inside && lift > 0) poly(ctx, [P(0, 0, hz), P(w, 0, hz), P(w, d, hz), P(0, d, hz)], o.inside);   // the floor seen from above
  ctx.save();
  if (lift > 0) { const [hx, hy] = P(w / 2, d / 2, hz + rz); ctx.translate(hx - 250 * lift, hy - 90 * lift); ctx.rotate(-0.2 * lift); ctx.translate(-hx, -hy); }
  poly(ctx, [P(-0.25, -0.2, hz), P(w + 0.25, -0.2, hz), P(w + 0.25, d / 2, hz + rz), P(-0.25, d / 2, hz + rz)], roof.top);
  poly(ctx, [P(w, 0, hz), P(w, d, hz), P(w, d / 2, hz + rz)], wall.right);
  poly(ctx, [P(-0.25, d + 0.2, hz), P(w + 0.25, d + 0.2, hz), P(w + 0.25, d / 2, hz + rz), P(-0.25, d / 2, hz + rz)], roof.left);
  poly(ctx, [P(w + 0.25, d / 2, hz + rz), P(w + 0.25, d + 0.2, hz), P(w + 0.25, d + 0.35, hz - 0.15), P(w + 0.25, d / 2, hz + rz - 0.15)], roof.right);
  ctx.restore();
}
export function tree(ctx, x, y, s, pal, grow = 1) {
  if (grow <= 0) return;
  const g = grow;
  ctx.fillStyle = pal.shadow; ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 2 * s, 20 * s, 8 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = pal.trunk; ctx.fillRect(x - 3 * s, y - 26 * s * g, 6 * s, 26 * s * g);
  const cy = y - 46 * s * g, r = 24 * s * g;
  ctx.fillStyle = pal.crown.right; ctx.beginPath(); ctx.arc(x, cy, r, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r, 0, 7); ctx.clip(); ctx.fillStyle = pal.crown.left; ctx.beginPath(); ctx.arc(x - r * 0.25, cy - r * 0.2, r, 0, 7); ctx.fill();
  ctx.fillStyle = pal.crown.top; ctx.beginPath(); ctx.arc(x - r * 0.45, cy - r * 0.45, r * 0.55, 0, 7); ctx.fill(); ctx.restore();
}
// A small person seen from behind: no face, no hands. step: the walk phase (radians); 0 stands still.
export function person(ctx, x, y, s, coat, pal, step = 0, grow = 1) {
  if (grow <= 0) return;
  const bob = step ? Math.abs(Math.sin(step)) * 2 * s : 0, sw = step ? Math.sin(step) * 3 * s : 0;
  ctx.fillStyle = pal.shadow; ctx.beginPath(); ctx.ellipse(x + 2 * s, y, 10 * s, 4 * s, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(1, grow); ctx.translate(0, -bob);
  ctx.fillStyle = pal.hair; ctx.fillRect(-5 * s + sw, -12 * s, 4 * s, 12 * s); ctx.fillRect(1 * s - sw, -12 * s, 4 * s, 12 * s);
  ctx.fillStyle = coat; ctx.beginPath(); ctx.roundRect(-8 * s, -36 * s, 16 * s, 26 * s, [7 * s, 7 * s, 3 * s, 3 * s]); ctx.fill();
  ctx.fillStyle = pal.hair; ctx.beginPath(); ctx.arc(0, -43 * s, 7.5 * s, 0, 7); ctx.fill();
  ctx.restore();
}
// The awning behind one key run: a rail, then the cloth unrolls down from it with a scalloped edge. p: 0..1.
export function awning(ctx, box, size, p, pal) {
  if (p <= 0) return;
  const pad = size * 0.16, x = box.x0 - pad, w = box.x1 - box.x0 + pad * 2, top = box.y - size * 0.64, full = size * 1.22, h = full * E(p);
  ctx.fillStyle = pal.awnEdge; ctx.fillRect(x - 6, top - 8, w + 12, 9);
  const n = Math.max(3, Math.round(w / (size * 0.42))), sw = w / n, r = sw / 2;
  ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, top); ctx.lineTo(x + w, top + h);
  for (let i = n - 1; i >= 0; i--) ctx.arc(x + i * sw + r, top + h, r, 0, Math.PI, false);
  ctx.closePath(); ctx.fill();
}
// A word stands up off the page, hinged on its baseline.
export function unfold(ctx, p, box, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const base = box.y + size * 0.42, s = E(p);
  ctx.globalAlpha *= clamp(p * 4); ctx.translate(0, base); ctx.scale(1, Math.max(0.02, s)); ctx.translate(0, -base);
}
export function keyRuns(f, { x0, x1, y, align = 'start' }, rtl) {
  const out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (!run) { run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index }; out.push(run); } else { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); } }
      else run = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
  });
  return out;
}
export const stagger = (n, step, len, room = 0.72) => (n <= 1 ? 0 : Math.min(step, Math.max(0.02, (room - len) / (n - 1))));
