// Card-glide motion and the pieces every part shares. The world is a desk seen from above at a low warm sun: paper cards a few
// millimetres thick with an interface printed on them, and one small voxel toy (a sprite made of bevelled cubes) that hops between
// them on the beat. The camera glides: each scene is a place on the desk the camera arrives at (a long eased glide that settles
// before the words matter), and the joint whips it on to the next place. Print never animates in: it is printed. What moves is the
// camera, the toy, and what pops up out of a card (the key chip, data cubes).
import { clamp, ease, mix, rgba, contrast, rr, lerp, span } from '/engine/kit.js';

export const E = ease.outCubic;              // a glide settling
export const IO = ease.inOutCubic;           // a crane or a pull-back
export const POP = (p) => { p = clamp(p); const s = 1.2; return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2; };   // a pop, a small overshoot

// Colours from the brand only. The lighter brand colour is the paper and the desk light; the darker one is ink and shadow.
export function tones(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  const on = (f) => (contrast(f, light) >= contrast(f, dark) ? light : dark);
  let k = T.tone.grey, grey = mix(dark, light, k);
  while (contrast(grey, light) < 4.6 && k > 0) { k -= 0.04; grey = mix(dark, light, Math.max(0, k)); }
  return {
    light, dark, accent, on, grey, paper: light, ink: dark, onAccent: on(accent),
    desk: mix(light, dark, T.tone.desk), plank: mix(light, dark, T.tone.desk + 0.05), edge: mix(light, dark, T.tone.edge),
    print: mix(light, dark, T.tone.print), dot: mix(light, dark, T.tone.dot), chipEdge: mix(accent, dark, 0.38),
    shade: (a) => rgba(dark, a),
  };
}

