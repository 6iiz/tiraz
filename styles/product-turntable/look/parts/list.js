// A list: up to five item tags threaded on the cord under an optional title tag. One tag swings round on every beat and settles;
// each carries a small item number in the mono face at its far end, like a shelf label. All are swung away together at the end.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, font } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const fam = brand.fonts.display.family, mono = brand.fonts.mono?.family ?? fam;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 });
  await W3.fonts([[T.weight.item, T.size.item, fam], [600, T.size.title, fam], [600, T.size.index, mono]]);
  const tone = W3.tone, idxW = 74, out0 = d - T.dur.out;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: W3.textMax, single: true, where: 'the list title' }) : null;
  const fit = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: W3.textMax - idxW - 2 * T.tag.keyPad, single: true, where: 'a list item' });
  const tags = [];
  if (title) tags.push(W3.textTag(title.rows[0], title, { color: tone.grey, high: T.high.lead }));
  const rows = fit.map((f, k) => W3.textTag(f.rows[0], f, { high: T.high.item, extra: idxW, after: (g, r) => {
    g.font = font(600, T.size.index, mono); g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillStyle = tone.grey;
    g.textAlign = W3.rtl ? 'left' : 'right'; g.fillText(String(k + 1).padStart(2, '0'), W3.rtl ? r.x0 + 4 : r.x1 - 4, r.yc + 2);
  } }));
  tags.push(...rows);
  W3.hang(tags, { centre: 700, gap: 18 });
  const t0 = (k) => at + 0.3 + k * T.dur.beat;
  return {
    duration: d,
    draw(ctx, t) {
      if (title) W3.swing(tags[0], t, { t0: at, out0: out0 - 0.06 });
      rows.forEach((tg, k) => W3.swing(tg, t, { t0: t0(k), out0: out0 - 0.12 + k * 0.03 }));
      W3.draw(ctx, t);
    },
  };
}
