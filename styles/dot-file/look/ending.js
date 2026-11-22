// The dot-file ending: the case is closed with a round rubber stamp. An accent disc with a double ring slams down off square, the
// brand's logo reversed out of it, the rubber's wear on its rim and a halftone halo printed around it. The name is printed heavy with
// the accent out of register, the handle is set in paper on an ink chip, the slogan in a soft ink. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, wear = M.wearTile(P.paper, 91);
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: maxW - 60, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 700, maxW, single: true, where: 'the slogan' }) : null;
  const R = 170, cx = W / 2, cy = 520, yName = cy + R * 1.9 + 80, hh = handle.lead + 18, hw = handle.width + 60;
  const yHandle = yName + name.lead / 2 + 24, ySlogan = yHandle + hh + 34 + (slogan ? slogan.lead / 2 : 0);
  const halo = M.dotField(R * 5, R * 5, T.screen.step, 15, P.accent, (x, y) => { const r = Math.hypot(x - R * 2.5, y - R * 2.5) / R; return r < 1.15 ? 0 : Math.max(0, 1 - (r - 1.15) / 0.75) * 0.85; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save();
      if (M.slam(ctx, (t - 0.25) / 0.2, 0, cx, cy, 0.7, -0.14) !== false) {
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(halo, cx - R * 2.5, cy - R * 2.5); ctx.restore();
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.onAccent; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R - 16, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R - 28, 0, Math.PI * 2); ctx.stroke();
        const s = R * 1.05; brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.onAccent);
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.arc(cx, cy, R - 34, 0, Math.PI * 2, true); ctx.clip();
        ctx.fillStyle = ctx.createPattern(wear, 'repeat'); ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore();
      }
      ctx.restore();
      M.misprint(kit, ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', each: M.slamWord(t, (j) => 0.9 + j * 0.12, 0) }, P, ground.reg);
      ctx.save();
      if (M.slam(ctx, (t - 1.45) / 0.16, 0, W / 2, yHandle + hh / 2, 0.3) !== false) {
        M.chip(ctx, W / 2 - hw / 2, yHandle, hw, hh, P, rtl);
        kit.drawText(ctx, handle, { x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y: yHandle + hh / 2, color: P.onInk });
      }
      ctx.restore();
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft, each: M.slamWord(t, (j) => 1.8 + j * 0.1, 0, 0.25) });
    },
  };
}
