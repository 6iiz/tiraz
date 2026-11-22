// Factory-flow motion: a process shown as a factory cut open in elevation. Things arrive the way goods do: words ride in on a belt
// from the reading side and stop at their place; a press comes down and stamps what matters; a crate drops down a pipe and the room it
// reaches starts working (its light comes on). Exits are the shift ending: the room's light goes off and its contents slide on down
// the line. Flat colour, thick outlines, a flat offset shadow, nothing soft.
// This file also holds what the factory parts share: the palette, rooms, plaques, pipes, crates, gears, the press.
import { clamp, ease, mix, rgba, contrast } from '/engine/kit.js';

export const E = ease.outCubic;              // goods coming to rest on the belt
export const S = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };   // the press: in-out
export const I = ease.inQuad;
export const G = (p) => clamp(p) ** 2;       // a crate falling

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The night outside is the darker brand colour; walls and rooms are steps of the lighter colour into it; frames, pipes and the stamp
// are the accent; crates are the accent lifted toward the light colour; plaques are the light colour with dark lettering.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors, tn = T.tone;
  const [night, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const on = (fill) => (contrast(fill, night) >= contrast(fill, light) ? night : light);
  const room = mix(night, light, tn.room), off = mix(night, light, tn.off);
  return { night, light, accent, on, room, off, wall: mix(night, light, tn.wall), line: mix(night, '#000000', 0.35),
    pipe: accent, pipeHi: mix(accent, light, 0.55), crate: mix(accent, light, tn.crate), plaque: light, onPlaque: night,
    onAccent: on(accent), dim: mix(light, room, tn.dim), steel: mix(night, light, tn.steel), shadow: 'rgba(0,0,0,0.38)' };
}

// A filled shape with the factory's thick outline and its flat offset shadow. path(ctx) builds the path.
export function shape(ctx, path, fill, P, lw = 6, shadow = 10) {
  if (shadow) { ctx.save(); ctx.translate(shadow, shadow); path(ctx); ctx.fillStyle = P.shadow; ctx.fill(); ctx.restore(); }
  path(ctx); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = P.line; ctx.lineJoin = 'round'; ctx.stroke(); }
}
export const rectPath = (x, y, w, h, r = 0) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

