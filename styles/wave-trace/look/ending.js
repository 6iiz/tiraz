// The wave-trace ending: the beam draws a Lissajous figure in the middle of the screen; its two frequencies slide toward each other
// until the figure closes into a single ring, and inside the ring the brand's logo lights up in the beam's colour. Under it the name,
// the handle and the slogan light as a sweep runs beneath them. spec: { duration }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const cx = W / 2, cy = SAFE.top + 270, R = 230, L = 220, pad = 50;
  const logo = document.createElement('canvas'); logo.width = L + pad * 2; logo.height = L + pad * 2;
  {
    const src = document.createElement('canvas'); src.width = logo.width; src.height = logo.height;
    const s = src.getContext('2d'); brand.logo.draw(s, pad, pad, L, pal.beam);
    if (!brand.logo.shape) { s.globalCompositeOperation = 'source-in'; s.fillStyle = pal.beam; s.fillRect(0, 0, src.width, src.height); }
    const c = logo.getContext('2d'); c.filter = 'blur(16px)'; c.globalAlpha = 0.7; c.drawImage(src, 0, 0); c.filter = 'none'; c.globalAlpha = 1; c.drawImage(src, 0, 0);
  }
  const maxW = SAFE.right - SAFE.left - 40, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const yName = cy + R + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 10 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const o = (y) => ({ x0: SAFE.left, x1: SAFE.right, y, align: 'center' });
  const sName = M.lightText(kit, name, o(yName), pal, T), sHandle = M.lightText(kit, handle, o(yHandle), pal, T, pal.text);
  const sSlogan = slogan && M.lightText(kit, slogan, o(ySlogan), pal, T, pal.soft);
  const tDraw = 0.05, tMorph = 0.55, tClose = 1.25, tLogo = 1.2, tName = 1.4, sw = 0.5, N = 360;
  const xa = rtl ? SAFE.right : SAFE.left, xb = rtl ? SAFE.left : SAFE.right;
  const at = (x, t0) => t0 + sw * Math.abs(x - xa) / Math.abs(xb - xa);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const m = M.E(span(t, tMorph, tClose)), a = lerp(3, 1, m), b = lerp(2, 1, m), ph = Math.PI / 2 + (t + clock) * 0.6 * (1 - m);
      const pts = []; for (let i = 0; i <= N; i++) { const s = (i / N) * Math.PI * 2; pts.push([cx + R * Math.sin(a * s + ph), cy + R * Math.sin(b * s)]); }
      M.trace(ctx, pts, pal, { head: span(t, tDraw, tMorph), width: 3, age: () => 0.9 });
      const lg = M.E(span(t, tLogo, tLogo + 0.4));
      if (lg > 0) { ctx.save(); ctx.globalAlpha = lg; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(logo, cx - L / 2 - pad, cy - L / 2 - pad); ctx.restore(); }
      const lit = (s, t0) => s.draw(ctx, (i) => M.cool(t - at(s.boxes[i].x + s.boxes[i].width / 2, t0), T.dur.tau, 0.8), (i) => M.cool(t - at(s.boxes[i].x + s.boxes[i].width / 2, t0), T.dur.heat, 0));
      lit(sName, tName); lit(sHandle, tName + 0.35); if (sSlogan) lit(sSlogan, tName + 0.6);
    },
  };
}
