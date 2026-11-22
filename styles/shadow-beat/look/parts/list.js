// A list in silhouette: the title, then one row per beat, each snapping in beside a small black bird that beats its wings on the beat.
// A key phrase inside an item is one black slab with its words in the sun's colour. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, ind = 90;
  const tx0 = rtl ? x0 : x0 + ind, tx1 = rtl ? x1 - ind : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 700, maxW: x1 - x0 - 70, minScale: 0.9, minPx: 44, where: 'the list title' }) : null;
  const pitch = rows[0].lead + 12, titH = title ? title.height + 30 : 0;
  const top = kit.place(titH + pitch * items.length, 640), y0 = top + titH;
  const itemAt = (k) => at + 0.25 + k * T.beat;
  const runs = rows.map((f, k) => M.keyRuns(kit, f, { x0: tx0, x1: tx1, y: y0 + k * pitch + pitch / 2 }));
  const keyItem = runs.findIndex((r) => r.length), freeze = keyItem >= 0 ? [itemAt(keyItem), itemAt(keyItem) + T.dur.freeze] : null;
  const bird = (ctx, x, y, up) => {                                       // a gull: two wing arcs, up or down
    ctx.strokeStyle = pal.ink; ctx.fillStyle = pal.ink; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    const h = up ? -30 : 16, e = up ? -22 : 8;
    ctx.moveTo(x - 38, y + e); ctx.quadraticCurveTo(x - 18, y + h, x, y + 4); ctx.quadraticCurveTo(x + 18, y + h, x + 38, y + e); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { freeze });
      const down = M.sink(span(t, d - T.dur.out, d)) * 800;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, T.horizon); ctx.clip(); ctx.translate(0, down);
      if (title && t >= at) {
        ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? x1 - 46 : x0, top + title.lead / 2 - 4, 46, 8);
        kit.drawText(ctx, title, { x0: rtl ? x0 : x0 + 66, x1: rtl ? x1 - 66 : x1, y: top + title.lead / 2, align: 'start', color: pal.ink });
      }
      items.forEach((_, k) => {
        const s = M.snap(t, itemAt(k), T.dur.snap);
        if (s <= 0) return;
        const ym = y0 + k * pitch + pitch / 2, frozen = freeze && t >= freeze[0] && t < freeze[1];
        const up = frozen ? true : Math.floor((t + clock) / T.beat + k) % 2 === 0;
        bird(ctx, rtl ? x1 - 34 : x0 + 34, ym, up);
        ctx.save(); ctx.translate(rtl ? tx1 : tx0, ym); ctx.scale(s, s); ctx.translate(-(rtl ? tx1 : tx0), -ym);
        for (const r of runs[k]) M.slab(ctx, r, rows[k], pal.ink);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.sun });
        ctx.restore();
      });
      ctx.restore();
    },
  };
}
