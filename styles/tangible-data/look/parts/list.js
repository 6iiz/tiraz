// A list as objects on shelves: thin stone ledges stand ready, and one slab per beat falls onto its ledge with the item cut into its
// front face. A small metal cube with the item's number sits on the far end of each ledge. The slab of an item with a key phrase is
// the accent material, the others are pale. Slabs are all the same size: the list shows order, not amounts.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const cube = 64, pad = 34, sx0 = SAFE.left + 10, sx1 = SAFE.right - 10;
  const slabX0 = rtl ? sx0 + cube + 30 : sx0, slabX1 = rtl ? sx1 : sx1 - cube - 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: slabX1 - slabX0 - pad * 2, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: sx1 - sx0, minPx: 44, where: 'the list title' }) : null;
  const sh = Math.round(rows[0].size * 1.6), gap = 44, pitch = sh + gap, head = title ? title.height + 40 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), up = M.lift(out);
      ctx.save(); ctx.globalAlpha = 1 - up; ctx.translate(0, -up * 120);
      if (title) kit.drawText(ctx, title, { x0: sx0, x1: sx1, y: top + title.lead / 2, align: 'start', color: P.muted,
        each: (w, i, box, c) => { const tw = at + i * T.dur.stagger; if (M.setDown(c, span(t, tw, tw + T.dur.word), title.size) === false) return false; } });
      items.forEach((_, k) => {
        const yTop = y0 + k * pitch, yLedge = yTop + sh, t0 = at + 0.15 + k * T.beat;
        // the ledge is laid first, from the reading side
        const pl = span(t, at + k * 0.06, at + 0.3 + k * 0.06);
        if (pl > 0) { const w = (sx1 - sx0 + 40) * M.E(pl); M.box(ctx, rtl ? sx1 + 20 - w : sx0 - 20, yLedge, w, 10, 40, P.stone, rtl); }
        const p = span(t, t0, t0 + T.dur.fall);
        if (p <= 0) return;
        const off = M.fall(p, 300), mat = keyed[k] ? P.acc : P.pale, ink = keyed[k] ? P.onAccent : P.ink;
        M.shadow(ctx, slabX0, yTop, slabX1 - slabX0, sh, 30, P, rtl, p * 0.7, 0.25);
        M.box(ctx, slabX0, yTop + off, slabX1 - slabX0, sh, 30, mat, rtl);
        // the numbered cube
        const pc = span(t, t0 + 0.12, t0 + 0.12 + T.dur.fall);
        if (pc > 0) {
          const cx = rtl ? sx0 : sx1 - cube, cy = yLedge - cube + M.fall(pc, 200);
          M.box(ctx, cx, cy, cube, cube, 22, P.metal, rtl, 0);
          ctx.save(); ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1), cx + cube / 2, cy + cube / 2 + 2); ctx.restore();
          kit.rec(cx, cx + cube, cy, cy + cube, String(k + 1), { decor: true });
        }
        kit.drawText(ctx, rows[k], { x0: slabX0 + pad, x1: slabX1 - pad, y: yTop + off + sh / 2, align: 'start', color: ink, key: ink });
      });
      ctx.restore();
    },
  };
}
