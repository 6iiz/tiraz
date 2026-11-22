// Slide-lens motion: everything is a matter of focus. A word does not slide or pop: it is out of focus (soft, a little large, faint)
// and the focus is racked onto it until it is sharp. It leaves by drifting out of focus again. Marks on the specimen are made, not
// shown: a ring is traced as an arc around the thing measured, a scale bar grows from its centre, a hairline is drawn along its length.
import { clamp, mix, contrast } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;                 // a word lands in focus
export const S = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };   // the turret, the iris, the stage
export const I = (p) => clamp(p) ** 2;                           // drifting out of focus

// The brand's colours, by role. Glass is the lighter brand colour, the bench the darker one; nothing else is a colour of its own.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lum = (c) => contrast(c, '#000000');
  const [light, dark] = lum(bg) >= lum(text) ? [bg, text] : [text, bg];
  const deepen = (c, toward, against, need) => { for (let k = 0; k <= 1.0001; k += 0.05) { const m = mix(c, toward, k); if (contrast(m, against) >= need) return m; } return toward; };
  const tn = T.tone;
  return {
    glass: light, bench: dark, ink: dark, accent,
    lead: mix(dark, light, tn.lead),
    key: deepen(accent, dark, light, 4.5),                       // key words: the accent, deepened until it reads on the glass
    ring: deepen(accent, dark, light, 2.4),                      // the measuring ring and the marks
    stain: (k) => mix(light, accent, tn.stain * k),
    wall: mix(light, accent, tn.wall),
    nucleus: mix(light, mix(accent, dark, 0.45), tn.nucleus),
    rim: mix(dark, light, tn.rim),
    readout: mix(dark, light, tn.readout),
    onBench: light, benchGrey: mix(dark, light, 0.62),
  };
}

// The focus pull on one word, inside kit.drawText's `each`. pin: 0..1 arriving, pout: 0..1 leaving. Returns false when nothing shows.
export function focus(c, pin, pout, box, size, blurMax) {
  if (pin <= 0 || pout >= 1) return false;
  const a = E(pin), b = I(pout);
  const blur = blurMax * ((1 - a) + b * 0.9);
  c.globalAlpha *= Math.min(1, pin * 5) * (1 - b);
  const s = 1 + 0.08 * (1 - a) + 0.04 * b;
  if (s !== 1) { const cx = box.x + box.width / 2; c.translate(cx, box.y); c.scale(s, s); c.translate(-cx, -box.y); }
  if (blur > 0.4) c.filter = `blur(${blur.toFixed(1)}px)`;
}

// Where the key words of a fitted text sit, merged into one run per row: a multi-word *key phrase* is measured as one thing.
// Mirrors kit.drawText's layout. Returns [{ x0, x1, y, words }].
export function keyRuns(f, { x0, x1, y, align = 'center' }, rtl) {
  const runs = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? (rtl ? x1 - row.width : x0) : (rtl ? x0 : x1 - row.width);
    let cur = rtl ? left + row.width : left, run = null;
    row.words.forEach((w, i) => {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (!run) { run = { x0: wl, x1: wl + w.width, y: yy, first: null, last: null }; runs.push(run); } run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); }
      else run = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    });
  });
  return runs;
}
// The order of each word (0, 1, …) and the index of the last key word, so the ring starts when the phrase is in focus.
export const lastKey = (f) => { let k = -1, i = 0; for (const r of f.rows) for (const w of r.words) { if (w.key) k = i; i++; } return k; };
export const count = (f) => f.rows.reduce((s, r) => s + r.words.length, 0);

// The measuring ring: a pale stain inside, an ellipse traced as one arc from the top, four cardinal ticks once it closes.
export function ring(ctx, cx, cy, rx, ry, p, out, pal) {
  if (p <= 0 || out >= 1) return;
  const k = 1 - I(out), e = S(p);
  ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = pal.stain(1.6); ctx.globalAlpha = k * e * 0.9;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = k; ctx.strokeStyle = pal.ring; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e); ctx.stroke();
  const tk = clamp((p - 0.85) / 0.15);
  if (tk > 0) {
    ctx.lineWidth = 3; ctx.beginPath();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const x = cx + dx * rx, y = cy + dy * ry; ctx.moveTo(x + dx * 6, y + dy * 6); ctx.lineTo(x + dx * (6 + 14 * tk), y + dy * (6 + 14 * tk)); }
    ctx.stroke();
  }
  ctx.restore();
}

// A dimension line under something measured: it grows from its centre, then the end ticks drop.
export function dimension(ctx, xa, xb, y, p, out, color, w = 3) {
  if (p <= 0 || out >= 1) return;
  const e = S(p), cx = (xa + xb) / 2, h = (xb - xa) / 2 * e;
  ctx.save(); ctx.globalAlpha = 1 - I(out); ctx.fillStyle = color;
  ctx.fillRect(cx - h, y - w / 2, h * 2, w);
  const tk = clamp((p - 0.7) / 0.3) * 22;
  if (tk > 0) { ctx.fillRect(cx - h - w / 2, y - tk / 2, w, tk); ctx.fillRect(cx + h - w / 2, y - tk / 2, w, tk); }
  ctx.restore();
}

// kit.fit, then the narrowest width that keeps the same rows and size: a text that needs two rows gets two even rows, not an orphan.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
