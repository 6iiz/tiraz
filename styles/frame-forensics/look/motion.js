// Frame Forensics motion and materials. A cold investigation desk: evidence is laid out on one clock and checked against itself.
// Motion is restrained and exact: words are set like a transcription (a short lift into place, one after another), the footage plays
// and then freezes on the decisive frame, a ring is drawn around what matters, a highlight is wiped across the decisive words, and a
// thin leader joins the two (the sync line). Nothing bounces; the only colour beyond the two brand inks is the accent, used for
// marks (rings, highlights, playheads), never for decoration. This file holds the palette, the footage stand-in and the marks.
import { clamp, ease, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = ease.outQuart, IO = ease.inOutCubic, I = ease.inQuad;

// The desk is whichever brand colour is darker; the light one is the type. Greys are readable mixes.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const L = (c) => contrast(c, '#000000');
  const ink = L(text) >= L(bg) ? text : bg, desk = ink === text ? bg : text;
  const readable = (k) => { let c = mix(ink, desk, k); while (k > 0 && contrast(c, desk) < 4.6) { k -= 0.03; c = mix(ink, desk, Math.max(0, k)); } return c; };
  const onAccent = contrast(accent, desk) >= contrast(accent, ink) ? desk : ink;
  return { desk, ink, accent, onAccent, grey: readable(T.tone.grey), dim: mix(desk, ink, 0.3), rule: mix(desk, ink, T.tone.rule), panel: mix(desk, ink, T.tone.panel),
    mark: contrast(accent, desk) >= 3 ? accent : mix(accent, ink, 0.5) };
}

// ---------- word positions and key runs (same arithmetic as kit.drawText) ----------
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) { const wl = kit.rtl ? cur - w.width : cur; out.push({ i: i++, x: wl, y: yy, width: w.width, row: r, key: w.key }); cur = kit.rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function runs(bx) {
  const out = [];
  for (const b of bx) {
    if (!b.key) continue;
    const l = out.at(-1);
    if (l && l.row === b.row && l.end === b.i - 1) { const a = Math.min(l.x, b.x), z = Math.max(l.x + l.width, b.x + b.width); l.x = a; l.width = z - a; l.end = b.i; l.words.push(b.i); }
    else out.push({ x: b.x, y: b.y, width: b.width, row: b.row, start: b.i, end: b.i, words: [b.i] });
  }
  return out;
}

// A word set like a transcription: a short lift into place with a quick fade (p), and a straight drop out (q).
export function set(c, p, q, size) {
  if (p <= 0 || q >= 1) return false;
  const e = E(p), o = I(q);
  c.globalAlpha *= clamp(p * 2.5) * (1 - o); c.translate(0, (1 - e) * size * 0.22 + o * size * 0.25);
}

// The highlight on the decisive words: an accent band wiped from the reading side, a little lower than the letters' middle, like
// a marker over a printed line. Text on it takes `onAccent`. p: 0..1 of the wipe.
export function highlight(ctx, r, size, p, P, rtl) {
  const w = (r.width + size * 0.16) * clamp(p); if (w <= 0) return;
  const x0 = r.x - size * 0.08, x = rtl ? x0 + r.width + size * 0.16 - w : x0;
  ctx.fillStyle = P.accent; ctx.fillRect(x, r.y - size * 0.6, w, size * 1.22);
}
// A ring drawn along its circumference (p), with four short ticks outside it once it is closed.
export function ring(ctx, x, y, r, p, color, lw = 3) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p)); ctx.stroke();
  const k = clamp((p - 0.8) * 5);
  if (k > 0) for (let a = 0; a < 4; a++) { const u = a * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(u) * (r + 6), y + Math.sin(u) * (r + 6)); ctx.lineTo(x + Math.cos(u) * (r + 6 + 14 * k), y + Math.sin(u) * (r + 6 + 14 * k)); ctx.stroke(); }
  ctx.restore();
}
// A leader: a thin line drawn from a to b through an elbow (vertical first), p: how much is drawn.
export function leader(ctx, ax, ay, bx, by, p, color, lw = 2) {
  if (p <= 0) return;
  const l1 = Math.abs(by - ay), l2 = Math.abs(bx - ax), L = (l1 + l2) * clamp(p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(ax, ay);
  if (L <= l1) ctx.lineTo(ax, ay + Math.sign(by - ay) * L); else { ctx.lineTo(ax, by); ctx.lineTo(ax + Math.sign(bx - ax) * (L - l1), by); }
  ctx.stroke(); ctx.restore();
}
// Corner brackets around a box (evidence that is confirmed). p grows them from the corners.
export function brackets(ctx, x, y, w, h, p, color, len = 26, lw = 3) {
  if (p <= 0) return; const l = len * clamp(p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.moveTo(cx + sx * l, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * l); }
  ctx.stroke(); ctx.restore();
}
// A timecode as mono text (decoration: it is never something the viewer must read).
export const tc = (s, fps = 25) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s) % 60, f = Math.floor((s % 1) * fps); return [h, m, x, f].map((v) => String(v).padStart(2, '0')).join(':'); };
export function code(ctx, str, x, y, { mono, size = 24, color, align = 'left', weight = 500 }) {
  ctx.save(); ctx.font = `${weight} ${size}px "${mono}"`; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = align; ctx.fillText(str, x, y); ctx.restore();
}

