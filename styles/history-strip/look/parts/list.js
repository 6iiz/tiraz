// A list as labels pinned on the map: the title is a narration caption in the top corner, and each item is a paper tag with an
// ink edge, slapped onto the map one per beat, each a little turned and shifted, and pinned at its reading-side end. A tag that
// holds a key word is a scrap of the accent. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const padIn = 56, padOut = 34, maxText = SAFE.right - SAFE.left - padIn - padOut - 60;
  const rows = kit.fitAll(items, { size: T.size.item, weight: 800, maxW: maxText, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: SAFE.right - SAFE.left - 80, single: true, where: 'the list title' }) : null;
  const th = rows[0].size * 1.65, gap = 30, head = title ? title.lead + 28 + 40 : 0;
  const top = kit.place(head + (th + gap) * items.length, 720);
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const tags = rows.map((f, k) => {
    const w = Math.max(f.width + padIn + padOut, 260), shift = [0, 34, 12, 46, 20][k];
    const cx = rtl ? SAFE.right - shift - w / 2 : SAFE.left + shift + w / 2, cy = top + head + k * (th + gap) + th / 2;
    return { w, cx, cy, rot: (k % 2 ? 1 : -1) * 0.018, path: M.torn(w, th, 30 + k, 4), fill: keyed[k] ? P.accent : P.paper, ink: keyed[k] ? P.onAccent : P.ink };
  });
  const tw = title ? title.width + 60 : 0, tth = title ? title.lead + 28 : 0, tpath = title ? M.torn(tw, tth, 7, 3) : null;
  const tx = rtl ? SAFE.right - tw / 2 : SAFE.left + tw / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) M.slapped(ctx, span(t, at, at + T.dur.slap), tx, top + tth / 2, (s) => {
        M.paper(ctx, tpath, P.caption, P, { shadow: s, edge: P.ink });
        kit.drawText(ctx, title, { x0: -tw / 2 + 30, x1: tw / 2 - 30, y: 0, align: 'start', color: P.ink });
      });
      tags.forEach((g, k) => {
        const t0 = at + 0.25 + k * T.dur.beat;
        M.slapped(ctx, span(t, t0, t0 + T.dur.slap), g.cx, g.cy, (s) => {
          ctx.rotate(g.rot); M.paper(ctx, g.path, g.fill, P, { shadow: s, edge: P.ink, edgeW: 3 });
          const x0 = rtl ? -g.w / 2 + padOut : -g.w / 2 + padIn, x1 = rtl ? g.w / 2 - padIn : g.w / 2 - padOut;
          kit.drawText(ctx, rows[k], { x0, x1, y: 2, align: 'start', color: g.ink, key: g.ink });
          M.pin(ctx, rtl ? g.w / 2 - 26 : -g.w / 2 + 26, 0, P, 10);
        });
      });
    },
  };
}
