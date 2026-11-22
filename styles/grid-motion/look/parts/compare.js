// Before and after as kinetic type: the old value shoots in on its track in giant type, a heavy ink bar strikes through it, and then
// the new value comes in on the same track from the reading side and shoves the old one off the far edge, the two moving as one strip.
// The new value lands on a solid ink slab, set in the ground's colour. The label rides its own track above.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: maxW - 60, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 700, maxW, minScale: 0.85, where: 'the compare label' }) : null;
  const vh = was.size * 1.3, block = (label ? label.height + 70 : 0) + vh;
  const top = kit.place(block, 680), yLabel = top + (label ? label.lead / 2 : 0), yV = top + (label ? label.height + 70 : 0) + vh / 2;
  const extent = (f) => { const b = M.layout(kit, f, { x0, x1, y: yV }); return [Math.min(...b.map((v) => v.x)), Math.max(...b.map((v) => v.x + v.width))]; };
  const [wasA, wasB] = extent(was), [nowA, nowB] = extent(now);
  const strikeT = at + 0.62, shoveT = at + 1.1, D = W + 160, read = rtl ? 1 : -1;     // read: the side the reading starts from (+1 = right)
  const nL = label ? label.rows.length : 0, out0 = d - T.dur.out - 0.05;
  const dx = (t, g, t0) => M.travel(W, span(t, t0, t0 + T.dur.slide), span(t, out0 + g * 0.05, out0 + g * 0.05 + T.dur.out), M.rowDir(g, rtl));
  const ghost = kit.fit(asText(S.now), { size: T.size.ghost, weight: 900, maxW: 99999, single: true, overflow: true, where: 'the ghost type' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.ticker(ctx, kit, ghost, t + clock, { W, y: 1600, color: pal.ghost, speed: T.ticker });
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.ink,
        each: (w, i, box, c) => { const o = dx(t, box.row, at + box.row * 0.1); if (o === null) return false; c.translate(o, 0); } });
      const q = M.SNAP(span(t, shoveT, shoveT + T.dur.slide));
      // the old value: in on its track, struck, then shoved off by the new one
      const ow = q < 1 ? dx(t, 9, at + 0.12) : null;
      if (ow !== null) {
        const shift = ow - read * q * D;
        ctx.save(); ctx.translate(shift, 0);
        kit.drawText(ctx, was, { x0, x1, y: yV, align: 'start', color: pal.soft, key: pal.soft });
        const ps = M.SNAP(span(t, strikeT, strikeT + 0.26));
        if (ps > 0) { const len = (wasB - wasA + 40) * ps; ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? wasB + 20 - len : wasA - 20, yV - was.size * 0.08, len, was.size * 0.16); }
        ctx.restore();
      }
      // the new value, coming in from the reading side on the same track, on its slab
      if (q > 0) {
        const out = span(t, out0 + 0.05, out0 + 0.05 + T.dur.out); if (out >= 1) return;
        const shift = read * (1 - q) * D - read * M.OUT(out) * (W + 120);
        ctx.save(); ctx.translate(shift, 0);
        const pad = now.space * 0.7; ctx.fillStyle = pal.ink;
        ctx.fillRect(nowA - pad, yV - now.size * 0.68, nowB - nowA + pad * 2, now.size * 1.34);
        kit.drawText(ctx, now, { x0, x1, y: yV, align: 'start', color: pal.ground, key: pal.ground });
        ctx.restore();
      }
    },
  };
}
