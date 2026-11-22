// Play Marker motion and materials: a pundit's analysis segment. A broadcast camera looks down a pitch at a short passage of play;
// the play runs, then freezes with a small punch-in, and the analyst draws on the frozen picture with a marker: a ring under a
// player's feet, a curved arrow for the ball, a shaded patch for the space nobody covered. Text sits on broadcast cards (a dark slab
// with an accent bar on the reading side). Studio energy: fast card slides, marker strokes drawn at hand speed, one punch per freeze.
// Everything is drawn from the brand's colours: the turf is the dark brand colour tinted by the accent, the lines and one team are
// the light colour, the marker is the accent. No real teams, kits, leagues or broadcasters.
import { clamp, ease, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = ease.outCubic, X = ease.outExpo, IO = ease.inOutCubic, I = ease.inQuad;

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const L = (c) => contrast(c, '#000000');
  const light = L(text) >= L(bg) ? text : bg, dark = light === text ? bg : text;
  const card = mix(dark, '#000000', 0.15);
  const readable = (k) => { let c = mix(light, card, k); while (k > 0 && contrast(c, card) < 4.6) { k -= 0.03; c = mix(light, card, Math.max(0, k)); } return c; };
  const turf = mix(dark, accent, T.tone.pitch);
  return {
    light, dark, accent, card, grey: readable(T.tone.grey), turf, turf2: mix(turf, light, T.tone.stripe), stand: mix(dark, '#000000', 0.2),
    line: mix(turf, light, T.tone.line), teamA: light, teamB: mix(dark, light, 0.12), onAccent: contrast(accent, dark) >= contrast(accent, light) ? dark : light,
    key: contrast(accent, card) >= 3.2 ? accent : mix(accent, light, 0.45),
    pen: contrast(accent, turf) >= 3 ? accent : mix(accent, light, 0.4),
  };
}

