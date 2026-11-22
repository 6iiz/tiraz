// Motion of etched-celluloid: every mark is cut into black film by a needle and redone twelve times a second, so each stroke
// boils (a new small tremble at each drawing) even when it holds. A word is cut in from the reading side behind a hot point (a bright
// core, a glow and a few chips); it is cut in two passes (a faint second pass beside the first), and thin skips of emulsion cross it.
// Colour is transparent dye laid into the grooves in a few bristle strokes. This file holds the palette and the marks every part uses.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const DRAW = 12;
export const drawing = (t) => Math.floor(t * DRAW + 1e-6);
export const lighter = (a, b) => contrast(a, '#000000') >= contrast(b, '#000000');

// The emulsion is the brand's darker colour pushed toward black; every cut is the lighter colour; the dye is the accent, lifted toward the
// light colour only as far as it needs to glow on the emulsion.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lighter(bg, text) ? bg : text, dark = light === bg ? text : bg;
  const emulsion = mix(dark, '#000000', 0.3);
  let q = 0, dye = accent; while (q < 1 && contrast(dye, emulsion) < 3) { q += 0.05; dye = mix(accent, light, q); }
  let k = 0.35, faint = mix(light, emulsion, k); while (k > 0 && contrast(faint, emulsion) < 4.5) { k -= 0.04; faint = mix(light, emulsion, Math.max(0, k)); }
  return { light, dark, accent, emulsion, cream: light, faint, dye, core: mix(light, '#ffffff', 0.6) };
}

// The tremble of one mark at one drawing.
export function boil(n, seed, amp = 1.4) {
  const r = rng((n * 7919 + seed * 1543 + 17) >>> 0);
  return { x: (r() - 0.5) * 2 * amp, y: (r() - 0.5) * 2 * amp };
}

// A needle line through a list of points [[x, y], …] (dense, about every 12 px): two or three trembling passes of uneven width with a
// few skips. p cuts it along its length.
export function needle(ctx, pts, { w = 3, n = 0, seed = 1, color, passes = 2, tremble = 1.6, p = 1, alpha = 1 } = {}) {
  if (p <= 0 || pts.length < 2) return;
  const m = Math.max(2, Math.ceil(pts.length * clamp(p)));
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
  for (let k = 0; k < passes; k++) {
    const r = rng((seed * 31 + n * 977 + k * 13) >>> 0);
    ctx.globalAlpha = alpha * (k ? 0.45 : 1); ctx.lineWidth = w * (k ? 0.55 : 1) * (0.8 + r() * 0.4);
    ctx.beginPath();
    for (let i = 0; i < m; i++) {
      const x = pts[i][0] + (r() - 0.5) * tremble * (k ? 2.4 : 1), y = pts[i][1] + (r() - 0.5) * tremble * (k ? 2.4 : 1);
      if (i === 0 || r() < 0.04) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
// Points along a straight line, an arc or a zigzag, for needle().
export const seg = (x0, y0, x1, y1, step = 12) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L / step)); return Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); };
export const arc = (cx, cy, rx, ry, a0, a1, step = 12) => { const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / step)); return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }); };

// Dye: translucent bristle strokes laid along a box from the reading side (the lower part of a word, a wake under a value).
export function dye(ctx, x0, x1, y, h, { n = 0, seed = 1, P, p = 1, rtl = true, strokes = 6, alpha = 0.42 } = {}) {
  if (p <= 0) return;
  const L = (x1 - x0 + 24) * clamp(p), from = rtl ? x1 + 12 : x0 - 12, s = rtl ? -1 : 1;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round'; ctx.strokeStyle = P.dye;
  for (let k = 0; k < strokes; k++) {
    const r = rng((seed * 53 + n * 17 + k * 7) >>> 0), yy = y - h / 2 + h * (k + 0.5) / strokes + (r() - 0.5) * 4;
    ctx.globalAlpha = alpha * (0.6 + r() * 0.5); ctx.lineWidth = 3 + r() * (h / strokes) * 1.6;
    const a = (0.1 + r() * 0.12) * L, b = L * (0.85 + r() * 0.15);
    ctx.beginPath(); ctx.moveTo(from + s * a, yy);
    for (let d = a; d <= b; d += 30) ctx.lineTo(from + s * d, yy + Math.sin(d * 0.03 + k) * 2 + (r() - 0.5) * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

// The hot point: where the needle is cutting now.
export function hot(ctx, x, y, size, P, seed) {
  const r = rng(seed >>> 0), R = size * 0.42;
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, rgba(P.core, 0.95)); g.addColorStop(0.18, rgba(P.cream, 0.6)); g.addColorStop(1, rgba(P.dye, 0));
  ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
  ctx.strokeStyle = rgba(P.core, 0.85); ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 4; i++) { const a = r() * Math.PI * 2, d0 = 6 + r() * 6, d1 = d0 + 6 + r() * 12; ctx.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0); ctx.lineTo(x + Math.cos(a) * d1, y + Math.sin(a) * d1); }
  ctx.stroke(); ctx.restore();
}

