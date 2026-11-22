// Gold manuscript motion: things are painted, in the order a painter works. First a firm ink outline is drawn round the shape, then
// the flat pigment is laid inside it, then pearls of white are dotted along its edge one by one, and gold leaf is laid square by
// square, each square settling flat from a small tilt. Words are written with the pen: each word is uncovered from its reading side,
// whole, following the pen. Laid leaf stays dark and warm until light passes over it; then its squares catch the light one after
// time while the pigment beside them stays matte. This file holds the palette and the shared painting: panels, leaf, pearls, ribbons.
import { clamp, mix, contrast, ease, rng } from '/engine/kit.js';

export const S = ease.outCubic;              // a stroke or a fill arriving
export const Q = ease.inOutQuad;             // a light passing
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const toward = (c, on, to, need = 4.5) => { let k = 0, out = c; while (contrast(out, on) < need && k < 1) { k += 0.04; out = mix(c, to, Math.min(1, k)); } return out; };

// Ink = the brand's darker colour; vellum and white lead = its lighter colour; the field is the accent sunk deep into the ink, like a
// mineral ground; leaf is the accent raised toward the light until ink reads on it.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [ink, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const field = mix(ink, accent, T.tone.field);
  const leaf = toward(mix(accent, light, T.tone.leaf), ink, light, 5);
  const vellum = mix(light, accent, T.tone.vellum);
  return {
    ink, light, accent, field, vellum, leaf,
    fieldLine: mix(field, light, 0.1), fieldDot: mix(field, leaf, 0.5),
    band: mix(vellum, ink, 0.13),                                  // the darker band just inside an outline
    leafLo: mix(leaf, ink, 0.22), leafHi: mix(leaf, light, 0.75), bole: mix(accent, ink, 0.35),
    rubric: toward(accent, vellum, ink),                           // red-letter ink: the accent, readable on vellum
    faded: toward(mix(ink, vellum, 0.42), vellum, ink),            // ink of a struck word
    lead: light,                                                   // white lead (pearls)
    onField: toward(light, field, light),
  };
}

// Leaf: a grid of squares filling a box, each with its own tone, tilt and order, built once. draw(ctx, laid, light, ox, oy):
// laid 0..1 lays the squares in order (each settles from a small tilt); light(x, y) gives how much a passing light catches a square.
export function leaf(x, y, w, h, pal, seed, cell = 18) {
  const r = rng(seed), nx = Math.max(1, Math.round(w / cell)), ny = Math.max(1, Math.round(h / cell)), cw = w / nx, ch = h / ny, sq = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const tone = r(), broke = r() < 0.06;
    sq.push({ x: x + i * cw, y: y + j * ch, tone, broke, tilt: (r() - 0.5) * 0.5, order: (i + j * 0.6 + r() * 1.5) / (nx + ny * 0.6 + 1.5), flash: r() });
  }
  const colourOf = (s, lit) => mix(mix(pal.leafLo, pal.leaf, 0.45 + s.tone * 0.55), pal.leafHi, clamp(lit));
  return {
    x, y, w, h,
    draw(ctx, laid = 1, light = () => 0, onlyLit = false) {
      for (const s of sq) {
        const p = clamp((laid - s.order * 0.8) / 0.2); if (p <= 0) continue;
        const lit = light(s.x + cw / 2, s.y + ch / 2) * (0.55 + 0.45 * s.flash);
        if (onlyLit && lit < 0.02) continue;
        ctx.fillStyle = s.broke ? pal.bole : colourOf(s, lit);
        if (p < 1) {
          ctx.save(); ctx.translate(s.x + cw / 2, s.y + ch / 2); ctx.rotate(s.tilt * (1 - S(p))); ctx.scale(1, 0.4 + 0.6 * S(p));
          ctx.fillRect(-cw / 2, -ch / 2, cw + 0.6, ch + 0.6); ctx.restore();
        } else ctx.fillRect(s.x, s.y, cw + 0.6, ch + 0.6);
      }
      if (laid >= 0.98 && !onlyLit) {                                          // the seams between the squares
        ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = pal.leafLo;
        for (let i = 1; i < nx; i++) ctx.fillRect(x + i * cw - 0.5, y, 1, h);
        for (let j = 1; j < ny; j++) ctx.fillRect(x, y + j * ch - 0.5, w, 1);
        ctx.restore();
      }
    },
  };
}

// A light crossing the picture: a soft diagonal band that passes every `period` seconds. Returns light(x, y) for a time.
export function passing(time, period = 5, phase = 0, W = 1080, H = 1920) {
  const k = (((time + phase) / period) % 1 + 1) % 1, pos = -600 + k * (W + H + 1200);
  return (x, y) => { const d = Math.abs(x + y * 0.55 - pos); return d > 260 ? 0 : (1 - d / 260) ** 2; };
}

