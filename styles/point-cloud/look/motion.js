// Point-cloud motion. Text is a scanned object: a scan front runs down a block, and behind it the block's returns (dots sampled from
// the words themselves) fly in from scatter, land on their measured place and condense into solid type. On the way out the solid
// gives way to its returns again, which lift off and thin out. Key phrases are classified: one hairline bracket box around the whole
// run, its returns and its type in the accent class colour. Everything here is a pure function of time.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;
export const inC = (p) => clamp(p) ** 2.4;

// The palette from the three brand colours. dark/light are whichever of bg/text is darker/lighter, so any brand reads.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255); };
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  let key = accent;                                       // the class colour, lifted toward light until it reads on the dark ground
  for (let k = 0; k <= 1.001 && contrast(key, dark) < 4.6; k += 0.05) key = mix(accent, light, k);
  return { dark, light, accent, key, grey: mix(light, dark, 0.42), dim: mix(light, dark, 0.7), faint: mix(light, dark, 0.86) };
}

// Where kit.drawText puts each word (same arithmetic), so a look can box a phrase or sample a word before drawing it.
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
// Consecutive key words on one row form one run: a multi-word key phrase gets one emphasis, not one per word.
export function runs(boxes) {
  const rs = []; let cur = null;
  for (const b of boxes) {
    if (!b.key) { cur = null; continue; }
    if (cur && cur.row === b.row && cur.last === b.i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = b.i; }
    else { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, last: b.i }; rs.push(cur); }
  }
  return rs;
}

// ---- sampling: a shape becomes its returns ----
let scratch = null;
function pad(W, H) {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== W || scratch.height !== H) { scratch.width = W; scratch.height = H; }
  return scratch.getContext('2d', { willReadFrequently: true });
}
// paint(c) draws white for plain and red for key parts inside rect [x, y, w, h]; returns returns on a jittered grid of `step` px.
export function sample(W, H, rect, paint, step = 4, seed = 7) {
  const c = pad(W, H), x = Math.max(0, Math.floor(rect.x)), y = Math.max(0, Math.floor(rect.y));
  const w = Math.min(W - x, Math.ceil(rect.w)), h = Math.min(H - y, Math.ceil(rect.h));
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); paint(c);
  const d = c.getImageData(x, y, w, h).data, r = rng(seed), P = [];
  for (let j = 0; j < h; j += step) for (let i = (j / step) % 2 ? step / 2 : 0; i < w; i += step) {
    const k = (Math.floor(j) * w + Math.floor(i)) * 4;
    if (d[k + 3] > 110) P.push({ x: x + i + (r() - 0.5) * step * 0.5, y: y + j + (r() - 0.5) * step * 0.5, key: d[k + 1] < 128,
      ox: (r() - 0.5) * 300, oy: (r() - 0.5) * 120 - 40, z: 0.5 + r() * 1.6, j: r() });
  }
  c.clearRect(0, 0, W, H);
  return P;
}
export function sampleText(kit, f, at, step) {
  const rect = { x: at.x0 - 30, y: at.y - f.size, w: at.x1 - at.x0 + 60, h: f.size * 2 + (f.rows.length - 1) * f.lead };
  return { pts: sample(kit.W, kit.H, rect, (c) => kit.drawText(c, f, { ...at, color: '#ffffff', key: '#ff0000' }), step, f.rows.length * 31 + Math.round(f.size)),
    top: rect.y, h: rect.h };
}

// A scanned block: returns arrive behind a scan front, solid type takes over above the front; at the exit, returns lift off.
// t0: entrance start, sweep: front travel time, out0: exit start. draw(ctx, t, solid(clipTop, clipBottom)) where solid draws the type.
export function scanned(S, { t0, sweep = 0.45, land = 0.22, out0, outDur = 0.32 }) {
  const { pts, top, h } = S;
  const tArr = (p) => t0 + ((p.y - top) / h) * sweep + p.j * 0.06;
  let fx0 = Infinity, fx1 = -Infinity; for (const p of pts) { fx0 = Math.min(fx0, p.x); fx1 = Math.max(fx1, p.x); }
  fx0 -= 24; fx1 += 24;
  return {
    front: (t) => top + h * clamp((t - t0 - land - 0.06) / sweep),   // everything above the front has landed
    done: t0 + sweep + land + 0.07,
    draw(ctx, t, colors, solid, size = 2.6) {
      if (t < t0) return;
      if (out0 !== undefined && t >= out0) {                        // lift-off
        const q = clamp((t - out0) / outDur); if (q >= 1) return;
        ctx.save(); ctx.globalAlpha = 1 - inC(q);
        for (const p of pts) {
          const e = inC(clamp(q * 1.25 - p.j * 0.25));
          ctx.fillStyle = p.key ? colors.key : p.dim ? (colors.grey ?? colors.text) : colors.text;
          ctx.fillRect(p.x + p.ox * 0.35 * e, p.y - (90 + p.z * 70) * e, size, size);
        }
        ctx.restore(); return;
      }
      const fy = this.front(t);
      if (fy > top) solid(top - 40, fy);
      if (fy >= top + h) return;
      for (const p of pts) {
        if (p.y < fy - 2) continue;
        const q = clamp((t - tArr(p)) / land); if (q <= 0) continue;
        const e = outC(q), s = size * (1 + (1 - e) * p.z);
        ctx.globalAlpha = 0.35 + 0.65 * e; ctx.fillStyle = p.key ? colors.key : p.dim ? (colors.grey ?? colors.text) : colors.text;
        ctx.fillRect(p.x + p.ox * (1 - e), p.y + p.oy * (1 - e), s, s);
      }
      ctx.globalAlpha = 1;
      if (t < this.done) {                                          // the front itself: a hairline with a thin halo of returns
        const fc = colors.front ?? colors.key;
        ctx.fillStyle = rgba(fc, 0.16); ctx.fillRect(fx0, fy - 10, fx1 - fx0, 20);
        ctx.fillStyle = fc; ctx.fillRect(fx0, fy - 1, fx1 - fx0, 2);
      }
    },
  };
}

// The classification box: four hairline corners close in on a run of key words. p 0..1.
export function bracket(ctx, run, size, p, color, pad = size * 0.12) {
  if (p <= 0) return;
  const e = outC(p), g = (1 - e) * 26, px = pad, x0 = run.x0 - px - g, x1 = run.x1 + px + g, y0 = run.y - size * 0.66 - g, y1 = run.y + size * 0.7 + g;
  const L = Math.min(34, (x1 - x0) / 3);
  ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
  ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
  ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
  ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
  ctx.stroke(); ctx.restore();
}

// Fit, then even the rows out: a wrapped text takes the narrowest width that keeps its row count and size, so no word is left alone.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o); if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w, size: f.size, minScale: 1, minPx: 0 });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g;
  }
  return best;
}
