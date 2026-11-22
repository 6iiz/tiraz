// The Ghost Overlay ending: the brand's logo becomes the last window. It rises holding a landscape that is out of register with a
// faint copy of the same landscape printed on the paper around it; the inside slides until both are one picture (the medium's
// moment of register), and the lamps in it brighten. Then the name, the handle and the slogan register in below.
// spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const S = 420, lx = (W - S) / 2, ly = 330;
  const yName = ly + S + 90 + name.lead / 2 - 20, yHandle = yName + name.lead / 2 + 18 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const tex = M.landscape(W + 400, 640, P, 205), texY = ly - 150;
  const soft = document.createElement('canvas'); soft.width = tex.width; soft.height = tex.height;
  { const g = soft.getContext('2d'); g.drawImage(tex, 0, 0); g.globalCompositeOperation = 'destination-in';
    const f = g.createLinearGradient(0, 0, 0, tex.height); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.3, 'rgba(0,0,0,1)'); f.addColorStop(0.7, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(0, 0, tex.width, tex.height); }
  const win = document.createElement('canvas'); win.width = S; win.height = S; const wg = win.getContext('2d');
  const halo = document.createElement('canvas'); halo.width = S + 160; halo.height = S + 160;
  { const h = halo.getContext('2d'); h.filter = 'blur(22px)'; brand.logo.draw(h, 80, 80, S, P.ink); }
  let curT = 0;
  const when0 = (t0) => (i) => [span(curT, t0 + i * 0.06, t0 + i * 0.06 + T.dur.in), 0];
  return {
    duration: d,
    draw(ctx, t) {
      curT = t; ground.draw(ctx, t);
      const drift = -200 + T.drift.inside * t * dir;
      // the faint outer exposure: the same landscape printed pale on the paper, in a band around the logo
      const outer = M.E(span(t, 0, 0.6));
      ctx.save(); ctx.globalAlpha = 0.16 * outer; ctx.drawImage(soft, drift, texY); ctx.restore();
      const rise = span(t, 0.05, 0.75), reg = M.IO(span(t, 0.6, 1.35));
      if (rise > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, rise * 1.6); const lift = (1 - M.E(rise)) * 90;
        ctx.globalAlpha *= 0.22; ctx.drawImage(halo, lx - 80, ly - 80 + lift); ctx.globalAlpha = Math.min(1, rise * 1.6);
        wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = 'source-over'; wg.clearRect(0, 0, S, S);
        brand.logo.draw(wg, 0, 0, S, P.ink);
        wg.globalCompositeOperation = 'source-in';
        const off = (1 - reg) * 170;                               // out of register, then one picture with the outside
        wg.drawImage(tex, drift - lx + off * dir, texY - ly - (1 - reg) * 60);
        const lamp = span(t, 1.3, 1.7);
        if (lamp > 0) { wg.globalCompositeOperation = 'source-atop'; wg.fillStyle = rgba(P.lamp, 0.12 * lamp); wg.fillRect(0, S * 0.55, S, S * 0.45); }
        wg.globalCompositeOperation = 'source-over';
        ctx.drawImage(win, lx, ly + lift);
        ctx.restore();
      }
      M.twice(kit, ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center' }, { shift: T.ghost.shift, ghostA: T.ghost.alpha, dir, color: P.ink, ghostColor: P.ink, when: when0(1.3) });
      const rw = Math.min(name.width, 360) * M.E(span(t, 1.6, 1.95));
      ctx.fillStyle = P.lamp; ctx.fillRect(W / 2 - rw / 2, yName + name.lead / 2 - 8, rw, 5);
      M.twice(kit, ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center' }, { shift: T.ghost.shift * 0.6, ghostA: T.ghost.alpha, dir, color: P.grey, ghostColor: P.grey, when: when0(1.8) });
      if (slogan) M.twice(kit, ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center' }, { shift: T.ghost.shift * 0.6, ghostA: T.ghost.alpha, dir, color: P.grey, ghostColor: P.grey, when: when0(2.1) });
    },
  };
}
