// Ghost Overlay motion and materials. The medium is a double exposure: a dark silhouette works as a window that holds a second
// picture (a landscape printed only inside the shape), on pale paper. Two rules move everything:
//   register: whatever arrives is first two exposures, a faint ghost and a fuller copy offset from each other, that slide into one;
//   two speeds: a window drifts one way, the picture inside it drifts more slowly the other way, so they slide past each other.
// Things leave by losing register (the copies part and fade). The only colour beyond paper and ink is the accent, used as lamplight.
// This file also builds the landscapes (once, in create) and the silhouettes (smooth closed outlines from a few points).
import { clamp, ease, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = ease.outCubic, IO = ease.inOutCubic, I = ease.inQuad;

// Paper is whichever brand colour is lighter, ink the darker one, so the style is always a pale print whatever the brand.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const L = (c) => contrast(c, '#000000');
  const paper = L(text) >= L(bg) ? text : bg, ink = paper === text ? bg : text;
  const readable = (k) => { let c = mix(ink, paper, k); while (k > 0 && contrast(c, paper) < 4.6) { k -= 0.03; c = mix(ink, paper, Math.max(0, k)); } return c; };
  return {
    paper, ink, accent, grey: readable(T.tone.grey), soft: mix(paper, ink, 0.18), world: mix(paper, ink, T.tone.world),
    lamp: accent, onAccent: contrast(accent, paper) >= contrast(accent, ink) ? paper : ink,
  };
}

// ---------- where fitted words fall (the same arithmetic as kit.drawText), and key words merged into runs ----------
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ i: i++, x: wl, y: yy, width: w.width, row: r, key: w.key });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// A key phrase of several words on one row is one emphasis, not one per word.
export function runs(bx) {
  const out = [];
  for (const b of bx) {
    if (!b.key) continue;
    const last = out.at(-1);
    if (last && last.row === b.row && last.end === b.i - 1) { const x0 = Math.min(last.x, b.x), x1 = Math.max(last.x + last.width, b.x + b.width); last.x = x0; last.width = x1 - x0; last.end = b.i; last.words.push(b.i); }
    else out.push({ x: b.x, y: b.y, width: b.width, row: b.row, start: b.i, end: b.i, words: [b.i] });
  }
  return out;
}

// ---------- register: two exposures slide into one ----------
// p: 0..1 arrival, q: 0..1 departure. Returns where the ghost and the print are ({ dx, dy, a } each), or null when nothing shows.
// At rest the ghost sits exactly under the print, so one sharp image remains.
export function register(p, q, shift, ghostA, dir = 1) {
  if (p <= 0 || q >= 1) return null;
  const e = E(p), o = I(q), gap = (1 - e) * shift + o * shift * 1.3, a = clamp(p * 2.2) * (1 - o);
  return { ghost: { dx: gap * dir, dy: -gap * 0.35, a: ghostA * a }, print: { dx: -gap * dir * 0.45, dy: gap * 0.15, a: clamp(0.25 + e * 0.9) * a } };
}
// The two passes of a fitted text through kit.drawText: the ghost (pass 'ghost') then the print (pass 'print').
// when(i) -> [p, q] for word i. style(w, i, box, c) may recolour the print (return a colour or set c.fillStyle).
export function twice(kit, ctx, f, at, { shift, ghostA, dir = 1, when, style, color, ghostColor, decor = false }) {
  for (const pass of ['ghost', 'print']) {
    kit.drawText(ctx, f, { ...at, color: pass === 'ghost' ? ghostColor : color, key: pass === 'ghost' ? ghostColor : color, decor: decor || pass === 'ghost',
      each: (w, i, box, c) => {
        const [p, q] = when(i), r = register(p, q, shift, ghostA, dir); if (!r) return false;
        const o = r[pass]; if (o.a <= 0.003) return false;
        c.translate(o.dx, o.dy); c.globalAlpha *= o.a;
        if (pass === 'print' && style) return style(w, i, box, c);
      } });
  }
}

