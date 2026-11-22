// Bag Scan motion: the belt. Nothing flies or fades in: the whole picture is one scanned image that the conveyor pulls in past the
// line sensor (from the reading side), stops, and pulls out again. Once still, the operator acts on it: a dashed selection box snaps
// onto a thing, a thing is switched to inverse, a row is brought to full penetration. Colour = material, built only from the brand:
// the lighter brand colour is "nothing in the way", the accent is the material, the darker colour is what the beam cannot cross.
import { clamp, mix, contrast } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;
export const outQ = (p) => 1 - (1 - clamp(p)) ** 4;
export const inC = (p) => clamp(p) ** 3;

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const bgDark = contrast(bg, '#000000') <= contrast(text, '#000000');
  const dark = bgDark ? bg : text, light = bgDark ? text : bg;
  return {
    light, dark, accent,
    screen: mix(light, dark, 0.035),            // the bright field: the beam got through
    organic: mix(light, accent, 0.2),           // thin material
    organic2: mix(light, accent, 0.42),
    mixed: accent,
    metal: mix(accent, dark, 0.62),             // dense
    ink: dark, soft: mix(dark, light, 0.42), ghost: mix(light, dark, 0.22),
    chrome: dark, chromeInk: mix(dark, light, 0.62),
  };
}

// Belt position (px the image is still away from rest) for an entrance that starts at t0 and lasts dur, and an exit from t1.
// Positive = still coming in from the sensor side; negative = gone out the far side. dir = +1 when the sensor is on the right.
export function belt(t, t0, dur, t1, W, dir) {
  const inn = (1 - outQ((t - t0) / dur)) * W * 1.05, out = t1 === Infinity ? 0 : inC((t - t1) / 0.32) * W * 1.1;
  return dir * (inn - out);
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

// A case seen through the beam, drawn once into its own canvas: a thin translucent shell (organic), walls darker where the beam runs
// along them, a handle, a zip line, metal corner wheels and a frame rail. Returns { cv, pad } (the canvas has `pad` px of margin).
export function bag(w, h, pal, seed = 1) {
  const pad = 60, cv = document.createElement('canvas'); cv.width = Math.ceil(w + pad * 2); cv.height = Math.ceil(h + pad * 2);
  const c = cv.getContext('2d'), x = pad, y = pad, r = 30;
  c.fillStyle = pal.organic; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  // walls: path length is longest along the edges, so they read darker, with a soft inner falloff
  c.lineJoin = 'round';
  c.strokeStyle = pal.organic2; c.lineWidth = 22; c.beginPath(); c.roundRect(x + 6, y + 6, w - 12, h - 12, r - 6); c.stroke();
  c.strokeStyle = pal.mixed; c.lineWidth = 6; c.beginPath(); c.roundRect(x, y, w, h, r); c.stroke();
  // the frame rail (metal) running along one long side, and the zip (dashed mixed)
  c.strokeStyle = pal.metal; c.lineWidth = 5; c.beginPath(); c.moveTo(x + r, y + h - 16); c.lineTo(x + w - r, y + h - 16); c.stroke();
  c.setLineDash([6, 6]); c.strokeStyle = pal.mixed; c.lineWidth = 3; c.beginPath(); c.moveTo(x + r, y + 16); c.lineTo(x + w - r, y + 16); c.stroke(); c.setLineDash([]);
  // handle on top, wheels below (metal, solid)
  const hx = x + w / 2;
  c.strokeStyle = pal.organic2; c.lineWidth = 14; c.beginPath(); c.roundRect(hx - 70, y - 44, 140, 54, 18); c.stroke();
  c.strokeStyle = pal.metal; c.lineWidth = 4; c.beginPath(); c.moveTo(hx - 56, y); c.lineTo(hx - 56, y - 30); c.moveTo(hx + 56, y); c.lineTo(hx + 56, y - 30); c.stroke();
  c.fillStyle = pal.metal; for (const wx of [x + 34, x + w - 34]) { c.beginPath(); c.arc(wx, y + h + 14, 15, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = pal.organic; for (const wx of [x + 34, x + w - 34]) { c.beginPath(); c.arc(wx, y + h + 14, 5, 0, Math.PI * 2); c.fill(); }
  return { cv, pad };
}

// The operator's selection: a dashed rectangle whose dashes march, snapping in from a larger size. p 0..1.
export function select(ctx, pal, x, y, w, h, p, t, color = pal.ink) {
  if (p <= 0) return;
  const g = (1 - outC(p)) * 60;
  ctx.save(); ctx.globalAlpha = clamp(p * 3); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t * 40;
  ctx.strokeRect(x - g, y - g, w + g * 2, h + g * 2);
  ctx.setLineDash([]); ctx.fillStyle = color;
  for (const [cx, cy] of [[x - g, y - g], [x + w + g, y - g], [x - g, y + h + g], [x + w + g, y + h + g]]) ctx.fillRect(cx - 5, cy - 5, 10, 10);
  ctx.restore();
}

// Inverse video on a run of key words: the operator's INV key. The band grows from the reading side; words on it are drawn in `light`.
export function inverse(ctx, pal, run, p, rtl) {
  if (p <= 0) return;
  const padX = run.size * 0.12, h = run.size * 1.2, w = (run.w + padX * 2) * outC(p);
  const x = rtl ? run.x + run.w + padX - w : run.x - padX;
  ctx.fillStyle = pal.ink; ctx.fillRect(x, run.y - h / 2, w, h);
}
