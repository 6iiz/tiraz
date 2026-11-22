// The point-cloud ending: the brand's logo is scanned like everything else. Its returns gather out of scatter behind a scan front and
// condense into the solid mark, in the light colour, and a classification box closes on it. The name follows as a scanned block, then
// the handle in the mono face under a hairline, and the slogan in grey. The cloud keeps turning below. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const X0 = SAFE.left + 10, X1 = SAFE.right - 10, maxW = X1 - X0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: 46, weight: 500, maxW, minScale: 0.95, minPx: 44, where: 'the slogan' }) : null;
  const L = 250, lx = W / 2 - L / 2, ly = 330;
  const yName = ly + L + 70 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 26 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const logoS = Object.assign({ x0: lx - 40, x1: lx + L + 40, top: ly, h: L },
    { pts: M.sample(W, H, { x: lx, y: ly, w: L, h: L }, (c) => brand.logo.draw(c, lx, ly, L, '#ffffff'), 5, 99) });
  const sLogo = M.scanned(logoS, { t0: 0.1, sweep: 0.6, land: 0.35 });
  const aN = { x0: X0, x1: X1, y: yName, align: 'center' };
  const sName = M.scanned(Object.assign(M.sampleText(kit, name, aN, T.step.line), { x0: X0, x1: X1 }), { t0: 0.95, sweep: 0.35, land: T.dur.land });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      sLogo.draw(ctx, t, { text: pal.light, key: pal.light, front: pal.key }, (a, b) => {
        ctx.save(); ctx.beginPath(); ctx.rect(0, a, W, b - a); ctx.clip(); brand.logo.draw(ctx, lx, ly, L, pal.light); ctx.restore();
      }, 3);
      M.bracket(ctx, { x0: lx - 10, x1: lx + L + 10, y: ly + L / 2 - 20 }, L * 0.9, span(t, 0.85, 1.25), pal.accent);
      sName.draw(ctx, t, { text: pal.light, key: pal.light, front: pal.key }, (a, b) => {
        ctx.save(); ctx.beginPath(); ctx.rect(0, a, W, b - a); ctx.clip(); kit.drawText(ctx, name, { ...aN, color: pal.light, key: pal.light }); ctx.restore();
      });
      const rp = M.outC(span(t, 1.45, 1.85)), rw = 420 * rp;
      ctx.fillStyle = pal.accent; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 2);
      const hp = M.outC(span(t, 1.6, 1.95));
      if (hp > 0) { ctx.save(); ctx.globalAlpha = hp; ctx.translate(0, (1 - hp) * 14); kit.drawText(ctx, handle, { x0: X0, x1: X1, y: yHandle, align: 'center', color: pal.light }); ctx.restore(); }
      const sp = M.outC(span(t, 1.85, 2.25));
      if (slogan && sp > 0) { ctx.save(); ctx.globalAlpha = sp; ctx.translate(0, (1 - sp) * 14); kit.drawText(ctx, slogan, { x0: X0, x1: X1, y: ySlogan, align: 'center', color: pal.grey }); ctx.restore(); }
    },
  };
}
