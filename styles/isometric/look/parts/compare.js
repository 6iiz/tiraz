// Before and after on one floor: two columns stand side by side, the old one in the neutral tone, the new one in the accent, and an
// arrow runs across the floor from the old to the new. When both values are numbers the columns are drawn to scale from the floor
// (true heights); when they are words the two blocks are equal and only the colour and the arrow say which is now.
// Each value is the label of its column, on a leader line. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, u = T.unit;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const rtl = kit.rtl, numeric = typeof S.was === 'number' && typeof S.now === 'number' && S.was >= 0 && S.now >= 0 && Math.max(S.was, S.now) > 0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const half = (SAFE.right - SAFE.left - 40) / 2;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: half, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  // the floor: the old column on the reading side, the new one on the other, both at the same depth
  const oy = 830, P = M.project(W / 2, oy, u), hMax = 7.5;
  const hWas = numeric ? Math.max(0.15, hMax * S.was / Math.max(S.was, S.now)) : 3.2, hNow = numeric ? Math.max(0.15, hMax * S.now / Math.max(S.was, S.now)) : 3.2;
  const colWas = rtl ? { x: 6, y: 0 } : { x: 0, y: 6 }, colNow = rtl ? { x: 0, y: 6 } : { x: 6, y: 0 };
  const sideX = (c) => P(c.x + 1, c.y + 1, 0)[0];
  const yLabel = 380;
  const word = (t, t0, size) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size) === false) return false;
    if (M.leave(c, span(t, d - T.dur.out, d), box, size) === false) return false;
  };
  const tWas = at + 0.15, tNow = at + 1.0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.E(span(t, d - T.dur.out - 0.05, d));
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: pal.muted, each: word(t, at, label.size) });
      const slab = M.G(span(t, at, at + T.dur.build)) * (1 - out);
      if (slab <= 0) return;
      M.block(ctx, P, -1, -1, 0, 10, 10, 0.4 * slab, pal.floor);
      const z = 0.4 * slab;
      // the arrow across the floor, from old to new: x + y = 8 is a level line on screen
      const pa = M.E(span(t, tNow - 0.35, tNow + 0.15)) * (1 - out);
      if (pa > 0) {
        const [ax, ay] = P(colWas.x + 1, colWas.y + 1, z), [bx] = P(colNow.x + 1, colNow.y + 1, z), y = ay + 2.2 * u;
        const from = ax, to = from + (bx - from) * pa, dir = Math.sign(bx - from);
        ctx.save(); ctx.strokeStyle = pal.accent; ctx.fillStyle = pal.accent; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(to - dir * 18, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(to, y); ctx.lineTo(to - dir * 30, y - 16); ctx.lineTo(to - dir * 30, y + 16); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      const col = (c, h, f, t0, txt) => {
        const g = M.G(span(t, t0, t0 + T.dur.build + 0.3)) * (1 - out);
        if (g <= 0) return;
        const hh = h * g;
        M.block(ctx, P, c.x, c.y, z, 2, 2, hh, f, true);
        const [tx, ty] = P(c.x, c.y, z + hh), x = sideX(c), yText = Math.min(ty - 90, 640);
        M.leader(ctx, [[tx, ty - 6], [tx, yText + txt.lead * 0.42]], span(t, t0 + 0.25, t0 + 0.5) * (1 - out), pal.line);
        return { x, yText };
      };
      const a = col(colWas, hWas, pal.neutral, tWas, was), b = col(colNow, hNow, pal.hot, tNow, now);
      if (a) kit.drawText(ctx, was, { x0: a.x - half / 2, x1: a.x + half / 2, y: a.yText, color: pal.muted, key: pal.muted, each: word(t, tWas + 0.2, was.size) });
      if (b) kit.drawText(ctx, now, { x0: b.x - half / 2, x1: b.x + half / 2, y: b.yText, color: pal.keyText, key: pal.keyText, each: word(t, tNow + 0.2, now.size) });
    },
  };
}
