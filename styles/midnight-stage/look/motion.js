// Midnight-stage motion: the grammar of a theatre, not of a screen. Light does the revealing: a follow-spot irises open on what is
// said and closes on it at the end (a word is lit by mixing its colour from the dark wall up to full light, never by transparency).
// Set pieces are flown: signs come down from the fly loft on two lines, stop, and sway a little before they hang still; they fly out
// upward, behind the pelmet. Wagons roll in from the wings. Key phrases are lit by a marquee: a sign plate framed in bulbs that come
// on one after another and then chase. This file holds what every part shares: palette, curtain cloth, the spot, bulbs, the marquee,
// the flying, and where fitted words stand.
import { clamp, contrast, mix, rgba } from '/engine/kit.js';

export const IN = (p) => 1 - (1 - clamp(p)) ** 3;           // a cue comes up
export const FLY = (p) => 1 - (1 - clamp(p)) ** 4;          // a piece is lowered on the lines and stops
export const OUT = (p) => clamp(p) ** 2.2;                  // a piece is hauled out / a light goes down

export const PELMET = 236;                                   // the bottom of the pelmet: flown pieces hang from here
export const LEGS = 64;                                      // the width of each side curtain

const darker = (a, b) => (contrast(a, '#000000') <= contrast(b, '#000000') ? a : b);

// The stage is always built on the brand's darker colour; the lighter one is the light; the accent dyes the velvet and the signs.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const dark = darker(bg, text), light = dark === bg ? text : bg;
  let velvet = mix(dark, accent, 0.55); while (contrast(velvet, dark) > 2.6) velvet = mix(velvet, dark, 0.15);
  let plate = mix(dark, accent, 0.3); while (contrast(light, plate) < 6) plate = mix(plate, dark, 0.2);
  return {
    dark, light, accent, velvet, plate,
    wall: mix(dark, light, 0.035), floor: mix(dark, light, 0.07), seam: mix(dark, light, 0.11),
    fold: mix(velvet, dark, 0.6), sheen: mix(velvet, light, 0.14),
    dim: mix(light, dark, 0.28), rope: mix(dark, light, 0.32), rim: mix(plate, light, 0.35),
    bulb: mix(light, accent, 0.18), off: mix(dark, light, 0.2),
  };
}
// The colour of a word lit to level q (0 = in the dark, 1 = full light).
export const lit = (pal, q, to = pal.light) => mix(pal.wall, to, clamp(q));

// Velvet: a canvas w x h of vertical folds (a lit crest, a deep trough) with a heavier hem. Built once.
export function velvet(w, h, pal, fold = 70, phase = 0) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.ceil(h);
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, w, 0);
  const n = Math.max(1, Math.round(w / fold));
  for (let i = 0; i <= n * 8; i++) { const u = i / (n * 8), s = Math.cos((u * n + phase) * Math.PI * 2); gr.addColorStop(u, s > 0 ? mix(pal.velvet, pal.sheen, s * 0.9) : mix(pal.velvet, pal.fold, -s)); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, rgba(pal.dark, 0.35)); v.addColorStop(0.3, rgba(pal.dark, 0)); v.addColorStop(0.92, rgba(pal.dark, 0)); v.addColorStop(1, rgba(pal.dark, 0.45));
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  return c;
}

// A pool of light (a radial sprite, built once) and the follow-spot drawn from it at radius r.
export function pool(color, size = 800, a = 0.15, hard = 0.78) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, rgba(color, a)); gr.addColorStop(hard, rgba(color, a * 0.72)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}
export function spot(ctx, sprite, cx, cy, rx, ry = rx) { if (rx > 1) ctx.drawImage(sprite, cx - rx, cy - ry, rx * 2, ry * 2); }
// How lit a point is inside an opening iris of radius r centred at (cx, cy): soft over the last 90 px.
export const inIris = (x, y, cx, cy, r, sx = 1, sy = 1) => clamp((r - Math.hypot((x - cx) / sx, (y - cy) / sy)) / 90 + 0.15);

