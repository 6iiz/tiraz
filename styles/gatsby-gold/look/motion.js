// Gatsby gold motion: a machine-age grammar. Everything is symmetrical about the frame's vertical axis and opens from it: a glint on
// the axis, a hairline that runs out to both sides, then the plate opens up and down, and its words rise from the centre outward.
// Light arrives as bulbs switching on in counted order, each with a short ignition flare. Metal is drawn as a banded gradient whose
// bright band (the sheen) slides across it with time. This file holds the palette and the shared drawing: plates, engraved lines,
// bulbs, the sparkle and the word order.
import { clamp, mix, rgba, contrast, ease } from '/engine/kit.js';

export const E = ease.inOutCubic;           // the mechanical move: doors, plates, rules
export const L = ease.outCubic;             // a word or a bulb landing
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// Push a colour toward `to` until it reads at 4.5:1 on `on`.
const readable = (c, on, to) => { let k = 0, out = c; while (contrast(out, on) < 4.5 && k < 1) { k += 0.04; out = mix(c, to, Math.min(1, k)); } return out; };

// The ground is always the brand's darker colour (the lacquer); its lighter colour is the ivory; the accent is the metal.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const lacquer = mix(mix(dark, accent, T.tone.lacquer), light, 0.025);
  const gold = readable(accent, lacquer, light);                // metal that can carry words
  return {
    dark, light, accent, lacquer, gold,
    hot: mix(gold, light, 0.6),                                  // the bright band of the metal
    deep: mix(accent, dark, 0.45),                               // the shade band of the metal (lines only)
    dim: mix(dark, accent, 0.42),                                // an unlit engraved line
    ivory: readable(light, lacquer, light),
    muted: readable(mix(light, dark, T.tone.muted), lacquer, light),
    ray: mix(dark, accent, T.tone.ray), lift: mix(dark, accent, T.tone.lift),
    bulbOff: mix(dark, light, T.tone.bulbOff), bulbOn: mix(gold, light, 0.72),
    engrave: 'rgba(0,0,0,0.55)',
  };
}

// Where the sheen sits on a piece of metal at a time: it sweeps from beyond one end to beyond the other once every `period` seconds.
export const sheenAt = (time, period = 4, phase = 0) => (((time + phase) / period) % 1 + 1) % 1 * 1.8 - 0.4;

// A banded metal gradient along (x0,y0)-(x1,y1). For words the shade band is left out, so every band stays readable.
export function metal(ctx, x0, y0, x1, y1, pal, s = 0.5, forText = false) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1), edge = forText ? pal.gold : pal.deep;
  const stops = [[0, edge], [0.5, pal.gold], [1, edge]];
  if (s > -0.3 && s < 1.3) stops.push([clamp(s - 0.2), pal.gold], [clamp(s), pal.hot], [clamp(s + 0.2), pal.gold]);
  stops.sort((a, b) => a[0] - b[0]).forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

// An engraved gold line: a dark cut under it, the metal, and a hairline of light on top. path(ctx) builds the path (beginPath included).
export function gline(ctx, path, width, pal, paint) {
  ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  path(ctx);
  ctx.strokeStyle = pal.engrave; ctx.lineWidth = width + 1.6; ctx.stroke();
  ctx.strokeStyle = paint ?? pal.gold; ctx.lineWidth = width; ctx.stroke();
  ctx.globalAlpha *= 0.65; ctx.strokeStyle = pal.hot; ctx.lineWidth = Math.max(0.6, width * 0.3); ctx.stroke();
  ctx.restore();
}

// The outline of a plate with stepped (notched) corners, centred on (cx, cy).
export function notched(ctx, cx, cy, w, h, s) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2; s = Math.min(s, w / 4, h / 4);
  ctx.beginPath();
  ctx.moveTo(x0 + s, y0); ctx.lineTo(x1 - s, y0); ctx.lineTo(x1 - s, y0 + s); ctx.lineTo(x1, y0 + s); ctx.lineTo(x1, y1 - s); ctx.lineTo(x1 - s, y1 - s);
  ctx.lineTo(x1 - s, y1); ctx.lineTo(x0 + s, y1); ctx.lineTo(x0 + s, y1 - s); ctx.lineTo(x0, y1 - s); ctx.lineTo(x0, y0 + s); ctx.lineTo(x0 + s, y0 + s); ctx.closePath();
}

// How far a plate is open: first a hairline runs out from the axis (wf), then it opens up and down (hf). It shuts the other way.
export function opening(p, out = 0) {
  const o = clamp(out);
  return { wf: E(clamp(p / 0.4)) * (1 - E(clamp((o - 0.5) / 0.5))), hf: E(clamp((p - 0.4) / 0.6)) * (1 - E(clamp(o / 0.55))) };
}

