// Chart-tale motion and drawing kit. The whole reel is one chart drawn on paper by a pencil, and the camera rides along with the
// pencil. Words are written on, not flown in: each word is uncovered from its reading side, as fast as a hand writes, letters left
// in place. A note grows out of the line: a stem climbs from the point the pencil has just drawn, and the note is written at its top.
// The key phrase is circled by hand: one loose loop around the whole phrase that does not quite close. Exits are an eraser stroke:
// the note fades upward fast. One ease for writing (linear with a soft end), one for growing (out-cubic).
import { clamp, ease, mix, contrast, rgba } from '/engine/kit.js';

export const E = ease.outCubic;
export const OUT = (p) => clamp(p) ** 2.4;
export const W8 = (p) => { p = clamp(p); return p < 0.85 ? p / 0.85 * 0.92 : 0.92 + 0.08 * E((p - 0.85) / 0.15); };   // a hand writing

const lum = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, dark = paper === bg ? text : bg;
  const readable = (k) => { let c = mix(dark, paper, k); while (k > 0 && contrast(c, paper) < 4.6) { k -= 0.04; c = mix(dark, paper, Math.max(0, k)); } return c; };
  let line = accent; for (let k = 0.1; contrast(line, paper) < 2.6 && k < 0.8; k += 0.1) line = mix(accent, dark, k);
  return {
    paper, dark, accent, ink: dark, line, rgba,
    muted: readable(0.45), grid: mix(paper, dark, 0.1), faint: mix(paper, dark, 0.055), area: mix(paper, accent, 0.16),
    keyText: contrast(accent, paper) >= 4.5 ? accent : dark,
    graphite: mix(dark, paper, 0.18), wood: mix(paper, dark, 0.22), body: mix(dark, paper, 0.12), band: accent, onAccent: contrast(accent, paper) >= contrast(accent, dark) ? paper : dark,
  };
}

// A word is written on from its reading side: a clip that opens across it. Use inside kit.drawText's `each`.
export function write(ctx, p, box, size, rtl) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const q = W8(p), w = (box.width + size * 0.3) * q, x = rtl ? box.x + box.width + size * 0.15 - w : box.x - size * 0.15;
  ctx.beginPath(); ctx.rect(x, box.y - size, w, size * 2); ctx.clip();
}
// The eraser: a written note leaves upward and fades.
export function erase(ctx, p) {
  if (p >= 1) return false;
  if (p <= 0) return;
  ctx.globalAlpha *= 1 - OUT(p); ctx.translate(0, -OUT(p) * 30);
}
// The loop round a key phrase: an ellipse drawn on by hand, a little more than a full turn, wobbly and unclosed.
export function loop(ctx, run, size, p, color, seed = 1) {
  if (p <= 0) return;
  const cx = (run.x0 + run.x1) / 2, cy = run.y + size * 0.02, rx = (run.x1 - run.x0) / 2 + size * 0.2, ry = size * 0.64;
  const a0 = -2.3 + seed * 0.3, turn = Math.PI * 2 * 1.1 * E(p), n = Math.max(2, Math.ceil(64 * E(p)));
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(5, size * 0.07); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = a0 + turn * (i / n), k = i / n, wob = 1 + 0.035 * Math.sin(a * 3 + seed) - 0.06 * k * k;
    const x = cx + Math.cos(a) * rx * wob, y = cy + Math.sin(a) * ry * wob - k * size * 0.08;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke(); ctx.restore();
}
// The stem: from a point on the chart up to a note, grown upward (p), with an open ring round the point.
export function stem(ctx, from, toY, p, pal, o = {}) {
  if (p <= 0) return;
  const [x, y] = from, q = E(p), r = o.r ?? 17, y1 = y - r - (y - r - toY) * q;
  ctx.save(); ctx.strokeStyle = o.color ?? pal.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.bezierCurveTo(x + 6, y - r - (y - r - y1) * 0.4, x - 4, y - r - (y - r - y1) * 0.7, x, y1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = o.ring ?? pal.line; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r, -1.2, -1.2 + Math.PI * 1.82 * E(Math.min(1, p * 1.6))); ctx.stroke();
  ctx.restore();
}
// A point on the chart: an ink ring filled with paper, or filled with the accent when it matters.
export function dot(ctx, x, y, r, pal, hot = false) {
  ctx.fillStyle = hot ? pal.accent : pal.paper; ctx.strokeStyle = pal.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
}
export function keyRuns(f, { x0, x1, y, align = 'start' }, rtl) {
  const out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (!run) { run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index, last: index }; out.push(run); } else { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); run.last = index; } }
      else run = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
  });
  return out;
}
export const words = (f) => f.rows.reduce((s, r) => s + r.words.length, 0);
export const stagger = (n, step, len, room) => (n <= 1 ? 0 : Math.min(step, Math.max(0.02, (room - len) / (n - 1))));