// A card: a rounded paper slab with a visible thickness on its lower edge and a long soft shadow thrown down and to the right (the sun
// is low behind and to the left). lift 0 = lying on the desk, 1 = held up a little (the shadow grows and softens).
export function card(ctx, P, x, y, w, h, { lift = 0, r = 26, fill = P.paper, edge = P.edge, thick = 10, shadow = 1 } = {}) {
  const L = 16 + 54 * lift;
  if (shadow > 0) {
    ctx.save(); ctx.shadowColor = P.shade(0.26 * shadow); ctx.shadowBlur = 16 + 26 * lift; ctx.shadowOffsetX = L * 0.85; ctx.shadowOffsetY = L * 1.15;
    ctx.fillStyle = edge; rr(ctx, x, y + thick, w, h, r); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = edge; rr(ctx, x, y + thick, w, h, r); ctx.fill();
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill();
}

// The interface printed on a card's head: a row of print bars on the reading side and three small dots on the far side, a hairline under
// them. Generic on purpose: no real app, no real icons. Returns the height used.
export function printHead(ctx, P, x, y, w, rtl, brand, logo = true) {
  const h = 58, ym = y + h / 2;
  ctx.fillStyle = P.print;
  const s = 26, lx = rtl ? x + w - 34 - s : x + 34;
  if (logo) brand.logo.small(ctx, lx, ym - s / 2, s, P.grey); else { rr(ctx, lx, ym - s / 2, s, s, 7); ctx.fill(); }
  const bx = rtl ? lx - 18 - 150 : lx + s + 18;
  rr(ctx, bx, ym - 6, 150, 12, 6); ctx.fill();
  for (let i = 0; i < 3; i++) { const dx = rtl ? x + 34 + i * 22 : x + w - 34 - i * 22; ctx.beginPath(); ctx.arc(dx, ym, 6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillRect(x + 24, y + h, w - 48, 2);
  return h + 2;
}
// A row of printed control pills along a card's foot.
export function printFoot(ctx, P, x, y, w, rtl, n = 3, hi = -1) {
  const pw = 96, gap = 16;
  for (let i = 0; i < n; i++) {
    const px = rtl ? x + w - 34 - pw - i * (pw + gap) : x + 34 + i * (pw + gap);
    ctx.fillStyle = i === hi ? P.accent : P.print; rr(ctx, px, y, pw, 26, 13); ctx.fill();
  }
}

// Where the key words of a fitted text are, joined into one span per row: a multi-word key phrase is one emphasis, not one per word.
// Mirrors kit.drawText's placement. Returns [{ x0, x1, y, row }].
export function keySpans(f, x0, x1, y, align, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left, open = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (open) { open.x0 = Math.min(open.x0, wl); open.x1 = Math.max(open.x1, wl + w.width); } else { open = { x0: wl, x1: wl + w.width, y: yy, row: r }; out.push(open); } }
      else open = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}

// The key chip: a slab of the accent that has popped up out of the card under the key phrase. p: 0 flat .. 1 up; sq: a squash (a stomp).
export function chip(ctx, P, s, size, p, sq = 0, space = size * 0.4) {
  if (p <= 0) return;
  const padX = Math.min(size * 0.18, space * 0.5), h = size * 1.22, x = s.x0 - padX, w = s.x1 - s.x0 + padX * 2, y = s.y - h / 2 + size * 0.03;
  const up = POP(p), th = 9 * up * (1 - sq * 0.6);
  ctx.save();
  ctx.shadowColor = P.shade(0.3 * up); ctx.shadowBlur = 10; ctx.shadowOffsetX = 10 * up; ctx.shadowOffsetY = 14 * up;
  ctx.fillStyle = P.chipEdge; rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.restore();
  ctx.fillStyle = P.accent; rr(ctx, x, y - th, w, h, 12); ctx.fill();
  return th;
}

// An impact ring: a thin accent ellipse spreading over the paper from a landing, gone in about 0.8 s.
export function ring(ctx, P, x, y, age) {
  if (age < 0 || age > 0.8) return;
  const q = E(age / 0.8);
  ctx.save(); ctx.globalAlpha = 1 - q; ctx.strokeStyle = P.accent; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(x, y, 30 + 90 * q, (30 + 90 * q) * 0.32, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

// ---------- the voxel toy ----------
// A small cube robot drawn from a pixel map: b body (accent), d darker body, e eyes (ink, standing proud), l the antenna's lamp (paper).
const MAP = [
  '....ll....',
  '....dd....',
  '.bbbbbbbb.',
  'bbbbbbbbbb',
  'bbeebbeebb',
  'bbeebbeebb',
  'bbbbbbbbbb',
  'bbbddddbbb',
  'bbbbbbbbbb',
  '.bbbbbbbb.',
  '.dd....dd.',
  '.dd....dd.',
];
export function toy(brand, P, px = 10) {
  const cols = MAP[0].length, rows = MAP.length, pad = 8, W = cols * px + pad * 2, H = rows * px + pad * 2;
  const make = (blink) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const colour = { b: P.accent, d: mix(P.accent, P.dark, 0.3), e: P.dark, l: P.light };
    const cells = [];
    MAP.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      let k = ch; if (blink && k === 'e' && j === 4) k = 'b';
      cells.push({ i, j, k });
    }));
    // depth first (an extrusion down and to the right), then faces with a bevel: lit top-left, shaded bottom-right
    for (const { i, j, k } of cells) { g.fillStyle = mix(colour[k], P.dark, 0.45); g.fillRect(pad + i * px + 3, pad + j * px + 4, px, px); }
    for (const { i, j, k } of cells) {
      const x = pad + i * px - (k === 'e' ? 2 : 0), y = pad + j * px - (k === 'e' ? 2 : 0);
      g.fillStyle = colour[k]; g.fillRect(x, y, px, px);
      g.fillStyle = mix(colour[k], P.light, 0.35); g.fillRect(x, y, px, 2); g.fillRect(x, y, 2, px);
      g.fillStyle = mix(colour[k], P.dark, 0.3); g.fillRect(x, y + px - 2, px, 2); g.fillRect(x + px - 2, y, 2, px);
    }
    return c;
  };
  const shadow = document.createElement('canvas'); shadow.width = W + 40; shadow.height = H + 40;
  { const g = shadow.getContext('2d'); g.filter = 'blur(5px)'; g.globalCompositeOperation = 'source-over';
    const m = make(false), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
    tg.drawImage(m, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = P.shade(0.3); tg.fillRect(0, 0, W, H);
    g.drawImage(tmp, 20, 20); }
  return { open: make(false), shut: make(true), shadow, W, H, pad, px };
}

// Where the toy is at time t, given its stops [{ t, x, y }]: it waits at a stop, then hops to the next one (an anticipation crouch,
// an arc, a landing squash). y is the line its feet stand on. Returns { x, y, air, sq, landed } (landed: seconds since the last landing).
export function track(stops, t, hop = 0.3, height = 90) {
  let x = stops[0].x, y = stops[0].y, air = 0, sq = 0, landed = 99;
  for (let i = 1; i < stops.length; i++) {
    const s = stops[i], a = stops[i - 1];
    if (t < s.t - 0.08) break;
    const crouch = span(t, s.t - 0.08, s.t), p = span(t, s.t, s.t + hop);
    if (p <= 0) { sq = 0.18 * Math.sin(crouch * Math.PI); x = a.x; y = a.y; continue; }
    if (p < 1) { const e = IO(p); x = lerp(a.x, s.x, e); y = lerp(a.y, s.y, e); air = Math.sin(p * Math.PI) * (s.height ?? height); sq = -0.12 * Math.sin(p * Math.PI); landed = 99; continue; }
    x = s.x; y = s.y; air = 0; landed = t - (s.t + hop); sq = landed < 0.3 ? 0.22 * Math.exp(-landed * 12) * Math.cos(landed * 30) : 0;
  }
  return { x, y, air, sq, landed };
}

// Draws the toy with its feet at (x, y). e: 0 a flat sticker lying on the card .. 1 a standing toy. Blinks now and then from time.
export function drawToy(ctx, S, x, y, { air = 0, sq = 0, e = 1, time = 0, flip = false, scale = 1 } = {}) {
  if (e < 0) return;
  const blink = (time % 2.3) > 2.18 || (time % 3.7) > 3.6;
  const w = S.W * scale, h = S.H * scale, ph = 0.16 + 0.84 * POP(e);
  // the shadow: the silhouette laid flat on the desk, thrown down-right, shrinking while the toy is in the air
  const far = 1 / (1 + air / 140);
  ctx.save(); ctx.globalAlpha = Math.min(1, 0.2 + e) * far; ctx.translate(x, y); ctx.transform(1, 0, 0.9, -0.42 * ph, 0, 0);
  ctx.drawImage(S.shadow, -w / 2 - 20 * scale, -20 * scale - S.pad * scale, (S.W + 40) * scale, (S.H + 40) * scale); ctx.restore();
  ctx.save(); ctx.translate(x, y - air); ctx.scale((flip ? -1 : 1) * (1 + sq * 0.6), ph * (1 - sq));
  ctx.drawImage(blink ? S.shut : S.open, -w / 2, -h + S.pad * scale, w, h); ctx.restore();
}

// The camera of a scene: it glides in to this place on the desk (a long settle that ends before the words matter), then creeps.
// Apply it around everything the scene draws, ground included. rtl: the glide comes from the reading side.
export function camera(ctx, W, H, t, at, rtl, from = 1) {
  const p = E(span(t, at, at + 0.75)), dx = 0, dy = 70 * (1 - p) * from;
  const s = 1 - 0.06 * (1 - p) * from + 0.004 * Math.max(0, t - at), drift = (rtl ? -1 : 1) * 3 * Math.max(0, t - at);
  ctx.translate(W / 2 + dx + drift, H / 2 + dy); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
}
