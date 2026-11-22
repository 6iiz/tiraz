// A list built as a stepped wall: one course of bricks per item, flush to the reading side and as long as its words, each course
// sitting on the studs of the one below. A small square brick at the far end of each course carries the index. The courses are set
// down one per beat, each in four held poses; a key phrase inside an item is its own brick of the accent. The title is printed on a
// flat tile above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const xa = SAFE.left + 30, xb = SAFE.right - 30, size0 = T.size.item, edge = size0 * 0.45;
  const iw = Math.round(size0 * 1.5), textW = xb - xa - iw - 14 - edge * 2;
  const rows = kit.fitAll(items, { size: size0, weight: T.weight.item, maxW: textW - size0 * 0.6, single: true, where: 'a list item' }).map((f) => M.widen(f, f.size * 0.3, textW));
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: xb - xa - 60, minPx: 44, where: 'the list title' }) : null;
  const bh = Math.round(rows[0].lead), head = title ? title.height + 80 : 0;
  const top = kit.place(head + bh * items.length + 50, 740), y0 = top + head + 50;
  const tx0 = rtl ? xa + iw + 14 + edge : xa + edge, tx1 = rtl ? xb - edge : xb - iw - 14 - edge;
  const courses = rows.map((f, k) => {
    const ym = y0 + k * bh + bh / 2, segs = M.bricks(f, M.layout(f, tx0, tx1, ym, rtl), edge), t0 = at + 0.2 + k * T.dur.beat;
    const l = Math.min(...segs.map((s) => s.l)), r = Math.max(...segs.map((s) => s.r));
    const ix = rtl ? l - 8 - iw : r + 8;
    const parts = segs.map((s) => ({ l: s.l, r: s.r, pc: M.piece(P, s.r - s.l, bh, s.key ? P.accent : P.brick), words: s.words }));
    parts.push({ l: ix, r: ix + iw, pc: M.piece(P, iw, bh, P.mid), index: true });
    parts.sort((a, b) => a.l - b.l);
    const of = []; parts.forEach((p) => (p.words || []).forEach((i) => (of[i] = p)));
    return { f, ym, t0, tOut: d - 4 * M.POSE - (k % 2) * M.POSE, parts, of, ix };
  });
  const tile = title ? (() => { const w = title.width + 56, x1 = rtl ? xb : xa + w, y = top + title.lead / 2;
    return { l: x1 - w, r: x1, y, pc: M.piece(P, w, title.lead * 0.88, P.tile, { studs: false, deep: 16 }) }; })() : null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.Q(t), [cx, cy] = ground.cam(t);
      ctx.save(); ctx.translate(cx, cy);
      if (tile) {
        const pose = M.poseAt(tq, at, d - 4 * M.POSE);
        if (pose) {
          ctx.save(); M.apply(ctx, pose, (tile.l + tile.r) / 2, tile.y); M.put(ctx, tile.pc, tile.l, tile.y - title.lead * 0.44);
          kit.drawText(ctx, title, { x0: tile.l + 28, x1: tile.r - 28, y: tile.y, align: 'start', color: P.onTile }); ctx.restore();
        }
      }
      for (let k = courses.length - 1; k >= 0; k--) {       // bottom course first: each course covers the studs under it
        const c = courses[k], pose = M.poseAt(tq, c.t0, c.tOut); if (!pose) continue;
        ctx.save(); M.apply(ctx, pose, (xa + xb) / 2, c.ym);
        for (const p of c.parts) M.put(ctx, p.pc, p.l, c.ym - bh / 2);
        ctx.font = `800 ${Math.round(bh * 0.42)}px "${mono}"`; ctx.fillStyle = P.onMid; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), c.ix + iw / 2, c.ym + 2);
        kit.rec(c.ix, c.ix + iw, c.ym - bh * 0.3, c.ym + bh * 0.3, String(k + 1), { decor: true });
        kit.drawText(ctx, c.f, { x0: tx0, x1: tx1, y: c.ym, align: 'start', color: P.onBrick, key: P.onAccent });
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
