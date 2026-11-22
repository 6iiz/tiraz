// A list as a tall glazed light. A border of small coloured pieces is set round it piece by piece; the title is painted on a narrow
// pane at its head. Then the rows are leaded in one per beat, each a clear pane with a round jewel at its reading end, dropped rigidly
// into place on the stepped clock; the sun finds each row as it lands and its words come up. Key words (*…*) sit on the accent's glass.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, b = 30;
  const pw = SAFE.right - SAFE.left - 2 * b - 10, px = cx - pw / 2, jw = 70, padX = 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: pw - jw - padX * 2 - 20, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: pw - 80, single: true, where: 'the list title' }) : null;
  const rh = rows[0].lead + 30, gap = 16, th = title ? title.lead + 30 : 0;
  const ph = th + (title ? gap : 0) + items.length * (rh + gap) - gap;
  const top = kit.place(ph + 2 * b, 730), py = top + b;
  const frame = M.border(px, py, pw, ph, pal, 77, b, 6);
  const to = title ? { x0: cx - title.width / 2, x1: cx + title.width / 2, y: py + th / 2, align: 'center' } : null;
  const ys = items.map((_, k) => py + th + (title ? gap : 0) + k * (rh + gap));
  const ro = rows.map((r, k) => ({ x0: rtl ? px + padX : px + jw + padX, x1: rtl ? px + pw - jw - padX : px + pw - padX, y: ys[k] + rh / 2, align: 'start' }));
  const boxes = rows.map((r, k) => M.boxesOf(kit, r, ro[k]));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.q(t), out = span(t, d - T.dur.out, d), keep = 1 - Math.floor(out * 4) / 4;
      if (keep <= 0 || tq < at) return;
      ctx.save(); ctx.globalAlpha = keep;
      // the opening behind the rows, dark until each row is set
      ctx.fillStyle = M.glass(pal, pal.tints[3], 0); ctx.fillRect(px, py, pw, ph);
      frame.draw(ctx, span(tq, at, at + T.dur.set), () => clamp(span(tq, at + 0.2, at + 0.7)));
      if (title) {
        const L = M.sun(tq, at + 0.25, T.dur.sun, rtl, 0.08);
        M.pane(ctx, px, py, pw, th, pal, { lit: L(cx, py), r: 4, lead: 7, color: pal.tints[4] });
        kit.drawText(ctx, title, { ...to, color: pal.on(pal.tints[4]), each: (w, i, box, c) => M.painted(c, L(box.x + box.width / 2, box.y) * 1.25) });
      }
      items.forEach((_, k) => {
        const t0 = at + 0.45 + k * T.beat; if (tq < t0) return;
        const dy = tq < t0 + 0.17 ? -14 : 0, L = clamp(span(tq, t0 + 0.1, t0 + 0.4)), y = ys[k] + dy;
        ctx.save(); ctx.translate(0, dy);
        M.pane(ctx, px, ys[k], pw, rh, pal, { lit: L, r: 4, lead: 7 });
        M.jewel(ctx, rtl ? px + pw - jw / 2 - 4 : px + jw / 2 + 4, ys[k] + rh / 2, 17, pal, k % 2 ? pal.tints[0] : pal.tints[2], L);
        boxes[k].forEach((bx) => { if (bx.key) M.pane(ctx, bx.x - 7, bx.y - rows[k].size * 0.64, bx.width + 14, rows[k].size * 1.28, pal, { color: pal.accent, lit: 0.35 + 0.65 * L, r: 8, lead: 5 }); });
        kit.drawText(ctx, rows[k], { ...ro[k], color: pal.paint, key: pal.keyText, each: (w, i, box, c) => M.painted(c, L * 1.2) });
        ctx.restore();
        void y;
      });
      ctx.restore();
    },
  };
}
