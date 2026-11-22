// Isometric motion: calm and explanatory. Words drift up a little and settle as they become solid; blocks extrude straight up out
// of their footprint; leader lines are drawn from the object to its label. One soft out-curve, no bounce, no spin.
// This file also holds the small isometric toolkit every part shares: the projection, a shaded block, a leader line, the palette.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const G = ease.outQuart;                       // extrusions: quick to rise, long to settle
export const C30 = Math.cos(Math.PI / 6);

// Grid point (x, y, z) in units -> screen. x runs down-right, y runs down-left, z runs up. (ox, oy) is where (0, 0, 0) lands.
export const project = (ox, oy, u) => (x, y, z = 0) => [ox + (x - y) * C30 * u, oy + (x + y) * 0.5 * u - z * u];

// The palette: every tone is a mix of the brand's three colours. Light comes from above-left: top face lightest, right face darkest.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lum = (c) => contrast(c, '#000000');
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const faces = (base, lift = 0.28) => ({ top: mix(base, light, lift), left: base, right: mix(base, dark, 0.38), edge: mix(base, light, T.tone.edge) });
  // A text colour pulled toward the ground by k, but never below 4.5:1 against it.
  const readable = (fg, k, against = bg) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  return {
    bg, text, accent, light, dark, faces, readable,
    keyText: contrast(accent, bg) >= 4.5 ? accent : text,
    onAccent: contrast(accent, bg) >= contrast(accent, text) ? bg : text,
    muted: readable(text, T.tone.muted),
    neutral: faces(mix(bg, text, T.tone.neutral)),
    floor: faces(mix(bg, text, T.tone.floor), 0.12),
    hot: faces(accent),
    line: mix(bg, text, 0.55),
  };
}

// A box from (x, y, z0) to (x + w, y + d, z0 + h), three faces. layers: a thin course line at every whole unit of height (a stack).
export function block(ctx, P, x, y, z0, w, d, h, f, layers = false) {
  if (h <= 0.002) h = 0.002;
  const poly = (pts, c) => { ctx.beginPath(); pts.forEach((q, i) => { const [sx, sy] = P(...q); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  const z1 = z0 + h;
  poly([[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x + w, y, z1]], f.right);
  poly([[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x, y + d, z1]], f.left);
  poly([[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], f.top);
  ctx.save(); ctx.strokeStyle = f.edge; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
  const seg = (a, b) => { const [ax, ay] = P(...a), [bx, by] = P(...b); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); };
  ctx.beginPath(); seg([x, y + d, z1], [x + w, y + d, z1]); seg([x + w, y + d, z1], [x + w, y, z1]); seg([x + w, y + d, z0], [x + w, y + d, z1]); ctx.stroke();
  if (layers) {
    ctx.globalAlpha = 0.4; ctx.beginPath();
    for (let k = Math.floor(z0) + 1; k < z1 - 0.15; k++) { seg([x, y + d, k], [x + w, y + d, k]); seg([x + w, y + d, k], [x + w, y, k]); }
    ctx.stroke();
  }
  ctx.restore();
}

// A leader line along a list of points, drawn to fraction p of its length, with a dot at the start and a dot when it arrives.
export function leader(ctx, pts, p, color, width = 2) {
  if (p <= 0) return;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), total = lens.reduce((a, b) => a + b, 0);
  let left = total * clamp(p), end = pts[0];
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], width * 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < lens.length && left > 0; i++) {
    const k = Math.min(1, left / (lens[i] || 1)); end = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    ctx.lineTo(end[0], end[1]); left -= lens[i];
  }
  ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(end[0], end[1], width * 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// A word (or any box) drifts up a little and becomes solid. box: { x, y (middle), width }, size: the font size.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  const e = E(p); ctx.globalAlpha *= e; ctx.translate(0, (1 - e) * size * 0.35);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const e = ease.inOutQuad(p); ctx.globalAlpha *= 1 - e; ctx.translate(0, -e * size * 0.25);
}

// Wrapped text with even rows: once a text needs several rows, the box is narrowed (same size) until one more step would add a row,
// so a last row never holds one lonely word. Uses only kit.fit.
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