// ---------- word positions and key runs (same arithmetic as kit.drawText) ----------
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) { const wl = kit.rtl ? cur - w.width : cur; out.push({ i: i++, x: wl, y: yy, width: w.width, row: r, key: w.key }); cur = kit.rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function runs(bx) {
  const out = [];
  for (const b of bx) {
    if (!b.key) continue;
    const l = out.at(-1);
    if (l && l.row === b.row && l.end === b.i - 1) { const a = Math.min(l.x, b.x), z = Math.max(l.x + l.width, b.x + b.width); l.x = a; l.width = z - a; l.end = b.i; l.words.push(b.i); }
    else out.push({ x: b.x, y: b.y, width: b.width, row: b.row, start: b.i, end: b.i, words: [b.i] });
  }
  return out;
}
// A word on a card: a short slide from the reading side, quick.
export function slide(c, p, q, size, rtl) {
  if (p <= 0 || q >= 1) return false;
  const e = X(p), o = I(q);
  c.globalAlpha *= clamp(p * 3) * (1 - o); c.translate((rtl ? 1 : -1) * ((1 - e) * size * 0.5 - o * size * 0.6), 0);
}

// ---------- the broadcast camera ----------
// World: X across the pitch (-34..34 m), Z from the near goal line (0) to the far one (105). The pitch is drawn once into a canvas
// 400 px wider than the frame, so the camera can pan by sliding it.
export const MARGIN = 200;
export function camera(W, H, T) {
  const C = T.cam, cx = (W + 2 * MARGIN) / 2;
  const proj = (x, z) => [cx + x * C.f / (z + C.z0), C.horizon + C.hf / (z + C.z0)];
  const k = (z) => C.f / (z + C.z0);
  return { proj, k };
}
export function pitch(W, H, T, P) {
  const cam = camera(W, H, T), cv = document.createElement('canvas'); cv.width = W + 2 * MARGIN; cv.height = H;
  const g = cv.getContext('2d'), r = rng(64), p = cam.proj;
  // the stands above the far line: rows of a crowd as specks of the two inks
  g.fillStyle = P.stand; g.fillRect(0, 0, cv.width, H);
  const yFar = p(0, 112)[1];
  for (let i = 0; i < 9000; i++) { const y = r() * yFar; g.fillStyle = rgba(r() < 0.5 ? P.light : P.dark, 0.08 + r() * 0.16); g.fillRect(r() * cv.width, y, 2 + r() * 3, 2 + r() * 3); }
  g.fillStyle = mix(P.dark, P.light, 0.1); g.fillRect(0, yFar - 14, cv.width, 14);
  // run-off and the mown stripes
  const quad = (x0, z0, x1, z1, c) => { const a = p(x0, z0), b = p(x1, z0), cc = p(x1, z1), d = p(x0, z1); g.fillStyle = c; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...cc); g.lineTo(...d); g.closePath(); g.fill(); };
  quad(-60, -6, 60, 112, mix(P.turf, P.dark, 0.25));
  for (let i = 0; i < 20; i++) quad(-34, i * 5.25, 34, (i + 1) * 5.25, i % 2 ? P.turf : P.turf2);
  // lines: straight ones as projected segments, curves sampled; width follows depth
  const seg = (x0, z0, x1, z1) => { const a = p(x0, z0), b = p(x1, z1); g.lineWidth = Math.max(1.5, 0.13 * cam.k((z0 + z1) / 2)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
  const arc = (cxw, czw, rad, a0, a1) => { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = a0 + (a1 - a0) * i / 40, q = p(cxw + Math.cos(u) * rad, czw + Math.sin(u) * rad); i ? g.lineTo(...q) : g.moveTo(...q); } g.lineWidth = Math.max(1.5, 0.13 * cam.k(czw)); g.stroke(); };
  g.strokeStyle = P.line; g.lineCap = 'round';
  seg(-34, 0, 34, 0); seg(-34, 0, -34, 105); seg(34, 0, 34, 105); seg(-34, 52.5, 34, 52.5); seg(-34, 105, 34, 105);
  seg(-20.16, 0, -20.16, 16.5); seg(20.16, 0, 20.16, 16.5); seg(-20.16, 16.5, 20.16, 16.5);
  seg(-9.16, 0, -9.16, 5.5); seg(9.16, 0, 9.16, 5.5); seg(-9.16, 5.5, 9.16, 5.5);
  arc(0, 11, 9.15, 0.93, Math.PI - 0.93); arc(0, 52.5, 9.15, 0, Math.PI * 2);
  g.fillStyle = P.line; for (const z of [11, 52.5]) { const q = p(0, z); g.beginPath(); g.arc(q[0], q[1], 0.25 * cam.k(z), 0, Math.PI * 2); g.fill(); }
  // the far goal, small
  const gp = (x, z, h) => { const q = p(x, z); return [q[0], q[1] - h * cam.k(z)]; };
  g.lineWidth = 3; g.strokeStyle = P.light; g.beginPath(); g.moveTo(...p(-3.66, 105)); g.lineTo(...gp(-3.66, 105, 2.44)); g.lineTo(...gp(3.66, 105, 2.44)); g.lineTo(...p(3.66, 105)); g.stroke();
  // a broadcast picture is never flat: a soft falloff to the corners
  const v = g.createRadialGradient(cv.width / 2, H * 0.55, H * 0.3, cv.width / 2, H * 0.55, H * 0.85); v.addColorStop(0, rgba('#000000', 0)); v.addColorStop(1, rgba('#000000', 0.35));
  g.fillStyle = v; g.fillRect(0, 0, cv.width, H);
  return { cv, cam };
}

// ---------- the passage of play (seconds 0..1.6), the same few seconds reused, one layer deeper each time ----------
const KEYS = {
  A1: [[-8, 36], [-4, 27]], A2: [[11, 31], [6, 13]], A3: [[-19, 25], [-16, 18]], A4: [[2, 42], [1, 34]], A5: [[22, 30], [19, 22]],
  B1: [[-3, 23], [-4, 19]], B2: [[5, 21], [4.5, 19.5]], B3: [[-12, 19], [-11, 16]], B4: [[15, 18], [13, 15]], B5: [[0, 30], [-2, 26]], GK: [[0, 3], [1.5, 4]],
};
export function play(tau) {
  const u = IO(clamp(tau / 1.6)), out = {};
  for (const [id, [[x0, z0], [x1, z1]]] of Object.entries(KEYS)) out[id] = { x: x0 + (x1 - x0) * u, z: z0 + (z1 - z0) * u, team: id[0] === 'A' ? 'A' : 'B', run: u };
  const a1 = out.A1, a2 = out.A2, pass = clamp((tau - 1.15) / 0.45);
  out.ball = pass <= 0 ? { x: a1.x + 0.5, z: a1.z - 0.6 } : { x: a1.x + (a2.x - a1.x) * pass, z: a1.z + (a2.z - a1.z) * pass };
  return out;
}

// The view: draws the pitch and the players at play time tau, with a pan and a punch-in (zoom about a screen point).
// Returns a mapper from world (x, z) to the screen and the px-per-metre there.
export function view(ctx, W, H, field, tau, { pan = 0, zoom = 1, fx = W / 2, fy = H / 2, P }) {
  const { cv, cam } = field; zoom *= 1.28;                          // the broadcast framing: tighter than the whole half
  const to = (x, z) => { const q = cam.proj(x, z); const sx = q[0] - MARGIN + pan, sy = q[1]; return [fx + (sx - fx) * zoom, fy + (sy - fy) * zoom]; };
  ctx.save(); ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy); ctx.drawImage(cv, -MARGIN + pan, 0); ctx.restore();
  const pl = play(tau), list = Object.entries(pl).filter(([id]) => id !== 'ball').sort((a, b) => b[1].z - a[1].z);
  for (const [id, p] of list) {
    const [sx, sy] = to(p.x, p.z), k = cam.k(p.z) * zoom * 1.3, step = Math.sin(p.run * 30 + p.x) * 0.12 * k;
    ctx.fillStyle = rgba('#000000', 0.3); ctx.beginPath(); ctx.ellipse(sx + 0.25 * k, sy, 0.5 * k, 0.16 * k, 0, 0, Math.PI * 2); ctx.fill();
    const shirt = p.team === 'A' ? P.teamA : P.teamB, legs = p.team === 'A' ? mix(P.light, P.dark, 0.55) : mix(P.dark, P.light, 0.35);
    ctx.fillStyle = legs; ctx.fillRect(sx - 0.2 * k + step, sy - 0.85 * k, 0.15 * k, 0.85 * k); ctx.fillRect(sx + 0.05 * k - step, sy - 0.85 * k, 0.15 * k, 0.85 * k);
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.roundRect(sx - 0.3 * k, sy - 1.55 * k, 0.6 * k, 0.75 * k, 0.12 * k); ctx.fill();
    if (p.team === 'B') { ctx.strokeStyle = mix(P.dark, P.light, 0.45); ctx.lineWidth = Math.max(1, 0.05 * k); ctx.stroke(); }
    ctx.fillStyle = mix(P.light, P.dark, 0.3); ctx.beginPath(); ctx.arc(sx, sy - 1.72 * k, 0.15 * k, 0, Math.PI * 2); ctx.fill();
  }
  const b = pl.ball, [bx, by] = to(b.x, b.z), bk = cam.k(b.z) * zoom;
  ctx.fillStyle = P.light; ctx.beginPath(); ctx.arc(bx, by - 0.12 * bk, Math.max(4, 0.22 * bk), 0, Math.PI * 2); ctx.fill();
  return { to, k: (z) => cam.k(z) * zoom, pl };
}

