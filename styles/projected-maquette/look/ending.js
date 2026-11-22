// The Projected Maquette ending: the data light on the table goes out, the projector strikes one last slide on the dark wall above
// the model (a soft pool of light with the brand's logo in it), the name, handle and slogan switch on beneath it, and then the house
// lights come up on the white model: lights up is where the film ends. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 700, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the slogan' }) : null;
  const S = 200, lx = W / 2 - S / 2, ly = 330;
  const yName = ly + S + 60 + name.lead / 2, yHandle = yName + name.lead / 2 + 12 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const slide = 0.55;
  const sw = (t, t0, size, col, glow) => (w, i, box, c) => M.strike(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.strike), 0, col, pal.dark, size, glow);
  return {
    duration: d,
    draw(ctx, t) {
      const off = 1 - M.E(span(t, 0, 0.45)), house = T.house + (1 - T.house) * M.soft(span(t, 1.6, 2.8)) * 0.85;
      ground.draw(ctx, t, { lit: off > 0 ? () => [pal.accent, 0.6 * off] : null, house });
      // the slide: a soft pool of projected light, struck like a lamp (on, off, on), then the logo inside it pulls into focus
      const p = span(t, slide, slide + 0.35);
      if (p > 0.16 && !(p > 0.3 && p < 0.4)) {
        const up = p < 0.3 ? 0.45 : 0.55 + 0.45 * M.E((p - 0.4) / 0.6), pad = 60;
        ctx.save();
        const g = ctx.createRadialGradient(W / 2, ly + S / 2, S * 0.3, W / 2, ly + S / 2, S * 0.5 + pad * 1.6);
        g.addColorStop(0, rgba(pal.beam, 0.16 * up)); g.addColorStop(1, rgba(pal.beam, 0));
        ctx.fillStyle = g; ctx.fillRect(lx - pad * 2, ly - pad * 2, S + pad * 4, S + pad * 4);
        ctx.shadowColor = rgba(pal.accent, 0.6 * up); ctx.shadowBlur = 40;
        const blur = (1 - M.E((p - 0.3) / 0.7)) * 6; if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
        brand.logo.draw(ctx, lx, ly, S, pal.light);
        ctx.restore();
      }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: pal.light, each: sw(t, slide + 0.3, name.size, pal.light, rgba(pal.accent, 0.3)) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.key, each: sw(t, slide + 0.55, handle.size, pal.key, null) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.grey, each: sw(t, slide + 0.75, slogan.size, pal.grey, null) });
    },
  };
}
