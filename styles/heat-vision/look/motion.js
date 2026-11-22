// Heat Vision motion: nothing slides in. Things are already where they belong and *warm up*: a word starts as a soft, mid-ramp smear
// and climbs the brand's heat ramp to its hottest, sharpest state; on the way out it cools back down the ramp and goes. The palette is a
// ramp built only from the brand: cold (its darker colour) → accent → hot (its lighter colour), with mixes between.
import { clamp, mix, contrast } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;
export const inQ = (p) => clamp(p) ** 2;

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

// The brand's heat ramp. cold = the darker of bg/text, hot = the lighter one. lut: 256 [r,g,b] entries for the sensor picture.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const bgDark = contrast(bg, '#000000') <= contrast(text, '#000000');
  const cold = bgDark ? bg : text, hot = bgDark ? text : bg;
  const stops = [cold, mix(cold, hot, 0.13), mix(mix(cold, hot, 0.13), accent, 0.55), accent, mix(accent, hot, 0.55), hot].map(rgb);
  const at = (k) => {
    k = clamp(k) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(k)), f = k - i, a = stops[i], b = stops[i + 1];
    return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * f));
  };
  const lut = []; for (let i = 0; i < 256; i++) lut.push(at(i / 255));
  const css = (k) => { const c = at(k); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  const onAccent = contrast(accent, cold) >= contrast(accent, hot) ? cold : hot;
  return { cold, hot, accent, lut, css, onAccent, dim: mix(cold, hot, 0.62), line: mix(cold, hot, 0.38), plate: cold };
}

// How warm a thing is at time t when it starts warming at t0 (rise seconds) and cools from t1 (fall seconds). 0..1.
export function heat(t, t0, rise, t1 = Infinity, fall = 0.25) {
  const up = outC((t - t0) / rise), down = t1 === Infinity ? 0 : inQ((t - t1) / fall);
  return clamp(up - down);
}

// A word's look at warmth k: colour from the ramp (its own top colour `top` once fully warm), blur while cold. Call inside kit.drawText's each().
export function warm(c, k, pal, top) {
  if (k <= 0) return false;
  c.globalAlpha = clamp(k * 3);
  if (k < 0.999) c.filter = `blur(${((1 - k) * 7).toFixed(2)}px)`;
  return k >= 0.999 ? top : pal.css(0.45 + 0.55 * k);
}

// Boxes of each run of consecutive key words (one box per run per row), laid out exactly as kit.drawText lays the words.
// -> [{ x, w, y, i0, i1, size }] with i0..i1 the word indices of the run.
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

// The measuring area: a dark plate with thin corner brackets, the camera's "box" tool. Text that must be read sits in one.
export function areaBox(ctx, pal, x, y, w, h, p = 1, label, mono) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(p * 1.5) * 0.84; ctx.fillStyle = pal.plate; ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = clamp(p * 1.5);
  const L = Math.min(46, w / 4, h / 3) * outC(p);
  ctx.strokeStyle = pal.dim; ctx.lineWidth = 3; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L);
  }
  ctx.stroke();
  ctx.strokeStyle = pal.line; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (label) { ctx.font = `600 22px "${mono}"`; ctx.fillStyle = pal.dim; ctx.textBaseline = 'bottom'; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.fillText(label, x + 6, y - 8); }
  ctx.restore();
}

// The isotherm: the band of pixels inside the hottest range is painted flat in the accent. Grows from the reading side.
export function isotherm(ctx, pal, run, p, rtl) {
  if (p <= 0) return;
  const padX = run.size * 0.1, h = run.size * 1.18, w = (run.w + padX * 2) * outC(p);
  const x = rtl ? run.x + run.w + padX - w : run.x - padX, y = run.y - h / 2;
  ctx.save(); ctx.fillStyle = pal.accent; ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.16; ctx.fillStyle = pal.onAccent;               // the sensor's scan rows show through the flat band
  for (let yy = y + 3; yy < y + h; yy += 6) ctx.fillRect(x, yy, w, 1);
  ctx.restore();
}

// The hot-spot tracker: four hot corner ticks that close in on the isotherm band (no words, so it never sits on a neighbour's text).
export function tracker(ctx, pal, run, p, rtl) {
  if (p <= 0) return;
  const padX = run.size * 0.1, h = run.size * 1.18, g = 10 + (1 - outC(p)) * 40, gx = (1 - outC(p)) * 40;
  const x = run.x - padX - gx, y = run.y - h / 2 - g, w = run.w + padX * 2 + gx * 2, hh = h + g * 2, L = Math.min(30, w / 4);
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.strokeStyle = pal.hot; ctx.lineWidth = 4; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + hh, 1, -1], [x + w, y + hh, -1, -1]]) {
    ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L);
  }
  ctx.stroke(); ctx.restore();
}
