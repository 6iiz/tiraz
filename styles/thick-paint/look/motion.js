// Thick-paint motion: everything is laid on with a palette knife. A plane of paint appears behind a slanted front edge that travels
// from the reading side (the knife's pass), with a raised lip of fresh paint riding on that edge; it leaves by being scraped off by a
// second pass the same way. Nothing fades and nothing slides: paint is either laid or taken off. Words are laid with the plane they sit
// on, and every letter has body: a dark lower edge and a lit upper edge, as if the light rakes across thick paint from the top left.
// This file also holds what the parts share: the palette, the knife stroke, a plane of strokes, and the relief text.
import { clamp, ease, mix, contrast, rng, lerp } from '/engine/kit.js';

export const K = (p) => ease.inOutCubic(p);            // the knife's pass: a push, a drag, a lift
export const LAND = (p) => 1 - (1 - clamp(p)) ** 4;    // something pressed into the paint

// Colours. The darker brand colour is the ground (the canvas under the paint), the lighter one is the paint the words are laid in, the
// accent is the one pure colour. Shading is the same colour pushed toward black or white by a few percent: the light on the ridges.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const dark = contrast(bg, '#000000') <= contrast(text, '#000000') ? bg : text, light = dark === bg ? text : bg;
  const on = (f) => (contrast(f, dark) >= contrast(f, light) ? dark : light);
  return {
    ground: dark, paint: light, accent, on, onAccent: on(accent),
    muted: mix(light, dark, 0.3), plane: mix(dark, light, 0.12), plane2: mix(dark, light, 0.2),
    shade: (c, k = 0.45) => mix(c, '#000000', k), lift: (c, k = 0.3) => mix(c, '#ffffff', k),
  };
}

// One knife stroke on a canvas: a long slab with slanted ends, its colour dragged from c1 into c2 along its length, a lit ridge on the
// upper edge, a dark lip on the lower one, two faint blade scratches, and a broken run-out where the paint gave out.
export function stroke(g, cx, cy, len, wid, ang, c1, c2, r, body = 1) {
  g.save(); g.translate(cx, cy); g.rotate(ang);
  const sk = wid * (0.25 + r() * 0.3) * (r() < 0.5 ? 1 : -1), j = () => (r() - 0.5) * wid * 0.12;
  g.beginPath();
  g.moveTo(-len / 2 + sk, -wid / 2 + j()); g.lineTo(len / 2 + sk * 0.5, -wid / 2 + j());
  g.lineTo(len / 2 - sk * 0.5, wid / 2 + j()); g.lineTo(-len / 2 - sk, wid / 2 + j()); g.closePath();
  const gr = g.createLinearGradient(-len / 2, 0, len / 2, 0); gr.addColorStop(0, c1); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2);
  g.fillStyle = gr; g.fill();
  if (body > 0) {
    g.globalAlpha = body;
    g.fillStyle = mix(c1, '#ffffff', 0.16); g.fillRect(-len / 2 + Math.abs(sk), -wid / 2, len * 0.86, Math.max(2, wid * 0.06));
    g.fillStyle = mix(c1, '#000000', 0.32); g.fillRect(-len / 2 + Math.abs(sk) * 0.5, wid / 2 - Math.max(2, wid * 0.07), len * 0.92, Math.max(2, wid * 0.07));
    g.globalAlpha = 0.12 * body; g.fillStyle = mix(c1, "#ffffff", 0.1);
    for (let i = 0; i < 2; i++) g.fillRect(-len * 0.4 + r() * len * 0.2, -wid * 0.3 + r() * wid * 0.6, len * (0.4 + r() * 0.4), 1.2);
    g.globalAlpha = 1; g.fillStyle = c2;                               // the run-out: broken streaks past the far end
    for (let i = 0; i < 4; i++) g.fillRect(len / 2 - 6 + r() * 8, -wid / 2 + r() * wid, 8 + r() * wid * 0.9, 1 + r() * wid * 0.08);
  }
  g.restore();
}

