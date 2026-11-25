// Before and after, as a rebuild. The old value is built in grey cubes; a row of key-colour cubes runs across it, stacked on top,
// striking it out (it still reads). Then the old value collapses: its cubes and the strike tumble apart into rubble on the mat.
// From the rubble the cubes hop, in reading order, to their places in the new value, turning the key colour on the way, and snap.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 });
  const { builder, rec, size } = await import(look.base + 'cubes.js');
  const { hop, pair, hash, out3, smooth, snap, leave } = await import(look.base + 'motion.js');
  const P = W3.P, maxW = SAFE.right - SAFE.left - 40;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [fw, fn] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.cmpLabel, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  const gap = 46, total = (label ? label.lead + gap : 0) + fw.size * 1.3, top = kit.place(total, 720);
  const yL = top + (label ? label.lead / 2 : 0), yV = top + (label ? label.lead + gap : 0) + fw.size * 0.65;
  const pitch = W3.pitch(fw.size);
  const was = await W3.voxels(fw, { y: yV, align: 'center', pitch }), now = await W3.voxels(fn, { y: yV, align: 'center', pitch });
  was.cells.forEach((c) => { c.key = false; }); now.cells.forEach((c) => { c.key = true; });
  // the strike: one course of cubes across the middle of the old value, one layer up
  const midY = Math.round(((was.y0 + was.y1) / 2) / pitch - 0.5) * pitch + pitch / 2, strike = [];
  for (let x = was.x0 - pitch * 1.5; x <= was.x1 + pitch * 1.5; x += pitch) strike.push({ x: Math.round(x / pitch - 0.5) * pitch + pitch / 2, y: midY, gx: Math.round(x / pitch), gy: 999, row: 0 });
  strike.forEach((c) => { c.u = W3.rtl ? (was.x1 - c.x) / (was.x1 - was.x0) : (c.x - was.x0) / (was.x1 - was.x0); });
  const nw = was.cells.length, A = [...was.cells, ...strike], pool = W3.pool(A.length + now.cells.length + 4);
  const tW = at + 0.05, tS = at + 0.6, tC = at + 1.42, tR = at + 1.68, hopDur = 0.4, out0 = d - T.dur.out;
  const B = builder(W3, was, { pool, t0: tW, window: 0.24, out0: 1e9, seed: 3, color: () => P.old });
  const { s: cs, h: ch } = size(W3, was, { key: false });
  // rubble: where each cube of the old value comes to rest when it collapses
  A.forEach((c, k) => {
    const a = hash(k, 3, 31), b = hash(k, 7, 32), r = hash(k, 11, 33);
    c.rx = c.x + (a - 0.5) * pitch * 9 + (c.x - (was.x0 + was.x1) / 2) * 0.12;
    c.ry = c.y + (b - 0.35) * pitch * 6 + pitch * 2; c.rr = (r - 0.5) * 2.2;
    c.from = { x: c.rx, y: c.ry };
  });
  const mv = pair(A, now.cells, (c) => (W3.rtl ? -c.x : c.x) * 1e4 + c.y);
  return {
    duration: d,
    draw(ctx, t) {
      let stW = { landed: 0, gone: 1 }, stN = { landed: 0, gone: 0 };
      if (t < tC) {
        stW = B.at(t);
        strike.forEach((c, k) => {
          const i = nw + k, ts = tS + c.u * 0.22, p = (t - ts) / 0.16;
          pool.color(i, P.key);
          if (p <= 0) { pool.hide(i); return; }
          const q = out3(p), z0 = ch + ch / 2 + 2, sq = snap(span(t, ts + 0.16, ts + 0.28)) * 0.3;
          pool.put(i, c.x - W3.dir * (1 - q) * 140, c.y, z0 + (1 - q) * 60, cs, ch * (1 - sq), 0, (1 - q) * 1.2 * W3.dir, 0);
        });
        for (let i = A.length; i < pool.n; i++) pool.hide(i);
      } else if (t < tR) {
        const p = span(t, tC, tR - 0.04);
        A.forEach((c, k) => {
          const q = Math.min(1, Math.max(0, p * 1.25 - hash(k, 1, 5) * 0.25)), e = smooth(q), z0 = k >= nw ? ch * 1.5 + 2 : ch / 2;
          pool.color(k, k >= nw ? P.key : P.old);
          const z = z0 + (ch / 2 - z0) * e + Math.sin(Math.PI * q) * (40 + 60 * hash(k, 2, 6));
          pool.put(k, c.x + (c.rx - c.x) * e, c.y + (c.ry - c.y) * e, z, cs, ch, e * Math.PI * (k % 2 ? 0.5 : -0.5), 0, c.rr * e);
        });
        for (let i = A.length; i < pool.n; i++) pool.hide(i);
      } else {
        let landed = 0;
        mv.forEach((m, i) => {
          const f = m.k / Math.max(1, mv.length), p = (t - tR - f * 0.25) / hopDur, { s, h } = size(W3, now, m.to);
          if (p >= 1 && !m.stay) { pool.hide(i); return; }
          const q = Math.min(1, Math.max(0, p)), a = hop(q, m.from.from, m.to, 70 + 40 * hash(i, 4, 8), i);
          const grow = m.stay ? 1 : 1 - q, rz0 = m.from.rr * (1 - smooth(q));
          let x = a.x, y = a.y, z = ch / 2 + (h / 2 - ch / 2) * smooth(q) + a.z, hh = ch + (h - ch) * smooth(q), rx = a.rx, ry = a.ry, rz = a.rz + rz0;
          if (p >= 1) { landed++; hh = h * (1 - 0.3 * snap(span(t, tR + f * 0.25 + hopDur, tR + f * 0.25 + hopDur + 0.13))); z = hh / 2; rx = ry = rz = 0; }
          const pe = (t - (out0 + f * T.leave.window)) / T.leave.dur;
          if (pe > 0) { if (pe >= 1) { pool.hide(i); return; } const l = leave(pe, m.to, W3.dir, T.leave, 3); x += l.dx; y += l.dy; z += l.z; rx += l.rx; ry += l.ry; }
          pool.color(i, q > 0.45 ? P.key : (m.from.gy === 999 ? P.key : P.old));
          pool.put(i, x, y, z, s * grow, hh * grow, rx, ry, rz);
        });
        for (let i = mv.length; i < pool.n; i++) pool.hide(i);
        stN = { landed: landed / Math.max(1, now.cells.length), gone: t > out0 + 0.08 ? 1 : 0 };
      }
      pool.commit();
      W3.draw(ctx, t);
      if (t < tC + 0.05) rec(W3, kit, was, stW, 2);
      rec(W3, kit, now, stN);
      if (label) {
        const pin = out3(span(t, at, at + 0.3)), pout = span(t, out0, out0 + 0.3);
        if (pout < 1) W3.flat(ctx, label, { y: yL, dy: (1 - pin) * 26 - pout * pout * 40, alpha: Math.min(1, pin * 3) * (1 - pout) });
      }
    },
  };
}
