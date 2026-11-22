// Assembly-guide motion: a printed instruction sheet. One isometric angle for every drawing, one ink line weight, flat fills with three
// values (top lightest). The accent means "new in this step": a part arrives in the accent along a dotted guide line, lands with a
// click mark, and once it is fitted it turns paper-white like every other part. The only thing that stays in the accent is the key
// phrase, set on a little slab like a part that is new right now. Words slide a short way along the isometric axis and stop; nothing
// bounces, spins or fades through.
import { clamp, lerp, mix, contrast, ease, rgba } from '/engine/kit.js';

export const E = ease.outCubic;
export const C30 = Math.cos(Math.PI / 6), S30 = 0.5;

export function inks(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const paper = lightOf(bg) >= lightOf(text) ? bg : text, ink = paper === bg ? text : bg;
  let k = T.tone.grey, grey = mix(ink, paper, k);
  while (k > 0 && contrast(grey, paper) < 4.6) { k -= 0.03; grey = mix(ink, paper, Math.max(0, k)); }
  return {
    paper, ink, grey, accent,
    left: mix(paper, ink, T.tone.left), right: mix(paper, ink, T.tone.right), rule: mix(paper, ink, 0.18),
    aLeft: mix(accent, ink, 0.22), aRight: mix(accent, ink, 0.42),
    onAccent: contrast(accent, ink) >= contrast(accent, paper) ? ink : paper,
  };
}

// The step number. Scenes are built in order (sequence.js awaits each create), so a counter numbers the steps; it restarts with the
// reel (the first scene has clock 0).
let stepN = 0;
export function nextStep(clock) { if (!(clock > 0)) stepN = 0; return ++stepN; }

// ---------- words ----------
export function boxes(f, x0, x1, y, align, rtl) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, start = rtl ? x1 - row.width : x0, end = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? start : end;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, size: f.size });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
export function keyGroups(bx) {
  const g = [];
  for (const b of bx) {
    if (!b.key) continue;
    const last = g.at(-1);
    if (last && last.row === b.row && last.lastI === b.i - 1) { last.x0 = Math.min(last.x0, b.x); last.x1 = Math.max(last.x1, b.x + b.width); last.lastI = b.i; }
    else g.push({ x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, firstI: b.i, lastI: b.i, size: b.size });
  }
  return g;
}
// A word slides in a short way along the isometric axis that runs down towards the reading side, and stops.
export function arrive(c, p, rtl, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const e = E(p), k = (1 - e) * size * 0.45;
  c.globalAlpha *= clamp(p * 4); c.translate((rtl ? 1 : -1) * -k * C30, -k * S30);
}
// Leaving: the word slides on along the same axis, quicker, and is gone.
export function leave(c, p, rtl, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const e = p * p, k = e * size * 0.6;
  c.globalAlpha *= 1 - clamp(p * 1.4); c.translate((rtl ? 1 : -1) * k * C30, k * S30);
}

