// The gas-glow ending: the brand's own sign. The logo hangs as one bent tube following the outline of its shape (clear glass at
// first); the transformer clunks, the logo strikes in the accent gas, then the name's segments are switched on in the plain gas, one
// after another from the reading side. The handle and the slogan are painted on the panel and come up as the light reaches them.
// spec: { duration }
import { need, span, SAFE, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the slogan' }) : null;
  const L = 230, block = L + 50 + name.lead + handle.lead + (slogan ? slogan.height + 10 : 0), top = kit.place(block, 690);
  const yLogo = top, yName = top + L + 50 + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const nameSign = M.sign(name, { x0, x1, y: yName, align: 'center' }, pal, rtl, { tube: 'main' });
  const handleSign = M.sign(handle, { x0, x1, y: yHandle, align: 'center' }, pal, rtl, { painted: true });
  const sloganSign = slogan ? M.sign(slogan, { x0, x1, y: ySlogan, align: 'center' }, pal, rtl, { painted: true }) : null;
  // the logo as a tube: its outline stroked; glass and lit versions are painted once
  const pad = 60, S = L + pad * 2, lx = W / 2 - L / 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = S; c.height = S; return [c, c.getContext('2d')]; };
  const [glass, g] = mk(), [lit, l] = mk();
  const shape = (c, stroke, wdt, filter) => {
    c.save(); c.filter = filter ?? 'none';
    if (brand.logo.path) { const p = new Path2D(brand.logo.path), k = L / (brand.logo.box || 256); c.translate(pad, pad); c.scale(k, k); c.lineJoin = 'round'; c.strokeStyle = stroke; c.lineWidth = wdt / k; c.stroke(p); }
    else brand.logo.draw(c, pad, pad, L, stroke);
    c.restore();
  };
  shape(g, pal.glassHi, 12); shape(g, pal.glass, 7);
  shape(l, rgba(pal.key.glow, 0.8), 20, 'blur(26px)'); shape(l, pal.key.tube, 13, 'blur(4px)'); shape(l, pal.key.core, 5);
  const nw = nameSign.words.length, step = nw <= 1 ? 0 : Math.min(T.dur.step, 0.5 / (nw - 1));
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, lp = span(t, 0.25, 0.7), lb = M.strike(lp, 11) * M.hum(time, 2);
      const power = Math.min(1, lb * 0.5 + span(t, 0.8, 1.4) * 0.5);
      ground.draw(ctx, t, { power });
      ground.spill(ctx, W / 2, yLogo + L / 2, 520, 420, pal.key.glow, lb);
      ground.spill(ctx, W / 2, yName, 560, 200, pal.main.glow, span(t, 0.8, 1.3));
      ctx.drawImage(glass, lx - pad, yLogo - pad);
      if (lb > 0) { const h = S * M.E(Math.min(1, lp * 1.4)); if (h >= 1) { ctx.save(); ctx.globalAlpha = lb; ctx.drawImage(lit, 0, 0, S, h, lx - pad, yLogo - pad, S, h); ctx.restore(); } }
      nameSign.draw(ctx, (i) => { const q = M.sequence(t, 0.8, step, T.dur.strike, i, 2); q.b *= M.hum(time, i); return q; }); nameSign.rec(kit);
      ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * span(t, 1.1, 1.5); handleSign.draw(ctx, () => null); ctx.restore(); handleSign.rec(kit);
      if (sloganSign) { ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * span(t, 1.3, 1.7); sloganSign.draw(ctx, () => null); ctx.restore(); sloganSign.rec(kit); }
      ground.glass(ctx, t);
    },
  };
}
