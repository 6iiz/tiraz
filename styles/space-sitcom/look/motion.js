// Space-sitcom motion: a grown-up cartoon about two aliens with a portal. Every outline is thick, dark and "boils": it is redrawn in
// three slightly different hand-drawn versions that cycle twelve times a second, so even a held frame is alive. Fills are flat, with one
// hard-edged shadow shape inside each form. Motion itself is smooth (only the line boils). Lines are spoken from speech bubbles; the key
// word gets an accent splat and the two characters do a reaction take. The portal, in the accent, is the only thing that glows.
// This file holds the palette, the boiling outline, the shape builders, the splat, the portal and the two characters.
import { clamp, mix, contrast, rgba, lerp, ease } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const line = mix(dark, '#000000', 0.35);                       // the outline: the brand's dark, pressed a little toward neutral black
  const onAccent = contrast(accent, dark) >= contrast(accent, light) ? dark : light;
  let g = 0.5, note = mix(light, dark, g); while (contrast(note, light) < 4.8 && g < 0.95) { g += 0.04; note = mix(light, dark, g); }
  return { dark, light, line, accent, onAccent, note,
    sky: [0, 1, 2, 3].map((k) => mix(dark, accent, T.tone.sky * k)),
    land: mix(dark, light, 0.2), land2: mix(dark, light, 0.3), paper: light, shade: mix(light, dark, 0.2),
    screen: mix(dark, '#000000', 0.2), grey: mix(light, dark, 0.45),
    suit: mix(accent, dark, 0.45), skin: mix(light, dark, 0.08), blob: mix(light, accent, 0.45), blobShade: mix(accent, dark, 0.2),
    core: mix(accent, light, 0.65) };
}

