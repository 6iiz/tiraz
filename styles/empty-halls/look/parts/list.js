// A list as a notice taped up in the empty hall: a sheet of paper (the brand's light colour, dimmed by the hall's light) held by two
// strips of tape, its title underlined, each rule focusing in on its own beat beside a small box. The key item is marked with a
// highlighter stroke in the accent. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const sx0 = SAFE.left + 10, sx1 = SAFE.right - 10, pad = 54, x0 = sx0 + pad, x1 = sx1 - pad, box = 34, indent = box + 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent - M.keyRoom(T.size.item), single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 800, maxW: x1 - x0, minScale: 0.9, where: 'the list title' }) : null;
  const n = items.length, pitch = Math.max(100, rows[0].size * 1.8), tH = title ? title.height + 34 : 0;
  const sheetH = pad * 2 + tH + pitch * n, top = kit.place(sheetH, T.vy - 10), room = Math.max(0.3, Math.min(0.5, (d - 1.2) / n));
  const paper = mix(P.light, P.dark, 0.16), ink = P.dark, rule = mix(paper, ink, 0.25);
  const t0 = (k) => at + 0.3 + k * room, ym = (k) => top + pad + tH + k * pitch + pitch / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = ground.time(t), out = span(t, d - T.dur.out, d), pin = span(t, at - 0.1, at + 0.35);
      if (pin > 0 && out < 1) {
        const hunt = pin < 0.6 ? 8 * (1 - pin / 0.6) ** 1.4 : 0;
        ctx.save(); ctx.globalAlpha = Math.min(1, pin * 2.5) * (1 - M.accel(out)); ctx.translate(M.accel(out) * 90, 0);
        if (hunt > 0.25) ctx.filter = `blur(${hunt.toFixed(2)}px)`;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx0 + 10, top + 16, sx1 - sx0, sheetH);
        ctx.fillStyle = paper; ctx.fillRect(sx0, top, sx1 - sx0, sheetH);
        ctx.fillStyle = rgba(P.acc, 0.5);
        for (const [x, a] of [[sx0 + 70, -0.5], [sx1 - 70, 0.45]]) { ctx.save(); ctx.translate(x, top + 4); ctx.rotate(a); ctx.fillRect(-60, -18, 120, 36); ctx.restore(); }
        ctx.restore();
      }
      if (title) {
        M.focusText(ctx, kit, title, { x0, x1, y: top + pad + title.lead / 2, align: 'start', color: ink, P, keyed: false, when: () => at + 0.1, out, t, time });
        const rw = (x1 - x0) * M.soft(span(t, at + 0.3, at + 0.7)) * (1 - M.accel(out));
        ctx.fillStyle = ink; ctx.fillRect(kit.rtl ? x1 - rw : x0, top + pad + title.height + 4, rw, 3);
      }
      items.forEach((_, k) => {
        const p = span(t, t0(k), t0(k) + 0.2); if (p <= 0 || out >= 1) return;
        const bx = kit.rtl ? x1 - box : x0, y = ym(k);
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 2) * (1 - M.accel(out)); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.strokeRect(bx, y - box / 2, box, box);
        if (k < n - 1) { ctx.fillStyle = rule; ctx.fillRect(x0, y + pitch / 2 - 1, x1 - x0, 2); }
        ctx.restore();
        M.focusText(ctx, kit, rows[k], { x0: kit.rtl ? x0 : x0 + indent, x1: kit.rtl ? x1 - indent : x1, y, align: 'start', color: ink, keyColor: P.onAcc, P, marker: true,
          when: () => t0(k), out, t, time, dur: 0.4 });
      });
      ground.over(ctx, t);
    },
  };
}
