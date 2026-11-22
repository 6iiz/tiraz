// Orbit-intel motion. Two layers, two truths: the picture (the satellite view, graded to an analyst's grey) and the annotations
// (thin hairlines, caption plates, one reticle). Annotations are drawn, never faded in: a hairline grows along its length, a caption
// plate opens from the reading side, words settle with a short offset. The key phrase is locked on: a reticle (a full hairline box
// with four crosshair ticks) leaves a target on the ground and flies onto the phrase, tightening as it lands.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;
export const snap = (p) => 1 - (1 - clamp(p)) ** 6;
export const inC = (p) => clamp(p) ** 2.4;

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255); };
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  let key = accent;
  for (let k = 0; k <= 1.001 && contrast(key, dark) < 4.6; k += 0.05) key = mix(accent, light, k);
  return { dark, light, accent, key, grey: mix(light, dark, 0.4), hair: rgba(light, 0.55), plate: rgba(dark, 0.86) };
}

export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++ });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on one row are one phrase and get one reticle.
export function runs(boxes) {
  const rs = []; let cur = null;
  for (const b of boxes) {
    if (!b.key) { cur = null; continue; }
    if (cur && cur.row === b.row && cur.last === b.i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = b.i; }
    else { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, last: b.i }; rs.push(cur); }
  }
  return rs;
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o); if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w, size: f.size, minScale: 1, minPx: 0 });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g;
  }
  return best;
}

// A caption plate: dark glass over the picture with a hairline edge and corner ticks, opened from the reading side. p 0..1.
export function plate(ctx, pal, x0, y0, x1, y1, p, rtl) {
  if (p <= 0) return;
  const e = snap(p), w = (x1 - x0) * e, xa = rtl ? x1 - w : x0;
  ctx.fillStyle = pal.plate; ctx.fillRect(xa, y0, w, y1 - y0);
  ctx.fillStyle = pal.hair; ctx.fillRect(xa, y0, w, 1.5); ctx.fillRect(xa, y1 - 1.5, w, 1.5);
  if (e > 0.98) {
    ctx.fillStyle = pal.light; const L = 16;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) { ctx.fillRect(x, y - (sy < 0 ? 2 : 0), L * sx, 2); ctx.fillRect(x - (sx < 0 ? 2 : 0), y, 2, L * sy); }
  }
}

// The reticle: a hairline box with four crosshair ticks. box { x0, x1, y0, y1 }.
export function reticle(ctx, b, color, lw = 2, tick = 16, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
  const mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2; ctx.beginPath();
  ctx.moveTo(mx, b.y0); ctx.lineTo(mx, b.y0 - tick); ctx.moveTo(mx, b.y1); ctx.lineTo(mx, b.y1 + tick);
  ctx.stroke(); ctx.restore();
}
// Lock-on: the reticle travels from a small box on the ground target (gx, gy) to the phrase box, tightening as it lands.
// p 0..1. Leaves a hairline tether from the phrase back to the target while held.
export function lockOn(ctx, pal, run, size, target, p, tether = 1, hold = 1, pad = size * 0.14) {
  if (p <= 0) return;
  const px = pad, to = { x0: run.x0 - px, x1: run.x1 + px, y0: run.y - size * 0.66, y1: run.y + size * 0.72 };
  const e = snap(p), g = 46, from = { x0: target.x - g, x1: target.x + g, y0: target.y - g, y1: target.y + g };
  const L = (a, b) => a + (b - a) * e, over = (1 - e) * 22;
  const b = { x0: L(from.x0, to.x0) - over, x1: L(from.x1, to.x1) + over, y0: L(from.y0, to.y0) - over, y1: L(from.y1, to.y1) + over };
  if (e > 0.6 && tether > 0) {                                  // the tether to the ground target
    ctx.save(); ctx.globalAlpha = tether * clamp((e - 0.6) / 0.4); ctx.strokeStyle = pal.key; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo((to.x0 + to.x1) / 2, to.y1 + 16); ctx.lineTo(target.x, target.y - 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(target.x, target.y, 12, 0, 6.283); ctx.stroke(); ctx.fillStyle = pal.key; ctx.fillRect(target.x - 2, target.y - 2, 4, 4); ctx.restore();
  }
  reticle(ctx, b, pal.key, 2.5, 14 + (1 - e) * 20, Math.min(1, p * 4) * hold);
}

// Words of an annotation settle in one after another: a short slide against the reading direction and a 0.1 s opacity helper.
// Returns nothing; draws through kit.drawText so every row is measured.
export function settle(kit, ctx, f, at, t, t0, step, dur, color, key) {
  kit.drawText(ctx, f, { ...at, color, key, each: (w, i, box, c) => {
    const p = clamp((t - t0 - i * step) / dur); if (p <= 0) return false;
    const e = snap(p); c.globalAlpha *= clamp(p / 0.35); c.translate((kit.rtl ? -1 : 1) * 16 * (1 - e), 0);
  } });
}
// The plate's open/close as one number for clipping: open over [t0, t0+open], close over [t1, t1+close] toward the reading side.
export function plateP(t, t0, open, t1, close) { return t < t1 ? clamp((t - t0) / open) : 1 - inC((t - t1) / close); }
