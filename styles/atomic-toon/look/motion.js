// Atomic-toon motion and shared drawing: a flat mid-century cartoon. Rooms are not drawn, they are colour planes: a wall, a floor band,
// a horizon line with gaps, and a prop or two. Every shape is printed like a hand-registered cel: its flat fill sits a few pixels off
// its thin broken ink line, and both re-settle on twos (`twos`), so the picture shimmers while it holds. Animation is limited: things
// do not glide, they pop on in a few held drawings (`pop`), cards turn on their axis (`flip`), arrows are drawn on along a curve.
import { clamp, ease, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = ease.outCubic;
export const IO = ease.inOutCubic;
export const twos = (t) => Math.floor(t * 12 + 1e-6);                  // the drawing number, twelve a second

// A number in 0..1 from a drawing and an id: the same inputs always give the same number.
export const hash = (n, id = 0) => { const s = Math.sin(n * 12.9898 + id * 78.233) * 43758.5453; return s - Math.floor(s); };
// The fill's offset from its line on this drawing: a fixed slip down and across, plus a re-roll of a pixel or two.
export const reg = (t, id) => { const n = twos(t); return { x: 5 + (hash(n, id) - 0.5) * 3.5, y: 4 + (hash(n, id + 0.5) - 0.5) * 3.5 }; };

// Colours: paper (the lighter brand colour), ink (the darker), the accent, and soft planes mixed from them. Each scene takes one wall.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  const onAccent = contrast(accent, ink) >= contrast(accent, paper) ? ink : paper;
  const walls = [mix(paper, accent, 0.2), mix(paper, ink, 0.09), mix(mix(paper, accent, 0.12), ink, 0.05)];
  return { paper, ink, accent, onAccent, walls, tint: mix(paper, accent, 0.45), soft: mix(paper, ink, 0.16), grey: mix(paper, ink, 0.5) };
}

// A shape printed off register: fill at the drawing's slip, then the broken ink line in place. path: a Path2D.
// o: { fill, line, width, id, t, gaps (0..1, how broken), alpha }
export function cel(ctx, path, o) {
  const r = reg(o.t, o.id ?? 0);
  if (o.fill) { ctx.save(); ctx.translate(r.x, r.y); ctx.fillStyle = o.fill; ctx.fill(path); ctx.restore(); }
  if (o.line) {
    const n = twos(o.t), w = o.width ?? 4, gaps = o.gaps ?? 0.18;
    ctx.save(); ctx.strokeStyle = o.line; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = w * (0.85 + 0.3 * hash(n, (o.id ?? 0) + 3));      // the line breathes a little on each drawing
    const dash = 70 + 60 * hash(o.id ?? 0, 9);
    ctx.setLineDash([dash * (1 - gaps), dash * gaps]); ctx.lineDashOffset = hash(n, (o.id ?? 0) + 7) * 6;
    ctx.stroke(path); ctx.restore();
  }
}

// Paths.
export function circle(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; }
export function round(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
// A kidney: a soft bean, wider than tall, with a dent on its top edge. (x, y) is the centre.
export function kidney(x, y, w, h, seed = 1) {
  const p = new Path2D(), r = rng(seed), n = 48, a = w / 2, b = h / 2;
  const k = [r() * 0.12, r() * 0.1];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    const dent = 1 - 0.16 * Math.exp(-Math.pow((th - Math.PI * 1.5) * 1.6, 2));        // the dent on the top edge
    const rr = dent * (1 + k[0] * Math.cos(2 * th) + k[1] * Math.sin(3 * th));
    const px = x + c * a * rr, py = y + s * b * rr * (c < 0 ? 1.08 : 0.94);
    i ? p.lineTo(px, py) : p.moveTo(px, py);
  }
  p.closePath(); return p;
}
// A boomerang: two tapered arms meeting at a rounded elbow. (x, y) the elbow, s the size, a the turn.
export function boomerang(x, y, s, a) {
  const p = new Path2D(), m = new DOMMatrix().translate(x, y).rotate(a), q = (px, py) => m.transformPoint(new DOMPoint(px, py));
  const pts = [[0, -0.12], [1, -0.05], [1.04, 0.05], [0.12, 0.16], [0.05, 1.0], [-0.06, 1.02], [-0.14, 0.05]].map(([u, v]) => q(u * s, v * s));
  p.moveTo(pts[0].x, pts[0].y); for (const pt of pts.slice(1)) p.lineTo(pt.x, pt.y); p.closePath(); return p;
}
// A four-point sparkle, the atomic star.
export function sparkle(x, y, r) {
  const p = new Path2D();
  for (let i = 0; i < 8; i++) { const th = (i / 8) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.2 : r; i ? p.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr) : p.moveTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr); }
  p.closePath(); return p;
}

