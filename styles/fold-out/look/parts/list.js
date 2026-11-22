// A list as a row of pop-up strips: the title pops up first on a small card; then one strip per beat, each popping up on its hinge in
// front of the last, with an accent pull-tab sticking out on the reading side. A key phrase gets one accent sticker that flips open.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const sw = T.textW - 40, x0 = W / 2 - sw / 2 + 40, x1 = W / 2 + sw / 2 - 40, px = T.size.item * 0.26;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - 20, single: true, where: 'a list item' }).map((r) => M.isolate(r, px + 14, 2000));
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: T.textW - 60, minScale: 0.85, where: 'the list title' }) : null;
  const sh = rows[0].size * 1.55, pitch = sh + 30, th = title ? title.height + 34 : 0, tw = title ? Math.min(W - 90, title.width + 90) : 0;
  const block = (title ? th + 34 : 0) + pitch * items.length - 30, top = kit.place(block, 720);
  const y0 = top + (title ? th + 34 : 0);
  const strip = M.card(sw, sh, P.card, P, 23), TC = title ? M.card(tw, th, P.card, P, 29) : null;
  const tab = M.card(54, sh * 0.55, P.accent, P, 31), tabX = rtl ? W / 2 + sw / 2 + 8 : W / 2 - sw / 2 - 8;
  const runs = rows.map((r, k) => M.keyRuns(r, x0, x1, y0 + k * pitch + sh / 2, 'start', rtl).map((q, j) => ({ ...q, st: M.card(q.x1 - q.x0 + 2 * px, r.size * 1.25, P.accent, P, 70 + k * 3 + j) })));
  const tItem = (k) => at + 0.25 + k * T.beat;
  const out = (t, k) => M.fold(span(t, d - T.dur.out + k * 0.03, d - T.dur.out + k * 0.03 + 0.25));
  const put = (c, pc, x, y) => { c.drawImage(pc.shadow, x - pc.w / 2 - pc.m + 4, y - pc.h / 2 - pc.m + 6); c.drawImage(pc.img, x - pc.w / 2 - pc.m, y - pc.h / 2 - pc.m); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        const s = M.pop(span(t, at, at + 0.4)) * out(t, 0), base = top + th;
        M.stand(ctx, TC, W / 2, base, s, (c) => kit.drawText(c, title, { x0: W / 2 - tw / 2, x1: W / 2 + tw / 2, y: top + th / 2, align: 'center', color: P.soft }));
      }
      items.forEach((_, k) => {
        const t0 = tItem(k), s = M.pop(span(t, t0, t0 + 0.4)) * out(t, k + 1), ym = y0 + k * pitch + sh / 2, base = ym + sh / 2;
        if (s <= 0) return;
        ctx.save(); ctx.translate(0, base); ctx.scale(1, s); ctx.translate(0, -base);
        put(ctx, tab, tabX, ym); ctx.restore();
        M.stand(ctx, strip, W / 2, base, s, (c) => {
          const p = span(t, t0 + 0.25, t0 + 0.55);
          for (const r of runs[k]) { const cx = (r.x0 + r.x1) / 2; c.save(); if (M.flip(c, p, cx)) put(c, r.st, cx, ym); c.restore(); }
          kit.drawText(c, rows[k], { x0, x1, y: ym, align: 'start', color: P.dark, key: P.on,
            each: (w, i, box, cc) => {
              if (w.ph) return false;
              if (!w.key) return;
              const r = runs[k].find((q) => w.idx >= q.first && w.idx <= q.last); if (!r || p <= 0) return P.dark;
              M.flip(cc, p, (r.x0 + r.x1) / 2);
            } });
        });
      });
    },
  };
}
