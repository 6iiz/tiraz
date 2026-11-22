// Parts Apart motion and model. One axis only: parts lift straight up off each other, top part first, with an even gap, and come back
// down onto each other when a scene closes. The object is a layered device faked in 2D: each layer is a flat plate drawn once to its own
// canvas (its top face, with its details), then laid on the frame through one affine transform per height (an oblique view that turns
// slowly), with its thickness built from a few stacked silhouettes. No 3D engine, no per-pixel work per frame.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

// Lifts are smooth both ways (a part leaves its seat slowly, travels, settles); text arrives with a soft landing.
export const E = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };
export const soft = (p) => 1 - (1 - clamp(p)) ** 3;

// The studio is always the brand's darker colour; type is the lighter one. The key colour is the accent, lifted toward the light
// colour only as far as it takes to read on the dark ground.
export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const dark = lum(c.bg) <= lum(c.text) ? c.bg : c.text, light = dark === c.bg ? c.text : c.bg;
  let key = c.accent; for (let k = 0.1; contrast(key, dark) < 4.5 && k <= 1.001; k += 0.1) key = mix(c.accent, light, k);
  const onAccent = contrast(dark, c.accent) >= contrast(light, c.accent) ? dark : light;
  return {
    dark, light, accent: c.accent, key, onAccent,
    grey: mix(light, dark, 0.42), wire: mix(light, dark, 0.3),
    plate: (k) => mix(dark, light, k), side: mix(dark, light, 0.06), sideLow: mix(dark, '#000000', 0.25),
  };
}

// Word boxes exactly as kit.drawText lays them out, and the runs of key words that sit together on one row (a key phrase is one mark).
export function boxes(kit, f, x0, x1, y, align = 'start') {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
export function keyRuns(bx) {
  const runs = []; let cur = null;
  bx.forEach((b, i) => {
    if (b.key && cur && cur.row === b.row && cur.last === i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = i; }
    else if (b.key) { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, first: i, last: i }; runs.push(cur); }
    else cur = null;
  });
  return runs;
}

// The key mark: a callout bracket under a key run, drawn out from the reading side (p 0..1).
export function bracket(ctx, run, size, color, p, rtl) {
  if (p <= 0) return;
  const y = run.y + size * 0.68, w = (run.x1 - run.x0 + 12) * clamp(p), x = rtl ? run.x1 + 6 - w : run.x0 - 6;
  ctx.save(); ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 4);
  const tk = size * 0.16 * clamp(p * 2 - 1);
  if (tk > 0) { ctx.fillRect(run.x0 - 6, y - tk, 4, tk + 4); ctx.fillRect(run.x1 + 2, y - tk, 4, tk + 4); }
  ctx.restore();
}

