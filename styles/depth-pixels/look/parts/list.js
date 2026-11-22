// A list as a row of lanterns: on the glass plate every item has a small pixel lantern on the reading side. One per beat a lantern
// catches (its glass turns to light and blooms) and its item rises in beside it. The title rides on the name plate. Key items (*…*)
// sit in the lit pill. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const px = SAFE.left, pw = SAFE.right - SAFE.left, pad = 48, lan = 7 * 6 + 34, inner = pw - 2 * pad - lan;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: inner, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: pw - 140, minPx: 44, where: 'the list title' }) : null;
  const tabH = title ? title.height + 26 : 0, tabW = title ? title.width + 84 : 0, over = tabH * 0.55;
  const pitch = Math.max(rows[0].size * 1.8, 104), ph = pitch * items.length + 2 * pad + (title ? 14 : 0);
  const top = kit.place(over + ph, 720), py = top + over, y0 = py + pad + (title ? 14 : 0), tx = rtl ? px + pw - tabW - 34 : px + 34;
  const t0 = (k) => at + 0.3 + k * T.beat;
  const lit = { o: P.metal, L: P.light, W: P.l }, dark = { o: P.metal, L: P.floorD, W: P.floor };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pin = M.out3(span(t, at, at + 0.3)), pout = M.in2(span(t, d - 0.35, d));
      if (pin <= 0 || pout >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - pout; ctx.translate(0, (1 - pin) * 26 + pout * 22);
      M.plate(ctx, px, py, pw, ph, P, pin);
      if (title) { M.plate(ctx, tx, top, tabW, tabH, P, M.out3(span(t, at + 0.08, at + 0.36)));
        kit.drawText(ctx, title, { x0: tx + 42, x1: tx + tabW - 42, y: top + 13 + title.lead / 2, align: 'start', color: P.metal, key: P.metal,
          each: (w, i, box, c) => M.rise(c, span(t, at + 0.12 + i * 0.05, at + 0.4 + i * 0.05), title.size) }); }
      items.forEach((_, k) => {
        const ym = y0 + k * pitch + pitch / 2, on = t >= t0(k), lx = rtl ? px + pw - pad - 42 : px + pad;
        M.sprite(ctx, M.LANTERN, lx, ym - 30, on ? lit : dark, 6);               // the lantern catches: a new drawing, not a fade
        if (on) M.bloom(ctx, ground.lampGlow, lx + 21, ym, 120 * M.flicker(t + clock, k), 0.65 * (1 - pout));
        kit.drawText(ctx, rows[k], { x0: rtl ? px + pad : px + pad + lan, x1: rtl ? px + pw - pad - lan : px + pw - pad, y: ym, align: 'start', color: P.l, key: P.l,
          each: (w, i, box, c) => { if (M.rise(c, span(t, t0(k) + 0.04 + i * 0.05, t0(k) + 0.34 + i * 0.05), rows[k].size) === false) return false;
            if (w.key) { M.keyPill(c, box, rows[k].size, P); return P.onA; } } });
      });
      ctx.restore();
    },
  };
}
