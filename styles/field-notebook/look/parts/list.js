// A list as labelled specimens: a stem is drawn down the far side of the plate, then for each item, one per beat, a paper tag is traced
// in pencil, tied to the stem by a drawn string, and its words are written on it. A small leaf sprouts on the stem where each string
// is tied; the leaf of an item with a key word is in the coloured pencil, and its key word is hatched under. The title, when there is one,
// is written above in the soft pencil. Rubbed out at the end. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, stemGap = 120, tagW = full - stemGap, padX = 30, nose = 0;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tagW - padX * 2 - 60, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: full - 20, single: true, where: 'the list title' }) : null;
  const th = rows[0].size * 1.6 + 20, gap = 30, head = title ? title.lead + 30 : 0;
  const top = kit.place(head + (th + gap) * items.length - gap, 720), y0 = top + head;
  const stemX = rtl ? SAFE.left + 30 : SAFE.right - 30, tx = rtl ? SAFE.right - tagW : SAFE.left;
  const stem = M.wobble([stemX, y0 - 30], [stemX + (rtl ? 8 : -8), y0 + (th + gap) * items.length], 12, 4, 16);
  const tags = items.map((_, k) => M.tag(tx, y0 + k * (th + gap), tagW, th, rtl, 100 + k * 9));
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const hatch = rows.map((f, k) => keyed[k] ? M.hatchStrokes(f.width + 40, f.size, { angle: rtl ? -0.95 : -2.2, gap: 3.5, len: 26, seed: 140 + k, rtl }) : null);
  const tT = (k) => at + 0.3 + k * T.dur.item;
  const st = title ? M.schedule(title, at, T.write.lead) : null;
  const ss = rows.map((f, k) => M.schedule(f, tT(k) + 0.32, T.write.item));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - T.dur.out, d), keep = 1 - Math.min(1, q * 1.4);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: P.soft,
        each: (w, k, box, c) => M.write(c, t, st.at(k), box, title.size, rtl, q, 0, 1) });
      ctx.save(); ctx.globalAlpha = keep;
      M.pencil(ctx, stem, span(t, at, at + 0.3 + items.length * T.dur.item * 0.8), P.graphite, 3);
      ctx.restore();
      items.forEach((_, k) => {
        const g = tags[k], t0 = tT(k), ym = y0 + k * (th + gap) + th / 2;
        if (t < t0) return;
        ctx.save(); ctx.globalAlpha = keep;
        const pt = span(t, t0, t0 + 0.3);
        if (pt >= 1) M.fillPoly(ctx, g.path, P.tag);
        M.pencil(ctx, g.pts, pt, P.graphite, 2.4);
        const hx = g.hole[0], ps = span(t, t0 + 0.15, t0 + 0.35);
        if (ps > 0) {
          ctx.strokeStyle = P.graphite; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, ym, 7, 0, 6.3 * ps); ctx.stroke();
          const sx = stemX + (rtl ? 4 : -4) * (k / items.length);
          M.pencil(ctx, [[hx, ym], [(hx + sx) / 2, ym + 18], [sx, ym - 6]], ps, P.soft, 1.8);
          const s = rtl ? -1 : 1, lf = [[sx, ym - 6], [sx + s * 20, ym - 30], [sx + s * 8, ym - 40], [sx, ym - 6]];
          M.pencil(ctx, lf, span(t, t0 + 0.3, t0 + 0.45), keyed[k] ? P.pen : P.graphite, 2.4);
        }
        ctx.restore();
        const x0 = rtl ? tx + 60 : tx + padX, x1 = rtl ? tx + tagW - padX : tx + tagW - 60;
        kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.graphite, key: P.graphite,
          each: (w, i, box, c) => {
            const sp = ss[k].at(i);
            if (w.key && hatch[k]) { c.save(); c.globalAlpha = keep; c.beginPath(); c.rect(box.x - 16, box.y - rows[k].size, box.width + 32, rows[k].size * 2); c.clip(); M.drawHatch(c, hatch[k], box.x - 20, box.y - rows[k].size * 0.45, span(t, sp[0] - 0.3, sp[0]), P.pen); c.restore(); }
            return M.write(c, t, sp, box, rows[k].size, rtl, q, k, items.length);
          } });
      });
    },
  };
}
