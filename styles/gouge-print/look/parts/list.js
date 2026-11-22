// A list, cut in wood: each item is a strip of the block carved away one per beat, the item's words standing in wood on it, and its
// number standing at the head of the strip beside a ridge of wood left uncut. The title is cut straight into the block as letters of
// light. A key word gets the slab of the accent. To leave, the block is inked again.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const full = SAFE.right - SAFE.left, idx = 64, padX = 30, textW = full - idx - padX * 2 - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.title, maxW: full, single: true, where: 'the list title' }) : null;
  const sh = rows[0].lead + 8, gap = 26, head = title ? title.lead + 26 : 0;
  const top = kit.place(head + (sh + gap) * items.length - gap, 720), y0 = top + head;
  const strips = items.map((_, k) => {
    const w = Math.min(full, rows[k].width + idx + padX * 2 + 40);
    return { x: rtl ? SAFE.right - w : SAFE.left, w, cut: M.patch(rtl ? SAFE.right - w : SAFE.left, y0 + k * (sh + gap), w, sh, 51 + k * 7, rtl, T) };
  });
  const out0 = d - T.dur.ink;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        const yT = top + title.lead / 2;
        M.hatch(ctx, span(t, at, at + T.dur.letters), SAFE.left, yT - title.size, full, title.size * 2,
          () => kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yT, align: 'start', color: P.soft }));
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, s = strips[k], yr = y0 + k * (sh + gap), ym = yr + sh / 2;
        const pc = span(t, t0, t0 + T.dur.carve * 0.8);
        s.cut.draw(ctx, pc, P.paper);
        if (pc <= 0) return;
        const ix = rtl ? s.x + s.w - padX - idx / 2 : s.x + padX + idx / 2;
        ctx.save(); ctx.font = `800 40px "${mono}"`; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), ix, ym + 2); ctx.restore();
        kit.rec(ix - 24, ix + 24, ym - 24, ym + 24, String(k + 1), { decor: true });
        ctx.fillStyle = P.ink; ctx.fillRect(rtl ? ix - idx / 2 - 6 : ix + idx / 2 + 2, yr + 10, 4, sh - 20);
        const x0 = rtl ? s.x + padX : ix + idx / 2 + 20, x1 = rtl ? ix - idx / 2 - 20 : s.x + s.w - padX;
        const pk = span(t, t0 + T.dur.carve * 0.8, t0 + T.dur.carve * 0.8 + T.dur.colour);
        kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => {
            if (!w.key || pk <= 0) return;
            M.colour(c, pk, box.x - 10, box.y - rows[k].size * 0.74, box.width + 20, rows[k].size * 1.48, P, rtl, 70 + i);
            return pk >= 1 ? P.on : P.ink;
          } });
      });
      M.brayer(ctx, span(t, out0, d), W, H, P);
    },
  };
}