// ---------- the footage stand-in: a still street at night from a fixed camera, in greys of the two brand inks ----------
// Built once. Returns { base, noise: [3 canvases], walk(u) -> { x, y, s } } where walk is the path of the one moving figure.
export function footage(w, h, P, seed) {
  const r = rng(seed), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), t = (k) => mix(P.desk, P.ink, k);
  const vx = w * 0.56, vy = h * 0.38;                       // the vanishing point
  const sky = g.createLinearGradient(0, 0, 0, vy); sky.addColorStop(0, t(0.05)); sky.addColorStop(1, t(0.16));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = t(0.2); g.fillRect(0, vy, w, h - vy);
  // the road and pavements converge on the vanishing point
  const road = (a, b, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(vx, vy); g.lineTo(a, h); g.lineTo(b, h); g.closePath(); g.fill(); };
  road(-w * 0.2, w * 1.25, t(0.26)); road(w * 0.08, w * 1.0, t(0.13));
  g.strokeStyle = t(0.4); g.lineWidth = 3; g.setLineDash([22, 26]); g.beginPath(); g.moveTo(vx, vy); g.lineTo(w * 0.54, h); g.stroke(); g.setLineDash([]);
  // buildings on both sides, their faces in perspective, a few windows lit
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const u0 = k / 6, u1 = (k + 1) / 6, ex = side < 0 ? 0 : w;
      const xA = vx + (ex - vx) * (1 - u0) ** 1.6, xB = vx + (ex - vx) * (1 - u1) ** 1.6;
      const top = (x) => vy - (Math.abs(x - vx) / Math.abs(ex - vx)) * h * (0.55 + 0.25 * r());
      const bot = (x) => vy + (Math.abs(x - vx) / Math.abs(ex - vx)) * h * 0.62;
      const tone = 0.08 + r() * 0.1;
      g.fillStyle = t(tone); g.beginPath(); g.moveTo(xA, top(xA)); g.lineTo(xB, top(xB) + 4); g.lineTo(xB, bot(xB)); g.lineTo(xA, bot(xA)); g.closePath(); g.fill();
      for (let n = 0; n < 7; n++) if (r() < 0.32) {
        const fx = xA + (xB - xA) * (0.2 + r() * 0.6), fy = top(fx) + (bot(fx) - top(fx)) * (0.15 + r() * 0.5), sz = Math.abs(xB - xA) * 0.08 + 2;
        g.fillStyle = t(0.45 + r() * 0.3); g.fillRect(fx, fy, sz, sz * 1.4);
      }
    }
  }
  // a street lamp and its pool of light
  const lx = w * 0.3, ly = h * 0.12;
  g.fillStyle = t(0.1); g.fillRect(lx - 3, ly, 6, h * 0.62);
  const pool = g.createRadialGradient(lx, h * 0.78, 0, lx, h * 0.78, w * 0.28); pool.addColorStop(0, rgba(P.ink, 0.16)); pool.addColorStop(1, rgba(P.ink, 0));
  g.fillStyle = pool; g.fillRect(0, 0, w, h);
  g.fillStyle = t(0.85); g.beginPath(); g.arc(lx, ly, 7, 0, Math.PI * 2); g.fill();
  // vignette of an old sensor
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75); v.addColorStop(0, rgba(P.desk, 0)); v.addColorStop(1, rgba(P.desk, 0.55));
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  const noise = [0, 1, 2].map((k) => {
    const n = document.createElement('canvas'); n.width = w; n.height = h; const ng = n.getContext('2d'), rr = rng(seed * 7 + k);
    for (let i = 0; i < w * h / 90; i++) { ng.fillStyle = rgba(rr() < 0.5 ? P.ink : P.desk, 0.05 + rr() * 0.07); ng.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1); }
    for (let y = 0; y < h; y += 4) { ng.fillStyle = rgba(P.desk, 0.12); ng.fillRect(0, y, w, 1); }
    return n;
  });
  const walk = (u) => { const q = clamp(u); return { x: vx + (w * 0.74 - vx) * q ** 1.3, y: vy + (h * 0.86 - vy) * q ** 1.3, s: 0.15 + 0.85 * q ** 1.3 }; };
  return { base: cv, noise, walk, w, h };
}
// Draws the footage into a frame at (x, y), scaled to fit width fw. u: where the figure is along its walk; tick: which noise plate.
// zoom > 1 pushes in on (zx, zy) in footage pixels.
export function playFootage(ctx, F, x, y, fw, u, tick, P, zoom = 1, zx = 0, zy = 0) {
  const k = fw / F.w, fh = F.h * k;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, fw, fh); ctx.clip();
  ctx.translate(x, y); ctx.scale(k, k);
  if (zoom !== 1) { ctx.translate(zx, zy); ctx.scale(zoom, zoom); ctx.translate(-zx, -zy); }
  ctx.drawImage(F.base, 0, 0);
  const f = F.walk(u), s = f.s * 70;                      // the figure: a dark upright shape with a head, and its shadow
  ctx.fillStyle = rgba('#000000', 0.25); ctx.beginPath(); ctx.ellipse(f.x + s * 0.2, f.y, s * 0.28, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = mix(P.desk, P.ink, 0.04); const sw = Math.sin(u * 40) * s * 0.06;
  ctx.fillRect(f.x - s * 0.13 + sw, f.y - s * 0.45, s * 0.1, s * 0.45); ctx.fillRect(f.x + 0.03 * s - sw, f.y - s * 0.45, s * 0.1, s * 0.45);
  ctx.beginPath(); ctx.roundRect(f.x - s * 0.17, f.y - s * 0.95, s * 0.34, s * 0.55, s * 0.08); ctx.fill();
  ctx.beginPath(); ctx.arc(f.x, f.y - s * 1.07, s * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(F.noise[((tick % 3) + 3) % 3], 0, 0);
  ctx.restore();
  return { x: x + (zoom !== 1 ? (zx + (f.x - zx) * zoom) : f.x) * k, y: y + (zoom !== 1 ? (zy + (f.y - s * 0.55 - zy) * zoom) : f.y - s * 0.55) * k, r: s * 0.75 * k * zoom };
}
