// The clear-showcase ending: the hero slab turns slowly into view with the brand's logo set inside it on its middle plane, comes to
// rest, and the sweep crosses behind it once, lighting it through. The name comes into focus under it, then the slogan and the handle;
// the caustic on the floor brightens as the comet completes its turn. spec: { duration }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: -1000 });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW: x1 - x0, single: true, where: 'the brand name' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minPx: 44, where: 'the slogan' }) : null;
  const handle = kit.fit(brand.handle, { family: mono, weight: 400, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const cy = 520, yName = 830 + name.lead / 2, ySlogan = yName + name.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const yHandle = (slogan ? ySlogan + slogan.lead / 2 : yName + name.lead / 2) + 30 + handle.lead / 2;
  const logo = (ctx, size) => { const s = size * 0.4; brand.logo.draw(ctx, -s / 2, -s / 2, s, P.light); };
  const fade = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * 0.05; if (M.arrive(c, span(t, s, s + 0.5), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const turn = M.IO(span(t, 0, 1.4)), sw = span(t, 1.3, 2.5), sweep = sw > 0 && sw < 1 ? lerp(-260, W + 260, M.IO(sw)) : null;
      const full = span(t, 0.2, 1.4);
      M.caustic(ctx, P, W / 2, cy + 250, 460, 0.3 + 0.7 * full);
      M.slab(ctx, P, { cx: W / 2, cy: cy + 40 * (1 - turn), size: 330, yaw: lerp(1.25, 0.18, turn) + 0.04 * Math.sin(t * 0.8), pitch: lerp(0.7, 0.3, turn),
        energy: 0.9, phase: -Math.PI / 2 + full * Math.PI * 2, sweep, inner: logo, alpha: Math.min(1, t * 4 + 0.2) });
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.light, each: fade(t, 1.0, name.size) });
      M.hairline(ctx, P, W / 2 - 160, W / 2 + 160, yName + name.lead / 2 - 4, M.IO(span(t, 1.4, 1.9)));
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.grey, each: fade(t, 1.5, slogan.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.grey, each: fade(t, 1.8, handle.size) });
    },
  };
}