// ---- the boiling outline -------------------------------------------------------------------------------------------------------
export const drawing = (t) => ((Math.floor(t * 12 + 1e-6) % 3) + 3) % 3;
// Displaces each point of a dense outline along its normal with smooth noise; the noise changes with the drawing number (0, 1, 2).
export function boilPath(ctx, pts, closed, k, amp = 1.8, seed = 0) {
  const n = pts.length; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const o = amp * (0.6 * Math.sin(i * 0.37 + k * 1.9 + seed) + 0.4 * Math.sin(i * 0.93 + k * 4.3 + seed * 1.7));
    const x = pts[i][0] - (dy / L) * o, y = pts[i][1] + (dx / L) * o;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  if (closed) ctx.closePath();
}
// Fill, an optional hard shadow (the same form shifted toward the light, cut out of a darker fill), then the boiling outline.
export function shape(ctx, P, pts, k, { fill, shadow, line = P.line, width = 7, seed = 0, amp = 1.8, sx = -14, sy = -12 } = {}) {
  ctx.save();
  if (fill) {
    boilPath(ctx, pts, true, k, amp, seed); ctx.fillStyle = shadow ?? fill; ctx.fill();
    if (shadow) { ctx.save(); boilPath(ctx, pts, true, k, amp, seed); ctx.clip(); ctx.translate(sx, sy); boilPath(ctx, pts, true, k, amp, seed); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
  }
  if (width > 0) { boilPath(ctx, pts, true, k, amp, seed); ctx.strokeStyle = line; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.restore();
}
export function stroke(ctx, P, pts, k, width = 7, color = P.line, seed = 0) {
  ctx.save(); boilPath(ctx, pts, false, k, 1.4, seed); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}

// ---- shape builders (dense point lists, about one point every 8 px) ---------------------------------------------------------------
export function ellipse(cx, cy, rx, ry, lumps = 0, lumpAmp = 0, rot = 0) {
  const n = Math.max(24, Math.round((Math.PI * (rx + ry)) / 8)), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + lumpAmp * Math.sin(a * lumps + rot); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
const seg = (out, x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 8)); for (let i = 0; i < n; i++) out.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); };
const arc = (out, cx, cy, r, a0, a1) => { const n = Math.max(3, Math.round((Math.abs(a1 - a0) * r) / 8)); for (let i = 0; i < n; i++) { const a = lerp(a0, a1, i / n); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
// A rounded box, clockwise from the top-left corner. tail: { x, w, tipX, tipY } puts a speech tail on the bottom edge.
export function box(x0, y0, x1, y1, r, tail = null) {
  r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2); const o = [];
  seg(o, x0 + r, y0, x1 - r, y0); arc(o, x1 - r, y0 + r, r, -Math.PI / 2, 0); seg(o, x1, y0 + r, x1, y1 - r); arc(o, x1 - r, y1 - r, r, 0, Math.PI / 2);
  if (tail) { const a = Math.min(x1 - r, tail.x + tail.w / 2), b = Math.max(x0 + r, tail.x - tail.w / 2); seg(o, x1 - r, y1, a, y1); seg(o, a, y1, tail.tipX, tail.tipY); seg(o, tail.tipX, tail.tipY, b, y1); seg(o, b, y1, x0 + r, y1); }
  else seg(o, x1 - r, y1, x0 + r, y1);
  arc(o, x0 + r, y1 - r, r, Math.PI / 2, Math.PI); seg(o, x0, y1 - r, x0, y0 + r); arc(o, x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5);
  return o;
}
export function polyline(list) { const o = []; for (let i = 0; i < list.length - 1; i++) seg(o, list[i][0], list[i][1], list[i + 1][0], list[i + 1][1]); o.push(list[list.length - 1]); return o; }

// The splat behind a key word: a lumpy accent blob with drips, popped with a springy overshoot (the one spring of a line).
export function splat(ctx, P, b, size, p, k) {
  if (p <= 0) return;
  const s = ease.outBack(clamp(p)), cx = b.x + b.width / 2, cy = b.y + size * 0.05, hw = b.width / 2 + size * 0.17, hh = size * 0.66;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  shape(ctx, P, box(-hw, -hh, hw, hh, size * 0.42), k, { fill: P.accent, width: 6, seed: 3, amp: 3.2 });
  shape(ctx, P, ellipse(hw * 0.45, hh + size * 0.12, size * 0.09, size * 0.13), k, { fill: P.accent, width: 5, seed: 4 });
  ctx.restore();
}

// Where kit.drawText puts each word (the kit's own rule).
export function layout(f, { x0, x1, y, align = 'center' }, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, key: w.key }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// ---- the portal: a lumpy accent rim, spiral arms turning inside, a pale core, two flat translucent rings around it. -------------
export function portal(ctx, P, cx, cy, r, t, k) {
  if (r <= 1) return;
  ctx.save();
  for (const [f, a] of [[1.55, 0.1], [1.28, 0.16]]) { ctx.beginPath(); ctx.arc(cx, cy, r * f, 0, Math.PI * 2); ctx.fillStyle = rgba(P.accent, a); ctx.fill(); }
  const rim = ellipse(cx, cy, r, r, 9, 0.05, t * 2);
  shape(ctx, P, rim, k, { fill: P.accent, width: 7, seed: 5 });
  ctx.save(); boilPath(ctx, rim, true, k, 1.8, 5); ctx.clip();
  ctx.translate(cx, cy); ctx.rotate(-t * 2.2);
  ctx.fillStyle = P.blobShade;
  for (let j = 0; j < 5; j++) {
    ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.moveTo(0, 0);
    for (let i = 0; i <= 20; i++) { const u = i / 20, a = u * 2.4, rr = u * r * 1.05; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    for (let i = 20; i >= 0; i--) { const u = i / 20, a = u * 2.4 + 0.35 * u, rr = u * r * 1.05; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fillStyle = P.core; ctx.fill();
  ctx.restore();
  // sparks orbiting the rim
  ctx.fillStyle = P.core;
  for (let i = 0; i < 6; i++) { const a = t * 1.3 + i * 1.05, rr = r * (1.12 + 0.08 * Math.sin(t * 3 + i)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ---- the duo ----------------------------------------------------------------------------------------------------------------------
// Eyes: big white, tiny pupil; lid: 0 open .. 1 shut (the deadpan rests at about .45).
function eye(ctx, P, x, y, rx, ry, k, lid, lookX, lookY, seed) {
  const pts = ellipse(x, y, rx, ry);
  shape(ctx, P, pts, k, { fill: P.light, width: 5, seed });
  ctx.fillStyle = P.line; ctx.beginPath(); ctx.arc(x + lookX * rx * 0.45, y + lookY * ry * 0.4, Math.max(4, rx * 0.16), 0, Math.PI * 2); ctx.fill();
  if (lid > 0.02) {
    ctx.save(); boilPath(ctx, pts, true, k, 1.8, seed); ctx.clip();
    const yl = y - ry + 2 * ry * lid; ctx.fillStyle = P.skin; ctx.fillRect(x - rx - 4, y - ry - 6, 2 * rx + 8, yl - (y - ry - 6));
    ctx.restore(); stroke(ctx, P, polyline([[x - rx, yl], [x + rx, yl]]), k, 5, P.line, seed + 1);
  }
}
// Mouth: open 0..1 (talking or shouting), a flat line when shut.
function mouth(ctx, P, x, y, w, open, k, seed) {
  if (open < 0.08) { stroke(ctx, P, polyline([[x - w / 2, y], [x - w / 6, y + 3], [x + w / 2, y - 2]]), k, 5, P.line, seed); return; }
  const pts = ellipse(x, y + open * w * 0.25, w / 2, open * w * 0.4);
  shape(ctx, P, pts, k, { fill: P.screen, width: 5, seed });
  ctx.save(); boilPath(ctx, pts, true, k, 1.8, seed); ctx.clip(); ctx.fillStyle = P.light; ctx.fillRect(x - w / 2, y - 40, w, w * 0.1 + 38); ctx.restore();
}

// The deadpan one: tall, in a suit of the darkened accent, a bowl helmet around a pale head; holds a little ray gun.
// state: { talk 0..1, take 0..1 (the reaction: lids snap open, brows up), look [x, y], zap 0..1 (raises the gun), wave 0..1 }
export function tallOne(ctx, P, x, yF, t, k, st = {}) {
  const bob = Math.sin(t * 2.1) * 4, take = st.take ?? 0, by = yF - 150 + bob;
  // legs and body
  stroke(ctx, P, polyline([[x - 26, by + 90], [x - 32, yF]]), k, 12, P.line, 11); stroke(ctx, P, polyline([[x + 26, by + 90], [x + 34, yF]]), k, 12, P.line, 12);
  shape(ctx, P, ellipse(x - 38, yF + 2, 30, 13), k, { fill: P.line, width: 0 }); shape(ctx, P, ellipse(x + 40, yF + 2, 30, 13), k, { fill: P.line, width: 0 });
  shape(ctx, P, box(x - 70, by - 120, x + 70, by + 110, 60), k, { fill: P.suit, shadow: mix(P.suit, P.dark, 0.4), seed: 13 });
  stroke(ctx, P, polyline([[x, by - 110], [x, by + 100]]), k, 4, mix(P.suit, P.dark, 0.6), 14);
  // arms: the far one hangs, the near one holds the gun up as `zap` rises, or waves
  const zap = st.zap ?? 0, wave = st.wave ?? 0;
  stroke(ctx, P, polyline([[x - 64, by - 80], [x - 92, by + 10], [x - 80, by + 70]]), k, 12, P.line, 15);
  const hx = x + 90 + 30 * zap, hy = by - 40 - 120 * zap - 160 * wave + 18 * Math.sin(t * 14) * wave;
  stroke(ctx, P, polyline([[x + 64, by - 80], [lerp(x + 100, hx, 0.5), lerp(by - 10, hy, 0.6)], [hx, hy]]), k, 12, P.line, 16);
  if (zap > 0) {
    shape(ctx, P, box(hx - 12, hy - 34, hx + 60, hy, 10), k, { fill: P.grey, width: 6, seed: 17 });
    shape(ctx, P, ellipse(hx + 64, hy - 17, 12, 12), k, { fill: P.accent, width: 5, seed: 18 });
  }
  shape(ctx, P, ellipse(hx, hy, 15, 15), k, { fill: P.skin, width: 5, seed: 19 });
  // head inside the bowl
  const hy0 = by - 205, hw = 82;
  shape(ctx, P, ellipse(x, hy0, hw, hw * 0.95), k, { fill: P.skin, shadow: P.shade, seed: 21 });
  const lid = st.lid ?? lerp(0.45, 0, take), lx = st.look?.[0] ?? 0, ly = st.look?.[1] ?? 0;
  eye(ctx, P, x - 26, hy0 - 12, 27 + 5 * take, 30 + 6 * take, k, lid, lx, ly, 22); eye(ctx, P, x + 26, hy0 - 12, 27 + 5 * take, 30 + 6 * take, k, lid, lx, ly, 23);
  stroke(ctx, P, polyline([[x - 52, hy0 - 54 - 18 * take], [x - 8, hy0 - 50 - 10 * take]]), k, 6, P.line, 24);
  stroke(ctx, P, polyline([[x + 8, hy0 - 50 - 10 * take], [x + 52, hy0 - 56 - 18 * take]]), k, 6, P.line, 25);
  mouth(ctx, P, x + 4, hy0 + 40, 44, Math.max(st.talk ?? 0, take * 0.5), k, 26);
  // the bowl: a flat translucent disc with a boiling rim and one hard glint
  ctx.save(); ctx.globalAlpha = 0.18; shape(ctx, P, ellipse(x, hy0 + 6, 120, 116), k, { fill: P.light, width: 0, seed: 27 }); ctx.restore();
  shape(ctx, P, ellipse(x, hy0 + 6, 120, 116), k, { width: 6, seed: 27 });
  stroke(ctx, P, polyline([[x - 82, hy0 - 50], [x - 60, hy0 - 80], [x - 30, hy0 - 96]]), k, 7, P.light, 28);
  shape(ctx, P, box(x - 70, by - 130, x + 70, by - 104, 12), k, { fill: P.grey, width: 6, seed: 29 });
}

// The little creature: a round blob in a pale accent, one huge eye, a wide toothy mouth, an antenna with a bulb.
export function blobOne(ctx, P, x, yF, t, k, st = {}) {
  const take = st.take ?? 0, hop = Math.abs(Math.sin(t * 3.2)) * 10 + 60 * take * (1 - take) * 4 * 0.25;
  const by = yF - 95 - hop, sq = 1 + 0.04 * Math.sin(t * 6.4);
  shape(ctx, P, ellipse(x - 40, yF, 24, 11), k, { fill: P.line, width: 0 }); shape(ctx, P, ellipse(x + 40, yF, 24, 11), k, { fill: P.line, width: 0 });
  stroke(ctx, P, polyline([[x + 20, by - 92], [x + 34 + 6 * Math.sin(t * 4), by - 150]]), k, 6, P.line, 31);
  shape(ctx, P, ellipse(x + 34 + 6 * Math.sin(t * 4), by - 158, 14, 14), k, { fill: P.accent, width: 5, seed: 32 });
  shape(ctx, P, ellipse(x, by, 112 * sq, 100 / sq, 5, 0.03), k, { fill: P.blob, shadow: P.blobShade, seed: 33 });
  const er = 40 + 16 * take, lx = st.look?.[0] ?? 0.2, ly = st.look?.[1] ?? -0.3;
  eye(ctx, P, x - 4, by - 28, er, er * 1.05, k, (st.lid ?? 0) * (1 - take), lx, ly, 34);
  mouth(ctx, P, x, by + 44, 92, Math.max(st.talk ?? 0, take * 0.9), k, 35);
  stroke(ctx, P, polyline([[x - 92, by + 10], [x - 140, by - 30 - 50 * take]]), k, 10, P.line, 36);
  stroke(ctx, P, polyline([[x + 92, by + 10], [x + 140, by - 30 - 50 * take]]), k, 10, P.line, 37);
}

// Talking: the mouth flaps on syllable-ish pulses while `on` (0..1) holds.
export const talk = (t, on) => (on > 0 ? on * (0.5 + 0.5 * Math.sin(t * 26)) * (0.6 + 0.4 * Math.sin(t * 7.3)) : 0);
// A blink now and then (both characters use it with different seeds).
export const blink = (t, seed) => { const c = (t + seed * 1.37) % 3.1; return c < 0.12 ? 1 : 0; };
export { clamp, rgba, ease, lerp, mix };

// Both characters on the ground line. a / b: the states of the tall one and the blob (see tallOne, blobOne). tt: the clock that keeps
// their idle motion running across scenes.
export function duo(ctx, P, C, tt, k, a = {}, b = {}) {
  a = { ...a, lid: a.lid ?? (blink(tt, 1) ? 1 : undefined) }; b = { ...b, lid: blink(tt, 2) ? 1 : 0 };
  tallOne(ctx, P, C.tall, C.y, tt, k, a); blobOne(ctx, P, C.blob, C.y, tt, k, b);
}
// Where a speech tail should point: just above each one's head.
export const mouthOf = (C, who) => (who === 'blob' ? [C.blob - 30, C.y - 230] : [C.tall + 40, C.y - 480]);
// The terminal tag: a dark screen strip with a boiling outline; text in the light colour is typed in word by word, a block cursor in
// the accent blinks at its end. Returns nothing; draws the box only (the caller draws the text with `typed`).
export function tag(ctx, P, k, x0, y0, x1, y1, p, seed = 81) {
  if (p <= 0) return;
  const s = ease.outBack(clamp(p)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, s); ctx.translate(-cx, -cy);
  shape(ctx, P, box(x0, y0, x1, y1, 16), k, { fill: P.screen, width: 6, seed });
  ctx.fillStyle = rgba(P.light, 0.07); for (let y = y0 + 6; y < y1 - 4; y += 6) ctx.fillRect(x0 + 8, y, x1 - x0 - 16, 2);
  ctx.restore();
}
// A speech bubble (light, hard shadow, boiling outline) whose tail points at (tx, ty). p: 0..1 opens it from the tail.
export function bubble(ctx, P, k, x0, y0, x1, y1, tx, ty, p, seed = 91) {
  if (p <= 0) return false;
  const s = ease.outCubic(clamp(p)), tailX = Math.max(x0 + 90, Math.min(x1 - 90, tx));
  ctx.save(); ctx.translate(tx, ty); ctx.scale(s, s); ctx.translate(-tx, -ty);
  shape(ctx, P, box(x0, y0, x1, y1, 46, { x: tailX, w: 90, tipX: tx, tipY: ty }), k, { fill: P.paper, shadow: P.shade, seed, sx: -12, sy: -14 });
  ctx.restore();
  return s;
}
