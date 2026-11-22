// History strip: a comic page of paper cut-outs on an old printed map. Things never fade in here; paper is slapped down (it lands
// a touch too big, squashes flat and its shadow snaps in), pinned with a round-headed pin, peeled off at a corner and thrown away.
// The puppets are cut from card and joined with pins, so they move like cut-out animation: their poses change in held steps, a few
// times a second, never smoothly. This file holds the palette, the torn paper scraps, the pins, the balloons and the puppet.
import { clamp, rng, mix, contrast, rgba, ease } from '/engine/kit.js';

export const E = ease.outCubic;
export const IO = ease.inOutCubic;
export const POSE_FPS = 6;

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  let k = 0.55, grey = mix(paper, ink, k); while (contrast(grey, paper) < 4.6 && k < 0.95) { k += 0.05; grey = mix(paper, ink, k); }
  return {
    paper, ink, accent, grey, on, onAccent: on(accent),
    sea: mix(paper, accent, 0.13), land: mix(paper, ink, 0.1), rim: mix(paper, ink, 0.04), ripple: mix(paper, mix(accent, ink, 0.5), 0.42),
    grid: mix(paper, ink, 0.3), caption: mix(paper, accent, 0.1), old: mix(paper, ink, 0.16), table: mix(ink, paper, 0.16),
    limb: mix(accent, ink, 0.3), legs: mix(paper, ink, 0.7), pin: mix(paper, ink, 0.45), pinHi: mix(paper, '#ffffff', 0.6),
  };
}

// A fine paper texture tile (fibres and specks), used over paper pieces.
let TILE = null;
export function tile(P) {
  if (TILE && TILE.key === P.ink) return TILE.cv;
  const cv = document.createElement('canvas'); cv.width = cv.height = 180; const g = cv.getContext('2d'), r = rng(51);
  for (let i = 0; i < 900; i++) { g.fillStyle = rgba(r() < 0.6 ? P.ink : '#ffffff', 0.025 + r() * 0.035); g.fillRect(r() * 180, r() * 180, 1 + r() * 2, 1 + r() * 1.5); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = rgba(P.ink, 0.03); g.lineWidth = 1; g.beginPath(); const x = r() * 180, y = r() * 180; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 10); g.stroke(); }
  TILE = { key: P.ink, cv }; return cv;
}

// A torn rectangle of paper, centred on (0, 0): a closed path with ragged edges, the same for a given seed.
export function torn(w, h, seed = 1, rough = 5) {
  const r = rng(seed), p = new Path2D(), pts = [];
  const edge = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14)); for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + (r() - 0.5) * rough, y0 + (y1 - y0) * u + (r() - 0.5) * rough]); } };
  edge(-w / 2, -h / 2, w / 2, -h / 2); edge(w / 2, -h / 2, w / 2, h / 2); edge(w / 2, h / 2, -w / 2, h / 2); edge(-w / 2, h / 2, -w / 2, -h / 2);
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p;
}
// Lays a paper piece: its shadow (offset, soft black at low alpha), the fill, the paper texture, an optional ink edge.
export function paper(ctx, path, fill, P, { shadow = 1, edge = null, edgeW = 3 } = {}) {
  if (shadow > 0) { ctx.save(); ctx.translate(7 * shadow, 9 * shadow); ctx.fillStyle = rgba('#000000', 0.2); ctx.fill(path); ctx.restore(); }
  ctx.fillStyle = fill; ctx.fill(path);
  ctx.save(); ctx.clip(path); ctx.fillStyle = ctx.createPattern(tile(P), 'repeat'); ctx.fill(path); ctx.restore();
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = edgeW; ctx.stroke(path); }
}
// The slap: a piece lands a little too big and tilted, squashes flat in two frames, its shadow snapping from far to close.
// Returns { s, rot, sh } or null before it starts.
export function slap(p) {
  if (p <= 0) return null;
  const a = clamp(p / 0.55), b = clamp((p - 0.55) / 0.45);
  const s = p < 0.55 ? 1.35 - 0.38 * ease.inQuad(a) : 0.97 + 0.03 * E(b);
  return { s, rot: (1 - a) * 0.06, sh: p < 0.55 ? 2.6 - 1.6 * a : 1 };
}
// Runs draw() with a slap applied around (x, y); draw(sh) gets the shadow distance factor.
export function slapped(ctx, p, x, y, draw) {
  const q = slap(p); if (!q) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot); ctx.scale(q.s, q.s); draw(q.sh); ctx.restore();
}
// A round-headed pin seen from above: a small disc with a highlight and a tiny shadow.
export function pin(ctx, x, y, P, r = 9) {
  ctx.fillStyle = rgba('#000000', 0.25); ctx.beginPath(); ctx.arc(x + 3, y + 4, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.pin; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = P.pinHi; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2); ctx.fill();
}
// A speech balloon: a rounded box with a tail towards (tx, ty). Path only.
export function balloon(x, y, w, h, tx, ty) {
  const p = new Path2D(), r = Math.min(60, h / 2), cx = x + w / 2, bx = Math.max(x + r + 20, Math.min(x + w - r - 60, tx));
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  const side = tx < cx ? -1 : 1;
  if (side < 0) { p.lineTo(bx + 60, y + h); p.lineTo(tx, ty); p.lineTo(bx + 10, y + h); } else { p.lineTo(bx + 40, y + h); p.lineTo(tx, ty); p.lineTo(bx - 10, y + h); }
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
  return p;
}

