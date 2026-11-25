// A number: a canvas with one big numeral painted on it in the key colour, the label under it. The visitor arrives at a 0; once the walk
// settles the numeral counts up to the value, and when it lands an accent stroke is brushed under it and the picture light comes up.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, hasArabic, font } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { E } = await import(look.base + 'motion.js');
  const A = G.area, maxW = A.x1 - A.x0, fam = brand.fonts.display.family;
  // Latin affixes (%, +, $) go into the numeral; Arabic ones are painted beside it, half size, on their own reading side
  const pre = S.prefix ?? '', suf = S.suffix ?? '', arPre = hasArabic(pre), arSuf = hasArabic(suf);
  const str = (v) => (arPre ? '' : pre) + kit.fmt(v, spec.decimals ?? 0) + (arSuf ? '' : suf), final = str(S.value);
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, minScale: 0.8, where: 'the count label' });
  const affix = async (t) => (t ? kit.fit(t, { size: T.size.count * 0.3, weight: 700, maxW: maxW * 0.3, single: true, where: 'a count affix' }) : null);
  const fPre = arPre ? await affix(pre) : null, fSuf = arSuf ? await affix(suf) : null;
  const affW = (fPre ? fPre.width + 24 : 0) + (fSuf ? fSuf.width + 24 : 0);
  let size = T.size.count; await document.fonts.load(font(900, size, fam));
  const wOf = (sz) => kit.numberWidth(final, sz, 900, 1);
  while (wOf(size) > maxW - affW && size > 80) size -= 6;
  const numH = size * 1.05, gap = 40, hB = numH + gap + label.height;
  const top = A.cy - hB / 2, yNum = top + numH / 2;
  const nw = wOf(size), preW = fPre ? fPre.width + 24 : 0, sufW = fSuf ? fSuf.width + 24 : 0, gw = nw + preW + sufW, sg = G.rtl ? -1 : 1;
  const start = A.cx - sg * gw / 2, cx = start + sg * (preW + nw / 2);          // the group [prefix][numeral][suffix] in reading order, centred
  const num = G.live({ x0: A.x0, x1: A.x1, y0: yNum - size * 0.75, y1: yNum + size * 0.75 });
  num.x0 = cx - nw / 2; num.x1 = cx + nw / 2; num.y0 = yNum - size * 0.6; num.y1 = yNum + size * 0.6; num.text = final;
  const sides = [], box = (a, w) => (G.rtl ? { x0: a - w, x1: a } : { x0: a, x1: a + w });
  if (fPre) sides.push(await G.row(fPre, 0, { y: yNum + size * 0.12, ...box(start, fPre.width), color: G.P.key }));
  if (fSuf) sides.push(await G.row(fSuf, 0, { y: yNum + size * 0.12, ...box(cx + sg * (nw / 2 + 24), fSuf.width), color: G.P.key }));
  const labels = await G.rows(label, { y: top + numH + gap + label.lead / 2, color: G.P.ink });
  const stroke = G.bar({ x0: cx - nw / 2, x1: cx + nw / 2, y: yNum + size * 0.62, h: size * 0.07 });
  const c0 = at + T.walk + 0.05, c1 = c0 + T.dur.count, N = 10;
  return {
    duration: d,
    draw(ctx, t) {
      const walking = G.pose(t, at, d); G.lamp(t, at, d);
      const p = span(t, c0, c1), v = p >= 1 ? S.value : countValue(0, S.value, Math.floor(p * N) / N, (x) => x);
      const s = str(v);
      num.paint(s + (p >= 1 ? 'z' : 'c'), (g, w, h) => kit.number(g, s, { x: cx - A.x0, y: h / 2, size, weight: 900, color: G.P.key, align: 'center', settle: p >= 1 ? 1 : 0, decor: true }));
      G.wipe(num, 1); G.rec(num, walking);
      for (const l of [...sides, ...labels]) { G.wipe(l, 1); G.rec(l, walking); }
      G.wipe(stroke, E(span(t, c1 + 0.02, c1 + 0.02 + T.dur.wipe)));
      G.render(ctx);
    },
  };
}