// Popping on, in held drawings: 0 (not yet), then a small, an overshoot, a settle, home. p is progress over `len` seconds.
const POP = [0, 0.55, 1.12, 0.96, 1];
export function pop(t, t0, len = 0.34) {
  if (t < t0) return 0;
  const k = Math.floor(((t - t0) / len) * (POP.length - 1) + 1e-6) + 1;
  return k >= POP.length ? 1 : POP[k];
}
// Scales the canvas about (cx, cy) by s; returns false when s is 0 (nothing to draw). Use inside a save.
export function grow(ctx, s, cx, cy) { if (s <= 0) return false; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
// A card turning on its vertical axis, in held drawings: p 0..1 of the turn in, q 0..1 of the turn out.
export function flip(ctx, t, tIn, tOut, cx, cy) {
  const step = (x) => Math.floor(clamp(x) * 4 + 1e-6) / 4;
  const a = step((t - tIn) / 0.3), b = tOut == null ? 0 : step((t - tOut) / 0.3);
  const sx = Math.sin((a * Math.PI) / 2) * Math.cos((b * Math.PI) / 2);
  if (sx <= 0.01) return false;
  ctx.translate(cx, cy); ctx.scale(sx, 1); ctx.translate(-cx, -cy);
}

// A curved arrow drawn on along a quadratic curve from (x0, y0) to (x1, y1) bending through (cx, cy); its head arrives last.
export function arrow(ctx, x0, y0, cx, cy, x1, y1, p, ink, t, id = 50) {
  p = clamp(p); if (p <= 0) return;
  const n = 30, m = Math.max(1, Math.floor(n * p)), pt = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  const path = new Path2D(); path.moveTo(x0, y0); for (let i = 1; i <= m; i++) path.lineTo(...pt((i / n)));
  cel(ctx, path, { line: ink, width: 6, id, t, gaps: 0.12 });
  if (p >= 1) {
    const [ax, ay] = pt(1), [bx, by] = pt(0.9), an = Math.atan2(ay - by, ax - bx), L = 30;
    const head = new Path2D(); head.moveTo(ax, ay); head.lineTo(ax - L * Math.cos(an - 0.5), ay - L * Math.sin(an - 0.5));
    head.moveTo(ax, ay); head.lineTo(ax - L * Math.cos(an + 0.5), ay - L * Math.sin(an + 0.5));
    cel(ctx, head, { line: ink, width: 6, id: id + 1, t, gaps: 0 });
  }
}

// Paper grain and a warm rim, made once per palette.
const grains = new Map();
export function grain(W, H, P) {
  const id = P.paper + P.ink; if (grains.has(id)) return grains.get(id);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(1950);
  for (let i = 0; i < 14000; i++) { g.fillStyle = rgba(r() < 0.6 ? P.ink : P.paper, 0.03 + r() * 0.05); g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 260; i++) { g.fillStyle = rgba(P.paper, 0.05 + r() * 0.06); g.fillRect(r() * W, r() * H, 20 + r() * 90, 1.5); }   // dry-brush tooth
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, H * 0.8);
  v.addColorStop(0, rgba(P.ink, 0)); v.addColorStop(1, rgba(P.ink, 0.16)); g.fillStyle = v; g.fillRect(0, 0, W, H);
  grains.set(id, cv); return cv;
}

// Wrapped text with even rows (narrowed at the same size while the row count holds).
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 12; w > o.maxW * 0.4; w -= 12) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}

// The key word's blob: a kidney of the accent printed off register behind the word, with its broken ink line. Draw the blobs in a
// pass of their own before the words (see `blobs`), so a blob never covers a neighbouring word.
export function keyBlob(c, b, size, P, t, id, space = size) {
  const path = kidney(b.x + b.width / 2, b.y + size * 0.02, b.width + Math.min(size * 0.42, space * 1.5), size * 1.3, id);
  cel(c, path, { fill: P.accent, line: P.ink, width: 4, id, t, gaps: 0.2 });
  return P.onAccent;
}

// The pass of blobs under a fitted text: same layout as the words, nothing but the blobs is drawn. grow(w, i, b, c) applies the word's
// pop (returns false when not on yet).
export function blobs(kit, ctx, f, o, P, t, idBase, grow) {
  kit.drawText(ctx, f, { ...o, decor: true, each: (w, i, b, c) => {
    if (w.key && (!grow || grow(w, i, b, c) !== false)) keyBlob(c, b, f.size, P, t, idBase + i, f.space);
    return false;
  } });
}