// The puppet: a card figure standing with its feet at (x, y), `s` its height scale (1 = about 330 px tall). Head, body, arms and
// legs are separate pieces pinned at the neck, shoulders and hips. pose: { arm: [a0, a1] (radians from hanging), head, mouth, lean }.
// face: which way it looks (1 to the right, -1 to the left). body: its card colour.
export function puppet(ctx, x, y, s, pose, P, { face = 1, body = P.accent } = {}) {
  const draw = (ink, solid) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s); ctx.rotate(pose.lean ?? 0);
    const part = (path, fill, edge = true) => { ctx.fillStyle = solid ?? fill; ctx.fill(path); if (!solid) { ctx.save(); ctx.clip(path); ctx.fillStyle = ctx.createPattern(tile(P), 'repeat'); ctx.fill(path); ctx.restore(); if (edge) { ctx.strokeStyle = ink; ctx.lineWidth = 3 / s; ctx.stroke(path); } } };
    const rect = (x0, y0, w, h, r = 8) => { const p = new Path2D(); p.roundRect(x0, y0, w, h, r); return p; };
    const limb = (px, py, ang, len, wd, fill) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); part(rect(-wd / 2, -wd / 2, wd, len, wd / 2), fill); ctx.restore(); if (!solid) pinAt(px, py); };
    const pinAt = (px, py) => { ctx.fillStyle = P.pin; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P.pinHi; ctx.beginPath(); ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2); ctx.fill(); };
    limb(-24, -120, 0.08, 120, 34, P.legs); limb(24, -120, -0.08, 120, 34, P.legs);
    const torso = new Path2D(); torso.moveTo(-52, -250); torso.lineTo(52, -250); torso.lineTo(64, -110); torso.lineTo(-64, -110); torso.closePath();
    limb(-46, -236, 0.25 + (pose.arm?.[1] ?? 0), 118, 30, P.limb);
    part(torso, body);
    const sash = new Path2D(); sash.moveTo(-52, -250); sash.lineTo(-30, -250); sash.lineTo(64, -130); sash.lineTo(60, -112); sash.closePath(); part(sash, P.paper, false);
    limb(46, -236, -0.25 - (pose.arm?.[0] ?? 0), 118, 30, P.limb);
    ctx.save(); ctx.translate(0, -252); ctx.rotate(pose.head ?? 0);
    part(new Path2D('M -78 -80 a 78 78 0 1 0 156 0 a 78 78 0 1 0 -156 0'), P.paper);
    if (!solid) {
      const hat = new Path2D(); hat.moveTo(-62, -128); hat.lineTo(62, -128); hat.lineTo(40, -168); hat.lineTo(-40, -168); hat.closePath(); part(hat, P.ink, false);
      ctx.fillStyle = P.ink; ctx.fillRect(-82, -132, 164, 12);
      ctx.beginPath(); ctx.arc(14, -88, 7, 0, Math.PI * 2); ctx.arc(46, -88, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(6, -106); ctx.lineTo(24, -102); ctx.moveTo(38, -102); ctx.lineTo(56, -106); ctx.stroke();
      if (pose.mouth) { ctx.beginPath(); ctx.ellipse(32, -52, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(18, -54); ctx.quadraticCurveTo(32, -46, 48, -54); ctx.stroke(); }
      ctx.fillStyle = rgba(P.accent, 0.35); ctx.beginPath(); ctx.arc(-6, -62, 12, 0, Math.PI * 2); ctx.fill();
      pinAt(0, 0);
    }
    ctx.restore(); ctx.restore();
  };
  ctx.save(); ctx.translate(9, 11); draw(null, rgba('#000000', 0.2)); ctx.restore();
  draw(P.ink, null);
}
// A held pose index: changes POSE_FPS times a second.
export const held = (t) => Math.floor(t * POSE_FPS + 1e-6);
