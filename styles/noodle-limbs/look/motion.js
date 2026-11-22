// Noodle-limbs motion: an early sound-era cartoon. Everything is drawn "on twos" (twelve new drawings a second) and swings to a two-beat
// band: squash on the downbeat, stretch on the way up. Nothing fades or slides: a shape pops into place (stretch, squash, settle), a ball
// bounces from word to word, and a little ink-drop fellow with hose arms dances under the title card the whole reel.
// This file holds what the parts share: the palette, the stepped clock, the pop, the title card, the key-word cartouche, the bouncing
// ball, the gloves, the pie eyes and the fellow himself.
import { clamp, mix, contrast, rgba, lerp } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');

// The lighter brand colour is the painted paper (a shade aged toward the dark one), the darker one is the ink. Greys are the two mixed,
// the accent is the one colour the old print allows itself: the ball, the bow tie and the cartouche behind the key word.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  let g = T.tone.grey, grey = mix(light, dark, g);
  while (contrast(grey, light) < 4.8 && g < 0.95) { g += 0.04; grey = mix(light, dark, g); }
  const onAccent = contrast(accent, dark) >= contrast(accent, light) ? dark : light;
  return { dark, light, ink: dark, card: light, paper: mix(light, dark, T.tone.paper), grey, accent, onAccent,
    wash: mix(light, dark, T.tone.wash), wash2: mix(light, dark, T.tone.wash * 2.2), drape: mix(light, dark, 0.3) };
}

// Twelve drawings a second: every animated value is read at the last "drawing" time, so motion steps like hand-inked cels.
export const twos = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// The pop: stretch tall out of nothing, squash wide, settle. p 0..1 → [sx, sy], or null before it starts.
const K = [[0, 0.35, 0.1], [0.35, 0.8, 1.3], [0.65, 1.2, 0.82], [0.85, 0.96, 1.05], [1, 1, 1]];
export function popScale(p) {
  if (p <= 0) return null; if (p >= 1) return [1, 1];
  for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const u = (p - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return [lerp(K[i - 1][1], K[i][1], u), lerp(K[i - 1][2], K[i][2], u)]; }
  return [1, 1];
}
// Scale around a floor point (ax, ay): a popping thing grows from where it stands.
export function popAt(ctx, p, ax, ay) {
  const s = popScale(p); if (!s) return false;
  ctx.translate(ax, ay); ctx.scale(s[0], s[1]); ctx.translate(-ax, -ay);
}

export function rrect(ctx, x0, y0, x1, y1, r) {
  r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r); ctx.arcTo(x0, y1, x0, y0, r); ctx.arcTo(x0, y0, x1, y0, r); ctx.closePath();
}

