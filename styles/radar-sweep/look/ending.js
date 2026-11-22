// The Radar Sweep ending: the search ends on the brand. A ping finds the logo high on the scope as a bright return; the accent lock
// closes on it and a bearing line joins it to the centre. Then a second ping finds the name, the handle (mono) and the slogan under it.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, minPx: T.minPx, where: 'the slogan' }) : null;
  const S = 240, lx = W / 2 - S / 2, ly = 320;
  const yName = ly + S + 60 + name.lead / 2, yHandle = yName - name.lead / 2 + name.height + 4 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0);
  const bottom = (slogan ? ySlogan + slogan.lead / 2 : yHandle + handle.lead / 2);
  const dist = (p) => Math.hypot(p.x - ground.cx, p.y - ground.cy);
  const dLogo = dist({ x: W / 2, y: ly + S / 2 }), speed = T.dur.speed * 0.9, t0 = 0.05, t1 = 1.0;
  const D = (f, y) => M.wordCentres(f, { x0, x1, y, align: 'center', rtl }).map(dist);
  const dName = D(name, yName), dHandle = D(handle, yHandle), dSlogan = slogan ? D(slogan, ySlogan) : [];
  const quiet = [{ y0: ly - 30, y1: bottom + 10, a: 0.7 }];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, quiet);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t0, speed), dLogo + 300);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t1, speed), dLogo + 300);
      const r = M.ret(t, t0, speed, dLogo, 0.45);
      if (r.on) {
        const hit = r.hit, pb = M.outC(span(t, hit + 0.1, hit + 0.5));
        if (pb > 0) {                                                   // the bearing line from the centre up toward the contact (it stops under the words)
          ctx.save(); ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.globalAlpha = 0.8;
          const yEnd = bottom + 40; ctx.beginPath(); ctx.moveTo(ground.cx, ground.cy); ctx.lineTo(ground.cx, ground.cy + (yEnd - ground.cy) * pb); ctx.stroke(); ctx.restore();
        }
        ctx.save(); if (r.flare > 0.02) { ctx.shadowColor = pal.light; ctx.shadowBlur = 50 * r.flare; }
        brand.logo.draw(ctx, lx, ly, S, pal.echo); ctx.restore();
        M.lock(ctx, pal, lx - 6, ly - 6, S + 12, S + 12, span(t, hit + 0.15, hit + 0.5));
      }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: pal.echo, each: (w, i, b, c) => M.echo(c, M.ret(t, t1, speed, dName[i]), pal.echo, pal) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.soft, each: (w, i, b, c) => M.echo(c, M.ret(t, t1 + 0.15, speed, dHandle[i]), pal.soft, pal) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.target, each: (w, i, b, c) => M.echo(c, M.ret(t, t1 + 0.3, speed, dSlogan[i]), pal.target, pal) });
    },
  };
}
