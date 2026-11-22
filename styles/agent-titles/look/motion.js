// Agent-titles motion: a cut-paper title sequence. Credits slide in along their row and stop dead on the beat; when a piece lands it
// slaps down on twos (two drawings at 12 a second, a little large, then flat). Puppets (the agent) move on twos too; slides and the
// camera move on ones. This file holds what the parts share: the four inks, scissor-cut shapes (edges cut once and cached, so a moving
// piece keeps its edge), a paper piece with its cut gap and paper shadow, the paper texture, and the agent himself.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const O = (p) => 1 - (1 - clamp(p)) ** 4;                         // a slide that stops dead
export const I = (p) => clamp(p) ** 2.4;                                 // thrown out of frame
export const twos = (t) => Math.floor(t * 12) / 12;                       // puppet time
// The slap of a landing piece, on twos: 1.1, then 1.04, then flat. dt: seconds since it landed.
export const slap = (dt) => (dt < 0 ? 1.06 : dt < 1 / 12 ? 1.06 : dt < 2 / 12 ? 1.02 : 1);

const lum = (h) => contrast(h, '#000000');
// Four inks from the brand: ink (the darker colour), paper (the lighter), hot (the accent) and a second ink mixed from hot and paper.
export function inks(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, ink = paper === bg ? text : bg;
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  const second = mix(accent, on(accent) === ink ? paper : ink, 0.42);
  const shade = (g) => mix(g, on(g), 0.11);                              // background props: a darker (or lighter) step of the ground
  return { ink, paper, hot: accent, second, on, shade };
}

// ---------- scissor cuts ----------
// A polygon resampled every ~9 px and pushed along its normal by low-frequency noise, with a rare notch: built once into a Path2D.
export function cut(pts, seed = 1, amp = 1.8) {
  const r = rng(seed), f1 = r() * 6.28, f2 = r() * 6.28, path = new Path2D();
  let s = 0, first = true;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 9));
    const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    for (let k = 0; k < n; k++) {
      const q = k / n, ss = s + q * L;
      let d = amp * (0.6 * Math.sin(ss / 23 + f1) + 0.4 * Math.sin(ss / 61 + f2));
      if (r() < 0.025) d -= amp * 0.9;
      const x = x0 + (x1 - x0) * q + nx * d, y = y0 + (y1 - y0) * q + ny * d;
      if (first) { path.moveTo(x, y); first = false; } else path.lineTo(x, y);
    }
    s += L;
  }
  path.closePath();
  return path;
}
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const ring = (cx, cy, r, n = 72) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * 6.2832) * r, cy + Math.sin((i / n) * 6.2832) * r]);
// A strip with scissor-cut ends slanted opposite ways, like a credit strip snipped from a sheet.
export const strip = (x, y, w, h, s = 16) => [[x + s, y], [x + w, y], [x + w - s, y + h], [x, y + h]];

// A paper piece: the paper shadow, the cut gap in the ground's colour, then the piece. Neutral black at low alpha for the shadow.
export function piece(ctx, path, fill, gap, { shadow = true, gapW = 5 } = {}) {
  if (shadow) { ctx.save(); ctx.translate(5, 7); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill(path); ctx.restore(); }
  if (gap) { ctx.strokeStyle = gap; ctx.lineWidth = gapW; ctx.lineJoin = 'round'; ctx.stroke(path); }
  ctx.fillStyle = fill; ctx.fill(path);
}