// A leader: a dot on the part, a thin line through the given points, a small ring at the end. p draws it along its length.
export function leader(ctx, pts, p, color, dot) {
  if (p <= 0) return;
  const segs = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); total += l; }
  let left = total * clamp(p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let end = pts[0];
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / (segs[i - 1] || 1)); end = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    ctx.lineTo(end[0], end[1]); left -= segs[i - 1];
  }
  ctx.stroke();
  ctx.fillStyle = dot ?? color; ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(end[0], end[1], 4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ---------- the device ----------
const PLATE = { base: { inset: 0, thick: 30 }, cell: { inset: 46, thick: 22 }, board: { inset: 26, thick: 12 }, frame: { inset: 12, thick: 16 }, lid: { inset: 4, thick: 14 } };
export function kindsFor(n) {
  const mids = ['board', 'cell', 'frame'];
  if (n <= 1) return ['lid'];
  const out = ['base']; for (let i = 0; i < n - 2; i++) out.push(mids[i % 3]); out.push('lid'); return out;
}

// makeDevice: layers bottom to top. accentLayer: the index of a layer drawn as the accent part (or -1). chip: give the board one accent
// chip, the part a key word points at. U x V is the base plate in model units.
export function makeDevice(pal, { kinds = ['base', 'cell', 'board', 'frame', 'lid'], accentLayer = -1, chip = true, U = 540, V = 340, seed = 11, logo = null } = {}) {
  const R = rng(seed);
  const layers = kinds.map((kind, i) => {
    const def = PLATE[kind], u = U - def.inset * 2, v = V - def.inset * 2, rad = Math.max(14, 34 - def.inset * 0.3);
    const acc = i === accentLayer;
    const path = new Path2D(); path.roundRect(-u / 2, -v / 2, u, v, rad);
    if (kind === 'frame') path.roundRect(-u / 2 + 54, -v / 2 + 46, u - 108, v - 92, 18);
    const pad = 4, cv = document.createElement('canvas'); cv.width = Math.ceil(u + pad * 2); cv.height = Math.ceil(v + pad * 2);
    const g = cv.getContext('2d'); g.translate(cv.width / 2, cv.height / 2);
    const top = acc ? mix(pal.accent, pal.dark, 0.08) : pal.plate(kind === 'cell' ? 0.3 : kind === 'board' ? 0.19 : kind === 'lid' ? 0.15 : 0.23);
    const hi = acc ? mix(pal.accent, pal.light, 0.35) : pal.plate(0.36), lo = acc ? mix(pal.accent, pal.dark, 0.35) : pal.plate(0.09);
    // the face: lit from the back left, a little darker toward the viewer
    const grad = g.createLinearGradient(-u / 2, -v / 2, u / 2, v / 2); grad.addColorStop(0, mix(top, pal.light, 0.08)); grad.addColorStop(1, mix(top, pal.dark, 0.18));
    g.fillStyle = grad; g.fill(path, 'evenodd');
    g.save(); g.clip(path, 'evenodd');
    let chipAt = null;
    if (kind === 'base') {
      g.fillStyle = lo; g.beginPath(); g.roundRect(-u / 2 + 24, -v / 2 + 24, u - 48, v - 48, 20); g.fill();
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.fillStyle = hi; g.beginPath(); g.arc(sx * (u / 2 - 44), sy * (v / 2 - 44), 13, 0, Math.PI * 2); g.fill();
        g.fillStyle = pal.dark; g.beginPath(); g.arc(sx * (u / 2 - 44), sy * (v / 2 - 44), 5, 0, Math.PI * 2); g.fill();
      }
    } else if (kind === 'cell') {
      g.fillStyle = lo; g.fillRect(-u / 2, -v * 0.1, u, v * 0.2);
      g.fillStyle = hi; g.fillRect(u / 2 - 40, -v * 0.28, 16, v * 0.56); g.fillRect(-u / 2 + 30, -v / 2 + 26, u * 0.3, 10); g.fillRect(-u / 2 + 30, -v / 2 + 46, u * 0.18, 10);
    } else if (kind === 'board') {
      g.strokeStyle = acc ? hi : pal.plate(0.34); g.lineWidth = 2.5; g.lineCap = 'round';
      for (let k = 0; k < 16; k++) {
        let x = (R() - 0.5) * u * 0.9, y = (R() - 0.5) * v * 0.9; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 3; s++) { if (s % 2) y += (R() - 0.5) * v * 0.5; else x += (R() - 0.5) * u * 0.5; g.lineTo(x, y); }
        g.stroke(); g.fillStyle = hi; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill();
      }
      const chips = [[-150, -60, 110, 80], [-160, 70, 70, 50], [150, 80, 90, 56], [40, 95, 60, 40], [170, -90, 60, 40]];
      for (const [cx, cy, w, h] of chips) {
        g.fillStyle = pal.plate(0.04); g.fillRect(cx - w / 2, cy - h / 2, w, h);
        g.fillStyle = pal.plate(0.4); for (let k = 0; k < 5; k++) { g.fillRect(cx - w / 2 + (k + 0.5) * w / 5 - 2, cy - h / 2 - 7, 4, 7); g.fillRect(cx - w / 2 + (k + 0.5) * w / 5 - 2, cy + h / 2, 4, 7); }
      }
      if (chip) { chipAt = [30, 55]; g.fillStyle = mix(pal.accent, pal.dark, 0.3); g.fillRect(chipAt[0] - 52, chipAt[1] - 40, 104, 80); g.fillStyle = pal.accent; g.fillRect(chipAt[0] - 46, chipAt[1] - 46, 92, 76); }
    } else if (kind === 'frame') {
      g.fillStyle = lo; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(sx * (u / 2 - 26), sy * (v / 2 - 23), 7, 0, Math.PI * 2); g.fill(); }
    } else if (kind === 'lid') {
      g.fillStyle = rgba(pal.light, 0.07); g.beginPath(); g.moveTo(-u / 2, v * 0.1); g.lineTo(-u * 0.15, -v / 2); g.lineTo(u * 0.05, -v / 2); g.lineTo(-u * 0.3, v / 2); g.lineTo(-u / 2, v / 2); g.fill();
      g.strokeStyle = rgba(pal.light, 0.14); g.lineWidth = 2; g.beginPath(); g.roundRect(-u / 2 + 20, -v / 2 + 20, u - 40, v - 40, 16); g.stroke();
    }
    g.restore();
    // the cool rim along the back edge, and a hairline round the face
    g.strokeStyle = rgba(pal.light, acc ? 0.5 : 0.22); g.lineWidth = 2; g.stroke(path);
    g.strokeStyle = rgba(pal.light, acc ? 0.75 : 0.55); g.lineWidth = 3; g.beginPath(); g.moveTo(-u / 2 + rad, -v / 2 + 1.5); g.lineTo(u / 2 - rad, -v / 2 + 1.5); g.stroke();
    return { kind, u, v, thick: def.thick, path, tex: cv, chipAt, side: acc ? mix(pal.accent, pal.dark, 0.5) : pal.side, low: acc ? mix(pal.accent, pal.dark, 0.7) : pal.sideLow };
  });
  // seated heights: each layer sits on the one below
  let z = 0; for (const L of layers) { L.seat = z + L.thick; z += L.thick * 0.85; }
  return { layers, U, V, logo };
}

