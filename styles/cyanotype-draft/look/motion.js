// Cyanotype motion: nothing is drawn by a pen and nothing flies. Things develop, the way a sun print does in the wash: a soft front
// of rinse water passes down the sheet and, behind it, every mark turns from the print's own colour to the white of the paper. A word
// is never half transparent: its colour is mixed from the coating to white (so joined letters stay whole) and it rises a few pixels
// as it clears. Things leave by washing back into the coating. This file also holds what every part shares: the palette, the
// layout of fitted words, the runs of key words (one paper mask per run), drawn arrows and dimension lines, and photogram leaves.
import { clamp, contrast, mix, rgba, rng } from '/engine/kit.js';

export const DEV = (p) => 1 - (1 - clamp(p)) ** 3;            // developing: quick at first, a soft settle
export const WASH = (p) => clamp(p) ** 2;                     // washing out

const dark0 = (a, b) => (contrast(a, '#000000') <= contrast(b, '#000000') ? a : b);

// The print colour (`coat`) is the brand's darker colour toned by its accent, kept deep enough that white reads on it at 6:1.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const dark = dark0(bg, text), light = dark === bg ? text : bg;
  let coat = mix(dark, accent, 0.45), k = 0;
  while (contrast(coat, light) < 6.2 && k < 20) { coat = mix(coat, dark, 0.12); k++; }
  return {
    dark, light, accent, coat,
    deep: mix(coat, dark, 0.32), wet: mix(coat, light, 0.1),
    paper: light, fibre: mix(light, dark, 0.09), tray: mix(light, dark, 0.05),
    white: light, soft: mix(coat, light, 0.78), ghost: mix(coat, light, 0.34), faint: mix(coat, light, 0.2),
  };
}
// The colour of a mark that is p developed (0 = still the coating, 1 = clear white). `to` lets a mark develop to a softer tone.
export const tone = (pal, p, to = pal.white) => mix(pal.coat, to, clamp(p));

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

// The paper mask: where something lay on the sheet during exposure the paper stayed white. A slightly irregular quadrilateral
// (corners jittered from a seed), its colour developing from the coating to paper with p.
export function mask(ctx, pal, x0, y0, x1, y1, p, seed = 7) {
  if (p <= 0) return;
  const r = rng(seed), j = () => (r() - 0.5) * 7;
  ctx.fillStyle = tone(pal, p, pal.paper);
  ctx.beginPath(); ctx.moveTo(x0 + j(), y0 + j()); ctx.lineTo(x1 + j(), y0 + j()); ctx.lineTo(x1 + j(), y1 + j()); ctx.lineTo(x0 + j(), y1 + j()); ctx.closePath(); ctx.fill();
}

// A front of rinse water: a soft light band (made once) whose leading edge is at y. Drawn under the marks it develops.
export function washBand(W) {
  const h = 240, c = document.createElement('canvas'); c.width = W; c.height = h;
  return { c, h };
}
export function paintWash(band, pal) {
  const g = band.c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, band.h);
  gr.addColorStop(0, rgba(pal.white, 0)); gr.addColorStop(0.72, rgba(pal.white, 0.1)); gr.addColorStop(0.94, rgba(pal.white, 0.2)); gr.addColorStop(1, rgba(pal.white, 0));
  g.fillStyle = gr; g.fillRect(0, 0, band.c.width, band.h);
  return band;
}
export function makeWash(W, pal) { return paintWash(washBand(W), pal); }
export function drawWash(ctx, band, y) { ctx.drawImage(band.c, 0, y - band.h); }

// A white drafting line from a to b, grown along its length by p.
export function seg(ctx, ax, ay, bx, by, p, color, w = 2, dash = null) {
  const q = clamp(p); if (q <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * q, ay + (by - ay) * q); ctx.stroke(); ctx.restore();
}
// A filled, narrow drafting arrowhead with its tip at (x, y), pointing along angle a.
export function head(ctx, x, y, a, color, s = 20) {
  ctx.save(); ctx.fillStyle = color; ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s * 0.28); ctx.lineTo(-s, s * 0.28); ctx.closePath(); ctx.fill(); ctx.restore();
}
// A horizontal dimension: extension lines down from y0 to the dimension line at y, the line between xa and xb with an arrowhead at
// each end, opening from the middle outward as p goes 0 to 1.
export function dimension(ctx, xa, xb, y0, y, p, color) {
  const q = DEV(p); if (q <= 0) return;
  seg(ctx, xa, y0, xa, y + 14, q, color, 1.5); seg(ctx, xb, y0, xb, y + 14, q, color, 1.5);
  const m = (xa + xb) / 2, h = (xb - xa) / 2 * q;
  seg(ctx, m, y, m - h, y, 1, color, 2); seg(ctx, m, y, m + h, y, 1, color, 2);
  if (q > 0.6) { head(ctx, m - h, y, Math.PI, color); head(ctx, m + h, y, 0, color); }
}

// A photogram leaf: the white silhouette a pressed leaf leaves on the print. Made once into its own canvas (size s), from a seed:
// kind 'frond' is a curved stem with paired leaflets shrinking to the tip; kind 'leaf' is one pointed leaf with a midrib cut out.
export function leaf(s, seed, color, kind = 'leaf') {
  const c = document.createElement('canvas'); c.width = s; c.height = s;
  const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round';
  if (kind === 'frond') {
    const n = 12, bend = 0.25 + r() * 0.2;
    const at = (u) => [s * 0.5 + Math.sin(u * 2.2) * s * bend * u * 0.5, s * (0.97 - u * 0.92)];
    g.lineWidth = s * 0.012; g.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let i = 1; i < n; i++) {
      const u = i / n, [x, y] = at(u), len = s * 0.26 * (1 - u * 0.8) * (0.85 + r() * 0.3), wid = len * 0.15;
      for (const side of [-1, 1]) {
        g.save(); g.translate(x, y); g.rotate(side * (1.05 + r() * 0.2) - 0.25 * u);
        g.beginPath(); g.ellipse(0, -len / 2, wid, len / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }
  } else {
    const len = s * 0.86, wid = s * (0.26 + r() * 0.12), tilt = (r() - 0.5) * 0.7;
    g.save(); g.translate(s / 2, s / 2); g.rotate(tilt);
    g.beginPath(); g.moveTo(0, len / 2); g.bezierCurveTo(wid, len * 0.2, wid * 0.9, -len * 0.25, 0, -len / 2);
    g.bezierCurveTo(-wid * 0.9, -len * 0.25, -wid, len * 0.2, 0, len / 2); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = Math.max(1.5, s * 0.025);
    g.beginPath(); g.moveTo(0, len * 0.45); g.lineTo(0, -len * 0.4); g.stroke();
    for (let k = 1; k < 5; k++) { const yy = len * (0.35 - k * 0.15); g.beginPath(); g.moveTo(0, yy); g.lineTo(wid * 0.6, yy - len * 0.1); g.moveTo(0, yy); g.lineTo(-wid * 0.6, yy - len * 0.1); g.stroke(); }
    g.restore();
  }
  return c;
}
