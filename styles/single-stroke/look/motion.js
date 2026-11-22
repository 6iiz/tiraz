// Single-stroke motion: one ink line that never leaves the paper. Each scene's line comes in at the reading-side edge of the frame at
// one fixed height, runs under the words (they are written as the nib passes), loops once around the key phrase (the only stretch in
// the accent), wanders in the lower margin while the words hold, and leaves at the far edge at the same height, where the next scene's
// line picks it up: the joint pans the paper along with it, so the whole reel is one unbroken line.
// The line is a filled outline (not a stroke) whose width follows the nib's pressure: slow, tight turns are fat, fast straights thin.
import { clamp, lerp, mix, contrast, rng, rgba } from '/engine/kit.js';

export const io = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };

export function inks(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const paper = lightOf(bg) >= lightOf(text) ? bg : text, ink = paper === bg ? text : bg;
  let k = T.tone.grey, grey = mix(ink, paper, k);
  while (k > 0 && contrast(grey, paper) < 4.6) { k -= 0.03; grey = mix(ink, paper, Math.max(0, k)); }
  return { paper, ink, grey, accent, warm: mix(paper, ink, 0.05) };
}

// Where kit.drawText puts each word (same arithmetic), so the line can be planned under them.
export function boxes(f, x0, x1, y, align, rtl) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, start = rtl ? x1 - row.width : x0, end = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? start : end;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, size: f.size });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Neighbouring key words on one row are one phrase, and get one loop.
export function keyGroups(bx) {
  const g = [];
  for (const b of bx) {
    if (!b.key) continue;
    const last = g.at(-1);
    if (last && last.row === b.row && last.lastI === b.i - 1) { last.x0 = Math.min(last.x0, b.x); last.x1 = Math.max(last.x1, b.x + b.width); last.lastI = b.i; }
    else g.push({ x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, lastI: b.i, size: b.size });
  }
  return g;
}

// ---------- the line ----------
// A path is planned as control points; `accent` marks the control points whose stretch is drawn in the accent; `mark(name)` names a
// place on it. build() smooths it (Catmull-Rom), resamples it every ~3 px and works out the nib's width at each sample.
export function planner() {
  const C = [];
  const P = {
    marks: {},
    to(x, y, accent = false) { C.push({ x, y, accent }); return P; },
    mark(name) { P.marks[name] = C.length - 1; return P; },
    last: () => C.at(-1),
    // an ellipse around (cx, cy) from angle a0 (radians, screen coordinates), turning `turns` times in direction dir (1 = clockwise on screen)
    loop(cx, cy, rx, ry, a0, turns, dir, accent = false) {
      const n = Math.max(10, Math.round(28 * turns));
      for (let i = 0; i <= n; i++) { const a = a0 + dir * (i / n) * turns * Math.PI * 2; P.to(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, accent); }
      return P;
    },
    // a cursive garland from (xa, y) to (xb, y): little loops every `step` px
    garland(xa, xb, y, step, h, seed = 1) {
      const r = rng(seed), n = Math.max(1, Math.round(Math.abs(xb - xa) / step)), dir = Math.sign(xb - xa) || 1;
      for (let i = 0; i < n; i++) {
        const x = lerp(xa, xb, (i + 0.5) / n), j = 0.75 + r() * 0.5;
        P.to(x - dir * step * 0.1, y - h * j); P.to(x - dir * step * 0.32, y - h * 0.55 * j); P.to(x - dir * step * 0.05, y + h * 0.08); P.to(x + dir * step * 0.3, y + h * 0.1);
      }
      return P.to(xb, y);
    },
    build(T) {
      const out = { x: [], y: [], s: [], acc: [], at: {} };
      const pt = (i) => C[Math.max(0, Math.min(C.length - 1, i))];
      let s = 0;
      const push = (x, y, a) => { const n = out.x.length; if (n) s += Math.hypot(x - out.x[n - 1], y - out.y[n - 1]); out.x.push(x); out.y.push(y); out.s.push(s); out.acc.push(a); };
      for (let i = 0; i < C.length - 1; i++) {
        for (const [nm, ci] of Object.entries(P.marks)) if (ci === i) out.at[nm] = s;
        const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y), steps = Math.max(1, Math.ceil(len / 3));
        const acc = p1.accent && p2.accent;
        for (let k = 0; k < steps; k++) {
          const u = k / steps, u2 = u * u, u3 = u2 * u;
          const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
          const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
          push(x, y, acc);
        }
      }
      const last = C.at(-1); push(last.x, last.y, false);
      for (const [nm, ci] of Object.entries(P.marks)) if (ci === C.length - 1) out.at[nm] = s;
      out.total = s;
      // nib width: curvature over a short window, plus a slow seeded wobble
      const n = out.x.length, w = new Float32Array(n), r = rng(7), wob = [];
      for (let i = 0; i < n / 40 + 2; i++) wob.push(r());
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 4), b = Math.min(n - 1, i + 4), m = Math.min(n - 1, Math.max(1, i));
        const h1 = Math.atan2(out.y[m] - out.y[a], out.x[m] - out.x[a]), h2 = Math.atan2(out.y[b] - out.y[m], out.x[b] - out.x[m]);
        let turn = Math.abs(h2 - h1); if (turn > Math.PI) turn = 2 * Math.PI - turn;
        const f = i / 40, k = Math.floor(f), wv = lerp(wob[k], wob[k + 1], io(f - k));
        w[i] = T.nib * (0.78 + 0.55 * clamp(turn * 2.2) + (wv - 0.5) * 0.14);
      }
      const L = new Float32Array(n * 2), R = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
        let dx = out.x[b] - out.x[a], dy = out.y[b] - out.y[a]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
        L[2 * i] = out.x[i] - dy * w[i] / 2; L[2 * i + 1] = out.y[i] + dx * w[i] / 2;
        R[2 * i] = out.x[i] + dy * w[i] / 2; R[2 * i + 1] = out.y[i] - dx * w[i] / 2;
      }
      out.w = w; out.L = L; out.R = R; out.n = n;
      // runs of one colour
      out.runs = []; let i0 = 0;
      for (let i = 1; i <= n; i++) if (i === n || out.acc[i] !== out.acc[i0]) { out.runs.push({ i0, i1: Math.min(n - 1, i), acc: out.acc[i0] }); i0 = i; }
      out.indexAt = (sv) => { let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (out.s[m] <= sv) lo = m; else hi = m - 1; } return lo; };
      return out;
    },
  };
  return P;
}

