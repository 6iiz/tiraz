// Coded Gears: a mechanism coloured like a plate in an atlas. Every part takes the flat colour of the system it belongs to, shaded in
// two flat values (a lit side and a shaded side, lit from the upper left), edged with a deeper tone of the same hue (not
// black), and given a little thickness by a darker copy set behind it. Gears turn by their true tooth ratios. Colour arrives as a dye
// front spreading from the point where the drive enters a part. Gear outlines are built once as paths; a frame only transforms them.
import { clamp, mix, contrast } from '/engine/kit.js';

// A ratchet: motion that arrives in three quick clicks rather than one glide. smooth is used for gears and dye.
export const smooth = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };
export const soft = (p) => 1 - (1 - clamp(p)) ** 3;
export const ratchet = (p, n = 3) => { p = clamp(p) * n; const i = Math.floor(p); return i >= n ? 1 : (i + soft(clamp((p - i) * 2.2))) / n; };

// Ground and type: the lighter brand colour is the plate paper, the darker is ink. Systems: the accent (the part being explained), a
// slate (dark into light), a deep accent (accent into dark) and a light neutral for everything not being discussed.
export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const ink = lum(c.bg) <= lum(c.text) ? c.bg : c.text, paper = ink === c.bg ? c.text : c.bg;
  const on = (h) => (contrast(ink, h) >= contrast(paper, h) ? ink : paper);
  const sys = (base) => ({ fill: base, shade: mix(base, ink, 0.16), line: mix(base, ink, 0.5), side: mix(base, ink, 0.34), on: on(base) });
  return {
    ink, paper, accent: c.accent, ground: mix(paper, ink, 0.04), grey: mix(ink, paper, 0.42),
    A: sys(c.accent), B: sys(mix(ink, paper, 0.42)), C: sys(mix(c.accent, ink, 0.48)), N: sys(mix(paper, ink, 0.13)), P: sys(paper),
  };
}

export function boxes(kit, f, x0, x1, y, align = 'start') {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) { const wl = kit.rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key }); cur = kit.rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function keyRuns(bx) {
  const runs = []; let cur = null;
  bx.forEach((b, i) => {
    if (b.key && cur && cur.row === b.row && cur.last === i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = i; }
    else if (b.key) { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, first: i, last: i }; runs.push(cur); }
    else cur = null;
  });
  return runs;
}

// A word clicks into place like a pawl into a tooth: a small turn and a little scale, taken back in three clicks. It leaves with a
// quick turn the other way. false = nothing to draw.
export function click(c, t, t0, dur, out0, out1, box) {
  const p = clamp((t - t0) / dur); if (p <= 0) return false;
  const q = out1 > out0 ? clamp((t - out0) / (out1 - out0)) : 0; if (q >= 1) return false;
  const r = ratchet(p), cx = box.x + box.width / 2;
  c.globalAlpha *= Math.min(1, p * 5) * (1 - q);
  c.translate(cx, box.y); c.rotate((1 - r) * -0.12 + q * 0.1); const s = 0.88 + 0.12 * r; c.scale(s, s); c.translate(-cx, -box.y);
}

// ---------- gears ----------
// A gear of N teeth with module m (pitch radius m*N/2), its tooth centred on angle 0. Holes: a hub bore and, on bigger wheels, spokes.
export function gearPath(N, m, { bore = 0.22, spokes = true } = {}) {
  const r = m * N / 2, ra = r + m, rd = r - 1.25 * m, p = new Path2D(), step = (Math.PI * 2) / N;
  for (let i = 0; i < N; i++) {
    const a = i * step, pts = [[rd, a - step * 0.5], [rd, a - step * 0.3], [ra, a - step * 0.18], [ra, a + step * 0.18], [rd, a + step * 0.3]];
    pts.forEach(([rr, aa], k) => { const x = rr * Math.cos(aa), y = rr * Math.sin(aa); if (i === 0 && k === 0) p.moveTo(x, y); else p.lineTo(x, y); });
  }
  p.closePath();
  const rb = Math.max(m * 1.2, r * bore); if (bore > 0) { p.moveTo(rb, 0); p.arc(0, 0, rb, 0, Math.PI * 2, true); }
  if (spokes && r > 70) {
    const n = r > 160 ? 6 : 5, rm = (rb + rd) / 2, rh = Math.min((rd - rb) * 0.3, Math.PI * rm / n * 0.62);
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, x = rm * Math.cos(a), y = rm * Math.sin(a); p.moveTo(x + rh, y); p.arc(x, y, rh, 0, Math.PI * 2, true); }
  }
  return { path: p, N, m, r, ra };
}

