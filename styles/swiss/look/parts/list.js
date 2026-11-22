// A list: up to five rows on the baseline grid, each under a 1 px rule drawn along its length, with its index in the mono face on the
// far column. Rows snap in one per beat. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, E } = await import(look.base + 'motion.js');
  const indent = ground.colW + 24, textW = SAFE.right - SAFE.left - indent;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 8, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(T.grid.baseline * 1.25, rows[0].size * 1.9);
  const top = kit.place((title ? title.lead + 30 : 0) + pitch * items.length, 700);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, grey = mix(ground.paper, ground.ink, T.tone.grey);
  const rise = (t, t0, size, out) => (w, i, box, c) => {
    if (arrive(c, span(t, t0, t0 + T.dur.in), box, size) === false) return false;
    if (leave(c, out, box, size) === false) return false;
    if (w.key) { c.fillStyle = brand.colors.accent; c.fillRect(box.x - 8, box.y - size * 0.6, box.width + 16, size * 1.2); return ground.ink; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      let y = top;
      if (title) { kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: y + title.lead / 2, align: 'start', color: grey, each: rise(t, at, title.size, out) }); y += title.lead + 30; }
      items.forEach((_, k) => {
        const t0 = at + 0.25 + k * T.beat, yr = y + k * pitch, ym = yr + pitch / 2;
        const rw = (SAFE.right - SAFE.left) * span(t, t0 - 0.25, t0) * (1 - E(out));
        ctx.fillStyle = ground.ink; ctx.fillRect(kit.rtl ? SAFE.right - rw : SAFE.left, yr, rw, 2);
        if (t >= t0 - T.dur.in && out < 1) {
          ctx.save(); ctx.font = `500 ${T.size.index}px "${mono}"`; ctx.fillStyle = grey; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.textAlign = kit.rtl ? 'left' : 'right'; ctx.globalAlpha = 1 - E(out);
          ctx.fillText(String(k + 1).padStart(2, '0'), kit.rtl ? SAFE.left : SAFE.right, ym); ctx.restore();
          kit.rec(kit.rtl ? SAFE.left : SAFE.right - 40, kit.rtl ? SAFE.left + 40 : SAFE.right, ym - 18, ym + 18, String(k + 1), { decor: true });
        }
        kit.drawText(ctx, rows[k], { x0: kit.rtl ? SAFE.left + indent : SAFE.left, x1: kit.rtl ? SAFE.right : SAFE.right - indent, y: ym, align: 'start',
          color: ground.ink, key: ground.ink, each: rise(t, t0 - T.dur.in, rows[k].size, out) });
      });
    },
  };
}
