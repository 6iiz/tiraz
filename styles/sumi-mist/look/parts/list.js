// A list as a stalk of bamboo: on the reading side a stalk is brushed down the paper one joint per item, each joint closed by a dark
// node with a leaf flicked off it, and the item blooms beside its node. A key word in an item gets the pale swash and the seal.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const stalkX = rtl ? SAFE.right - 26 : SAFE.left + 26, indent = 86;
  const tx0 = rtl ? SAFE.left : SAFE.left + indent, tx1 = rtl ? SAFE.right - indent : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead ?? 500, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead * 1.3, 120), head = title ? title.lead + 50 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const step = 0.35;
  const joints = items.map((_, k) => {
    const ya = y0 + k * pitch + 8, yb = y0 + (k + 1) * pitch - 8, wob = (k % 2 ? 1 : -1) * 4;
    const t0 = at + 0.25 + k * step;
    const bx = M.boxes(rows[k], { x0: tx0, x1: tx1, y: ya + pitch / 2 - 8, rtl });
    const spans = M.keySpans(bx).map((s, j) => ({ ...s, S: M.swash(s.x0, s.x1, s.y, rows[k].size, rtl, 70 + k * 5 + j) }));
    const out = rtl ? 1 : -1;
    return {
      t0, ym: ya + pitch / 2 - 8, spans,
      stalk: M.stroke([[stalkX, ya], [stalkX + wob, (ya + yb) / 2], [stalkX, yb]], { w: 20, seed: 11 + k, rough: 0.12, dry: 0.25, bristles: 10, lift: 0.75 }),
      node: M.stroke([[stalkX - 20, yb + 2], [stalkX, yb - 3], [stalkX + 20, yb + 1]], { w: 9, seed: 21 + k, dry: 0.3, bristles: 6, lift: 0.4 }),
      leaf: M.stroke([[stalkX, yb - 4], [stalkX + out * 24, yb - 30], [stalkX + out * 52, yb - 44]], { w: 15, seed: 31 + k, dry: 0.2, bristles: 7, lift: 0.05 }),
    };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), fade = 1 - M.I(out);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.grey,
        each: (w, i, box, c) => M.bloom(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), out, pal.ink, title.size) });
      joints.forEach((J, k) => {
        M.paint(ctx, J.stalk, M.B(span(t, J.t0 - 0.22, J.t0 + 0.1)), pal.tone(T.tone.dan + 0.12), fade);
        M.paint(ctx, J.node, M.B(span(t, J.t0 + 0.08, J.t0 + 0.2)), pal.quiet(T.tone.nong), fade);
        M.paint(ctx, J.leaf, M.B(span(t, J.t0 + 0.14, J.t0 + 0.32)), pal.tone(T.tone.zhong), fade);
        for (const s of J.spans) {
          M.paint(ctx, s.S, M.B(span(t, J.t0 + 0.1, J.t0 + 0.1 + T.dur.stroke)), pal.tone(T.tone.wash), fade);
          const tail = s.S.P[Math.floor(0.86 * (s.S.P.length - 1))];
          ctx.save(); ctx.globalAlpha = fade; M.seal(ctx, rtl ? s.x1 - 12 : s.x0 + 12, s.y + rows[k].size * 0.56, T.size.seal * 0.8, pal, span(t, J.t0 + 0.75, J.t0 + 0.95)); ctx.restore();
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: J.ym, align: 'start', color: pal.quiet(0.66), key: pal.ink,
          each: (w, i, box, c) => M.bloom(c, span(t, J.t0 + i * 0.06, J.t0 + i * 0.06 + T.dur.in), out, pal.ink, rows[k].size) });
      });
    },
  };
}