// Draws one gear: thickness, flat face, shade face (light fixed at the top left whatever the turn), own-colour outline, hub pin.
// dye: { x, y, r } paints the system colour inside a growing circle over the neutral; without it the gear is all system colour.
export function drawGear(ctx, G, x, y, a, S, { neutral = null, dye = null, depth = 9, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const face = (sys) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = sys.fill; ctx.fill(G.path, 'evenodd');
    ctx.clip(G.path, 'evenodd'); ctx.rotate(-a); ctx.fillStyle = sys.shade; ctx.beginPath(); ctx.moveTo(-G.ra * 1.5, G.ra * 0.2); ctx.lineTo(G.ra * 1.5, -G.ra * 0.5); ctx.lineTo(G.ra * 1.5, G.ra * 1.5); ctx.lineTo(-G.ra * 1.5, G.ra * 1.5); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = sys.line; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(G.path); ctx.restore();
  };
  const base = neutral ?? S;
  ctx.save(); ctx.translate(x + depth * 0.55, y + depth); ctx.rotate(a); ctx.fillStyle = base.side; ctx.fill(G.path, 'evenodd'); ctx.restore();
  face(base);
  if (neutral && dye && dye.r > 0) { ctx.save(); ctx.beginPath(); ctx.arc(dye.x, dye.y, dye.r, 0, Math.PI * 2); ctx.clip(); ctx.save(); ctx.translate(x + depth * 0.55, y + depth); ctx.rotate(a); ctx.fillStyle = S.side; ctx.fill(G.path, 'evenodd'); ctx.restore(); face(S); ctx.restore(); }
  ctx.restore();
}

// A train: the first gear at (x, y); each next one meshes with the previous at the angle phi (radians, screen). Returns positions and
// angles(a0): the true turn of every wheel when the first has turned a0.
export function train(m, first, rest) {
  const g = [{ ...first, G: gearPath(first.N, m, first.opt) }];
  for (const w of rest) {
    const prev = g[g.length - 1], G = gearPath(w.N, m, w.opt), d = prev.G.r + G.r;
    g.push({ ...w, G, x: prev.x + d * Math.cos(w.phi), y: prev.y + d * Math.sin(w.phi) });
  }
  const angles = (a0) => {
    const out = [a0 + (first.a ?? 0)];
    for (let i = 1; i < g.length; i++) { const N1 = g[i - 1].N, N2 = g[i].N, phi = g[i].phi; out.push(phi + Math.PI + Math.PI / N2 - (N1 / N2) * (out[i - 1] - phi)); }
    return out;
  };
  return { g, angles };
}

// The key mark: a capsule chip in the accent system, cel-shaded and ringed in its own darker colour, dyed in from the reading side.
export function chip(ctx, pal, run, size, p, rtl) {
  if (p <= 0) return;
  const x0 = run.x0 - size * 0.1, x1 = run.x1 + size * 0.1, y0 = run.y - size * 0.6, h = size * 1.2, rad = size * 0.3, S = pal.A;
  const path = new Path2D(); path.roundRect(x0, y0, x1 - x0, h, rad);
  ctx.save();
  const side = new Path2D(); side.roundRect(x0 + 4, y0 + 7, x1 - x0, h, rad);
  ctx.fillStyle = pal.N.side; ctx.fill(side); ctx.fillStyle = pal.N.fill; ctx.fill(path);
  const ox = rtl ? x1 : x0, R = Math.hypot(x1 - x0, h) * soft(p);
  ctx.beginPath(); ctx.arc(ox, run.y, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = S.side; ctx.fill(side); ctx.fillStyle = S.fill; ctx.fill(path);
  ctx.save(); ctx.clip(path); ctx.fillStyle = S.shade; ctx.fillRect(x0, run.y + h * 0.12, x1 - x0, h); ctx.restore();
  ctx.strokeStyle = S.line; ctx.lineWidth = 3; ctx.stroke(path);
  ctx.restore();
}
// The colour the key words are written in, once the chip under them is dyed.
export const keyInk = (pal, p) => (p >= 0.5 ? pal.A.on : pal.ink);

// A flat plate (a housing) with thickness and an own-colour outline: a backing for text.
export function plate(ctx, S, x, y, w, h, r = 28, depth = 10) {
  const p = new Path2D(); p.roundRect(x, y, w, h, r);
  const s = new Path2D(); s.roundRect(x + depth * 0.55, y + depth, w, h, r);
  ctx.fillStyle = S.side; ctx.fill(s); ctx.fillStyle = S.fill; ctx.fill(p); ctx.strokeStyle = S.line; ctx.lineWidth = 3; ctx.stroke(p);
}
