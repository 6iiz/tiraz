// Stud Builder motion and parts. A tabletop brick film shot a pose at a time: anything a hand moves (a brick, a tile, a word on its
// brick) moves only in held poses on a 12-poses-a-second grid, so it steps instead of gliding; the camera and the room behind keep a
// smooth drift. A brick is set down in four poses (lifted and tilted, lower, nearly down, seated: click), and taken away in four
// poses up and off. This file also holds the palette from the brand's colours, the brick and tile painter (built once per piece on
// its own canvas: studs, a glossy face with a softbox highlight, a top and a side, a contact shadow) and the word layout helpers.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const FPS = 12;
export const Q = (t) => Math.floor(t * FPS + 1e-6) / FPS;          // the pose grid
export const POSE = 1 / FPS;

const lumOf = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lumOf(bg) >= lumOf(text) ? bg : text, dark = light === bg ? text : bg;
  const on = (fill) => (contrast(fill, bg) >= contrast(fill, text) ? bg : text);
  const brick = text;                                  // the common brick contrasts with the desk by construction
  const mid = mix(text, bg, 0.45), plate = mix(mix(accent, dark, 0.55), mix(bg, text, 0.3), 0.35), tile = mix(bg, text, 0.13);
  return { bg, text, accent, light, dark, on, brick, mid, plate, tile, muted: mix(text, bg, 0.3),
    onBrick: on(brick), onAccent: on(accent), onMid: on(mid), onTile: on(tile) };
}

// ---------- the set-down and the take-away ----------
const IN = [[-96, -5], [-46, -2.4], [-12, -0.7], [0, 0]];
const OUT = [[-14, 1.2], [-70, 4], [-190, 8]];
// p: 0..1 across the four poses of the set-down (on the pose grid). Returns { dy, rot } or null before it starts.
export function setDown(t, t0) {
  if (t < t0) return null;
  const k = Math.min(3, Math.floor((t - t0) / POSE + 1e-6)); return { dy: IN[k][0], rot: IN[k][1] };
}
export function takeAway(t, t0) {
  if (t < t0) return { dy: 0, rot: 0 };
  const k = Math.floor((t - t0) / POSE + 1e-6); if (k >= OUT.length) return null; return { dy: OUT[k][0], rot: OUT[k][1] };
}
// Applies a pose around a piece's centre (cx, cy).
export function apply(ctx, pose, cx, cy) {
  ctx.translate(cx, cy + pose.dy); ctx.rotate((pose.rot * Math.PI) / 180); ctx.translate(-cx, -cy);
}
// a set-down followed (at tOut) by a take-away; null when not on the table
export function poseAt(t, t0, tOut) {
  const a = setDown(t, t0); if (!a) return null;
  const b = takeAway(t, tOut); if (!b) return null;
  return { dy: a.dy + b.dy, rot: a.rot + b.rot };
}

