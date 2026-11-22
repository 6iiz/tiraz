// Lead and light motion: glass has no light of its own. Pieces are set into the lead one at a time, rigidly, on a stepped clock (twelve
// steps a second, like a glazier's hand placing them), dark and milky; then the sun moves behind the window and whatever it reaches
// glows. Words are painted on pale glass and become clear as the light reaches them, from the reading side. A struck thing cracks.
// This file holds the palette and the shared glazing: panes, borders of small pieces, jewels, the stepped clock and the light.
import { clamp, mix, contrast, ease, rng } from '/engine/kit.js';

export const STEP = 12;
export const q = (t) => Math.floor(t * STEP) / STEP;            // the stepped clock
export const O = ease.outQuad;
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const toward = (c, on, to, need = 4.5) => { let k = 0, out = c; while (contrast(out, on) < need && k < 1) { k += 0.04; out = mix(c, to, Math.min(1, k)); } return out; };

// Stone and lead = the darker brand colour; clear glass = the lighter; coloured glass = the accent and its mixes with both.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const clear = mix(light, accent, T.tone.clear);
  const paint = toward(mix(dark, accent, 0.12), clear, dark, 6);          // grisaille: the dark paint on glass
  const on = (fill) => (contrast(fill, dark) >= contrast(fill, light) ? dark : light);
  return {
    dark, light, accent, clear, paint, on,
    lead: mix(dark, '#000000', 0.35), flange: mix(dark, light, 0.22),
    stone: mix(dark, light, T.tone.stone), stoneHi: mix(dark, light, T.tone.stone + 0.05),
    tints: [accent, mix(accent, light, 0.35), mix(accent, dark, 0.3), mix(light, dark, 0.18), mix(accent, light, 0.62), clear],
    unlit: (c) => mix(c, dark, T.tone.unlit),
    keyText: on(accent),
  };
}
// A glass colour at a light level 0 (dark, milky) .. 1 (backlit).
export const glass = (pal, c, lit) => mix(pal.unlit(c), c, clamp(lit));

export function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }

// A pane of glass in its lead: the glass, a matted (painted shade) band inside the lead, the lead came with a faint flange, solder at
// the corners. lit 0..1.
export function pane(ctx, x, y, w, h, pal, { color = pal.clear, lit = 1, r = 14, lead = 9 } = {}) {
  const c = glass(pal, color, lit);
  roundRect(ctx, x, y, w, h, r); ctx.fillStyle = c; ctx.fill();
  ctx.save(); roundRect(ctx, x, y, w, h, r); ctx.clip();
  ctx.strokeStyle = mix(c, pal.paint, 0.22); ctx.lineWidth = 26; roundRect(ctx, x, y, w, h, r); ctx.stroke();   // matting by the lead
  ctx.restore();
  ctx.strokeStyle = pal.lead; ctx.lineWidth = lead; roundRect(ctx, x, y, w, h, r); ctx.stroke();
  ctx.strokeStyle = pal.flange; ctx.lineWidth = 1; roundRect(ctx, x - lead / 2 + 1, y - lead / 2 + 1, w + lead - 2, h + lead - 2, r + lead / 2); ctx.stroke();
}
// A border of small coloured pieces round a box, built once; draw(ctx, set, lit): `set` 0..1 places the pieces one by one in order
// round the box (stepped, rigid); lit(x, y) gives the light on each.
export function border(x, y, w, h, pal, seed, size = 34, gap = 6) {
  const r = rng(seed), P = [], b = size;
  const nx = Math.max(2, Math.round((w + 2 * b) / (b * 1.4))), ny = Math.max(1, Math.round(h / (b * 1.4)));
  const cw = (w + 2 * b) / nx, ch = h / ny;
  for (let i = 0; i < nx; i++) P.push({ x: x - b + i * cw, y: y - b, w: cw, h: b });
  for (let j = 0; j < ny; j++) P.push({ x: x + w, y: y + j * ch, w: b, h: ch });
  for (let i = nx - 1; i >= 0; i--) P.push({ x: x - b + i * cw, y: y + h, w: cw, h: b });
  for (let j = ny - 1; j >= 0; j--) P.push({ x: x - b, y: y + j * ch, w: b, h: ch });
  P.forEach((p, i) => { p.c = pal.tints[i % 2 ? 0 : (r() < 0.5 ? 1 : 2)]; p.k = i / P.length; });
  return {
    draw(ctx, set, lit = () => 1) {
      ctx.save(); ctx.lineJoin = 'round';
      for (const p of P) {
        if (set < 1 && p.k > set) continue;
        const L = lit(p.x + p.w / 2, p.y + p.h / 2);
        ctx.fillStyle = glass(pal, p.c, L); ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = pal.lead; ctx.lineWidth = gap; ctx.strokeRect(p.x, p.y, p.w, p.h);
      }
      ctx.restore();
    },
  };
}
// A small round jewel of coloured glass in its lead.
export function jewel(ctx, x, y, r, pal, color, lit) {
  ctx.fillStyle = pal.lead; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = glass(pal, color, lit); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = mix(glass(pal, color, lit), pal.light, 0.5 * clamp(lit)); ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
}

// The sun behind the window: a soft band that crosses from the reading side at a time; returns lit(x, y) 0..1 with a floor of `base`.
// t0: when the band enters, dur: how long it takes to cross. After it has crossed, everything it passed stays lit at `hold`.
export function sun(t, t0, dur, rtl = true, base = 0, hold = 1, W = 1080) {
  const p = (t - t0) / dur, edge = -200 + p * (W + 400);
  return (x, y) => {
    const d = (rtl ? W - x : x) + (y - 760) * 0.25;                  // distance from the reading side, the band slightly slanted
    const behind = d < edge ? hold : 0, band = Math.max(0, 1 - Math.abs(d - edge) / 180) * 0.35;
    return clamp(Math.max(base, behind + band));
  };
}

// A crack across a pane: a few broken lines from a point, built once from a seed; draw(ctx, p) grows them.
export function crack(cx, cy, w, h, seed) {
  const r = rng(seed), lines = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.5, pts = [[cx, cy]]; let x = cx, y = cy;
    const L = (0.35 + r() * 0.4) * Math.max(w, h) * 0.6;
    for (let k = 1; k <= 4; k++) { const aa = a + (r() - 0.5) * 0.5; x += Math.cos(aa) * L / 4; y += Math.sin(aa) * L / 4 * (h / w + 0.4); pts.push([x, y]); }
    lines.push(pts);
  }
  return (ctx, p, color) => {
    if (p <= 0) return;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    for (const pts of lines) { const n = (pts.length - 1) * clamp(p); ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k <= Math.ceil(n); k++) { const f = Math.min(1, n - (k - 1)); ctx.lineTo(pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f); } }
    ctx.stroke(); ctx.restore();
  };
}

// The boxes of a fitted text's words, measured once.
export function boxesOf(kit, f, o) {
  const b = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, decor: true, each: (w, i, box) => { b.push({ ...box, key: w.key }); return false; } });
  return b;
}
// A word painted on glass: invisible until the light reaches it, then it comes up in steps. lit 0..1.
export function painted(ctx, lit, out = 0) {
  const a = Math.floor(clamp(lit) * 4) / 4 * (1 - clamp(out));
  if (a <= 0) return false;
  ctx.globalAlpha *= a;
}
