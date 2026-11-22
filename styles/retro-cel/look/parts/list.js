// A list as a run of title plates: each item is a dark cel plate edged in the accent that slides in from the reading side on the
// held drawings, one per beat, with its number in a lit accent disc and its words in cel lettering; a key word (*…*) glows from
// behind. The title rides on its own plate above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, disc = 58, indent = disc + 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: X1 - X0 - indent - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 700, maxW: X1 - X0 - 90, minScale: 0.9, where: 'the list title' }) : null;
  const tw = title ? title.width + 90 : 0, th_ = title ? title.height + 22 : 0, head = title ? th_ + 50 : 0;
  const ph = rows[0].lead + 14, gap = 26, n = items.length;
  const top = kit.place(head + n * (ph + gap) - gap, 740), y0 = top + head;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    duration: d,
    draw(ctx, t) {
      const th = M.held(t);
      ground.draw(ctx, t);
      if (title) {
        const bx = rtl ? X1 - tw + 20 : X0 - 20;
        M.bar(ctx, bx, top, tw, th_, P, span(th, at, at + 0.17));
        M.cel(kit, ctx, title, { x0: bx + 45, x1: bx + tw - 45, y: top + 11 + title.lead / 2, align: 'start', P, rtl, at: () => span(th, at + 0.08, at + 0.08 + T.dur.slide) });
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, ya = y0 + k * (ph + gap), ym = ya + ph / 2;
        const p = span(th, t0, t0 + T.dur.slide);
        if (p <= 0) return;
        const pw = rows[k].width + indent + 110, px = rtl ? X1 + 30 - pw : X0 - 30;
        M.bar(ctx, px, ya, pw, ph, P, p);
        const s = M.slide(p, 300, rtl), cx = (rtl ? X1 - disc / 2 : X0 + disc / 2) + s.dx;
        ctx.save(); ctx.shadowColor = P.halo; ctx.shadowBlur = 24; ctx.fillStyle = P.key; ctx.beginPath(); ctx.arc(cx, ym, disc / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), cx, ym + 2); ctx.restore();
        kit.rec(cx - disc / 2, cx + disc / 2, ym - disc / 2, ym + disc / 2, String(k + 1), { decor: true });
        M.cel(kit, ctx, rows[k], { x0: rtl ? X0 : X0 + indent, x1: rtl ? X1 - indent : X1, y: ym, align: 'start', P, rtl, at: () => span(th, t0 + 0.08, t0 + 0.08 + T.dur.slide) });
      });
      ground.over(ctx, t);
    },
  };
}
