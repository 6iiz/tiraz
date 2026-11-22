// A list as stacked slogans: each item is a level strip with slanted ends, in paper (or the accent for the item with a key word), with
// a big index cut into its far end. The strips are thrown in one per beat, alternately from each side, and step in a little from the
// reading side as they go down. The title is the one turned block, on the ground over a thick accent rule.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, tilt = T.tilt;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const stepIn = 28, indexW = 96, slant = 26, padX = 30;
  const textW = SAFE.right - SAFE.left - indexW - padX * 2 - slant - stepIn * (items.length - 1);
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 900, maxW: 760, single: true, where: 'the list title' }) : null;
  const sh = rows[0].lead + 18, gap = 22, head = title ? title.lead + 90 : 0;
  const top = kit.place(head + (sh + gap) * items.length, 740), y0 = top + head;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (title) {
        M.block(ctx, W / 2, top + title.lead / 2 + 10, tilt * 0.7, span(t, at, at + T.dur.slam), out, (off) => {
          ctx.fillStyle = pal.accent; ctx.fillRect(-title.width / 2 - 20, title.lead / 2 - 4, title.width + 40, 16);
          if (off < M.SETTLE) kit.drawText(ctx, title, { x0: -title.width / 2, x1: title.width / 2, y: 0, color: pal.text });
        }, 500);
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, p = M.E(span(t, t0, t0 + T.dur.slam)), o = M.I(span(t, d - T.dur.out + k * 0.03, d));
        if (p <= 0 || o >= 1) return;
        const side = k % 2 ? -1 : 1, shift = ((1 - p) * side - o * side) * W * 1.1;
        const ym = y0 + k * (sh + gap) + sh / 2;
        // the strip spans from the reading edge, stepped in by k, to the far edge; its ends are slanted
        const xr = rtl ? SAFE.right - k * stepIn : SAFE.right, xl = rtl ? SAFE.left : SAFE.left + k * stepIn;
        const fill = keyed[k] ? pal.accent : pal.paper, ink = keyed[k] ? pal.onAccent : pal.onPaper;
        ctx.save(); ctx.translate(shift, -shift * 0.12);
        ctx.fillStyle = fill; ctx.beginPath();
        ctx.moveTo(xl + slant, ym - sh / 2); ctx.lineTo(xr, ym - sh / 2); ctx.lineTo(xr - slant, ym + sh / 2); ctx.lineTo(xl, ym + sh / 2); ctx.closePath(); ctx.fill();
        // the index, big, in the ground's colour at the far end
        ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.textAlign = rtl ? 'left' : 'right';
        const ix = rtl ? xl + slant + 14 : xr - slant - 14; ctx.fillText(String(k + 1), ix, ym + 2);
        kit.rec(rtl ? ix : ix - 40, rtl ? ix + 40 : ix, ym - 26, ym + 26, String(k + 1), { decor: true });
        const tx1 = rtl ? xr - padX - slant / 2 : xr - indexW - slant, tx0 = rtl ? xl + indexW + slant : xl + padX + slant / 2;
        if (Math.abs(shift) < M.SETTLE) kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: ink, key: ink });
        ctx.restore();
      });
    },
  };
}
