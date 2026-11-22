// Agit-cut motion: the beat is the editor. Everything lands on a grid of sixteenths (tokens.beat / 4), arrives sideways along a
// horizontal beam in a fraction of a beat and stops dead, with a short kick on landing; nothing fades, nothing bounces. Film windows cut
// to a new shot on every beat. This file also holds what the parts share: the palette, the shots (procedural "footage" printed in ink on
// paper), a window, a beam of type, and the paper fibre.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const E = (p) => { p = clamp(p); return 1 - (1 - p) ** 5; };      // the slam: most of the travel in the first frames
export const I = (p) => clamp(p) ** 2.6;                                   // thrown out, ends at full speed
// A landing kick: a one-off jolt that dies in about 0.2 s (exp(-14 dt)). dt: seconds since landing.
export const kick = (dt, amp = 7) => (dt < 0 ? 0 : -amp * Math.exp(-14 * dt) * Math.cos(dt * 40));

// Ink and paper: the darker of the brand's two colours is the ink, the lighter the paper; the accent is the one printed colour.
const lum = (h) => contrast(h, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, ink = paper === bg ? text : bg;
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  const tone = (k) => mix(ink, paper, k);
  return { paper, ink, red: accent, on, tone, onRed: on(accent), grey: tone(0.42), T: [tone(0.14), tone(0.36), tone(0.62), tone(0.86)] };
}

