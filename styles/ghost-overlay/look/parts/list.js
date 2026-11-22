// A list as a run of exposures: each item arrives as a ghost and a print sliding into register, one every `beat`, and as it lands a
// small lamp lights beside it on the reading side. Key words hold the deep landscape. A whale swims slowly along the bottom of the
// frame, a window with the sea-coast landscape inside it. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, dir = rtl ? 1 : -1;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, indent = 64;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW, minScale: 0.9, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.95, titleH = title ? title.height + 36 : 0;
  const top = kit.place(titleH + pitch * items.length, 700);
  const tx0 = rtl ? SAFE.left : SAFE.left + indent, tx1 = rtl ? SAFE.right - indent : SAFE.right;
  const ys = items.map((_, k) => top + titleH + k * pitch + pitch / 2);
  const K = rows.map((f, k) => M.keys(kit, f, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }, P, T, dir));
  const tex = M.landscape(W + 500, 700, P, 91);
  const beat = 0.4, t0 = (k) => at + 0.3 + k * beat;
  let curT = 0;
  return {
    duration: d,
    draw(ctx, t) {
      curT = t; ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d);
      const wx = W * 0.5 + (rtl ? -1 : 1) * (60 - 26 * t);
      ctx.save(); ctx.globalAlpha = 1 - M.I(out);
      M.window(ctx, M.whale(Math.sin(time * 1.6) * 34), { x: wx, y: 1560 + Math.sin(time * 0.9) * 14, s: 0.78, flip: rtl ? 1 : -1 }, tex,
        -250 + T.drift.inside * 2 * t * dir, 1330, P, span(t, at - 0.2, at + T.dur.rise));
      ctx.restore();
      if (title) M.twice(kit, ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start' }, {
        shift: T.ghost.shift * 0.6, ghostA: T.ghost.alpha, dir, color: P.grey, ghostColor: P.grey,
        when: (i) => [span(curT, at + i * 0.05, at + i * 0.05 + T.dur.in), out] });
      rows.forEach((f, k) => {
        const s0 = t0(k), lit = span(t, s0 + 0.2, s0 + 0.35) * (1 - M.I(out));
        const cx = rtl ? SAFE.right - 18 : SAFE.left + 18, cy = ys[k];
        if (lit > 0) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 44);
          g.addColorStop(0, rgba(P.lamp, 0.35 * lit)); g.addColorStop(1, rgba(P.lamp, 0));
          ctx.fillStyle = g; ctx.fillRect(cx - 44, cy - 44, 88, 88);
          ctx.fillStyle = P.lamp; ctx.globalAlpha = lit; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        M.twice(kit, ctx, f, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }, {
          shift: T.ghost.shift, ghostA: T.ghost.alpha, dir, color: P.ink, ghostColor: P.ink, style: K[k].style(t),
          when: (i) => [span(curT, s0 + i * 0.04, s0 + i * 0.04 + T.dur.in), out] });
        K[k].rule(ctx, span(t, s0 + 0.3, s0 + 0.6) * (1 - out));
      });
    },
  };
}
