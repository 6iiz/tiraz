// Scale-dive motion: the camera only ever moves forward, into the picture. Things come from far away (small, near the vanishing
// point) and grow into place on a log curve; when a scene is done everything rushes outward past the lens. Sizes change in log space,
// so a ×10 zoom feels as even as a ×2. This file also holds what every part shares: the palette, flat discs with one shade step,
// hard "glow" rings, the next-stop pill that marks a key phrase, and the layout of key runs.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const Q = (p) => 1 - (1 - clamp(p)) ** 5;           // a lock-on: most of the move early, long soft settle
export const I = (p) => clamp(p) ** 2.4;                   // rushing past: ends at full speed
// A size that grows in log space from a to b.
export const logLerp = (a, b, p) => a * (b / a) ** clamp(p);

const lum = (c) => contrast(c, '#000000');
// Night is the brand's darker colour, light is the other. Every tone is a mix of the brand's three colours.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const night = lum(bg) <= lum(text) ? bg : text, light = night === bg ? text : bg;
  const readable = (fg, k, against = night) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  let sun = accent, k = 0; while (contrast(sun, night) < 3 && k < 1) { k += 0.08; sun = mix(accent, light, k); }   // the pointer colour always shows on the night
  const onSun = contrast(sun, night) >= contrast(sun, light) ? night : light;
  return {
    night, light, sun, onSun, readable,
    ink: light, muted: readable(light, T.tone.muted),
    step1: mix(night, light, T.tone.step1), step2: mix(night, light, T.tone.step2),
    tone: (k) => mix(night, light, k), sunTone: (k) => mix(night, sun, k),
  };
}

// A flat disc with one shade step: the whole disc in the shade, then the lit part as the same disc moved up-and-toward the light,
// clipped to the disc. What is left of the shade is a crescent at the lower right.
export function disc(ctx, x, y, r, base, shade, shift = 0.22) {
  if (r <= 0.5) return;
  ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(x - r * shift, y - r * shift, r, 0, 7); ctx.fill(); ctx.restore();
}
// Glow done the cheap way: two crisp rings, one and two steps brighter than the night sky (no blur, no alpha).
export function glow(ctx, x, y, r, pal, k = 1) {
  ctx.fillStyle = pal.step1; ctx.beginPath(); ctx.arc(x, y, r * (1 + 0.9 * k), 0, 7); ctx.fill();
  ctx.fillStyle = pal.step2; ctx.beginPath(); ctx.arc(x, y, r * (1 + 0.42 * k), 0, 7); ctx.fill();
}
export function ring(ctx, x, y, r, color, w = 3, dash = null, off = 0) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = off; }
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, 7); ctx.stroke(); ctx.restore();
}
function pillPath(ctx, x, y, w, h) { const r = h / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); }
// The next-stop pill behind one key run: a solid pill of the pointer colour that locks on (grows out of its own centre on the lock-on
// curve) and a dashed outer pill that keeps crawling while the line holds. p: 0..1, time: for the crawl.
export function stop(ctx, box, size, p, pal, time) {
  if (p <= 0) return;
  const padX = size * 0.13, padY = size * 0.08, w = box.x1 - box.x0 + padX * 2, h = size * 1.12 + padY * 2, cx = (box.x0 + box.x1) / 2, cy = box.y;
  const s = 0.35 + 0.65 * Q(p), o = size * 0.13 * (2.6 - 1.6 * Q(p));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = pal.sun; pillPath(ctx, -w / 2, -h / 2, w, h); ctx.fill();
  // the readout rails: dashed lines crawling above and below the pill (never sideways, where the neighbouring words are)
  ctx.strokeStyle = pal.sun; ctx.lineWidth = 3 / s; ctx.lineCap = 'round'; ctx.setLineDash([2, 12]); ctx.lineDashOffset = -time * 22;
  const rw = w / 2 - h * 0.25;
  ctx.beginPath(); ctx.moveTo(-rw, -h / 2 - o); ctx.lineTo(rw, -h / 2 - o); ctx.moveTo(rw, h / 2 + o); ctx.lineTo(-rw, h / 2 + o); ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 4 / s;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * (rw + 6), sy * (h / 2 + o)); ctx.lineTo(sx * (rw + 6), sy * (h / 2 + o - 12)); ctx.stroke(); }
  ctx.restore();
}

// Where kit.drawText puts each word, so one shape can sit behind a whole run of key words. -> [{ x0, x1, y, row, first }] one box per
// run of consecutive key words on a row (a phrase that wraps gives one box per row). `first` is the index of the run's first word.
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

// A word dives in: it starts small near the vanishing point (vx, vy) and grows into its place on a log curve, solid after the first fifth.
export function arrive(ctx, p, box, vx, vy) {
  if (p <= 0) return false;
  const e = Q(p), s = logLerp(0.3, 1, e), cx = box.x + box.width / 2;
  ctx.globalAlpha *= clamp(p * 5);
  ctx.translate(vx + (cx - vx) * s - cx * s, vy + (box.y - vy) * s - box.y * s); ctx.scale(s, s);
}
// Everything of a scene rushes outward from the vanishing point, past the lens. Wrap the scene's drawing with it.
export function rushOut(ctx, p, vx, vy) {
  if (p <= 0) return true;
  if (p >= 1) return false;
  const s = logLerp(1, 3.2, I(p));
  ctx.globalAlpha *= 1 - clamp(p * 1.25);
  ctx.translate(vx, vy); ctx.scale(s, s); ctx.translate(-vx, -vy);
  return true;
}
// Staggers that always finish inside `room` seconds (the hook must be whole at its first frame).
export const stagger = (n, step, len, room = 0.75) => (n <= 1 ? 0 : Math.min(step, Math.max(0.02, (room - len) / (n - 1))));
