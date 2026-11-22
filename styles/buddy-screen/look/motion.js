// Buddy-screen motion and shared pieces. The look is a screen walkthrough: one high-resolution app window floating on a soft wallpaper,
// a cursor that is the user, and a low-resolution pixel buddy that is the software. Two resolutions clash on purpose: the window and
// its type are smooth and sharp; the buddy is a hard-edged sprite of big square pixels whose position snaps to its own pixel grid, so
// it moves in steps. The buddy only stands on top of something the interface really has (a field, a bar, a box, a row).
// The camera is a screen recorder's auto-zoom: it pushes in a few percent towards where the action is, and drifts back.
import { clamp, ease, mix, rgba, contrast, rr, lerp, span } from '/engine/kit.js';

export const E = ease.outCubic, IO = ease.inOutCubic;
// The cursor's motion: a spring-damped glide that settles without a visible overshoot.
export const GLIDE = (p) => { p = clamp(p); return p >= 1 ? 1 : 1 - Math.exp(-7 * p) * (1 + 7 * p) * (1 - p); };

export function tones(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  const on = (f) => (contrast(f, light) >= contrast(f, dark) ? light : dark);
  let k = T.tone.grey, grey = mix(dark, light, k);
  while (contrast(grey, light) < 4.6 && k > 0) { k -= 0.04; grey = mix(dark, light, Math.max(0, k)); }
  return {
    light, dark, accent, on, grey, onAccent: on(accent), win: light, ink: dark,
    chrome: mix(light, dark, T.tone.chrome), line: mix(light, dark, T.tone.line), ui: mix(light, dark, T.tone.ui),
    wallA: mix(dark, accent, T.tone.wall), wallB: mix(dark, light, 0.06), tint: mix(light, accent, 0.16), old: mix(light, dark, 0.06),
    shade: (a) => rgba(dark, a),
  };
}

// Where key words are, one span per key phrase per row (adjacent key words join). Mirrors kit.drawText's placement.
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
// A text selection behind a key phrase: a flat accent box, the interface's own highlight. p grows it from the reading side.
export function select(ctx, P, s, f, p, rtl, pulse = 0) {
  if (p <= 0) return;
  const pad = Math.min(f.size * 0.14, f.space * 0.45), h = f.size * 1.26, w = (s.x1 - s.x0 + pad * 2) * clamp(p), x = rtl ? s.x1 + pad - w : s.x0 - pad;
  ctx.fillStyle = P.accent; rr(ctx, x, s.y - h / 2 + f.size * 0.04 + pulse * 6, w, h - pulse * 6, 8); ctx.fill();
}

