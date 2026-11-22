// A list as hanging slips: each item is a long strip of paper inside a key line that unrolls from the reading side, one per beat,
// with a small seal of the accent at its head carrying the item's number. The title sits above, uncovered without a roller, beside a
// tiny seal. A key word in an item gets the colour block. All slips are rolled up from the far side to leave, one a moment after another.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const full = SAFE.right - SAFE.left, sealS = 58, padX = 30, textW = full - sealS - padX * 3;
  const runs = [];                                            // key phrases per item, one block each
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.title, maxW: full - 60, single: true, where: 'the list title' }) : null;
  const sh = rows[0].lead + 34, gap = 20, head = title ? title.lead + 24 : 0;
  const top = kit.place(head + (sh + gap) * items.length - gap, 720), y0 = top + head;
  const out0 = d - T.dur.roll - 0.04 * items.length;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        const yT = top + title.lead / 2;
        M.scroll(ctx, span(t, at, at + T.dur.lead), span(t, out0, d), SAFE.left, top, full, title.lead, rtl, P, () => {
          ctx.fillStyle = P.accent; ctx.fillRect(rtl ? SAFE.right - 22 : SAFE.left, yT - 11, 22, 22);
          kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right - 40, y: yT, align: 'start', color: P.soft });
        }, false);
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, yr = y0 + k * (sh + gap), ym = yr + sh / 2;
        const q = span(t, out0 + k * 0.04, d);
        const reg = 1 + 2.5 * (1 - M.E(span(t, t0 + 0.2, t0 + T.dur.unroll)));
        M.scroll(ctx, span(t, t0, t0 + T.dur.unroll * 0.85), q, SAFE.left, yr, full, sh, rtl, P, () => {
          M.cartouche(ctx, SAFE.left, yr, full, sh, P);
          const sx = rtl ? SAFE.right - padX - sealS : SAFE.left + padX;
          ctx.fillStyle = P.accent; ctx.fillRect(sx + T.reg.x * reg, ym - sealS / 2 + T.reg.y * reg, sealS, sealS);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(sx, ym - sealS / 2, sealS, sealS);
          ctx.font = `700 34px "${mono}"`; ctx.fillStyle = P.on; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1), sx + sealS / 2 + T.reg.x * reg, ym + 2 + T.reg.y * reg);
          kit.rec(sx, sx + sealS, ym - sealS / 2, ym + sealS / 2, String(k + 1), { decor: true });
          const x0 = rtl ? SAFE.left + padX : sx + sealS + padX, x1 = rtl ? sx - padX : SAFE.right - padX;
          const o = { x0, x1, y: ym, align: 'start' };
          (runs[k] ??= M.keyRuns(kit, rows[k], o)).forEach((r) => M.keyBlock(ctx, r, rows[k].size, P, T, reg));   // measured once
          kit.drawText(ctx, rows[k], { ...o, color: P.ink, key: P.on });
        });
      });
    },
  };
}
