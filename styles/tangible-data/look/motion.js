// Tangible data motion: things are objects, so they move like objects. A piece falls under gravity (it speeds up and stops dead on what
// is under it, no bounce), a word is set down a few pixels from above, and a block that leaves is lifted straight up and away.
// This file also holds what every part shares: the palette (studio light from the brand's own colours), a box drawn in a fixed oblique
// view with three lit faces and a long soft shadow, the inlaid base slab, a stack of plates, and where each word of a fitted text sits.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;               // a set-down (a hand places it)
export const lift = (p) => clamp(p) ** 2;                        // picked up: slow off the surface, then away
// A fall: offset from the resting place (negative = above), accelerating, stopping dead at p = 1.
export const fall = (p, h) => -h * (1 - clamp(p) ** 2);

const lum = (h) => contrast(h, '#000000');
// Studio palette. The ground is always the lighter of the brand's two colours (a pale seamless sweep), the ink the darker one.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const readable = (k) => { let c = mix(dark, light, k); while (k > 0 && contrast(c, light) < 4.8) { k -= 0.04; c = mix(dark, light, Math.max(0, k)); } return c; };
  const onAccent = contrast(accent, dark) >= contrast(accent, light) ? dark : light;
  const t = T.tone;
  return {
    light, dark, accent, onAccent, ink: dark, muted: readable(t.muted),
    metal: { top: mix(light, dark, t.metal[0]), front: mix(light, dark, t.metal[1]), side: mix(light, dark, t.metal[2]), line: mix(light, dark, t.metal[1] + 0.1) },
    pale: { top: mix(light, dark, 0.03), front: mix(light, dark, 0.08), side: mix(light, dark, 0.2), line: mix(light, dark, 0.13) },
    acc: { top: mix(accent, light, 0.3), front: accent, side: mix(accent, dark, 0.32), line: mix(accent, dark, 0.14) },
    ruler: { top: mix(accent, light, 0.55), front: mix(accent, dark, 0.15), side: mix(accent, dark, 0.45), line: mix(accent, dark, 0.3) },
    stone: { top: mix(dark, light, t.stone[0]), front: mix(dark, light, t.stone[1]), side: mix(dark, light, t.stone[2]), line: mix(dark, light, t.stone[0] + 0.08) },
    shadow: rgba('#000000', t.shadow),
  };
}

// The oblique view: depth recedes up and towards the far side (left in a right-to-left brand), where the light does not reach.
export const view = (rtl) => ({ kx: rtl ? -0.62 : 0.62, ky: -0.5 });

