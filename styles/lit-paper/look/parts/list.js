// A list cut through a tall card: the title glows first, dimmer; then one row per beat, each with a small lantern-shaped cut on the reading
// side that lights a moment before its words. A key phrase glows through accent tissue with one slot under it.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2, indent = 80;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 50, single: true, where: 'a list item' }).map((r) => M.isolate(r, r.size * 0.42, 2000));
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW, minScale: 0.85, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].size * 1.75, 110), head = title ? title.height + 26 : 0, block = head + pitch * items.length;
  const top = kit.place(block + 60, 720) + 30, y0 = top + head;
  const C = M.card(W - 120, block + 90, P, 27), cx0 = 60, cy0 = top - 45;
  const runs = rows.map((r, k) => M.keyRuns(r, tx0, tx1, y0 + k * pitch + pitch / 2, 'start', rtl));
  const soft = mix(P.glow, P.card, 0.22), lx = rtl ? x1 - 22 : x0 + 22;
  const tItem = (k) => at + 0.3 + k * T.beat;
  const lantern = (c, x, y, p) => {
    if (p <= 0) return; const q = M.O(p);
    c.save(); c.fillStyle = mix(P.dim, P.glow, q); c.shadowColor = rgba(P.glow, 0.7 * q); c.shadowBlur = 14 * q;
    c.beginPath(); c.ellipse(x, y, 13, 19, 0, 0, Math.PI * 2); c.fill(); c.fillRect(x - 7, y - 26, 14, 5); c.fillRect(x - 7, y + 21, 14, 5); c.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = M.groove(span(t, at, at + 0.42), span(t, d - T.dur.out, d));
      if (g) {
        ctx.save(); ctx.translate(ground.drift(t, 0.55), g.dy);
        M.layCard(ctx, C, cx0, cy0, g.lift);
        if (title) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: soft,
          each: (w, i, box, c) => { const s0 = at + 0.12 + i * 0.05; return M.light(c, span(t, s0, s0 + T.dur.light), soft, P); } });
        items.forEach((_, k) => {
          const t0 = tItem(k), ym = y0 + k * pitch + pitch / 2;
          lantern(ctx, lx, ym, span(t, t0 - 0.08, t0 + 0.12));
          for (const r of runs[k]) M.slot(ctx, r.x0, r.x1, r.y, rows[k].size, span(t, t0 + 0.05, t0 + 0.35), P);
          kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.glow, key: P.key,
            each: (w, i, box, c) => { if (w.ph) return false; const s0 = t0 + (w.idx ?? i) * 0.05; return M.light(c, span(t, s0, s0 + T.dur.light), w.key ? P.key : P.glow, P); } });
        });
        ctx.restore();
      }
      ground.drawFront(ctx, t);
    },
  };
}
