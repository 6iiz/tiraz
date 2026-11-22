// The history strip's last panel: a round paper medal with the brand's logo printed on it is slapped onto the map and pinned, the
// name is slapped under it on a banner of ink, and a narration caption with the handle and the slogan follows. The card puppet at
// the foot of the panel waves (held poses) to the end. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, G = ground.stage;
  const maxW = SAFE.right - SAFE.left - 140;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const sl = brand.slogan?.length ? brand.slogan.reduce((a, b) => a + (/[\p{P}]$/u.test(a) ? ' ' : '، ') + b) : null;
  const slogan = sl ? kit.fit(sl, { size: T.size.slogan, weight: 700, maxW, minScale: 0.7, where: 'the slogan' }) : null;
  const cx = W / 2, my = 450, R = 125;
  const medal = new Path2D(); medal.arc(0, 0, R, 0, Math.PI * 2);
  const bw = name.width + 120, bh = name.size * 1.55, yName = my + R + 60 + bh / 2, banner = M.torn(bw, bh, 21, 6);
  const cw = Math.max(handle.width, slogan ? slogan.width : 0) + 70, chh = handle.lead + (slogan ? slogan.height : 0) + 30;
  const yCap = yName + bh / 2 + 34 + chh / 2, cap = M.torn(cw, chh, 22, 3);
  const px = rtl ? SAFE.left + 100 : SAFE.right - 100, py = G.y + G.h - 10, face = rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const h = M.held(t + clock), wave = t > 0.3;
      M.puppet(ctx, px, py, 0.6, { arm: [wave ? [2.3, 2.8][h % 2] : 0.2, 0.1], head: wave ? [0.05, -0.05][h % 2] : 0, mouth: wave && h % 3 === 0 }, P, { face });
      M.slapped(ctx, span(t, 0.1, 0.1 + T.dur.slap), cx, my, (s) => {
        M.paper(ctx, medal, P.paper, P, { shadow: s, edge: P.ink, edgeW: 6 });
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 14, 0, Math.PI * 2); ctx.stroke();
        brand.logo.draw(ctx, -R * 0.58, -R * 0.58, R * 1.16, P.ink);
        M.pin(ctx, 0, -R + 4, P, 12);
      });
      M.slapped(ctx, span(t, 0.55, 0.55 + T.dur.slap), cx, yName, (s) => {
        ctx.rotate(-0.02); M.paper(ctx, banner, P.ink, P, { shadow: s });
        kit.drawText(ctx, name, { x0: -bw / 2, x1: bw / 2, y: 4, align: 'center', color: P.paper });
      });
      M.slapped(ctx, span(t, 0.95, 0.95 + T.dur.slap), cx, yCap, (s) => {
        M.paper(ctx, cap, P.caption, P, { shadow: s, edge: P.ink });
        const y0 = -chh / 2 + 15 + handle.lead / 2;
        kit.drawText(ctx, handle, { x0: -cw / 2, x1: cw / 2, y: y0, align: 'center', color: P.ink });
        if (slogan) kit.drawText(ctx, slogan, { x0: -cw / 2 + 30, x1: cw / 2 - 30, y: y0 + handle.lead / 2 + slogan.lead / 2, align: 'center', color: P.ink });
      });
    },
  };
}