// ---------- the window ----------
export const WIN = { x: 36, y: 186, w: 1008, h: 1150, r: 26, bar: 66, tool: 58, status: 44 };
export function windowFrame(ctx, P, brand, rtl, t, chapter = 0) {
  const { x, y, w, h, r, bar, tool, status } = WIN;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
  ctx.fillStyle = P.win; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
  ctx.fillStyle = P.chrome; ctx.fillRect(x, y, w, bar);
  ctx.fillStyle = P.line; ctx.fillRect(x, y + bar, w, 2); ctx.fillRect(x, y + bar + tool, w, 2);
  // title bar: the brand's mark and a tab on the reading side, plain window buttons (three outlined squares) on the far side
  const s = 30, lx = rtl ? x + w - 30 - s : x + 30;
  brand.logo.small(ctx, lx, y + bar / 2 - s / 2, s, P.ink);
  ctx.fillStyle = P.win; const tw = 230, tx = rtl ? lx - 20 - tw : lx + s + 20; rr(ctx, tx, y + 14, tw, bar - 14, 12); ctx.fill(); ctx.fillRect(tx, y + bar - 12, tw, 14);
  ctx.fillStyle = P.ui; rr(ctx, rtl ? tx + tw - 24 - 130 : tx + 24, y + bar / 2 + 1, 130, 12, 6); ctx.fill();
  ctx.strokeStyle = P.ui; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) { const bx = rtl ? x + 28 + i * 34 : x + w - 28 - 20 - i * 34; ctx.strokeRect(bx, y + bar / 2 - 10, 20, 20); }
  // toolbar: icon slots and a search field
  ctx.fillStyle = P.chrome;
  for (let i = 0; i < 5; i++) { const ix = rtl ? x + w - 34 - 36 - i * 56 : x + 34 + i * 56; rr(ctx, ix, y + bar + 12, 36, 36, 9); ctx.fill(); }
  ctx.fillStyle = P.chrome; rr(ctx, rtl ? x + 34 : x + w - 34 - 300, y + bar + 12, 300, 36, 18); ctx.fill();
  // status bar: chapter dots and a hairline
  ctx.fillStyle = P.chrome; ctx.fillRect(x, y + h - status, w, status); ctx.fillStyle = P.line; ctx.fillRect(x, y + h - status, w, 2);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i === chapter ? P.accent : P.ui; const cx = rtl ? x + w - 40 - i * 26 : x + 40 + i * 26; ctx.beginPath(); ctx.arc(cx, y + h - status / 2 + 1, 7, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
export const content = () => ({ x0: WIN.x + 60, x1: WIN.x + WIN.w - 60, y0: WIN.y + WIN.bar + WIN.tool + 40, y1: WIN.y + WIN.h - WIN.status - 30 });

// The recorder's zoom: scale about (fx, fy). Kept small so text stays inside the safe area.
export function zoom(ctx, W, H, k, fx, fy) { ctx.translate(fx, fy); ctx.scale(k, k); ctx.translate(-fx, -fy); }

// ---------- the cursor (the user) ----------
const ARROW = new Path2D('M0 0 L0 38 L10 29 L17 45 L24 42 L17 27 L30 27 Z');
// path: [{ t, x, y }] glides between points; clicks: [t, …] each a short press and a ripple.
export function cursor(ctx, P, path, clicks, t) {
  let x = path[0].x, y = path[0].y;
  for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; const p = GLIDE(span(t, a.t, b.t)); if (t >= a.t) { x = lerp(a.x, b.x, p); y = lerp(a.y, b.y, p); } }
  let press = 0;
  for (const c of clicks) {
    const age = t - c;
    if (age >= 0 && age < 0.5) { const q = age / 0.5; ctx.save(); ctx.globalAlpha = 1 - q; ctx.strokeStyle = P.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 12 + 40 * E(q), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (age >= 0 && age < 0.14) press = Math.max(press, Math.sin(age / 0.14 * Math.PI));
  }
  const s = 1.25 * (1 - 0.15 * press);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = P.dark; ctx.fill(ARROW); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = P.light; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke(ARROW); ctx.restore();
  return { x, y };
}

// ---------- the pixel buddy (the software) ----------
const BODY = ['..b......b..', '..bb....bb..', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbbeebbeebbb', 'bbbeebbeebbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', '.bbbbbbbbbb.'];
const FEET = ['..bb....bb..', '.bb......bb.'];
export function buddy(P, px) {
  const make = (pose) => {
    const cols = 14, rows = 10, c = document.createElement('canvas'); c.width = cols * px; c.height = rows * px; const g = c.getContext('2d');
    const put = (i, j, col) => { g.fillStyle = col; g.fillRect(i * px, j * px, px, px); };
    BODY.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      let col = P.accent;
      if (ch === 'e') {
        const happy = pose.eyes === 'happy', eye = happy ? j === 5 : true;
        col = eye ? P.dark : P.accent;
        if (!happy && j === 4 && (i === 3 || i === 7) && pose.look !== 1) col = P.light;
        if (!happy && j === 4 && (i === 4 || i === 8) && pose.look === 1) col = P.light;
      }
      put(i + 1, j, col);
    }));
    [...FEET[pose.step % 2]].forEach((ch, i) => { if (ch === 'b') put(i + 1, 9, mix(P.accent, P.dark, 0.35)); });
    const arm = mix(P.accent, P.dark, 0.2);
    if (pose.arms === 'up') { put(0, 1, arm); put(0, 2, arm); put(13, 1, arm); put(13, 2, arm); }
    else if (pose.arms === 'wave') { put(0, 5, arm); put(0, 6, arm); put(13, 1, arm); put(13, 2, arm); }
    else { put(0, 5, arm); put(0, 6, arm); put(13, 5, arm); put(13, 6, arm); }
    return c;
  };
  const poses = {};
  for (const eyes of ['open', 'happy']) for (const arms of ['down', 'up', 'wave']) for (const step of [0, 1]) for (const look of [0, 1]) poses[`${eyes}-${arms}-${step}-${look}`] = make({ eyes, arms, step, look });
  return { poses, W: 14 * px, H: 10 * px, px };
}

