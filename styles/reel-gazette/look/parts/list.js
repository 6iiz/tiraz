// A list as a title card of the newsreel: a dark card in a deco frame, the title at its head between two rules, and the items cut in one
// per beat, each on its own film frame with a small jump as it settles, after a diamond tinted in the accent.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left, x1 = SAFE.right, inset = 70, bullet = 50;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - inset * 2 - bullet, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 800, maxW: x1 - x0 - inset * 2, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.75, head = title ? title.lead + 60 : 0, ch = 70 + head + pitch * items.length + 40;
  const top = kit.place(ch, 760);
  const tk = (k) => at + 0.3 + k * 0.4;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.q(t), pc = M.O(span(f, at - 0.1, at + 0.2));
      if (pc > 0) {
        ctx.save(); ground.weave(ctx, t);
        const h = ch * (0.85 + 0.15 * pc);
        ctx.globalAlpha = Math.min(1, pc * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0 + 12, top + 14, x1 - x0, h);
        ctx.fillStyle = P.card; ctx.fillRect(x0, top, x1 - x0, h);
        M.frame(ctx, x0 + 10, top + 10, x1 - x0 - 20, h - 20, P.rule, P.accent);
        ctx.restore();
      }
      let y = top + 50;
      if (title && pc > 0.6) {
        kit.drawText(ctx, title, { x0, x1, y: y + title.lead / 2, color: P.light, key: P.light });
        ctx.fillStyle = P.rule; ctx.fillRect(W / 2 - title.width / 2, y + title.lead + 14, title.width, 2); ctx.fillRect(W / 2 - title.width / 2 + 40, y + title.lead + 22, title.width - 80, 2);
      }
      y += head + 10;
      rows.forEach((r, k) => {
        const t0 = tk(k); if (f < t0) return;
        const jump = f < t0 + 2 / M.fps ? -10 : 0, ym = y + k * pitch + pitch / 2 + jump;
        const bx = rtl ? x1 - inset : x0 + inset;
        M.diamond(ctx, bx, ym, 13, P.accent);
        M.inked(kit, ctx, r, { x0: rtl ? x0 + inset : bx + bullet, x1: rtl ? bx - bullet : x1 - inset, y: ym, align: 'start', color: P.light, P, tintP: 1, seed: 40 + k });
      });
      ground.over(ctx, t);
    },
  };
}
