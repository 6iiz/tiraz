// Subtitle-wire motion: social news read with the sound off. The caption is the shot. Words do not rise or fade: a chunk of one or
// two words is slammed onto the frame at once, landing from a little larger than its size in a seventh of a second, and the next
// chunk follows on the next half-beat. Nothing leaves by itself: scenes end on a hard cut. The footage under the words is the only
// thing that drifts. This file also holds the palette, the label chip, the caption setter and the footage stand-ins.
import { clamp, ease, mix, rgba, rng, contrast, span, SAFE } from '/engine/kit.js';

export const E = ease.outExpo;

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The footage is graded toward the brand's darker colour; captions are its lighter colour; the accent is the keyword block.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const on = (f) => (contrast(f, dark) >= contrast(f, light) ? dark : light);
  return { dark, light, accent, on, onAccent: on(accent), onLight: dark, dim: mix(light, dark, T.tone.dim) };
}

// A slam: the thing lands from `T.slam` times its size around (cx, cy). Returns false before it starts.
export function slam(ctx, p, cx, cy, T) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const s = 1 + (T.slam - 1) * (1 - E(p));
  ctx.globalAlpha *= clamp(p * 5);
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// Split a fitted text into chunks: at most `n` words, never across a row. -> chunk index for each word index.
export function chunks(f, n) {
  const out = []; let c = -1;
  f.rows.forEach((row) => row.words.forEach((w, i) => { if (i % n === 0) c++; out.push(c); }));
  return { of: out, count: c + 1 };
}

// Draws a caption: chunk c lands at t0 + c * gap. Key words sit on a block of the accent. `dim` (0..1) turns it to the quiet colour.
export function caption(kit, ctx, f, { x0 = SAFE.left, x1 = SAFE.right, y, t, t0, gap, P, T, ch, align = 'start', dim = 0, color }) {
  const col = color ?? (dim > 0 ? mix(P.light, P.dim, dim) : P.light);
  kit.drawText(ctx, f, { x0, x1, y, align, color: col, key: P.onAccent,
    each: (w, i, box, c) => {
      const k = ch ? ch.of[i] : 0, p = span(t, t0 + k * gap, t0 + k * gap + T.dur.slam);
      if (slam(c, p, box.x + box.width / 2, box.y, T) === false) return false;
      if (w.key) {
        const pad = f.size * 0.18;
        c.fillStyle = dim > 0 ? mix(P.accent, P.dark, dim * 0.6) : P.accent; c.fillRect(box.x - pad, box.y - f.size * 0.64, box.width + pad * 2, f.size * 1.28);
        return P.onAccent;
      }
      c.shadowColor = rgba(P.dark, 0.6); c.shadowBlur = f.size * 0.25; c.shadowOffsetY = f.size * 0.04;
    } });
}

// The label chip: a block of the light colour with dark words, for a place, a time, a lead-in. It slides in from the reading side.
export function chip(kit, ctx, f, { y, p, P, rtl, x = null }) {
  if (!f || p <= 0) return;
  const w = f.width + 44, h = f.size * 1.5, e = E(p), xr = rtl ? SAFE.right : SAFE.left + w;
  ctx.save(); ctx.globalAlpha *= clamp(p * 4); ctx.translate((rtl ? 1 : -1) * (1 - e) * 60, 0);
  ctx.fillStyle = P.light; ctx.fillRect(xr - w, y - h / 2, w, h);
  ctx.fillStyle = P.accent; ctx.fillRect(rtl ? xr : xr - w - 10, y - h / 2, 10, h);
  kit.drawText(ctx, f, { x0: xr - w + 22, x1: xr - 22, y: y + 1, align: 'start', color: P.onLight, key: P.onLight });
  ctx.restore();
}