// ---------- the marker ----------
// A hand-drawn stroke through screen points, drawn along its length (p), with a soft shadow so it reads on the turf.
export function pen(ctx, pts, p, color, w, seed = 1) {
  if (p <= 0 || pts.length < 2) return;
  const r = rng(seed), q = [];
  for (let i = 0; i < pts.length; i++) q.push([pts[i][0] + (r() - 0.5) * 2.5, pts[i][1] + (r() - 0.5) * 2.5]);
  const lens = [0]; for (let i = 1; i < q.length; i++) lens.push(lens[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
  const L = lens.at(-1) * clamp(p);
  const trace = () => { ctx.beginPath(); ctx.moveTo(...q[0]); for (let i = 1; i < q.length; i++) { if (lens[i] <= L) ctx.lineTo(...q[i]); else { const f = (L - lens[i - 1]) / (lens[i] - lens[i - 1]); ctx.lineTo(q[i - 1][0] + (q[i][0] - q[i - 1][0]) * f, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * f); break; } } };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba('#000000', 0.35); ctx.lineWidth = w + 3; ctx.translate(2, 3); trace(); ctx.stroke(); ctx.translate(-2, -3);
  ctx.strokeStyle = color; ctx.lineWidth = w; trace(); ctx.stroke();
  ctx.restore();
  return L / lens.at(-1);
}
const curve = (a, b, bend, n = 28) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], cx = mx - dy * bend, cy = my + dx * bend, o = [];
  for (let i = 0; i <= n; i++) { const t = i / n; o.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]); } return o; };