// A plane of paint w x h, built once: an underlayer, then rows of overlapping knife strokes of `base`, each a few percent toward the
// colours in `drift`. The canvas has a margin `pad` all round, where the stroke ends run out raggedly.
export function plane(w, h, base, drift, seed, { pad = 22, row = 44, ang = 0.035, body = 1 } = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w + pad * 2); cv.height = Math.ceil(h + pad * 2);
  const g = cv.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(pad, pad + 3, w, h - 6);
  const n = Math.max(1, Math.round(h / row)), rh = h / n;
  for (let k = 0; k < n; k++) {
    let x = pad - 10 - r() * 14;
    while (x < pad + w) {
      const len = Math.min(w * 0.75, 140 + r() * Math.max(80, w * 0.45)), c1 = mix(base, drift[Math.floor(r() * drift.length)], r() * 0.08);
      const c2 = mix(base, drift[Math.floor(r() * drift.length)], 0.04 + r() * 0.1);
      const end = Math.min(x + len, pad + w + 12 + r() * 8);
      stroke(g, (x + end) / 2, pad + rh * (k + 0.5) + (r() - 0.5) * rh * 0.2, end - x, rh * 1.35, (r() - 0.5) * ang * 2, c1, c2, r, body);
      x = Math.max(x + (end - x) * 0.45, end - 24 - r() * 30);
    }
  }
  return { cv, pad, w, h };
}
export function drawPlane(ctx, P, x, y) { ctx.drawImage(P.cv, x - P.pad, y - P.pad); }

// The knife's pass over a box. p 0..1 lays (the front travels from the reading side to the far side); q 0..1 scrapes it off the same
// way. draw() paints what the pass reveals. lip: the colour of the paint pushed ahead of the blade (none when omitted).
const front = (d, y, h, s, yy) => d + s / 2 - (s * (yy - y)) / h;
function clipPass(ctx, x, y, w, h, d, s, rtl, keepNear) {
  const X = (v) => (rtl ? x + w - v : x + v), y0 = y - 60, y1 = y + h + 60, far = keepNear ? -2000 : w + 2000;
  ctx.beginPath(); ctx.moveTo(X(far), y0); ctx.lineTo(X(front(d, y, h, s, y0)), y0); ctx.lineTo(X(front(d, y, h, s, y1)), y1); ctx.lineTo(X(far), y1); ctx.closePath(); ctx.clip();
}
export function knife(ctx, box, p, q, rtl, draw, lip) {
  if (p <= 0 || q >= 1) return;
  const { x, y, w, h } = box, s = Math.min(90, h * 0.45);
  ctx.save();
  if (q > 0) clipPass(ctx, x, y, w, h, lerp(-s - 40, w + s + 40, K(q)), s, rtl, false);
  if (p < 1) clipPass(ctx, x, y, w, h, lerp(-s - 40, w + s + 40, K(p)), s, rtl, true);
  draw();
  ctx.restore();
  const edge = (d, c) => {
    if (d < 0 || d > w) return;
    const X = (v) => (rtl ? x + w - v : x + v);
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = Math.max(5, h * 0.05); ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(X(front(d, y, h, s, y - 8)), y - 8); ctx.lineTo(X(front(d, y, h, s, y + h + 8)), y + h + 8); ctx.stroke(); ctx.restore();
  };
  if (lip && p < 1) edge(lerp(-s - 40, w + s + 40, K(p)) - 4, lip);
  if (lip && q > 0 && q < 1) edge(lerp(-s - 40, w + s + 40, K(q)) + 4, lip);
}

// Text with body: a dark pass below-right, a lit pass above-left, then the paint itself, all through kit.drawText (the first two are
// decoration). under(w, i, box, c) draws backing in the first pass only. each(w, i, box, c) may clip or skip a word (false).
// surface: the colour under the text (for its shadow); keySurface: under key words.
export function relief(kit, ctx, f, o) {
  const { x0, x1, y, align = 'start', color, key = color, surface, keySurface = surface, each, under, depth = 0.035 } = o;
  const d = Math.max(2, f.size * depth);
  const pass = (dx, dy, col, kcol, decor, first) => kit.drawText(ctx, f, { x0, x1, y, align, color: col, key: kcol, decor,
    each: (w, i, box, c) => {
      if (each && each(w, i, box, c) === false) return false;
      if (first && under) under(w, i, box, c);
      c.translate(dx, dy);
    } });
  pass(d, d * 1.2, mix(surface, '#000000', 0.5), mix(keySurface, '#000000', 0.5), true, true);
  pass(-d * 0.5, -d * 0.5, mix(color, '#ffffff', 0.32), mix(key, '#ffffff', 0.32), true, false);
  pass(0, 0, color, key, false, false);
}
export function reliefNumber(kit, ctx, str, o) {
  const d = Math.max(3, o.size * 0.025);
  kit.number(ctx, str, { ...o, x: o.x + d, y: o.y + d * 1.2, color: mix(o.surface, '#000000', 0.5), decor: true });
  kit.number(ctx, str, { ...o, x: o.x - d * 0.5, y: o.y - d * 0.5, color: mix(o.color, '#ffffff', 0.32), decor: true });
  kit.number(ctx, str, o);
}