// The title card of the old shorts: a light panel, a heavy ink border and a fine one inside it, ink dots in the inner corners.
export function card(ctx, P, x0, y0, x1, y1) {
  ctx.save();
  ctx.fillStyle = rgba(P.ink, 0.22); rrect(ctx, x0 + 12, y0 + 14, x1 + 12, y1 + 14, 34); ctx.fill();
  ctx.fillStyle = P.card; rrect(ctx, x0, y0, x1, y1, 34); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.stroke();
  ctx.lineWidth = 2.5; rrect(ctx, x0 + 16, y0 + 16, x1 - 16, y1 - 16, 22); ctx.stroke();
  ctx.fillStyle = P.ink;
  for (const [x, y] of [[x0 + 34, y0 + 34], [x1 - 34, y0 + 34], [x0 + 34, y1 - 34], [x1 - 34, y1 - 34]]) { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
// A small ornament rule: two lines and a diamond, for between a lead and its line.
export function ornament(ctx, P, cx, y, w) {
  ctx.save(); ctx.fillStyle = P.ink;
  ctx.fillRect(cx - w / 2, y - 1.5, w / 2 - 22, 3); ctx.fillRect(cx + 22, y - 1.5, w / 2 - 22, 3);
  ctx.beginPath(); ctx.moveTo(cx, y - 11); ctx.lineTo(cx + 11, y); ctx.lineTo(cx, y + 11); ctx.lineTo(cx - 11, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// The cartouche behind a key word: an accent pill with an ink rim. The word on it takes P.onAccent.
export function cartouche(ctx, P, box, size) {
  const x0 = box.x - size * 0.16, x1 = box.x + box.width + size * 0.16, y0 = box.y - size * 0.58, y1 = box.y + size * 0.64;
  ctx.save(); rrect(ctx, x0, y0, x1, y1, size * 0.4); ctx.fillStyle = P.accent; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
}

// Where kit.drawText puts each word (the kit's own rule), so the ball knows where to land before the words are drawn.
export function layout(f, { x0, x1, y, align = 'center' }, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, key: w.key, size: f.size }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// The bouncing ball. hops: [{ x, y, t }] landing points (y = where the ball's bottom touches) in time order. Between two landings it
// flies a parabola; on a landing it squashes. Before the first it drops in from above; after the last it bounces in place on the beat.
export function ball(ctx, P, hops, t, beat, r = 22, until = Infinity) {
  if (!hops.length || t < hops[0].t - 0.3 || t > until) return;
  let x, y, sq = 0;
  const last = hops[hops.length - 1];
  if (t < hops[0].t) { const u = (t - (hops[0].t - 0.3)) / 0.3; x = hops[0].x + 120 * (1 - u); y = hops[0].y - 420 * (1 - u * u); }
  else if (t >= last.t) { const u = ((t - last.t) % beat) / beat; x = last.x; y = last.y - 4 * u * (1 - u) * 130; sq = u < 0.12 ? 1 - u / 0.12 : 0; }
  else {
    let i = 0; while (hops[i + 1].t <= t) i++;
    const a = hops[i], b = hops[i + 1], u = (t - a.t) / (b.t - a.t), h = 70 + 0.25 * Math.abs(b.x - a.x);
    x = lerp(a.x, b.x, u); y = lerp(a.y, b.y, u) - 4 * u * (1 - u) * h; sq = u < 0.15 ? 1 - u / 0.15 : 0;
  }
  const sx = 1 + 0.35 * sq, sy = 1 - 0.35 * sq;
  ctx.save(); ctx.translate(x, y - r * sy); ctx.scale(sx, sy);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = 5 / Math.max(sx, sy); ctx.strokeStyle = P.ink; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fillStyle = rgba(P.card, 0.85); ctx.fill();
  ctx.restore();
}

// A white glove: palm, three fat fingers and a thumb, a flared cuff. Stroked thick in ink first, then filled, so only the outer
// outline of the union shows. ang: the way the fingers point (radians).
export function glove(ctx, P, x, y, s, ang) {
  const parts = [[0, 0, 21, 19], [22, -11, 10, 9], [25, 0, 10, 9], [22, 11, 10, 9], [4, -20, 8, 10], [-22, 0, 9, 17]];
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const shape = () => { ctx.beginPath(); for (const [px, py, rx, ry] of parts) { ctx.moveTo(px + rx, py); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); } };
  shape(); ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.stroke();
  shape(); ctx.fillStyle = P.card; ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (const dy of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(-6, dy); ctx.lineTo(8, dy * 1.3); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-16, -14); ctx.lineTo(-16, 14); ctx.stroke();
  ctx.restore();
}

// A pie eye: a white oval with a black pupil that has a wedge cut out toward the upper side. blink 0..1 closes it with a lid line.
export function pieEye(ctx, P, x, y, s, lookX, lookY, blink = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const ry = 25 * (1 - blink);
  if (ry < 3) { ctx.strokeStyle = P.card; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(0, 10, 14, 4); ctx.stroke(); ctx.restore(); return; }
  ctx.beginPath(); ctx.ellipse(0, 0, 15, ry, 0, 0, Math.PI * 2); ctx.fillStyle = P.card; ctx.fill();
  ctx.save(); ctx.clip();
  const px = lookX * 5, py = lookY * 7 + 4;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.ellipse(px, py, 9.5, 16, 0, -0.35, -1.05 + Math.PI * 2); ctx.closePath(); ctx.fillStyle = P.ink; ctx.fill();
  ctx.restore(); ctx.restore();
}

// A hose limb: one smooth bend, constant width, round ends.
function hose(ctx, ax, ay, bx, by, bend, width, color) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx + nx * bend * L, my + ny * bend * L, bx, by);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
}

// The fellow: one ink drop is his whole body (its tip sways with his mood), pie eyes, a light grin, an accent bow tie, hose arms and legs,
// white gloves and big shoes. (x, yF) is the floor point between his feet, s his scale (1 ≈ 330 px tall). tt is the stepped time.
// pose: 'dance' (the two-beat swing), 'point' (one arm up at the card), 'wave' (the ending), 'cheer' (both arms up, a hop).
export function fellow(ctx, P, x, yF, s, tt, beat, pose = 'dance') {
  const b = tt / beat, ph = Math.PI * b, sw = Math.sin(ph), bob = Math.abs(sw);
  const hop = pose === 'cheer' ? 40 * bob : 0;
  const q = 0.13 * (1 - bob) ** 3, rx = 74 * s * (1 + q), ry = 86 * s * (1 - q);
  const by = yF - s * (178 + 26 * bob + hop);
  const lift1 = Math.max(0, sw) * 30 * s, lift2 = Math.max(0, -sw) * 30 * s;
  const lw = 13 * s;
  // legs and shoes
  const hips = [[x - 30 * s, by + ry * 0.7], [x + 30 * s, by + ry * 0.7]], feet = [[x - 58 * s, yF - lift1 - hop * s], [x + 58 * s, yF - lift2 - hop * s]];
  hose(ctx, hips[0][0], hips[0][1], feet[0][0], feet[0][1] - 12 * s, 0.12, lw, P.ink);
  hose(ctx, hips[1][0], hips[1][1], feet[1][0], feet[1][1] - 12 * s, -0.12, lw, P.ink);
  for (const [k, [fx, fy]] of feet.entries()) {
    const d = k ? 1 : -1;
    ctx.beginPath(); ctx.ellipse(fx + d * 20 * s, fy - 6 * s, 42 * s, 21 * s, d * -0.08, 0, Math.PI * 2); ctx.fillStyle = P.ink; ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx + d * 40 * s, fy - 14 * s, 9 * s, 5 * s, d * -0.4, 0, Math.PI * 2); ctx.fillStyle = P.card; ctx.fill();
  }
  // arms (behind the gloves, in front of the body edge)
  const sh = [[x - 60 * s, by - 6 * s], [x + 60 * s, by - 6 * s]];
  let g;
  if (pose === 'point') g = [[x - 128 * s, by - 50 * s - 40 * s * sw, Math.PI], [x + 96 * s, by - 190 * s, -Math.PI / 2.4]];
  else if (pose === 'wave') { const w = Math.sin(ph * 4); g = [[x - 125 * s, by + 20 * s, Math.PI * 0.85], [x + 120 * s + 22 * s * w, by - 175 * s, -Math.PI / 2 + 0.35 * w]]; }
  else if (pose === 'cheer') g = [[x - 110 * s, by - 170 * s, -Math.PI * 0.62], [x + 110 * s, by - 170 * s, -Math.PI * 0.38]];
  else g = [[x - 128 * s, by - 60 * s - 55 * s * sw, Math.PI + 0.4 * sw], [x + 128 * s, by - 60 * s + 55 * s * sw, 0.4 * sw]];
  // body: an ink drop whose tip leans with the swing
  const tip = 30 * s * sw;
  ctx.beginPath(); ctx.moveTo(x + tip, by - ry * 1.62);
  ctx.bezierCurveTo(x + tip * 0.5 + rx * 0.35, by - ry * 1.15, x + rx, by - ry * 0.6, x + rx, by);
  ctx.bezierCurveTo(x + rx, by + ry * 0.62, x + rx * 0.56, by + ry, x, by + ry);
  ctx.bezierCurveTo(x - rx * 0.56, by + ry, x - rx, by + ry * 0.62, x - rx, by);
  ctx.bezierCurveTo(x - rx, by - ry * 0.6, x + tip * 0.5 - rx * 0.35, by - ry * 1.15, x + tip, by - ry * 1.62);
  ctx.fillStyle = P.ink; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - rx * 0.55, by - ry * 0.35, 9 * s, 22 * s, 0.5, 0, Math.PI * 2); ctx.fillStyle = rgba(P.card, 0.55); ctx.fill();
  // face
  const blink = (Math.floor(b) % 7 === 3) && (b % 1) < 0.2 ? 1 : 0, lx = pose === 'point' ? 0.6 : 0.3 * sw, ly = pose === 'point' || pose === 'cheer' ? -0.9 : 0;
  pieEye(ctx, P, x - 21 * s, by - 30 * s, s, lx, ly, blink); pieEye(ctx, P, x + 21 * s, by - 30 * s, s, lx, ly, blink);
  ctx.beginPath(); ctx.moveTo(x - 34 * s, by + 18 * s); ctx.quadraticCurveTo(x, by + (pose === 'cheer' ? 70 : 52) * s, x + 34 * s, by + 18 * s); ctx.quadraticCurveTo(x, by + 32 * s, x - 34 * s, by + 18 * s);
  ctx.fillStyle = P.card; ctx.fill();
  ctx.strokeStyle = P.card; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 36 * s, by + 10 * s); ctx.lineTo(x + d * 42 * s, by + 24 * s); ctx.stroke(); }
  // bow tie
  ctx.save(); ctx.translate(x, by + ry * 0.62); ctx.fillStyle = P.accent; ctx.strokeStyle = P.card; ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30 * s, -16 * s); ctx.lineTo(-30 * s, 16 * s); ctx.closePath(); ctx.moveTo(0, 0); ctx.lineTo(30 * s, -16 * s); ctx.lineTo(30 * s, 16 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 8 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  // arms on top of the body's edge, then gloves
  hose(ctx, sh[0][0], sh[0][1], g[0][0], g[0][1], 0.18, lw, P.ink); hose(ctx, sh[1][0], sh[1][1], g[1][0], g[1][1], -0.18, lw, P.ink);
  glove(ctx, P, g[0][0], g[0][1], s, g[0][2]); glove(ctx, P, g[1][0], g[1][1], s, g[1][2]);
}
export { clamp, rgba };

// Neighbouring key words on one row share one cartouche: runs[i] is the union box for the first word of a run, 'skip' for the rest.
export function keyRuns(f, opts, rtl, all = false) {
  const L = layout(f, opts, rtl).map((b) => (all ? { ...b, key: true } : b)), runs = [];
  L.forEach((b, i) => {
    if (!b.key) return;
    const p = L[i - 1];
    if (p && p.key && p.y === b.y) { let j = i - 1; while (runs[j] === 'skip') j--; const r = runs[j]; const x0 = Math.min(r.x, b.x), x1 = Math.max(r.x + r.width, b.x + b.width); runs[j] = { ...r, x: x0, width: x1 - x0 }; runs[i] = 'skip'; }
    else runs[i] = { ...b };
  });
  return runs;
}