// A fitted text cut in word by word from the reading side, boiling. o: { x0, x1, y, align, t, t0, step, dur, n, seed, P, color, dyeKey }
// Each word i is cut over [t0 + i * step, + dur]; a key word (*…*) gets dye laid into it once it is cut. Returns nothing.
export function cutText(kit, ctx, f, o) {
  const { x0, x1, y, align = 'start', t, t0, step = 0.1, dur = 0.2, n, seed = 1, P, color = P.cream, decor = false } = o;
  const rtl = kit.rtl, pOf = (i) => clamp((t - t0 - i * step) / dur), boxes = [];
  const word = (ghost) => (w, i, box, c) => {
    const p = pOf(i); if (p <= 0) return false;
    const b = boil(n, seed * 97 + i * 5 + (ghost ? 3 : 0), ghost ? 2.2 : 1.2);
    if (!ghost) {
      boxes.push({ ...box, p, i, key: w.key });
      if (w.key) dye(c, box.x, box.x + box.width, box.y + f.size * 0.08, f.size * 1.0, { n, seed: seed * 7 + i, P, p: clamp((t - t0 - i * step - dur) / 0.3), rtl, strokes: 9, alpha: 0.55 });
    }
    c.translate(b.x + (ghost ? 1.8 : 0), b.y + (ghost ? -1.4 : 0));
    if (p < 1) { const wv = box.width * p + 4; c.beginPath(); c.rect(rtl ? box.x + box.width - wv : box.x - 8, box.y - f.size * 1.1, wv + 8, f.size * 2.2); c.clip(); }
    if (ghost) { c.globalAlpha *= 0.3; return; }
    c.shadowColor = rgba(P.cream, 0.45); c.shadowBlur = f.size * 0.2;
  };
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: color, each: word(true), decor: true });
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: color, each: word(false), decor });
  // skips: thin lines of emulsion where the needle jumped
  ctx.save(); ctx.fillStyle = P.emulsion;
  for (const b of boxes) {
    if (b.p < 1) continue;
    const r = rng((n * 131 + seed * 7 + b.i * 3) >>> 0);
    for (let k = 0, m = r() < 0.6 ? 1 : 2; k < m; k++) ctx.fillRect(b.x + r() * b.width * 0.6, b.y + (r() - 0.5) * f.size * 0.6, b.width * (0.15 + r() * 0.35), 1.6);
  }
  ctx.restore();
  for (const b of boxes) if (b.p < 1) hot(ctx, rtl ? b.x + b.width * (1 - b.p) : b.x + b.width * b.p, b.y, f.size, P, n * 3 + b.i);
}

// A scratched star (three crossing cuts): a bullet.
export function star(ctx, x, y, s, n, seed, P, color) {
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + 0.3; needle(ctx, seg(x - Math.cos(a) * s, y - Math.sin(a) * s, x + Math.cos(a) * s, y + Math.sin(a) * s, 6), { w: 3, n, seed: seed * 5 + k, color: color ?? P.cream, tremble: 1.2 }); }
}

// A burst of rays scratched from a point (decoration behind and away from the words): uneven lengths, cut outward with p, with a little
// dye at the source. a0..a1 is the fan, in radians.
export function burst(ctx, x, y, a0, a1, r0, r1, rays, { n, seed, P, p = 1, alpha = 0.5 }) {
  if (p <= 0) return;
  needle(ctx, arc(x, y, r0 * 0.92, r0 * 0.92, 0, Math.PI * 2 * clamp(p), 14), { w: 12, n, seed: seed + 900, color: P.dye, alpha: 0.4, tremble: 3 });
  for (let k = 0; k < rays; k++) {
    const r = rng((seed * 7 + k * 31) >>> 0), a = a0 + (a1 - a0) * (k + 0.2 + r() * 0.6) / rays, L = r0 + (r1 - r0) * (0.45 + r() * 0.55);
    needle(ctx, seg(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * L, y + Math.sin(a) * L, 14), { w: 2 + r() * 2.5, n, seed: seed + k, color: P.cream, p, alpha, tremble: 2 });
  }
}

// Wrapped text with even rows (a long line is narrowed until one more step would add a row).
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 16; w > o.maxW * 0.45; w -= 16) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
