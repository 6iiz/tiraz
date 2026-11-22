// A list as stuff out of a portal. The title is typed on a terminal tag; a portal swirls open at the reading-side edge, and each item
// is spat out of it as a tag that flies a short arc to its slot and lands with a squish, one every 0.45 s. A key item (*…*) gets the
// accent splat. The duo watch the portal. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, C = T.cast;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const tx0 = SAFE.left, tx1 = SAFE.right - 70, pad = 40;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 2 * pad, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW: SAFE.right - SAFE.left - 80, minScale: 0.88, where: 'the list title' }) : null;
  const rowH = rows[0].size * 1.6, pitch = rowH + 40, tH = title ? title.height + 40 : 0;
  const top = kit.place(tH + (title ? 40 : 0) + pitch * items.length, 720), y0 = top + tH + (title ? 40 : 0);
  const yT = top + 20 + (title ? title.lead / 2 : 0);
  const side = rtl ? 1 : -1, px = rtl ? W - 28 : 28, py = y0 + (pitch * items.length) / 2;
  const tIn = (k) => at + 0.35 + k * 0.45;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = ground.k(t), tt = t + clock;
      M.duo(ctx, P, C, tt, k, { look: [side * 0.8, -0.7] }, { look: [side * 0.9, -0.8], take: 0.25 * span(t, at + 0.3, at + 0.5) });
      if (title) {
        M.tag(ctx, P, k, SAFE.left + 20, top, SAFE.right - 20, top + tH, span(t, at, at + 0.2));
        kit.drawText(ctx, title, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: yT, color: P.light, key: P.accent, each: (w, i) => { if (t < at + 0.1 + i * 0.07) return false; } });
      }
      const pr = 120 * M.ease.outBack(span(t, at + 0.05, at + 0.4)) * (1 - M.ease.outCubic(span(t, d - 0.5, d - 0.15)));
      M.portal(ctx, P, px, py, pr, tt, k);
      items.forEach((_, j) => {
        const p = span(t, tIn(j), tIn(j) + 0.32); if (p <= 0) return;
        const ys = y0 + j * pitch, ym = ys + rowH / 2, e = M.ease.outCubic(p);
        const cx = (tx0 + tx1) / 2, fx = M.lerp(px, cx, e), fy = M.lerp(py, ym, e) - Math.sin(Math.PI * e) * 90, s = M.lerp(0.25, 1, e);
        const land = span(t, tIn(j) + 0.32, tIn(j) + 0.5), sq = land > 0 && land < 1 ? 1 - 0.12 * Math.sin(Math.PI * land) : 1;
        ctx.save(); ctx.translate(fx, fy + rowH / 2); ctx.scale(s * (2 - sq), s * sq); ctx.rotate(side * 0.25 * (1 - e)); ctx.translate(-cx, -(ym + rowH / 2));
        M.shape(ctx, P, M.box(tx0, ys, tx1, ys + rowH, 24), k, { fill: P.paper, shadow: P.shade, seed: 100 + j, sx: -10, sy: -10 });
        const runs = M.layout(rows[j], { x0: tx0 + pad, x1: tx1 - pad, y: ym, align: 'start' }, rtl).filter((b) => b.key);
        if (runs.length) { const a = Math.min(...runs.map((b) => b.x)), z = Math.max(...runs.map((b) => b.x + b.width)); M.splat(ctx, P, { x: a, y: ym, width: z - a }, rows[j].size, span(t, tIn(j) + 0.35, tIn(j) + 0.65), k); }
        kit.drawText(ctx, rows[j], { x0: tx0 + pad, x1: tx1 - pad, y: ym, align: 'start', color: P.dark, key: P.onAccent });
        ctx.restore();
      });
    },
  };
}
export { clamp };
