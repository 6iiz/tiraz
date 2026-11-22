// A list as a ranked bar list: each row is a rank in the mono face, the item, and a bar under it drawn from the reading side.
// The items carry no values, so the bars encode only their order (each one a fixed step shorter than the one above), never an amount.
// The item with a key word (*…*) is the highlighted series: its bar is the accent, the others are one quiet tone.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, indexW = 76;
  const tx0 = rtl ? SAFE.left : SAFE.left + indexW, tx1 = rtl ? SAFE.right - indexW : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(156, rows[0].lead + 66), head = title ? title.lead + 48 : 0;
  const top = kit.place(head + pitch * items.length, 740), y0 = top + head;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s)), barW = tx1 - tx0, step = Math.min(0.15, 0.6 / Math.max(1, items.length - 1));
  const word = (t, t0, size, out) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size, rtl) === false) return false;
    if (M.leave(c, out, box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), fade = 1 - M.D(out);
      if (title) {
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.muted, each: word(t, at, title.size, out) });
        M.rule(ctx, SAFE.left, SAFE.right, top + title.lead + 14, M.D(span(t, at, at + T.dur.draw)) * fade, pal.axis, 2, rtl);
      }
      items.forEach((_, k) => {
        const t0 = at + 0.25 + k * T.beat, yText = y0 + k * pitch + rows[k].lead / 2, yBar = yText + rows[k].size * 0.62 + 22;
        // the rank, in the mono face on the reading side
        const a = M.E(span(t, t0, t0 + T.dur.in)) * fade;
        if (a > 0) {
          ctx.save(); ctx.globalAlpha = a; ctx.font = `500 ${T.size.index}px "${mono}"`; ctx.fillStyle = keyed[k] ? pal.keyText : pal.muted;
          ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
          const label = String(k + 1).padStart(2, '0'); ctx.fillText(label, rtl ? SAFE.right : SAFE.left, yText); ctx.restore();
          kit.rec(rtl ? SAFE.right - 44 : SAFE.left, rtl ? SAFE.right : SAFE.left + 44, yText - 16, yText + 16, String(k + 1), { decor: true });
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: yText, align: 'start', color: pal.text, key: pal.keyText, each: word(t, t0 + 0.05, rows[k].size, out) });
        const pb = M.D(span(t, t0 + 0.1, t0 + 0.1 + T.dur.draw)) * fade, len = barW * (1 - k * step);
        M.rule(ctx, tx0, tx1, yBar, pb, pal.track, T.bar.thick, rtl);           // the full track, so the steps read as shorter
        M.rule(ctx, rtl ? tx1 - len : tx0, rtl ? tx1 : tx0 + len, yBar, pb, keyed[k] ? pal.accent : pal.series, T.bar.thick, rtl);
      });
    },
  };
}
