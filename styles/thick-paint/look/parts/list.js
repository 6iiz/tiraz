// A list as swatches: each item is laid as its own slab of paint by one pass of the knife, one per beat, a little shorter than the one
// above, with its number pressed into a square dab of the accent at the far end. The slab of an item with a key word is the accent itself.
// The title, when there is one, is laid in the muted paint on the ground. All of it is scraped off at the end, top first.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, dab = 74, padX = 34, step = 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: full - dab - padX * 3 - step * (items.length - 1), single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: full - 20, single: true, where: 'the list title' }) : null;
  const sh = rows[0].size * 1.55 + 16, gap = 26, head = title ? title.lead + 36 : 0;
  const top = kit.place(head + (sh + gap) * items.length - gap, 720), y0 = top + head;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const slabs = items.map((_, k) => {
    const w = full - k * step;
    return M.plane(w, sh, keyed[k] ? P.accent : P.plane2, [P.paint, P.ground], 500 + k * 31, { row: sh / 2 });
  });
  const dabs = items.map((_, k) => M.plane(dab, dab, keyed[k] ? P.plane : P.accent, [P.paint, P.ground], 900 + k * 13, { row: dab / 2, pad: 10 }));
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        const yy = top + title.lead / 2;
        M.knife(ctx, { x: SAFE.left - 20, y: top, w: full + 40, h: title.lead }, span(t, at, at + T.dur.pass * 0.8), span(t, d - T.dur.out, d - 0.1), rtl,
          () => M.relief(kit, ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yy, color: P.muted, surface: P.ground }), null);
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.dur.item, w = full - k * step, x = rtl ? SAFE.right - w : SAFE.left, y = y0 + k * (sh + gap), ym = y + sh / 2;
        const fill = keyed[k] ? P.accent : P.plane2, ink = keyed[k] ? P.onAccent : P.paint;
        const q = span(t, d - T.dur.out + k * 0.04, d - T.dur.out + k * 0.04 + T.dur.out * 0.75);
        M.knife(ctx, { x, y, w, h: sh }, span(t, t0, t0 + T.dur.pass), q, rtl, () => {
          M.drawPlane(ctx, slabs[k], x, y);
          const dx = rtl ? x + 18 : x + w - 18 - dab;
          M.drawPlane(ctx, dabs[k], dx, ym - dab / 2);
          ctx.save(); ctx.font = `800 ${Math.round(dab * 0.58)}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillStyle = P.shade(keyed[k] ? P.plane : P.accent, 0.5); ctx.fillText(String(k + 1), dx + dab / 2 + 2, ym + 4);
          ctx.fillStyle = keyed[k] ? P.paint : P.onAccent; ctx.fillText(String(k + 1), dx + dab / 2, ym + 1); ctx.restore();
          kit.rec(dx, dx + dab, ym - dab / 2, ym + dab / 2, String(k + 1), { decor: true });
          const tx0 = rtl ? x + dab + 36 : x + padX, tx1 = rtl ? x + w - padX : x + w - dab - 36;
          M.relief(kit, ctx, rows[k], { x0: tx0, x1: tx1, y: ym, color: ink, key: ink, surface: fill });
        }, keyed[k] ? P.lift(P.accent, 0.25) : P.lift(P.plane2, 0.15));
      });
    },
  };
}
