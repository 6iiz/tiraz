// A list as Memphis tickets: each item on a rounded paper ticket (two tints, alternating) with an ink outline and a hard dotted shadow,
// flush to the reading side and as long as its words, with a Memphis mark as its bullet (dot, triangle, square, half-disc, zigzag).
// Tickets pop in one per beat with a small tilt that settles, alternating sides. A key phrase inside an item is one accent sticker.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, Z = T.zone, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const xa = SAFE.left + 10, xb = SAFE.right - 20, bullet = 62, padX = 26, textW = xb - xa - bullet - padX * 2 - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW - T.size.item * 0.6, single: true, where: 'a list item' }).map((f) => M.widen(f, f.size * 0.3, textW));
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: xb - xa, minPx: 44, where: 'the list title' }) : null;
  const th = Math.round(rows[0].size * 1.42), pitch = th + 16, head = title ? title.height + 14 : 0, block = head + pitch * items.length;
  const top = Math.max(T.frame.cy + T.frame.b + 50, Math.min(Z.top + (Z.bottom - Z.top - block) * 0.3, Z.bottom - block));
  const soft = mix(P.ink, P.paper, 0.3);
  const tickets = rows.map((f, k) => {
    const ym = top + head + k * pitch + th / 2, w = f.width + bullet + padX * 2;
    const r = rtl ? xb : xa + w, l = r - w;
    const tx1 = rtl ? r - padX - bullet : r - padX, tx0 = rtl ? l + padX : l + padX + bullet;
    return { f, ym, l, r, tx0, tx1, bx: rtl ? r - padX - bullet / 2 + 6 : l + padX + bullet / 2 - 6, inlays: M.runs(M.layout(f, tx0, tx1, ym, rtl)), fill: k % 2 ? P.ticketB : P.ticketA };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (title) kit.drawText(ctx, title, { x0: xa, x1: xb, y: top + title.lead / 2, align: 'start', color: soft,
        each: (w, i, box, c) => { const t0 = at + i * 0.05; if (M.pop(c, span(t, t0, t0 + T.dur.in), box.x + box.width / 2, box.y) === false) return false; if (M.leave(c, out, box.x + box.width / 2, box.y) === false) return false; } });
      tickets.forEach((k, i) => {
        const t0 = at + 0.15 + i * T.dur.beat, p = span(t, t0, t0 + T.dur.in), o = span(t, d - T.dur.out + i * 0.02, d);
        if (p <= 0 || o >= 1) return;
        const cx = (k.l + k.r) / 2;
        ctx.save(); M.pop(ctx, p, cx, k.ym, i % 2 ? 5 : -5); M.leave(ctx, o, cx, k.ym);
        M.sticker(ctx, P, k.l, k.r, k.ym - th / 2, k.ym + th / 2, k.fill, { off: 7, r: 18 });
        for (const r of k.inlays) { const px = Math.min(k.f.size * 0.22, k.f.space * 0.42); M.sticker(ctx, P, r.x0 - px, r.x1 + px, r.y - k.f.size * 0.56, r.y + k.f.size * 0.56, P.accent, { off: 0 }); }
        M.mark(ctx, P, [0, 1, 3, 4, 2][i], k.bx, k.ym, 30, [P.accent, P.pastel, P.soft, P.accent, P.ink][i]);
        kit.drawText(ctx, k.f, { x0: k.tx0, x1: k.tx1, y: k.ym, align: 'start', color: P.ink, key: P.onAccent });
        ctx.restore();
      });
    },
  };
}
