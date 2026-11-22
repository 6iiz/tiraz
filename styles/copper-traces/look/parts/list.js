// A list as a pin header: a column of pads on the reading side, pin 1 square, the rest round, inside a silkscreen outline. Each item
// has its own trace from the board's edge to its pin. One beat at a time a pulse runs in along the trace, the pin lights, and the
// item printed beside it powers up. An item with a key word gets an exposed gold pad under that word, lit a moment later.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const xp = rtl ? SAFE.right - 22 : SAFE.left + 22, tx0 = rtl ? SAFE.left + 20 : xp + 60, tx1 = rtl ? xp - 60 : SAFE.right - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: SAFE.right - SAFE.left - 20, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(120, rows[0].lead + 34), head = title ? title.lead + 56 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const ys = items.map((_, k) => y0 + k * pitch + pitch / 2);
  const feeds = ys.map((y) => M.route(rtl ? [[W + 20, y], [xp, y]] : [[-20, y], [xp, y]]));
  const times = items.map((_, k) => at + 0.25 + k * T.beat);
  const wb = rows.map((r, k) => M.boxes(kit, r, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, out0, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -36 * o);
      M.field(ctx, SAFE.left - 54, top - 30, SAFE.right + 54, y0 + pitch * items.length + 24, P);
      if (title) {
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: P.dim,
          each: (w, i, box, c) => M.power(c, t, at - 0.15 + i * 0.05, T.dur.in, box, title.size, P) });
        const lw = title.width * span(t, at - 0.1, at + 0.3);
        ctx.fillStyle = P.dim; ctx.fillRect(rtl ? SAFE.right - lw : SAFE.left, top + title.lead + 6, lw, 3);
      }
      // the header outline
      ctx.strokeStyle = 'transparent';
      ctx.strokeStyle = P.dim; ctx.lineWidth = 2.5; ctx.strokeRect(xp - 34, y0 + 8, 68, pitch * items.length - 16);
      items.forEach((_, k) => {
        const t0 = times[k], y = ys[k], q = span(t, t0 - T.dur.run, t0);
        M.trace(ctx, feeds[k], P, 9);
        if (q > 0) M.glow(ctx, feeds[k], P, q < 1 ? feeds[k].total * M.Q(q) - 140 : 0, feeds[k].total * M.Q(q), 9, q < 1 ? 1 : 0.35);
        const lit = span(t, t0, t0 + 0.08) * (1 - 0.5 * span(t, t0 + 0.1, t0 + 0.6));
        if (k === 0) M.pad(ctx, xp - 22, y - 22, 44, 44, 4, P, lit); else M.pad(ctx, xp - 22, y - 22, 44, 44, 22, P, lit);
        ctx.save(); ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.onGold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), xp, y + 1); ctx.restore();
        kit.rec(xp - 12, xp + 12, y - 12, y + 12, String(k + 1), { decor: true });
        const kp = span(t, t0 + 0.18, t0 + 0.4);
        if (kp > 0) for (const b of M.spans(wb[k].filter((b) => b.key))) {
          const s = rows[k].size, w = b.width + s * 0.36, h = s * 1.22, e = M.E(kp);
          ctx.save(); ctx.translate(b.x + b.width / 2, b.y); ctx.scale(0.86 + 0.14 * e, 0.86 + 0.14 * e); ctx.globalAlpha *= Math.min(1, kp * 3);
          M.pad(ctx, -w / 2, -h / 2 - s * 0.04, w, h, 10, P, Math.sin(Math.PI * Math.min(1, kp * 1.6)) * 0.9); ctx.restore();
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y, align: 'start', color: P.silk, key: P.silk,
          each: (w, i, box, c) => {
            if (M.power(c, t, t0 + 0.03 + i * 0.04, T.dur.in, box, rows[k].size, P, 0, t0 - 0.2) === false) return false;
            if (w.key && t >= t0 + 0.26) return P.onGold;
          } });
      });
      ctx.restore();
    },
  };
}
