// The Parts Apart ending: the device starts apart and closes into one object, bottom part first, the lid landing last. The brand's
// logo is printed onto the lid in the accent, seen in the same turning view, and the name settles under the object, then the handle
// on a hairline in the mono face, then the slogan in grey. The view keeps turning slowly to the last frame. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, M0 = T.model;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW, minScale: 0.9, minPx: 40, where: 'the slogan' }) : null;
  const dev = M.makeDevice(pal, { kinds: ['base', 'cell', 'board', 'frame', 'lid'], chip: true, seed: 5, logo: brand.logo }), n = dev.layers.length;
  const s = 0.9, cx = W / 2, cy = 740;
  const yName = 975, yRule = yName + name.lead / 2 + 4, yHandle = yRule + 24 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const land = (i) => 0.2 + i * 0.22;          // bottom first, the lid last at about 1.3 s
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const P = M.view(M0.theta + M0.turn * t, s, cx, cy, M0.squash);
      const hs = M.heights(dev, 110, (i) => 1 - M.E(span(t, land(i) - 0.35, land(i))));
      M.drawDevice(ctx, dev, P, hs, { logoP: span(t, 1.45, 1.8), logoColor: pal.accent });
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.light,
        each: (w, i, box, c) => { if (M.settle(c, t, 1.7 + i * 0.06, 0.35, d + 1, d + 2) === false) return false; } });
      const rw = Math.min(maxW, handle.width + 160) * M.soft(span(t, 1.95, 2.35));
      ctx.fillStyle = pal.wire; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 2);
      ctx.fillStyle = pal.accent; ctx.fillRect(W / 2 - 4, yRule - 3, 8 * span(t, 2.2, 2.3), 8);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.light,
        each: (w, i, box, c) => { if (M.settle(c, t, 2.1, 0.35, d + 1, d + 2) === false) return false; } });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.grey,
        each: (w, i, box, c) => { if (M.settle(c, t, 2.35 + i * 0.05, 0.35, d + 1, d + 2) === false) return false; } });
    },
  };
}