// The paper: soft mottling, faint fibres and a few squeegee streaks, built once per pair of inks and laid over each frame.
const texCache = new Map();
export function paperTexture(W, H, I0) {
  const key = I0.ink + I0.paper; if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = rng(1959);
  for (let i = 0; i < 140; i++) {
    const x = r() * W, y = r() * H, R = 60 + r() * 220, gr = g.createRadialGradient(x, y, 0, x, y, R), col = r() < 0.6 ? 'rgba(0,0,0,' : 'rgba(255,255,255,';
    gr.addColorStop(0, col + (0.02 + r() * 0.02) + ')'); gr.addColorStop(1, col + '0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
  }
  for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(0,0,0,${0.015 + r() * 0.02})`; g.fillRect(0, r() * H, W, 6 + r() * 30); }
  g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 1;
  for (let i = 0; i < 700; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  texCache.set(key, c); return c;
}

// ---------- the agent ----------
// A tall silhouette in profile, facing -x, feet at (0,0), about 330 px tall: hat, head with a nose, coat, one swinging arm, two legs
// with wedge shoes, and a scarf that streams back. Eight drawings of a walk, each cut once and cached.
const poses = [];
function pose(i) {
  if (poses[i]) return poses[i];
  const ph = (i / 8) * Math.PI * 2, a = 0.42 * Math.sin(ph), bob = -5 * Math.abs(Math.cos(ph)), sd = 10 + i * 7;
  const leg = (ang, s, hx) => { const hy = -140 + bob, fx = hx + Math.sin(ang) * -140, fy = hy + Math.cos(ang) * 140;
    return [cut([[hx - 12, hy], [hx + 12, hy], [fx + 9, fy], [fx - 9, fy]], s, 1.2), cut([[fx - 36, fy], [fx + 12, fy - 12], [fx + 12, fy], [fx - 36, fy + 2]], s + 1, 1)]; };
  const body = [
    ...leg(a, sd, -8), ...leg(-a, sd + 3, 10),
    cut([[-30, -258 + bob], [26, -258 + bob], [44 + 6 * Math.sin(ph), -100 + bob], [-46 - 6 * Math.sin(ph), -100 + bob]], sd + 5, 1.6),          // the coat
    cut(ring(-4, -284 + bob, 22, 28).concat([]), sd + 6, 1),                                                                                // the head
    cut([[-22, -292 + bob], [-38, -276 + bob], [-20, -272 + bob]], sd + 7, 0.6),                                                            // the nose
    cut([[-24, -334 + bob], [18, -334 + bob], [22, -300 + bob], [-26, -300 + bob]], sd + 8, 1),                                             // the hat's crown
    cut([[-44, -304 + bob], [36, -304 + bob], [34, -294 + bob], [-42, -294 + bob]], sd + 9, 0.8),                                           // its brim
  ];
  const sw = -a * 0.9, sx = -6, sy = -248 + bob, ex = sx + Math.sin(sw) * -112, ey = sy + Math.cos(sw) * 112;
  body.push(cut([[sx - 10, sy], [sx + 10, sy], [ex + 7, ey], [ex - 7, ey]], sd + 10, 1), cut([[ex - 8, ey - 4], [ex + 6, ey - 4], [ex - 4, ey + 24]], sd + 11, 0.6));
  const sc = []; for (let k = 0; k <= 8; k++) sc.push([4 + k * 11, -258 + bob + Math.sin(k * 0.9 - ph * 2) * (2 + k * 0.9) + k * 1.2]);
  for (let k = 8; k >= 0; k--) sc.push([4 + k * 11, -246 + bob + Math.sin(k * 0.9 - ph * 2) * (2 + k * 0.9) + k * 1.6 - k * 0.5]);
  return (poses[i] = { body, scarf: cut(sc, sd + 12, 0.6) });
}
// Draws the agent at (x, y) (his feet), facing `face` (-1 = toward -x). t: the scene's time; he walks when `walking`, else stands.
export function agent(ctx, x, y, s, face, t, { fill, scarf, gap, walking = true }) {
  const P = pose(walking ? Math.floor(t * 12) % 8 : 2);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (face < 0 ? 1 : -1), s);
  ctx.save(); ctx.translate(4, 6); ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (const p of P.body) ctx.fill(p); ctx.restore();
  ctx.strokeStyle = gap; ctx.lineWidth = 6 / s; ctx.lineJoin = 'round'; for (const p of P.body) ctx.stroke(p); ctx.stroke(P.scarf);
  ctx.fillStyle = scarf; ctx.fill(P.scarf);
  ctx.fillStyle = fill; for (const p of P.body) ctx.fill(p);
  ctx.restore();
}
// Where a walker is: from x0 at t0, `speed` px a second in direction dir, moving on twos.
export const walkX = (t, t0, x0, dir, speed = 420) => x0 + dir * speed * Math.max(0, twos(t) - twos(t0));

// Per-word motion for kit.drawText: each word slides in along its row from the reading side and stops dead, then slaps down on twos;
// at the exit the words carry on the same way, out of frame. t0(i): when word i starts; out: 0..1 exit progress.
export function credit(t, t0, slide, out, rtl, key) {
  const dir = rtl ? 1 : -1;
  return (w, i, box, c) => {
    const s0 = t0(i), p = (t - s0) / slide; if (p <= 0) return false;
    const dx = (1 - O(p)) * dir * 760 - dir * I(out) * 1300;
    const k = slap(t - s0 - slide), cx = box.x + box.width / 2;
    c.translate(dx + cx, box.y); c.scale(k, k); c.translate(-cx, -box.y);
    if (w.key && key) return key(w, box, c);
  };
}
