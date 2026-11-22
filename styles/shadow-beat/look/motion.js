// Shadow-beat motion: poses, not tweens. Things hit their place on the beat and hold; a snap takes three frames at most (a 6% swell
// that settles), and between beats nothing drifts. On the key beat the figures freeze while the sky keeps moving. Leaving is a drop
// below the horizon: the block sinks and is clipped by the waterline.
import { clamp, mix, contrast } from '/engine/kit.js';

// The brand's colours as a sunset: ink is the darker of bg/text (every silhouette and every word); the sky is the accent lifted towards
// the lighter colour until ink on it reads at tokens.sky.contrast or better, so text on the sky is safe for any brand.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const [paper, ink] = lightOf(bg) >= lightOf(text) ? [bg, text] : [text, bg];
  let k = 0, sky = accent;
  while (contrast(ink, sky) < T.sky.contrast && k < 1) { k += 0.04; sky = mix(accent, paper, k); }
  const sun = mix(paper, accent, 0.1), low = mix(sky, paper, T.sky.glow);
  return {
    paper, ink, accent, sky, sun, low,
    top: mix(accent, ink, T.sky.top),
    water: mix(accent, ink, 0.3), deep: mix(accent, ink, 0.62),
    dim: mix(ink, sky, 0.38),
  };
}

// A snap: 0 before t0; a 6% swell that settles within `len`. Returns the scale (0 = not yet there).
export function snap(t, t0, len = 0.05) {
  if (t < t0) return 0;
  const p = clamp((t - t0) / len);
  return 1 + 0.06 * (1 - p);
}
// Sinking out: 0..1 -> how far below its place the block has dropped (accelerating).
export const sink = (p) => clamp(p) ** 2.2;

export function keyRuns(kit, f, { x0, x1, y, align = 'start' }) {
  const rtl = kit.rtl, out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (run) { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); } else run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index }; }
      else if (run) { out.push(run); run = null; }
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
    if (run) out.push(run);
  });
  return out;
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  const split = (g) => keyRuns(kit, g, { x0: 0, x1: o.maxW, y: 0 }).length, n = split(f);
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    if (split(g) > n) continue;
    best = g;
  }
  return best;
}
// The key slab: one solid ink shape under a whole key run; its words are then set in the sun's colour (light inside the silhouette).
export function slab(ctx, run, f, ink, s = 1) {
  if (s <= 0) return;
  const h = f.size * 1.34, px = Math.min(f.size * 0.2, f.space * 0.42), x = run.x0 - px, w = run.x1 - run.x0 + px * 2, y = run.y - h / 2 + f.size * 0.03;
  ctx.save(); ctx.translate(x + w / 2, run.y); ctx.scale(s, s); ctx.translate(-(x + w / 2), -run.y);
  ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.restore();
}