// The soft shadow of a box resting on the floor, thrown back and away from the key light. a: 0..1 how hard (a falling box: soft).
export function shadow(ctx, x, y, w, h, d, P, rtl, a = 1, reach = 1) {
  if (a <= 0) return;
  const v = view(rtl), dx = d * v.kx, dy = d * v.ky, s = (rtl ? -1 : 1) * (h * 0.8 + 24) * reach, yb = y + h;
  ctx.save(); ctx.filter = `blur(${6 + 12 * (1 - a)}px)`; ctx.fillStyle = P.shadow;
  for (let i = 0; i <= 5; i++) {                                        // the footprint swept away from the light
    const o = (s * i) / 5, oy = (-i * h * 0.05);
    ctx.globalAlpha = a * (0.42 - i * 0.05);
    ctx.beginPath(); ctx.moveTo(x + o, yb + oy); ctx.lineTo(x + w + o, yb + oy); ctx.lineTo(x + w + dx + o, yb + dy + oy); ctx.lineTo(x + dx + o, yb + dy + oy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// A box: front face x..x+w, y..y+h; the top face d deep. mat: { top, front, side, line }. lines: brushed hairlines on the front.
export function box(ctx, x, y, w, h, d, mat, rtl, lines = 0) {
  const v = view(rtl), dx = d * v.kx, dy = d * v.ky;
  ctx.fillStyle = mat.top; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + dx, y + dy); ctx.lineTo(x + dx, y + dy); ctx.closePath(); ctx.fill();
  const sx = dx < 0 ? x : x + w;
  ctx.fillStyle = mat.side; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + dx, y + dy); ctx.lineTo(sx + dx, y + dy + h); ctx.lineTo(sx, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mat.front; ctx.fillRect(x, y, w, h);
  if (lines > 0) { ctx.fillStyle = mat.line; for (let i = 1; i <= lines; i++) ctx.fillRect(x, y + (h * i) / (lines + 1), w, 1); }
  ctx.fillStyle = rgba('#ffffff', 0.22); ctx.fillRect(x, y, w, 1.5);           // the lit front edge
}

// The base every reading stands on: a dark stone slab with marks inlaid in its top face at a steady pitch (the base's own scale).
export function base(ctx, x0, x1, y, P, rtl, p = 1) {
  if (p <= 0) return;
  const w = (x1 - x0) * E(p), x = rtl ? x1 - w : x0, h = 46, d = 70, v = view(rtl);
  shadow(ctx, x, y, w, h, d, P, rtl, 0.9, 0.6);
  box(ctx, x, y, w, h, d, P.stone, rtl);
  ctx.fillStyle = P.stone.line;
  for (let gx = 0; gx < w; gx += 46) {                                            // inlaid marks, every fifth one longer
    const k = Math.round(gx / 46), len = k % 5 ? 0.3 : 0.65, xx = rtl ? x + w - gx : x + gx;
    ctx.beginPath(); ctx.moveTo(xx + d * 0.15 * v.kx, y + d * 0.15 * v.ky); ctx.lineTo(xx + d * (0.15 + len * 0.7) * v.kx, y + d * (0.15 + len * 0.7) * v.ky);
    ctx.lineWidth = 2; ctx.strokeStyle = P.stone.line; ctx.stroke();
  }
}

// Small seeded offsets for plate k (a few pixels): they make a pile look like separate plates rather than one solid bar.
export function jitter(seed, k) { const r = rng(seed * 101 + k * 7 + 3); r(); return { x: (r() - 0.5) * 7, w: (r() - 0.5) * 6 }; }

// Where each word of a fitted text sits when drawn with kit.drawText(…, { x0, x1, y, align }).
export function rowsOf(f, x0, x1, y, align, rtl) {
  return f.rows.map((row, r) => {
    const yy = y + r * f.lead;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? (rtl ? x1 - row.width : x0) : (rtl ? x0 : x1 - row.width);
    let cur = rtl ? left + row.width : left;
    const words = row.words.map((w) => { const wl = rtl ? cur - w.width : cur; cur = rtl ? wl - f.space : wl + w.width + f.space; return { ...w, x: wl }; });
    return { y: yy, left, width: row.width, words };
  });
}
// A key phrase (*several words*) is one span per row, not one per word.
export function keySpans(f, x0, x1, y, align, rtl) {
  const out = [];
  rowsOf(f, x0, x1, y, align, rtl).forEach((row, r) => {
    let cur = null;
    for (const w of row.words) {
      if (!w.key) { cur = null; continue; }
      if (cur) { cur.x0 = Math.min(cur.x0, w.x); cur.x1 = Math.max(cur.x1, w.x + w.width); } else { cur = { x0: w.x, x1: w.x + w.width, y: row.y, row: r }; out.push(cur); }
    }
  });
  return out;
}
export const spanOf = (spans, box) => spans.find((s) => s.row === box.row && box.x + box.width / 2 >= s.x0 - 1 && box.x + box.width / 2 <= s.x1 + 1);

// A word is set down: it comes 18 px from above and its opacity rises in the first fifth of the move.
export function setDown(ctx, p, size) {
  if (p <= 0) return false;
  ctx.globalAlpha *= clamp(p * 5); ctx.translate(0, -(1 - E(p)) * size * 0.22);
}
// Wrapped text with even rows (same size, narrower box while the row count holds).
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
