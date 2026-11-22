// Wax storybook motion and materials. Everything drawn in this style is wax crayon on toothy paper: a stroke or a hatch is painted
// solid on a spare sheet, then the paper's tooth is laid over it as a mask, so the wax keeps only the peaks of the grain and the
// paper shows through the valleys. Three pressures (light, mid, heavy) are three masks cut from one tooth field built once.
// Lines "boil": every line is drawn again, a hair different, eight times a second, as a hand-drawn page does. Colouring-in is a
// back-and-forth zigzag that runs along its own length; the printed words of the book are written in from the reading side.
import { clamp, rng, mix, contrast, ease } from '/engine/kit.js';

export const E = ease.outCubic;
export const IO = ease.inOutCubic;

// Colours, from the brand only: the lighter brand colour is the paper, the darker one the wax of the outlines and the print.
export function palette(brand) {
  const { bg, text, accent } = brand.colors, white = '#ffffff';
  const light = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, dark = light === bg ? text : bg;
  const paper = light, ink = dark;
  let k = 0.5, grey = mix(paper, ink, k); while (contrast(grey, paper) < 4.6 && k < 0.95) { k += 0.05; grey = mix(paper, ink, k); }
  const key = contrast(accent, ink) >= 4.5 ? accent : mix(accent, paper, 0.55);          // the crayon behind a key word: ink must read on it
  const deep = contrast(accent, paper) >= 2.2 ? accent : mix(accent, ink, 0.45);          // the accent as a line on paper
  return {
    paper, ink, grey, accent, key, deep, white,
    wash: mix(paper, accent, 0.28), hill: mix(paper, accent, 0.55), hill2: mix(paper, ink, 0.2),
    soft: mix(paper, ink, 0.3), shade: mix(paper, ink, 0.08),
  };
}

// ---------- the paper's tooth ----------
let TOOTH = null;
export function masks(W, H) {
  if (TOOTH && TOOTH.W === W) return TOOTH;
  const w = W >> 1, h = H >> 1, r = rng(4471), n = new Float32Array(w * h);
  const G = 24, gw = Math.ceil(w / G) + 2, gh = Math.ceil(h / G) + 2, low = new Float32Array(gw * gh);
  for (let i = 0; i < low.length; i++) low[i] = r();
  for (let y = 0; y < h; y++) {
    const fy = y / G, y0 = fy | 0, ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
    const fib = Math.sin(y * 0.9 + Math.sin(y * 0.031) * 4) * 0.5 + 0.5;
    for (let x = 0; x < w; x++) {
      const fx = x / G, x0 = fx | 0, tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
      const a = low[y0 * gw + x0], b = low[y0 * gw + x0 + 1], c = low[(y0 + 1) * gw + x0], d = low[(y0 + 1) * gw + x0 + 1];
      const v = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      n[y * w + x] = 0.62 * r() + 0.26 * v + 0.12 * fib;
    }
  }
  const cut = (level) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data, th = 1 - level;
    for (let i = 0; i < n.length; i++) { const a = clamp((n[i] - th) / 0.12); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = a * 255; }
    g.putImageData(img, 0, 0); return cv;
  };
  TOOTH = { W, light: cut(0.5), mid: cut(0.7), heavy: cut(0.86), field: n };
  return TOOTH;
}

// Paints with wax: paint(c) draws solid colour on a spare sheet (with the frame's transform), the tooth mask is laid over the box, and
// the result goes onto ctx. box = [x, y, w, h] in frame pixels: the only area touched, to keep a frame cheap.
let SPARE = null;
export function wax(ctx, mask, box, paint) {
  const cv = ctx.canvas;
  if (!SPARE) SPARE = document.createElement('canvas');
  if (SPARE.width !== cv.width || SPARE.height !== cv.height) { SPARE.width = cv.width; SPARE.height = cv.height; }
  let [x, y, w, h] = box; x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
  w = Math.min(cv.width, Math.ceil(box[0] + w)) - x; h = Math.min(cv.height, Math.ceil(box[1] + h)) - y;
  if (w <= 0 || h <= 0) return;
  const s = SPARE.getContext('2d');
  s.save(); s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1; s.clearRect(x, y, w, h);
  s.beginPath(); s.rect(x, y, w, h); s.clip();
  s.setTransform(ctx.getTransform()); s.lineCap = 'round'; s.lineJoin = 'round';
  paint(s);
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'destination-in'; s.globalAlpha = 1;
  s.drawImage(mask, x / 2, y / 2, w / 2, h / 2, x, y, w, h);
  s.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(SPARE, x, y, w, h, x, y, w, h); ctx.restore();
}