// A fixed sheet of paper fibre (specks and short fibres), built once from a seed and laid over the ground.
export function fibre(W, H, pal, seed = 1924) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 16000; i++) { g.globalAlpha = 0.05 + r() * 0.09; g.fillStyle = r() < 0.7 ? pal.ink : pal.paper; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  g.lineWidth = 1; g.strokeStyle = pal.ink;
  for (let i = 0; i < 900; i++) { g.globalAlpha = 0.04 + r() * 0.05; const x = r() * W, y = r() * H, a = r() * Math.PI, l = 8 + r() * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
}

// ---------- the shots: eight kinds of procedural footage, printed in four tones of ink on paper ----------
// Each is drawn in the window's own box (0,0)-(w,h). u: seconds since the shot was cut in; t: the scene's time (for what keeps running).
function gear(g, cx, cy, r, teeth, a, fill, hole) {
  g.fillStyle = fill; g.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const rr = i % 2 ? r * 0.84 : r, a0 = a + (i / (teeth * 2)) * Math.PI * 2, a1 = a + ((i + 1) / (teeth * 2)) * Math.PI * 2; g.lineTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr); g.lineTo(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr); }
  g.closePath(); g.fill();
  g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, r * 0.28, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 5; i++) { const b = a + (i / 5) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(b) * r * 0.56, cy + Math.sin(b) * r * 0.56, r * 0.11, 0, Math.PI * 2); g.fill(); }
}
function figure(g, x, y, s, c) {
  g.fillStyle = c; g.beginPath(); g.arc(x, y - 30 * s, 8 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(x - 13 * s, y + 18 * s); g.lineTo(x - 11 * s, y - 14 * s); g.quadraticCurveTo(x, y - 22 * s, x + 11 * s, y - 14 * s); g.lineTo(x + 13 * s, y + 18 * s); g.closePath(); g.fill();
}
const SHOTS = [
  (g, w, h, u, t, P, r) => {                                   // the crowd: rows of many small figures, panning
    g.fillStyle = P.T[3]; g.fillRect(0, 0, w, h); g.fillStyle = P.T[2]; g.fillRect(0, h * 0.42, w, h);
    for (let row = 0; row < 4; row++) {
      const s = (0.55 + row * 0.42) * h / 260, y = h * (0.46 + row * 0.17), step = 34 * s, off = (u * 24 * s * (row % 2 ? -1 : 1)) % step;
      for (let x = -step + off, k = 0; x < w + step; x += step, k++) figure(g, x + Math.sin(k * 12.9 + row * 3.1) * step * 0.3, y, s * (0.9 + 0.2 * Math.abs(Math.sin(k * 7.3 + row))), row < 2 ? P.T[1] : P.T[0]);
    }
  },
  (g, w, h, u, t, P) => {                                      // two gears meshing
    g.fillStyle = P.T[1]; g.fillRect(0, 0, w, h);
    const R = h * 0.5, a = t * 0.9; gear(g, w * 0.36, h * 0.62, R, 16, a, P.T[0], P.T[1]);
    gear(g, w * 0.36 + R * 1.42, h * 0.62 - R * 0.55, R * 0.62, 10, -a * 1.6 + 0.2, P.T[2], P.T[1]);
  },
  (g, w, h, u, t, P, r) => {                                   // chimneys and smoke
    g.fillStyle = P.T[3]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const k = (i * 0.137 + t * 0.07) % 1, x = w * (0.15 + (i % 4) * 0.22) + Math.sin(i * 4.1 + t) * 20, y = h * (0.55 - k * 0.7), rr = h * (0.05 + k * 0.12); g.fillStyle = P.T[2]; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = P.T[0];
    for (let i = 0; i < 4; i++) g.fillRect(w * (0.12 + i * 0.22), h * (0.3 + (i % 2) * 0.12), w * 0.055, h);
    g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += w / 12) g.lineTo(x, h * (0.74 - ((x / (w / 12)) % 2) * 0.08)); g.lineTo(w, h); g.fill();
  },
  (g, w, h, u, t, P) => {                                      // rails running to the horizon
    g.fillStyle = P.T[2]; g.fillRect(0, 0, w, h * 0.38); g.fillStyle = P.T[1]; g.fillRect(0, h * 0.38, w, h);
    const vx = w * 0.62, vy = h * 0.38;
    g.fillStyle = P.T[0];
    for (let i = 0; i < 9; i++) { const z = ((i + (t * 2.2) % 1) / 9) ** 2, y = vy + (h - vy) * z * 1.1, half = w * 0.6 * z; g.fillRect(vx - half, y, half * 2, 3 + z * 16); }
    g.strokeStyle = P.T[3]; g.lineWidth = 5;
    for (const sx of [-0.35, 0.35]) { g.beginPath(); g.moveTo(vx, vy); g.lineTo(vx + sx * w * 1.2, h * 1.05); g.stroke(); }
  },
  (g, w, h, u, t, P) => {                                      // a riveted girder truss, sliding past
    g.fillStyle = P.T[3]; g.fillRect(0, 0, w, h);
    const s = h * 0.55, off = -(u * 60) % s; g.strokeStyle = P.T[0]; g.lineWidth = h * 0.06;
    g.beginPath(); g.moveTo(0, h * 0.2); g.lineTo(w, h * 0.2); g.moveTo(0, h * 0.8); g.lineTo(w, h * 0.8);
    for (let x = off - s; x < w + s; x += s) { g.moveTo(x, h * 0.8); g.lineTo(x + s / 2, h * 0.2); g.lineTo(x + s, h * 0.8); }
    g.stroke(); g.fillStyle = P.T[2];
    for (let x = off - s; x < w + s; x += s / 2) { g.beginPath(); g.arc(x, h * (Math.round((x - off) / (s / 2)) % 2 ? 0.2 : 0.8), h * 0.03, 0, Math.PI * 2); g.fill(); }
  },
  (g, w, h, u, t, P) => {                                      // a spoked wheel turning fast
    g.fillStyle = P.T[0]; g.fillRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.55, R = h * 0.62, a = t * 2.4;
    g.strokeStyle = P.T[2]; g.lineWidth = h * 0.05; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = h * 0.022; g.beginPath();
    for (let i = 0; i < 12; i++) { const b = a + (i / 12) * Math.PI * 2; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); }
    g.stroke(); g.fillStyle = P.T[3]; g.beginPath(); g.arc(cx, cy, h * 0.09, 0, Math.PI * 2); g.fill();
  },
  (g, w, h, u, t, P) => {                                      // a press stamping on the beat
    g.fillStyle = P.T[2]; g.fillRect(0, 0, w, h);
    const ph = (t * 2) % 1, down = ph < 0.25 ? 1 - ph / 0.25 : clamp((ph - 0.25) / 0.75) ** 2;
    g.fillStyle = P.T[1]; g.fillRect(w * 0.1, h * 0.82, w * 0.8, h * 0.18);
    g.fillStyle = P.T[0]; g.fillRect(w * 0.47, -h * 0.1, w * 0.06, h * 0.3 + down * h * 0.32); g.fillRect(w * 0.3, h * 0.2 + down * h * 0.32, w * 0.4, h * 0.2);
    for (let i = 0; i < 6; i++) g.fillRect(w * (0.15 + i * 0.12), h * 0.74, w * 0.07, h * 0.08);
  },
  (g, w, h, u, t, P) => {                                      // searchlights over a crowd
    g.fillStyle = P.T[0]; g.fillRect(0, 0, w, h); g.fillStyle = P.T[1];
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + Math.sin(t * 0.8 + i * 2.1) * 0.5, x = w * (0.2 + i * 0.3), L = h * 2; g.beginPath(); g.moveTo(x, h); g.lineTo(x + Math.cos(a - 0.09) * L, h + Math.sin(a - 0.09) * L); g.lineTo(x + Math.cos(a + 0.09) * L, h + Math.sin(a + 0.09) * L); g.fill(); }
    const s = h / 300; for (let x = 0, k = 0; x < w + 30; x += 26 * s, k++) figure(g, x, h * 0.98 - Math.abs(Math.sin(k * 5.7)) * 10 * s, s * 0.9, P.T[0]);
  },
];
export const NSHOTS = SHOTS.length;

