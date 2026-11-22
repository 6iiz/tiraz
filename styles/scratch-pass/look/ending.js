// The scratch-pass ending: as the camera keeps travelling, one tall slip is carved out of the print in the middle of the frame. The logo is
// set in it (red when red reads on paper, ink otherwise) and engraved with fine paper cuts, the name slides in, a red knife stroke is cut
// under it, then the handle in the mono face and the slogan in grey. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl, pad = T.pad;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = SAFE.right - SAFE.left - 2 * pad.x;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const L = 210, inner = Math.max(name.width, handle.width, slogan ? slogan.width : 0, 420), sw = inner + 2 * pad.x + 40;
  const sh = pad.y * 2 + 40 + L + 50 + name.lead + 30 + handle.lead + (slogan ? slogan.lead : 0);
  const top = Math.max(SAFE.top, (SAFE.top + SAFE.bottom - sh) / 2 - 20), sx0 = W / 2 - sw / 2, sx1 = W / 2 + sw / 2, cx = W / 2;
  const yLogo = top + pad.y + 20, yName = yLogo + L + 50 + name.lead / 2, yKnife = yName + name.size * 0.72;
  const yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const logo = document.createElement('canvas'); logo.width = logo.height = L;
  const g = logo.getContext('2d'); brand.logo.draw(g, 0, 0, L, P.key === P.red ? P.red : P.ink);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = P.ink;
  for (let y = L * 0.5, k = 0; y < L; y += 8, k++) g.fillRect(0, y, L, 1 + k * 0.5);    // engraved: cuts widen toward the foot
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.carve(ctx, sx0, top, sx1, top + sh, span(t, 0, 0.6), P, { pitch: T.pitch, rtl });
      const pl = span(t, 0.5, 0.9);
      if (pl > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, pl * 4); ctx.drawImage(logo, cx - L / 2 + (rtl ? -1 : 1) * -(1 - M.E(pl)) * 60, yLogo); ctx.restore(); }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, each: (w, i, box, c) => M.arrive(c, span(t, 0.85 + i * 0.08, 1.2 + i * 0.08), name.size, rtl) });
      M.knife(ctx, cx - name.width / 2, cx + name.width / 2, yKnife, 12, P.red, span(t, 1.25, 1.55), rtl);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.ink, each: (w, i, box, c) => M.arrive(c, span(t, 1.45, 1.8), handle.size, rtl) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.grey, each: (w, i, box, c) => M.arrive(c, span(t, 1.65 + i * 0.06, 2.0 + i * 0.06), slogan.size, rtl) });
    },
  };
}
