// A number as an exhibit: a giant figure in front of a height chart, printed in the accent and shaded with a darker halftone screen
// clipped to its own shape, with an ink copy a little out of register behind it. It counts up in shrinking steps, slams flat on its
// last value, and the label is stamped under it on an ink caption bar. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 60 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: maxW - 70, minScale: 0.8, where: 'the count label' });
  const barH = label.height + 30, barW = Math.min(maxW, label.width + 70);
  const top = kit.place(size * 1.1 + 70 + barH, 680), yNum = top + size * 0.55, yBar = top + size * 1.1 + 70;
  const chartTop = yNum - size * 0.62, chartBot = yNum + size * 0.5;
  const [oc, o] = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; })();
  const dots = M.screen(o, M.dotTile(T.screen.step - 4, 0.3, P.dotAccent), 30);
  const tLand = at + 1.4;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.32, d);
      // the height chart behind the figure: rules across, a tick scale on both ends
      const pc = ease.outCubic(span(t, at, at + 0.4)) * (1 - M.I(q));
      if (pc > 0) {
        ctx.save(); ctx.globalAlpha = pc; ctx.fillStyle = P.rule;
        for (let y = chartTop, k = 0; y <= chartBot; y += 34, k++) { ctx.fillRect(SAFE.left, y, maxW, k % 3 === 0 ? 3 : 1.5); ctx.fillRect(SAFE.left, y, 30, 3); ctx.fillRect(SAFE.right - 30, y, 30, 3); }
        ctx.restore();
      }
      // the figure: steps that shrink toward the end, then the last value slams down
      const p = span(t, at + 0.1, tLand), steps = 18, sp = p >= 1 ? 1 : Math.floor(ease.outCubic(p) * steps) / steps;
      const str = text(countValue(0, S.value, sp, (x) => x)), land = span(t, tLand, tLand + 0.16);
      ctx.save();
      const s = p > 0 ? (M.slam(ctx, p >= 1 ? Math.max(0.02, land) : 1, q, W / 2, yNum, 0.12) !== false) : false;
      if (s) {
        kit.number(ctx, str, { x: W / 2 + ground.reg.x * 1.6, y: yNum + ground.reg.y * 1.6, size, color: P.ink, settle: p, decor: true });
        o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.setTransform(ctx.getTransform()); o.globalCompositeOperation = 'source-over';
        kit.number(o, str, { x: W / 2, y: yNum, size, color: P.accent, settle: p });
        o.globalCompositeOperation = 'source-atop'; o.fillStyle = dots; o.fillRect(-W, -H, W * 3, H * 3);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(oc, 0, 0); ctx.restore();
      }
      ctx.restore();
      // the caption bar
      const bx = rtl ? SAFE.right - barW : SAFE.left;
      ctx.save();
      if (M.slam(ctx, (t - (at + 0.45)) / 0.16, q, bx + barW / 2, yBar + barH / 2, 0.25) !== false) {
        M.chip(ctx, bx, yBar, barW, barH, P, rtl);
        kit.drawText(ctx, label, { x0: bx + 35, x1: bx + barW - 35, y: yBar + 15 + label.lead / 2, align: 'start', color: P.onInk });
      }
      ctx.restore();
    },
  };
}
