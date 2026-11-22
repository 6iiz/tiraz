// Clear-showcase motion and the glass. A dark-field studio: one fictional object of clear glass floats in black, read only by its edges.
// Long strip lights behind it draw a thin bright rim around the silhouette, a split of the accent at the rim plays the part of
// dispersion, and one tall strip (the sweep) crosses behind the object now and then, seen bent and brighter through the glass. Inside the
// glass sit opaque parts: a light-guide ring with a comet of the accent running round it, a small core. Everything moves slowly and lands
// precisely; words arrive by a focus pull (a short fade, a settle in scale), never by sliding far.
import { clamp, ease, mix, rgba, contrast, rr, span, lerp } from '/engine/kit.js';

export const IO = ease.inOutCubic, E = ease.outQuart;

export function tones(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  const field = mix(dark, '#000000', T.tone.black);
  let k = T.tone.grey, grey = mix(light, field, k);
  while (contrast(grey, field) < 4.6 && k > 0) { k -= 0.04; grey = mix(light, field, Math.max(0, k)); }
  const frost = mix(field, light, T.tone.frost);
  // the key phrase: accent letters on frost when they read; otherwise light letters on a frost tinted with as much accent as still reads
  const keyText = contrast(accent, frost) >= 4.5 ? accent : light;
  let ka = 0.6, keySlab = frost;
  if (keyText === light) { while (ka > 0.1 && contrast(light, mix(field, accent, ka)) < 4.6) ka -= 0.04; keySlab = mix(field, accent, ka); }
  return { light, dark, accent, field, grey, frost, keyText, keySlab, glow: mix(accent, light, 0.45), metal: mix(field, light, 0.32), a: (c, x) => rgba(c, x) };
}

export function keySpans(f, x0, x1, y, align, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left, open = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (open) { open.x0 = Math.min(open.x0, wl); open.x1 = Math.max(open.x1, wl + w.width); } else { open = { x0: wl, x1: wl + w.width, y: yy, row: r }; out.push(open); } }
      else open = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}

// A word arrives by a focus pull: it settles from 4% larger and a few pixels low while it fades up over the first third.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  const e = IO(p), cx = box.x + box.width / 2, s = 1 + 0.04 * (1 - e);
  ctx.globalAlpha *= clamp(p * 2.5); ctx.translate(cx, box.y + 8 * (1 - e)); ctx.scale(s, s); ctx.translate(-cx, -box.y);
}

// Where the sweep light is, from the reel's clock: it crosses the studio once every `period` seconds (x in frame pixels, or null).
export function sweepX(time, W, period = 4.5) { const p = (time % period) / 1.6; return p > 1 ? null : lerp(-260, W + 260, IO(p)); }

// A frosted slab behind a key phrase: an opaque frost of the field, a hairline rim, and a lit edge of the accent along its top.
export function frost(ctx, P, s, f, p, time, W) {
  if (p <= 0) return;
  const pad = Math.min(f.size * 0.22, f.space * 0.6) + 6, h = f.size * 1.32, x = s.x0 - pad, w = s.x1 - s.x0 + pad * 2, y = s.y - h / 2 + f.size * 0.04;
  ctx.save(); ctx.globalAlpha *= IO(p);
  ctx.fillStyle = P.keySlab; rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = P.a(P.light, 0.28); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.shadowColor = P.accent; ctx.shadowBlur = 18; ctx.fillStyle = P.accent; ctx.fillRect(x + 14, y - 1, (w - 28) * IO(p), 3);
  ctx.restore();
}

