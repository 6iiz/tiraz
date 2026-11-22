// Wave-trace motion: everything is drawn by one moving beam of light on a dark tube. The beam is a bright spot that travels a trace;
// what it has passed glows and slowly cools (afterglow, a decay computed from the time since the beam passed, never from the last
// frame). Words light whole when the beam runs under them; the key word sits on the signal's peak. Numbers are readouts of the same
// values that shape the curves. This file holds the palette, word boxes, word glows, and the trace drawing shared by every part.
import { clamp, mix, contrast, rgba, font } from '/engine/kit.js';

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const lift = (c, toward, against, need) => { let k = 0, out = c; while (contrast(out, against) < need && k < 1) { k += 0.04; out = mix(c, toward, Math.min(1, k)); } return out; };

// The tube is the brand's darker colour sunk toward black. The beam is the accent, lifted toward the light colour until it glows on
// the tube; `text` is the paler phosphor for words (the beam mixed toward the light colour, at least 7:1); `core` is the white-hot centre.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const tube = mix(dark, '#000000', T.tone.tube);
  const beam = lift(accent, light, tube, T.tone.need);
  return {
    dark, light, accent, tube, beam,
    text: lift(mix(beam, light, T.tone.pale), light, tube, 7), core: mix(beam, light, T.tone.core),
    soft: lift(mix(tube, mix(beam, light, T.tone.pale), 0.6), light, tube, 4.6),
    grid: mix(tube, beam, T.tone.grid), axis: mix(tube, beam, T.tone.axis),
  };
}

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const I = (p) => clamp(p) ** 2.4;
// Afterglow: 1 at the moment the beam passes, cooling toward `rest` with time constant tau.
export const cool = (dt, tau, rest) => (dt < 0 ? 0 : rest + (1 - rest) * Math.exp(-dt / tau));

export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = [], rtl = kit.rtl;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, w: w.w, key: w.key, arabic: w.arabic }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// A fitted text made of light: each word's bloom is built once; draw(ctx, level) lays word i's bloom at level(i) and draws the sharp
// word through kit.drawText, from dark (0) to lit (1), a little hotter right after it lights. Key words use the full beam colour.
export function lightText(kit, f, o, pal, T, base = pal.text) {
  const bx = boxes(kit, f, o), P = Math.ceil(f.size * 0.8), hh = Math.ceil(f.size * 1.7) + 2 * P;
  for (const b of bx) {
    const ww = Math.ceil(b.width) + 2 * P, src = document.createElement('canvas'); src.width = ww; src.height = hh;
    const s = src.getContext('2d'); s.fillStyle = b.key ? pal.beam : base; s.font = font(f.weight, f.size, f.family); s.textBaseline = 'middle';
    s.direction = b.arabic ? 'rtl' : 'ltr'; s.textAlign = b.arabic ? 'right' : 'left'; s.fillText(b.w, b.arabic ? P + b.width : P, hh / 2);
    const g = document.createElement('canvas'); g.width = ww; g.height = hh; const gg = g.getContext('2d');
    gg.filter = `blur(${f.size * T.glow.wide}px)`; gg.globalAlpha = b.key ? T.glow.keyA : T.glow.wideA; gg.drawImage(src, 0, 0);
    gg.filter = `blur(${Math.max(1, f.size * T.glow.near)}px)`; gg.globalAlpha = T.glow.nearA; gg.drawImage(src, 0, 0); gg.filter = 'none';
    b.glow = g; b.P = P; b.hh = hh;
  }
  return {
    boxes: bx,
    draw(ctx, level, heat = () => 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [i, b] of bx.entries()) { const l = level(i); if (l > 0.01) { ctx.globalAlpha = clamp(l); ctx.drawImage(b.glow, b.x - b.P, b.y - b.hh / 2); } }
      ctx.restore();
      kit.drawText(ctx, f, { ...o, color: base, key: pal.beam, each: (w, i, box, c) => {
        const l = level(i); if (l <= 0.01) return false;
        c.globalAlpha = clamp(l * 1.4);
        return mix(w.key ? pal.beam : base, pal.core, clamp(heat(i)) * 0.7);
      } });
    },
  };
}

// A trace: pts is a list of [x, y] in screen pixels along the beam's path; `head` (0..1) is how far the beam has gone; age(k) gives the
// brightness of point k (afterglow). Drawn as light: a wide soft pass, a body, and a hot core near the head; then the spot itself.
export function trace(ctx, pts, pal, { head = 1, age = () => 1, width = 3, spot = true, alpha = 1 } = {}) {
  const n = Math.max(0, Math.min(pts.length - 1, Math.floor(head * (pts.length - 1))));
  if (n < 1 || alpha <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const chunk = 12;
  for (let k0 = 0; k0 < n; k0 += chunk) {
    const k1 = Math.min(n, k0 + chunk), a = clamp(age(Math.floor((k0 + k1) / 2))) * alpha; if (a <= 0.01) continue;
    ctx.beginPath(); ctx.moveTo(pts[k0][0], pts[k0][1]); for (let k = k0 + 1; k <= k1; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.strokeStyle = rgba(pal.beam, 0.12 * a); ctx.lineWidth = width * 6; ctx.stroke();
    ctx.strokeStyle = rgba(pal.beam, 0.85 * a); ctx.lineWidth = width; ctx.stroke();
    if (a > 0.8) { ctx.strokeStyle = rgba(pal.core, (a - 0.8) * 4); ctx.lineWidth = width * 0.45; ctx.stroke(); }
  }
  if (spot && head < 1) {
    const [x, y] = pts[n], g = ctx.createRadialGradient(x, y, 0, x, y, 26);
    g.addColorStop(0, rgba(pal.core, 0.95 * alpha)); g.addColorStop(0.25, rgba(pal.beam, 0.5 * alpha)); g.addColorStop(1, rgba(pal.beam, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26, 52, 52);
  }
  ctx.restore();
}
// Points along x from xa to xb (either way round) of the function y(x), every `step` px.
export function curve(xa, xb, y, step = 4) {
  const pts = [], n = Math.max(2, Math.ceil(Math.abs(xb - xa) / step));
  for (let i = 0; i <= n; i++) { const x = xa + ((xb - xa) * i) / n; pts.push([x, y(x)]); }
  return pts;
}
// A soft bump centred on c, `w` wide.
export const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