// How far along the line the nib is at time t: keyframes [[t, s], ...], linear between them (the nib's speed changes at each key).
export function headAt(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [ta, sa] = keys[i - 1], [tb, sb] = keys[i]; return lerp(sa, sb, (t - ta) / (tb - ta || 1)); }
  return keys.at(-1)[1];
}
// The time at which the nib reaches s (inverse of headAt).
export function timeAt(keys, s) {
  if (s <= keys[0][1]) return keys[0][0];
  for (let i = 1; i < keys.length; i++) if (s <= keys[i][1]) { const [ta, sa] = keys[i - 1], [tb, sb] = keys[i]; return lerp(ta, tb, (s - sa) / (sb - sa || 1)); }
  return keys.at(-1)[0];
}

// Draw the line from its start up to arc length `upto`; the nib's soft shadow sits at the head while it moves.
export function drawLine(ctx, Ln, upto, K, { shadow = true, blot = false } = {}) {
  if (upto <= 0) return;
  const e = Math.min(Ln.n - 1, Ln.indexAt(upto));
  if (e < 1) return;
  for (const run of Ln.runs) {
    if (run.i0 > e) break;
    const b = Math.min(run.i1, e), a = run.i0 > 0 ? run.i0 - 1 : 0;
    ctx.fillStyle = run.acc ? K.accent : K.ink;
    ctx.beginPath(); ctx.moveTo(Ln.L[2 * a], Ln.L[2 * a + 1]);
    for (let i = a + 1; i <= b; i++) ctx.lineTo(Ln.L[2 * i], Ln.L[2 * i + 1]);
    for (let i = b; i >= a; i--) ctx.lineTo(Ln.R[2 * i], Ln.R[2 * i + 1]);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(Ln.x[b], Ln.y[b], Ln.w[b] / 2, 0, Math.PI * 2); ctx.fill();
    if (a === 0) { ctx.beginPath(); ctx.arc(Ln.x[0], Ln.y[0], Ln.w[0] / 2, 0, Math.PI * 2); ctx.fill(); }
  }
  const hx = Ln.x[e], hy = Ln.y[e];
  if (blot) { ctx.fillStyle = K.ink; ctx.beginPath(); ctx.ellipse(hx, hy + Ln.w[e] * 0.5, Ln.w[e] * 1.25, Ln.w[e] * 1.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (shadow && upto < Ln.total) {
    const sx = hx + 34, sy = hy - 46, g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 70);
    g.addColorStop(0, rgba('#000000', 0.16)); g.addColorStop(1, rgba('#000000', 0));
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.8); ctx.scale(1, 0.42); ctx.translate(-sx, -sy);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 70, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = rgba('#000000', 0.10); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 70, hy - 66); ctx.lineTo(hx + 58, hy - 80); ctx.closePath(); ctx.fill();
  }
}

