// A list scratched down the emulsion: a needle rail is cut down the reading side, and at each stop a star of three cuts marks an item that
// is cut in behind the hot point, one per beat. A key word inside an item gets its dye. The title (if any) is cut faint above, over a
// short dye rule. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, ind = 70;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - ind, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].lead * 1.2, head = title ? title.lead + 50 : 0, h = head + pitch * items.length, top = kit.place(h, 720);
  const yTitle = top + (title ? title.lead / 2 : 0), y0 = top + head, railX = rtl ? x1 - 22 : x0 + 22, t0 = 0.4;
  const ym = (k) => y0 + k * pitch + pitch / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const n = ground.n(t), w = ground.weave(t), tl = t - at;
      ctx.save(); ctx.translate(w.x, w.y);
      if (title) {
        M.cutText(kit, ctx, title, { x0, x1, y: yTitle, t: tl, t0: 0, step: 0.06, dur: 0.14, n, seed: 31, P, color: P.faint });
        const L = Math.min(x1 - x0, title.width) * span(tl, 0.15, 0.45);
        M.needle(ctx, M.seg(rtl ? x1 : x0, yTitle + title.lead / 2 + 6, rtl ? x1 - L : x0 + L, yTitle + title.lead / 2 + 9), { w: 2.4, n, seed: 32, color: P.dye });
      }
      const last = ym(items.length - 1), railP = span(tl, t0 - 0.2, t0 + (items.length - 1) * T.beat + 0.1);
      M.needle(ctx, M.seg(railX + 2, ym(0) - pitch * 0.45, railX - 2, last + pitch * 0.45, 14), { w: 2, n, seed: 33, color: P.faint, p: railP, alpha: 0.7 });
      items.forEach((_, k) => {
        const tk = t0 + k * T.beat;
        if (tl < tk - 0.05) return;
        M.star(ctx, railX, ym(k), 15 * Math.min(1, (tl - tk + 0.05) / 0.12), n, 40 + k, P, rows[k].rows[0].words.some((x) => x.key) ? P.dye : P.cream);
        M.cutText(kit, ctx, rows[k], { x0: rtl ? x0 : x0 + ind, x1: rtl ? x1 - ind : x1, y: ym(k), t: tl, t0: tk, step: 0.07, dur: 0.16, n, seed: 50 + k * 3, P });
      });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
