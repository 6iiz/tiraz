// Grid motion: type is the moving thing. Whole rows of giant type travel along their own horizontal track and stop dead on the grid
// (a steep ease-out, no bounce, no fade); they leave by carrying on in the direction they came, accelerating, so the page reflows
// sideways instead of fading. Rows alternate direction, so a stack of rows shears like a train of carriages. This file also holds what
// every grid-motion part shares: the palette (the brand's accent is the ground), where each word of a fitted text stands, the runs of
// key words (one solid ink slab per run, however many words it has), and the ticker of giant tonal type that crawls under the frame.
import { clamp, contrast, mix } from '/engine/kit.js';

export const SNAP = (p) => 1 - (1 - clamp(p)) ** 6;          // arrive: most of the travel in the first fifth, a long dead stop
export const OUT = (p) => clamp(p) ** 2.6;                    // leave: ends at full speed, into the cut

// The accent is the ground. Ink is whichever of the brand's two other colours reads better on it; if neither reaches 4.5:1 the
// ground is pulled toward the other colour until the ink reads.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const ink = contrast(accent, bg) >= contrast(accent, text) ? bg : text, other = ink === bg ? text : bg;
  let ground = accent, k = 0;
  while (contrast(ground, ink) < 4.6 && k < 0.9) { k += 0.04; ground = mix(accent, other, k); }
  return { ground, ink, other, line: mix(ground, ink, 0.15), ghost: mix(ground, ink, 0.11), soft: mix(ground, ink, 0.3) };
}

// Where drawText will put each word: the same arithmetic as kit.drawText, done once in create() so marks can be drawn behind words.
export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const rtl = kit.rtl, out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on one row become one run: one slab for "*لون واحد*", not two.
export function keyRuns(boxes) {
  const runs = []; let cur = null;
  boxes.forEach((b, i) => {
    if (b.key && cur && cur.row === b.row && cur.last === i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = i; }
    else if (b.key) { cur = { row: b.row, y: b.y, x0: b.x, x1: b.x + b.width, last: i }; runs.push(cur); }
    else cur = null;
  });
  return runs;
}

// How far a row is from home along its track. dir: +1 comes in from the left and leaves to the right, -1 the other way.
// Returns null when the row is off the frame.
export function travel(W, p, out, dir) {
  if (p <= 0 || out >= 1) return null;
  return dir * (-(1 - SNAP(p)) * (W + 120) + OUT(out) * (W + 120));
}
// The direction of row r: alternating, the first row coming in from the reading side's far end.
export const rowDir = (r, rtl) => ((r % 2 === 0) === rtl ? 1 : -1);

// A solid ink slab behind a run of key words; the words on it are set in the ground's colour.
export function slab(ctx, run, size, space, ink) {
  const pad = space * 0.6; ctx.fillStyle = ink;
  ctx.fillRect(run.x0 - pad, run.y - size * 0.66, run.x1 - run.x0 + pad * 2, size * 1.3);
}

// Giant tonal type that crawls along the bottom of the frame (under the app's caption, decoration only), always moving.
// f: a text fitted once in create() at tokens.size.ghost with overflow: true.
export function ticker(ctx, kit, f, time, { W, y, color, speed }) {
  const gap = f.size * 0.7, period = f.width + gap, dir = kit.rtl ? -1 : 1;
  const off = (((time * speed * dir) % period) + period) % period;
  for (let x = off - period; x < W; x += period) {
    kit.drawText(ctx, f, { x0: x, x1: x + f.width, y, align: 'start', color, key: color, decor: true });
  }
}
