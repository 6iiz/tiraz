// A list as a track table: one ping per beat leaves the centre, and each ping finds one row: its contact mark (a small diamond on the
// reading side) flares, then the row's words return one by one as the ring passes them. A key phrase in a row is a warm contact with
// its lock. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, mark = 44;
  const tx0 = rtl ? x0 : x0 + mark + 24, tx1 = rtl ? x1 - mark - 24 : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.75, tH = title ? title.height + 20 : 0, hAll = tH + pitch * items.length, top = kit.place(hAll, 640);
  const ys = items.map((_, k) => top + tH + pitch * k + pitch / 2), mx = rtl ? x1 - mark / 2 : x0 + mark / 2;
  const dist = (p) => Math.hypot(p.x - ground.cx, p.y - ground.cy);
  const dTitle = title ? M.wordCentres(title, { x0, x1, y: top + title.lead / 2, rtl }).map(dist) : [];
  const dRows = rows.map((r, k) => M.wordCentres(r, { x0: tx0, x1: tx1, y: ys[k], rtl }).map(dist));
  const runs = rows.map((r, k) => M.keyRuns(r, { x0: tx0, x1: tx1, y: ys[k], align: 'start', rtl }));
  const speed = T.dur.speed * 1.6, t0s = items.map((_, k) => at + 0.05 + k * T.dur.beat), out0 = d - T.dur.out;
  const quiet = [{ y0: top - 10, y1: top + hAll + 10 }];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, quiet);
      const fade = 1 - span(t, out0, out0 + T.dur.out);
      t0s.forEach((t0) => M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t0, speed), 900));
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: pal.soft,
        each: (w, i, b, c) => M.echo(c, M.ret(t, t0s[0], speed, dTitle[i]), pal.soft, pal, fade) });
      items.forEach((_, k) => {
        const rm = M.ret(t, t0s[k], speed, dist({ x: mx, y: ys[k] }));
        if (rm.on && fade > 0) {                                           // the contact mark
          ctx.save(); ctx.globalAlpha = fade; ctx.translate(mx, ys[k]); ctx.rotate(Math.PI / 4);
          ctx.fillStyle = runs[k].length ? pal.accent : pal.echo; if (rm.flare > 0.02) { ctx.shadowColor = pal.light; ctx.shadowBlur = 20 * rm.flare; }
          ctx.fillRect(-11, -11, 22, 22); ctx.restore();
        }
        runs[k].forEach((r) => {
          const hit = t0s[k] + Math.max(...dRows[k].slice(r.i0, r.i1 + 1)) / speed, px = r.size * 0.04, h = r.size * 1.1;
          M.lock(ctx, pal, r.x - px, r.y - h / 2, r.w + px * 2, h, span(t, hit + 0.05, hit + 0.05 + T.dur.lock) * fade);
        });
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', color: pal.echo, key: pal.target,
          each: (w, i, b, c) => M.echo(c, M.ret(t, t0s[k], speed, dRows[k][i]), w.key ? pal.target : pal.echo, pal, fade) });
      });
    },
  };
}
