// Bulletin motion: a television news package. Graphics do not drift or bounce: they are switched in. Words arrive as a whole block
// that flips up on a hinge at its lower edge (a roll of the strap), and leave by folding up into their top edge. Tabs and highlight
// chips wipe in from the reading side; the accent plate of the sting crosses the frame on a slant. This file also holds what the parts
// share: the palette, the slanted plate, the lower-third strap, and the "picture" (procedural stand-ins for news footage).
import { clamp, ease, mix, rgba, rng, contrast, span, SAFE } from '/engine/kit.js';

export const Q = ease.outQuart;                       // a switch: fast out, settles exactly
export const I = ease.inQuad;                         // folding away
export const S = ease.inOutCubic;                     // the sting's crossing

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The studio wall is the brand's lighter colour, every card and strap its darker one; the accent is the channel colour (tabs, plates,
// highlight chips). What is written on the accent is whichever of the two reads better on it.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [ink, paper] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const on = (f) => (contrast(f, ink) >= contrast(f, paper) ? ink : paper);
  return {
    ink, paper, accent, on, onAccent: on(accent),
    dot: mix(paper, ink, T.tone.dot), dotLo: mix(paper, ink, T.tone.dotLo),
    raise: mix(ink, paper, T.tone.raise), rule: mix(ink, paper, T.tone.rule),
    muted: mix(paper, ink, T.tone.muted),             // a quieter text on ink
  };
}

// A slanted plate: a parallelogram whose far side leans by `slant`.
export function plate(ctx, x, y, w, h, slant) {
  ctx.beginPath(); ctx.moveTo(x + slant, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - slant, y + h); ctx.lineTo(x, y + h); ctx.closePath();
}

// The flip: draw() runs with the block unfolding from its lower edge (pin 0 → 1) and folding into its top edge (pout 0 → 1).
// A shade of ink passes over the block while it is turned, so it reads as a roll and not as a squash.
export function flip(ctx, pin, pout, y0, y1, draw, shade) {
  if (pin <= 0 || pout >= 1) return;
  const a = Q(pin), b = I(pout);
  ctx.save();
  if (a < 1) { ctx.translate(0, y1); ctx.scale(1, Math.max(0.001, a)); ctx.translate(0, -y1); }
  if (b > 0) { ctx.translate(0, y0); ctx.scale(1, Math.max(0.001, 1 - b)); ctx.translate(0, -y0); }
  draw();
  const k = Math.max(1 - a, b);
  if (shade && k > 0.02) { ctx.fillStyle = rgba(shade, 0.55 * k); ctx.fillRect(0, y0, 1080, y1 - y0); }
  ctx.restore();
}

