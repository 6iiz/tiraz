// A list as a strip of small panels: each row is its own panel, tilted a little one way or the other, that pops in on the beat with
// its number in an accent disc with an ink outline on the reading side. The title rides in an accent caption box. A key word (*…*) in
// an item gets a small accent burst behind it. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, zoom, panel, burstPath, burst, keyBoxes } = await import(look.base + 'motion.js');
  const P = ground.P, rtl = kit.rtl, R = T.size.item * 0.58, padX = 34, indent = 2 * R + padX + 26;
  const textW = SAFE.right - SAFE.left - indent - padX - 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 4, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(140, rows[0].size * 2.15), ph = pitch - 30, tH = title ? title.lead + 18 : 0;
  const top = kit.place((title ? tH + 34 : 0) + pitch * items.length, 720);
  const out0 = d - T.dur.out, y0 = top + (title ? tH + 34 : 0);
  const geo = items.map((_, k) => {
    const yr = y0 + k * pitch, ym = yr + ph / 2, o = { x0: rtl ? SAFE.left + padX : SAFE.left + indent, x1: rtl ? SAFE.right - indent : SAFE.right - padX, y: ym, align: 'start' };
    const keys = keyBoxes(kit, rows[k], o).map((b) => ({ ...b, path: burstPath(b.x + b.width / 2, b.y, b.width / 2 + 6, rows[k].size * 0.5, rows[k].size * 0.5, 12, k) }));
    return { yr, ym, o, keys, dx: rtl ? SAFE.right - padX - R : SAFE.left + padX + R, tilt: (k % 2 ? 1 : -1) * 0.014 };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      if (title) {
        const w = title.width + 60, x = rtl ? SAFE.right - w - 40 : SAFE.left + 40;      // inset, so the pop past full size stays inside
        ctx.save();
        if (zoom(ctx, span(t, at, at + T.dur.panel), q, x + w / 2, top + tH / 2, -0.03) !== false) {
          panel(ctx, x, top, w, tH, P.accent, P, T);
          kit.drawText(ctx, title, { x0: x, x1: x + w, y: top + tH / 2, color: P.on });
        }
        ctx.restore();
      }
      geo.forEach((g, k) => {
        const t0 = at + 0.25 + k * T.beat;
        ctx.save();
        if (zoom(ctx, span(t, t0, t0 + T.dur.panel), q, W / 2, g.ym, g.tilt) !== false) {
          panel(ctx, SAFE.left, g.yr, SAFE.right - SAFE.left, ph, P.paper, P, T);
          ctx.beginPath(); ctx.arc(g.dx, g.ym, R, 0, Math.PI * 2); ctx.fillStyle = P.accent; ctx.fill();
          ctx.lineWidth = T.ink.line * 0.75; ctx.strokeStyle = P.ink; ctx.stroke();
          kit.number(ctx, String(k + 1), { x: g.dx, y: g.ym + 3, size: R * 1.2, color: P.on, decor: true });
          for (const b of g.keys) { ctx.fillStyle = P.accent; ctx.fill(b.path); }
          kit.drawText(ctx, rows[k], { ...g.o, color: P.ink, key: P.on,
            each: (w, i, bx, c) => { const s0 = t0 + 0.12 + i * T.dur.step; if (arrive(c, span(t, s0, s0 + T.dur.in), bx, rows[k].size) === false) return false; } });
        }
        ctx.restore();
      });
    },
  };
}
