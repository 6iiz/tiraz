// The Play Marker ending: the studio sign-off. The frozen picture sinks back under the studio's dark colour, the show's accent block
// slides in large with the logo in it, the name lands on a broadcast card, and the analyst circles it with one last marker stroke;
// the handle and the slogan follow on the card's lower strip. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, field = ground.field, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left - 80;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const S = 280, lx = W / 2 - S / 2, ly = 330;
  const cy = ly + S + 70, cH = name.lead + 50, yName = cy + cH / 2, sy = cy + cH, sH = handle.lead + (slogan ? slogan.lead : 0) + 40;
  const yHandle = sy + 20 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.view(ctx, W, H, field, 1.25, { pan: -50, zoom: 1.08 + 0.02 * t / d, fx: W / 2, fy: 1150, P });
      ctx.fillStyle = rgba(P.dark, 0.25 + 0.55 * M.E(span(t, 0, 0.5))); ctx.fillRect(0, 0, W, H);
      // the accent block with the logo, thrown in from the reading side
      const pb = span(t, 0.2, 0.55);
      if (pb > 0) {
        const off = (rtl ? 1 : -1) * (1 - M.X(pb)) * (W * 0.8);
        ctx.fillStyle = P.accent; ctx.fillRect(lx + off, ly, S, S);
        if (t > 0.5) brand.logo.draw(ctx, lx + off + S * 0.2, ly + S * 0.2, S * 0.6, P.onAccent);
      }
      M.card(ctx, SAFE.left, cy, SAFE.right - SAFE.left, cH, span(t, 0.7, 0.98), 0, P, rtl, 12);
      kit.drawText(ctx, name, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: yName, align: 'center', color: P.light,
        each: (w, i, box, c) => { const s0 = 0.85 + i * T.dur.stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), 0, name.size, rtl) === false) return false; } });
      const sp = span(t, 1.2, 1.45);
      if (sp > 0) { ctx.fillStyle = rgba(P.light, 0.94); ctx.fillRect(SAFE.left + 60, sy, (SAFE.right - SAFE.left - 120), sH * M.X(sp)); }
      const onLight = P.dark;
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: onLight,
        each: (w, i, box, c) => { if (M.slide(c, span(t, 1.35, 1.35 + T.dur.in), 0, handle.size, rtl) === false) return false; } });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: onLight,
        each: (w, i, box, c) => { const s0 = 1.5 + i * T.dur.stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), 0, slogan.size, rtl) === false) return false; } });
      // one last loop of the marker round the name
      const lp = span(t, 1.8, 2.2);
      if (lp > 0) {
        const rx = name.width / 2 + 60, ry = cH / 2 - 12, pts = [];
        for (let i = 0; i <= 44; i++) { const u = -Math.PI * 0.6 + i / 44 * Math.PI * 2.15; pts.push([W / 2 + Math.cos(u) * rx, yName + Math.sin(u) * ry + i * 0.25]); }
        M.pen(ctx, pts, lp, P.pen, T.pen, 77);
      }
    },
  };
}
