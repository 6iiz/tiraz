// A list as a legend: each item is switched on beside a small swatch, and on the same beat its district of the model (a band of the
// table, taken from the reading side) pops on in that swatch's shade of the accent, a ramp from the accent toward white. The newest
// district is bright, the earlier ones settle lower. A key phrase is set in the accent with the projected glow.
// spec: { duration, at?, says: { title?, items } }
import { need, span, rgba, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, sw = 30, indent = sw + 30;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 500, maxW: x1 - x0, minScale: 1, where: 'the list title' }) : null;
  const pitch = Math.max(112, rows[0].size * 1.75);
  const top = kit.place((title ? title.height + 24 : 0) + pitch * items.length, 600);
  const yTitle = top + (title ? title.lead / 2 : 0), y0 = top + (title ? title.height + 24 : 0);
  const step = Math.min(0.5, (d - 1.2) / items.length);
  const shade = (k) => (items.length === 1 ? pal.accent : mix(pal.accent, pal.light, (k / (items.length - 1)) * 0.55));
  const keyRow = items.map((s) => /\*/.test(s));
  const band = (k) => { const n = items.length; return rtl ? 4 - Math.round((k * 4) / Math.max(1, n - 1)) : Math.round((k * 4) / Math.max(1, n - 1)); };
  const on = (k) => at + 0.3 + k * step;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { lit: (b) => {
        let best = null;
        items.forEach((_, k) => {
          if (band(k) !== b.band) return;
          const p = span(t, on(k), on(k) + 0.12); if (p <= 0) return;
          const newest = t < on(k + 1) || k === items.length - 1;
          best = [keyRow[k] ? pal.accent : shade(k), (p < 0.5 ? 0.4 : 1) * (keyRow[k] ? 1 : newest ? 0.85 : 0.55)];
        });
        return best;
      } });
      if (title) kit.drawText(ctx, title, { x0, x1, y: yTitle, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => M.strike(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.strike), 0, pal.grey, pal.dark, title.size, null) });
      items.forEach((_, k) => {
        const ym = y0 + k * pitch + pitch / 2, p = span(t, on(k) - 0.05, on(k) + T.dur.strike);
        if (p > 0.16) {
          const sx = rtl ? x1 - sw : x0;
          ctx.save(); ctx.fillStyle = keyRow[k] ? pal.accent : shade(k); if (keyRow[k]) { ctx.shadowColor = rgba(pal.accent, 0.7); ctx.shadowBlur = 18; }
          ctx.fillRect(sx, ym - sw / 2, sw, sw); ctx.restore();
          ctx.fillStyle = rgba(pal.light, 0.12); ctx.fillRect(x0, ym + pitch / 2 - 1, x1 - x0, 1);
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.light, key: pal.key,
          each: (w, i, box, c) => M.strike(c, span(t, on(k) - 0.05 + i * 0.04, on(k) - 0.05 + i * 0.04 + T.dur.strike), 0, w.key ? pal.key : pal.light, pal.dark, rows[k].size, w.key ? rgba(pal.accent, 0.6) : null) });
      });
    },
  };
}
