// A list as answer cards on the polka-dot set: the title on an ink banner, then one paper card per item popping in on each beat,
// each with a numbered accent bubble pinned to its reading-side end. A key phrase inside an item gets one accent sticker.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, set: 'dots' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const cx0 = SAFE.left, cw = SAFE.right - SAFE.left - 14, bub = 74, pad = 40;
  const tx0 = kit.rtl ? cx0 + pad : cx0 + bub + 30, tx1 = kit.rtl ? cx0 + cw - bub - 30 : cx0 + cw - pad;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 2 * M.GAP, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: cw - 120, minScale: 0.9, minPx: 44, where: 'the list title' }) : null;
  const ch = rows[0].lead + 16, gap = 30, pitch = ch + gap, titH = title ? title.height + 18 : 0;
  const top = kit.place((title ? titH + 40 : 0) + pitch * items.length, 700);
  const y0 = top + (title ? titH + 40 : 0), titW = title ? title.width + 72 : 0, titX = kit.rtl ? cx0 + cw - titW : cx0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const itemAt = (k) => at + 0.3 + k * T.beat;
  const runs = rows.map((r, k) => M.keyRunsRows(kit, r, { x0: tx0, x1: tx1, y: y0 + k * pitch + ch / 2 }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.shrink(span(t, d - T.dur.out, d));
      if (out <= 0) return;
      ctx.save(); M.around(ctx, W / 2, top + (y0 - top + pitch * items.length) / 2, out);
      if (title) {
        const s = M.pop(span(t, at, at + T.dur.pop));
        if (s > 0) {
          ctx.save(); M.around(ctx, titX + titW / 2, top + titH / 2, s); M.ribbon(ctx, titX, top, titW, titH, pal);
          kit.drawText(ctx, title, { x0: titX + 36, x1: titX + titW - 36, y: top + 9 + title.lead / 2, align: 'start', color: pal.paper }); ctx.restore();
        }
      }
      items.forEach((_, k) => {
        const t0 = itemAt(k), s = M.pop(span(t, t0, t0 + T.dur.pop));
        if (s <= 0) return;
        const y = y0 + k * pitch, ym = y + ch / 2;
        ctx.save(); M.around(ctx, cx0 + cw / 2, ym, s);
        M.card(ctx, cx0, y, cw, ch, pal.paper, pal.ink, T, { r: 26, shadow: 10 });
        const bx = kit.rtl ? cx0 + cw - bub / 2 - 16 : cx0 + bub / 2 + 16, bs = M.nod(t - k * T.beat, t0 + 0.4 - k * T.beat, T.beat) ** 2;
        ctx.save(); M.around(ctx, bx, ym, bs);
        ctx.fillStyle = pal.accent; ctx.strokeStyle = pal.ink; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(bx, ym, bub / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = pal.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), bx, ym + 2);
        ctx.restore();
        kit.rec(bx - 20, bx + 20, ym - 18, ym + 18, String(k + 1), { decor: true });
        for (const r of runs[k]) { ctx.save(); ctx.translate(M.nudge(runs[k], r.first, kit.rtl), 0); M.sticker(ctx, r, rows[k], pal, T, M.pop(span(t, t0 + 0.08, t0 + 0.08 + T.dur.pop))); ctx.restore(); }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.onAccent, each: (w, i, box, c) => { c.translate(M.nudge(runs[k], i, kit.rtl), 0); } });
        ctx.restore();
      });
      ctx.restore();
    },
  };
}
