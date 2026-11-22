// A list as a map legend: the panel holds numbered rows, and for every row that settles in, a building grows up out of the square on
// the board with the same number floating over it on a pin. A key phrase in a row gets the accent marker and its building is the
// accent one. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

const SLOTS = [[3.9, 4.1, 1.7, 1.7, 1.5], [7.5, 3.9, 2.0, 1.7, 2.1], [4.0, 7.7, 1.8, 1.8, 1.2], [7.7, 7.6, 1.8, 1.9, 2.5], [5.9, 5.9, 1.5, 1.5, 3.0]];

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const pad = T.panel.pad, x0 = SAFE.left, x1 = SAFE.right, ix0 = x0 + pad, ix1 = x1 - pad, br = 27, indent = br * 2 + 26;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: ix1 - ix0 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: ix1 - ix0, minPx: 46, where: 'the list title' }) : null;
  const pitch = Math.max(98, rows[0].size * 1.62), th = title ? title.height + 12 : 0;
  const cardH = T.panel.top + th + pitch * items.length + pad * 0.3;
  const y0 = kit.place(cardH, 600), y1 = y0 + cardH;
  const tx0 = rtl ? ix0 : ix0 + indent, tx1 = rtl ? ix1 - indent : ix1, bx = rtl ? ix1 - br : ix0 + br;
  const at0 = (k) => at + 0.55 + k * T.beat;
  const key = rows.map((f) => f.rows.some((r) => r.words.some((w) => w.key)));
  const slots = items.map((_, k) => ({ k, s: SLOTS[k] })).sort((a, b) => a.s[0] + a.s[1] - b.s[0] - b.s[1]);
  const plaza = (t) => (ctx, P) => {
    for (const { k, s } of slots) {
      const g = M.E(span(t, at0(k) - 0.05, at0(k) + 0.4)); if (g <= 0) continue;
      M.block(ctx, P, s[0], s[1], 0, s[2], s[3], s[4], key[k] ? pal.hot : pal.blocks[k % 2 ? 5 : 0], { grow: g, windows: key[k] ? pal.blocks[3].right : pal.glass });
    }
    for (const { k, s } of slots) {                                       // the numbered pins float over their buildings
      const p = M.E(span(t, at0(k) + 0.2, at0(k) + 0.5)); if (p <= 0) continue;
      const [cx, cy] = P(s[0] + s[2] / 2, s[1] + s[3] / 2, s[4]), hy = cy - 34 - 26 * p;
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3);
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, hy); ctx.stroke();
      M.badge(ctx, cx, hy, 19, k + 1, pal, mono, key[k]); ctx.restore();
    }
  };
  const word = (t, t0) => (w, i, box, c) => { const s = t0 + i * 0.05; if (M.settle(c, span(t, s, s + T.dur.in), box) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { plaza: plaza(t) });
      const pin = ground.at(7, 7, 1.2, t), out = M.OUT(span(t, d - T.dur.out, d)), top = [pin[0], y1];
      M.leader(ctx, pin, top, span(t, at, at + 0.25) * (1 - out), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, at + 0.16, at + 0.46)) * (1 - out), top[0], top[1]) === false) { ctx.restore(); return; }
      M.panel(ctx, x0, y0, x1, y1, pal, rtl);
      let y = y0 + T.panel.top;
      if (title) { kit.drawText(ctx, title, { x0: ix0, x1: ix1, y: y + title.lead / 2, align: 'start', color: pal.muted, each: word(t, at + 0.3) }); y += th; }
      items.forEach((_, k) => {
        const ym = y + k * pitch + pitch / 2, t0 = at0(k);
        if (k) { ctx.fillStyle = pal.faint; ctx.fillRect(ix0, y + k * pitch, ix1 - ix0, 2); }
        const bp = M.Q(span(t, t0 - 0.1, t0 + 0.2));
        if (bp > 0) {
          ctx.save(); ctx.translate(bx, ym); ctx.scale(bp, bp); ctx.translate(-bx, -ym);
          M.badge(ctx, bx, ym, br, k + 1, pal, mono, key[k]); ctx.restore();
          kit.rec(bx - br, bx + br, ym - br, ym + br, String(k + 1), { decor: true });
        }
        for (const r of M.keyRuns(rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start' }, rtl)) M.marker(ctx, r, rows[k].size, span(t, t0 + 0.12, t0 + 0.38), pal, rtl);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.onAccent, each: word(t, t0) });
      });
      ctx.restore();
    },
  };
}
