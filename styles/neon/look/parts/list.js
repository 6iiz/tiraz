// A list as a column of small signs: each row is a chevron tube on the reading side and the item beside it, and the rows ignite one by
// one, each with its own stutter. The key item (*…*) is a hot accent tube, chevron and all. The title is a smaller, dimmer sign above.
// spec: { duration, at?, says: { title?, items } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, chev = 70;
  const tx0 = rtl ? L : L + chev + 20, tx1 = rtl ? R - chev - 20 : R;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 500, maxW: R - L, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(124, rows[0].size * 2), head = title ? title.lead + 40 : 0;
  const top = kit.place(head + pitch * items.length, 720);
  const tubes = { base: pal.white, key: pal.hot };
  const sTitle = title && M.sign(kit, title, { x0: L, x1: R, y: top + title.lead / 2, align: 'start' }, tubes, pal, T);
  const signs = rows.map((f, k) => {
    const ym = top + head + k * pitch + pitch / 2, isKey = f.rows.some((r) => r.words.some((w) => w.key));
    const cxv = rtl ? R - chev / 2 : L + chev / 2, s = 18, dir = rtl ? 1 : -1;
    const arrow = M.shape(cxv - 30, ym - 30, 60, 60, (c) => {
      c.beginPath(); c.moveTo(cxv + dir * s * 0.2, ym - s); c.lineTo(cxv - dir * s * 0.8, ym); c.lineTo(cxv + dir * s * 0.2, ym + s); c.stroke();
    }, isKey ? pal.hot : pal.white, pal, T, 5);
    return { ym, isKey, arrow, text: M.sign(kit, f, { x0: tx0, x1: tx1, y: ym, align: 'start' }, tubes, pal, T) };
  });
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const off = (seed) => M.douse(span(t, out0 + (seed % 4) * 0.03, d), seed);
      const tl = (i) => M.flick(span(t, at - 0.1 + i * T.dur.step, at - 0.1 + i * T.dur.step + T.dur.ignite), 40 + i) * off(40 + i) * 0.8;
      signs.forEach((s, k) => {
        const t0 = at + 0.25 + k * T.dur.row, b = M.flick(span(t, t0, t0 + T.dur.ignite), 60 + k) * off(60 + k);
        if (s.isKey) ground.spill(ctx, W / 2, s.ym, 1200, pitch * 3, pal.accent, b);
        else ground.spill(ctx, W / 2, s.ym, 1100, pitch * 2.2, pal.light, b * 0.35);
      });
      if (sTitle) sTitle.draw(ctx, tl);
      signs.forEach((s, k) => {
        const t0 = at + 0.25 + k * T.dur.row;
        const b = (i) => M.flick(span(t, t0 + i * 0.04, t0 + i * 0.04 + T.dur.ignite), 60 + k + i * 5) * off(60 + k);
        s.arrow.draw(ctx, b(0));
        s.text.draw(ctx, (i) => b(i + 1));
      });
    },
  };
}