// A glowing bulb sprite (built once).
export function bulbSprite(pal) {
  const s = 40, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, rgba(pal.light, 1)); gr.addColorStop(0.18, rgba(pal.bulb, 1)); gr.addColorStop(0.3, rgba(pal.bulb, 0.45)); gr.addColorStop(1, rgba(pal.bulb, 0));
  g.fillStyle = gr; g.fillRect(0, 0, s, s); return c;
}
// The marquee: a plate framed by bulbs. on (0..1) switches the bulbs on one after another round the frame; then they chase.
// sides: false keeps bulbs on the top and bottom edges only (a plate set inside a line of words, where side bulbs would touch them).
export function marquee(ctx, pal, sprite, x0, y0, x1, y1, t, on = 1, plate = true, sides = true) {
  if (plate) { ctx.fillStyle = pal.plate; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
  if (sides) { ctx.strokeStyle = pal.rim; ctx.lineWidth = 2; ctx.strokeRect(x0 + 9, y0 + 9, x1 - x0 - 18, y1 - y0 - 18); }
  if (!sides) { const n = Math.max(3, Math.round((x1 - x0) / 30)), st = (x1 - x0 - 16) / (n - 1);
    for (const [row, yy] of [[0, y0], [1, y1]]) for (let i = 0; i < n; i++) {
      const x = x0 + 8 + i * st, k = row ? n - 1 - i : i, isOn = (k + row * n) / (2 * n) < on, chase = (((k - Math.floor(t * 9)) % 3) + 3) % 3 === 0;
      ctx.fillStyle = pal.off; ctx.beginPath(); ctx.arc(x, yy, 4.5, 0, Math.PI * 2); ctx.fill();
      if (isOn) { ctx.globalAlpha = on >= 1 && !chase ? 0.55 : 1; ctx.drawImage(sprite, x - 20, yy - 20); ctx.globalAlpha = 1; } }
    return; }
  const per = 2 * (x1 - x0 + y1 - y0), n = Math.max(8, Math.round(per / 30)), step = per / n;
  for (let i = 0; i < n; i++) {
    let d = i * step, x, y;
    if (d < x1 - x0) { x = x0 + d; y = y0; } else if ((d -= x1 - x0) < y1 - y0) { x = x1; y = y0 + d; }
    else if ((d -= y1 - y0) < x1 - x0) { x = x1 - d; y = y1; } else { d -= x1 - x0; x = x0; y = y1 - d; }
    const isOn = i / n < on, chase = (((i - Math.floor(t * 9)) % 3) + 3) % 3 === 0;
    ctx.fillStyle = pal.off; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    if (isOn) { ctx.globalAlpha = on >= 1 && !chase ? 0.55 : 1; ctx.drawImage(sprite, x - 20, y - 20); ctx.globalAlpha = 1; }
  }
}

// A flown piece: where it hangs (dy from home) and how it sways (radians), from the moment it was let in.
export function flown(t, t0, dur, out = 0, drop = 1100) {
  const p = clamp((t - t0) / dur); if (p <= 0) return null;
  const tau = Math.max(0, t - t0 - dur * 0.55);
  return { dy: -(1 - FLY(p)) * drop - OUT(out) * drop, a: 0.05 * Math.exp(-4 * tau) * Math.sin(8 * tau) * (p > 0.55 ? 1 : 0) };
}
// Two lines from the pelmet down to the top corners of a piece.
export function lines(ctx, pal, xa, xb, y) {
  ctx.strokeStyle = pal.rope; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(xa, PELMET - 10); ctx.lineTo(xa, y); ctx.moveTo(xb, PELMET - 10); ctx.lineTo(xb, y); ctx.stroke();
}

export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const rtl = kit.rtl, out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
export function keyRuns(boxes) {
  const runs = []; let cur = null;
  boxes.forEach((b, i) => {
    if (b.key && cur && cur.row === b.row && cur.last === i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = i; }
    else if (b.key) { cur = { row: b.row, y: b.y, x0: b.x, x1: b.x + b.width, first: i, last: i }; runs.push(cur); }
    else cur = null;
  });
  return runs;
}
