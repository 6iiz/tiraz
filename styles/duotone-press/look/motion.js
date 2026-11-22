// Duotone-press motion and materials. A scene is a print pulled from a press: a sheet of the brand's light colour on a dark press
// bed, a continuous-tone photograph printed in two inks (the brand's dark colour in the shadows, its accent in the middle tones, the
// paper itself in the highlights), and type in the dark ink. The signature move is the peel: a covering sheet is lifted off the
// print from the reading side's top corner along a straight fold, its pale back curling over, and everything under the fold is
// printed. Words appear whole as the fold passes them. No discs, no dot screens, no misregistration: tone is continuous.
// The photographs are made here, from seeded formulas (a landscape, a still life, a colonnade, a sea), once per scene.
import { clamp, mix, contrast, rng, span, ease } from '/engine/kit.js';

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const readable = (fg, k, against, min = 4.6) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < min) { k = Math.max(0, k - 0.04); c = mix(fg, against, k); } return c; };

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, night = paper === text ? bg : text;
  // the darkest accent mix that still lets paper-coloured type read on it: the "shadow duotone" for key words and knockouts
  let k = 0.62, deep = mix(night, accent, k);
  while (k > 0 && contrast(deep, paper) < 4.8) { k -= 0.04; deep = mix(night, accent, Math.max(0, k)); }
  return {
    paper, night, accent, ink: night, deep, deepK: Math.max(0, k),
    grey: readable(night, T.tone.grey, paper),
    back: mix(paper, night, T.tone.back),                 // the back of the lifted sheet
    rule: mix(paper, night, 0.22),
  };
}

// Tone curves: 0..1 lightness -> colour. rich: dark ink, accent, paper. pale: an under-inked proof. shadow: dark ink to `deep` only.
export function luts(P, T) {
  const N = 256, mk = (f) => { const a = new Uint8ClampedArray(N * 3); for (let i = 0; i < N; i++) { const c = hex(f(i / (N - 1))); a.set(c, i * 3); } return a; };
  const rich = (l) => (l < 0.5 ? mix(P.night, P.accent, ease.inOutQuad(l / 0.5)) : mix(P.accent, P.paper, ease.inQuad((l - 0.5) / 0.5)));
  return {
    rich: mk(rich),
    pale: mk((l) => mix(rich(l), P.paper, T.tone.pale)),
    shadow: mk((l) => mix(P.night, P.accent, P.deepK * clamp(l * 1.1))),
  };
}

