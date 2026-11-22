// Wind-threads motion: a flow you cannot see, printed as thin ink threads that follow it, with short darker strokes running along
// them at the local speed. The flow always blows from the reading side across the frame. Words are carried in on it: they arrive
// from upwind, settling as they slow, and leave downwind, gathering speed. Text is an obstacle: the threads part round every row,
// so each line of words sits in its own calm. Where the story is, one gust in the accent runs under the key phrase.
// Threads are integrated once per scene in create() and printed to a canvas; per frame only the running strokes are drawn,
// batched into a few paths.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const S = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
export const I = (p) => clamp(p) ** 2.2;

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lum = (c) => contrast(c, '#000000');
  const [light, dark] = lum(bg) >= lum(text) ? [bg, text] : [text, bg];
  const deepen = (c, toward, against, need) => { for (let k = 0; k <= 1.0001; k += 0.05) { const m = mix(c, toward, k); if (contrast(m, against) >= need) return m; } return toward; };
  return {
    paper: light, ink: dark, accent,
    thread: mix(light, dark, T.tone.thread), comet: mix(light, dark, T.tone.comet), grat: mix(light, dark, T.tone.grat),
    lead: mix(light, dark, 1 - T.tone.lead * 0.55), ghost: mix(light, dark, T.tone.ghost),
    key: deepen(accent, dark, light, 4.5), gust: deepen(accent, dark, light, 2.6),
  };
}

export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) { const g = kit.fit(text, { ...o, maxW: w }); if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g; }
  return best;
}

// Rows of a fitted text as they will be drawn (mirrors kit.drawText), with the key phrases merged per row: one gust per phrase.
export function layout(f, { x0, x1, y, align = 'start' }, rtl) {
  const rows = [], runs = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? (rtl ? x1 - row.width : x0) : (rtl ? x0 : x1 - row.width);
    rows.push({ x0: left, x1: left + row.width, y: yy });
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (!run) { run = { x0: wl, x1: wl + w.width, y: yy }; runs.push(run); } run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); } else run = null;
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return { rows, runs };
}
// The calm round a row of text: an ellipse a little larger than the row.
export const calm = (r, size) => ({ cx: (r.x0 + r.x1) / 2, cy: r.y, a: (r.x1 - r.x0) / 2 + size * 0.7 + 30, b: size * 0.95 + 20 });

// The flow: a steady wind from the reading side, a slow meander, a few broad eddies, and every obstacle turning it aside.
export function field({ W, H, rtl, seed = 1, obstacles = [], vortex = null }) {
  const r = rng(seed), dir = rtl ? -1 : 1, eddies = [];
  for (let i = 0; i < 3; i++) eddies.push({ x: r() * W, y: 200 + r() * (H - 400), g: (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5), r0: 220 + r() * 200 });
  const ph = r() * 6.283;
  return (x, y) => {
    let vx = dir * 1.0, vy = 0.32 * Math.sin(x / 300 + y / 520 + ph) + 0.12 * Math.sin(y / 170 - x / 410);
    for (const e of eddies) { const dx = x - e.x, dy = y - e.y, q = dx * dx + dy * dy + e.r0 * e.r0; vx += -dy * e.g * e.r0 / q * 0.9; vy += dx * e.g * e.r0 / q * 0.9; }
    if (vortex) { const dx = x - vortex.x, dy = y - vortex.y, d2 = dx * dx + dy * dy, k = vortex.g * vortex.r * 2 / (d2 / vortex.r + vortex.r); vx = vx * 0.35 - dy / Math.sqrt(d2 + 1) * k; vy = vy * 0.35 + dx / Math.sqrt(d2 + 1) * k; }
    for (const o of obstacles) {
      const u = (x - o.cx) / o.a, w = (y - o.cy) / o.b, d = Math.hypot(u, w);
      if (d > 1.9) continue;
      let nx = u / o.a, ny = w / o.b; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const f = clamp((1.9 - d) / 0.9) ** 0.8, vn = vx * nx + vy * ny;
      if (vn < 0 || d < 1) { vx -= nx * vn * f; vy -= ny * vn * f; }
      if (d < 1.05) { vx += nx * (1.05 - d) * 2.5; vy += ny * (1.05 - d) * 2.5; }
      vx *= 1 + 0.35 * f; vy *= 1 + 0.35 * f;                   // the flow quickens as it squeezes past
    }
    return [vx, vy];
  };
}