// ---------- landscapes (built once) ----------
// A monochrome place: a lifted sky, ridges stepping from pale to dark, a band of pines and a few houses whose windows hold the only
// colour (the accent, as lamplight). `deep` darkens the whole print (for the inside of letters, which must read on paper).
export function landscape(w, h, P, seed, deep = 0) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), r = rng(seed), tone = (k) => mix(P.paper, P.ink, clamp(k + deep * (1 - k)));
  const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, tone(0.22)); sky.addColorStop(0.75, tone(0.36)); sky.addColorStop(1, mix(tone(0.3), P.lamp, 0.25));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(w * 0.62, h * 0.5, 0, w * 0.62, h * 0.5, h * 0.42);
  sun.addColorStop(0, rgba(mix(P.paper, P.lamp, 0.35), 0.55 * (1 - deep * 0.6))); sun.addColorStop(1, rgba(P.paper, 0));
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  const layers = [[0.42, 0.46, 0.16], [0.52, 0.6, 0.12], [0.62, 0.73, 0.1], [0.72, 0.84, 0.08]];
  for (const [base, k, amp] of layers) {
    const f = [r() * 6, r() * 6, r() * 6], s = [1.3 + r(), 3.1 + r() * 2, 7 + r() * 4];
    g.fillStyle = tone(k); g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) {
      const u = x / w * Math.PI * 2;
      g.lineTo(x, h * (base - amp * (0.55 * Math.sin(u * s[0] + f[0]) + 0.3 * Math.sin(u * s[1] + f[1]) + 0.15 * Math.abs(Math.sin(u * s[2] + f[2])))));
    }
    g.lineTo(w, h); g.closePath(); g.fill();
  }
  // houses with lit windows, half hidden by the pines
  const yH = h * 0.8;
  for (let i = 0; i < Math.round(w / 120); i++) {
    const x = r() * w, bw = 40 + r() * 60, bh = 30 + r() * 46;
    g.fillStyle = tone(0.86); g.fillRect(x, yH - bh, bw, bh + h * 0.2);
    g.beginPath(); g.moveTo(x - 6, yH - bh); g.lineTo(x + bw / 2, yH - bh - 26 - r() * 14); g.lineTo(x + bw + 6, yH - bh); g.fill();
    for (let k = 0; k < 3; k++) if (r() < 0.6) {
      const wx = x + 8 + r() * (bw - 22), wy = yH - bh + 8 + r() * (bh - 20);
      const glow = g.createRadialGradient(wx + 4, wy + 5, 0, wx + 4, wy + 5, 26);
      glow.addColorStop(0, rgba(P.lamp, 0.5)); glow.addColorStop(1, rgba(P.lamp, 0));
      g.fillStyle = glow; g.fillRect(wx - 24, wy - 24, 56, 58);
      g.fillStyle = P.lamp; g.fillRect(wx, wy, 8, 10);
    }
  }
  // pines across the foreground
  g.fillStyle = tone(0.94);
  for (let x = -20; x < w + 20; x += 9 + r() * 16) {
    const th = h * (0.06 + r() * 0.1), y0 = h * (0.86 + r() * 0.04), tw = th * 0.32;
    g.beginPath(); g.moveTo(x, y0 - th); g.lineTo(x - tw, y0); g.lineTo(x + tw, y0); g.closePath(); g.fill();
  }
  g.fillRect(0, h * 0.89, w, h * 0.11);
  // the film's grain, in both inks
  for (let i = 0; i < w * h / 260; i++) { g.fillStyle = rgba(r() < 0.5 ? P.paper : P.ink, 0.06 + r() * 0.06); g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
  return cv;
}

// The landscape that fills key letters: a lamp-coloured dusk over dark ridges, so the key phrase reads as the colour of the brand
// and still as a picture.
export function dusk(w, h, P, seed) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), r = rng(seed);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mix(P.lamp, P.ink, 0.35)); sky.addColorStop(0.42, P.lamp); sky.addColorStop(0.6, mix(P.lamp, P.paper, 0.15));
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const [base, k, amp] of [[0.6, 0.5, 0.1], [0.68, 0.75, 0.08], [0.78, 0.95, 0.06]]) {
    const f = [r() * 6, r() * 6], sc = [2 + r() * 2, 6 + r() * 4];
    g.fillStyle = mix(P.lamp, P.ink, k); g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 5) { const u = x / w * Math.PI * 2; g.lineTo(x, h * (base - amp * (0.7 * Math.sin(u * sc[0] + f[0]) + 0.3 * Math.abs(Math.sin(u * sc[1] + f[1]))))); }
    g.lineTo(w, h); g.fill();
  }
  g.fillStyle = P.ink;
  for (let x = 0; x < w; x += 7 + r() * 12) { const th = h * (0.06 + r() * 0.08), y0 = h * 0.86; g.beginPath(); g.moveTo(x, y0 - th); g.lineTo(x - th * 0.3, y0); g.lineTo(x + th * 0.3, y0); g.fill(); }
  g.fillRect(0, h * 0.85, w, h * 0.15);
  return cv;
}

// ---------- silhouettes: closed smooth outlines through a few points (Catmull-Rom), all wound the same way ----------
function smooth(pts, closed = true, steps = 8) {
  const n = pts.length, out = [];
  const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function add(path, poly) {
  let a = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; a += x0 * y1 - x1 * y0; }
  const q = a < 0 ? [...poly].reverse() : poly;
  path.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) path.lineTo(q[i][0], q[i][1]); path.closePath();
}
// A tapered branch along a smoothed polyline: w0 thick at its root, w1 at its tip.
function branch(path, pts, w0, w1) {
  const c = smooth(pts, false, 6), L = [], R = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (c.length - 1))) / 2;
    L.push([p[0] - dy / l * w, p[1] + dx / l * w]); R.push([p[0] + dy / l * w, p[1] - dx / l * w]);
  });
  add(path, [...L, ...R.reverse()]);
}

