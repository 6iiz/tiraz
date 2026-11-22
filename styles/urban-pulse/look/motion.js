// Urban Pulse motion: a city cut to a beat. Nothing fades in: every word is written by a light trail that passes along its row (the
// head of the trail uncovers the word behind it), and every exit is a second trail that wipes the word away. Key phrases carry one
// long-exposure trail under the whole phrase. The beat (tokens.beat) drives every cut in the ground and the pulse in the mark.
import { clamp, mix, rgba, contrast } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;              // a trail decelerating as it arrives
export const A = (p) => clamp(p) ** 2.4;                      // a trail accelerating away
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// The night is always the darker of the brand's two colours, the lights the lighter one, whichever the brand calls bg.
export function palette(brand, T) {
  const a = brand.colors.bg, b = brand.colors.text, dark = lum(a) <= lum(b) ? a : b, light = dark === a ? b : a;
  let key = brand.colors.accent, k = 0;
  while (contrast(key, dark) < 4 && k < 1) { k += 0.08; key = mix(brand.colors.accent, light, k); }
  return { dark, light, accent: brand.colors.accent, key, grey: mix(dark, light, T.tone.grey), dim: mix(dark, light, T.tone.dim) };
}

// Whichever of the two brand colours reads best on an accent fill.
export const onFill = (pal) => (contrast(pal.accent, pal.dark) >= contrast(pal.accent, pal.light) ? pal.dark : pal.light);

// Where kit.drawText will put each word (same arithmetic), so a phrase can be treated as one thing before it is drawn.
export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, index: index++ });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on one row become one run: one emphasis per phrase, not one per word.
export function runs(words) {
  const out = [];
  for (const w of words) {
    const last = out.at(-1);
    if (w.key && last && last.row === w.row && last.last === w.index - 1) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.last = w.index; }
    else if (w.key) out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, first: w.index, last: w.index });
  }
  return out;
}

// A word written by a passing light: the head runs from the reading side across the word and uncovers it. Call inside `each`.
// Returns false while nothing is uncovered yet.
export function streakIn(ctx, p, box, size, rtl, pal) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const e = E(p), w = box.width + size * 0.3, head = rtl ? box.x + box.width + size * 0.15 - w * e : box.x - size * 0.15 + w * e;
  const y = box.y + size * 0.5, tail = size * 2.2 * (1 - e * 0.6);
  const g = ctx.createLinearGradient(head, 0, head + (rtl ? tail : -tail), 0);
  g.addColorStop(0, rgba(pal.light, 0.95)); g.addColorStop(0.25, rgba(pal.accent, 0.7)); g.addColorStop(1, rgba(pal.accent, 0));
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(Math.min(head, head + (rtl ? tail : -tail)), y - 2.5, tail, 5);
  ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(head, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.beginPath();
  if (rtl) ctx.rect(head, box.y - size, box.x + box.width + size - head, size * 2); else ctx.rect(box.x - size, box.y - size, head - box.x + size, size * 2);
  ctx.clip();
}
// The exit: a second, faster trail runs the same way and the word is gone behind it.
export function streakOut(ctx, p, box, size, rtl, pal) {
  if (p <= 0) return;
  if (p >= 1) return false;
  const e = A(p), w = box.width + size * 0.3, head = rtl ? box.x + box.width + size * 0.15 - w * e : box.x - size * 0.15 + w * e;
  const y = box.y + size * 0.05;
  ctx.save(); ctx.fillStyle = rgba(pal.light, 0.9); ctx.fillRect(head - (rtl ? 0 : size * 0.6), y - 1.5, size * 0.6, 3); ctx.restore();
  ctx.beginPath();
  if (rtl) ctx.rect(box.x - size, box.y - size, head - box.x + size, size * 2); else ctx.rect(head, box.y - size, box.x + box.width + size - head, size * 2);
  ctx.clip();
}

// The emphasis: one long-exposure trail under a whole run, drawn from the reading side to the reading end with a bright head.
export function trail(ctx, run, size, p, rtl, pal, fade = 1) {
  if (p <= 0 || fade <= 0) return;
  const pad = size * 0.25, xs = rtl ? run.x1 + pad * 1.2 : run.x0 - pad * 1.2, xe = rtl ? run.x0 - pad : run.x1 + pad;
  const head = xs + (xe - xs) * E(p), y = run.y + size * 0.6, h = Math.max(6, size * 0.085);
  ctx.save(); ctx.globalAlpha = fade;
  const g = ctx.createLinearGradient(xs, 0, head, 0);
  g.addColorStop(0, rgba(pal.accent, 0)); g.addColorStop(0.35, rgba(pal.accent, 0.95)); g.addColorStop(1, pal.light);
  ctx.shadowColor = rgba(pal.accent, 0.8); ctx.shadowBlur = size * 0.35;
  ctx.fillStyle = g; ctx.fillRect(Math.min(xs, head), y - h / 2, Math.abs(head - xs), h);
  ctx.shadowBlur = 0; ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(head, y, h * 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
