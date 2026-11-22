// Terrain-story motion. The map is calm and heavy; the data layer is quick and luminous. Words come down out of the sky onto their
// line, as if the camera were settling: each word drops a short way with a slight scale that decays and a brief opacity helper.
// On the way out they lift back into the haze. A key phrase becomes a map callout: one plate of the accent behind the whole phrase,
// with a stem that drops to a lit pillar standing on the terrain. Routes are drawn along their length and then flow.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const outC = (p) => 1 - (1 - clamp(p)) ** 3;
export const settleE = (p) => 1 - (1 - clamp(p)) ** 5;
export const inC = (p) => clamp(p) ** 2.4;

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255); };
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const onAccent = contrast(dark, accent) >= contrast(light, accent) ? dark : light;
  let line = accent;                                        // the accent as a hairline/route on the light map: darkened until it shows
  for (let k = 0; k <= 1.001 && contrast(line, light) < 3; k += 0.05) line = mix(accent, dark, k);
  return { dark, light, accent, onAccent, line, grey: mix(dark, light, 0.42), soft: mix(dark, light, 0.62) };
}

export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++ });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on one row are one phrase: one callout plate.
export function runs(boxes) {
  const rs = []; let cur = null;
  for (const b of boxes) {
    if (!b.key) { cur = null; continue; }
    if (cur && cur.row === b.row && cur.last === b.i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = b.i; cur.n++; }
    else { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, first: b.i, last: b.i, n: 1 }; rs.push(cur); }
  }
  return rs;
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o); if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w, size: f.size, minScale: 1, minPx: 0 });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g;
  }
  return best;
}

// Words drop in from the sky: returns an `each` for kit.drawText. t0: first word, step: gap, dur: each word's fall. out: 0..1 exit.
export function drop(t, t0, step, dur, out = 0, size = 80) {
  return (w, i, box, c) => {
    const p = clamp((t - t0 - i * step) / dur); if (p <= 0 || out >= 1) return false;
    const e = settleE(p), s = 1 + 0.06 * (1 - e), lift = out > 0 ? inC(out) : 0;
    c.globalAlpha *= clamp(p / 0.3) * (1 - lift);
    const cx = box.x + box.width / 2;
    c.translate(cx, box.y - size * 0.45 * (1 - e) - 50 * lift); c.scale(s, s); c.translate(-cx, -box.y);
  };
}

// The callout plate behind a key phrase, opened from its centre. p 0..1.
export function callout(ctx, pal, run, size, space, p) {
  if (p <= 0) return;
  const e = outC(p), px = space * 0.42, cx = (run.x0 + run.x1) / 2, w = (run.x1 - run.x0 + px * 2) * e, y0 = run.y - size * 0.64, h = size * 1.3;
  ctx.fillStyle = pal.accent; ctx.fillRect(cx - w / 2, y0, w, h);
}

// A pillar of light on the terrain: base ring, a luminous shaft of height hgt (px), a cap. Glow = a wide faint underlay.
export function pillar(ctx, pal, base, hgt, a = 1) {
  if (hgt <= 0 || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rgba(pal.accent, 0.18); ctx.fillRect(base.x - 11, base.y - hgt, 22, hgt);
  ctx.fillStyle = pal.accent; ctx.fillRect(base.x - 3.5, base.y - hgt, 7, hgt);
  ctx.fillStyle = rgba(pal.accent, 0.3); ctx.beginPath(); ctx.ellipse(base.x, base.y, 30, 10, 0, 0, 6.283); ctx.fill();
  ctx.strokeStyle = pal.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(base.x, base.y, 18, 6, 0, 0, 6.283); ctx.stroke();
  ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(base.x, base.y - hgt, 5, 0, 6.283); ctx.fill();
  ctx.restore();
}

// A route over the terrain: pts are screen points; drawn along its length up to p, then flowing (dash offset with time).
export function route(ctx, pal, pts, p, time, { width = 5, glow = true, color, dashed = false, alpha = 1 } = {}) {
  if (p <= 0 || pts.length < 2 || alpha <= 0) return;
  const n = Math.max(2, Math.round(pts.length * clamp(p)));
  const path = () => { ctx.beginPath(); for (let i = 0; i < n; i++) (i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y)); };
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = ctx.lineJoin = 'round';
  if (glow) { path(); ctx.strokeStyle = rgba(pal.accent, 0.22); ctx.lineWidth = width * 4; ctx.stroke(); }
  path(); ctx.strokeStyle = color ?? pal.line; ctx.lineWidth = width; if (dashed) ctx.setLineDash([10, 12]); ctx.stroke(); ctx.setLineDash([]);
  if (glow && p >= 1) { path(); ctx.strokeStyle = rgba(pal.light, 0.85); ctx.lineWidth = width * 0.45; ctx.setLineDash([4, 26]); ctx.lineDashOffset = -time * 60; ctx.stroke(); }
  ctx.restore();
}
// Smooth a list of map points into a dense polyline (Catmull-Rom), in map units.
export function spline(P, per = 18) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3))); }
  }
  out.push(P.at(-1)); return out;
}
