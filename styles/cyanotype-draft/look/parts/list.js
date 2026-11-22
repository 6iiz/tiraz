// A list as a specimen sheet: each item is a row with a small photogram leaf on the reading side (a different leaf for every row),
// the item in white, its number small in the mono face at the far end, and a dashed drafting line under it. The rows develop one per
// beat, each one as its own little rinse passes across it from the reading side; a key phrase sits on one paper mask. The title
// (optional) heads the sheet over a double rule. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const leafS = 84, indent = leafS + 26, numW = 64;
  const tx0 = rtl ? x0 + numW : x0 + indent, tx1 = rtl ? x1 - indent : x1 - numW;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW, minScale: 0.9, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead + 26, 132), head = title ? title.height + 46 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const leaves = items.map((_, k) => M.leaf(leafS, 300 + k * 17, pal.white, 'leaf'));
  const runs = rows.map((f, k) => M.keyRuns(M.layout(kit, f, { x0: tx0, x1: tx1, y: y0 + k * pitch + pitch / 2 })));
  const out = (t, k) => M.WASH(span(t, d - T.dur.out + k * 0.03, d));
  const pAt = (t, k) => M.DEV(span(t, at + 0.25 + k * T.beat, at + 0.25 + k * T.beat + T.dur.item)) * (1 - out(t, k));
  const tone = (p) => M.tone(pal, p);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        const p = M.DEV(span(t, at, at + T.dur.dev)) * (1 - out(t, 0));
        if (p > 0) {
          kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: pal.soft, each: (w, i, box, c) => { c.translate(0, (1 - p) * 8); return M.tone(pal, p, pal.soft); } });
          const yr = top + title.height + 12, len = maxW * p;
          M.seg(ctx, rtl ? x1 : x0, yr, rtl ? x1 - len : x0 + len, yr, 1, tone(p), 2);
          M.seg(ctx, rtl ? x1 : x0, yr + 8, rtl ? x1 - len : x0 + len, yr + 8, 1, tone(p * 0.8), 1);
        }
      }
      items.forEach((_, k) => {
        const p = pAt(t, k); if (p <= 0) return;
        const ym = y0 + k * pitch + pitch / 2;
        // the leaf: its own soft halo while it develops, then crisp
        ctx.save(); ctx.globalAlpha = p; ctx.drawImage(leaves[k], rtl ? x1 - leafS : x0, ym - leafS / 2); ctx.restore();
        for (const run of runs[k]) M.mask(ctx, pal, run.x0 - 12, run.y - rows[k].size * 0.62, run.x1 + 12, run.y + rows[k].size * 0.66, p, 40 + k);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.white, key: pal.coat,
          each: (w, i, box, c) => { c.translate(0, (1 - p) * 8); return w.key ? pal.coat : tone(p); } });
        ctx.save(); ctx.font = `500 ${T.size.index}px "${mono}"`; ctx.fillStyle = M.tone(pal, p, pal.soft); ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(String(k + 1).padStart(2, '0'), rtl ? x0 : x1, ym); ctx.restore();
        kit.rec(rtl ? x0 : x1 - 40, rtl ? x0 + 40 : x1, ym - 14, ym + 14, String(k + 1), { decor: true });
        const yl = y0 + (k + 1) * pitch - 4, len = maxW * p;
        M.seg(ctx, rtl ? x1 : x0, yl, rtl ? x1 - len : x0 + len, yl, 1, M.tone(pal, p, pal.ghost), 1.5, [14, 9]);
      });
    },
  };
}
