// A number on a big price tag in the accent: the tag swings round its cord and settles, then the price is "relabelled" up to the
// value in a few printed steps, the way a labelling gun ticks; the label hangs on smaller paper tags under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, hasArabic, font } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, fam = brand.fonts.display.family;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 });
  await W3.fonts([[900, T.size.count, fam], [T.weight.label, T.size.label, fam]]);
  const tone = W3.tone, steps = 6;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const valOf = (k) => text(countValue(0, S.value, k / steps, (x) => x));
  const final = text(S.value);
  // the number's size: as big as the tag allows
  const m = document.createElement('canvas').getContext('2d');
  const widthAt = (str, size) => { m.font = font(900, size, fam); return m.measureText(str).width; };
  let size = T.size.count; const room = W3.textMax - 20;
  if (widthAt(final, size) > room) size = Math.floor(size * room / widthAt(final, size));
  const cellW = Math.max(...[...'0123456789٠١٢٣٤٥٦٧٨٩'].map((c) => widthAt(c, size)));
  const strW = (str) => [...str].reduce((s, c) => s + (/[0-9٠-٩]/.test(c) ? cellW : widthAt(c, size)), 0);
  const numW = Math.max(strW(final), widthAt(final, size)) + 24;
  const paintNum = (str) => (g, r) => {
    g.font = font(900, size, fam); g.textBaseline = 'middle'; g.fillStyle = tone.onAccent;
    if (hasArabic(str)) { g.direction = 'rtl'; g.textAlign = 'center'; g.fillText(str, (r.x0 + r.x1) / 2, r.yc + size * 0.05); return; }
    g.direction = 'ltr'; g.textAlign = 'center';
    const tw = strW(str); let x = W3.rtl ? r.x1 - 12 - tw : r.x0 + 12;
    for (const c of str) { const cw = /[0-9٠-٩]/.test(c) ? cellW : widthAt(c, size); g.fillText(c, x + cw / 2, r.yc + size * 0.05); x += cw; }
  };
  const num = W3.tag({ w: numW, h: Math.round(size * T.high.count), body: tone.accent, ink: tone.onAccent, paint: paintNum(valOf(0)), plain: final, id: 7 });
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: W3.textMax - 2 * T.tag.keyPad, minScale: 0.85, where: 'the count label' });
  const labels = label.rows.map((r) => W3.textTag(r, label, { high: T.high.label }));
  const tags = [num, ...labels];
  W3.hang(tags, { centre: 650 });
  const c0 = at + 0.45, c1 = c0 + 1.05, out0 = d - T.dur.out;
  let shown = valOf(0);
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, c0, c1), cur = p >= 1 ? final : valOf(Math.floor(p * steps));
      if (cur !== shown) { num.repaint(paintNum(cur)); shown = cur; }
      num.plain = cur;
      W3.swing(num, t, { t0: at, out0: out0 - 0.06 });
      labels.forEach((tg, k) => W3.swing(tg, t, { t0: at + 0.3 + k * T.dur.stagger, out0: out0 + k * 0.05 }));
      W3.draw(ctx, t);
    },
  };
}