// ---------- the painter ----------
// A brick (studs: true) or a smooth tile (studs: false) w x h at its front face, in `color`. Returns { cv, ox, oy }: draw the canvas at
// (x - ox, y - oy) to put the front face's top-left corner at (x, y). Built once; drawn as an image every frame.
export function piece(P, w, h, color, { studs = true, pitch = null, deep = null } = {}) {
  w = Math.max(10, Math.round(w)); h = Math.round(h);
  const pt = pitch ?? Math.min(150, Math.max(46, h / 1.2)), dy = Math.round(deep ?? Math.min(44, pt * 0.3)), dx = Math.round(dy * 0.35);
  const sh = studs ? Math.round(pt * 0.16) : 0, pad = 30;
  const cv = document.createElement('canvas'); cv.width = w + dx + pad * 2; cv.height = h + dy + sh + pad * 2 + 16;
  const g = cv.getContext('2d'), ox = pad, oy = pad + dy + sh;
  const top = mix(color, P.light, 0.26), side = mix(color, P.dark, 0.38), lip = mix(color, P.light, 0.5), low = mix(color, P.dark, 0.22);
  // contact shadow on the desk
  g.save(); g.filter = 'blur(9px)'; g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(ox + 4, oy + h - 8, w + dx * 0.6, 20); g.restore();
  // side and top
  g.fillStyle = side; g.beginPath(); g.moveTo(ox + w, oy); g.lineTo(ox + w + dx, oy - dy); g.lineTo(ox + w + dx, oy + h - dy); g.lineTo(ox + w, oy + h); g.closePath(); g.fill();
  g.fillStyle = top; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + w, oy); g.lineTo(ox + w + dx, oy - dy); g.lineTo(ox + dx, oy - dy); g.closePath(); g.fill();
  // the face: flat colour, a softbox's clean rectangle of light near the top, a bright lip and a darker foot
  g.fillStyle = color; g.fillRect(ox, oy, w, h);
  g.fillStyle = rgba(P.light, 0.16); g.fillRect(ox + Math.min(14, w * 0.05), oy + h * 0.07, w - Math.min(28, w * 0.1), h * 0.17);
  g.fillStyle = lip; g.fillRect(ox, oy, w, 2.5);
  g.fillStyle = low; g.fillRect(ox, oy + h - 4, w, 4);
  g.fillStyle = rgba(P.light, 0.22); g.fillRect(ox, oy, 2, h);
  if (studs) {
    const n = Math.max(1, Math.round(w / pt)), sp = w / n, rx = Math.min(sp, pt) * 0.31, ry = rx * 0.34;
    for (let i = 0; i < n; i++) {
      const cx = ox + sp * (i + 0.5) + dx * 0.5, cy = oy - dy * 0.5;
      g.fillStyle = mix(color, P.dark, 0.18); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.fill();
      g.fillRect(cx - rx, cy - sh, rx * 2, sh);
      g.fillStyle = mix(color, P.light, 0.12); g.fillRect(cx - rx, cy - sh, rx * 0.55, sh);         // the lit flank of the stud
      g.fillStyle = mix(color, P.light, 0.32); g.beginPath(); g.ellipse(cx, cy - sh, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = rgba(P.light, 0.5); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy - sh, rx * 0.72, ry * 0.6, 0, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    }
  }
  return { cv, ox, oy, w, h };
}
export const put = (ctx, pc, x, y) => ctx.drawImage(pc.cv, x - pc.ox, y - pc.oy);

// ---------- words ----------
// Wrapped text with even rows: once a text needs several rows, its box is narrowed (same size) while the row count holds.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.4; w -= 20) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
// Opens the word spaces of a fitted text by `extra` px (as far as maxW allows), so a phrase can sit on its own brick with room.
export function widen(f, extra, maxW) {
  for (const r of f.rows) if (r.words.length > 1) extra = Math.min(extra, (maxW - r.width) / (r.words.length - 1));
  extra = Math.max(0, extra); f.space += extra;
  for (const r of f.rows) r.width += extra * (r.words.length - 1);
  f.width = Math.max(...f.rows.map((r) => r.width));
  return f;
}
export function layout(f, x0, x1, y, rtl, align = 'start') {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start') === rtl ? x1 - row.width : x0;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ i: i++, key: w.key, x: wl, y: yy, width: w.width, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
// Cuts each row into bricks: a run of key words is one brick, the plain words around it another. Each brick reaches halfway into the
// word space beside it, so neighbours touch; the row's ends get `edge` px of padding.
export function bricks(f, boxes, edge) {
  const out = [];
  for (let r = 0; r < f.rows.length; r++) {
    const row = boxes.filter((b) => b.row === r).sort((a, b) => a.x - b.x);
    let cur = null;
    for (const b of row) {
      if (cur && cur.key === !!b.key) { cur.x1 = b.x + b.width; cur.words.push(b.i); }
      else { cur = { row: r, y: b.y, key: !!b.key, x0: b.x, x1: b.x + b.width, words: [b.i] }; out.push(cur); }
    }
    const segs = out.filter((s) => s.row === r);
    segs.forEach((s, k) => {
      s.l = k === 0 ? s.x0 - edge : (segs[k - 1].x1 + s.x0) / 2 + 1;
      s.r = k === segs.length - 1 ? s.x1 + edge : (s.x1 + segs[k + 1].x0) / 2 - 1;
    });
  }
  return out;
}
export { clamp };