// Threads: streamlines from a jittered grid of seeds, integrated both ways at a fixed step, printed once to a canvas.
export function threads({ W, H, pal, T, v, obstacles = [], seed = 3, density = 1 }) {
  const F = T.field, sp = F.spacing / Math.sqrt(density), h = F.h, n = F.steps, r = rng(seed), lines = [];
  const inside = (x, y) => obstacles.some((o) => Math.hypot((x - o.cx) / o.a, (y - o.cy) / o.b) < 1.0);
  const trace = (x, y, s) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      let [ax, ay] = v(x, y); let m = Math.hypot(ax, ay) || 1e-6;
      const mx = x + s * ax / m * h / 2, my = y + s * ay / m * h / 2;
      const [bx, by] = v(mx, my); m = Math.hypot(bx, by) || 1e-6;
      x += s * bx / m * h; y += s * by / m * h;
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) break;
      pts.push([x, y, m]);
    }
    return pts;
  };
  for (let gy = sp / 2; gy < H; gy += sp) for (let gx = sp / 2; gx < W; gx += sp) {
    const x = gx + (r() - 0.5) * sp * 0.9, y = gy + (r() - 0.5) * sp * 0.9;
    if (inside(x, y)) continue;
    const back = trace(x, y, -1).reverse(), fwd = trace(x, y, 1), pts = [...back, [x, y, Math.hypot(...v(x, y))], ...fwd];
    if (pts.length < 8) continue;
    const speed = pts.reduce((s, p) => s + p[2], 0) / pts.length;
    lines.push({ pts, speed, off: r() * 1000, w: 0.9 + r() * 0.7 });
  }
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = pal.thread;
  // a thread is fainter at both ends: print its quarters in two weights
  for (const [alpha, part] of [[0.45, 'ends'], [0.95, 'mid']]) {
    g.globalAlpha = alpha; g.beginPath();
    for (const L of lines) {
      const N = L.pts.length, a = Math.floor(N * 0.22), b = Math.ceil(N * 0.78);
      const segs = part === 'mid' ? [[a, b]] : [[0, a + 1], [b - 1, N]];
      for (const [s0, s1] of segs) { if (s1 - s0 < 2) continue; g.moveTo(L.pts[s0][0], L.pts[s0][1]); for (let i = s0 + 1; i < s1; i++) g.lineTo(L.pts[i][0], L.pts[i][1]); }
    }
    g.lineWidth = 1.3; g.stroke();
  }
  return { cv, lines };
}

// The running strokes: one per thread, moving along it at the thread's speed. Batched into three paths: tails, heads, and the heads
// that fall inside a gust region (printed in the accent). gusts: [{ cx, cy, a, b, k }] with k = 0..1 how lit the gust is.
export function comets(ctx, TH, t, pal, { gusts = [], rate = 1, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  const tails = new Path2D(), heads = new Path2D(), hot = new Path2D(); let anyHot = false;
  for (const L of TH.lines) {
    const N = L.pts.length, len = 9, travel = (L.off + t * (40 + 70 * L.speed) * rate / 6) % (N + len * 2) - len;
    const i1 = Math.floor(travel), i0 = i1 - len;
    if (i1 < 1 || i0 > N - 2) continue;
    const a = Math.max(0, i0), b = Math.min(N - 1, i1), m = Math.max(a, b - 3);
    if (b - a < 1) continue;
    tails.moveTo(L.pts[a][0], L.pts[a][1]); for (let i = a + 1; i <= m; i++) tails.lineTo(L.pts[i][0], L.pts[i][1]);
    const hx = L.pts[b][0], hy = L.pts[b][1];
    const isHot = gusts.some((g) => g.k > 0 && Math.hypot((hx - g.cx) / g.a, (hy - g.cy) / g.b) < 1);
    const P = isHot ? hot : heads; if (isHot) anyHot = true;
    P.moveTo(L.pts[m][0], L.pts[m][1]); for (let i = m + 1; i <= b; i++) P.lineTo(L.pts[i][0], L.pts[i][1]);
  }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.45 * alpha; ctx.strokeStyle = pal.comet; ctx.lineWidth = 1.6; ctx.stroke(tails);
  ctx.globalAlpha = 0.9 * alpha; ctx.lineWidth = 2.6; ctx.stroke(heads);
  if (anyHot) { const k = Math.max(...gusts.map((g) => g.k)); ctx.globalAlpha = alpha * k; ctx.strokeStyle = pal.gust; ctx.lineWidth = 3.2; ctx.stroke(hot); }
  ctx.restore();
}

// A word carried by the wind, inside kit.drawText's `each`. pin: arriving 0..1, pout: leaving 0..1.
export function blow(c, pin, pout, rtl, drift) {
  if (pin <= 0 || pout >= 1) return false;
  const up = rtl ? 1 : -1;                                           // upwind is the reading side
  const dx = up * drift * (1 - E(pin)) - up * drift * 1.6 * I(pout), dy = -10 * (1 - E(pin)) * Math.sin(pin * 9);
  c.globalAlpha *= Math.min(1, pin * 3.5) * (1 - pout);
  c.translate(dx, dy);
}

// The gust under a key phrase: one tapered ribbon in the accent, swelling in the middle, drawn on from upwind. y is its centre line.
export function ribbon(ctx, x0, x1, y, p, out, color, rtl, w = 11) {
  if (p <= 0 || out >= 1) return;
  const e = S(p), n = 40, a = rtl ? x1 + 26 : x0 - 26, b = rtl ? x0 - 26 : x1 + 26, top = [], bot = [];
  for (let i = 0; i <= n * e; i++) {
    const s = i / n, x = a + (b - a) * s, yy = y + Math.sin(s * Math.PI * 1.6) * 5, ww = w * Math.sin(Math.PI * s) ** 0.6 + 0.6;
    top.push([x, yy - ww / 2]); bot.push([x, yy + ww / 2]);
  }
  if (top.length < 2) return;
  ctx.save(); ctx.globalAlpha = 1 - I(out); ctx.fillStyle = color; ctx.beginPath();
  top.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy))); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
