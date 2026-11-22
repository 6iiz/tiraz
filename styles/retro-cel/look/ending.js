// The retro-cel ending: the end card of an episode. A lit disc rises on the held drawings like a sun coming up, with the logo cut
// into it in the cel outline colour and slow rays turning behind; a star glint catches its rim. The name slides in in cel lettering,
// the handle on a dark plate edged with the accent, and the slogan last. spec: { duration }
import { need, span, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: X1 - X0 - 60, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: X1 - X0 - 160, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: X1 - X0 - 40, minScale: 0.92, where: 'the slogan' }) : null;
  const R = 150, cy = 300 + R, yName = cy + R + 60 + name.lead / 2;
  const hw = handle.width + 100, hh = handle.lead + 16, hy = yName + name.lead / 2 + 14, ySlogan = hy + hh + 36 + (slogan ? slogan.lead / 2 : 0);
  const rays = document.createElement('canvas'); rays.width = 1200; rays.height = 1200;
  { const g = rays.getContext('2d'), gr = g.createRadialGradient(600, 600, R, 600, 600, 600);
    gr.addColorStop(0, rgba(P.accent, 0.55)); gr.addColorStop(1, rgba(P.accent, 0)); g.fillStyle = gr; g.beginPath();
    for (let i = 0; i < 14; i++) { const a0 = (i / 14) * Math.PI * 2, a1 = a0 + Math.PI / 18; g.moveTo(600, 600); g.arc(600, 600, 600, a0, a1); g.closePath(); }
    g.fill(); }
  return {
    duration: d,
    draw(ctx, t) {
      const th = M.held(t);
      ground.draw(ctx, t);
      const rise = M.E(span(th, 0.05, 0.7)), y = cy + (1 - rise) * 520;
      if (rise > 0) {
        ctx.save(); ctx.globalAlpha = rise; ctx.translate(W / 2, y); ctx.rotate(th * 0.1); ctx.drawImage(rays, -600, -600); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cy + R + 8); ctx.clip();       // it comes up from behind a horizon under it
        ctx.shadowColor = P.halo; ctx.shadowBlur = 50; ctx.fillStyle = P.key; ctx.beginPath(); ctx.arc(W / 2, y, R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = P.keyShade; ctx.beginPath(); ctx.arc(W / 2, y, R, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();   // the hard shade crescent
        ctx.fillStyle = P.key; ctx.beginPath(); ctx.ellipse(W / 2, y - 10, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = P.line; ctx.beginPath(); ctx.arc(W / 2, y, R, 0, Math.PI * 2); ctx.stroke();
        if (th >= 0.7) brand.logo.draw(ctx, W / 2 - R * 0.6, y - R * 0.6, R * 1.2, P.line);
        ctx.restore();
        ctx.fillStyle = P.accent; ctx.fillRect(X0 + 40, cy + R + 8, (X1 - X0 - 80) * M.E(span(th, 0.5, 0.8)), 4);
      }
      if (th >= 0.9) M.glint(ctx, W / 2 + R * 0.72, cy - R * 0.72, 70, ((th - 0.9) % 1.5) / 0.5, P.light);
      M.cel(kit, ctx, name, { x0: X0, x1: X1, y: yName, align: 'center', P, rtl, at: () => span(th, 0.85, 0.85 + T.dur.slide) });
      M.bar(ctx, W / 2 - hw / 2, hy, hw, hh, P, span(th, 1.2, 1.37));
      M.cel(kit, ctx, handle, { x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y: hy + hh / 2, align: 'center', P, rtl, at: () => span(th, 1.28, 1.28 + T.dur.slide) });
      if (slogan) M.cel(kit, ctx, slogan, { x0: X0, x1: X1, y: ySlogan, align: 'center', P, rtl, at: (w, i, b) => span(th, 1.55 + b.row * 0.17, 1.55 + b.row * 0.17 + T.dur.slide) });
      ground.over(ctx, t);
    },
  };
}
