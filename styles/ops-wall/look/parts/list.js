// A list as cards pinned down the wall: the title is written in graphite marker, then a leader is drawn down the reading side and a
// card lands on it per beat, each held by a magnet and joined to the leader by a short tick. A key word (*…*) on a card is looped in
// the accent marker once its card has landed. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, lead = 70, cardW = maxW - lead - 10, textW = cardW - 110;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 6, weight: 700, maxW: maxW - 20, single: true, where: 'the list title' }) : null;
  const head = title ? title.lead + 30 : 0, ch = rows[0].lead + 26, gap = 26;
  const top = kit.place(head + (ch + gap) * items.length, 720), y0 = top + head;
  const lx = rtl ? SAFE.right - 24 : SAFE.left + 24, cx = rtl ? SAFE.right - lead - cardW : SAFE.left + lead;
  const yOf = (k) => y0 + k * (ch + gap);
  const tTimes = title ? M.writeTimes(title, at, T.write.speed) : null;
  const t0 = (k) => at + (title ? 0.35 : 0.1) + k * T.beat;
  const leader = M.line([lx, y0 - 6], [lx, yOf(items.length - 1) + ch / 2], 3, 3);
  const ticks = items.map((_, k) => M.line([lx, yOf(k) + ch / 2], [rtl ? cx + cardW + 4 : cx - 4, yOf(k) + ch / 2], 50 + k, 1.5));
  const c = document.createElement('canvas').getContext('2d');
  const loops = items.map((_, k) => {
    const bs = []; kit.drawText(c, rows[k], { x0: cx + 55, x1: cx + cardW - 55, y: yOf(k) + ch / 2, align: 'start', decor: true, each: (w, i, b) => { if (w.key) bs.push(b); return false; } });
    return bs.map((b, i) => M.loop(b.x + b.width / 2, b.y + 2, b.width / 2 + rows[k].size * 0.35, rows[k].size * 0.62, 90 + k * 7 + i));
  });
  const turn = [0.008, -0.01, 0.006, -0.007, 0.009];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.42, d);
      if (title) {
        ctx.save(); ctx.globalAlpha = 1 - q;
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: P.ink,
          each: (w, i, box, cc) => M.write(cc, t, tTimes[i], box, title.size, rtl, P.ink, 20 + i) });
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = 1 - q;
      M.stroke(ctx, leader, span(t, t0(0) - 0.15, t0(items.length - 1) + 0.1), 5, P.ink);
      ticks.forEach((pts, k) => M.stroke(ctx, pts, span(t, t0(k) + 0.15, t0(k) + 0.3), 5, P.ink));
      ctx.restore();
      items.forEach((_, k) => {
        const y = yOf(k);
        M.card(ctx, cx, y, cardW, ch, P, span(t, t0(k), t0(k) + 0.35), span(t, d - 0.42 + k * 0.03, d), turn[k], () => {
          kit.drawText(ctx, rows[k], { x0: cx + 55, x1: cx + cardW - 55, y: y + ch / 2 + 3, align: 'start', color: P.ink, key: P.ink });
          M.magnet(ctx, rtl ? cx + cardW - 26 : cx + 26, y + 12, 14, k % 2 ? P.measure : P.ink, span(t, t0(k) + 0.25, t0(k) + 0.4));
          loops[k].forEach((pts) => M.stroke(ctx, pts, span(t, t0(k) + 0.45, t0(k) + 0.85), 6, P.accent));
        });
      });
    },
  };
}
