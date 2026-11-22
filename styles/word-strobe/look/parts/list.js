// A list as a run of title cards in the corridor: the title above with the accent rail, then one paper field per item, each cut in on
// the beat (its field opens in three hard steps, its words appear at once), with its number in the mono face in the accent at the
// far end. A key phrase inside an item sits on one accent block. The strobe behind shows the newest item's first word.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, room: 'corridor' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, numW = 70;
  const tx0 = rtl ? x0 + numW : x0, tx1 = rtl ? x1 : x1 - numW;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 700, maxW: x1 - x0 - 40, minScale: 0.9, minPx: 44, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.32 + 34, titH = title ? title.height + 40 : 0;
  const top = kit.place(titH + pitch * items.length, 700), y0 = top + titH;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const itemAt = (k) => at + 0.25 + k * T.beat * 0.7;
  const giants = items.map((it) => M.giantsOf(kit, it, T, brand.fonts.display.family)[0]);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t / d);
      const off = M.gone(t, d, items.length + (title ? 1 : 0), T);
      let cur = -1; items.forEach((_, k) => { if (t >= itemAt(k)) cur = k; });
      if (cur >= 0 && off === 0) {
        const last = itemAt(items.length - 1) + 0.3, which = t < last ? cur : (cur + 1 + Math.floor((t - last) / T.beat)) % items.length;
        M.ghost(ctx, kit, W, giants, which, pal.ghost);
      }
      if (title && t >= at && off < items.length + 1) {
        ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? W - 34 : 0, top + title.lead * 0.15, 34, title.height - title.lead * 0.3);
        kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: pal.paper });
      }
      items.forEach((_, k) => {
        if (t < itemAt(k) || items.length - 1 - k < off) return;
        const ym = y0 + k * pitch + pitch / 2, f = rows[k];
        const box = M.rowBoxes(kit, f, tx0, tx1, ym)[0];
        M.field(ctx, W, box, f.size, M.opens(t, itemAt(k), T), pal.paper, rtl);
        if (t < itemAt(k) + 2 * T.frame) return;
        for (const run of M.keyRuns(kit, f, { x0: tx0, x1: tx1, y: ym })) M.block(ctx, run, f, pal.accent);
        kit.drawText(ctx, f, { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.onAccent });
        ctx.save(); ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = pal.mark; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        const nx = rtl ? box.x0 - f.size * 0.36 - 16 : box.x1 + f.size * 0.36 + 16;     // the number sits just past the field's end
        ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(String(k + 1).padStart(2, '0'), nx, ym); ctx.restore();
        kit.rec(rtl ? nx - 44 : nx, rtl ? nx : nx + 44, ym - 16, ym + 16, String(k + 1), { decor: true });
      });
    },
  };
}