// A photograph as lightness values (0..1), w x h, from a seeded formula. kind: land | still | columns | sea.
export function photo(kind, w, h, seed) {
  const r = rng(seed), L = new Float32Array(w * h), ph = Array.from({ length: 16 }, () => r() * Math.PI * 2);
  const ridge = (u, k) => 0.5 * Math.sin(u * 5.1 * k + ph[k]) + 0.3 * Math.sin(u * 13.7 + ph[k + 4]) + 0.2 * Math.sin(u * 31 + ph[k + 8]);
  const m = Math.min(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h; let l;
    if (kind === 'land') {
      const sx = 0.68, sy = 0.3, d2 = ((x - sx * w) ** 2 + (y - sy * h) ** 2) / (m * m);
      l = 0.5 + 0.38 * v + 0.35 * Math.exp(-d2 / 0.03) + (d2 < 0.006 ? 1 : 0);
      for (let k = 1; k <= 3; k++) {
        const top = 0.42 + 0.14 * k + 0.07 * ridge(u, k);
        if (v > top) l = 0.72 - 0.2 * k + 0.16 * Math.exp(-(v - top) / 0.05) + 0.04 * Math.sin(u * 40 + v * 9 + ph[k]);
      }
    } else if (kind === 'still') {
      const vig = ((u - 0.5) ** 2 + (v - 0.45) ** 2);
      l = v > 0.7 ? 0.52 + 0.4 * (v - 0.7) : 0.62 - 0.3 * v - 0.5 * vig;
      const cx = 0.36 * w, cy = 0.56 * h, R = 0.26 * m, dx = (x - cx) / R, dy = (y - cy) / R, rr = dx * dx + dy * dy;
      const shx = (x - cx - R * 0.9) / (R * 1.3), shy = (y - (cy + R * 0.9)) / (R * 0.3);
      if (v > 0.7 && shx * shx + shy * shy < 1) l *= 0.45 + 0.55 * (shx * shx + shy * shy);
      if (rr < 1) { const nz = Math.sqrt(1 - rr), dot = Math.max(0, -0.55 * dx - 0.6 * dy + 0.58 * nz); l = 0.06 + 0.8 * dot + 0.5 * dot ** 24; }
      const ux = 0.72 * w, hw = 0.12 * w, ct = 0.42 * h, cb = 0.78 * h;
      if (Math.abs(x - ux) < hw && y > ct && y < cb) { const a = (x - ux) / hw; l = 0.1 + 0.75 * Math.max(0, Math.cos(a * 1.5 + 0.7)) ** 1.4; }
      if (((x - ux) / hw) ** 2 + ((y - ct) / (0.035 * h)) ** 2 < 1) l = 0.85 - 0.3 * Math.abs((x - ux) / hw);
    } else if (kind === 'columns') {
      const p = 0.17, cu = ((u + 0.03) % p) / p, inCol = cu < 0.55;
      l = 0.14 + 0.25 * v;
      if (inCol) { const a = cu / 0.55 * 2 - 1; l = 0.12 + 0.82 * Math.max(0, Math.cos(a * 1.45 + 0.55)) ** 1.2; }
      if (v < 0.13) l = 0.78 - 0.5 * v;
      if (v > 0.86) { const sh = (((u - (v - 0.86) * 0.9) + 0.03) % p) / p < 0.55; l = sh ? 0.66 : 0.3; }
    } else {                                                           // sea
      const hz = 0.46, sx = 0.32;
      if (v < hz) { const d2 = ((u - sx) * w) ** 2 / (m * m) + ((v - 0.24) * h) ** 2 / (m * m); l = 0.56 + 0.4 * (v / hz) + 0.3 * Math.exp(-d2 / 0.02) + (d2 < 0.005 ? 1 : 0); }
      else {
        const dv = v - hz, rip = Math.sin(x * 0.11 / (0.3 + dv * 3) + Math.sin(y * 0.21 + ph[1]) * 2 + ph[2]) * Math.sin(y * 0.9 / (0.2 + dv * 2) + ph[3]);
        l = 0.42 + 0.12 * rip - 0.22 * dv;
        const path = Math.exp(-(((u - sx) / (0.05 + dv * 0.25)) ** 2));
        if (rip > 0.55) l += 0.6 * path;
      }
    }
    L[y * w + x] = clamp(l + (r() - 0.5) * 0.07);                     // film grain
  }
  return { L, w, h };
}
// Paints a photograph through a tone curve into a canvas of its own size.
export function print(ph, lut) {
  const cv = document.createElement('canvas'); cv.width = ph.w; cv.height = ph.h;
  const g = cv.getContext('2d'), img = g.createImageData(ph.w, ph.h);
  for (let i = 0; i < ph.L.length; i++) { const k = Math.round(ph.L[i] * 255) * 3; img.data[i * 4] = lut[k]; img.data[i * 4 + 1] = lut[k + 1]; img.data[i * 4 + 2] = lut[k + 2]; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); return cv;
}
// The photograph in its window, pushed in very slowly over the scene (`push` of scale per scene), so a held frame is never dead.
export function framed(ctx, cv, r, push) {
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const s = 1 + push, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cv, cx - (r.w * s) / 2, cy - (r.h * s) / 2, r.w * s, r.h * s); ctx.restore();
}

