// A list in a 1-bit window: the title (when given) in the gap of the title bar, then one row per beat, each with a paper check box
// on the reading side that is ticked as the row is set (its words come in behind the block cursor). A key word (*…*) sits on the
// brand's accent. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, D = M.DOT;
  const x = SAFE.left, w = SAFE.right - SAFE.left, pad = 44, box = 40, indent = box + 36;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: w - pad * 2 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: w - 200, single: true, where: 'the list title' }) : null;
  const bar = title ? M.snap(title.lead + 16) : 48, pitch = M.snap(Math.max(108, rows[0].size * 1.8));
  const h = M.snap(bar + pad * 2 - 16 + pitch * items.length), y = M.snap(Math.min(kit.place(h, 700), T.floor - h));
  const tx0 = rtl ? x + pad : x + pad + indent, tx1 = rtl ? x + w - pad - indent : x + w - pad;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = M.step(t);
      M.dissolve(ctx, span(ts, at, at + T.dur.open), [x, y, w + 16, h + 16], (c) => M.plate(c, P, x, y, w, h, { bar, gapW: title ? title.width : 0,
        title: title && ((cx, cy) => kit.drawText(c, title, { x0: cx - title.width / 2 - 4, x1: cx + title.width / 2 + 4, y: cy, color: P.paper, key: P.paper })) }));
      if (ts < at + T.dur.open) return;
      items.forEach((_, k) => {
        const t0 = at + T.dur.open + 0.05 + k * T.beat, ym = y + bar + pad - 8 + k * pitch + pitch / 2;
        const bxx = M.snap(rtl ? x + w - pad - box : x + pad), byy = M.snap(ym - box / 2);
        ctx.fillStyle = P.paper; ctx.fillRect(bxx, byy, box, box); ctx.fillStyle = P.ink; ctx.fillRect(bxx + D, byy + D, box - 2 * D, box - 2 * D);
        if (ts >= t0) { ctx.fillStyle = P.paper; for (let i = 0; i < 6; i++) { ctx.fillRect(bxx + (2 + i) * D, byy + (2 + i) * D, D, D); ctx.fillRect(bxx + (7 - i) * D, byy + (2 + i) * D, D, D); } }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.paper, key: P.paper, each: M.typed(ts, t0, 0.07, P, rows[k].size, true, P.onAccent) });
      });
    },
  };
}