// A lacquer plate with a double engraved keyline and three-line wings at its sides. Drawn at its current opening.
export function plate(ctx, cx, cy, w, h, pal, { wf = 1, hf = 1, sheen = 0.5, step = 18, wings = true, fill = pal.lacquer } = {}) {
  if (wf <= 0) return;
  const ww = w * wf, hh = Math.max(3, h * hf);
  if (hf <= 0.02) {                                                 // only the hairline yet, with a glint on the axis
    gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - ww / 2, cy); c.lineTo(cx + ww / 2, cy); }, 2.4, pal, metal(ctx, cx - w / 2, cy, cx + w / 2, cy, pal, sheen));
    return;
  }
  const g = ctx.createLinearGradient(0, cy - hh / 2, 0, cy + hh / 2);   // the airbrush: lighter at the top, into the lacquer
  g.addColorStop(0, mix(fill, pal.accent, 0.08)); g.addColorStop(0.55, fill); g.addColorStop(1, mix(fill, pal.dark, 0.5));
  notched(ctx, cx, cy, ww, hh, step * hf); ctx.fillStyle = g; ctx.fill();
  const paint = metal(ctx, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, pal, sheen);
  gline(ctx, (c) => notched(c, cx, cy, ww, hh, step * hf), 3, pal, paint);
  if (hh > 30) gline(ctx, (c) => notched(c, cx, cy, ww - 22, hh - 22, Math.max(2, step * hf - 6)), 1.2, pal, paint);
  if (wings && hf > 0.5) {
    const k = (hf - 0.5) * 2;
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = cx + side * (ww / 2 + 10), len = (46 - i * 14) * k, y = cy + (i - 1) * 14;
      gline(ctx, (c) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * len, y); }, 2, pal, paint);
    }
  }
}

// A small diamond of metal.
export function diamond(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill();
}
// Two hairlines flanking a centred text, running outward from it, each ending in a diamond. p: how far they have run.
export function flank(ctx, cx, y, half, len, pal, p, sheen = 0.5) {
  if (p <= 0) return;
  const l = len * E(p);
  for (const s of [-1, 1]) {
    const a = cx + s * half, b = a + s * l;
    gline(ctx, (c) => { c.beginPath(); c.moveTo(a, y); c.lineTo(b, y); }, 2, pal, metal(ctx, a, y, a + s * len, y, pal, sheen));
    if (p > 0.6) diamond(ctx, b + s * 6, y, 7 * clamp((p - 0.6) / 0.4), pal.gold);
  }
}

// A four-point star of light, r long, at brightness a.
export function sparkle(ctx, x, y, r, a, pal) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y);
  ctx.fillStyle = pal.hot; ctx.beginPath();
  const w = r * 0.14;
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(w, -w, r, 0); ctx.quadraticCurveTo(w, w, 0, r); ctx.quadraticCurveTo(-w, w, -r, 0); ctx.quadraticCurveTo(-w, -w, 0, -r);
  ctx.fill(); ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// The brightness of a sparkle that flares at t0 and dies over 0.6 s.
export const flare = (t, t0) => (t < t0 ? 0 : Math.max(0, 1 - (t - t0) / 0.6) * Math.min(1, (t - t0) / 0.06));

// A bulb lighting: dark until p > 0, a flare to about 1.6 in the first moment, settling to 1.
export const ignite = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.min(1, p / 0.1) + 0.6 * Math.max(0, 1 - Math.abs(p - 0.12) / 0.3));

// Bulbs: the glow is drawn once, a frame only lays it down. draw(ctx, x, y, level, r).
export function bulbs(pal) {
  const S = 96, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, rgba(pal.bulbOn, 0.9)); gr.addColorStop(0.25, rgba(pal.gold, 0.45)); gr.addColorStop(1, rgba(pal.gold, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return {
    draw(ctx, x, y, level, r = 7) {
      ctx.fillStyle = pal.engrave; ctx.beginPath(); ctx.arc(x, y + 1, r + 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = level > 0.05 ? mix(pal.bulbOff, pal.bulbOn, clamp(level)) : pal.bulbOff;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (level > 0.05) { const s = r * 5.5 * Math.min(1.4, level); ctx.save(); ctx.globalAlpha *= clamp(level * 0.8); ctx.drawImage(c, x - s / 2, y - s / 2, s, s); ctx.restore(); }
    },
  };
}

// The order in which the words of a fitted text arrive: from the axis outward, row by row together. Returns rank[i] for word i.
export function centreOut(kit, f, o) {
  const boxes = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, decor: true, each: (w, i, b) => { boxes.push(b); return false; } });
  const cx = (o.x0 + o.x1) / 2, d = boxes.map((b) => Math.abs(b.x + b.width / 2 - cx));
  const idx = boxes.map((_, i) => i).sort((a, b) => d[a] - d[b]), rank = [];
  idx.forEach((i, r) => { rank[i] = r; });
  return { rank, boxes };
}

// A word rising into place (inside whatever clip the caller set) and fading out on leaving.
export function rise(ctx, p, out, size) {
  if (p <= 0 || out >= 1) return false;
  ctx.globalAlpha *= clamp(p * 2.5) * (1 - clamp(out * 1.6));
  ctx.translate(0, (1 - L(p)) * size * 0.55);
}
