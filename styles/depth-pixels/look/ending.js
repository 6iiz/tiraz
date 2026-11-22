// The Depth Pixels ending: the brand's logo is rebuilt from lit cubes. They fall into place row by row from the bottom up, a lamp
// swells behind them and flares once as the last row lands, and the sign hangs in the focus band, floating a little. The glass plate
// rises under it with the name, the handle in the mono face (metal tone) and the slogan. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const N = T.logo.cells, s = T.logo.cube, cells = M.logoGrid(brand, N), size = N * s;
  const pw = SAFE.right - SAFE.left, pad = 48, inner = pw - 2 * pad;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: inner, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: 44, maxW: inner, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW: inner, minPx: 44, where: 'the slogan' }) : null;
  const ph = name.height + handle.height + (slogan ? slogan.height : 0) + 2 * pad - 30;
  const ly = SAFE.top + 40, py = Math.min(ly + size + 90, SAFE.bottom - ph), lx = W / 2 - size / 2;
  const yName = py + pad - 15 + name.lead / 2, yHandle = py + pad - 15 + name.height + handle.lead / 2, ySlogan = py + pad - 15 + name.height + handle.height + (slogan ? slogan.lead / 2 : 0);
  const land = 0.25 + (N - 1) * 0.035 + 0.45;
  const words = (t, t0, f) => (w, i, box, c) => M.rise(c, span(t, t0 + i * 0.07, t0 + 0.32 + i * 0.07), f.size);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const flare = Math.max(0, 1 - Math.abs(t - land) / 0.6), bob = Math.sin((t + clock) * 1.2) * 6;
      M.bloom(ctx, ground.lampGlow, W / 2, ly + size / 2 + bob, 380 + 220 * flare, (0.45 + 0.45 * flare) * M.out3(span(t, 0, 0.6)));
      M.cubes(ctx, cells, lx, ly + bob, s, P, (r) => {                         // rows land from the bottom up
        const t0 = 0.25 + (N - 1 - r) * 0.035, p = span(t, t0, t0 + 0.45); if (p <= 0) return null; return -(1 - M.out3(p)) * 220;
      });
      const pin = M.out3(span(t, land - 0.1, land + 0.3));
      if (pin <= 0) return;
      ctx.save(); ctx.translate(0, (1 - pin) * 30);
      M.plate(ctx, SAFE.left, py, pw, ph, P, pin);
      kit.drawText(ctx, name, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yName, align: 'center', color: P.l, key: P.l, each: words(t, land, name) });
      kit.drawText(ctx, handle, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yHandle, align: 'center', color: P.metal, key: P.metal, each: words(t, land + 0.35, handle) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: ySlogan, align: 'center', color: P.l, key: P.l, each: words(t, land + 0.55, slogan) });
      ctx.restore();
    },
  };
}
