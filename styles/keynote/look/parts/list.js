// A list as a stack of panels: a container on the first surface holds one row panel per item on the second, each numbered in a chip on
// the third. The key item (*…*) gets an accent edge on its reading side and an accent border. Rows snap in one after another and the light sweeps across each as it
// lands. Each row carries its number in a round chip. spec: { duration, at?, says: { title?, items } }
import { need, span, rr, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, pad = 18, chip = 52, inner = 28;
  const tx0 = rtl ? L + pad + inner : L + pad + inner + chip + 24, tx1 = rtl ? R - pad - inner - chip - 24 : R - pad - inner;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 6, weight: 600, maxW: R - L, single: true, where: 'the list title' }) : null;
  const rowH = Math.max(110, rows[0].size * 1.9), gapR = 12, boxH = pad * 2 + items.length * rowH + (items.length - 1) * gapR;
  const head = title ? title.lead + 24 : 0, top = kit.place(head + boxH, 720), yBox = top + head;
  const isKey = rows.map((f) => f.rows.some((r) => r.words.some((w) => w.key)));
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d);
      ctx.save(); ctx.globalAlpha = 1 - M.S(out);
      M.card(ctx, L, yBox, R - L, boxH, T.radius.card, pal.s1, pal.border, span(t, at - 0.1, at + T.dur.in));
      ctx.restore();
      if (title) kit.drawText(ctx, title, { x0: L, x1: R, y: top + title.lead / 2, align: 'start', color: pal.dim,
        each: (w, i, box, c) => {
          if (M.arrive(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), box, title.size) === false) return false;
          if (M.leave(c, out, box, title.size) === false) return false;
        } });
      items.forEach((_, k) => {
        const t0 = at + 0.25 + k * T.dur.row, y = yBox + pad + k * (rowH + gapR), x = L + pad, w = R - L - 2 * pad, ym = y + rowH / 2;
        const p = span(t, t0, t0 + T.dur.in);
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha = 1 - M.S(out); ctx.translate(0, (1 - M.E(p)) * 26 - M.S(out) * 14);
        M.card(ctx, x, y, w, rowH, T.radius.row, pal.s2, isKey[k] ? rgba(pal.accent, 0.6) : pal.border, p);
        M.sheen(ctx, x, y, w, rowH, T.radius.row, span(t, t0 + 0.1, t0 + 0.1 + T.dur.sweep), pal.light, rtl, isKey[k] ? 1.4 : 0.8);
        if (isKey[k]) { ctx.save(); rr(ctx, x, y, w, rowH, T.radius.row); ctx.clip(); ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x + w - 6 : x, y, 6, rowH); ctx.restore(); }
        const cxc = rtl ? x + w - inner - chip / 2 : x + inner + chip / 2;
        ctx.globalAlpha *= M.E(p);
        ctx.fillStyle = pal.s3; ctx.beginPath(); ctx.arc(cxc, ym, chip / 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.border; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.fillStyle = pal.light; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), cxc, ym + 1);
        ctx.restore();
        kit.rec(cxc - chip / 2, cxc + chip / 2, ym - chip / 2, ym + chip / 2, String(k + 1), { decor: true });
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.light, key: pal.keyOn(pal.s2),
          each: (wd, i, box, c) => {
            if (M.arrive(c, span(t, t0 + 0.05, t0 + 0.05 + T.dur.in), box, rows[k].size) === false) return false;
            if (M.leave(c, out, box, rows[k].size) === false) return false;
          } });
      });
    },
  };
}
