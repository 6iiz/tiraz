// A list as an intertitle card: the card opens, the title (if any) is exposed over an ornament rule, then each item is exposed in turn,
// one per beat, set from the reading side behind a small lozenge, with a dotted leader running to the far side. The item with a key word
// is written in the accent (when it reads) and gets the flourish. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, C = T.card, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = C.x0 + C.padX, x1 = C.x1 - C.padX, cx = (C.x0 + C.x1) / 2, bullet = 44;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - bullet - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].lead * 1.12, head = title ? title.lead + 56 : 0;
  const h = C.padY * 2 + head + pitch * items.length - (pitch - rows[0].lead), top = kit.place(h, 720);
  const yTitle = top + C.padY + (title ? title.lead / 2 : 0), yRule = yTitle + (title ? title.lead / 2 + 22 : 0), y0 = top + C.padY + head;
  const t0 = 0.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const w = ground.weave(t), tc = M.crank(t - at);
      ctx.save(); ctx.translate(w.x, w.y);
      M.card(ctx, C.x0, top, C.x1, top + h, span(tc, 0, 0.34), P, C.notch);
      if (title) {
        kit.drawText(ctx, title, { x0, x1, y: yTitle, color: P.dim, each: (wd, i, box, c) => M.expose(c, span(tc, 0.2, 0.45), title.size) });
        M.rule(ctx, cx, yRule, 380, span(tc, 0.3, 0.6), P);
      }
      items.forEach((_, k) => {
        const tk = t0 + k * T.beat, pe = span(tc, tk, tk + 0.25);
        if (pe <= 0) return;
        const ym = y0 + k * pitch + rows[k].lead / 2, bx = rtl ? x1 - 10 : x0 + 10;
        ctx.save(); ctx.globalAlpha = Math.min(1, pe * 1.35);
        M.diamond(ctx, bx, ym, 8, P.flourish);
        const textEnd = rtl ? x1 - bullet - rows[k].width : x0 + bullet + rows[k].width;   // a dotted leader from the item to the far side
        ctx.fillStyle = P.dim;
        for (let x = textEnd + (rtl ? -24 : 24); rtl ? x > x0 : x < x1; x += rtl ? -16 : 16) { ctx.beginPath(); ctx.arc(x, ym + rows[k].size * 0.2, 2, 0, 7); ctx.fill(); }
        ctx.restore();
        kit.drawText(ctx, rows[k], { x0: rtl ? x0 : x0 + bullet, x1: rtl ? x1 - bullet : x1, y: ym, align: 'start', color: P.silver, key: P.key,
          each: (wd, i, box, c) => {
            if (M.expose(c, pe, rows[k].size) === false) return false;
            if (wd.key) M.flourish(c, box.x, box.x + box.width, box.y + rows[k].size * 0.78, span(tc, tk + 0.25, tk + 0.55), P, rtl);
          } });
      });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