// ---------- projection ----------
const FOCAL = 1500;
function rot(p, yaw, pitch) {
  const [x, y, z] = p, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;          // yaw about the vertical axis
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];               // pitch about the horizontal axis
}
const proj = (p, cx, cy) => { const k = FOCAL / (FOCAL + p[2]); return [cx + p[0] * k, cy - p[1] * k]; };
function hull(pts) {
  const a = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]), cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const lo = [], up = [];
  for (const p of a) { while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), p) <= 0) lo.pop(); lo.push(p); }
  for (const p of a.reverse()) { while (up.length >= 2 && cross(up.at(-2), up.at(-1), p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
function roundedSquare(s, r, z, n = 10) {
  const out = [], h = s / 2 - r;
  for (const [cx, cy, a0] of [[h, h, 0], [-h, h, 90], [-h, -h, 180], [h, -h, 270]])
    for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
  return out;
}

// The rim of a glass silhouette: a split of the accent either side (dispersion), then the thin bright line itself.
function rim(ctx, P, pts, k = 1) {
  ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(2.6 * k, 0.8 * k); poly(ctx, pts); ctx.strokeStyle = P.a(P.accent, 0.75); ctx.lineWidth = 2.4 * k; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(-2.4 * k, -0.6 * k); poly(ctx, pts); ctx.strokeStyle = P.a(P.glow, 0.55); ctx.lineWidth = 2 * k; ctx.stroke(); ctx.restore();
  poly(ctx, pts); ctx.strokeStyle = P.a(P.light, 0.92); ctx.lineWidth = 2 * k; ctx.stroke();
}

// The hero: a thick rounded slab of clear glass at (cx, cy), `size` across, turned by yaw/pitch. Inside: a light-guide ring with a comet
// of the accent (energy 0..1 sets its brightness, phase its place), and `inner(ctx)` drawn on the slab's middle plane (an affine map:
// local units, origin at the centre, y down) for a core or the logo. sweep: the sweep's x, seen bent through the glass.
export function slab(ctx, P, { cx, cy, size, depth = size * 0.28, yaw, pitch, energy = 0.5, phase = 0, sweep = null, inner = null, alpha = 1 }) {
  const r = size * 0.2, F = roundedSquare(size, r, depth / 2).map((p) => proj(rot(p, yaw, pitch), cx, cy)), B = roundedSquare(size, r, -depth / 2).map((p) => proj(rot(p, yaw, pitch), cx, cy));
  const Hl = hull(F.concat(B));
  ctx.save(); ctx.globalAlpha *= alpha;
  // the body: almost nothing, a breath of light from above
  const top = Math.min(...Hl.map((p) => p[1])), bot = Math.max(...Hl.map((p) => p[1]));
  const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, P.a(P.light, 0.1)); g.addColorStop(0.5, P.a(P.light, 0.025)); g.addColorStop(1, P.a(P.light, 0.07));
  poly(ctx, Hl); ctx.fillStyle = g; ctx.fill();
  ctx.save(); poly(ctx, Hl); ctx.clip();
  if (sweep !== null) {                                   // the sweep, bent and narrowed by the glass
    const sx = cx + (sweep - cx) * 0.55, sg = ctx.createLinearGradient(sx - 70, 0, sx + 70, 0);
    sg.addColorStop(0, P.a(P.light, 0)); sg.addColorStop(0.5, P.a(P.light, 0.45)); sg.addColorStop(1, P.a(P.light, 0));
    ctx.fillStyle = sg; ctx.fillRect(sx - 70, top, 140, bot - top);
    ctx.fillStyle = P.a(P.accent, 0.25); ctx.fillRect(sx + 40, top, 10, bot - top);
  }
  // inner parts on the middle plane: an affine map from three projected points
  const o = proj(rot([0, 0, 0], yaw, pitch), cx, cy), ex = proj(rot([1, 0, 0], yaw, pitch), cx, cy), ey = proj(rot([0, -1, 0], yaw, pitch), cx, cy);
  ctx.save(); ctx.transform(ex[0] - o[0], ex[1] - o[1], ey[0] - o[0], ey[1] - o[1], o[0], o[1]);
  const R = size * 0.3;
  ctx.lineWidth = size * 0.035; ctx.strokeStyle = P.metal; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = size * 0.008; ctx.strokeStyle = P.a(P.light, 0.5); ctx.beginPath(); ctx.arc(0, 0, R - size * 0.012, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
  if (energy > 0) {                                       // the comet: a head of near white, a tail of the accent
    for (let i = 0; i < 22; i++) {
      const a = phase - i * 0.08, k = (1 - i / 22) ** 1.5 * energy;
      ctx.strokeStyle = i < 2 ? P.a(P.glow, k) : P.a(P.accent, k * 0.9); ctx.lineWidth = size * Math.max(0.008, 0.034 - i * 0.0012); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, R, a - 0.085, a); ctx.stroke();
    }
  }
  if (inner) inner(ctx, size);
  ctx.restore();
  ctx.restore();
  // edges: the back face faint, the front face, the silhouette rim
  poly(ctx, B); ctx.strokeStyle = P.a(P.light, 0.16); ctx.lineWidth = 1.5; ctx.stroke();
  poly(ctx, F); ctx.strokeStyle = P.a(P.light, 0.45); ctx.lineWidth = 1.6; ctx.stroke();
  rim(ctx, P, Hl);
  ctx.restore();
  return { top, bot };
}

// A small opaque core for the slab's middle plane: a dark chip with fine traces of the light colour.
export function core(P) {
  return (ctx, size) => {
    const c = size * 0.17;
    ctx.fillStyle = mix(P.field, P.light, 0.12); rr(ctx, -c / 2, -c / 2, c, c, c * 0.12); ctx.fill();
    ctx.strokeStyle = P.a(P.light, 0.45); ctx.lineWidth = size * 0.005;
    for (let i = -2; i <= 2; i++) { const d = i * c * 0.18; ctx.beginPath(); ctx.moveTo(-c / 2, d); ctx.lineTo(-size * 0.27, d * 1.6); ctx.moveTo(c / 2, d); ctx.lineTo(size * 0.27, d * 1.6); ctx.stroke(); }
  };
}

// The floor: no horizon, only a caustic under the object (an ellipse of the accent, split, soft) and a faint mirrored glow.
export function caustic(ctx, P, cx, y, w, energy) {
  ctx.save(); ctx.translate(cx, y); ctx.scale(1, 0.18);
  for (const [c, a, dr] of [[P.accent, 0.2, 0], [P.glow, 0.12, 14]]) {
    const g = ctx.createRadialGradient(0, 0, w * 0.2, 0, 0, w * 0.55 + dr);
    g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.7, rgba(c, a * (0.4 + 0.6 * energy))); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w * 0.6 + dr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// A thin rim line of glass light along a path from x0 to x1 at y, with the accent split under it.
export function hairline(ctx, P, x0, x1, y, p = 1) {
  if (p <= 0) return;
  const w = (x1 - x0) * p, xm = (x0 + x1) / 2;
  ctx.fillStyle = P.a(P.accent, 0.8); ctx.fillRect(xm - w / 2 + 2, y + 2, w, 2.5);
  ctx.fillStyle = P.a(P.light, 0.9); ctx.fillRect(xm - w / 2, y, w, 2);
}