// ---------- strokes ----------
// The boil: which drawing of a line is showing at this moment (eight a second).
export const boilAt = (time, fps = 8) => Math.floor(time * fps + 1000);

// A crayon line through points: a firm core with a lighter, wider edge, every point nudged by the hand (seeded per boil).
export function stroke(c, pts, width, color, seed = 1, p = 1, wob = 1.6) {
  if (pts.length < 2 || p <= 0) return;
  const r = rng(seed * 7919 + 13), q = pts.map(([x, y]) => [x + (r() - 0.5) * 2 * wob, y + (r() - 0.5) * 2 * wob]);
  const part = partial(q, p);
  c.strokeStyle = color;
  for (const [lw, a, dx, dy] of [[width, 0.75, 0, 0], [width * 0.55, 1, width * 0.12, -width * 0.08], [width * 0.3, 1, -width * 0.2, width * 0.15]]) {
    c.globalAlpha = a; c.lineWidth = lw; c.beginPath();
    part.forEach(([x, y], i) => (i ? c.lineTo(x + dx, y + dy) : c.moveTo(x + dx, y + dy))); c.stroke();
  }
  c.globalAlpha = 1;
}
// The first fraction p of a polyline, by length.
export function partial(pts, p) {
  if (p >= 1) return pts;
  let total = 0; const L = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(total); }
  const want = total * clamp(p), out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= want) { out.push(pts[i]); continue; }
    const k = (want - L[i - 1]) / (L[i] - L[i - 1] || 1);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]); break;
  }
  return out;
}
// A loop drawn by hand around a centre: it starts a little past where it ends, so the ends overlap as a child's circle does.
export function loop(cx, cy, rx, ry, seed = 1, turns = 1.12, n = 40) {
  const r = rng(seed), a0 = -Math.PI * 0.6 + r() * 0.5, out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 - (i / n) * Math.PI * 2 * turns, k = 1 + Math.sin(i * 0.7 + seed) * 0.03 + (r() - 0.5) * 0.03 + (i / n) * 0.05;
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}
// Colouring in: a zigzag that runs back and forth across a box at an angle, gap px apart, cut to the first p of its length.
export function zigzag(x, y, w, h, angle = -0.5, gap = 14, seed = 1) {
  const r = rng(seed), cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2 + gap, ca = Math.cos(angle), sa = Math.sin(angle), out = [];
  for (let v = -R, i = 0; v <= R; v += gap, i++) {
    const u = (i % 2 ? 1 : -1) * (R * 0.98 + (r() - 0.5) * gap);
    out.push([cx + u * ca - v * sa, cy + u * sa + v * ca]);
  }
  return out;
}
// A scribbled fill of a shape: the zigzag, clipped to the shape nudged a few px (colour spills past the line).
export function colour(c, shape, box, color, p = 1, seed = 1, angle = -0.5, gap = 13) {
  if (p <= 0) return;
  c.save(); c.translate(2.5, 2); c.clip(shape); c.translate(-2.5, -2);
  stroke(c, zigzag(box[0], box[1], box[2], box[3], angle, gap, seed), gap * 1.25, color, seed, p, 2);
  c.restore();
}
// A rough path through points as a closed Path2D, for clipping.
export function shapeOf(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; }
export function ellipse(cx, cy, rx, ry) { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); return p; }

// The printed words of the book are written in from the reading side: a clip that opens across the word.
export function write(c, p, box, size, rtl = true) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const e = E(p), w = (box.width + 24) * e, h = size * 2;
  c.beginPath(); c.rect(rtl ? box.x + box.width + 12 - w : box.x - 12, box.y - h / 2, w, h); c.clip();
}
