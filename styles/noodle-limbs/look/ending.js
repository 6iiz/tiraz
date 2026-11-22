// The cartoon's ending: the closing medallion of the old shorts. Concentric rings (ink, accent, ink) pop onto the stage one after another
// on the beat, a light disc in the middle stamps the brand's logo in ink, then the name pops up on a title card under it, word by word,
// the handle in the mono face and the slogan in grey. The ink-drop fellow waves goodbye below. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const cx0 = SAFE.left + 4, cx1 = SAFE.right - 4, x0 = cx0 + 60, x1 = cx1 - 60;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: x1 - x0, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: x1 - x0, minScale: 0.9, where: 'the slogan' }) : null;
  const mx = W / 2, my = 520, R = 230;
  const top = my + R + 50, yName = top + 50 + name.lead / 2, yHandle = yName + name.lead / 2 + 14 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0), bot = (slogan ? ySlogan + slogan.height - slogan.lead / 2 : yHandle + handle.lead / 2) + 44;
  const rings = [[R, P.ink], [R - 26, P.accent], [R - 60, P.ink], [R - 74, P.card]];
  const pop = (tt, t0, size) => (w, i, box, c) => { if (M.popAt(c, span(tt, t0 + i * 0.08, t0 + i * 0.08 + T.pop.word), box.x + box.width / 2, box.y + size * 0.5) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      M.fellow(ctx, P, W / 2, T.stage.fellowY, T.stage.fellowS, tt + clock, T.beat, tt > 1.3 ? 'wave' : 'cheer');
      // rays behind the medallion
      if (tt > 0.4) { ctx.save(); ctx.translate(mx, my); ctx.rotate(-tt * 0.15); ctx.fillStyle = P.wash2;
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R + 140, a, a + Math.PI / 22); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      rings.forEach(([r, c], k) => {
        const p = span(tt, 0.05 + k * 0.12, 0.05 + k * 0.12 + T.pop.card); if (p <= 0) return;
        ctx.save(); M.popAt(ctx, p, mx, my); ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.restore();
      });
      const pl = span(tt, 0.85, 0.85 + T.pop.word * 1.4);
      if (pl > 0) { ctx.save(); M.popAt(ctx, pl, mx, my + 90); const s = (R - 74) * 1.25; brand.logo.draw(ctx, mx - s / 2, my - s / 2, s, P.ink); ctx.restore(); }
      const pc = span(tt, 1.3, 1.3 + T.pop.card); if (pc <= 0) return;
      ctx.save(); M.popAt(ctx, pc, W / 2, bot);
      M.card(ctx, P, cx0, top, cx1, bot);
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.ink, key: P.ink, each: pop(tt, 1.45, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.ink, key: P.ink, each: pop(tt, 1.85, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.grey, key: P.grey, each: pop(tt, 2.05, slogan.size) });
      ctx.restore();
    },
  };
}
