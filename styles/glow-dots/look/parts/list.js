// A list of lights: for each item a single bright firefly flies in on a curve and settles on the reading side as its marker, and the
// item's words gather from the night beside it. Items come one after another; a key phrase (*…*) in an item is in the accent's light
// with its own swarm, and its marker glows in the accent. spec: { duration, at?, says: { title?, items: [...] } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const indent = 64, cx0 = rtl ? SAFE.left + 20 : SAFE.left + indent, cx1 = rtl ? SAFE.right - indent : SAFE.right - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: cx1 - cx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left - 40, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = Math.max(120, rows[0].size * 1.9), tH = title ? title.height + 40 : 0;
  const top = kit.place(tH + pitch * items.length, 720);
  const TL = title && M.lightText(kit, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.lead, key: pal.key, gap: T.gap.small, seed: 30 });
  const gapT = Math.min(0.45, (d - 1.5) / Math.max(1, items.length)), t1 = d - T.dur.out - 0.1;
  const mx = rtl ? SAFE.right - 18 : SAFE.left + 18;
  const R = rows.map((f, k) => {
    const ym = top + tH + k * pitch + pitch / 2, L = M.lightText(kit, f, { x0: cx0, x1: cx1, y: ym, align: 'start', color: pal.glow, key: pal.key, gap: T.gap.small, seed: 40 + k });
    return { f, ym, L, t0: at + 0.3 + k * gapT, key: L.boxes.some((b) => b.key) };
  });
  const sMark = M.sprite(pal.glow, mix(pal.glow, '#ffffff', 0.5)), sKey = M.sprite(pal.key, mix(pal.key, '#ffffff', 0.5));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (TL) { M.drawLight(ctx, TL, t, (i) => ({ t0: at + i * 0.05, g: 0.55, t1, q: T.dur.out }), { rest: 0.2 }); kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', each: () => false }); }
      for (const r of R) {
        // the marker: one firefly on a curve from above the far side, settling on the reading side
        const p = span(t, r.t0 - 0.35, r.t0), q = span(t, t1, t1 + T.dur.out);
        if (p > 0 && q < 1) {
          const u = 1 - M.E(p), x = mx + (rtl ? -1 : 1) * 420 * u * u + Math.sin(u * 5) * 40 * u, y = r.ym - 260 * u + Math.cos(u * 4) * 30 * u - 180 * q * q;
          const s = 26 + 8 * Math.sin(t * 2.6 + r.ym) * (1 - u);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, p * 3) * (1 - q);
          ctx.drawImage(r.key ? sKey : sMark, x - s / 2, y - s / 2, s, s); ctx.drawImage(r.key ? sKey : sMark, x - s, y - s, s * 2, s * 2); ctx.restore();
        }
        M.drawLight(ctx, r.L, t, (i) => ({ t0: r.t0 - 0.1 + i * 0.05, g: T.dur.item + 0.15, t1, q: T.dur.out }), { rest: T.tone.dotRest });
        kit.drawText(ctx, r.f, { x0: cx0, x1: cx1, y: r.ym, align: 'start', each: () => false });
      }
    },
  };
}