// The view: an oblique look from above that turns by theta. s scales the whole model; (cx, cy) is the floor point under its centre.
export function view(theta, s, cx, cy, k = 0.5) {
  const a = Math.cos(theta) * s, b = Math.sin(theta) * k * s, c = -Math.sin(theta) * s, d = Math.cos(theta) * k * s;
  return { a, b, c, d, cx, cy, s, pt: (u, v, h) => [cx + a * u + c * v, cy - h * s + b * u + d * v] };
}

// Draws the floor shadow and the layers at the given heights (model units above the floor).
export function drawDevice(ctx, dev, P, hs, { logoP = 0, logoColor, alpha = 1, shadow = true } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  if (shadow) { ctx.save(); ctx.transform(P.a, P.b, P.c, P.d, P.cx, P.cy);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, dev.U * 0.62); sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.scale(1, dev.V / dev.U); ctx.beginPath(); ctx.arc(0, 0, dev.U * 0.62, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); }
  dev.layers.forEach((L, i) => {
    const h = hs[i];
    for (let z = h - L.thick, n = 0; z < h; z += 3, n++) {
      ctx.save(); ctx.transform(P.a, P.b, P.c, P.d, P.cx, P.cy - z * P.s); ctx.fillStyle = n === 0 ? L.low : L.side; ctx.fill(L.path, 'evenodd'); ctx.restore();
    }
    ctx.save(); ctx.transform(P.a, P.b, P.c, P.d, P.cx, P.cy - h * P.s); ctx.drawImage(L.tex, -L.tex.width / 2, -L.tex.height / 2);
    if (i === dev.layers.length - 1 && dev.logo && logoP > 0) {
      const sz = Math.min(L.u, L.v) * 0.6 * (1.25 - 0.25 * soft(logoP));
      ctx.globalAlpha = alpha * clamp(logoP * 2); dev.logo.draw(ctx, -sz / 2, -sz / 2, sz, logoColor);
    }
    ctx.restore();
  });
  ctx.restore();
}

// Heights of every layer: seated (0) to apart (1), top layer leaving first. lift(i) may return its own 0..1 per layer instead.
export function heights(dev, gap, lift) {
  const n = dev.layers.length;
  return dev.layers.map((L, i) => L.seat + (i * gap + L.thick - L.seat) * lift(i, n));
}

// A word (or a label) settles onto the frame the way a part is set down: up from a little below, quickly opaque, slowing as it lands.
// It leaves by dropping back a little and going out, as the parts close. Returns false when nothing is to be drawn.
export function settle(c, t, t0, dur, out0, out1) {
  const p = clamp((t - t0) / dur); if (p <= 0) return false;
  const q = out1 > out0 ? clamp((t - out0) / (out1 - out0)) : 0; if (q >= 1) return false;
  c.globalAlpha *= Math.min(1, p * 4) * (1 - q);
  c.translate(0, (1 - soft(p)) * 34 + q * q * 46);
}
