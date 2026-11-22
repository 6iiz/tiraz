// A list as a row of catalogue cards: each item on its own card, slid onto the table one per beat and set down a little below the
// last, with its exhibit number in the mono face at the far end. An item with a key word (*…*) carries an accent tab on its upper
// edge, and once the cards are down the loupe comes to rest on that word (on the last item when none is marked). The title is on
// a tag above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, numW = 80, textW = maxW - numW - 90;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 90, single: true, where: 'the list title' }) : null;
  const tagH = title ? title.lead + 26 : 0, tagW = title ? title.width + 90 : 0, head = title ? tagH + 36 : 0;
  const chH = rows[0].lead + 30, gap = 22, n = items.length;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const tx0 = rtl ? SAFE.left + numW + 30 : SAFE.left + 60, tx1 = rtl ? SAFE.right - 60 : SAFE.right - numW - 30;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const kIdx = keyed.indexOf(true) >= 0 ? keyed.indexOf(true) : n - 1;
  const kb = M.wordBoxes(kit, rows[kIdx], { x0: tx0, x1: tx1, y: 0, align: 'start' });
  const kw = kb.filter((b) => b.key).length ? kb.filter((b) => b.key) : kb;
  const kx0 = Math.min(...kw.map((b) => b.x)), kx1 = Math.max(...kw.map((b) => b.x + b.width));
  // the card under the loupe gets room above and below it, so the glass never covers a neighbouring card
  const above = kIdx > 0 || !!title, sides = (above ? 1 : 0) + (kIdx < n - 1 ? 1 : 0), room = SAFE.bottom - SAFE.top - head - (chH + gap) * n - 20;
  let r = Math.min(270, Math.max(rows[0].size * 1.1, ((kx1 - kx0) * T.loupe.mag) / 2 + 36));
  const extra = sides ? Math.max(0, Math.min(r + 26 - chH / 2 - gap, room / sides)) : 0;
  if (sides) r = Math.min(r, chH / 2 + gap + extra - 26);
  const top = kit.place(head + (chH + gap) * n + extra * sides, 720), y0 = top + head;
  const yOf = (k) => y0 + k * (chH + gap) + (k >= kIdx && above ? extra : 0) + (k > kIdx ? extra : 0);
  const tLoupe = at + 0.25 + 4 * T.beat + 0.1;
  const tilt = (k) => [0.006, -0.008, 0.004, -0.005, 0.007][k];               // set down by hand: never quite square
  const cardAt = (ctx, k, decor) => {
    const y = yOf(k);
    ctx.save(); ctx.translate(W / 2, y + chH / 2); ctx.rotate(tilt(k)); ctx.translate(-W / 2, -(y + chH / 2));
    M.card(ctx, SAFE.left, y, maxW, chH, P, rtl);
    if (keyed[k]) { ctx.fillStyle = P.accent; const tw = 90; ctx.fillRect(rtl ? SAFE.right - 60 - tw : SAFE.left + 60, y - 12, tw, 12); }
    ctx.restore();
    ctx.save(); ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.soft; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.textAlign = rtl ? 'left' : 'right'; const ix = rtl ? SAFE.left + 46 : SAFE.right - 46;
    ctx.fillText(String(k + 1).padStart(2, '0'), ix, y + chH / 2); ctx.restore();
    if (!decor) kit.rec(rtl ? ix : ix - 50, rtl ? ix + 50 : ix, y + chH / 2 - 16, y + chH / 2 + 16, String(k + 1), { decor: true });
    kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: y + chH / 2, align: 'start', color: P.ink, key: P.ink, decor });
    if (decor && k === kIdx) { ctx.fillStyle = P.mark; ctx.fillRect(kx0, y + chH / 2 + rows[k].size * 0.64, kx1 - kx0, Math.max(5, rows[k].size * 0.08)); }
  };
  const all = (ctx, t, decor) => {
    const out = span(t, d - 0.4, d);
    if (title) {
      ctx.save(); ctx.translate(M.slide(span(t, at, at + 0.5), out, W * 1.15, rtl), 0);
      const x = rtl ? SAFE.right - tagW : SAFE.left;
      M.card(ctx, x, top, tagW, tagH, P, rtl);
      kit.drawText(ctx, title, { x0: x + (rtl ? 26 : 46), x1: x + tagW - (rtl ? 46 : 26), y: top + tagH / 2, align: 'start', color: P.soft, decor });
      ctx.restore();
    }
    items.forEach((_, k) => {
      const t0 = at + 0.25 + k * T.beat, p = span(t, t0, t0 + 0.45), o = span(t, d - 0.42 + k * 0.03, d);
      if (p <= 0 || o >= 1) return;
      ctx.save(); ctx.translate(M.slide(p, o, W * 1.15, rtl), 0); cardAt(ctx, k, decor); ctx.restore();
    });
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      all(ctx, t, false);
      const kcx = (kx0 + kx1) / 2 + Math.sin(t * 0.9) * 5;
      M.loupe(ctx, kcx, yOf(kIdx) + chH / 2, r, span(t, tLoupe, tLoupe + 0.6), span(t, d - 0.62, d - 0.3), P, rtl, () => all(ctx, t, true), T.loupe.mag);
    },
  };
}
