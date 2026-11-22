// A list on a title card: one row per beat. For each row a white glove reaches in from the reading side and points at the place, then
// the item pops up beside it (stretch, squash, settle) with the ball landing on it; rows are parted by a dotted rule. A key item (*…*)
// sits in the accent cartouche. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const cx0 = SAFE.left + 4, cx1 = SAFE.right - 4, ind = 120, x0 = cx0 + 60 + (rtl ? 0 : ind), x1 = cx1 - 60 - (rtl ? ind : 0);
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: cx1 - cx0 - 120, minScale: 0.9, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].size * 1.75), pad = 60, tH = title ? title.height + 40 : 0;
  const top = kit.place(tH + pitch * items.length + 2 * pad, 700), bot = top + tH + pitch * items.length + 2 * pad;
  const yT = top + pad + (title ? title.lead / 2 : 0), y0 = top + pad + tH;
  const runs = items.map((_, k) => M.keyRuns(rows[k], { x0, x1, y: y0 + k * pitch + pitch / 2, align: 'start' }, rtl));
  const tRow = (k) => at + 0.35 + k * T.beat;
  const hops = items.map((_, k) => { const b = M.layout(rows[k], { x0, x1, y: y0 + k * pitch + pitch / 2, align: 'start' }, rtl)[0]; return { x: rtl ? b.x + b.width - 30 : b.x + 30, y: b.y - rows[k].size * 0.6, t: tRow(k) }; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      M.fellow(ctx, P, W / 2, T.stage.fellowY, T.stage.fellowS, tt + clock, T.beat, 'dance');
      const pc = span(tt, at, at + T.pop.card); if (pc <= 0) return;
      ctx.save(); M.popAt(ctx, pc, W / 2, bot);
      M.card(ctx, P, cx0, top, cx1, bot);
      if (title) {
        kit.drawText(ctx, title, { x0: cx0 + 60, x1: cx1 - 60, y: yT, color: P.grey, key: P.ink,
          each: (w, i, box, c) => { if (M.popAt(c, span(tt, at + 0.1 + i * 0.06, at + 0.1 + i * 0.06 + T.pop.word), box.x + box.width / 2, box.y + title.size * 0.5) === false) return false; } });
        M.ornament(ctx, P, W / 2, yT + title.height - title.lead / 2 + 26, 260);
      }
      items.forEach((_, k) => {
        const ym = y0 + k * pitch + pitch / 2, t0 = tRow(k);
        if (k > 0) { ctx.fillStyle = P.wash2; for (let x = cx0 + 70; x < cx1 - 70; x += 18) ctx.fillRect(x, y0 + k * pitch - 2, 8, 4); }
        // the glove reaches in from the reading side and points across at the item
        const g = span(tt, t0 - 0.25, t0), gx = rtl ? cx1 - 70 + (1 - g) * 160 : cx0 + 70 - (1 - g) * 160;
        if (g > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx0 + 20, ym - 60, cx1 - cx0 - 40, 120); ctx.clip();
          ctx.fillStyle = P.ink; ctx.fillRect(rtl ? gx + 20 : gx - 200, ym - 7, 180, 14);
          M.glove(ctx, P, gx, ym, 1.05, rtl ? Math.PI : 0); ctx.restore(); }
        kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => { if (M.popAt(c, span(tt, t0 + i * 0.05, t0 + i * 0.05 + T.pop.word), box.x + box.width / 2, box.y + rows[k].size * 0.5) === false) return false;
            if (w.key) { if (runs[k][i] !== 'skip') M.cartouche(c, P, runs[k][i], rows[k].size); return P.onAccent; } } });
      });
      ctx.restore();
      M.ball(ctx, P, hops, tt, T.beat, 18, d - 0.1);
    },
  };
}