// ---------- footage stand-ins (full bleed, graded dark), built once per scene ----------
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function sprite(color, r) {
  const [c, g] = canvas(r * 2, r * 2), gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.4, rgba(color, 0.5)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
}
// A crowd at dusk, out of focus: soft lights behind, three rows of heads and shoulders in silhouette drifting at different speeds.
function crowd(P, T, W, H, seed) {
  const r = rng(seed), lights = sprite(P.light, 128), hot = sprite(P.accent, 128), X = 500, rows = [];
  const blobs = Array.from({ length: 16 }, () => ({ x: r() * W, y: 120 + r() * 520, s: 160 + r() * 360, a: 0.12 + r() * T.tone.blob, hot: r() < 0.25, v: (r() - 0.5) * 14 }));
  for (let L = 0; L < 3; L++) {
    const [cv, g] = canvas(W + X, H), base = 520 + L * 150, col = mix(P.dark, P.light, [0.16, 0.08, 0.02][L]);
    g.fillStyle = col;
    for (let x = -60; x < W + X; x += 110 + r() * 70 - L * 10) {
      const hx = x + r() * 30, hy = base + r() * 60 - 30, hr = 38 + L * 12 + r() * 10;
      g.beginPath(); g.ellipse(hx, hy, hr * 0.85, hr, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(hx - hr * 2.6, H); g.quadraticCurveTo(hx - hr * 2.4, hy + hr * 1.2, hx, hy + hr * 1.1); g.quadraticCurveTo(hx + hr * 2.4, hy + hr * 1.2, hx + hr * 2.6, H); g.fill();
    }
    rows.push(cv);
  }
  return (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(P.dark, P.light, 0.2)); g.addColorStop(0.45, mix(P.dark, P.accent, 0.18)); g.addColorStop(1, P.dark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const b of blobs) { ctx.globalAlpha = b.a; ctx.drawImage(b.hot ? hot : lights, b.x + b.v * t - b.s / 2, b.y - b.s / 2, b.s, b.s); }
    ctx.globalAlpha = 1;
    rows.forEach((cv, L) => ctx.drawImage(cv, -X / 2 + Math.sin(t * 0.3 + L) * 6 - t * (3 + L * 5), 0));
  };
}
// A road from a drone: lanes converging to a point on the horizon, light streaks coming down them toward the lens.
function road(P, T, W, H, seed) {
  const r = rng(seed), vx = W * 0.5, vy = 300, glow = sprite(P.light, 128), hot = sprite(P.accent, 128);
  const cars = Array.from({ length: 40 }, () => ({ lane: Math.floor(r() * 6), ph: r(), v: 0.18 + r() * 0.2, hot: r() < 0.4 }));
  const lane = (i) => (i - 2.5) * 260;
  return (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(P.dark, P.light, 0.26)); g.addColorStop(0.16, mix(P.dark, P.accent, 0.2)); g.addColorStop(0.17, mix(P.dark, P.light, 0.06)); g.addColorStop(1, P.dark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.5; ctx.drawImage(glow, vx - 360, vy - 160, 720, 320); ctx.globalAlpha = 1;
    ctx.strokeStyle = rgba(P.light, 0.16); ctx.lineWidth = 3;
    for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + (i - 3) * 260 * 2.6, vy + (H - vy) * 1.1); ctx.stroke(); }
    for (const c of cars) {
      const q = ((c.ph + t * c.v) % 1), d = q * q * q, y = vy + d * (H - vy) * 1.1, x = vx + lane(c.lane) * d * 2.6, s = 10 + d * 140;
      ctx.globalAlpha = Math.min(1, q * 3) * 0.85; ctx.drawImage(c.hot ? hot : glow, x - s, y - s * 0.5, s * 2, s);
    }
    ctx.globalAlpha = 1;
  };
}
// The source document: a page of print, tilted a little, with one line marked by a highlighter; the camera pushes toward it.
export function documentShot(P, T, W, H, seed, mark = 0.5) {
  const r = rng(seed), pw = 900, ph = 1160, [cv, g] = canvas(pw, ph), lines = [];
  g.fillStyle = mix(P.light, P.dark, 0.04); g.fillRect(0, 0, pw, ph);
  const ink = mix(P.light, P.dark, 0.55), soft = mix(P.light, P.dark, 0.3);
  g.fillStyle = ink; g.fillRect(pw - 90 - 420, 90, 420, 34); g.fillRect(pw - 90 - 260, 140, 260, 18);
  g.fillStyle = soft; g.fillRect(90, 190, pw - 180, 3);
  for (let y = 240, i = 0; y < ph - 80; y += 42, i++) { const w = (pw - 180) * (i % 6 === 5 ? 0.45 + r() * 0.2 : 0.82 + r() * 0.18); g.fillStyle = soft; g.fillRect(pw - 90 - w, y, w, 14); lines.push([pw - 90 - w, y, w]); }
  const hl = lines[Math.floor(lines.length * 0.32)];
  return (ctx, t, at = 0) => { t -= 2;
    ctx.fillStyle = P.dark; ctx.fillRect(0, 0, W, H);
    const z = 1.05 + 0.025 * t, cx = W / 2, cy = 520;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.05); ctx.scale(z, z); ctx.translate(-pw / 2, -hl[1] - 7);
    ctx.drawImage(cv, 0, 0);
    const k = E(span(t, at + mark, at + mark + 0.45));
    if (k > 0) { ctx.fillStyle = rgba(P.accent, 0.62); ctx.fillRect(hl[0] + hl[2] * (1 - k) - 10, hl[1] - 12, hl[2] * k + 20, 38); }
    ctx.restore();
  };
}
export function footage(P, T, W, H, kind) {
  return (((kind % 2) + 2) % 2 ? road : crowd)(P, T, W, H, 500 + kind * 31);
}
// The scrim under the captions: the footage darkens toward the bottom so the words always stand on dark. `top` is where the words begin.
export function scrim(ctx, P, W, H, top, T) {
  const a = Math.round(Math.max(0, top - T.scrim.full + T.scrim.from)), b = Math.round(Math.max(a + 10, top - 40));
  const g = ctx.createLinearGradient(0, a, 0, b);
  g.addColorStop(0, rgba(P.dark, 0)); g.addColorStop(1, rgba(P.dark, T.scrim.k));
  ctx.fillStyle = g; ctx.fillRect(0, a, W, b - a + 1); ctx.fillStyle = rgba(P.dark, T.scrim.k); ctx.fillRect(0, b + 1, W, H - b - 1);
  const tg = ctx.createLinearGradient(0, 0, 0, 300); tg.addColorStop(0, rgba(P.dark, 0.6)); tg.addColorStop(1, rgba(P.dark, 0));
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 300);
}
