// The Bag Scan ending: the last case is pulled in and stops. Inside it the brand's logo is the one dense object (the darker colour on
// an accent body); the operator snaps the selection onto it, then the name comes up under it at full penetration. The handle (mono) and
// the slogan are printed on the case's tag under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: maxW - 40, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: maxW - 40, minPx: T.minPx, where: 'the slogan' }) : null;
  const S = 250, top = 330, hBox = 40 + S + 30 + name.height + 40;
  const box = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h: hBox }, shell = M.bag(box.w, box.h, pal, 9);
  const lx = W / 2 - S / 2, ly = top + 40, yName = ly + S + 30 + name.lead / 2;
  const tagY = top + hBox + 70, tagH = handle.height + (slogan ? slogan.height + 6 : 0) + 44;
  const yHandle = tagY + 22 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx);
      const off = M.belt(t, 0, 0.8, Infinity, W, ground.dir), running = Math.min(1, Math.abs(off) / 60);
      ctx.save(); ctx.beginPath();
      ctx.rect(rtl ? 0 : ground.sensorX, ground.top, rtl ? ground.sensorX : W - ground.sensorX, ground.bottomY - ground.top); ctx.clip();
      ground.items(ctx, off); ctx.translate(off, 0);
      ctx.drawImage(shell.cv, box.x - shell.pad, box.y - shell.pad);
      ctx.fillStyle = pal.organic2; ctx.beginPath(); ctx.roundRect(lx - 16, ly - 16, S + 32, S + 32, 24); ctx.fill();   // the body the logo sits in
      brand.logo.draw(ctx, lx, ly, S, pal.metal);
      const ps = span(t, 0.95, 1.25);
      M.select(ctx, pal, lx - 30, ly - 30, S + 60, S + 60, ps, t);
      const pn = M.outC(span(t, 1.2, 1.5));
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', decor: Math.abs(off) > 1, color: pal.ink, each: (w, i, b, c) => { if (pn <= 0) return false; c.globalAlpha = pn; } });
      // the tag hanging from the case: a dark label strip with the handle and slogan in the light colour
      const pt = M.outC(span(t, 1.6, 1.9));
      if (pt > 0) {
        ctx.fillStyle = pal.metal; ctx.fillRect(W / 2 - 2, top + hBox, 4, 70 * pt);
        ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.roundRect(SAFE.left + 40, tagY, (SAFE.right - SAFE.left - 80), tagH * pt, 14); ctx.fill();
        if (pt > 0.95) {
          kit.drawText(ctx, handle, { x0: x0 + 20, x1: x1 - 20, y: yHandle, align: 'center', color: pal.light });
          if (slogan) kit.drawText(ctx, slogan, { x0: x0 + 20, x1: x1 - 20, y: ySlogan, align: 'center', color: pal.organic2 });
        }
      }
      ctx.restore();
      ground.sensor(ctx, running);
    },
  };
}
