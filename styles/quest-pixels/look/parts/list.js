// A list as a command menu: the title sits in a small window of its own, the menu window opens under it, and the items appear one per
// beat while the pointing-hand cursor jumps down to each new one (it bobs one pixel while it waits). Key items (*…*) are set on the
// accent block. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, u = M.PX, rtl = kit.rtl;
  const wx = 72, ww = 936, pad = 8 * u, hand = 14 * u, inner = ww - 2 * pad - hand;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: inner, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: ww - 2 * pad, minPx: 44, where: 'the list title' }) : null;
  const pitch = M.snap(Math.max(rows[0].size * 1.75, 96)), th = title ? M.snap(title.height + 8 * u) : 0, gap = title ? 3 * u : 0;
  const h = M.snap(2 * pad + pitch * items.length), top = M.snap(kit.place(th + gap + h, 720)), mt = top + th + gap;
  const tw = title ? M.snap(Math.min(ww, title.width + 2 * pad + 4 * u)) : 0, tx = rtl ? wx + ww - tw : wx;
  const t0 = (k) => at + 0.35 + k * T.beat, tClear = d - 0.3;
  const hm = { o: P.d, L: P.l };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const close = 1 - M.stepped(span(t, d - 0.26, d - 0.04), 3);
      if (title) { const o = M.stepped(span(t, at, at + 0.24)) * close;
        if (M.win(ctx, tx, top, tw, th, P, o) && o >= 1 && t < tClear)
          kit.drawText(ctx, title, { x0: tx + pad, x1: tx + tw - pad, y: top + th / 2 - (title.rows.length - 1) * title.lead / 2, align: 'start', color: P.lead, key: P.lead }); }
      const o = M.stepped(span(t, at + 0.12, at + 0.36)) * close;
      if (!M.win(ctx, wx, mt, ww, h, P, o) || o < 1 || t >= tClear) return;
      let cur = -1;
      items.forEach((_, k) => {
        if (t < t0(k)) return; cur = k;
        const ym = mt + pad + k * pitch + pitch / 2;
        kit.drawText(ctx, rows[k], { x0: rtl ? wx + pad : wx + pad + hand, x1: rtl ? wx + ww - pad - hand : wx + ww - pad, y: ym, align: 'start', color: P.l, key: P.l,
          each: (w, i, box, c) => { if (w.key) { M.block(c, box.x - rows[k].space * 0.55, box.y - rows[k].size * 0.62, box.x + box.width + rows[k].space * 0.55, box.y + rows[k].size * 0.62, P.a); return P.onA; } } });
      });
      if (cur >= 0) {                                                    // the cursor jumps to the newest item and bobs while it waits
        const ym = mt + pad + cur * pitch + pitch / 2, bob = Math.floor((t - t0(cur)) * 4) % 2 ? u : 0;
        const x = rtl ? wx + ww - pad - hand + 2 * u + bob : wx + pad - bob;
        M.sprite(ctx, M.HAND, M.snap(x), M.snap(ym - 4 * u), hm, u, !rtl);
      }
    },
  };
}
