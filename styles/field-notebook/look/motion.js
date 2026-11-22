// Field-notebook motion: everything is drawn by a pencil at the pace of a hand. Words are written in, the pencil moving from the
// reading side through each word before the next is begun; lines are traced along their length; tones are hatched in, the strokes of
// a patch appearing in the order the hand lays them. Nothing slides or pops. Things leave by being rubbed out: the graphite thins in
// reading order while the eraser's rubbing shivers it. This file also holds what the parts share: the palette, the wobbling pencil
// line, hatching, the paper tag, and the word-by-word writing.
import { clamp, ease, mix, contrast, rng, lerp } from '/engine/kit.js';

export const E = (p) => ease.inOutQuad(p);                 // a hand's stroke: starts, travels, eases off

// Colours. The lighter brand colour is the paper, the darker one is the graphite (a touch softened toward the paper, as pencil is),
// the accent is the one coloured pencil. If the accent is too pale to see on the paper, it is taken toward the graphite until it shows.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  let pen = accent, k = 0; while (contrast(pen, paper) < 2.2 && k < 0.7) { k += 0.05; pen = mix(accent, ink, k); }
  return {
    paper, ink, pen, accent,
    graphite: mix(ink, paper, 0.08), soft: mix(ink, paper, 0.32), faint: mix(ink, paper, 0.78),
    tag: mix(paper, ink, 0.035), soil: [mix(paper, ink, 0.16), mix(paper, pen, 0.28), mix(paper, ink, 0.3), mix(paper, ink, 0.45)],
  };
}

// A pencil polyline through pts, drawn up to fraction p of its length, with a soft double stroke (the pencil's grain).
export function pencil(ctx, pts, p, color, width = 3) {
  if (p <= 0 || pts.length < 2) return;
  let total = 0; const L = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(total); }
  const end = total * clamp(p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [w, a, dy] of [[width, 0.85, 0], [width * 0.55, 0.5, width * 0.35]]) {
    ctx.globalAlpha = a; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] + dy);
    for (let i = 1; i < pts.length; i++) {
      if (L[i] <= end) ctx.lineTo(pts[i][0], pts[i][1] + dy);
      else { const f = (end - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f) + dy); break; }
    }
    ctx.stroke();
  }
  ctx.restore();
}
// A hand-drawn segment from a to b: a few points with a small, seeded wobble, slightly overshooting both ends.
export function wobble(a, b, seed, amp = 2.5, n = 10) {
  const r = rng(seed), pts = [], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) { const f = -0.02 + (i / n) * 1.04, o = Math.sin(f * 3.1 + r() * 0.6) * amp * 0.6 + (r() - 0.5) * amp; pts.push([a[0] + dx * f + nx * o, a[1] + dy * f + ny * o]); }
  return pts;
}

// Hatching on a canvas of w x h: patches of short parallel strokes at `angle`, each patch turned a little, `gap` apart, in `color`.
// order: each stroke gets a time 0..1 (along the reading direction, with jitter) so it can be drawn in progressively; returned as a list.
export function hatchStrokes(w, h, { angle = -0.9, gap = 7, len = 34, seed = 1, rtl = true, dens = 1 } = {}) {
  const r = rng(seed), out = [], step = gap / dens;
  for (let py = -len; py < h + len; py += len * 0.8) for (let px = -len; px < w + len; px += len * 0.9) {
    const a = angle + (r() - 0.5) * 0.25, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    for (let k = -len / 2; k < len / 2; k += step * (0.8 + r() * 0.4)) {
      const cx = px + nx * k + (r() - 0.5) * 6, cy = py + ny * k + (r() - 0.5) * 6, l = len * (0.6 + r() * 0.5);
      const t = clamp((rtl ? 1 - cx / w : cx / w) * 0.85 + r() * 0.15);
      out.push({ x0: cx - ca * l / 2, y0: cy - sa * l / 2, x1: cx + ca * l / 2, y1: cy + sa * l / 2, t, a: 0.45 + r() * 0.5, w: 1.3 + r() * 1.2 });
    }
  }
  return out;
}
// Draws hatch strokes (from hatchStrokes) into ctx at (x, y), those whose time is under p, clipped by the caller.
export function drawHatch(ctx, strokes, x, y, p, color) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (const s of strokes) { if (s.t > p) continue; ctx.globalAlpha = s.a; ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(x + s.x0, y + s.y0); ctx.lineTo(x + s.x1, y + s.y1); ctx.stroke(); }
  ctx.restore();
}
// The same hatching baked into a canvas (for tones that are drawn whole), with the paper's tooth knocked out of it.
export function hatchCanvas(w, h, color, o = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
  drawHatch(cv.getContext('2d'), hatchStrokes(w, h, o), 0, 0, 1, color);
  return cv;
}

// A paper tag: a rectangle whose far end is cut to a point, with a punched hole. Returns its outline as pencil points and the hole.
export function tag(x, y, w, h, rtl, seed) {
  const nose = h * 0.42, far = rtl ? x : x + w, s = rtl ? 1 : -1;     // s points from the far end back into the tag
  const A = [x + (rtl ? w : 0), y], B = [far + s * nose, y], C = [far, y + h / 2], D = [far + s * nose, y + h], F = [x + (rtl ? w : 0), y + h];
  const pts = [...wobble(A, B, seed, 1.6, 8), ...wobble(B, C, seed + 1, 1.2, 4), ...wobble(C, D, seed + 2, 1.2, 4), ...wobble(D, F, seed + 3, 1.6, 8), ...wobble(F, A, seed + 4, 1.4, 5)];
  return { pts, hole: [far + s * nose * 0.62, y + h / 2], path: [A, B, C, D, F] };
}
export function fillPoly(ctx, path, color) { ctx.fillStyle = color; ctx.beginPath(); path.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill(); }

// Writing: a schedule for the words of a fitted text, each word written in turn from the reading side at `speed` px a second, with a
// short lift between words. Returns { at(i) -> [t0, t1], end }.
export function schedule(f, t0, speed = 900, lift = 0.07) {
  const times = []; let t = t0;
  f.rows.forEach((row) => row.words.forEach((w) => { const d = Math.max(0.09, w.width / speed); times.push([t, t + d]); t += d + lift; }));
  return { at: (i) => times[i], end: t };
}
// Inside kit.drawText's `each`: reveals the word behind the moving pencil (a clip that grows from the word's reading edge), and rubs it
// out in reading order when `rub` (0..1) runs. Returns false when nothing of the word shows.
export function write(c, t, span2, box, size, rtl, rub = 0, i = 0, n = 1) {
  const p = clamp((t - span2[0]) / (span2[1] - span2[0]));
  if (p <= 0) return false;
  const r = clamp(rub * 1.6 - (i / Math.max(1, n)) * 0.6);
  if (r >= 1) return false;
  if (r > 0) { c.globalAlpha *= 1 - r; c.translate(Math.sin(r * 40 + i) * 3 * (1 - r), 0); }
  if (p < 1) { const w = (box.width + size * 0.3) * p; c.beginPath(); c.rect(rtl ? box.x + box.width + size * 0.15 - w : box.x - size * 0.15, box.y - size, w, size * 2); c.clip(); }
}
