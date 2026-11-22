// Blob World: a crowd of small round flocked characters (Pips) living on a printed paper board seen from slightly above. A Pip moves
// only by hopping: a squash before it leaves, a stretch in the air, a squash when it lands, a soft shadow that shrinks as it rises.
// Every Pip follows a plan made once from a seed (hops and pauses with times), so a frame is a pure function of time.
import { clamp, mix, contrast, rng, lerp } from '/engine/kit.js';

export const soft = (p) => 1 - (1 - clamp(p)) ** 3;
export const inout = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };

export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(c.bg) >= lum(c.text) ? c.bg : c.text, dark = light === c.bg ? c.text : c.bg, acc = c.accent;
  const onAcc = contrast(light, acc) >= contrast(dark, acc) ? light : dark;
  return {
    paper: light, ink: dark, acc, onAcc,
    table: mix(light, dark, 0.13), grid: mix(light, dark, 0.07), gridB: mix(light, dark, 0.13), grey: mix(light, dark, 0.5),
    bodies: [acc, mix(acc, light, 0.32), mix(acc, dark, 0.22), mix(acc, light, 0.55)],
  };
}

// ---- Pip sprites: one small canvas per body tone and expression, drawn once
const SPR = 180, U = 100;                  // canvas size; a Pip is U units wide at scale 1 (its feet at the canvas's y = 150)
const FOOT = 150;
function body(g) {
  g.beginPath(); g.moveTo(-50, -6);
  g.bezierCurveTo(-64, -40, -46, -86, 0, -86); g.bezierCurveTo(46, -86, 64, -40, 50, -6);
  g.quadraticCurveTo(48, 0, 40, 0); g.lineTo(-40, 0); g.quadraticCurveTo(-48, 0, -50, -6); g.closePath();
}
export function sprites(P) {
  const out = [];
  P.bodies.forEach((tone, b) => {
    out[b] = {};
    for (const ex of ['open', 'blink', 'happy']) {
      const cv = document.createElement('canvas'); cv.width = SPR; cv.height = SPR;
      const g = cv.getContext('2d'); g.translate(SPR / 2, FOOT);
      g.fillStyle = mix(tone, P.ink, 0.3); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 20 + 6, -2, 15, 8, 0, 0, Math.PI * 2); g.fill(); }
      body(g);
      const gr = g.createRadialGradient(-18, -62, 6, -4, -40, 70);
      gr.addColorStop(0, mix(tone, P.paper, 0.38)); gr.addColorStop(0.55, tone); gr.addColorStop(1, mix(tone, P.ink, 0.3));
      g.fillStyle = gr; g.fill();
      // flocked rim: a soft lighter edge on top
      g.save(); body(g); g.clip(); g.strokeStyle = mix(tone, P.paper, 0.5); g.globalAlpha = 0.35; g.lineWidth = 6; g.translate(0, 3); body(g); g.stroke(); g.restore();
      // tuft
      g.strokeStyle = mix(tone, P.ink, 0.15); g.lineCap = 'round'; g.lineWidth = 7; g.beginPath(); g.moveTo(-2, -88); g.bezierCurveTo(-4, -104, 12, -108, 13, -98); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.arc(9, -99, 4, 0, Math.PI * 2); g.stroke();
      // cheeks
      g.fillStyle = mix(tone, P.paper, 0.5); g.globalAlpha = 0.7;
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 28 + 5, -36, 9, 5.5, 0, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;
      // eyes and mouth, looking a little to the right (the sprite is mirrored to face left)
      const eyeY = -52;
      if (ex === 'open') for (const s of [-1, 1]) {
        g.fillStyle = P.ink; g.beginPath(); g.ellipse(s * 15 + 6, eyeY, 6.5, 9.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = P.paper; g.beginPath(); g.arc(s * 15 + 8, eyeY - 4, 2.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(s * 15 + 4, eyeY + 3, 1.3, 0, Math.PI * 2); g.fill();
      } else {
        g.strokeStyle = P.ink; g.lineWidth = 4.5; g.lineCap = 'round';
        for (const s of [-1, 1]) { g.beginPath(); if (ex === 'happy') g.arc(s * 15 + 6, eyeY + 4, 7, Math.PI * 1.1, Math.PI * 1.9); else { g.moveTo(s * 15, eyeY + 1); g.lineTo(s * 15 + 12, eyeY + 1); } g.stroke(); }
      }
      g.strokeStyle = P.ink; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath();
      if (ex === 'happy') { g.fillStyle = P.ink; g.arc(6, -36, 6, 0, Math.PI); g.closePath(); g.fill(); }
      else { g.arc(6, -38, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      out[b][ex] = cv;
    }
  });
  return out;
}

// ---- a Pip's plan: hops and pauses, built once
export class Plan {
  constructor(x, y, t = -10) { this.legs = []; this.x = x; this.y = y; this.t = t; this.x0 = x; this.y0 = y; }
  hop(x, y, { n, per = 0.26, h = 34, at, happy = false } = {}) {
    const t0 = at ?? this.t, d = Math.hypot(x - this.x, y - this.y), k = n ?? Math.max(1, Math.round(d / 80));
    this.legs.push({ t0, t1: t0 + k * per, x0: this.x, y0: this.y, x1: x, y1: y, n: k, h, happy });
    this.x = x; this.y = y; this.t = t0 + k * per; return this;
  }
  wait(s) { this.t += s; return this; }
}
// Wanders inside a box until tEnd: pauses, then a few hops to a nearby point.
export function wander(plan, r, box, tEnd, reach = 170) {
  let guard = 0;
  while (plan.t < tEnd && guard++ < 60) {
    plan.wait(0.35 + r() * 1.0);
    const x = clamp(plan.x + (r() * 2 - 1) * reach, box.x0, box.x1), y = clamp(plan.y + (r() * 2 - 1) * reach * 0.6, box.y0, box.y1);
    plan.hop(x, y, { per: 0.22 + r() * 0.08, h: 22 + r() * 18 });
  }
  return plan;
}
// Where a Pip is at time t: { x, y (feet), lift, sq (+ stretch / - squash), face (1 right, -1 left), happy, moving }
export function state(plan, t, seed = 0) {
  let leg = null; for (const l of plan.legs) if (l.t0 <= t) leg = l; else break;
  const breathe = 0.025 * Math.sin(t * 3.6 + seed * 2.1);
  if (!leg) { const f = plan.legs[0]; return { x: plan.x0, y: plan.y0, lift: 0, sq: breathe, face: f && f.x1 < f.x0 ? -1 : 1, happy: false }; }
  const face = Math.abs(leg.x1 - leg.x0) < 2 ? (seed % 2 ? 1 : -1) : leg.x1 < leg.x0 ? -1 : 1;
  if (t < leg.t1) {
    const u = (t - leg.t0) / (leg.t1 - leg.t0) * leg.n, i = Math.min(leg.n - 1, Math.floor(u)), ph = u - i;
    const p = (i + inout(ph)) / leg.n;
    const sq = ph < 0.14 ? -0.2 * (1 - ph / 0.14) * (i === 0 ? 1 : 0.6) : ph > 0.9 ? -0.16 * (ph - 0.9) / 0.1 : 0.12 * Math.sin(Math.PI * ph);
    return { x: lerp(leg.x0, leg.x1, p), y: lerp(leg.y0, leg.y1, p), lift: Math.sin(Math.PI * ph) * leg.h, sq, face, happy: false, moving: true };
  }
  const since = t - leg.t1, settle = since < 0.18 ? -0.18 * (1 - since / 0.18) * Math.cos(since * 20) : breathe;
  return { x: leg.x1, y: leg.y1, lift: 0, sq: settle, face, happy: leg.happy && since < 1.4 };
}
// Draws one Pip: its shadow on the board, then the body (squashed or stretched about its feet).
export function drawPip(ctx, spr, st, size, { blinkSeed = 0, t = 0, mood } = {}) {
  const k = size / U, lift = st.lift;
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; const sw = 46 * k * (1 - Math.min(0.4, lift / 140));
  ctx.beginPath(); ctx.ellipse(st.x, st.y + 2 * k, sw, sw * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  const blink = ((t * 0.9 + blinkSeed * 1.7) % 3.3) < 0.13;
  const ex = mood ?? (st.happy ? 'happy' : blink ? 'blink' : 'open');
  ctx.save(); ctx.translate(st.x, st.y - lift); ctx.scale(st.face * k * (1 - st.sq * 0.55), k * (1 + st.sq));
  ctx.drawImage(spr[ex], -SPR / 2, -FOOT); ctx.restore();
}
// Draws a set of Pips back to front.
export function crowd(ctx, list, t) {
  const live = list.map((p) => ({ p, st: state(p.plan, t, p.seed) })).sort((a, b) => a.st.y - b.st.y);
  for (const { p, st } of live) if (!p.hidden?.(t)) drawPip(ctx, p.spr, st, p.size, { blinkSeed: p.seed, t, mood: p.mood?.(t, st) });
}

// ---- words, laid out as kit.drawText lays them, with room opened around a key phrase so its tape never touches a neighbour
export const GAP = 0.3, PAD = 0.2;
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((rw, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - rw.width : x0, atEnd = kit.rtl ? x0 : x1 - rw.width;
    const left = align === 'center' ? (x0 + x1 - rw.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + rw.width : left, cum = 0, prev = null; const row = [];
    for (const w of rw.words) {
      if (prev !== null && prev !== !!w.key) cum += f.size * GAP;
      prev = !!w.key;
      const wl = kit.rtl ? cur - w.width : cur;
      row.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, off: kit.rtl ? -cum : cum });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
    const grow = cum * (align === 'center' ? 0.5 : align === 'start' ? 0 : 1) * (kit.rtl ? 1 : -1);
    for (const b of row) { b.off += grow; b.x += b.off; out.push(b); }
  });
  return out;
}
export function keyRuns(bx) {
  const runs = [];
  for (let k = 0; k < bx.length; k++) {
    const b = bx[k]; if (!b.key) continue;
    const prev = bx[k - 1], last = runs.at(-1);
    if (prev && prev.key && prev.row === b.row && last) { last.x0 = Math.min(last.x0, b.x); last.x1 = Math.max(last.x1, b.x + b.width); last.i1 = b.i; }
    else runs.push({ row: b.row, y: b.y, x0: b.x, x1: b.x + b.width, i0: b.i, i1: b.i });
  }
  return runs;
}
export const keyRoom = (size) => size * 2 * GAP;
// The printed tape behind a key phrase: a rounded strip of accent with a slightly darker printed edge at the bottom.
export function tape(ctx, run, size, P, k = 1) {
  if (k <= 0) return;
  const p = size * PAD, h = size * 1.12, x0 = run.x0 - p, w = (run.x1 - run.x0 + 2 * p);
  const ww = w * k, xx = ctx.__rtl === false ? x0 : x0 + w - ww;
  ctx.fillStyle = mix(P.acc, P.ink, 0.25); ctx.beginPath(); ctx.roundRect(xx, run.y - h / 2 + 5, ww, h, 16); ctx.fill();
  ctx.fillStyle = P.acc; ctx.beginPath(); ctx.roundRect(xx, run.y - h / 2, ww, h, 16); ctx.fill();
}
// Printed text: each word is stamped onto the board (a quick press from 106% with its ink coming up), one after another.
// when(i): the moment word i is stamped. Words of a key phrase print in the colour that reads on the tape.
export function printText(ctx, kit, f, { x0, x1, y, color, P, when, align = 'start', keyed = true, out = 0, decor = false, t }) {
  const bx = boxes(kit, f, { x0, x1, y, align });
  if (keyed) for (const run of keyRuns(bx)) { ctx.__rtl = kit.rtl; tape(ctx, run, f.size, P, soft(clamp((t - when(run.i0) + 0.12) / 0.22)) * (1 - soft(out))); }
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: keyed ? P.onAcc : color, decor,
    each: (w, i, box, c) => {
      const p = clamp((t - when(i)) / 0.16); if (p <= 0 || out >= 1) return false;
      const b = bx[i], cx = b.x + b.width / 2, s = 1 + 0.06 * (1 - soft(p)) - 0.04 * soft(out);
      c.translate(keyed ? b.off : 0, 0); c.translate(cx, b.y); c.scale(s, s); c.translate(-cx, -b.y);
      c.globalAlpha = Math.min(1, p * 2) * (1 - soft(out));
    } });
  return bx;
}
