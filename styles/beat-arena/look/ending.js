// The beat-arena ending, the prize round: on the sunburst set the logo pops in on a big round paper badge, then the brand's name
// stamps in on a paper card, the handle on the ink banner and the slogan on an accent sticker, one per beat. Both contestants jump
// together, arms up, for the rest of the ending, and the badge nods on every bar. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, set: 'burst' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 140;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  '), { size: T.size.slogan, weight: 800, maxW, single: true, where: 'the slogan' }) : null;
  const R = 160, cy = 500;
  const nW = name.width + 110, nH = name.height + 26, nY = cy + R + 60;
  const hW = handle.width + 70, hH = handle.height + 14, hY = nY + nH + 40;
  const sRun = slogan ? { x0: W / 2 - slogan.width / 2, x1: W / 2 + slogan.width / 2, y: hY + hH + 46 + slogan.lead / 2 } : null;
  const b = T.beat;
  const at = (i) => 0.15 + i * b;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { cheer: t > at(3) });
      const s0 = M.pop(span(t, at(0), at(0) + T.dur.pop)) * M.nod(t, at(4), b);
      if (s0 > 0) {
        M.burst(ctx, W / 2, cy, R, R, span(t, at(0) + 0.05, at(0) + 0.45), pal.ink, 18);
        ctx.save(); M.around(ctx, W / 2, cy, s0);
        ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(W / 2 + 10, cy + 18, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pal.paper; ctx.strokeStyle = pal.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        brand.logo.draw(ctx, W / 2 - R * 0.62, cy - R * 0.62, R * 1.24, pal.ink);
        ctx.restore();
      }
      const s1 = M.pop(span(t, at(1), at(1) + T.dur.pop));
      if (s1 > 0) {
        ctx.save(); M.around(ctx, W / 2, nY + nH / 2, s1);
        M.card(ctx, W / 2 - nW / 2, nY, nW, nH, pal.paper, pal.ink, T);
        kit.drawText(ctx, name, { x0: W / 2 - nW / 2, x1: W / 2 + nW / 2, y: nY + 13 + name.lead / 2, align: 'center', color: pal.ink });
        ctx.restore();
      }
      const s2 = M.pop(span(t, at(2), at(2) + T.dur.pop));
      if (s2 > 0) {
        ctx.save(); M.around(ctx, W / 2, hY + hH / 2, s2);
        M.ribbon(ctx, W / 2 - hW / 2, hY, hW, hH, pal);
        kit.drawText(ctx, handle, { x0: W / 2 - hW / 2, x1: W / 2 + hW / 2, y: hY + 7 + handle.lead / 2, align: 'center', color: pal.paper });
        ctx.restore();
      }
      if (slogan) {
        const s3 = M.pop(span(t, at(3), at(3) + T.dur.pop));
        if (s3 > 0) {
          const sw = slogan.width + 80, sh = slogan.lead + 6;
          ctx.save(); M.around(ctx, W / 2, sRun.y, s3 * M.nod(t, at(5), b));
          M.card(ctx, W / 2 - sw / 2, sRun.y - sh / 2, sw, sh, pal.accent, pal.ink, T, { r: sh * 0.3, stroke: 6, shadow: 9 });
          kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: sRun.y, align: 'center', color: pal.onAccent });
          ctx.restore();
        }
      }
    },
  };
}
