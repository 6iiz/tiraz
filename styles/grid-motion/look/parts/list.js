// A list as kinetic type: each item is one track of the grid, its giant index numeral at the far end and the item flush to the
// reading side above a heavy ink rule. Tracks shoot in one per beat from alternating sides and stop dead; an item with a key phrase
// carries it on an ink slab. The title (optional) arrives first on its own track. Everything carries on through the frame at the end.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const indexW = kit.numberWidth('8', T.size.index, 900, 1) + 36;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - indexW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW, minScale: 0.85, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead + 14, 156), head = title ? title.height + 22 + 12 + 26 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const tx0 = rtl ? x0 + indexW : x0, tx1 = rtl ? x1 : x1 - indexW;
  const boxes = rows.map((f, k) => M.layout(kit, f, { x0: tx0, x1: tx1, y: y0 + k * pitch + pitch / 2 - 6 }));
  const runs = boxes.map((b) => M.keyRuns(b));
  const nT = title ? title.rows.length + 1 : 0, n = nT + items.length;
  const t0 = (g) => (g < nT ? at + g * 0.1 : at + 0.2 + (g - nT) * T.beat + (nT ? 0.1 : 0));
  const out0 = d - T.dur.out - 0.04 * (n - 1);
  const dx = (t, g) => M.travel(W, span(t, t0(g), t0(g) + T.dur.slide), span(t, out0 + g * 0.04, out0 + g * 0.04 + T.dur.out), M.rowDir(g, rtl));
  const keyed = items.findIndex((s) => /\*[^*]+\*/.test(s)), hero = keyed >= 0 ? keyed : items.length - 1;
  const ghost = kit.fit(items[hero].replace(/\*/g, ''), { size: T.size.ghost, weight: 900, maxW: 99999, single: true, overflow: true, where: 'the ghost type' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.ticker(ctx, kit, ghost, t + clock, { W, y: 1600, color: pal.ghost, speed: T.ticker });
      if (title) {
        kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: pal.ink,
          each: (w, i, box, c) => { const o = dx(t, box.row); if (o === null) return false; c.translate(o, 0); } });
        const ob = dx(t, nT - 1); if (ob !== null) { ctx.fillStyle = pal.ink; ctx.fillRect(x0 + ob, top + title.height + 22, maxW, 12); }
      }
      items.forEach((_, k) => {
        const o = dx(t, nT + k); if (o === null) return;
        const yr = y0 + k * pitch, ym = yr + pitch / 2 - 6;
        ctx.save(); ctx.translate(o, 0);
        ctx.fillStyle = pal.ink; ctx.fillRect(x0, yr + pitch - 4, maxW, 4);
        kit.number(ctx, kit.fmt(k + 1), { x: rtl ? x0 : x1, y: ym, size: T.size.index, color: pal.ink, align: rtl ? 'left' : 'right', decor: true });
        for (const run of runs[k]) M.slab(ctx, run, rows[k].size, rows[k].space, pal.ink);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.ground });
        ctx.restore();
      });
    },
  };
}
