// A list: a softer shadow title, then one row per beat. Each row hangs a small lattice tag of dyed hide on the reading side (it swings on
// its rivet as it arrives and settles); the row's words are pressed to the screen from the same side. A key phrase sits on its own plaque.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, dir = rtl ? 1 : -1;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const ts = 54, indent = 112, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 60, single: true, where: 'a list item' }).map((r) => M.isolate(r, 40, 2000));
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: x1 - x0, minScale: 0.85, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].size * 1.95, 120), head = title ? title.height + 40 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const tg = M.tag(ts, P, 61), tagX = rtl ? x1 - ts / 2 : x0 + ts / 2;
  const tItem = (k) => at + 0.25 + k * T.beat;
  const plaques = rows.map((r, k) => M.keyRuns(r, tx0, tx1, y0 + k * pitch + pitch / 2, 'start', rtl).map((run, j) => ({ ...run, pl: M.runPlaque(run, r.size, P, 70 + k * 3 + j, 30) })));
  const outAt = (k) => d - T.dur.out + k * 0.03;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: P.soft,
        each: (w, i, box, c) => { const t0 = at + i * 0.05, mx = box.x + box.width / 2;
          if (M.press(c, span(t, t0, t0 + T.dur.press), mx, box.y, dir) === false) return false;
          if (M.lift(c, span(t, outAt(0), d), mx, box.y) === false) return false; } });
      items.forEach((_, k) => {
        const t0 = tItem(k), ym = y0 + k * pitch + pitch / 2, o = span(t, outAt(k + 1), d);
        if (t < t0) return;
        ctx.save();
        if (M.press(ctx, span(t, t0, t0 + T.dur.press), tagX, ym, dir) !== false && M.lift(ctx, o, tagX, ym) !== false) {
          const u = t - t0, sw = 0.5 * Math.exp(-3.2 * u) * Math.sin(u * 9) + 0.03 * Math.sin(t * 2.3 + k);
          ctx.translate(tagX, ym - ts * 0.75); ctx.rotate(sw); ctx.drawImage(tg.img, -tg.w / 2, -ts * 0.1 - 4);
        }
        ctx.restore();
        for (const run of plaques[k]) {
          const cx = (run.x0 + run.x1) / 2; ctx.save();
          if (M.press(ctx, span(t, t0 + 0.05, t0 + 0.05 + T.dur.press), cx, ym, dir) !== false && M.lift(ctx, o, cx, ym) !== false) {
            ctx.translate(0, M.bob(t, t0 + 0.4, k)); M.lay(ctx, run.pl, cx, ym);
          }
          ctx.restore();
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => {
            if (w.ph) return false;
            const s0 = t0 + 0.05 + i * 0.05, mx = box.x + box.width / 2;
            if (M.press(c, span(t, s0, s0 + T.dur.press), mx, box.y, dir) === false) return false;
            if (M.lift(c, o, mx, box.y) === false) return false;
            if (w.key) c.translate(0, M.bob(t, t0 + 0.4, k));
          } });
      });
    },
  };
}