// ---------- isometric drawing ----------
// A view: world units (u px each) to screen, origin (ox, oy) on screen. x runs down-right, z down-left, y up.
export function view(ox, oy, u) {
  return (x, y, z) => [ox + (x - z) * C30 * u, oy + (x + z) * S30 * u - y * u];
}
const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
// A box from (x, y, z) with size (w, h, d): top, left (z = max) and right (x = max) faces, fill then one outline per face.
export function box(ctx, V, x, y, z, w, h, d, F, lw) {
  const top = [V(x, y + h, z), V(x + w, y + h, z), V(x + w, y + h, z + d), V(x, y + h, z + d)];
  const left = [V(x, y + h, z + d), V(x + w, y + h, z + d), V(x + w, y, z + d), V(x, y, z + d)];
  const right = [V(x + w, y + h, z), V(x + w, y + h, z + d), V(x + w, y, z + d), V(x + w, y, z)];
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = F.ink;
  for (const [pts, fill] of [[left, F.left], [right, F.right], [top, F.top]]) { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); }
}
// An upright cylinder centred on (x, z), from y to y + h, radius r.
export function cylinder(ctx, V, x, y, z, r, h, F, lw) {
  const [bx, by] = V(x, y, z), [tx, ty] = V(x, y + h, z), rx = Math.SQRT2 * r * C30 * (V(1, 0, 0)[0] - V(0, 0, 0)[0]) / C30, ry = rx * S30 / C30;
  ctx.lineWidth = lw; ctx.strokeStyle = F.ink;
  ctx.beginPath(); ctx.moveTo(tx - rx, ty); ctx.lineTo(bx - rx, by); ctx.ellipse(bx, by, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(tx + rx, ty); ctx.closePath();
  ctx.fillStyle = F.right; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = F.left; ctx.fillRect(tx - rx, ty - ry, rx, by - ty + ry * 2); ctx.restore();
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = F.top; ctx.fill(); ctx.stroke();
}
// Fills for a part: new (accent shades) blending to fitted (paper shades) as `fit` goes 0 -> 1.
export function fills(K, fit) {
  const f = clamp(fit);
  return { ink: K.ink, top: mix(K.accent, K.paper, f), left: mix(K.aLeft, K.left, f), right: mix(K.aRight, K.right, f) };
}
// A dotted guide line.
export function dotted(ctx, x0, y0, x1, y1, color, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 11]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
// The click mark: three short strokes fanning out from a point.
export function click(ctx, x, y, p, color, side = 1, len = 22) {
  if (p <= 0 || p >= 1) return;
  const g = E(clamp(p * 3)), fade = 1 - clamp((p - 0.6) / 0.4);
  ctx.save(); ctx.globalAlpha *= fade; ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (const a of [-0.6, -1.15, -1.7]) {
    const dx = Math.cos(a) * side, dy = Math.sin(a);
    ctx.beginPath(); ctx.moveTo(x + dx * 12, y + dy * 12); ctx.lineTo(x + dx * (12 + len * g), y + dy * (12 + len * g)); ctx.stroke();
  }
  ctx.restore();
}
// A flat arrow pointing down (the way a part goes), its tip at (x, y).
export function arrowDown(ctx, x, y, len, p, K) {
  if (p <= 0) return;
  const l = len * E(p), w = 26;
  ctx.save(); ctx.fillStyle = K.paper; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w, y - w); ctx.lineTo(x - w * 0.42, y - w); ctx.lineTo(x - w * 0.42, y - l); ctx.lineTo(x + w * 0.42, y - l);
  ctx.lineTo(x + w * 0.42, y - w); ctx.lineTo(x + w, y - w); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
// The key phrase's slab: a flat plate of the accent with a little thickness, outlined in ink. It drops in along two dotted guides and
// clicks into place. p: 0..1 of the drop. Returns the vertical offset still to go (the words on it ride with it).
export function slab(ctx, g, p, K, T, rtl) {
  if (p <= 0) return null;
  const pad = g.size * 0.08, x = g.x0 - pad, y = g.y - g.size * 0.62, w = g.x1 - g.x0 + pad * 2, h = g.size * 1.24;
  const dz = T.slab, dx = 0, dy = dz, off = -(1 - E(p)) * 150;
  if (p < 1) { dotted(ctx, x, y + off, x, y, K.ink, 0.6); dotted(ctx, x + w, y + off, x + w, y, K.ink, 0.6); }
  ctx.save(); ctx.translate(0, off); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = K.ink;
  const front = [[x, y + h], [x + w, y + h], [x + w + dx, y + h + dy], [x + dx, y + h + dy]];
  const side = rtl ? [[x, y], [x, y + h], [x + dx, y + h + dy], [x + dx, y + dy]] : [[x + w, y], [x + w, y + h], [x + w + dx, y + h + dy], [x + w + dx, y + dy]];
  poly(ctx, front); ctx.fillStyle = K.aLeft; ctx.fill(); ctx.stroke();
  poly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); ctx.fillStyle = K.accent; ctx.fill(); ctx.stroke();
  ctx.restore();
  return off;
}
// The step number: a heavy numeral on the reading side with a short rule beside it.
export function stepNumber(ctx, kit, n, x, y, size, color, p, rtl) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(0, (1 - E(p)) * -24);
  kit.number(ctx, String(n), { x, y, size, weight: 900, color, align: rtl ? 'right' : 'left' });
  ctx.restore();
}
export { rgba, lerp, clamp };