// Where the buddy is at time t. stops: [{ t, x, y, how: 'run' | 'jump', height? }]. A run is flat with alternating feet; a jump has a
// crouch, a stretched take-off, an arc and a landing squash. Returns { x, y, air, sq, step, landed, moving }.
export function act(stops, t, dur = 0.34) {
  let x = stops[0].x, y = stops[0].y, air = 0, sq = 0, step = 0, landed = 99, moving = false;
  for (let i = 1; i < stops.length; i++) {
    const s = stops[i], a = stops[i - 1], d = s.dur ?? dur;
    if (t < s.t - 0.1) break;
    if (s.how === 'run') {
      const p = span(t, s.t, s.t + d);
      x = lerp(a.x, s.x, p); y = lerp(a.y, s.y, p); air = 0; sq = 0; moving = p > 0 && p < 1; step = moving ? Math.floor(t / 0.08) % 2 : 0;
      if (p >= 1) landed = 99; continue;
    }
    const crouch = span(t, s.t - 0.1, s.t), p = span(t, s.t, s.t + d);
    if (p <= 0) { sq = 0.25 * Math.sin(crouch * Math.PI / 2); x = a.x; y = a.y; continue; }
    if (p < 1) { const e = IO(p); x = lerp(a.x, s.x, e); y = lerp(a.y, s.y, p); air = Math.sin(p * Math.PI) * (s.height ?? 110) + (a.y - s.y) * 0 ; sq = p < 0.3 ? -0.2 : 0; moving = true; landed = 99; continue; }
    x = s.x; y = s.y; air = 0; landed = t - (s.t + d); sq = landed < 0.35 ? 0.25 * Math.exp(-landed * 10) * Math.cos(landed * 26) : 0; moving = false;
  }
  return { x, y, air, sq, step, landed, moving };
}
// Draws the buddy with its feet on (x, y), snapped to its pixel grid. Landing dust: four pixels thrown out sideways.
export function drawBuddy(ctx, B, P, b, { eyes = 'open', arms = 'down', look = 0, flip = false, time = 0 } = {}) {
  const px = B.px, snap = (v) => Math.round(v / (px / 2)) * (px / 2);
  const blink = eyes === 'open' && (time % 2.9) > 2.78;
  const img = B.poses[`${blink ? 'happy' : eyes}-${arms}-${b.step}-${look}`];
  const sy = Math.round(B.H * (1 - b.sq) / px) * px / B.H, sx = 1 + (1 - sy) * 0.7;
  const x = snap(b.x), y = snap(b.y - b.air);
  if (b.landed >= 0 && b.landed < 0.4) {
    const q = b.landed / 0.4; ctx.fillStyle = P.ui;
    for (const k of [-1, 1]) for (const j of [0, 1]) ctx.fillRect(snap(x + k * (B.W / 2 + 6 + q * 40 + j * 14)) - px / 2, snap(y - px - q * 18 - j * 10), px, px);
  }
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(x, y); ctx.scale((flip ? -1 : 1) * sx, sy);
  ctx.drawImage(img, -B.W / 2, -B.H, B.W, B.H); ctx.restore();
}
