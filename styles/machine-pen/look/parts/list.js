// A list, plotted row by row on the beat: for each row the pen traces a small square on the reading side and hatches it full, writes
// the row's number in the mono face beside it, then rasters the words; a key phrase gets the accent pen's hatch band first. A thin
// rule under each row is part of the same run. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, sq = 38, indent = sq + 34;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].size * 1.85);
  const titleH = title ? title.height + 34 : 0;
  const top = kit.place(titleH + pitch * items.length, 720);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const progs = [], draws = [];
  let titleJobs = [];
  if (title) {
    const tb = M.boxes(title, x0, x1, top + title.lead / 2, 'start', rtl);
    titleJobs = tb.map((b) => M.wordJob(b, 'grey', T, rtl, 0.8));
    progs.push(M.program(titleJobs, { start: at, park: ground.park, by: at < 0 ? -0.3 : null }));
  }
  const beat = Math.min(0.62, Math.max(0.42, (d - 1.2) / (items.length + 0.5)));
  rows.forEach((f, k) => {
    const ym = top + titleH + k * pitch + pitch / 2, sx = rtl ? x1 - sq : x0;
    const box = M.strokeJob([[sx + (rtl ? sq : 0), ym - sq / 2], [sx + (rtl ? 0 : sq), ym - sq / 2], [sx + (rtl ? 0 : sq), ym + sq / 2], [sx + (rtl ? sq : 0), ym + sq / 2], [sx + (rtl ? sq : 0), ym - sq / 2]], 'ink', T);
    const fill = M.hatchJob({ x: sx + 6, y: ym - sq / 2 + 6, w: sq - 12, h: sq - 12 }, 'ink', T, rtl, 6); fill.after = true;
    const bx = M.boxes(f, tx0, tx1, ym, 'start', rtl), groups = M.keyGroups(bx), pad = f.size * 0.16;
    const keys = groups.map((g) => M.hatchJob({ x: g.x0 - pad, y: g.y - g.size * 0.6, w: g.x1 - g.x0 + pad * 2, h: g.size * 1.2 }, 'accent', T, rtl));
    const words = bx.map((b) => M.wordJob(b, 'ink', T, rtl, 0.85));
    const yr = ym + pitch / 2 - 6, ra = rtl ? x1 : x0, rb = rtl ? x0 : x1;
    const rule = M.strokeJob([[ra, yr], [rb, yr]], 'grey', T, { speed: 4200 });
    const t0 = Math.max(progs.length ? progs.at(-1).end + 0.08 : at, at + 0.15 + k * beat);
    progs.push(M.program([box, fill, ...keys, ...words, rule], { start: t0, park: ground.park, from: progs.length ? progs.at(-1).pen(t0) : ground.park, by: at < 0 && t0 < 0 ? -0.3 : t0 + 0.75 }));
    const P = progs.at(-1);
    draws.push({ f, ym, P, box, fill, keys, words, rule, sx, k });
  });
  const penAt = M.chain(progs);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: K.grey,
        each: (w, i, b, c) => (M.rasterClip(c, titleJobs[i], progs[0].q(titleJobs[i], t)) ? undefined : false) });
      for (const r of draws) {
        const P = r.P;
        r.rule.draw(ctx, P.q(r.rule, t), K.faint === K.paper ? K.grey : K.rule, 2);
        r.box.draw(ctx, P.q(r.box, t), K.ink, 3);
        r.fill.draw(ctx, P.q(r.fill, t), K.ink, 2.4);
        for (const h of r.keys) h.draw(ctx, P.q(h, t), K.accent);
        if (P.q(r.box, t) > 0) {   // the row number, small, beside the square
          ctx.save(); ctx.font = `500 ${T.size.index}px "${mono}"`; ctx.fillStyle = K.grey; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.textAlign = 'center'; ctx.fillText(String(r.k + 1).padStart(2, '0'), r.sx + sq / 2, r.ym + sq / 2 + 24); ctx.restore();
          kit.rec(r.sx - 4, r.sx + sq + 4, r.ym + sq / 2 + 8, r.ym + sq / 2 + 40, String(r.k + 1), { decor: true });
        }
        kit.drawText(ctx, r.f, { x0: tx0, x1: tx1, y: r.ym, align: 'start', color: K.ink, key: K.ink,
          each: (w, i, b, c) => (M.rasterClip(c, r.words[i], P.q(r.words[i], t)) ? undefined : false) });
      }
      ground.machine(ctx, penAt(t));
    },
  };
}
