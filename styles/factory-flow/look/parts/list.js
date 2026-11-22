// A list as the floors of the works: one room per item, stacked, with a pipe running down the reading side past them all. A crate
// drops down the pipe one floor per beat; when it reaches a floor, that room's light comes on, its number plate is lit and the item
// rides in from the pipe's side. A key word is stamped with the accent label. The title is a plaque bolted above the top floor.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const px = rtl ? SAFE.right + 4 : SAFE.left - 4;                       // the pipe's centre
  const rx0 = rtl ? SAFE.left - 6 : px + 46, rx1 = rtl ? px - 46 : SAFE.right + 6;
  const nx0 = rtl ? rx1 - 66 : rx0 + 10, nx1 = nx0 + 56;                 // the number plate, at the pipe's end of each room
  const tx0 = rtl ? rx0 + 20 : nx1 + 20, tx1 = rtl ? nx0 - 20 : rx1 - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(140, rows[0].lead + 50), headH = title ? title.lead + 30 + 40 : 0;
  const top = kit.place(headH + pitch * items.length, 770), y0 = top + headH;
  const floors = items.map((_, k) => [y0 + k * pitch + 14, y0 + (k + 1) * pitch - 14]);
  const ys = floors.map(([a, b]) => (a + b) / 2);
  const times = items.map((_, k) => at + 0.25 + k * T.beat);
  const wb = rows.map((r, k) => M.boxes(kit, r, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), o = M.I(out);
      M.pipe(ctx, [[px, ground.wall.y0], [px, floors.at(-1)[1] + 30]], P, 36);
      if (title) {
        const pw = title.width + 70, p1 = rtl ? rx1 : rx0 + pw, p0 = p1 - pw, yt = top + (title.lead + 30) / 2;
        const drop = M.E(span(t, at - 0.4, at - 0.1));
        if (drop > 0) { ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, (1 - drop) * -40); M.plaque(ctx, p0, yt - title.lead / 2 - 15, p1, yt + title.lead / 2 + 15, P); kit.drawText(ctx, title, { x0: p0 + 35, x1: p1 - 35, y: yt, color: P.onPlaque }); ctx.restore(); }
      }
      items.forEach((_, k) => {
        const [a, b] = floors[k], tk = times[k], lit = span(t, tk, tk + 0.12) * (1 - span(t, out0, out0 + 0.15));
        M.room(ctx, rx0, a, rx1, b, P, lit, P.accent, 8);
        M.shape(ctx, M.rectPath(nx0, ys[k] - 28, 56, 56, 4), lit > 0.5 ? P.plaque : P.off, P, 3, 0);
        ctx.save(); ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = lit > 0.5 ? P.onPlaque : P.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), nx0 + 28, ys[k] + 1); ctx.restore();
        kit.rec(nx0 + 14, nx0 + 42, ys[k] - 14, ys[k] + 14, String(k + 1), { decor: true });
        const stamp = span(t, tk + 0.4, tk + 0.6);
        if (stamp > 0 && out < 1) for (const bx of M.spans(wb[k].filter((q) => q.key))) { ctx.save(); ctx.translate(o * (rtl ? -1 : 1) * T.dur.run * 1.6, 0); ctx.beginPath(); ctx.rect(rx0, a, rx1 - rx0, b - a); ctx.clip(); M.label(ctx, bx, rows[k].size, P, stamp); ctx.restore(); }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', color: P.light, key: P.light,
          each: (w, i, box, c) => {
            if (M.ride(c, span(t, tk + 0.05 + i * T.dur.step, tk + 0.05 + i * T.dur.step + T.dur.in), box, rows[k].size, rtl, T.dur.run, rx0, nx0 + (rtl ? 0 : 56), out) === false) return false;
            if (w.key && stamp > 0) return P.onAccent;
          } });
      });
      // the crate, dropping down the pipe floor by floor
      let cy = null;
      for (let k = 0; k < items.length; k++) { const q = span(t, times[k] - 0.3, times[k]); if (q <= 0) break; const from = k ? ys[k - 1] : ground.wall.y0 + 30; cy = from + (ys[k] - from) * M.G(q); }
      if (cy !== null && out < 1) M.crate(ctx, px, cy, 40, P);
    },
  };
}