// ---------- the build that grows through the reel ----------
// A base plate and the parts fitted on it, one per step: by step n, parts 0..n-2 are fitted (paper-white) and part n-1 arrives in
// the accent along a dotted guide, clicks, and turns white. Footprints are in plate units (the plate is 6 x 3).
const PARTS = [
  { k: 'box', x: 0.2, z: 0.2, w: 1.8, h: 1.0, d: 1.0 },
  { k: 'cyl', x: 2.7, z: 0.7, r: 0.45, h: 1.3 },
  { k: 'box', x: 3.6, z: 0.2, w: 1.0, h: 1.8, d: 1.0 },
  { k: 'box', x: 0.3, z: 1.7, w: 1.2, h: 0.6, d: 1.1 },
  { k: 'box', x: 4.9, z: 0.3, w: 0.9, h: 0.8, d: 1.4 },
  { k: 'cyl', x: 2.5, z: 2.2, r: 0.5, h: 0.8 },
  { k: 'box', x: 3.5, z: 1.9, w: 2.3, h: 0.45, d: 0.9 },
];
export function rig(W, T, K) {
  const u = T.unit, ox = W / 2 - 1.5 * C30 * u, oy = T.rigY - 2.25 * S30 * u * 2 + 40, V = view(ox, oy, u);
  const order = PARTS.map((p, i) => ({ ...p, i, depth: (p.k === 'box' ? p.x + p.w / 2 + p.z + p.d / 2 : p.x + p.z) })).sort((a, b) => a.depth - b.depth);
  const plate = { ink: K.ink, top: K.paper, left: K.left, right: K.right };
  return {
    V,
    // n: this step's number; t: scene time; t0: when the new part starts to drop
    draw(ctx, n, t, t0) {
      const lw = T.lw, have = Math.min(n, PARTS.length);
      box(ctx, V, 0, -0.35, 0, 6, 0.35, 3, plate, lw);
      const drop = clamp((t - t0) / 0.45), fit = clamp((t - t0 - 0.95) / 0.25);
      let landed = null;
      for (const p of order) {
        if (p.i >= have) continue;
        const isNew = p.i === have - 1;
        if (isNew && drop <= 0) continue;
        const lift = isNew ? (1 - E(drop) ** 1) * 3.2 : 0, F = fills(K, isNew ? fit : 1);
        const top = p.h + lift, cx = p.k === 'box' ? p.x + p.w / 2 : p.x, cz = p.k === 'box' ? p.z + p.d / 2 : p.z;
        if (isNew && drop < 1) { const [ax, ay] = V(cx, top + 0.1, cz), [bx, by] = V(cx, 6, cz); dotted(ctx, ax, ay, bx, by, K.ink, 0.7); }
        if (p.k === 'box') box(ctx, V, p.x, lift, p.z, p.w, p.h, p.d, F, lw); else cylinder(ctx, V, p.x, lift, p.z, p.r, p.h, F, lw);
        if (isNew) landed = { cx, cz, top: p.h, side: p.k === 'box' ? p.x + p.w : p.x + p.r };
      }
      if (landed) {
        const [lx, ly] = V(landed.side, 0, landed.cz);
        click(ctx, lx + 8, ly - 6, (t - t0 - 0.45) / 0.6, K.ink, 1);
        const [ax, ay] = V(landed.cx, landed.top + 0.9, landed.cz);
        if (drop < 1) arrowDown(ctx, ax + 70, ay, 90, clamp((t - t0) / 0.2) * (1 - clamp((drop - 0.8) / 0.2)), K);
      }
    },
  };
}
