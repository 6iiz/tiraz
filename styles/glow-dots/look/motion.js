// Glow-dots motion: nothing slides, nothing is wiped in. Words are made of points of light that gather out of the night on curved,
// spiralling paths, out of focus (large and faint) while they travel and sharp as they land; when the points of a word have landed,
// the word itself kindles under them and they settle to a quiet shimmer. To leave, the points let go and drift upward like embers.
// The points are never just decoration: they are the words, the number, the logo.
// Everything heavy (glyph pictures with their glow, the points' sample positions, the light sprites) is built once in create().
import { clamp, mix, contrast, rgba, rng, span } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const S = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
export const I = (p) => clamp(p) ** 2;

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lum = (c) => contrast(c, '#000000');
  const [light, dark] = lum(bg) >= lum(text) ? [bg, text] : [text, bg];
  const lift = (c, toward, against, need) => { for (let k = 0; k <= 1.0001; k += 0.05) { const m = mix(c, toward, k); if (contrast(m, against) >= need) return m; } return toward; };
  return {
    night: dark, light, accent,
    glow: light,
    lead: mix(dark, light, T.tone.lead),
    key: lift(accent, light, dark, 4.5),                 // the accent, lifted toward the light until it reads on the night
    spark: lift(accent, light, dark, 3),
    warm: mix(light, accent, 0.22),
  };
}

