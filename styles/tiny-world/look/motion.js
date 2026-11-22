// Tiny-world motion: a time-lapse of a model town. Everything that lives in the world (cars, people, words set down on the roofs)
// moves in the stutter of a camera that takes twelve pictures a second, so it looks like wind-up toys; only the light (cloud shadows)
// and the camera itself glide. A word is set down like a model piece: it is a little too big for one or two pictures, then sits.
// This file also holds what every part shares: the palette, the time-lapse clock, a rooftop slab, a painted tarp and the key runs.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const FPS = 12;
export const lapse = (t) => Math.floor(t * FPS + 1e-6) / FPS;   // the time-lapse clock: time in twelfths of a second

const lum = (c) => contrast(c, '#000000');
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const readable = (fg, k, against = light) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  const onAccent = contrast(accent, light) >= contrast(accent, dark) ? light : dark;
  return {
    light, dark, accent, readable, onAccent,
    paper: mix(light, dark, T.tone.paper), ink: dark, muted: readable(dark, T.tone.muted, mix(light, dark, T.tone.paper)),
    wall: mix(light, dark, 0.34), rim: mix(light, dark, 0.14), shadow: 'rgba(0,0,0,0.3)',
    asphalt: mix(dark, light, 0.26), walk: mix(light, dark, 0.3), mark: mix(light, dark, 0.06),
    grass: mix(mix(accent, light, 0.3), dark, 0.28), tree: mix(accent, dark, 0.52), treeLit: mix(mix(accent, dark, 0.52), light, 0.22),
    roofs: [mix(light, dark, 0.1), mix(light, dark, 0.26), mix(light, dark, 0.4), mix(dark, light, 0.48), mix(accent, light, 0.55), mix(light, accent, 0.14), mix(light, dark, 0.18), mix(accent, dark, 0.1), mix(light, dark, 0.33), mix(light, accent, 0.3)],
    cars: [accent, light, mix(dark, light, 0.15), mix(accent, light, 0.5), mix(light, dark, 0.45)],
    tarpEdge: mix(accent, dark, 0.3),
  };
}

// A rooftop slab seen from high above: its cast shadow, its south wall, the light roof with a parapet rim. It rises in time-lapse
// steps (p 0..1). r: { x, y, w, h } of the roof. Returns false while it is not up yet.
export function slab(ctx, r, pal, p = 1, wallH = 26) {
  if (p <= 0) return false;
  const k = Math.ceil(clamp(p) * 4) / 4, lift = wallH * k;                 // four steps, like a model being stacked
  ctx.fillStyle = pal.shadow; ctx.fillRect(r.x + 16, r.y + 18 - lift, r.w + lift * 1.6, r.h + lift);
  ctx.fillStyle = pal.wall; ctx.fillRect(r.x, r.y + r.h - lift, r.w, lift + 0.5);
  ctx.fillStyle = pal.paper; ctx.fillRect(r.x, r.y - lift, r.w, r.h);
  ctx.strokeStyle = pal.rim; ctx.lineWidth = 6; ctx.strokeRect(r.x + 9, r.y - lift + 9, r.w - 18, r.h - 18);
  ctx.translate(0, -lift);                                                   // what is drawn after sits on the roof
  return true;
}
// A painted tarp behind one key run: unrolled from the reading side in time-lapse steps.
export function tarp(ctx, box, size, p, pal, rtl) {
  if (p <= 0) return;
  const k = Math.ceil(clamp(p) * 5) / 5, pad = size * 0.14, w = (box.x1 - box.x0 + pad * 2) * k, h = size * 1.2;
  const x = rtl ? box.x1 + pad - w : box.x0 - pad;
  ctx.fillStyle = pal.tarpEdge; ctx.fillRect(x - 3, box.y - h / 2 - 3, w + 6, h + 6);
  ctx.fillStyle = pal.accent; ctx.fillRect(x, box.y - h / 2, w, h);
}
// A word set down like a model piece: absent, then one or two pictures a little too big, then sitting.
export function setDown(ctx, t, t0, box) {
  const q = lapse(t) - t0;
  if (q < 0) return false;
  const s = q < 1 / FPS ? 1.22 : q < 2 / FPS ? 1.08 : 1;
  if (s !== 1) { const cx = box.x + box.width / 2; ctx.translate(cx, box.y); ctx.scale(s, s); ctx.translate(-cx, -box.y); }
}
// Where kit.drawText puts each run of consecutive key words: one box per run per row.
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
export const stagger = (n, step, len, room = 0.7) => (n <= 1 ? 0 : Math.min(step, Math.max(0.02, (room - len) / (n - 1))));
