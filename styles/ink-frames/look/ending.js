// The ink-frames ending: a chapter title page. One tall panel is inked, focus lines rush in from its edges toward a clear centre, the
// logo is stamped in a framed square, the brand's name is lettered as a sound effect, the handle drops in a narration box and the
// slogan is stamped on word by word. A thin panel of speed lines runs under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: X1 - X0 - 60, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: X1 - X0 - 120, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: X1 - X0 - 40, minScale: 0.88, where: 'the slogan' }) : null;
  const S = 250, ly = 330, yName = ly + S + 40 + name.lead / 2;
  const hw = handle.width + 60, hh = handle.lead + 20, hy = yName + name.lead / 2 + 20;
  const ySlogan = hy + hh + 34 + (slogan ? slogan.lead / 2 : 0);
  const bottom = slogan ? ySlogan + slogan.height - slogan.lead / 2 : hy + hh;
  const cy = (ly + bottom) / 2;
  const [p0, p1] = M.page(W, H, [{ y: Math.max(1300, bottom + 70), slope: -0.03 }]);
  const lines = M.focus(W, H, W / 2, cy, Math.max(name.width, slogan ? slogan.width : 0, S) / 2 + 80, (bottom - ly) / 2 + 80, 200, 45, P.ink);
  const rush = M.speed(W, 700, 70, 12, P.ink);
  const toneLow = M.tone(W, 700, T.tone.cell, (u, v) => 0.06 + 0.3 * v, P.ink);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.camera(ctx, W, H, span(t, 0, d) * 0.6);
      const i0 = span(t, 0, T.dur.ink + 0.08), i1 = 1;
      M.panel(ctx, p1, i1, P.ink, i1 > 0.5 ? () => { ctx.drawImage(toneLow, 0, 1250); ctx.drawImage(rush, 0, 1250); } : null);
      M.panel(ctx, p0, i0, P.ink, () => {
        const f = M.SNAP(span(t, 0.15, 0.5));
        if (f <= 0) return;
        const s = 1 + 0.7 * (1 - f);
        ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s); ctx.translate(-W / 2, -cy); ctx.drawImage(lines, 0, 0); ctx.restore();
      });
      ctx.save();
      if (M.stamp(ctx, span(t, 0.45, 0.45 + T.dur.stamp), W / 2, ly + S / 2, 0.3) !== false) {
        M.box(ctx, W / 2 - S / 2, ly, S, S, P, 8);
        ctx.fillStyle = P.accent; ctx.fillRect(W / 2 - S / 2 + 16, ly + S - 30, S - 32, 14);
        brand.logo.draw(ctx, W / 2 - S * 0.33, ly + S * 0.13, S * 0.66, P.ink);
      }
      ctx.restore();
      const pn = span(t, 0.85, 0.85 + T.dur.stamp);
      kit.drawText(ctx, name, { x0: X0, x1: X1, y: yName, align: 'center', color: P.accent, key: P.accent,
        each: (w, i, b, c) => { if (M.stamp(c, pn, W / 2, yName, 0.4) === false) return false; return M.sfx(c, w, b, name.size, P); } });
      ctx.save();
      if (M.stamp(ctx, span(t, 1.25, 1.25 + T.dur.stamp), W / 2, hy, 0.12) !== false) {
        M.box(ctx, W / 2 - hw / 2, hy, hw, hh, P);
        kit.drawText(ctx, handle, { x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y: hy + hh / 2, align: 'center', color: P.ink });
      }
      ctx.restore();
      if (slogan) kit.drawText(ctx, slogan, { x0: X0, x1: X1, y: ySlogan, align: 'center', color: P.ink,
        each: (w, i, b, c) => M.stamp(c, span(t, 1.5 + i * 0.09, 1.5 + i * 0.09 + T.dur.stamp), b.x + b.width / 2, b.y, 0.2) });
      ctx.restore();
    },
  };
}
