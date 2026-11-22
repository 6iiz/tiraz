// Rapid Play motion and drawing kit: a party-game show. Flat toon shapes with a thick dark outline and one hard shadow, cards that
// slam in (overshoot, settle) and shrink away into a corner, a fuse that burns knot by knot on the beat, and a game that gets faster
// each stage. Colour is the brand's three and mixes of them; the dark colour is always the outline.
import { mix, contrast, clamp, rgba } from '/engine/kit.js';

export function palette(brand) {
  const { bg, text, accent: a } = brand.colors, L = (c) => contrast(c, '#000000');
  const [d, l] = L(bg) < L(text) ? [bg, text] : [text, bg];
  const onA = contrast(a, d) >= contrast(a, l) ? d : l;
  return { d, l, a, onA, ray: mix(a, d, 0.22), ray2: mix(a, d, 0.4), floor: mix(d, a, 0.18), lcd: mix(l, a, 0.28), paper: l,
    rule: mix(l, d, 0.12), tint: mix(l, a, 0.16), tint2: mix(l, a, 0.26), dot: rgba(d, 0.13) };
}
export const OUT = 8, SHADOW = 14;
// the stage number grows with the reel: every few seconds the game speeds up
export const stage = (clock) => Math.min(8, 1 + Math.floor(Math.max(0, clock) / 3.2));
export const speed = (clock) => 1 + 0.14 * (stage(clock) - 1);

// the slam: big and fast, a small undershoot, then it settles (one gesture, about 0.22 s)
export function slam(p) {
  p = clamp(p); if (p <= 0) return 0;
  if (p < 0.4) { const q = p / 0.4; return 1.7 - 0.78 * (1 - (1 - q) ** 2); }
  const q = (p - 0.4) / 0.6; return 0.92 + 0.08 * (1 - (1 - q) ** 3);
}
export const out3 = (p) => 1 - (1 - clamp(p)) ** 3;
export const in2 = (p) => clamp(p) ** 2;
export const back = (p) => { p = clamp(p); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; };

// A toon shape: hard shadow down-right, fill, thick outline. path(ctx) traces the shape.
export function toon(ctx, path, fill, P, shadow = SHADOW, lw = OUT) {
  ctx.save();
  if (shadow) { ctx.save(); ctx.translate(shadow, shadow); ctx.beginPath(); path(ctx); ctx.fillStyle = P.d; ctx.fill(); ctx.restore(); }
  ctx.beginPath(); path(ctx); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = P.d; ctx.stroke();
  ctx.restore();
}
export const rect = (x, y, w, h, r = 18) => (c) => c.roundRect(x, y, w, h, r);
export const star = (cx, cy, r0, r1, n, rot = 0) => (c) => {
  for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, r = i % 2 ? r0 : r1; i ? c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  c.closePath();
};
// A word's burst: a spiky star behind a key word, sized to its box.
export function burst(ctx, box, size, P, k = 0) {
  const w = box.width / 2 + size * 0.14, h = size * 0.98, n = 10;
  toon(ctx, (c) => { for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n + k, r = i % 2 ? 0.86 : 1.08; const x = box.x + box.width / 2 + Math.cos(a) * w * r, y = box.y + Math.sin(a) * h * r;
    i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }, P.a, P, 0, 5);
}
// Where the key words of a fitted text fall (laid out once, nothing drawn), so their bursts can go behind every word.
export function keyBoxes(kit, f, o) {
  const c = document.createElement('canvas').getContext('2d'), out = [];
  kit.drawText(c, f, { ...o, decor: true, each: (w, i, box) => { if (w.key) out.push({ ...box, i }); return false; } });
  return out;
}
// A heart for the lives board.
export const heart = (x, y, s) => (c) => { c.moveTo(x, y + s * 0.3); c.bezierCurveTo(x, y - s * 0.1, x - s * 0.55, y - s * 0.15, x - s * 0.55, y + s * 0.22);
  c.bezierCurveTo(x - s * 0.55, y + s * 0.5, x - s * 0.2, y + s * 0.65, x, y + s * 0.85); c.bezierCurveTo(x + s * 0.2, y + s * 0.65, x + s * 0.55, y + s * 0.5, x + s * 0.55, y + s * 0.22);
  c.bezierCurveTo(x + s * 0.55, y - s * 0.15, x, y - s * 0.1, x, y + s * 0.3); c.closePath(); };

// ---- the LCD game's seven-segment digits (our own geometry) ----
const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g' };
export const canSeg = (s) => [...s].every((ch) => SEG[ch] || ch === ',' || ch === '.' || ch === ' ');
const cw = (ch, h) => (SEG[ch] ? h * 0.56 + h * 0.14 : h * 0.24);
export const segWidth = (s, h) => [...s].reduce((w, ch) => w + cw(ch, h), 0) - h * 0.14;
export function segText(ctx, s, x, y, h, color, ghost) {           // x = left, y = top
  const th = h * 0.13, w = h * 0.56, half = h / 2;
  const seg = (k, X) => { const sk = h * 0.06;                         // a slight lean, like a real LCD
    const pts = { a: [X + th * 0.6, y, w - th * 1.2, th], d: [X + th * 0.6, y + h - th, w - th * 1.2, th], g: [X + th * 0.6, y + half - th / 2, w - th * 1.2, th],
      f: [X, y + th * 0.6, th, half - th * 0.9], b: [X + w - th, y + th * 0.6, th, half - th * 0.9], e: [X, y + half + th * 0.3, th, half - th * 0.9], c: [X + w - th, y + half + th * 0.3, th, half - th * 0.9] }[k];
    const [px, py, pw, ph] = pts; ctx.beginPath(); ctx.moveTo(px + sk * (1 - (py - y) / h), py); ctx.lineTo(px + pw + sk * (1 - (py - y) / h), py);
    ctx.lineTo(px + pw + sk * (1 - (py + ph - y) / h), py + ph); ctx.lineTo(px + sk * (1 - (py + ph - y) / h), py + ph); ctx.closePath(); ctx.fill(); };
  let X = x;
  for (const ch of s) {
    if (SEG[ch]) { if (ghost) { ctx.fillStyle = ghost; for (const k of 'abcdefg') seg(k, X); } ctx.fillStyle = color; for (const k of SEG[ch]) seg(k, X); }
    else if (ch !== ' ') { ctx.fillStyle = color; ctx.fillRect(X + h * 0.04, y + h - th * 1.2, th, th * 1.2); }
    X += cw(ch, h);
  }
}
