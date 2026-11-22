// The gazette sign-off, the ident: two searchlight beams sweep the dark behind a turning globe (meridians rolling round it); a medallion
// of the accent is stamped on the globe with the brand's logo; a ribbon unrolls across the globe's foot with the name; the handle and the
// slogan follow on a title card. Everything moves on film frames under the projection. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, G = ground.G;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: 760, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 700, maxW: 760, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: 760, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 590, R = 250, yRib = cy + R - 20, ribH = name.lead + 30;
  const yCard = yRib + ribH / 2 + 60, cardH = handle.lead + (slogan ? slogan.lead : 0) + 50;
  const beam = (ctx, ang, len, wid) => {
    const ox = cx, oy = G.y + G.h + 40;
    ctx.beginPath(); ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.sin(ang - wid) * len, oy - Math.cos(ang - wid) * len); ctx.lineTo(ox + Math.sin(ang + wid) * len, oy - Math.cos(ang + wid) * len); ctx.closePath(); ctx.fill();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.q(t);
      ctx.save(); ground.weave(ctx, t);
      // the beams
      ctx.fillStyle = rgba(P.light, 0.13);
      beam(ctx, Math.sin(f * 1.1) * 0.55 - 0.35, 1900, 0.09); beam(ctx, Math.sin(f * 0.9 + 2) * 0.55 + 0.35, 1900, 0.09);
      // the globe
      const g = M.O(span(f, 0, 0.6)), r = R * (0.6 + 0.4 * g);
      if (g > 0) {
        ctx.globalAlpha = Math.min(1, g * 3);
        ctx.fillStyle = P.s(0.34); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = P.s(0.62); ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) { const ph = ((f * 0.35 + i / 6) % 1) * Math.PI; ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(Math.cos(ph)) * r, r, 0, 0, Math.PI * 2); ctx.stroke(); }
        for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) { const yy = cy + k * r, hw = Math.sqrt(1 - k * k) * r; ctx.beginPath(); ctx.ellipse(cx, yy, hw, hw * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = P.light; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // the medallion and the logo, stamped
      const m = M.O(span(f, 0.65, 0.85));
      if (m > 0) {
        const s = 1.3 - 0.3 * m, mr = 112 * s;
        ctx.fillStyle = P.dark; ctx.beginPath(); ctx.arc(cx, cy - 30, mr + 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(cx, cy - 30, mr, 0, Math.PI * 2); ctx.fill();
        brand.logo.draw(ctx, cx - mr * 0.62, cy - 30 - mr * 0.62, mr * 1.24, P.onAccent);
      }
      ctx.restore();
      // the ribbon with the name, unrolled from the middle
      const rb = M.O(span(f, 0.95, 1.3));
      if (rb > 0) {
        const w = (name.width + 160) * rb;
        ctx.fillStyle = P.dark; ctx.fillRect(cx - w / 2, yRib - ribH / 2, w, ribH);
        ctx.fillStyle = P.rule; ctx.fillRect(cx - w / 2, yRib - ribH / 2 + 8, w, 2); ctx.fillRect(cx - w / 2, yRib + ribH / 2 - 10, w, 2);
        if (rb > 0.98) { M.diamond(ctx, cx - w / 2 + 34, yRib, 10, P.accent); M.diamond(ctx, cx + w / 2 - 34, yRib, 10, P.accent);
          kit.drawText(ctx, name, { x0: cx - name.width / 2, x1: cx + name.width / 2, y: yRib, color: P.light, key: P.light }); }
      }
      // the card: handle and slogan
      if (f >= 1.4) {
        ctx.fillStyle = P.card; ctx.fillRect(SAFE.left + 50, yCard, SAFE.right - SAFE.left - 100, cardH);
        M.frame(ctx, SAFE.left + 58, yCard + 8, SAFE.right - SAFE.left - 116, cardH - 16, P.rule, P.accent);
        kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yCard + 25 + handle.lead / 2, color: P.light, key: P.light });
        if (slogan && f >= 1.6) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: yCard + 25 + handle.lead + slogan.lead / 2, color: P.light, key: P.light });
      }
      ground.over(ctx, t);
    },
  };
}
