// A list as a little street: each item gets its own small house on the reading side, which stands up off its footprint one per beat,
// and the item's words stand up beside it. The item with a key phrase gets the accent roof and its phrase an awning.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const inset = 150, tx0 = rtl ? SAFE.left + 10 : SAFE.left + inset, tx1 = rtl ? SAFE.right - inset : SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, minPx: 46, where: 'the list title' }) : null;
  const pitch = Math.max(140, rows[0].size * 2.25), titleH = title ? title.height + 40 : 0;
  const top = kit.place(titleH + pitch * items.length, 700), y0 = top + titleH;
  const ys = items.map((_, k) => y0 + k * pitch + pitch / 2);
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const t0s = items.map((_, k) => at + 0.2 + k * T.beat);
  const runs = rows.map((f, k) => M.keyRuns(f, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }, rtl));
  const hx = rtl ? SAFE.right - 70 : SAFE.left + 70, u = 15;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.muted,
        each: (w, i, box, c) => { const s = at + i * 0.07; if (M.unfold(c, span(t, s, s + T.dur.in), box, title.size) === false) return false; } });
      items.forEach((_, k) => {
        const g = M.E(span(t, t0s[k] - 0.1, t0s[k] + 0.35));
        // the house: footprint 3.6 x 3, its front corner just under the row's baseline
        const P = M.project(hx - 0.3 * M.C30 * u, ys[k] + 34 - 3.3 * u, u);
        M.house(ctx, P, 3.6, 3, 2.6, 1.6, pal.walls[k % 2 ? 0 : 4], keyed[k] ? pal.roofs[0] : pal.roofs[k % 2 ? 2 : 4], { grow: g, glass: pal.glass, lit: keyed[k] ? pal.lit : null, windows: 2, doorAt: 0 });
        for (const r of runs[k]) { const s = t0s[k] + r.first * 0.07; M.awning(ctx, r, rows[k].size, span(t, s, s + 0.4), pal); }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', color: pal.ink, key: pal.onAccent,
          each: (w, i, box, c) => { const s = t0s[k] + i * 0.07; if (M.unfold(c, span(t, s, s + T.dur.in), box, rows[k].size) === false) return false; } });
      });
    },
  };
}