// A room: a cut-away chamber with a coloured frame. lit (0..1): its light comes on (the interior lifts from `off` to `room`).
export function room(ctx, x0, y0, x1, y1, P, lit = 1, frame = P.accent, fw = 12) {
  shape(ctx, rectPath(x0 - fw, y0 - fw, x1 - x0 + 2 * fw, y1 - y0 + 2 * fw, 4), frame, P, 5, 12);
  ctx.fillStyle = mix(P.off, P.room, clamp(lit)); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = rgba(P.light, 0.05 * lit); ctx.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.35);       // a lamp's pool under the ceiling
  ctx.lineWidth = 3; ctx.strokeStyle = P.line; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
}
// A plaque: a light plate with dark lettering, bolted at the corners.
export function plaque(ctx, x0, y0, x1, y1, P) {
  shape(ctx, rectPath(x0, y0, x1 - x0, y1 - y0, 6), P.plaque, P, 4, 6);
  ctx.fillStyle = P.line; for (const [x, y] of [[x0 + 12, y0 + 12], [x1 - 12, y0 + 12], [x0 + 12, y1 - 12], [x1 - 12, y1 - 12]]) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
}
// A pipe along a polyline: a thick accent tube with a highlight stripe and a dark outline.
export function pipe(ctx, pts, P, w = 34, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); };
  ctx.translate(8, 8); path(); ctx.strokeStyle = P.shadow; ctx.lineWidth = w + 10; ctx.stroke(); ctx.translate(-8, -8);
  path(); ctx.strokeStyle = P.line; ctx.lineWidth = w + 10; ctx.stroke();
  ctx.strokeStyle = P.pipe; ctx.lineWidth = w; ctx.stroke();
  ctx.translate(-w * 0.18, -w * 0.18); path(); ctx.strokeStyle = rgba(P.pipeHi, 0.7); ctx.lineWidth = w * 0.18; ctx.stroke();
  ctx.restore();
}
// A crate: a small box of goods with a cross brace.
export function crate(ctx, x, y, s, P) {
  shape(ctx, rectPath(x - s / 2, y - s / 2, s, s, 3), P.crate, P, 4, 6);
  ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s / 2 + 6, y - s / 2 + 6); ctx.lineTo(x + s / 2 - 6, y + s / 2 - 6);
  ctx.moveTo(x + s / 2 - 6, y - s / 2 + 6); ctx.lineTo(x - s / 2 + 6, y + s / 2 - 6); ctx.stroke();
}
// A gear turned by `a` radians.
export function gear(ctx, x, y, r, a, fill, P, teeth = 10) {
  const path = (c) => {
    c.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = a + (i / (teeth * 2)) * Math.PI * 2, a1 = a + ((i + 1) / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.8 : r;
      c.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); c.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
    }
    c.closePath();
  };
  shape(ctx, path, fill, P, 4, 6);
  ctx.fillStyle = P.line; ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, Math.PI * 2); ctx.fill();
}
// A belt: a dark band with rollers that turn with the belt's travel `s` (px).
export function belt(ctx, x0, x1, y, P, s = 0, h = 22) {
  shape(ctx, rectPath(x0, y - h / 2, x1 - x0, h, h / 2), P.steel, P, 4, 6);
  ctx.strokeStyle = P.line; ctx.lineWidth = 2;
  const gap = 40, off = ((s % gap) + gap) % gap;
  for (let x = x0 + h / 2 + off; x < x1 - h / 2; x += gap) { ctx.beginPath(); ctx.moveTo(x, y - h / 2 + 4); ctx.lineTo(x - 8, y + h / 2 - 4); ctx.stroke(); }
}
// The press: a piston from the ceiling at y0 with a stamping plate; p 0..1 is down and back up (the plate touches at p = 0.5).
export function press(ctx, x, y0, yHit, w, p, P) {
  if (p <= 0 || p >= 1) return;
  const q = p < 0.5 ? S(p * 2) : 1 - S((p - 0.5) * 2), y = y0 + (yHit - y0) * q;
  ctx.fillStyle = P.steel; ctx.fillRect(x - 10, y0, 20, y - y0 - 20);
  ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.strokeRect(x - 10, y0, 20, y - y0 - 20);
  shape(ctx, rectPath(x - w / 2, y - 26, w, 26, 3), P.steel, P, 4, 0);
}

export function boxes(kit, f, o) {
  const out = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, each: (w, i, b) => { out.push({ ...b, key: w.key, i }); return false; } });
  return out;
}
// A word riding in on the belt from the reading side: it slides `run` px and comes to rest, uncovered from a clip at `edge` (the
// room's reading-side wall). Leaving, it rides on toward the far side and is cut off by the far wall.
export function ride(ctx, p, box, size, rtl, run, edge0, edge1, out = 0) {
  if (p <= 0 || out >= 1) return false;
  const e = E(p), o = I(out), dx = (rtl ? 1 : -1) * ((1 - e) * run) - (rtl ? 1 : -1) * o * run * 1.6;
  ctx.beginPath(); ctx.rect(Math.min(edge0, edge1), box.y - size, Math.abs(edge1 - edge0), size * 2); ctx.clip();
  ctx.translate(dx, 0);
}
// The stamp's label: an accent plate behind a key word, set when the press hits.
export function label(ctx, b, size, P, p = 1) {
  if (p <= 0) return; const s = 1 + 0.12 * (1 - E(Math.min(1, p * 2)));
  const w = b.width + size * 0.4, h = size * 1.24;
  ctx.save(); ctx.translate(b.x + b.width / 2, b.y); ctx.scale(s, s);
  shape(ctx, rectPath(-w / 2, -h / 2 - size * 0.04, w, h, 6), P.accent, P, 4, 6); ctx.restore();
}

// Key words next to each other on one row share one backing: their boxes merged per row.
export function spans(bs) {
  const rows = new Map();
  for (const b of bs) { const r = rows.get(b.row); if (!r) rows.set(b.row, { ...b }); else { const x0 = Math.min(r.x, b.x), x1 = Math.max(r.x + r.width, b.x + b.width); r.x = x0; r.width = x1 - x0; } }
  return [...rows.values()];
}
