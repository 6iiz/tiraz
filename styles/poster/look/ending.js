// The poster ending: a sunburst of accent wedges bursts open around a turned square of paper, the logo is stamped into the square, the
// name is thrown in on a turned band of the accent, and the handle and slogan settle level on the ground below. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl, tilt = T.tilt;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: 780, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 700, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, S = 300, bandH = name.lead + 60, yBand = cy + S / 2 + 150;
  const yHandle = yBand + bandH / 2 + 80, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const n = 12;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      // the burst: n wedges open from the centre and keep turning slowly
      const pb = M.E(span(t, 0.1, 0.8));
      if (pb > 0) {
        const turn = t * 6 * (rtl ? 1 : -1);
        for (let i = 0; i < n; i += 2) M.wedge(ctx, cx, cy, (i / n) * 360 + turn, (i / n) * 360 + turn + (360 / n) * pb, 440 * pb, i % 4 ? pal.wedge : pal.accent);
      }
      M.block(ctx, cx, cy, tilt * 1.5, span(t, 0.3, 0.3 + T.dur.slam), 0, (off) => {
        ctx.fillStyle = pal.paper; ctx.fillRect(-S / 2, -S / 2, S, S);
        const st = M.E(span(t, 0.9, 1.15));
        if (st > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, st * 2); const s = S * 0.7 * (1.25 - 0.25 * st); brand.logo.draw(ctx, -s / 2, -s / 2, s, pal.onPaper); ctx.restore(); }
      }, 600);
      M.block(ctx, cx, yBand, tilt, span(t, 1.1, 1.1 + T.dur.slam), 0, (off) => {
        ctx.fillStyle = pal.accent; ctx.fillRect(-W, -bandH / 2, W * 2, bandH);
        if (off < M.SETTLE) kit.drawText(ctx, name, { x0: -name.width / 2, x1: name.width / 2, y: 0, color: pal.onAccent });
      }, -900);
      const rise = (t0, size) => (w, i, box, c) => { if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size) === false) return false; };
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: pal.text, each: rise(1.5, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: pal.keyText, each: rise(1.7, slogan.size) });
    },
  };
}
