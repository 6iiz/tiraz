// A number as a big hot accent tube. It ignites with a stutter and counts up while lit; each digit carries its own bloom, built once per
// character in create(), so the glow follows the count. A light tube rule under it, and the label as a smaller sign below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, font, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, maxW = SAFE.right - SAFE.left, fam = brand.fonts.display.family;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 40 && size > 120) size -= 8;
  const yNum = 600, cx = W / 2, yRule = yNum + size * 0.5, yLabel = yRule + 70 + label.lead / 2;
  // one bloom per character the number can show
  const P = Math.ceil(size * T.glow.far * 2.2), sh = Math.ceil(size * 1.3) + 2 * P, glyph = {};
  const isDigit = (ch) => /[0-9٠-٩]/.test(ch);
  for (const ch of new Set([...kit.fmt(-1234567890.5, 1), ...(S.prefix ?? ''), ...(S.suffix ?? '')])) {   // every digit and mark in the brand's own digits
    const cw = Math.ceil(kit.numberWidth(ch, size, 900, 1)) + 2 * P;
    glyph[ch] = { w: cw, c: M.bloom(cw, sh, (g) => {
      g.font = font(900, size, fam); g.textBaseline = 'middle'; g.direction = 'ltr';
      if (isDigit(ch)) { g.textAlign = 'center'; g.fillText(ch, cw / 2, sh / 2); } else { g.textAlign = 'left'; g.fillText(ch, P, sh / 2); }
    }, pal.hot.glow, size * T.glow.near * 0.7, size * T.glow.far * 0.7, T) };
  }
  const rule = M.shape(cx - 200, yRule - 4, 400, 8, (c) => { c.beginPath(); c.moveTo(cx - 200, yRule); c.lineTo(cx + 200, yRule); c.stroke(); }, pal.white, pal, T, 4);
  const sLabel = M.sign(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center' }, { base: pal.white, key: pal.hot }, pal, T);
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = M.flick(span(t, at - 0.15, at + 0.25), 5) * M.douse(span(t, out0, d), 5), p = span(t, at, at + 1.4);
      ground.spill(ctx, cx, yNum, 1300, size * 3, pal.accent, b);
      const str = text(countValue(0, S.value, p)), settle = p;
      const total = kit.numberWidth(str, size, 900, settle);
      let left = cx - total / 2;
      if (b > 0.02) {
        ctx.save(); ctx.globalAlpha = b;
        for (const ch of str) {
          const w = kit.numberWidth(ch, size, 900, settle), g = glyph[ch];
          if (g) ctx.drawImage(g.c, isDigit(ch) ? left + w / 2 - g.w / 2 : left - P, yNum - sh / 2);
          left += w;
        }
        ctx.restore();
      }
      kit.number(ctx, str, { x: cx, y: yNum, size, color: M.mixLit(pal, pal.hot.core, b), align: 'center', settle });
      rule.draw(ctx, M.flick(span(t, at + 0.3, at + 0.6), 9) * M.douse(span(t, out0, d), 9));
      sLabel.draw(ctx, (i) => M.flick(span(t, at + 0.5 + i * T.dur.step, at + 0.5 + i * T.dur.step + T.dur.ignite), 20 + i) * M.douse(span(t, out0 + 0.04, d), 20 + i));
    },
  };
}
