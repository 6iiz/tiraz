// The test card's ending: the logo, the brand name and the handle, centred. spec: { duration }
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, clock });
  const name = kit.fit(brand.name, { size: 96, maxW: 800, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: brand.fonts.mono.family, size: 48, maxW: 700, single: true, where: 'the handle' });
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      brand.logo.draw(ctx, W / 2 - 150, 480, 300, brand.colors.text);
      kit.drawText(ctx, name, { x0: 100, x1: W - 100, y: 900 });
      kit.drawText(ctx, handle, { x0: 100, x1: W - 100, y: 1030, color: brand.colors.accent });
    },
  };
}
