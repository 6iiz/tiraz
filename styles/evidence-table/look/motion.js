// Evidence-table motion: objects are slid across a lit table and set down (a soft ease, a shadow that tightens as they touch the
// glass); they leave by being slid off the other way, faster. The loupe is the one hero: it comes down from above (big, soft shadow)
// and settles on one word; inside its glass the object is seen magnified and turned positive. This file also holds what the parts
// share: the palette, the film strip, the card, the loupe, and a way to know where each word of a fitted text will sit.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;          // set down
export const L = (p) => 1 - (1 - clamp(p)) ** 6;          // the loupe lands: most of the travel early, a long soft tail
export const I = (p) => clamp(p) ** 2.4;                  // slid off

const lum = (h) => contrast(h, '#000000');                // order of brightness, from the kit's own measure
// The table is the brand's lighter colour, lit from below; ink is the darker colour. Film is ink with a breath of light in it.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = lum(text) >= lum(bg) ? text : bg, dark = light === text ? bg : text;
  const readable = (k, on) => { let c = mix(dark, light, k); while (k > 0 && contrast(c, on) < 4.6) { k -= 0.04; c = mix(dark, light, Math.max(0, k)); } return c; };
  const card = mix(light, dark, T.tone.card), positive = mix(light, accent, T.tone.positive);
  return {
    light, dark, accent, table: light, ink: dark, card, positive,
    edge: mix(light, dark, T.tone.edge), film: mix(dark, light, T.tone.film), filmLine: mix(dark, light, T.tone.film + 0.12),
    filmText: light, filmSoft: mix(light, dark, 0.3), soft: readable(T.tone.soft, card),
    rim: mix(dark, light, 0.14),
    onAccent: contrast(dark, accent) >= contrast(light, accent) ? dark : light,
    mark: contrast(accent, positive) >= 2.2 ? accent : dark,        // a reading mark inside the glass: the accent when it shows
  };
}

// Where each word of a fitted text will be drawn (left edge, middle, width), measured without drawing anything.
export function wordBoxes(kit, f, o) {
  const c = document.createElement('canvas').getContext('2d'), out = [];
  kit.drawText(c, f, { ...o, decor: true, each: (w, i, box) => { out.push({ ...box, key: w.key, i }); return false; } });
  return out;
}

// A shadow for an object lying on the glass; lift 0 = touching, 1 = held above it.
export function shade(ctx, lift = 0) {
  ctx.shadowColor = rgba('#000000', 0.13 + 0.07 * lift); ctx.shadowBlur = 8 + 34 * lift; ctx.shadowOffsetY = 3 + 16 * lift; ctx.shadowOffsetX = 0;
}
export function noShade(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

// A strip of film: negative (dark base, the table showing through its perforations) or positive (light base, inked perforations).
export function film(ctx, x, y, w, h, P, positive = false, lift = 0) {
  ctx.save();
  if (!positive) shade(ctx, lift);
  ctx.fillStyle = positive ? P.positive : P.film; ctx.fillRect(x, y, w, h); noShade(ctx);
  const hw = 16, hh = 22, step = 44, m = 13;
  ctx.beginPath();
  for (let k = x + 14; k < x + w - hw; k += step) { ctx.roundRect(k, y + m, hw, hh, 4); ctx.roundRect(k, y + h - m - hh, hw, hh, 4); }
  if (positive) { ctx.strokeStyle = P.edge; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.fillStyle = P.table; ctx.fill(); }
  ctx.fillStyle = positive ? P.edge : P.filmLine;                                     // the rails beside the perforations
  ctx.fillRect(x, y + m + hh + 8, w, 2); ctx.fillRect(x, y + h - m - hh - 10, w, 2);
  ctx.restore();
}

// A catalogue card: paper a shade darker than the lit table, a fine edge, a punched hole at the far end.
export function card(ctx, x, y, w, h, P, rtl, lift = 0, hole = true) {
  ctx.save(); shade(ctx, lift); ctx.fillStyle = P.card; ctx.fillRect(x, y, w, h); noShade(ctx);
  ctx.strokeStyle = P.edge; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  if (hole) { const r = Math.min(9, h * 0.12), hx = rtl ? x + 22 : x + w - 22; ctx.fillStyle = P.table; ctx.beginPath(); ctx.arc(hx, y + h / 2, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = P.edge; ctx.stroke(); }
  ctx.restore();
}

// The loupe. p: coming down (0 in the air, off to the upper side; 1 on the glass); q: lifting off again. (cx, cy, r) is where it
// rests. inside(X, Y) draws, already magnified about the point under the glass, what the glass shows.
export function loupe(ctx, cx, cy, r, p, q, P, rtl, inside, mag = 1.2) {
  if (p <= 0 || q >= 1) return;
  const lift = (1 - L(p)) + I(q), s = 1 + 0.32 * lift;
  const X = cx + (rtl ? -1 : 1) * lift * 300, Y = cy - lift * 520, R = r * s;
  ctx.save();
  ctx.globalAlpha *= clamp(p * 5) * (1 - clamp((q - 0.6) * 2.5));
  // its shadow on the table: further off and softer the higher it is
  const g = ctx.createRadialGradient(X + 10 + lift * 60, Y + 22 + lift * 90, R * 0.6, X + 10 + lift * 60, Y + 22 + lift * 90, R * (1.12 + lift * 0.4));
  g.addColorStop(0, rgba('#000000', 0.22 * (1 - lift * 0.6))); g.addColorStop(1, rgba('#000000', 0));
  ctx.fillStyle = g; ctx.fillRect(X - R * 2, Y - R * 2, R * 4.5, R * 4.5);
  // the glass
  ctx.save(); ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = P.table; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
  ctx.translate(X, Y); ctx.scale(mag, mag); ctx.translate(-X, -Y); inside(X, Y);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.clip();
  const gl = ctx.createLinearGradient(X - R, Y - R, X + R * 0.2, Y + R * 0.2);           // a cool glare across the upper half
  gl.addColorStop(0, rgba('#ffffff', 0.28)); gl.addColorStop(0.45, rgba('#ffffff', 0.06)); gl.addColorStop(0.46, rgba('#ffffff', 0)); gl.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = gl; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
  ctx.restore();
  // the rim: a dark barrel edge, a thin accent ring just inside it, a highlight on its upper lip
  ctx.lineWidth = 20 * s; ctx.strokeStyle = P.rim; ctx.beginPath(); ctx.arc(X, Y, R + 9 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3 * s; ctx.strokeStyle = P.accent; ctx.beginPath(); ctx.arc(X, Y, R - 2, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.beginPath(); ctx.arc(X, Y, R + 16 * s, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
  ctx.restore();
}

// A word or a short block settles onto the table: a small drop and a short opacity helper.
export function arrive(ctx, p, size) {
  if (p <= 0) return false;
  ctx.globalAlpha *= clamp(p * 3); ctx.translate(0, (1 - E(p)) * size * 0.3);
}
// How far an object slid in from the reading side and off to the other side is from home.
export const slide = (p, q, dist, rtl) => ((1 - E(p)) * (rtl ? 1 : -1) + I(q) * (rtl ? -1 : 1)) * dist;
