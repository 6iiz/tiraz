// Iso-facts motion and drawing kit. The style is a working diagram: a little world on a floating board, and data panels that are
// pinned to it. Its one gesture is the pin-pop: a leader line shoots up from a spot on the board, and at its tip a panel pops open,
// a short soft scale from its pin with no bounce. Words then settle into the panel from just below. Things on the board grow up out
// of their footprint; vehicles drive at a steady pace; nothing tilts or rotates the projection.
// This file also holds the palette (three flat tones per colour, all mixed from the brand's three colours), the projection and the
// shapes every part shares: blocks, trees, vehicles, panels, pins and the key-phrase marker.
import { clamp, ease, mix, contrast, rgba } from '/engine/kit.js';

export const E = ease.outCubic;
export const Q = (p) => 1 - (1 - clamp(p)) ** 5;          // the panel pop: most of it at once, a long soft tail
export const OUT = (p) => clamp(p) ** 2.6;                 // leaving: accelerate away
export const C30 = Math.cos(Math.PI / 6);
// Board coordinates (x, y, z) -> screen. +x goes down and right, +y down and left, +z straight up.
export const project = (ox, oy, u) => (x, y, z = 0) => [ox + (x - y) * C30 * u, oy + (x + y) * 0.5 * u - z * u];

const lum = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const card = light, ground = mix(light, dark, 0.07);
  const readable = (k, against = card) => { let c = mix(dark, against, k); while (k > 0 && contrast(c, against) < 4.6) { k -= 0.04; c = mix(dark, against, Math.max(0, k)); } return c; };
  const three = (base) => ({ top: mix(base, light, 0.34), left: base, right: mix(base, dark, 0.24) });
  const onAccent = contrast(accent, light) >= contrast(accent, dark) ? light : dark;
  // an accent that reads as a line on the card (for pins and rules on a pale accent)
  let line = accent; for (let k = 0.1; contrast(line, card) < 2.2 && k < 0.8; k += 0.1) line = mix(accent, dark, k);
  return {
    light, dark, accent, card, ground, three, onAccent, line,
    ink: dark, muted: readable(0.42), faint: mix(ground, dark, 0.13),
    lawn: three(mix(accent, light, 0.74)), soil: three(mix(dark, light, 0.66)), clay: three(mix(dark, light, 0.52)), rock: three(mix(dark, light, 0.4)),
    road: mix(dark, light, 0.34), roadEdge: mix(dark, light, 0.5), dash: mix(light, accent, 0.2), pave: three(mix(light, dark, 0.13)),
    water: three(mix(accent, light, 0.46)), pipe: mix(accent, dark, 0.15),
    blocks: [mix(light, dark, 0.04), mix(accent, light, 0.5), mix(dark, light, 0.58), accent, mix(accent, dark, 0.3), mix(light, accent, 0.25)].map(three),
    glass: mix(dark, accent, 0.25), crown: three(mix(mix(accent, dark, 0.35), light, 0.2)), trunk: mix(dark, light, 0.35),
    grey: three(mix(dark, light, 0.6)), hot: three(accent),
    shadow: 'rgba(0,0,0,0.12)', rgba,
  };
}

