// A list as a chain of people. On the reading side a vertical line runs down the page; each row branches off it with a short rule and a
// small person standing on it. The accent runs down the vertical line and, as it reaches each row, the person there raises an arm
// toward their item and the item is set down beside them. A key item (*…*) has the accent head and an accent underline. The crowd
// stands quietly on the system line below. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const ind = 150, xr = rtl ? SAFE.right - 30 : SAFE.left + 30, x0 = rtl ? SAFE.left + 10 : SAFE.left + ind + 20, x1 = rtl ? SAFE.right - ind - 20 : SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW: SAFE.right - SAFE.left - 20, minScale: 0.9, where: 'the list title' }) : null;
  const pitch = Math.max(140, rows[0].size * 2.1), tH = title ? title.height + 40 : 0, top = kit.place(tH + pitch * items.length, 700);
  const yT = top + (title ? title.lead / 2 : 0), y0 = top + tH, fh = Math.min(118, pitch * 0.85), dir = rtl ? -1 : 1;
  const rowY = (k) => y0 + k * pitch + pitch * 0.5, footY = (k) => rowY(k) + fh * 0.5;
  const tRow = (k) => at + 0.35 + k * 0.42, tRun0 = at + 0.15, spine = [[xr, y0 - 10], [xr, footY(items.length - 1)]];
  const runT = (y) => tRun0 + ((y - spine[0][1]) / (spine[1][1] - spine[0][1])) * (tRow(items.length - 1) - tRun0);
  const keyRow = rows.map((r) => r.rows[0].words.some((w) => w.key));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ground.crowd(ctx, t, {});
      const w = M.weight(fh) * 1.1;
      if (title) kit.drawText(ctx, title, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yT, align: 'start', color: P.note, key: P.ink, each: (wd, i, box, c) => M.setDown(c, span(t, at + i * 0.06, at + 0.2 + i * 0.06), title.size) });
      // the spine and the run down it
      const sp = span(t, at, at + 0.3);
      M.run(ctx, [spine[0], [xr, M.lerp(spine[0][1], spine[1][1], sp)]], Infinity, w, P.ink);
      const runLen = (spine[1][1] - spine[0][1]) * span(t, tRun0, tRow(items.length - 1));
      M.run(ctx, spine, runLen, w * 1.2, P.accent);
      items.forEach((_, k) => {
        const t0 = tRow(k), ym = rowY(k), fy = footY(k), p = span(t, t0 - 0.15, t0 + 0.1);
        // branch rule and node
        const bx = xr + dir * (ind - 30) * M.ease.inOutCubic(p);
        if (p > 0) { M.run(ctx, [[xr, fy], [bx, fy]], Infinity, w, t >= t0 ? P.accent : P.ink); }
        ctx.beginPath(); ctx.arc(xr, fy, 11, 0, Math.PI * 2); ctx.fillStyle = t >= t0 ? P.accent : P.paper; ctx.fill(); ctx.lineWidth = w * 0.8; ctx.strokeStyle = P.ink; ctx.stroke();
        if (p <= 0) return;
        const fx = xr + dir * 75, raise = M.ease.outCubic(span(t, t0, t0 + 0.25)), since = t - t0;
        const sh = [fx, fy - fh * (0.46 + 0.34 * 0.86) - M.reactHop(since, fh)];
        const hand = [M.lerp(sh[0] + dir * fh * 0.1, sh[0] + dir * fh * 0.42, raise), M.lerp(sh[1] + fh * 0.3, sh[1] - fh * 0.18, raise)];
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 3);
        M.figure(ctx, P, fx, fy, fh, { hop: M.reactHop(since, fh), head: keyRow[k] ? 'accent' : 'paper', hands: { [rtl ? 'l' : 'r']: hand } });
        ctx.restore();
        M.keySpans(rows[k], { x0, x1, y: ym, align: 'start' }, rtl).forEach((b) => M.underline(ctx, P, b, rows[k].size, span(t, t0 + 0.2, t0 + 0.45), rtl));
        kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.ink, key: P.ink, each: (wd, i, box, c) => M.setDown(c, span(t, t0 + i * 0.05, t0 + 0.2 + i * 0.05), rows[k].size) });
      });
    },
  };
}
