// The notes' ending: the page is finished as a small poster while the view pulls back from it. A round badge is drawn and shaded, the
// brand's logo is filled into it from the top, a wide ribbon banner is drawn under it with the name written on it, then the handle
// (left to right) and the slogan, which gets the highlighter. spec: { duration }
import { need, span, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: 620, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0 - 40, single: true, where: 'the slogan' }) : null;
  const R = 150, cx = W / 2, cy = 500, bh = name.size * 1.65, yName = cy + R + 60 + bh / 2;
  const yHandle = yName + bh / 2 + 50 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const ring = M.circle(501, cx, cy, R, R * 0.97), B = M.banner(502, cx, yName, name.width + 120, bh);
  const sName = M.schedule(name, 1.05, 1.5, 0.05), sHandle = M.schedule(handle, 1.6, 1.95, 0.04), sSlogan = slogan ? M.schedule(slogan, 2.0, 2.4, 0.05) : [];
  const sb = slogan ? M.layout(slogan, { x0, x1, y: ySlogan }, rtl) : [];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const z = 1.14 - 0.14 * ease.outCubic(span(t, 0, 1.6));             // the pull-back
      ctx.save(); ctx.translate(W / 2, 760); ctx.scale(z, z); ctx.translate(-W / 2, -760);
      const pr = span(t, 0.05, 0.4);
      if (pr > 0) {
        M.shade(ctx, span(t, 0.3, 0.5), (c) => { c.beginPath(); c.arc(cx + 14, cy + 14, R, 0, Math.PI * 2); c.arc(cx, cy, R, 0, Math.PI * 2, true); }, [cx - R, cy - R, cx + R + 16, cy + R + 16], P.greyDeep, rtl, 7);
        ctx.fillStyle = P.paper; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      }
      M.trace(ctx, ring, pr, T.pen.bold, P.ink);
      const pl = span(t, 0.45, 0.85), S = R * 1.15;
      if (pl > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx - S, cy - S / 2 - 2, S * 2, (S + 4) * pl); ctx.clip(); brand.logo.draw(ctx, cx - S / 2, cy - S / 2, S, P.ink); ctx.restore(); }
      const pb = span(t, 0.75, 1.05), [bx0, by0, bx1, by1] = B.band;
      if (pb > 0) {
        for (const tail of B.tails) { M.fillPoly(ctx, tail, P.greyDeep); M.trace(ctx, [...tail, tail[0]], pb, T.pen.fine, P.ink); }
        ctx.fillStyle = P.paper; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        M.trace(ctx, B.outline, pb, T.pen.bold, P.ink);
      }
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.ink, key: P.ink, each: M.writer(t, sName, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.note, key: P.note, each: M.writer(t, sHandle, handle.size) });
      if (slogan) {
        sb.forEach((b, i) => M.highlight(ctx, span(t, 2.45 + i * 0.06, 2.65 + i * 0.06), b, slogan.size, P.hl, rtl));
        kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.ink, key: P.ink, each: M.writer(t, sSlogan, slogan.size) });
      }
      ctx.restore();
    },
  };
}
