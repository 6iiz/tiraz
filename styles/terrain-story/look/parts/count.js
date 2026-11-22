// A number as a pillar of data standing on the map. A pillar of light rises from a place on the terrain while the numeral in the sky
// rolls to its value in shrinking steps; the pillar's height follows the roll, and a hairline ties its top to the label above.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 120) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const top = kit.place(size * 0.95 + 16 + label.height, 520), yNum = top + size * 0.47, aLab = { x0, x1, y: top + size * 0.95 + 16 + label.lead / 2, align: 'start' };
  const yBelow = aLab.y + label.height - label.lead / 2 + 30;
  const site = ground.pick(kit.rtl ? 760 : 320, 1250, clock + Math.max(0, at));
  const out0 = d - T.dur.out, roll = [at + 0.2, at + 1.5];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), keep = 1 - M.inC(out), p = span(t, roll[0], roll[1]), e = M.outC(p);
      const b = ground.at(site.u, site.v, 0, t + clock), hmax = Math.max(80, b.y - yBelow - 80), hp = hmax * (0.04 + 0.96 * e) * keep;
      if (t >= at) {
        M.pillar(ctx, pal, b, hp, keep);
        if (p >= 1) { const q = M.outC(span(t, roll[1], roll[1] + 0.35)) * keep, yt = b.y - hp, yy = yt + (yBelow - yt) * q; ctx.fillStyle = pal.line; ctx.fillRect(b.x - 1, yy, 2, yt - yy); }
      }
      ctx.save(); ctx.globalAlpha = M.outC(span(t, at, at + 0.25)) * (1 - M.inC(out));
      ctx.translate(0, -40 * (1 - M.settleE(span(t, at, at + 0.4))) - 50 * M.inC(out));
      kit.number(ctx, text(countValue(0, S.value, p, (x) => 1 - (1 - x) ** 3)), { x: kit.rtl ? x1 : x0, y: yNum, size, color: pal.dark, align: kit.rtl ? 'right' : 'left', settle: p });
      ctx.restore();
      kit.drawText(ctx, label, { ...aLab, color: pal.grey, key: pal.dark, each: M.drop(t, at + 0.3, 0.04, T.dur.word, out, label.size) });
    },
  };
}