// A soft point of light: a hot core, the colour around it, a long faint falloff. Kept per colour.
const sprites = new Map();
export function sprite(color, core) {
  const id = color + '|' + core;
  if (sprites.has(id)) return sprites.get(id);
  const N = 64, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  gr.addColorStop(0, rgba(core, 1)); gr.addColorStop(0.12, rgba(color, 0.95)); gr.addColorStop(0.3, rgba(color, 0.38)); gr.addColorStop(0.6, rgba(color, 0.08)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  sprites.set(id, cv); return cv;
}
// An out-of-focus disc (bokeh): flat, faint, with a slightly brighter edge.
export function disc(color) {
  const id = 'disc|' + color;
  if (sprites.has(id)) return sprites.get(id);
  const N = 128, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  gr.addColorStop(0, rgba(color, 0.5)); gr.addColorStop(0.82, rgba(color, 0.62)); gr.addColorStop(0.92, rgba(color, 0.8)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  sprites.set(id, cv); return cv;
}

// kit.fit, then the narrowest width that keeps the same rows and size: two even rows, not an orphan.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) { const g = kit.fit(text, { ...o, maxW: w }); if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g; }
  return best;
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// A fitted text made ready for light: its glyphs drawn once with their glow on a canvas of their own, each word's box, where the
// key phrases run (merged per row: one emphasis per phrase), and the points of light sampled from the glyphs on a jittered grid.
export function lightText(kit, f, { x0, x1, y, align = 'center', color, key, gap = 7, seed = 1 }) {
  const pad = Math.round(f.size * 0.5), ox = x0 - pad, oy = y - f.lead / 2 - pad, w = x1 - x0 + pad * 2, h = f.height + pad * 2;
  const cv = canvas(w, h), g = cv.getContext('2d'), boxes = [];
  g.translate(-ox, -oy);
  g.shadowBlur = f.size * 0.28; g.shadowColor = rgba(color, 0.55);
  kit.drawText(g, f, { x0, x1, y, align, color, key, each: (wd, i, box, c) => { boxes[i] = { ...box, key: wd.key }; if (wd.key) c.shadowColor = rgba(key, 0.7); } });
  g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)';
  kit.drawText(g, f, { x0, x1, y, align, color, key });
  // the mask the points are sampled from
  const mk = canvas(w, h), m = mk.getContext('2d', { willReadFrequently: true });
  m.translate(-ox, -oy); kit.drawText(m, f, { x0, x1, y, align, color: '#ffffff', key: '#ffffff' });
  const data = m.getImageData(0, 0, mk.width, mk.height).data, r = rng(seed), pts = [];
  let sp = gap; const area = () => { let n = 0; for (let i = 3; i < data.length; i += 4 * 9) if (data[i] > 140) n++; return n * 9; };
  sp = Math.max(gap, Math.sqrt(area() / 2400));                    // never more than about 2400 points for one text
  for (let gy = sp / 2; gy < mk.height; gy += sp) for (let gx = sp / 2; gx < mk.width; gx += sp) {
    const x = gx + (r() - 0.5) * sp * 0.8, yy = gy + (r() - 0.5) * sp * 0.8, xi = x | 0, yi = yy | 0;
    if (xi < 0 || yi < 0 || xi >= mk.width || yi >= mk.height || data[(yi * mk.width + xi) * 4 + 3] <= 140) continue;
    const X = x + ox, Y = yy + oy;
    let wi = 0, best = 1e9;
    boxes.forEach((b, i) => { const dx = X < b.x ? b.x - X : X > b.x + b.width ? X - b.x - b.width : 0, dy = Math.abs(Y - b.y); const dd = dx + dy * 2; if (dd < best) { best = dd; wi = i; } });
    pts.push(point(r, X, Y, wi, boxes[wi].key));
  }
  // the rectangles a word is cut from (split half way across the word spaces and between rows)
  const cuts = boxes.map((b) => ({ x: b.x - f.space / 2, y: b.y - f.lead / 2, w: b.width + f.space, h: f.lead }));
  const runs = [];
  let run = null, lastRow = -1;
  boxes.forEach((b, i) => {
    if (b.key && run && b.row === lastRow) { run.x0 = Math.min(run.x0, b.x); run.x1 = Math.max(run.x1, b.x + b.width); run.last = i; }
    else if (b.key) { run = { x0: b.x, x1: b.x + b.width, y: b.y, first: i, last: i }; runs.push(run); }
    else run = null;
    lastRow = b.row;
  });
  return { f, cv, ox, oy, boxes, cuts, pts, runs, color, key };
}
// one point of light: where it lands, which word it belongs to, and the numbers that make its path its own
export const point = (r, x, y, w, key) => ({ x, y, w, key, a: r() * Math.PI * 2, R: 260 + r() * 520, spin: (r() < 0.5 ? -1 : 1) * (1.2 + r() * 1.8),
  dl: r() * 0.3, s: 7 + r() * 5, ph: r() * 6.283, spark: r() < 0.1, vx: (r() - 0.5) * 260, vy: -(140 + r() * 320), sw: 0.6 + r() * 1.2 });

// Where a point is at time t. when: { t0, g (gather length), t1 (when it lets go), q (the leaving length) }.
// Returns null when it is not lit. The path is a spiral that tightens onto the landing place.
export function place(pt, t, when) {
  const p = span(t, when.t0, when.t0 + when.g), pe = clamp((p - pt.dl) / (1 - pt.dl));
  if (pe <= 0) return null;
  const e = E(pe), u = 1 - e, q = span(t, when.t1, when.t1 + when.q);
  if (q >= 1) return null;
  const ang = pt.a + pt.spin * u, rr = pt.R * u * u;
  let x = pt.x + Math.cos(ang) * rr, y = pt.y + Math.sin(ang) * rr * 0.75;
  const live = Math.sin(t * pt.sw * 2.3 + pt.ph);
  x += 0.8 * live * e; y += 0.8 * Math.cos(t * pt.sw * 1.7 + pt.ph) * e;
  let a = Math.min(1, pe * 3) * (0.25 + 0.75 * e), size = pt.s * (1 + 2.6 * u);
  if (q > 0) { const k = q ** 1.6; x += pt.vx * k + Math.sin(q * 6 + pt.ph) * 30 * q; y += pt.vy * k; a *= 1 - q; size *= 1 + q; }
  return { x, y, a, size, e, live };
}

// Draw the points of a light text and kindle its words. when(i) gives the timing of word i.
// rest: how bright the landed points stay over their kindled word (0..1).
export function drawLight(ctx, L, t, when, { rest = 0.28, keyHalo = true, kindleFrom = 0.55 } = {}) {
  const sp = sprite(L.color, L.color === L.key ? L.color : mix(L.color, '#ffffff', 0.4)), sk = sprite(L.key, mix(L.key, '#ffffff', 0.5));
  // the words, under their points
  L.boxes.forEach((b, i) => {
    const w = when(i), k = S(span(t, w.t0 + w.g * kindleFrom, w.t0 + w.g + 0.12)) * (1 - S(span(t, w.t1, w.t1 + w.q * 0.6)));
    if (k <= 0) return;
    const c = L.cuts[i];
    ctx.save(); ctx.globalAlpha = k; ctx.drawImage(L.cv, c.x - L.ox, c.y - L.oy, c.w, c.h, c.x, c.y, c.w, c.h); ctx.restore();
  });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const pt of L.pts) {
    const w = when(pt.w), P = place(pt, t, w);
    if (!P) continue;
    const kindled = S(span(t, w.t0 + w.g * Math.min(0.95, kindleFrom + 0.05), w.t0 + w.g + 0.2));
    let a = P.a * (1 - kindled * (1 - rest));
    if (pt.spark) a = Math.min(1, a + kindled * 0.55 * Math.max(0, P.live) ** 4);
    if (a <= 0.01) continue;
    ctx.globalAlpha = a; const s = P.size;
    ctx.drawImage(pt.key ? sk : sp, P.x - s / 2, P.y - s / 2, s, s);
  }
  ctx.restore();
  if (keyHalo) for (const run of L.runs) halo(ctx, run, L.f.size, t, when(run.last), L.key);
}