// A word is written as the nib passes: it is uncovered from its reading side over `dur` seconds from t0.
export function write(c, t, t0, box, size, rtl, dur = 0.18) {
  const p = io((t - t0) / dur);
  if (p <= 0) return false;
  if (p >= 1) return;
  const w = (box.width + size * 0.3) * p, h = size * 1.7;
  c.beginPath(); c.rect(rtl ? box.x + box.width + size * 0.15 - w : box.x - size * 0.15, box.y - h / 2, w, h); c.clip();
}

// ---------- routes the parts share ----------
// Coordinates written for a right-to-left brand go through mx(), which mirrors them for a left-to-right one.
export function line(W, T, rtl) {
  const P = planner(), dir = rtl ? -1 : 1, E = T.edgeY, mx = (x) => (rtl ? x : W - x);
  const X = {
    P, dir, mx,
    enter() { P.to(mx(W + 14), E).mark('in'); return X; },
    // one loop of the accent around a group, entered from below on its reading side
    keyLoop(g, y) {
      const cx = (g.x0 + g.x1) / 2, rx = (g.x1 - g.x0) / 2 + g.size * 0.09, ry = g.size * 0.9;
      P.to(cx - dir * rx * 1.3, y);
      P.loop(cx, g.y, rx, ry, rtl ? 0.35 : Math.PI - 0.35, 1.04, rtl ? -1 : 1, true);
      P.to(cx - dir * rx * 0.25, y);
      return cx - dir * rx * 0.25;
    },
    // run along y from xa to xb in the travel direction, looping around each key group on the way
    under(y, xa, xb, groups = []) {
      const gs = [...groups].sort((a, b) => (rtl ? b.x1 - a.x1 : a.x0 - b.x0));
      let cur = xa; const l = P.last(); if (!l || Math.hypot(l.x - xa, l.y - y) > 1) P.to(xa, y);
      const run = (to) => { const n = Math.max(1, Math.round(Math.abs(to - cur) / 150)); for (let i = 1; i <= n; i++) P.to(lerp(cur, to, i / n), y + (i % 2 ? 3 : -3)); cur = to; };
      for (const g of gs) {
        const cx = (g.x0 + g.x1) / 2, rx = (g.x1 - g.x0) / 2 + g.size * 0.09;
        const before = cx - dir * rx * 1.3;
        if ((before - cur) * dir > 40) run(before - dir * 40);
        cur = X.keyLoop(g, y);
      }
      if ((xb - cur) * dir > 0) run(xb);
      return X;
    },
    // the slow part: down into the lower margin, a garland out towards the reading side, a turn, a garland back, and out at the far edge
    tail(seed = 3) {
      P.to(mx(110), 1330).mark('t0');
      P.garland(mx(150), mx(760), 1400, 118, 42, seed);
      P.to(mx(870), 1440); P.to(mx(895), 1520); P.to(mx(820), 1585);
      P.garland(mx(740), mx(160), 1592, 132, 38, seed + 1);
      P.to(mx(-14), E).mark('out');
      return X;
    },
    // the standard route of a part: in, under the words from the reading side to the far side (looping around key phrases), tail, out
    route(yU, x0, x1, groups, seed) {
      const xs = rtl ? x1 + 34 : x0 - 34, xe = rtl ? x0 - 30 : x1 + 30;
      X.enter(); P.to(mx(1050), (E + yU) / 2 + 60); P.to(xs, yU).mark('u0');
      X.under(yU, xs, xe, groups); P.mark('u1');
      return X.tail(seed);
    },
    build: (t) => P.build(t),
  };
  return X;
}
// Arc length where the line first passes under a word's reading-side edge, between the marks u0 and u1.
export function crossing(L, b, rtl, from = 'u0', to = 'u1') {
  const i0 = L.indexAt(L.at[from] ?? 0), i1 = L.indexAt(L.at[to] ?? L.total), edge = rtl ? b.x + b.width : b.x;
  for (let i = i0; i <= i1; i++) if (rtl ? L.x[i] <= edge : L.x[i] >= edge) return L.s[i];
  return L.s[i0];
}
