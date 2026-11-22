// The buddy-screen ending: the window becomes the product's about panel. The brand's logo sits on an accent tile in the middle, the
// name and the slogan under it, the handle on a pill. The recorder eases back out to the whole window; the pixel buddy jumps up onto the
// logo tile and waves, and the cursor clicks the handle pill. spec: { duration }
import { need, span, rr } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, B = M.buddy(P, T.px), c = M.content();
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, maxW = c.x1 - c.x0 - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: 600, single: true, where: 'the handle' });
  const tile = 230, ty = c.y0 + 150, yName = ty + tile + 50 + name.lead / 2, ySlogan = yName + name.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const pw = handle.width + 70, ph = handle.lead + 24, py = (slogan ? ySlogan + slogan.lead / 2 : yName + name.lead / 2) + 40;
  const cx = W / 2, stops = [{ t: 0, x: rtl ? c.x0 + 60 : c.x1 - 60, y: c.y1 + 30 }, { t: 0.95, x: cx, y: ty, how: 'jump', height: 220, dur: 0.42 }];
  const path = [{ t: 0, x: W - 80, y: 1290 }, { t: 1.6, x: cx + pw / 2 - 30, y: py + ph / 2 + 10 }];
  const click = 1.75;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.zoom(ctx, W, H, 1.06 - 0.06 * M.IO(span(t, 0, 1.2)), W / 2, 720);
      M.windowFrame(ctx, P, brand, rtl, t + clock, 0);
      const tp = M.E(span(t, 0.15, 0.45)), s = tile * (0.6 + 0.4 * tp);
      if (tp > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, tp * 3); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
        ctx.fillStyle = P.accent; rr(ctx, cx - s / 2, ty + tile - s, s, s, s * 0.24); ctx.fill(); ctx.restore();
        ctx.save(); ctx.globalAlpha = Math.min(1, tp * 3); brand.logo.draw(ctx, cx - s * 0.32, ty + tile - s / 2 - s * 0.32, s * 0.64, P.onAccent); ctx.restore();
      }
      const ap = span(t, 0.35, 0.47);
      if (ap > 0) {
        ctx.save(); ctx.globalAlpha = ap;
        kit.drawText(ctx, name, { x0: c.x0, x1: c.x1, y: yName, color: P.ink });
        if (slogan) kit.drawText(ctx, slogan, { x0: c.x0, x1: c.x1, y: ySlogan, color: P.grey });
        const on = t >= click;
        ctx.fillStyle = on ? P.accent : P.chrome; rr(ctx, cx - pw / 2, py, pw, ph, ph / 2); ctx.fill();
        kit.drawText(ctx, handle, { x0: cx - pw / 2, x1: cx + pw / 2, y: py + ph / 2, color: on ? P.onAccent : P.ink });
        ctx.restore();
      }
      const b = M.act(stops, t, 0.42), landed = b.landed < 99;
      if (t > 0.5) M.drawBuddy(ctx, B, P, b, { eyes: landed ? 'happy' : 'open', arms: landed ? (Math.floor(b.landed / 0.2) % 2 ? 'wave' : 'up') : 'down', time: t + clock, flip: rtl });
      M.cursor(ctx, P, path, [click], t);
      ctx.restore();
    },
  };
}
