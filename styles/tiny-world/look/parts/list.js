// A list as a street of rooftops: each item is its own building, flush to the reading side and as wide as its words need, rising out
// of the town in time-lapse steps one per beat; the words are then set down on its roof. A key phrase sits on a painted tarp.
// The title, if any, is on a lower, narrower roof above them. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 40, x1 = SAFE.right - 40;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minPx: 46, where: 'the list title' }) : null;
  const rh = rows[0].lead + 34, gap = 30, th = title ? title.height + 40 : 0;
  const total = (title ? th + gap : 0) + items.length * (rh + gap) - gap;
  const top = kit.place(total, 720);
  const edge = rtl ? SAFE.right + 26 : SAFE.left - 26;
  const roofFor = (wid, y, h) => { const w = Math.min(W - 88, Math.max(360, wid + 120)); return { x: rtl ? edge - w : edge, y, w, h }; };
  const tRoof = title ? roofFor(title.width, top, th) : null;
  const y0 = top + (title ? th + gap : 0);
  const roofs = rows.map((f, k) => roofFor(f.width, y0 + k * (rh + gap), rh));
  const ys = roofs.map((r) => r.y + r.h / 2);
  const runs = rows.map((f, k) => M.keyRuns(f, { x0, x1, y: ys[k], align: 'start' }, rtl));
  const t0s = items.map((_, k) => at + 0.25 + k * T.beat);
  const band = { y: top + total / 2 - 13, h: total + 30 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, band);
      const tl = M.lapse(t);
      if (title) { ctx.save(); if (M.slab(ctx, tRoof, pal, (tl - at) / 0.24, 18)) kit.drawText(ctx, title, { x0, x1, y: top + th / 2 - (title.rows.length - 1) * title.lead / 2, align: 'start', color: pal.muted, each: (w, i, box, c) => M.setDown(c, t, at + 0.2 + i * 0.06, box) }); ctx.restore(); }
      items.forEach((_, k) => {
        ctx.save();
        if (M.slab(ctx, roofs[k], pal, (tl - t0s[k] + 0.2) / 0.24, 18 + (k % 2) * 14)) {
          for (const r of runs[k]) M.tarp(ctx, r, rows[k].size, (tl - t0s[k] - r.first * 0.06) / 0.2, pal, rtl);
          kit.drawText(ctx, rows[k], { x0, x1, y: ys[k], align: 'start', color: pal.ink, key: pal.onAccent, each: (w, i, box, c) => M.setDown(c, t, t0s[k] + i * 0.06, box) });
        }
        ctx.restore();
      });
    },
  };
}