// ---- the peel. A fold line, perpendicular to `d`, sweeps over a rectangle from its reading-side top corner. pos(p) is how far it
// has gone (in px along d); a point is printed when its projection on d is below it.
export function peel(rect, rtl) {
  const dx = rtl ? -0.58 : 0.58, dy = 0.81, ox = rtl ? rect.x + rect.w : rect.x, oy = rect.y;
  const proj = (x, y) => (x - ox) * dx + (y - oy) * dy;
  const corners = [[rect.x, rect.y], [rect.x + rect.w, rect.y], [rect.x + rect.w, rect.y + rect.h], [rect.x, rect.y + rect.h]];
  const len = Math.max(...corners.map(([x, y]) => proj(x, y)));
  const clipPoly = (s) => {                                          // the rectangle cut by the half-plane proj < s
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4], pa = proj(...a) - s, pb = proj(...b) - s;
      if (pa <= 0) out.push(a);
      if ((pa < 0) !== (pb < 0)) { const k = pa / (pa - pb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
    }
    return out;
  };
  return {
    len, proj,
    // the printed part as a clip
    clip(ctx, s) { const P = clipPoly(s); ctx.beginPath(); if (!P.length) { ctx.rect(0, 0, 0, 0); return; } ctx.moveTo(...P[0]); for (const q of P.slice(1)) ctx.lineTo(...q); ctx.closePath(); ctx.clip(); },
    // the lifted flap: the printed part mirrored over the fold, limited to the rectangle and to a curl width
    flap(ctx, s, back, curl = 260) {
      if (s <= 0 || s >= len) return;
      const P = clipPoly(s).map(([x, y]) => { const k = proj(x, y) - s; return [x - 2 * k * dx, y - 2 * k * dy]; });
      if (P.length < 3) return;
      ctx.save(); ctx.beginPath(); ctx.rect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4); ctx.clip();
      const P2 = clipPoly(s + curl);                                   // only the band just past the fold shows the curl
      ctx.beginPath(); ctx.moveTo(...P2[0]); for (const q of P2.slice(1)) ctx.lineTo(...q); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(...P[0]); for (const q of P.slice(1)) ctx.lineTo(...q); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 26; ctx.shadowOffsetX = dx * 10; ctx.shadowOffsetY = dy * 10;
      ctx.fillStyle = back; ctx.fill(); ctx.restore();
    },
  };
}
// Progress of a pull: the fold's position at time t for a pull starting at t0 lasting dur.
export const pull = (pl, t, t0, dur) => pl.len * ease.inOutCubic(span(t, t0, t0 + dur)) * 1.0001;
// When the fold reaches a point.
export function reach(pl, t0, dur, x, y) {
  const target = clamp(pl.proj(x, y) / pl.len); let lo = 0, hi = 1;
  for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (ease.inOutCubic(m) < target) lo = m; else hi = m; }
  return t0 + dur * hi;
}

// Where drawText puts each word (same arithmetic), and runs of neighbouring key words on one row.
export function layout(kit, f, x0, x1, y, align = 'start') {
  const rtl = kit.rtl, words = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; words.push({ key: w.key, x: wl, y: yy, width: w.width, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return words;
}
export function runs(words) {
  const out = [];
  words.forEach((w, i) => {
    if (!w.key) return; const last = out.at(-1);
    if (last && last.end === i - 1 && last.row === w.row) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.end = i; }
    else out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, start: i, end: i });
  });
  return out;
}
// Type printed by a pull: each word appears whole (setting in `set` s) once the fold has passed its middle. A key run is knocked out
// in paper from one strip of the shadow-duotone photograph. o: { x0, x1, y, align, color, t, pl, t0, dur, P, T, shadow (canvas) }.
export function press(ctx, kit, f, o) {
  const words = layout(kit, f, o.x0, o.x1, o.y, o.align ?? 'start'), P = o.P;
  const when = words.map((w) => reach(o.pl, o.t0, o.dur, w.x + w.width / 2, w.y));
  for (const run of runs(words)) {
    const a = span(o.t, when[run.start], when[run.start] + o.T.dur.set); if (a <= 0) continue;
    const lead = f.size * 0.3, tail = Math.min(f.size * 0.16, f.space * 0.45), rtl = kit.rtl;
    const x = run.x0 - (rtl ? tail : lead), w = run.x1 - run.x0 + lead + tail, y = run.y - f.size * 0.66, h = f.size * 1.32;
    ctx.save(); ctx.globalAlpha *= a;
    if (o.shadow) { const sw = o.shadow.width, sh = o.shadow.height, k = Math.min(1, sh / h * 0.9); ctx.drawImage(o.shadow, (sw - w * k) * 0.5 * ((run.start * 0.37) % 1 + 0.2), (sh - h * k) / 2, w * k, h * k, x, y, w, h); }
    else { ctx.fillStyle = P.deep; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }
  kit.drawText(ctx, f, { x0: o.x0, x1: o.x1, y: o.y, align: o.align ?? 'start', color: o.color ?? P.ink, key: P.paper,
    each: (w, i, box, c) => { const a = span(o.t, when[i], when[i] + o.T.dur.set); if (a <= 0) return false; if (a < 1) c.globalAlpha *= a; } });
}
// Wrapped text with even rows.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o); if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 12; w > o.maxW * 0.4; w -= 12) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g;
  }
  return best;
}