// A gothic panel: a rectangle with its four corners cut by inward quarter circles.
export function panelPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 3, h / 3);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w, y, r, Math.PI, Math.PI / 2, true);
  ctx.lineTo(x + w, y + h - r); ctx.arc(x + w, y + h, r, -Math.PI / 2, Math.PI, true);
  ctx.lineTo(x + r, y + h); ctx.arc(x, y + h, r, 0, -Math.PI / 2, true);
  ctx.lineTo(x, y + r); ctx.arc(x, y, r, Math.PI / 2, 0, true); ctx.closePath();
}
// Painted in order: outline (p 0..0.35, a dashed stroke growing round the shape), fill (0.3..0.6), band (0.5..0.75), pearls (0.6..1).
// path(c) builds the shape; len is about its perimeter; pearls is a list of [x, y].
export function painted(ctx, p, path, len, pal, { fill = pal.vellum, band = pal.band, pearls = [], weight = 4.5, inset } = {}) {
  if (p <= 0) return;
  const pf = clamp((p - 0.3) / 0.3), pb = clamp((p - 0.5) / 0.25), po = clamp(p / 0.35);
  if (pf > 0) { ctx.save(); path(ctx); ctx.globalAlpha *= S(pf); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
  if (pb > 0 && inset) { ctx.save(); inset(ctx); ctx.globalAlpha *= S(pb); ctx.strokeStyle = band; ctx.lineWidth = 9; ctx.stroke(); ctx.restore(); }
  ctx.save(); path(ctx); ctx.strokeStyle = pal.ink; ctx.lineWidth = weight; ctx.lineJoin = 'round';
  if (po < 1) { ctx.setLineDash([len * S(po), len * 2]); }
  ctx.stroke(); ctx.restore();
  pearls.forEach(([x, y], i) => { const q = clamp((p - 0.6 - (i / pearls.length) * 0.35) / 0.05); if (q > 0) pearl(ctx, x, y, 3.6 * q, pal); });
}
export function pearl(ctx, x, y, r, pal) {
  ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(x, y + 0.8, r + 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.lead; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
// Pearls spaced along the inside of a rectangle.
export function pearlRow(x, y, w, h, gap = 26) {
  const out = [], nx = Math.max(2, Math.round(w / gap)), ny = Math.max(1, Math.round(h / gap));
  for (let i = 1; i < nx; i++) out.push([x + (w * i) / nx, y]);
  for (let j = 1; j < ny; j++) out.push([x + w, y + (h * j) / ny]);
  for (let i = nx - 1; i > 0; i--) out.push([x + (w * i) / nx, y + h]);
  for (let j = ny - 1; j > 0; j--) out.push([x, y + (h * j) / ny]);
  return out;
}

// A ribbon (banderole) with forked tails, centred on (cx, cy).
export function ribbonPath(ctx, cx, cy, w, h) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, f = h * 0.45;
  ctx.beginPath();
  ctx.moveTo(x0 - f, y0); ctx.lineTo(x1 + f, y0); ctx.lineTo(x1, cy); ctx.lineTo(x1 + f, y1); ctx.lineTo(x0 - f, y1); ctx.lineTo(x0, cy); ctx.closePath();
}

// A word written with the pen: uncovered from its reading side, whole (letters never move). Use inside kit.drawText's `each`.
export function pen(ctx, p, box, size, rtl = true) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const w = (box.width + 16) * S(p), h = size * 1.7;
  ctx.beginPath(); ctx.rect(rtl ? box.x + box.width + 8 - w : box.x - 8, box.y - h / 2, w, h); ctx.clip();
}
// Leaving: the word sinks into the vellum (it fades whole).
export function fade(ctx, out) { if (out >= 1) return false; ctx.globalAlpha *= 1 - clamp(out); }

// The boxes of a fitted text's words, measured once (so a part can lay leaf behind a word before it is written).
export function boxesOf(kit, f, o) {
  const b = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, decor: true, each: (w, i, box) => { b.push({ ...box, key: w.key }); return false; } });
  return b;
}

// A light run once across a piece of leaf, from its reading end to the other, as p goes 0..1. Combined with the passing light.
export function sweep(x0, x1, p, rtl, base = () => 0) {
  if (p <= 0 || p >= 1) return base;
  const pos = rtl ? x1 + 80 - (x1 - x0 + 160) * Q(p) : x0 - 80 + (x1 - x0 + 160) * Q(p);
  return (x, y) => Math.max(base(x, y), Math.max(0, 1 - Math.abs(x + (y % 40) * 0.3 - pos) / 70));
}
