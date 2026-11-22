// A list as a run of captions: the title is a label chip, then each item is slammed on as its own caption under the one before. The
// newest item is lit, the ones before it step back to the quiet colour, so the eye always knows which one is being said.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, n = items.length;
  const size = n > 3 ? Math.round(T.size.item * 0.88) : T.size.item;
  const rows = kit.fitAll(items, { size, weight: 900, maxW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.chip, weight: 700, maxW: maxW - 60, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.42, chipH = title ? title.size * 1.5 + 40 : 0;
  const top = kit.place(chipH + pitch * n, 880);
  const tk = (k) => at + 0.25 + k * 0.38;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, top);
      if (title) M.chip(kit, ctx, title, { y: top + title.size * 0.75, p: span(t, at, at + T.dur.chip), P, rtl: kit.rtl });
      rows.forEach((f, k) => {
        const next = k + 1 < n ? tk(k + 1) : Infinity, dim = 0.85 * span(t, next, next + 0.12);
        M.caption(kit, ctx, f, { y: top + chipH + pitch * k + pitch / 2, t, t0: tk(k), gap: 0, P, T, dim });
      });
    },
  };
}
