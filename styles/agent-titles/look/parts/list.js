// A list as a roster of credits: on a location in the dark ink, each item is a snipped paper card that slides in along its row from the
// reading side on the beat, stops dead and slaps down on twos, with its number on a round hot-ink tag cut at the far end. A key word is
// cut on a hot card inside its paper card. The title sits on the ground over a hot snipped rule; the agent crosses the ledge below.
// spec: { duration, at?, says: { title?, items } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, which: 'ink', seed: 5 });
  const M = await import(look.base + 'motion.js'), I = ground.I, G = ground.color;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left, tag = 74, textW = maxW - tag - 110;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 800, maxW, single: true, where: 'the list title' }) : null;
  const ch = rows[0].size * 1.7, gap = 26, head = title ? title.size * 1.6 + 50 : 0;
  const top = kit.place(head + items.length * (ch + gap) - gap, 640), y0 = top + head;
  const cards = items.map((_, k) => M.cut(M.strip(0, -ch / 2, maxW - k * 30, ch, 18), 60 + k));
  const tags = items.map((_, k) => M.cut(M.ring(0, 0, tag / 2, 40), 70 + k, 1.2));
  const rule = title ? M.cut(M.strip(0, 0, title.width + 60, 14, 8), 80, 1) : null;
  const ledge = M.cut(M.rect(-40, 0, W + 80, 22), 12, 1.4), keyCards = new Map();
  const tItem = (k) => at + 0.2 + k * T.beat;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), o = M.I(out), dir = rtl ? 1 : -1;
      ctx.save(); ctx.translate(0, T.ledge); M.piece(ctx, ledge, I.paper, G); ctx.restore();
      M.agent(ctx, M.walkX(t, at - 0.6, rtl ? W + 80 : -80, rtl ? -1 : 1), T.ledge + 2, T.agent, rtl ? -1 : 1, t, { fill: I.paper, scarf: I.hot, gap: G });
      if (title) {
        const p = span(t, at, at + T.dur.slide), dx = (1 - M.O(p)) * dir * 900 - dir * o * 1300;
        if (p > 0) {
          const yt = top + title.size * 0.8;
          ctx.save(); ctx.translate((rtl ? SAFE.right - title.width - 60 : SAFE.left) + dx, yt + title.size * 0.72); M.piece(ctx, rule, I.hot, G); ctx.restore();
          kit.drawText(ctx, title, { x0: SAFE.left + dx, x1: SAFE.right - 30 + dx, y: yt, align: 'start', color: I.on(G) });
        }
      }
      items.forEach((_, k) => {
        const t0 = tItem(k), p = span(t, t0, t0 + T.dur.slide); if (p <= 0) return;
        const ok = M.I(span(t, d - T.dur.out + k * 0.03, d)); if (ok >= 1) return;
        const cw = maxW - k * 30, x0 = rtl ? SAFE.right - cw : SAFE.left, ym = y0 + k * (ch + gap) + ch / 2;
        const dx = (1 - M.O(p)) * dir * 1000 - dir * ok * 1300, s = M.slap(t - t0 - T.dur.slide);
        ctx.save(); ctx.translate(x0 + dx + cw / 2, ym); ctx.scale(s, s); ctx.translate(-cw / 2, 0);
        M.piece(ctx, cards[k], I.paper, G);
        const tx = rtl ? 40 + tag / 2 : cw - 40 - tag / 2;
        ctx.save(); ctx.translate(tx, 0); M.piece(ctx, tags[k], I.hot, I.paper, { shadow: false, gapW: 4 });
        ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = I.on(I.hot); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(String(k + 1), 0, 2); ctx.restore();
        kit.rec(x0 + dx + tx - 24, x0 + dx + tx + 24, ym - 24, ym + 24, String(k + 1), { decor: true });
        const r = rows[k];
        kit.drawText(ctx, r, { x0: rtl ? 40 + tag + 30 : 40, x1: rtl ? cw - 40 : cw - 40 - tag - 30, y: r.size * 0.04, align: 'start', color: I.on(I.paper), key: I.on(I.hot),
          each: (w, i, box, c) => {
            if (!w.key) return;
            const kk = k + '_' + Math.round(box.width);
            if (!keyCards.has(kk)) keyCards.set(kk, M.cut(M.rect(-12, -ch * 0.4, box.width + 24, ch * 0.8), 90 + keyCards.size, 1.2));
            c.save(); c.translate(box.x, box.y); M.piece(c, keyCards.get(kk), I.hot, I.paper, { shadow: false, gapW: 4 }); c.restore();
            return I.on(I.hot);
          } });
        ctx.restore();
      });
    },
  };
}
