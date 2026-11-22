// A list as numbered steps: each item pops on, one per beat, with its number in a small medallion of the accent printed off register
// inside a broken ink ring, and its words in ink beside it on the plain wall. A key word (*…*) sits on an accent kidney. The title
// pops on in a paper pill above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, room: 2 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, R = 38, indent = R * 2 + 36;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: X1 - X0 - indent - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 700, maxW: X1 - X0 - 90, minScale: 0.9, where: 'the list title' }) : null;
  const tw = title ? title.width + 90 : 0, th = title ? title.height + 26 : 0, head = title ? th + 56 : 0;
  const pitch = Math.max(rows[0].lead + 30, R * 2 + 34), n = items.length;
  const top = kit.place(head + n * pitch, 740), y0 = top + head;
  const tx = rtl ? X1 - tw : X0, pill = title ? M.round(tx, top, tw, th, Math.min(th / 2, 50)) : null;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        ctx.save();
        if (M.grow(ctx, M.pop(t, at, T.dur.pop), rtl ? tx + tw : tx, top + th / 2) !== false) {
          M.cel(ctx, pill, { fill: P.paper, line: P.ink, width: 4, id: 80, t, gaps: 0.16 });
          kit.drawText(ctx, title, { x0: tx + 45, x1: tx + tw - 45, y: top + 13 + title.lead / 2, align: 'start', color: P.ink });
        }
        ctx.restore();
      }
      items.forEach((_, k) => {
        const t0 = at + 0.25 + k * T.beat, ym = y0 + k * pitch + pitch / 2, cx = rtl ? X1 - R : X0 + R;
        ctx.save();
        if (M.grow(ctx, M.pop(t, t0, T.dur.pop), cx, ym) !== false) {
          M.cel(ctx, M.circle(cx, ym, R), { fill: P.accent, line: P.ink, width: 4, id: 90 + k, t, gaps: 0.12 });
          ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1), cx, ym + 2);
          kit.rec(cx - R, cx + R, ym - R, ym + R, String(k + 1), { decor: true });
        }
        ctx.restore();
        const tw = { x0: rtl ? X0 : X0 + indent, x1: rtl ? X1 - indent : X1, y: ym, align: 'start' };
        const g = (w, i, b, c) => M.grow(c, M.pop(t, t0 + 0.08, T.dur.pop), b.x + b.width / 2, b.y);
        M.blobs(kit, ctx, rows[k], tw, P, t, 100 + k * 10, g);
        kit.drawText(ctx, rows[k], { ...tw, color: P.ink, key: P.onAccent, each: g });
      });
    },
  };
}