export const poly = (ctx, pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
// A flat-shaded block from (x, y, z) of size w (along x), d (along y), h (up). tones: { top, left, right }. grow 0..1 raises it.
export function block(ctx, P, x, y, z, w, d, h, tones, o = {}) {
  const g = o.grow ?? 1; if (g <= 0) return; const hz = Math.max(0.02, h * g);
  if (o.shade !== false) poly(ctx, [P(x + w, y, z), P(x + w + hz * 0.55, y + hz * 0.25, z), P(x + w + hz * 0.55, y + d + hz * 0.25, z), P(x + w, y + d, z)], 'rgba(0,0,0,0.08)');
  poly(ctx, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + hz), P(x + w, y, z + hz)], tones.right);
  poly(ctx, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + hz), P(x, y + d, z + hz)], tones.left);
  poly(ctx, [P(x, y, z + hz), P(x + w, y, z + hz), P(x + w, y + d, z + hz), P(x, y + d, z + hz)], tones.top);
  if (o.windows && g > 0.5) {                               // rows of windows on both visible faces
    const k = clamp((g - 0.5) / 0.5), fl = Math.floor(h / 0.7);
    for (let f = 0; f < fl; f++) {
      const z0 = z + (0.3 + f * 0.7) * k, z1 = z0 + 0.32 * k; if (z1 > z + hz - 0.15) break;
      for (let a = x + 0.25; a + 0.3 < x + w - 0.1; a += 0.55) poly(ctx, [P(a, y + d, z0), P(a + 0.3, y + d, z0), P(a + 0.3, y + d, z1), P(a, y + d, z1)], o.windows);
      for (let b = y + 0.25; b + 0.3 < y + d - 0.1; b += 0.55) poly(ctx, [P(x + w, b, z0), P(x + w, b + 0.3, z0), P(x + w, b + 0.3, z1), P(x + w, b, z1)], o.windows);
    }
  }
}
export function tree(ctx, P, x, y, s, pal, grow = 1) {
  if (grow <= 0) return;
  const [bx, by] = P(x, y, 0), u = Math.abs(P(1, 0, 0)[0] - P(0, 0, 0)[0]) / C30, g = grow;
  ctx.fillStyle = pal.shadow; ctx.beginPath(); ctx.ellipse(bx + 8 * s, by + 2, 16 * s, 7 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = pal.trunk; ctx.fillRect(bx - 2.5 * s, by - 18 * s * g, 5 * s, 18 * s * g);
  // a cone of two flat halves, like a paper model
  const top = by - (18 + 44) * s * g, base = by - 14 * s * g, r = 17 * s;
  poly(ctx, [[bx, top], [bx - r, base], [bx, base + 6 * s]], pal.crown.left);
  poly(ctx, [[bx, top], [bx, base + 6 * s], [bx + r, base]], pal.crown.right);
  void u;
}
// A vehicle on the road: dir 'x' or 'y' says which axis it drives along. kind: car, van, bus.
export function vehicle(ctx, P, cx, cy, dir, kind, tones, pal) {
  const L = kind === 'bus' ? 1.9 : kind === 'van' ? 1.35 : 1.0, Wd = kind === 'bus' ? 0.75 : 0.62, h = kind === 'bus' ? 0.7 : kind === 'van' ? 0.62 : 0.36;
  const w = dir === 'x' ? L : Wd, d = dir === 'x' ? Wd : L, x = cx - w / 2, y = cy - d / 2;
  poly(ctx, [P(x + 0.1, y + d + 0.08), P(x + w + 0.18, y + d + 0.08), P(x + w + 0.18, y + 0.1), P(x + w, y)], 'rgba(0,0,0,0.13)');
  block(ctx, P, x, y, 0.1, w, d, h, tones, { shade: false });
  if (kind === 'car') block(ctx, P, x + (dir === 'x' ? w * 0.22 : 0.06), y + (dir === 'y' ? d * 0.22 : 0.06), 0.1 + h, dir === 'x' ? w * 0.5 : w - 0.12, dir === 'y' ? d * 0.5 : d - 0.12, 0.26, { top: tones.top, left: pal.glass, right: pal.glass }, { shade: false });
  else {                                                     // a band of windows
    const z0 = 0.1 + h * 0.5, z1 = 0.1 + h * 0.82;
    if (dir === 'x') poly(ctx, [P(x + 0.1, y + d, z0), P(x + w - 0.1, y + d, z0), P(x + w - 0.1, y + d, z1), P(x + 0.1, y + d, z1)], pal.glass);
    else poly(ctx, [P(x + w, y + 0.1, z0), P(x + w, y + d - 0.1, z0), P(x + w, y + d - 0.1, z1), P(x + w, y + 0.1, z1)], pal.glass);
  }
}
// The panel: a flat card with a hard offset shadow and a short accent tab at its reading-side top corner.
export function panel(ctx, x0, y0, x1, y1, pal, rtl, o = {}) {
  const r = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.roundRect(x0 + 12, y0 + 16, x1 - x0, y1 - y0, r); ctx.fill();
  ctx.fillStyle = o.fill ?? pal.card; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r); ctx.fill();
  if (o.tab !== false) { ctx.fillStyle = o.tabColor ?? pal.accent; ctx.beginPath(); ctx.roundRect(rtl ? x1 - 34 - 86 : x0 + 34, y0 + 18, 86, 9, 4.5); ctx.fill(); }
}
// Pop a panel open from its pin (px, py): scale from 0.86 and a quick fade. p 0..1; returns false when nothing shows.
export function pop(ctx, p, px, py) {
  if (p <= 0) return false;
  if (p >= 1) return true;
  const s = 0.86 + 0.14 * Q(p);
  ctx.globalAlpha *= clamp(p * 3); ctx.translate(px, py); ctx.scale(s, s); ctx.translate(-px, -py);
  return true;
}
// The leader: from the pin on the board up to the panel, drawn upward (p 0..1), with a ring around the pin.
export function leader(ctx, from, to, p, pal) {
  if (p <= 0) return;
  const [ax, ay] = from, [bx, by] = to, q = E(p);
  ctx.strokeStyle = pal.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * q, ay + (by - ay) * q); ctx.stroke();
  ctx.fillStyle = pal.card; ctx.beginPath(); ctx.arc(ax, ay, 9, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(ax, ay, 4.5, 0, 7); ctx.fill();
}
// Words settle into a panel from just below.
export function settle(ctx, p, box) {
  if (p <= 0) return false;
  if (p >= 1) return;
  ctx.globalAlpha *= clamp(p * 2.5); ctx.translate(0, (1 - E(p)) * 26); void box;
}
// The key phrase: one rounded marker under the whole run (several words make one marker), growing from the reading side.
export function marker(ctx, run, size, p, pal, rtl) {
  if (p <= 0) return;
  const pad = size * 0.11, x0 = run.x0 - pad, x1 = run.x1 + pad, w = (x1 - x0) * E(p), h = size * 1.18;
  ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.roundRect(rtl ? x1 - w : x0, run.y - h * 0.52, w, h, h * 0.28); ctx.fill();
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
      if (w.key) { if (!run) { run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index }; out.push(run); } else { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); } }
      else run = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
  });
  return out;
}
export const words = (f) => f.rows.reduce((s, r) => s + r.words.length, 0);
// A stagger that fits n words into `room` seconds.
export const stagger = (n, step, len, room) => (n <= 1 ? 0 : Math.min(step, Math.max(0.02, (room - len) / (n - 1))));
// A small numbered badge (a pin head) for the list.
export function badge(ctx, x, y, r, n, pal, mono, on = true) {
  ctx.fillStyle = on ? pal.accent : pal.card; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = pal.ink; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = on ? pal.onAccent : pal.ink; ctx.font = `700 ${Math.round(r * 1.05)}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
  ctx.fillText(String(n), x, y + 1);
}
