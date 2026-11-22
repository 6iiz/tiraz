// Pop motion: comic-book timing. Things pop: they zoom up from nothing, punch a little past full size and snap back, often with a
// small kick of rotation, so every arrival lands like a sound effect. Panels sit at a slight tilt. Things leave by shrinking fast to
// nothing. Every shape that carries text is a solid fill with a thick ink outline and a hard ink shadow; outlines never cross letters.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

// A punchy overshoot: about 12% past, then back to exactly 1.
export const pop = (p) => { p = clamp(p); const c1 = 2.6, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; };
export const E = ease.outCubic;

const lum = (h) => { const n = parseInt(h.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// paper: the brand's lighter colour, the panels; ink: its darker, every outline, shadow and most text; accent: the loud colour.
// on: whichever of paper and ink reads better on the accent. soft: the lightest ink tint that reads on paper at 4.5:1.
export function palette(brand, look) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = contrast(ink, accent) >= contrast(paper, accent) ? ink : paper;
  let k = look.tokens.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, paper) < 4.6 && k < 1) { k = Math.min(1, k + 0.04); soft = mix(paper, ink, Math.min(1, k)); }
  return { paper, ink, accent, on, soft, dots: mix(paper, accent, look.tokens.dots.tone) };
}

// A word pops in around its own centre. box: { x, y (middle), width }.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const s = Math.max(0.001, pop(p)), cx = box.x + box.width / 2;
  ctx.translate(cx, box.y); ctx.rotate((1 - E(p)) * -0.18); ctx.scale(s, s); ctx.translate(-cx, -box.y);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const s = 1 - ease.inQuad(p), cx = box.x + box.width / 2;
  ctx.translate(cx, box.y); ctx.scale(s, s); ctx.translate(-cx, -box.y);
}
// A whole group (a panel with its text) zooms in around (cx, cy) and rests at `tilt` radians; q (0..1) shrinks it away.
// Returns false when nothing shows. Call between save and restore.
export function zoom(ctx, p, q, cx, cy, tilt = 0) {
  if (p <= 0 || q >= 1) return false;
  const s = Math.max(0.001, pop(p) * (1 - ease.inQuad(q)));
  ctx.translate(cx, cy); ctx.rotate(tilt + (1 - E(p)) * -0.25); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// A comic panel: hard ink shadow, solid fill, thick ink outline.
export function panel(ctx, x, y, w, h, fill, P, T) {
  const o = T.ink.shadow, lw = T.ink.line;
  ctx.fillStyle = P.ink; ctx.fillRect(x + o, y + o, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = lw; ctx.strokeStyle = P.ink; ctx.lineJoin = 'miter'; ctx.strokeRect(x, y, w, h);
}

// A starburst whose inside always holds a box of half-size a by b around (cx, cy): its inner points sit on that box's outline, its
// spikes reach out only up and down, so a burst behind one word does not run over the words beside it. Behind a word inside a line
// it is drawn as a fill only: an outline there would cut into the letters next to it.
export function burstPath(cx, cy, a, b, spike, n = 18, phase = 0) {
  const path = new Path2D();
  for (let i = 0; i < n * 2; i++) {
    const th = phase + (i / (n * 2)) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    const edge = Math.min(a / Math.max(Math.abs(c), 1e-6), b / Math.max(Math.abs(s), 1e-6));
    const len = i % 2 ? 0 : spike * Math.abs(s) ** 0.8 * (i % 4 ? 0.8 : 1.12);   // no spikes sideways, into the next word
    const r = edge + len, x = cx + c * r, y = cy + s * r;
    if (i) path.lineTo(x, y); else path.moveTo(x, y);
  }
  path.closePath();
  return path;
}
export function burst(ctx, path, fill, P, T, shadow = true) {
  if (shadow) { ctx.save(); ctx.translate(T.ink.shadow, T.ink.shadow); ctx.fillStyle = P.ink; ctx.fill(path); ctx.restore(); }
  ctx.fillStyle = fill; ctx.fill(path);
  ctx.lineWidth = T.ink.line; ctx.lineJoin = 'miter'; ctx.miterLimit = 4; ctx.strokeStyle = P.ink; ctx.stroke(path);
}
// Short ink action lines radiating from (cx, cy) between radii r0 and r1.
export function action(ctx, cx, cy, r0, r1, n, P, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + 0.13, a = r0 + (r1 - r0) * (1 - p), c = Math.cos(th), s = Math.sin(th);
    ctx.beginPath(); ctx.moveTo(cx + c * a, cy + s * a); ctx.lineTo(cx + c * r1, cy + s * r1); ctx.stroke();
  }
  ctx.restore();
}

// Where the key words (*…*) of a fitted text land, measured once on a spare canvas, so a burst can be drawn behind a key word before
// the words beside it.
export function keyBoxes(kit, fitted, opts) {
  const c = document.createElement('canvas').getContext('2d'), boxes = [];
  kit.drawText(c, fitted, { ...opts, decor: true, each: (w, i, box) => { if (w.key) boxes.push({ ...box, i }); return false; } });
  return boxes;
}