// A stag's head and neck, facing left, in a box of about ±500. nod: a small turn of the head (radians) for breathing.
export function stag(nod = 0) {
  const p = new Path2D(), c = Math.cos(nod), s = Math.sin(nod), pivot = [120, 160];
  const turn = (pts) => pts.map(([x, y]) => { const dx = x - pivot[0], dy = y - pivot[1]; return y > 420 ? [x, y] : [pivot[0] + dx * c - dy * s, pivot[1] + dx * s + dy * c]; });
  add(p, smooth(turn([[40, 620], [60, 380], [30, 210], [-40, 130], [-150, 104], [-262, 116], [-332, 94], [-338, 46], [-292, 18], [-190, -22], [-100, -86], [-32, -126],
    [30, -136], [92, -186], [150, -222], [168, -176], [132, -118], [116, -92], [210, -10], [300, 200], [420, 620]])));
  const B = (pts, a, b) => branch(p, turn(pts), a, b);
  B([[0, -128], [-24, -250], [-90, -362], [-118, -470]], 40, 12);
  B([[-26, -262], [40, -344], [48, -432]], 26, 10);
  B([[-70, -330], [-160, -372], [-214, -386]], 24, 9);
  B([[-20, -200], [-104, -228], [-150, -262]], 22, 9);
  B([[60, -132], [70, -262], [140, -352], [160, -452]], 38, 12);
  B([[104, -312], [200, -330], [262, -384]], 24, 9);
  B([[72, -220], [150, -232], [214, -276]], 22, 9);
  return p;
}
// A gull seen from the front, wings spread in the classic M, in a box of about ±440. a: the wingbeat, 1 = wings up, -0.6 = down.
export function gull(a = 0) {
  const p = new Path2D(), u = a;
  const R = [[60, -30], [215, -96 * u - 44], [440, 26 - 86 * u], [250, -70 * u + 56], [90, 44], [24, 78]];
  const L = R.map(([x, y]) => [-x, y]).reverse();
  add(p, smooth([[0, -50], ...R, ...L]));
  return p;
}
// A whale in profile, facing left, in a box of about ±650 by ±230. f: the flukes' swing.
export function whale(f = 0) {
  const p = new Path2D();
  add(p, smooth([[-520, 40], [-500, -40], [-380, -120], [-120, -150], [160, -130], [380, -60], [500, -6], [580, -70 + f], [660, -110 + f], [630, -40 + f * 0.6],
    [580, 20], [640, 90 - f * 0.4], [660, 150 - f], [560, 80], [480, 50], [300, 110], [40, 150], [-260, 140], [-460, 100]]));
  add(p, smooth([[-180, 110], [-90, 210], [-20, 250], [-60, 160], [-80, 110]]));
  return p;
}

// Draws a window: `path` placed by (x, y, s, flip), the landscape `tex` printed inside it at screen position (tx, ty), and the
// rim darkened inward so the shape reads as a second exposure, not a sticker. p: 0..1 how far it has risen into place.
export function window(ctx, path, { x, y, s, flip = 1 }, tex, tx, ty, P, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(p * 1.4);
  ctx.translate(x, y + (1 - E(p)) * 120); ctx.scale(s * flip, s);
  ctx.clip(path);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tex, tx, ty); ctx.restore();
  ctx.lineJoin = 'round';
  for (const [lw, a] of [[130, 0.05], [100, 0.05], [74, 0.06], [52, 0.07], [34, 0.08], [18, 0.1], [7, 0.14]]) { ctx.strokeStyle = rgba(P.ink, a); ctx.lineWidth = lw / s; ctx.stroke(path); }
  ctx.restore();
}

// Letters as windows: the key phrase's letters hold a deep (darker) landscape that drifts slower than the words, and a lamp-coloured
// rule runs under each run of key words. keys(...) returns { runs, style(t), rule(ctx, p) } for one fitted text placed at `pos`.
let deepCache = null;
function deepPattern(P) {
  const k = P.paper + P.ink + P.lamp;
  if (!deepCache || deepCache.k !== k) deepCache = { k, pat: document.createElement('canvas').getContext('2d').createPattern(dusk(1400, 420, P, 77), 'repeat') };
  return deepCache.pat;
}
export function keys(kit, f, pos, P, T, dir) {
  const rs = runs(boxes(kit, f, pos)), pat = deepPattern(P);
  return {
    runs: rs,
    style: (t) => (w, i, box, c) => {
      if (!w.key) return;
      const r = rs.find((k) => k.words.includes(i));
      pat.setTransform(new DOMMatrix().translate(r.x - 200 + T.drift.inside * 1.6 * t * dir, r.y - f.size * 0.95).scale(f.size * 1.9 / 420));
      c.fillStyle = pat;
    },
    rule(ctx, p) {
      for (const r of rs) {
        const rw = r.width * clamp(p); if (rw <= 0) continue;
        ctx.fillStyle = P.lamp; ctx.fillRect(kit.rtl ? r.x + r.width - rw : r.x, r.y + f.size * 0.66, rw, Math.max(5, f.size * 0.065));
      }
    },
  };
}