// The lower third: a tab of the accent on the reading side (the story's category: a lead-in, a handle, or empty), and under it the
// ink strap that carries the headline, with the brand's logo on a raised block at its far end.
export function strap({ kit, brand, P, T, tab, text, y }) {
  const rtl = kit.rtl, St = T.strap, Tb = T.tab;
  const h = text ? Math.max(St.min, text.height + St.pad) : St.min;
  const y0 = y ?? St.y, y1 = y0 + h, ty0 = y0 - 8 - Tb.h;
  const ex0 = rtl ? SAFE.left : SAFE.right - St.end;
  const tx0 = rtl ? SAFE.left + St.end + 30 : SAFE.left + 36, tx1 = rtl ? SAFE.right - 36 : SAFE.right - St.end - 30;
  const tabW = tab ? Math.min(SAFE.right - SAFE.left, tab.width + 64 + Tb.slant) : 150;
  return {
    h, y0, y1, tx0, tx1,
    draw(ctx, { bar = 1, pTab = 1, pText = 1, pKey = 1, out = 0 }) {
      const fold = I(out);
      // the bar itself
      if (bar > 0 && fold < 1) {
        ctx.save();
        const k = Q(bar) * (1 - fold); ctx.translate(0, y0); ctx.scale(1, Math.max(0.001, k)); ctx.translate(0, -y0);
        ctx.fillStyle = P.ink; ctx.fillRect(SAFE.left, y0, SAFE.right - SAFE.left, h);
        ctx.fillStyle = P.raise; ctx.fillRect(ex0, y0, St.end, h);
        const ls = Math.min(64, St.end - 40); brand.logo.draw(ctx, ex0 + (St.end - ls) / 2, y0 + (h - ls) / 2, ls, P.paper);
        ctx.fillStyle = P.accent; ctx.fillRect(SAFE.left, y1 - 6, SAFE.right - SAFE.left, 6);
        ctx.restore();
      }
      // the tab
      const pt = Q(pTab) * (1 - fold);
      if (pt > 0) {
        const w = tabW * pt, x = rtl ? SAFE.right - w : SAFE.left;
        ctx.save(); ctx.fillStyle = P.accent;
        if (rtl) plate(ctx, x, ty0, w, Tb.h, Math.min(Tb.slant, w)); else { ctx.save(); ctx.translate(2 * x + w, 0); ctx.scale(-1, 1); plate(ctx, x, ty0, w, Tb.h, Math.min(Tb.slant, w)); ctx.restore(); }
        ctx.fill(); ctx.clip();
        if (tab) kit.drawText(ctx, tab, { x0: SAFE.left, x1: SAFE.right, y: ty0 + Tb.h / 2 + 2, align: 'start', color: P.onAccent, key: P.onAccent,
          each: (w2, i, box, c) => { c.translate(rtl ? -32 : 32, 0); } });
        ctx.restore();
      }
      // the headline, rolled in on the strap
      if (text && bar > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(SAFE.left, y0, SAFE.right - SAFE.left, h - 6); ctx.clip();
        flip(ctx, pText, out, y0, y1, () => {
          kit.drawText(ctx, text, { x0: tx0, x1: tx1, y: y0 + (h - 6 - text.height) / 2 + text.lead / 2, align: 'start', color: P.paper, key: P.paper,
            each: (w2, i, box, c) => {
              if (!w2.key || pKey <= 0) return;
              const pad = text.size * 0.16, full = box.width + pad * 2, kw = full * Q(pKey);
              c.fillStyle = P.accent; c.fillRect(rtl ? box.x + box.width + pad - kw : box.x - pad, box.y - text.size * 0.62, kw, text.size * 1.24);
              return pKey > 0.45 ? P.onAccent : P.paper;
            } });
        }, P.ink);
        ctx.restore();
      }
    },
  };
}

// ---------- the picture: procedural stand-ins for news footage, built once per scene ----------
export function noise(seed) {
  const r = rng(seed), N = 64, tab = Float32Array.from({ length: N * N }, () => r());
  const h = (i, j) => tab[(((j % N) + N) % N) * N + (((i % N) + N) % N)], s = (u) => u * u * (3 - 2 * u);
  const v = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = s(x - xi), w = s(y - yi), a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w; };
  return (x, y) => (v(x, y) * 0.6 + v(x * 2.1 + 17, y * 2.1 + 5) * 0.3 + v(x * 4.3 + 3, y * 4.3 + 11) * 0.1);
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function sprite(color, r) {
  const [c, g] = canvas(r * 2, r * 2), gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.55, rgba(color, 0.55)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
}

