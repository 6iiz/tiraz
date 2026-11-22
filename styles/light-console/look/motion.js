// Light-console motion: everything is projected light that is computed, not placed. A plate (a dark glass panel with a hairline border
// and corner ticks) opens from its middle line; its words resolve one by one under a bright scan bar that crosses each word from the
// reading side; then target brackets fly in from wide and lock onto what matters, and only a locked thing takes the hologram's hue.
// Numbers roll through noise and settle digit by digit. Wireframe subjects grow up from the projector under a scan plane. Things leave
// by collapsing to a line and switching off. This file holds the palette, the 3D wireframe helpers, the plate, the brackets and the
// word scan, shared by every part.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const lift = (c, toward, against, need) => { let k = 0, out = c; while (contrast(out, against) < need && k < 1) { k += 0.04; out = mix(c, toward, Math.min(1, k)); } return out; };

// The stage is the brand's darker colour sunk toward black; the hologram's hue is the accent, lifted toward the light colour until its
// lines read on the stage; `lock` is the hue as text (4.5:1 on a plate); `white` is the light colour, for the words; `hot` is the hue
// pushed toward white, for scan fronts and anything active this instant.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const stage = mix(dark, '#000000', T.tone.stage), plate = mix(stage, dark, 0.5);
  const hue = lift(accent, light, stage, T.tone.need);
  return {
    dark, light, accent, stage, plate, hue,
    lock: lift(hue, light, plate, 4.6), white: lift(light, light, plate, 7),
    soft: lift(mix(plate, light, 0.62), light, plate, 4.6),
    hot: mix(hue, light, T.tone.hot), faint: mix(stage, hue, T.tone.faint), dim: mix(stage, hue, T.tone.dim),
  };
}

export const E = (p) => 1 - (1 - clamp(p)) ** 3;               // a land
export const S = (p) => 1 - (1 - clamp(p)) ** 6;               // a lock: most of the travel at once, a long soft tail
export const I = (p) => clamp(p) ** 2.4;                       // off

// Word boxes exactly as kit.drawText places them (nothing drawn, nothing recorded).
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = [], rtl = kit.rtl;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, key: w.key }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// A word resolving: p 0..1 of its scan. The word shows behind a clip that grows from the reading side, a bright bar rides the front,
// and the word is hot until the scan has passed. Use inside kit.drawText's each(); returns false while nothing shows.
export function resolve(c, p, box, size, pal, rtl) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const w = (box.width + 16) * E(p), x = rtl ? box.x + box.width + 8 - w : box.x - 8;
  c.fillStyle = rgba(pal.hot, 0.85 * (1 - p)); c.fillRect(rtl ? x - 3 : x + w, box.y - size * 0.7, 3, size * 1.4);
  c.beginPath(); c.rect(x, box.y - size * 0.8, w, size * 1.6); c.clip();
  return mix(pal.hot, pal.white, p);
}

// A plate: dark glass, a hairline border in the dim hue, short bright ticks at its corners. open 0..1 opens it from its middle line;
// close 0..1 collapses it back. Returns the clip height factor the contents should use (0 = shut).
export function plate(ctx, x, y, w, h, pal, open, close = 0) {
  const k = E(open) * (1 - I(close)); if (k <= 0.005) return 0;
  const hh = Math.max(2, h * k), yy = y + (h - hh) / 2;
  ctx.save();
  ctx.fillStyle = rgba(pal.plate, 0.82); ctx.fillRect(x, yy, w, hh);
  ctx.strokeStyle = rgba(pal.hue, 0.45); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, yy + 0.5, w - 1, hh - 1);
  const t = Math.min(26, hh / 2); ctx.strokeStyle = pal.hue; ctx.lineWidth = 3; ctx.beginPath();
  for (const [cx, cy, dx, dy] of [[x, yy, 1, 1], [x + w, yy, -1, 1], [x, yy + hh, 1, -1], [x + w, yy + hh, -1, -1]]) { ctx.moveTo(cx + dx * t, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * t); }
  ctx.stroke(); ctx.restore();
  return k;
}

// Target brackets locking onto a box { x0, x1, y0, y1 }: p 0..1 flies them in from wide and turned to tight, then they hold.
export function brackets(ctx, b, p, pal, out = 0) {
  if (p <= 0 || out >= 1) return;
  const e = S(p), spread = (1 - e) * 120 + I(out) * 80, pad = 14 + spread, a = (1 - e) * 0.5;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, hw = (b.x1 - b.x0) / 2 + 5 + spread, hh = (b.y1 - b.y0) / 2 + pad * 0.6, L = Math.min(34, hh * 0.7);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.globalAlpha = clamp(p * 4) * (1 - I(out));
  ctx.lineWidth = 9; ctx.strokeStyle = rgba(pal.hue, 0.22); path(); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = e > 0.97 ? pal.hot : pal.hue; path(); ctx.stroke();
  ctx.restore();
  function path() {
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(sx * hw, sy * (hh - L)); ctx.lineTo(sx * hw, sy * hh); ctx.lineTo(sx * (hw - L), sy * hh); }
  }
}

