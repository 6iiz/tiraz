// Gazette motion: a newsreel projected from film. Everything that moves inside the gate moves on the film's own frames (24 a second,
// `q()`), so motion has the slight stutter of a projector. News objects do the moving: a newspaper spins into the lens and stops dead,
// a clipping is slapped down on the table, a grease pencil scrawls across, the leader's hand sweeps round. Scenes join with an iris.
// This file also holds the palette, the ornamented title card, the hand tint, the newspaper and the clipping.
import { clamp, ease, mix, rgba, rng, contrast, span, SAFE } from '/engine/kit.js';

export const O = ease.outQuart;                       // a spin that stops dead
export const fps = 24;
export const q = (t) => Math.floor(t * fps + 1e-6) / fps;   // film time: the frame the projector is showing

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The film is monochrome between the brand's darker and lighter colours (its "silver"); the accent is a hand-applied tint, used on the
// one word that matters and on small ornaments, as early prints were coloured by hand.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const on = (f) => (contrast(f, dark) >= contrast(f, light) ? dark : light);
  const t = T.tone, s = (k) => mix(dark, light, k);
  return { dark, light, accent, on, onAccent: on(accent), s, screen: s(t.screen), edge: s(t.edge), paper: mix(light, dark, t.paper),
    rule: s(t.rule), bar: mix(light, dark, t.bar), leader: s(t.leader), sweep: s(t.sweep), card: s(t.card), dimText: s(0.72) };
}

// A hand tint behind a word: a block of the accent with ragged edges (fixed per word by a seed), slightly off register.
export function tint(ctx, x, y, w, h, color, seed) {
  const r = rng(seed), n = 7, pts = [];
  for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + (r() - 0.5) * h * 0.12]);
  for (let i = n; i >= 0; i--) pts.push([x + (w * i) / n, y + h + (r() - 0.5) * h * 0.12]);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0] + 4, pts[0][1]);
  pts.forEach(([px, py]) => ctx.lineTo(px + 4, py));
  ctx.closePath(); ctx.fill();
}

// A deco frame: a double rule with small diamonds at the corners, around (x, y, w, h).
export function frame(ctx, x, y, w, h, color, accent) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1.5; ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
  ctx.fillStyle = accent ?? color;
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 12, cy); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx - 12, cy); ctx.closePath(); ctx.fill(); }
}
export function diamond(ctx, cx, cy, s, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy); ctx.closePath(); ctx.fill(); }

// Draws fitted text with a hand tint behind its key words.
export function inked(kit, ctx, f, { x0, x1, y, align = 'center', color, P, tintP = 1, seed = 1 }) {
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: tintP > 0.5 ? P.onAccent : color,
    each: (w, i, box, c) => {
      if (!w.key || tintP <= 0) return;
      const pad = f.size * 0.16, full = box.width + pad * 2;
      c.save(); c.beginPath(); c.rect(kit.rtl ? box.x + box.width + pad - full * tintP : box.x - pad, box.y - f.size, full * tintP, f.size * 2); c.clip();
      tint(c, box.x - pad, box.y - f.size * 0.62, full, f.size * 1.24, P.accent, seed + i * 13);
      c.restore();
    } });
}

// Bars of grey print (the body text of a page) in columns, inside (x, y, w, h).
export function print(ctx, x, y, w, h, cols, color, seed) {
  const r = rng(seed), gap = 26, cw = (w - gap * (cols - 1)) / cols;
  ctx.fillStyle = color;
  for (let c = 0; c < cols; c++) for (let ly = y; ly < y + h - 8; ly += 20) {
    const last = r() < 0.14, lw = last ? cw * (0.3 + r() * 0.4) : cw;
    ctx.fillRect(x + c * (cw + gap) + (cw - lw), ly, lw, 8);
  }
}
