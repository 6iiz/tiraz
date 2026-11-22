// A list as an exploded view: each item is set on a thin pane of glass. The panes come down one per beat into a stack held apart (an
// exploded view), then on the downbeat after the last one the stack closes up precisely and a line of light runs along every top edge.
// The key phrase sits on a frosted slab lit with the accent. The index of each pane is a small mono number on its far side.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, rr, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, n = items.length;
  if (!Array.isArray(items) || !n || n > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const px0 = 90, px1 = W - 90, idx = 70, tx0 = rtl ? px0 + idx : px0 + 40, tx1 = rtl ? px1 - 40 : px1 - idx;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, minScale: 0.8, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW: SAFE.right - SAFE.left - 40, minPx: 44, where: 'the list title' }) : null;
  const h = (k) => rows[k].height + 30, gap = 16, titleH = title ? title.height + 40 : 0;
  const final = titleH + items.reduce((s, _, k) => s + h(k) + gap, -gap);
  const extra = n > 1 ? Math.max(0, Math.min(44, (SAFE.bottom - SAFE.top - 20 - final) / (n - 1))) : 0;
  const top = kit.place(final + extra * (n - 1), 760);
  const beat = Math.min(0.42, (d - 1.4) / Math.max(1, n)), land = (k) => at + 0.35 + k * beat, snapT = land(n - 1) + 0.4;
  const frost = mix(P.field, P.light, 0.07);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const snap = M.IO(span(t, snapT, snapT + 0.22)), spread = extra * (1 - snap), lit = span(t, snapT + 0.1, snapT + 0.7);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left + 20, x1: SAFE.right - 20, y: top + title.lead / 2, color: P.grey,
        each: (w, i, box, c) => { const s = at + i * 0.05; if (M.arrive(c, span(t, s, s + T.dur.in), box, title.size) === false) return false; } });
      let y = top + titleH;
      items.forEach((_, k) => {
        const p = span(t, land(k) - 0.4, land(k)), hk = h(k), yk = y + k * spread; y += hk + gap;
        if (p <= 0) return;
        const e = M.IO(p);
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 2); ctx.translate(0, -90 * (1 - e));
        ctx.fillStyle = frost; rr(ctx, px0, yk, px1 - px0, hk, 18); ctx.fill();
        ctx.strokeStyle = P.a(P.light, 0.22); ctx.lineWidth = 1.5; ctx.stroke();
        M.hairline(ctx, P, px0 + 18, px1 - 18, yk, 1);
        if (lit > 0 && lit < 1) { const lx = px0 + (px1 - px0) * (rtl ? 1 - lit : lit); const g = ctx.createRadialGradient(lx, yk, 0, lx, yk, 140);
          g.addColorStop(0, P.a(P.light, 0.9)); g.addColorStop(1, P.a(P.light, 0)); ctx.fillStyle = g; ctx.fillRect(lx - 140, yk - 4, 280, 8); }
        const ym = yk + 15 + rows[k].lead / 2, spans = M.keySpans(rows[k], tx0, tx1, ym, 'start', rtl);
        for (const s of spans) M.frost(ctx, P, s, rows[k], span(t, land(k), land(k) + 0.3));
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.light, key: P.keyText });
        ctx.font = `400 24px "${mono}"`; ctx.fillStyle = P.grey; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'center';
        const ix = rtl ? px0 + idx / 2 + 6 : px1 - idx / 2 - 6, label = String(k + 1).padStart(2, '0');
        ctx.fillText(label, ix, yk + hk / 2); kit.rec(ix - 20, ix + 20, yk + hk / 2 - 14, yk + hk / 2 + 14, label, { decor: true });
        ctx.restore();
      });
    },
  };
}
