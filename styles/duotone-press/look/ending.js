// The duotone-press ending: a last pull. Under the leaf, a landscape in the two inks fills the window and the brand's logo is knocked
// out in paper from a square of its shadow tones; the name is printed in the dark ink below, then the handle in the mono face and the
// slogan in grey. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const win = { x: SAFE.left, y: T.photo.y, w: maxW, h: 640 }, L = 240, lx = W / 2 - L / 2, ly = win.y + win.h - L / 2 - 10;
  const yName = ly + L + 40 + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 4 + (slogan ? slogan.lead / 2 : 0);
  const ph = M.photo('land', Math.round(win.w * T.photo.res), Math.round(win.h * T.photo.res), 5);
  const rich = M.print(ph, ground.LUT.rich), shadow = M.print(ph, ground.LUT.shadow);
  const pl = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: maxW + 40, h: (slogan ? ySlogan + slogan.height / 2 : yHandle + handle.lead / 2) + 30 - win.y + 20 }, rtl);
  const dur = T.dur.peel * 1.5, o = { pl, t0: -0.3, dur, P, T, x0: SAFE.left, x1: SAFE.right, align: 'center' };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s = M.pull(pl, t, -0.3, dur);
      ctx.save(); pl.clip(ctx, s); M.framed(ctx, rich, win, T.photo.push * span(t, 0, d));
      ctx.fillStyle = P.paper; ctx.fillRect(lx - 12, ly - 12, L + 24, L + 24);
      ctx.drawImage(shadow, shadow.width * 0.3, shadow.height * 0.4, shadow.height * 0.5, shadow.height * 0.5, lx, ly, L, L);
      brand.logo.draw(ctx, lx + L * 0.17, ly + L * 0.17, L * 0.66, P.paper);
      ctx.restore();
      M.press(ctx, kit, name, { ...o, t, y: yName });
      M.press(ctx, kit, handle, { ...o, t, y: yHandle, color: P.grey });
      if (slogan) M.press(ctx, kit, slogan, { ...o, t, y: ySlogan, color: P.grey });
      pl.flap(ctx, s, P.back, 340);
    },
  };
}
