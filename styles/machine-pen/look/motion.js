// Machine-pen motion: a flatbed plotter lays every mark down. One pen at a time moves on a gantry with real machine timing: a
// trapezoid of speed (it accelerates, cruises, brakes), a short drop before ink and a lift after. Words are not faded or slid in: the
// pen rasters each word in back-and-forth passes, so a word is first a ghost of thin hatch lines and then fills solid. Emphasis is a
// band of hatching laid by the accent pen. Nothing leaves by itself: the sheet is fed out of the machine by the joint.
// This file holds what every part shares: the inks, word boxes, the plot program (jobs on a timeline) and the job kinds.
import { clamp, lerp, mix, contrast, span } from '/engine/kit.js';

// Speed profile of one machine move: accelerate over the first quarter, cruise, brake over the last quarter.
export function trap(u) {
  u = clamp(u); const a = 0.25, v = 1 / (1 - a);
  if (u < a) return v * u * u / (2 * a);
  if (u < 1 - a) return v * (a / 2 + (u - a));
  return 1 - v * (1 - u) * (1 - u) / (2 * a);
}

// Inks. The lighter brand colour is the paper and the darker one the ink, whichever is the brand's ground: a plotter draws on paper.
export function inks(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const paper = lightOf(bg) >= lightOf(text) ? bg : text, ink = paper === bg ? text : bg;
  let k = T.tone.grey, grey = mix(ink, paper, k);
  while (k > 0 && contrast(grey, paper) < 4.6) { k -= 0.03; grey = mix(ink, paper, Math.max(0, k)); }
  return {
    paper, ink, grey, accent,
    faint: mix(paper, ink, T.tone.faint), rule: mix(paper, ink, T.tone.rule), steel: mix(paper, ink, T.tone.steel),
    onAccent: contrast(accent, ink) >= contrast(accent, paper) ? ink : paper,
  };
}

// Where kit.drawText puts each word: the same arithmetic, so a part can plan the pen before it draws.
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
// Neighbouring key words on one row are one phrase: one emphasis for the phrase, not one per word.
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

// ---------- the plot program ----------
// jobs: [{ dur, pen: 'ink'|'grey'|'accent', at(q) -> {x,y} (where the pen is at progress q), ... }], laid one after another from
// `start`, each preceded by pen-up travel from where the last one ended. `by`: if given, the whole program is squeezed to end by then
// (the hook is plotted before the first frame). The pen starts at `park` and returns there `rest` seconds after the last job.
export function program(jobs, { start, park, from = park, by = null, travel = 0.04, drop = 0.015, rest = 0.45 }) {
  let t = start, prev = from;
  for (const j of jobs) {
    const a = j.at(0), dist = Math.hypot(a.x - prev.x, a.y - prev.y);
    j.travel = j.after ? 0 : travel + dist / 12000; j.t0 = t + j.travel + drop; j.t1 = j.t0 + j.dur; t = j.t1 + drop; prev = j.at(1);
  }
  if (by != null && t > by && jobs.length) {
    const k = (by - start) / (t - start);
    for (const j of jobs) { j.t0 = start + (j.t0 - start) * k; j.t1 = start + (j.t1 - start) * k; j.travel *= k; }
    t = by;
  }
  const end = t;
  const P = {
    jobs, end, park, start,
    q: (j, time) => span(time, j.t0, j.t1),
    // where the pen is and whether it is down; the gantry follows it
    pen(time) {
      let at0 = from, pen = 'ink';
      for (const j of jobs) {
        if (time < j.t0) {
          const ts = j.t0 - j.travel - drop, u = j.travel > 0 ? (time - ts) / j.travel : 1, to = j.at(0);
          if (time < ts) return { ...at0, down: false, pen };
          const s = trap(u); return { x: lerp(at0.x, to.x, s), y: lerp(at0.y, to.y, s), down: false, pen: j.pen };
        }
        if (time <= j.t1) return { ...j.at(P.q(j, time)), down: true, pen: j.pen };
        at0 = j.at(1); pen = j.pen;
      }
      const s = trap(span(time, end, end + rest));
      return { x: lerp(at0.x, park.x, s), y: lerp(at0.y, park.y, s), down: false, pen: s >= 1 ? 'none' : pen };
    },
  };
  return P;
}

