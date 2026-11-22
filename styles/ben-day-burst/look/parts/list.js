// A list: a strip of four small prints (the bulb, the cup, the gem, the heart, each in its own colourway) runs across the top of the
// poster and keeps being pulled again in new colourways. Below it each item is a full-width block of flat colour pulled in by the
// blade on the beat, alternating the dark key colour and the pale tint; its index sits in a big accent dot.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, g = T.gutter;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, pitch = 120, bh = 104, dot = 92;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: full - dot - 60, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: full - 40, single: true, where: 'the list title' }) : null;
  const titleH = title ? title.lead + 24 : 0, top = Math.max(500, SAFE.bottom - 4 - pitch * items.length - titleH);
  const th = Math.min(330, top - 40 - 40), tw = (W - 80 - 3 * g) / 4;
  const strip = [0, 1, 2, 3].map((i) => ({ x: 40 + (rtl ? 3 - i : i) * (tw + g), y: 40, w: tw, h: th }));
  const y0 = top + titleH, mono = brand.fonts.display.family;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      strip.forEach((r, i) => M.cycling(ctx, r, P.ways, i, { t, t0: at + i * 0.08, start: at + 1.0, lag: i * 0.2, every: T.dur.swap, rtl, dots: ground.dots, keyC: P.night, paperC: P.paper,
        obj: M.OBJECTS[M.KINDS[i]], ox: r.x + r.w / 2, oy: r.y + r.h / 2, s: Math.min(r.w, r.h) / 240, step: T.dur.step, plate: T.dur.plate }));
      if (title) M.pullText(ctx, kit, title, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: top + title.lead / 2, t, t0: at + 0.1, d: T.dur.pull, P, color: P.onAccent, slab: P.accent });
      items.forEach((_, k) => {
        const t0 = at + 0.3 + k * T.beat, p = span(t, t0, t0 + 0.24); if (p <= 0) return;
        const y = y0 + k * pitch, ym = y + bh / 2, dark = k % 2 === 0, fill = dark ? P.night : P.tint, txt = dark ? P.paper : P.night, w = full * M.E(p);
        ctx.fillStyle = fill; ctx.fillRect(rtl ? SAFE.right - w : SAFE.left, y, w, bh);
        const dx = rtl ? SAFE.right - 16 - dot / 2 : SAFE.left + 16 + dot / 2, pd = M.E(span(t, t0 + 0.1, t0 + 0.3));
        if (pd > 0) {
          ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(dx, ym, (dot / 2) * pd, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = P.onAccent; ctx.font = `900 ${T.size.index}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          if (pd > 0.6) ctx.fillText(kit.fmt(k + 1), dx, ym + 2);
        }
        M.pullText(ctx, kit, rows[k], { x0: rtl ? SAFE.left + 24 : SAFE.left + dot + 40, x1: rtl ? SAFE.right - dot - 40 : SAFE.right - 24, y: ym, t, t0: t0 + 0.05, d: 0.24, P, color: txt });
      });
    },
  };
}