// The emphasis of a key phrase: one swarm of accent fireflies circling the whole phrase, lit once its last word has kindled.
const haloPts = (() => { const r = rng(99), a = []; for (let i = 0; i < 52; i++) a.push({ a: r() * 6.283, v: 0.35 + r() * 0.5, j: (r() - 0.5) * 0.34, s: 10 + r() * 14, ph: r() * 6.283 }); return a; })();
export function halo(ctx, run, size, t, w, color) {
  const k = S(span(t, w.t0 + w.g * 0.8, w.t0 + w.g + 0.25)) * (1 - S(span(t, w.t1, w.t1 + w.q * 0.7)));
  if (k <= 0) return;
  const cx = (run.x0 + run.x1) / 2, cy = run.y, rx = (run.x1 - run.x0) / 2 + size * 0.14, ry = size * 0.86;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gl = disc(color); ctx.globalAlpha = 0.13 * k; ctx.drawImage(gl, cx - rx - 20, cy - ry - 10, (rx + 20) * 2, (ry + 10) * 2);
  const sp = sprite(color, mix(color, '#ffffff', 0.5));
  for (const h of haloPts) {
    const ang = h.a + t * h.v * 1.3, rr = 1 + h.j, x = cx + Math.cos(ang) * rx * rr, y = cy + Math.sin(ang) * ry * rr;
    const blink = 0.55 + 0.45 * Math.max(0, Math.sin(t * 3 + h.ph)) ** 2;
    ctx.globalAlpha = k * blink; ctx.drawImage(sp, x - h.s / 2, y - h.s / 2, h.s, h.s);
  }
  ctx.restore();
}

// A picture made ready for light the same way (a number, a logo): draw(g, colour) paints it; box: { x0, y0, x1, y1 } in frame pixels.
export function lightPicture(draw, box, { color, gap = 6, seed = 1, glow = 30 }) {
  const pad = glow * 1.5, ox = box.x0 - pad, oy = box.y0 - pad, w = box.x1 - box.x0 + pad * 2, h = box.y1 - box.y0 + pad * 2;
  const cv = canvas(w, h), g = cv.getContext('2d');
  g.translate(-ox, -oy); g.shadowBlur = glow; g.shadowColor = rgba(color, 0.55); draw(g, color); g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)'; draw(g, color);
  const mk = canvas(w, h), m = mk.getContext('2d', { willReadFrequently: true }); m.translate(-ox, -oy); draw(m, '#ffffff');
  const data = m.getImageData(0, 0, mk.width, mk.height).data, r = rng(seed), pts = [];
  let n = 0; for (let i = 3; i < data.length; i += 36) if (data[i] > 140) n++;
  const sp = Math.max(gap, Math.sqrt(n * 9 / 2400));
  for (let gy = sp / 2; gy < mk.height; gy += sp) for (let gx = sp / 2; gx < mk.width; gx += sp) {
    const x = gx + (r() - 0.5) * sp * 0.8, y = gy + (r() - 0.5) * sp * 0.8, xi = x | 0, yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= mk.width || yi >= mk.height || data[(yi * mk.width + xi) * 4 + 3] <= 140) continue;
    pts.push(point(r, x + ox, y + oy, 0, false));
  }
  const b = { x: box.x0, y: (box.y0 + box.y1) / 2, width: box.x1 - box.x0, row: 0, key: false };
  return { f: { size: box.y1 - box.y0 }, cv, ox, oy, boxes: [b], cuts: [{ x: ox, y: oy, w, h }], pts, runs: [], color, key: color };
}
