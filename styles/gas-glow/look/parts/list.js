// A list as a column of tube rows on the panel: the title is painted, and each item hangs as clear glass with a small ring tube at
// its reading side. One beat apart, a switch clicks and the row's ring and words strike together, the gas running in from the
// reading side; a key phrase is the accent circuit. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, ring = 22, indent = ring * 2 + 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minPx: 46, where: 'the list title' }) : null;
  const pitch = Math.max(112, rows[0].size * 1.8), th = title ? title.height + 24 : 0;
  const top = kit.place(th + pitch * items.length, 700);
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1, rx = rtl ? x1 - ring : x0 + ring;
  const titleSign = title ? M.sign(title, { x0, x1, y: top + title.lead / 2 }, pal, rtl, { painted: true }) : null;
  const signs = rows.map((f, k) => M.sign(f, { x0: tx0, x1: tx1, y: top + th + k * pitch + pitch / 2 }, pal, rtl));
  const key = rows.map((f) => f.rows.some((r) => r.words.some((w) => w.key)));
  const at0 = (k) => at + 0.45 + k * T.beat;
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, lit = items.filter((_, k) => t >= at0(k)).length;
      ground.draw(ctx, t, { power: lit / items.length });
      ground.spill(ctx, W / 2, top + th + (pitch * lit) / 2, 560, 140 + pitch * lit * 0.6, pal.main.glow, Math.min(1, lit / 2));
      if (titleSign) { titleSign.draw(ctx, () => null); titleSign.rec(kit); }
      signs.forEach((s, k) => {
        const ym = top + th + k * pitch + pitch / 2, p = span(t, at0(k), at0(k) + T.dur.strike), b = M.strike(p, k + 2) * M.hum(time, k), c = key[k] ? pal.key : pal.main;
        ctx.save(); ctx.strokeStyle = pal.glass; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(rx, ym, ring - 4, 0, 7); ctx.stroke();
        if (b > 0) { ctx.globalAlpha = b; ctx.shadowColor = c.glow; ctx.shadowBlur = 20; ctx.strokeStyle = c.tube; ctx.beginPath(); ctx.arc(rx, ym, ring - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p * 1.6)); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = c.core; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.restore();
        s.draw(ctx, () => ({ run: p * 1.2, b })); s.rec(kit);
      });
      ground.glass(ctx, t);
    },
  };
}
