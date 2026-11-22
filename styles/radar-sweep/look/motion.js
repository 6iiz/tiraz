// Radar Sweep motion: things are not placed, they are *found*. A ping (a thin ring) leaves the scope's centre and runs outward; each
// word exists only from the moment the ring reaches it, arriving as a bright return that settles to a steady echo. The thing being looked
// for (the key phrase) is the one warm contact: it is set in the accent and a lock closes on it. Leaving, echoes decay. Everything is
// a function of time: the sweep angle, the ping radius, the decay.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const bgDark = contrast(bg, '#000000') <= contrast(text, '#000000');
  const dark = bgDark ? bg : text, light = bgDark ? text : bg;
  // the target colour for text: the accent itself when it reads on the dark scope (4.5:1), else the accent lifted toward the light colour
  // just enough to read
  let k = 0; while (k < 1 && contrast(mix(accent, light, k), dark) < 4.5) k += 0.05;
  const accentReads = k === 0, targetText = mix(accent, light, Math.min(1, k));
  return {
    dark, light, accent, accentReads, rgba,
    scope: mix(dark, light, 0.03), ring: mix(dark, light, 0.2), ringHi: mix(dark, light, 0.4),
    echo: mix(dark, light, 0.86), soft: mix(dark, light, 0.62), lost: mix(dark, light, 0.4),
    target: targetText,
  };
}

// The ping: radius (px) at time t of a ring sent at t0. speed px/s.
export const pingR = (t, t0, speed) => (t < t0 ? -1 : (t - t0) * speed);

// A return: 0 before the ring reaches distance r, then 1, with a flare (0..1) that decays after the hit.
export function ret(t, t0, speed, r, tau = 0.28) {
  const hit = t0 + r / speed;
  if (t < hit) return { on: 0, flare: 0, hit };
  return { on: 1, flare: Math.exp(-(t - hit) / tau), hit };
}

// Draw the ping ring itself: a thin bright circle, fading as it travels.
export function ping(ctx, pal, cx, cy, R, maxR) {
  if (R <= 0 || R > maxR) return;
  const a = 1 - R / maxR;
  ctx.save(); ctx.strokeStyle = pal.light; ctx.globalAlpha = 0.55 * a; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.18 * a; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, R - 10), 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Boxes of each run of consecutive key words (one box per run per row), laid out exactly as kit.drawText lays the words.
export function keyRuns(f, { x0, x1, y, align = 'start', rtl }) {
  const out = []; let idx = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) {
        if (!run) run = { a: wl, b: wl + w.width, y: yy, i0: idx, i1: idx, size: f.size };
        else { run.a = Math.min(run.a, wl); run.b = Math.max(run.b, wl + w.width); run.i1 = idx; }
      } else if (run) { out.push(run); run = null; }
      cur = rtl ? wl - f.space : wl + w.width + f.space; idx++;
    }
    if (run) out.push(run);
  });
  return out.map((r) => ({ x: r.a, w: r.b - r.a, y: r.y, i0: r.i0, i1: r.i1, size: r.size }));
}

// Centres of every word of a fitted text, in order (to know when the ping reaches each).
export function wordCentres(f, { x0, x1, y, align = 'start', rtl }) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl + w.width / 2, y: yy }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// The lock: four accent corner brackets close in on a box. p 0..1. When the accent cannot be read as text on the scope, the key words
// take the accent lifted toward the light colour (pal.target) and the lock itself stays the pure accent.
export function lock(ctx, pal, x, y, w, h, p) {
  if (p <= 0) return;
  const k = 1 - outC(p), gx = k * 70, gy = 10 + k * 40, L = Math.min(28, w / 3);
  const X = x - gx, Y = y - gy, Wd = w + gx * 2, Hd = h + gy * 2;
  ctx.save(); ctx.globalAlpha = clamp(p * 2.5); ctx.strokeStyle = pal.accent; ctx.lineWidth = 4; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[X, Y, 1, 1], [X + Wd, Y, -1, 1], [X, Y + Hd, 1, -1], [X + Wd, Y + Hd, -1, -1]]) {
    ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L);
  }
  ctx.stroke();
  ctx.restore();
}

// Draw a word as an echo: `on` gates it, `flare` brightens it and gives it a short glow. Use inside kit.drawText's each().
export function echo(c, r, base, pal, fade = 1) {
  if (!r.on || fade <= 0) return false;
  c.globalAlpha = fade;
  if (r.flare > 0.02) { c.shadowColor = pal.light; c.shadowBlur = 26 * r.flare; return r.flare > 0.5 ? pal.light : base; }
  return base;
}
