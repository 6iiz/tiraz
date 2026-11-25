// A list: a canvas set like a catalogue page. The title sits on top in grey; once the walk settles the items are painted one per beat
// from the reading side, each with its number in the mono face and a hairline under it. A key word in an item is in the key colour and
// gets an accent stroke under it. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { E } = await import(look.base + 'motion.js');
  const A = G.area, maxW = A.x1 - A.x0, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const ixW = 74, rtl = G.rtl;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW, single: true, where: 'the list title' }) : null;
  const fits = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - ixW, single: true, where: 'a list item' });
  const step = Math.max(fits[0].size * 1.7, Math.min(150, (A.y1 - A.y0 - (title ? 140 : 0)) / items.length));
  const hB = (title ? title.lead + 40 : 0) + step * items.length, top = A.cy - hB / 2;
  const tRows = title ? await G.rows(title, { y: top + title.lead / 2, color: G.P.grey }) : [];
  const rows = [], marks = [], lines = [], strokes = [];
  const y0 = top + (title ? title.lead + 40 : 0) + step / 2;
  const itemBox = rtl ? { x0: A.x0, x1: A.x1 - ixW } : { x0: A.x0 + ixW, x1: A.x1 };
  const ixBox = rtl ? { x0: A.x1 - ixW, x1: A.x1 } : { x0: A.x0, x1: A.x0 + ixW };
  for (let k = 0; k < items.length; k++) {
    const y = y0 + k * step;
    const r = await G.row(fits[k], 0, { y, ...itemBox, align: 'start' }); rows.push(r);
    const nf = kit.fit((k < 9 ? kit.fmt(0) : '') + kit.fmt(k + 1), { family: mono, size: T.size.index, weight: 600, maxW: ixW, single: true, where: 'a list number' });
    const m = await G.row(nf, 0, { y: y + fits[k].size * 0.06, ...ixBox, align: 'start', color: G.P.accent }); m.text = ''; marks.push(m);
    lines.push(G.bar({ x0: A.x0, x1: A.x1, y: y + step / 2 - 2, h: 3, color: G.P.soft, z: 0.2 }));
    r.keys.forEach((kk) => strokes.push({ k, b: G.bar({ x0: kk.x0, x1: kk.x1, y: kk.y + kk.size * 0.78, h: kk.size * 0.15 }) }));
  }
  const tK = (k) => at + T.walk + 0.1 + k * T.dur.beat;
  return {
    duration: d,
    draw(ctx, t) {
      const walking = G.pose(t, at, d); G.lamp(t, at, d);
      for (const l of tRows) { G.wipe(l, 1); G.rec(l, walking); }
      rows.forEach((r, k) => {
        const q = E(span(t, tK(k), tK(k) + T.dur.wipe));
        G.wipe(marks[k], E(span(t, tK(k) - 0.06, tK(k) + 0.12))); G.wipe(lines[k], q); G.wipe(r, q); G.rec(r, walking);
      });
      strokes.forEach(({ k, b }) => G.wipe(b, E(span(t, tK(k) + 0.3, tK(k) + 0.3 + T.dur.wipe))));
      G.render(ctx);
    },
  };
}
