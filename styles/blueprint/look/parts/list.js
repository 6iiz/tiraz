// A list as a parts table: the frame is traced, the title sits in the header cell, and each row is ruled and plotted in turn with its
// item number in a balloon on the reading side. The key item (*…*) gets the accent balloon. spec: { duration, at?, says: { title?, items } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const ink = ground.ink, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, colW = 96, inset = 28;
  const tx0 = rtl ? L + inset : L + colW + inset, tx1 = rtl ? R - colW - inset : R - inset;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 4, weight: 600, maxW: R - L - 2 * inset, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(T.grid.major, rows[0].size * 1.9), head = title ? title.lead + 36 : 0;
  const top = kit.place(head + pitch * items.length, 720), bottom = top + head + pitch * items.length;
  const xc = rtl ? R - colW : L + colW, xb = rtl ? R - colW / 2 : L + colW / 2;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const out0 = d - T.dur.out;
  const plotIn = (t, t0, size) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, rtl, ink.accent) === false) return false;
    if (M.leave(c, span(t, out0, d), box, size, rtl) === false) return false;
    return w.key ? ink.key : undefined;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const gone = 1 - span(t, out0, d);
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 2;
      M.rect(ctx, L, top, R - L, bottom - top, span(t, at - 0.2, at + 0.5) * gone, rtl);
      ctx.lineWidth = 1;
      M.seg(ctx, xc, top + head, xc, bottom, span(t, at + 0.2, at + 0.2 + 0.25 * items.length) * gone);
      if (title) kit.drawText(ctx, title, { x0: L + inset, x1: R - inset, y: top + head / 2, align: 'start', color: ink.dim, each: plotIn(t, at, title.size) });
      items.forEach((_, k) => {
        const t0 = at + 0.3 + k * 0.4, y = top + head + k * pitch, ym = y + pitch / 2;
        const isKey = rows[k].rows.some((r) => r.words.some((w) => w.key));
        ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = k === 0 && title ? 2 : 1;
        M.seg(ctx, rtl ? R : L, y, rtl ? L : R, y, span(t, t0 - 0.3, t0) * gone);
        const r = T.space.balloon, pb = span(t, t0, t0 + 0.3) * gone;
        ctx.strokeStyle = isKey ? ink.accent : rgba(ink.light, T.tone.line); ctx.lineWidth = isKey ? 2 : 1.5;
        M.circle(ctx, xb, ym, r, pb, rtl);
        if (pb >= 0.6) {
          ctx.save(); ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.fillStyle = isKey ? ink.key : ink.light; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1), xb, ym + 1); ctx.restore();
          kit.rec(xb - r, xb + r, ym - r, ym + r, String(k + 1), { decor: true });
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: ink.light, key: ink.key, each: plotIn(t, t0 + 0.15, rows[k].size) });
      });
    },
  };
}