// A film window: an ink frame holding shot `k`, cut in `u` seconds ago. A per-frame flicker of about 2.5 % keeps it alive as film.
export function window(ctx, x, y, w, h, k, u, t, P, border = 6) {
  ctx.save();
  ctx.fillStyle = P.ink; ctx.fillRect(x - border, y - border, w + border * 2, h + border * 2);
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y);
  const push = 1 + Math.min(u, 2) * 0.03;                     // a slow push into every shot
  ctx.translate(w / 2, h / 2); ctx.scale(push, push); ctx.translate(-w / 2, -h / 2);
  SHOTS[((k % NSHOTS) + NSHOTS) % NSHOTS](ctx, w, h, u, t, P);
  const f = Math.floor(t * 24), n = Math.sin(f * 12.9898 + k * 78.233) * 43758.5453, fl = (n - Math.floor(n)) - 0.5;
  ctx.globalAlpha = Math.abs(fl) * 0.05; ctx.fillStyle = fl > 0 ? P.paper : P.ink; ctx.fillRect(-w, -h, w * 3, h * 3);
  ctx.restore();
}
// The shot that a window cut on the beat shows at time t: a new one every `every` seconds from t0, starting at `first`.
export const cutAt = (t, t0, every, first = 0) => { const n = Math.max(0, Math.floor((t - t0) / every)); return { k: first + n * 3, u: t - t0 - n * every }; };

// One row of fitted text on its own ink beam: the beam spans the row plus padding; a key word sits on a red segment of the beam.
// side: where the row is set ('start' = the reading side). Returns the beam's box.
export function beamRow(kit, ctx, f, row, { x0, x1, y, pad = 28, fill, ink, keyFill, keyInk, align = 'start', dx = 0, dy = 0 }) {
  const w = row.width + pad * 2, h = f.size * 1.6;
  const rtl = kit.rtl, left = align === 'center' ? (x0 + x1 - w) / 2 : ((align === 'start') === rtl ? x1 - w : x0);
  ctx.save(); ctx.translate(dx, dy);
  ctx.fillStyle = fill; ctx.fillRect(left, y - h / 2, w, h);
  const one = { ...f, rows: [row], height: f.lead };
  kit.drawText(ctx, one, { x0: left + pad, x1: left + w - pad, y: y + f.size * 0.04, align: 'start', color: ink, key: keyInk,
    each: (wd, i, box, c) => { if (wd.key) { c.fillStyle = keyFill; c.fillRect(box.x - f.space * 0.45, y - h / 2, box.width + f.space * 0.9, h); return keyInk; } } });
  ctx.restore();
  return { left, w, h };
}