// A number rolling through noise into its value: digits settle one at a time from the left as p goes from `from` to 1.
export function rolling(str, p, seed) {
  if (p >= 1) return str;
  const r = rng(seed), chars = [...str], n = chars.filter((c) => /[0-9٠-٩]/.test(c)).length;
  let k = 0;
  return chars.map((c) => {
    if (!/[0-9٠-٩]/.test(c)) return c;
    const locked = p > 0.35 + 0.65 * (k / Math.max(1, n)); k++;
    const g = Math.floor(r() * 10);
    if (locked) return c;
    return /[٠-٩]/.test(c) ? '٠١٢٣٤٥٦٧٨٩'[g] : String(g);
  }).join('');
}

// ---- wireframes
// A mesh is { v: [[x,y,z]…], e: [[i,j]…] } in model units (about -1..1).
export const meshes = {
  octa() { const v = [[1, 0, 0], [-1, 0, 0], [0, 1.25, 0], [0, -1.25, 0], [0, 0, 1], [0, 0, -1]]; const e = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (!(i % 2 === 0 && j === i + 1)) e.push([i, j]); return { v, e }; },   // every vertex to all but its opposite
  box(w = 1, h = 1, d = 1, y0 = 0) { const v = []; for (const x of [-w, w]) for (const y of [y0 - h, y0 + h]) for (const z of [-d, d]) v.push([x, y, z]); const e = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const a = v[i], b = v[j]; if ((a[0] !== b[0]) + (a[1] !== b[1]) + (a[2] !== b[2]) === 1) e.push([i, j]); } return { v, e }; },
  rings(n, r = 1, h = 2, seg = 28) { const v = [], e = []; for (let k = 0; k < n; k++) { const y = -h / 2 + (n > 1 ? (h * k) / (n - 1) : 0), b = v.length; for (let s = 0; s < seg; s++) { const a = (s / seg) * Math.PI * 2; v.push([Math.cos(a) * r, y, Math.sin(a) * r]); e.push([b + s, b + ((s + 1) % seg)]); if (k > 0 && s % 4 === 0) e.push([b + s, b - seg + s]); } } return { v, e }; },
  join(...ms) { const v = [], e = []; for (const m of ms) { const b = v.length; v.push(...m.v); e.push(...m.e.map(([i, j]) => [i + b, j + b])); } return { v, e }; },
  move(m, dx, dy, dz) { return { v: m.v.map(([x, y, z]) => [x + dx, y + dy, z + dz]), e: m.e }; },
};
// Draws a mesh turned by yaw `a` and tilted by `b` round (cx, cy) at scale s, with depth fog (near bright, far faint) and a glow pass.
// Only the part above the scan line `scanY` (screen y) is drawn; the scan front itself is a hot line. alpha fades the whole mesh.
export function wire(ctx, m, { cx, cy, s, a, b = 0.35, pal, alpha = 1, scanY = -1e9, hot = 0 }) {
  if (alpha <= 0.01) return;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), f = 4;
  const P = m.v.map(([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb, k = f / (f + z2); return [cx + x1 * s * k, cy - y1 * s * k, z2]; });
  const buckets = [[], [], []];
  for (const [i, j] of m.e) { const z = (P[i][2] + P[j][2]) / 2; buckets[z > 0.4 ? 0 : z > -0.4 ? 1 : 2].push([P[i], P[j]]); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (scanY > -1e8) { ctx.beginPath(); ctx.rect(0, scanY, ctx.canvas.width, ctx.canvas.height); ctx.clip(); }
  const levels = [0.28, 0.6, 1];
  buckets.forEach((edges, k) => {
    if (!edges.length) return;
    ctx.beginPath(); for (const [p, q] of edges) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    ctx.strokeStyle = rgba(pal.hue, 0.16 * levels[k] * alpha); ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = rgba(hot > 0 ? mix(pal.hue, pal.hot, hot) : pal.hue, levels[k] * alpha); ctx.lineWidth = 1.8; ctx.stroke();
  });
  ctx.restore();
  if (scanY > -1e8 && scanY < cy + s * 1.6 && scanY > cy - s * 1.6) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = rgba(pal.hot, 0.25); ctx.fillRect(cx - s * 1.5, scanY - 4, s * 3, 8);
    ctx.fillStyle = pal.hot; ctx.fillRect(cx - s * 1.4, scanY - 1, s * 2.8, 2); ctx.restore();
  }
}
// The scan plane growing a subject from the pad up: the subject shows below scanY, so for p 0..1 scanY climbs from under it to over it.
export const scanFrom = (p, cy, s) => cy + s * 1.5 - E(p) * s * 3.2;