// ---------- job kinds ----------
// A word rastered in back-and-forth passes. box from boxes(); start side = the reading side.
export function wordJob(box, pen, T, rtl, durScale = 1, passes = T.passes) {
  const h = box.size * 1.5, top = box.y - h / 2, n = passes, sh = h / n;
  const a = rtl ? box.x + box.width + 4 : box.x - 4, b = rtl ? box.x - 4 : box.x + box.width + 4;
  return {
    kind: 'word', box, pen, top, n, sh, a, b,
    dur: (T.dur.word + box.width / 8000) * durScale,
    at(q) { const s = Math.min(n - 1, Math.floor(q * n)), f = q >= 1 ? 1 : q * n - s, fw = s % 2 === 0;
      return { x: fw ? lerp(a, b, f) : lerp(b, a, f), y: top + (s + 0.5) * sh }; },
  };
}
// Clip the canvas to the passes laid so far (call inside a word's `each`). Thin hatch passes first, filled solid at the end.
export function rasterClip(c, j, q) {
  if (q <= 0) return false;
  if (q >= 1) return true;
  const s = Math.min(j.n - 1, Math.floor(q * j.n)), f = q * j.n - s, fill = clamp((q - 0.78) / 0.22), th = j.sh * (0.34 + 0.66 * fill);
  const x0 = Math.min(j.a, j.b), x1 = Math.max(j.a, j.b);
  c.beginPath();
  for (let i = 0; i < s; i++) c.rect(x0, j.top + (i + 0.5) * j.sh - th / 2, x1 - x0, th);
  const fw = s % 2 === 0, x = fw ? lerp(j.a, j.b, f) : lerp(j.b, j.a, f), l = Math.min(j.a, x), r = Math.max(j.a, x);
  const ls = fw ? l : Math.min(j.b, x), rs = fw ? r : Math.max(j.b, x);
  c.rect(ls, j.top + (s + 0.5) * j.sh - th / 2, rs - ls, th);
  c.clip();
  return true;
}
// A band of 45-degree hatching laid by a pen inside a rectangle, line by line from the reading side.
export function hatchJob(r, pen, T, rtl, gap = T.hatch.gap) {
  const n = Math.ceil((r.w + r.h) / gap), dur = T.dur.hatch + n * 0.0025;
  const line = (i) => { // the i-th diagonal, clipped to the rectangle, from its upper end down
    const s = rtl ? r.x + r.w - i * gap : r.x + i * gap;     // where the diagonal meets the top edge (may lie outside)
    const dx = rtl ? 1 : -1;                                 // it leans away from the reading side as it goes down
    const ua = (r.x - s) / (dx * r.h), ub = (r.x + r.w - s) / (dx * r.h);
    const u0 = Math.max(0, Math.min(ua, ub)), u1 = Math.min(1, Math.max(ua, ub));
    if (u1 - u0 < 1e-3) return null;
    return [s + dx * r.h * u0, r.y + r.h * u0, s + dx * r.h * u1, r.y + r.h * u1];
  };
  const lines = []; for (let i = 0; i <= n + 1; i++) { const l = line(i); if (l) lines.push(l); }
  const N = lines.length;
  return {
    kind: 'hatch', pen, r, lines, dur,
    at(q) { if (!N) return { x: r.x, y: r.y }; const p = clamp(q) * N, i = Math.min(N - 1, Math.floor(p)), f = q >= 1 ? 1 : p - i, L = lines[i], up = i % 2 === 0;
      return up ? { x: lerp(L[0], L[2], f), y: lerp(L[1], L[3], f) } : { x: lerp(L[2], L[0], f), y: lerp(L[3], L[1], f) }; },
    draw(ctx, q, color, width = T.hatch.width) {
      if (q <= 0 || !N) return;
      const p = clamp(q) * N, k = Math.floor(p);
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < Math.min(N, k); i++) { const L = lines[i]; ctx.moveTo(L[0], L[1]); ctx.lineTo(L[2], L[3]); }
      if (k < N) { const L = lines[k], f = p - k, up = k % 2 === 0;
        if (up) { ctx.moveTo(L[0], L[1]); ctx.lineTo(lerp(L[0], L[2], f), lerp(L[1], L[3], f)); } else { ctx.moveTo(L[2], L[3]); ctx.lineTo(lerp(L[2], L[0], f), lerp(L[3], L[1], f)); } }
      ctx.stroke(); ctx.restore();
    },
  };
}
// A polyline traced at plotting speed (rules, boxes, crosses, ticks). pts: [[x,y], ...]; gaps: indexes where the pen lifts before.
export function strokeJob(pts, pen, T, { speed = T.speed, lifts = [] } = {}) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + (lifts.includes(i) ? 0 : Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  const total = L.at(-1) || 1;
  const at = (q) => { const d = clamp(q) * total; let i = 1; while (i < pts.length - 1 && L[i] < d) i++;
    const f = L[i] === L[i - 1] ? 1 : (d - L[i - 1]) / (L[i] - L[i - 1]); return { x: lerp(pts[i - 1][0], pts[i][0], clamp(f)), y: lerp(pts[i - 1][1], pts[i][1], clamp(f)) }; };
  return {
    kind: 'stroke', pen, pts, dur: T.dur.stroke + total / speed,
    at,
    draw(ctx, q, color, width = T.stroke) {
      if (q <= 0) return;
      const d = clamp(q) * total;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        if (L[i] > d) { const f = (d - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); break; }
        if (lifts.includes(i)) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke(); ctx.restore();
    },
  };
}

// Several programs one after another (a list's rows start on the beat): the pen belongs to the last one that has started.
export function chain(progs) {
  return (time) => { let p = progs[0]; for (const q of progs) if (time >= q.start) p = q; return p.pen(time); };
}