// A skyline at night, three layers of blocks sliding at different speeds (a slow pan from a helicopter).
function city(P, w, h, seed) {
  const r = rng(seed), layers = [], X = 700;
  for (let L = 0; L < 3; L++) {
    const [cv, g] = canvas(w + X, h);
    const col = mix(P.ink, P.paper, [0.17, 0.1, 0.035][L]);
    for (let x = -20; x < w + X;) {
      const bw = 46 + r() * (60 + L * 40), bh = h * (0.28 + L * 0.06) + r() * h * (0.36 - L * 0.08), top = h - bh;
      g.fillStyle = col; g.fillRect(x, top, bw, bh);
      if (r() < 0.3) g.fillRect(x + bw * 0.4, top - 30 - r() * 40, 4, 40);       // a mast
      if (L > 0) for (let wy = top + 14; wy < h - 12; wy += 17) for (let wx = x + 9; wx < x + bw - 12; wx += 15) {
        const q = r(); if (q > 0.3) continue;
        g.fillStyle = q < 0.012 ? P.accent : rgba(P.paper, (0.18 + r() * 0.5) * (L === 2 ? 1 : 0.6)); g.fillRect(wx, wy, 6, 8);
      }
      x += bw + 3 + r() * 12;
    }
    layers.push(cv);
  }
  const off = r() * 200;
  return (ctx, x0, y0, t) => {
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, mix(P.ink, P.paper, 0.02)); g.addColorStop(0.75, mix(P.ink, P.paper, 0.2)); g.addColorStop(1, mix(P.ink, P.accent, 0.25));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    layers.forEach((cv, L) => ctx.drawImage(cv, x0 - off - t * (5 + L * 9), y0));
  };
}
// A map of the place: land as a pixel field, a route drawn along it in the accent, a pin that pulses, a slow push in.
function map(P, w, h, seed) {
  const r = rng(seed), n = noise(seed + 7), M = 120, [cv, g] = canvas(w + M * 2, h + M * 2);
  g.fillStyle = mix(P.ink, P.paper, 0.05); g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < cv.height; y += 9) for (let x = 0; x < cv.width; x += 9) {
    const v = n(x * 0.0065 + seed, y * 0.0065);
    if (v > 0.5) { g.fillStyle = mix(P.ink, P.paper, v > 0.62 ? 0.3 : 0.22); g.fillRect(x, y, 8, 8); }
    else if ((x / 9 + y / 9) % 4 === 0) { g.fillStyle = mix(P.ink, P.paper, 0.1); g.fillRect(x + 3, y + 3, 2, 2); }
  }
  const pts = []; for (let i = 0; i < 5; i++) pts.push([w * (0.12 + i * 0.19) + (r() - 0.5) * 60, h * (0.3 + r() * 0.45)]);
  return (ctx, x0, y0, t) => {
    const z = 1 + 0.012 * t, cx = x0 + w / 2, cy = y0 + h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(cv, x0 - M, y0 - M);
    const p = span(t, 0.2, 2.2) * (pts.length - 1);
    ctx.strokeStyle = P.accent; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + pts[0][0], y0 + pts[0][1]);
    for (let i = 1; i <= Math.ceil(p) && i < pts.length; i++) { const f = Math.min(1, p - (i - 1)); ctx.lineTo(x0 + pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y0 + pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); }
    ctx.stroke();
    const end = pts[Math.min(pts.length - 1, Math.floor(p + 0.0001))], pulse = (t * 1.2) % 1;
    ctx.strokeStyle = rgba(P.accent, 1 - pulse); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x0 + end[0], y0 + end[1], 14 + pulse * 40, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(x0 + end[0], y0 + end[1], 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}
// A street at night, out of focus: soft lights drifting, and the light trails of traffic crossing on two lanes.
function street(P, w, h, seed) {
  const r = rng(seed), soft = sprite(P.paper, 64), hot = sprite(P.accent, 64);
  const lights = Array.from({ length: 30 }, () => ({ x: r() * (w + 300), y: h * (0.1 + r() * 0.55), s: 30 + r() * 90, a: 0.08 + r() * 0.22, hot: r() < 0.18, v: 4 + r() * 10 }));
  const trails = Array.from({ length: 14 }, (_, i) => ({ lane: i % 2, x: r() * (w + 600), len: 80 + r() * 200, v: 160 + r() * 140, hot: r() < 0.35 }));
  return (ctx, x0, y0, t) => {
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, mix(P.ink, P.paper, 0.04)); g.addColorStop(1, mix(P.ink, P.paper, 0.13));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    for (const l of lights) { ctx.globalAlpha = l.a; const x = x0 + ((l.x - t * l.v) % (w + 300) + (w + 300)) % (w + 300) - 150; ctx.drawImage(l.hot ? hot : soft, x - l.s / 2, y0 + l.y - l.s / 2, l.s, l.s); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = mix(P.ink, P.paper, 0.08); ctx.fillRect(x0, y0 + h * 0.74, w, h * 0.26);
    for (const tr of trails) {
      const y = y0 + h * (tr.lane ? 0.86 : 0.79), x = x0 + ((tr.lane ? tr.x + t * tr.v : tr.x - t * tr.v) % (w + 600) + (w + 600)) % (w + 600) - 300;
      ctx.fillStyle = rgba(tr.hot ? P.accent : P.paper, tr.hot ? 0.75 : 0.5); ctx.fillRect(x, y, tr.len, 4);
    }
  };
}
const KINDS = [city, map, street];
// The picture panel: a framed screen above the lower third. kind: 0 city, 1 map, 2 street (or any number: chosen from it).
export function picture(P, T, W, kind) {
  const x = SAFE.left, y = T.panel.y, w = SAFE.right - SAFE.left, h = T.panel.h;
  const shot = KINDS[((kind % 3) + 3) % 3](P, w, h, 1000 + kind * 37);
  return {
    x, y, w, h,
    draw(ctx, t, inner) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      if (inner) inner(ctx); else shot(ctx, x, y, t);
      ctx.restore();
      ctx.fillStyle = P.accent; ctx.fillRect(x, y, w, 8);
    },
  };
}