// A curved marker arrow from a to b (screen points); the head appears as the stroke arrives.
export function arrow(ctx, a, b, p, color, w, bend = 0.18, seed = 3) {
  const pts = curve(a, b, bend); pen(ctx, pts, p, color, w, seed);
  if (p < 0.97) return;
  const e = pts.at(-1), f = pts.at(-4), ang = Math.atan2(e[1] - f[1], e[0] - f[0]), h = w * 3.4;
  pen(ctx, [[e[0] - Math.cos(ang - 0.5) * h, e[1] - Math.sin(ang - 0.5) * h], e, [e[0] - Math.cos(ang + 0.5) * h, e[1] - Math.sin(ang + 0.5) * h]], 1, color, w, seed + 1);
}
// A ring on the turf under a player's feet (an ellipse in perspective), drawn round by hand.
export function ring(ctx, x, y, k, p, color, w) {
  if (p <= 0) return;
  const pts = []; for (let i = 0; i <= 40; i++) { const u = -Math.PI / 2 + i / 40 * Math.PI * 2.12; pts.push([x + Math.cos(u) * 0.95 * k, y + Math.sin(u) * 0.34 * k]); }
  pen(ctx, pts, p, color, w, Math.round(x));
}
// A patch of turf (world polygon) shaded with the marker, with a dashed edge.
export function zone(ctx, to, poly, p, color) {
  if (p <= 0) return;
  const s = poly.map(([x, z]) => to(x, z));
  ctx.save(); ctx.beginPath(); s.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.closePath();
  ctx.fillStyle = rgba(color, 0.32 * clamp(p)); ctx.fill();
  ctx.setLineDash([14, 10]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(color, clamp(p)); ctx.stroke(); ctx.restore();
}
// A broadcast card: a dark slab with an accent bar on the reading side, slid in from that side (p) and out the other way (q).
export function card(ctx, x, y, w, h, p, q, P, rtl, bar = 12) {
  if (p <= 0 || q >= 1) return 0;
  const off = (rtl ? 1 : -1) * ((1 - X(p)) * (w + 120) - I(q) * (w + 120));
  ctx.save(); ctx.translate(off, 0);
  ctx.fillStyle = rgba(P.card, 0.93); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = P.accent; ctx.fillRect(rtl ? x + w - bar : x, y, bar, h);
  ctx.restore();
  return off;
}
// The mode chip next to the show's corner mark: ▶ while the play runs, ❚❚ on a freeze, ◀◀ in a rewind, with the source frame count.
export function chip(ctx, mode, frame, P, mono, rtl) {
  const x = rtl ? 70 + 92 : 1010 - 92 - 230, y = 150, w = 230, h = 64;
  ctx.save(); ctx.fillStyle = rgba(P.card, 0.93); ctx.fillRect(x, y, w, h);
  const ix = x + 22, iy = y + 20; ctx.fillStyle = mode === 'live' ? P.light : P.accent;
  if (mode === 'live') { ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + 22, iy + 12); ctx.lineTo(ix, iy + 24); ctx.fill(); }
  else if (mode === 'freeze') { ctx.fillRect(ix, iy, 8, 24); ctx.fillRect(ix + 14, iy, 8, 24); }
  else for (const o of [0, 16]) { ctx.beginPath(); ctx.moveTo(ix + o + 16, iy); ctx.lineTo(ix + o, iy + 12); ctx.lineTo(ix + o + 16, iy + 24); ctx.fill(); }
  ctx.font = `600 24px "${mono}"`; ctx.fillStyle = P.light; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillText('F ' + String(Math.max(0, Math.floor(frame))).padStart(4, '0'), x + 74, y + h / 2 + 1);
  ctx.restore();
}
// The freeze: a punch-in (zoom) and a short lift of the picture's brightness on the frame it stops (one flash per freeze).
export function punch(t, fT) { return 1 + 0.06 * X(clamp((t - fT) / 0.2)); }
export function flash(ctx, W, H, t, fT, P) { const k = 1 - clamp((t - fT) / 0.1); if (t >= fT && k > 0) { ctx.fillStyle = rgba(P.light, 0.14 * k); ctx.fillRect(0, 0, W, H); } }
