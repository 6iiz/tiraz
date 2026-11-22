// The light-console ending: the projector draws the brand's logo as a solid hologram. A scan plane climbs and leaves the logo behind it,
// filled with the hue in fine interlaced lines, with a glow and a hot outline pass; it hangs over the pad and breathes. Above it a plate
// opens with the name, which resolves and is locked by brackets; the handle and the slogan resolve under it. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, P = T.pad;
  const L = 300, pad = 40, lx = W / 2 - L / 2, ly = P.y - 70 - L;
  const flat = document.createElement('canvas'); flat.width = L + pad * 2; flat.height = L + pad * 2;
  const fg = flat.getContext('2d'); brand.logo.draw(fg, pad, pad, L, pal.hue);
  if (!brand.logo.shape) { fg.globalCompositeOperation = 'source-in'; fg.fillStyle = pal.hue; fg.fillRect(0, 0, flat.width, flat.height); fg.globalCompositeOperation = 'source-over'; }
  const holo = document.createElement('canvas'); holo.width = flat.width; holo.height = flat.height;
  {
    const h = holo.getContext('2d');
    h.filter = 'blur(18px)'; h.globalAlpha = 0.6; h.drawImage(flat, 0, 0); h.filter = 'none'; h.globalAlpha = 1;
    const lines = document.createElement('canvas'); lines.width = flat.width; lines.height = flat.height;
    const lg = lines.getContext('2d'); lg.drawImage(flat, 0, 0); lg.globalCompositeOperation = 'destination-out';
    for (let y = 0; y < lines.height; y += 5) lg.fillRect(0, y + 3, lines.width, 2);
    h.globalAlpha = 0.95; h.drawImage(lines, 0, 0);
    h.globalCompositeOperation = 'lighter'; h.globalAlpha = 0.35; h.filter = 'blur(2px)'; h.drawImage(flat, 0, 0); h.filter = 'none';
  }
  const maxW = SAFE.right - SAFE.left - 80;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const ph = name.lead + 50, top = SAFE.top + 160, yName = top + ph / 2;
  const yHandle = top + ph + 40 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const nb = { x0: (W - name.width) / 2, x1: (W + name.width) / 2, y0: yName - name.size * 0.55, y1: yName + name.size * 0.55 };
  const g0 = 0.1, g1 = 1.0, tName = 0.9, lockT = 1.55;
  const scan = (t, t0, size) => (w, i, box, c) => M.resolve(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.scan), box, size, pal, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = span(t, g0, g1), bob = Math.sin((t + clock) * 1.6) * 6;
      if (g > 0) {
        const sy = ly + L + pad - M.E(g) * (L + pad * 2);              // the scan plane climbing
        ctx.save(); ctx.beginPath(); ctx.rect(0, sy, W, H); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(holo, lx - pad, ly - pad + bob); ctx.restore();
        if (g < 1) { ctx.fillStyle = rgba(pal.hot, 0.3); ctx.fillRect(lx - 60, sy - 5, L + 120, 10); ctx.fillStyle = pal.hot; ctx.fillRect(lx - 50, sy - 1, L + 100, 2); }
      }
      const k = M.plate(ctx, SAFE.left + 20, top, SAFE.right - SAFE.left - 40, ph, pal, span(t, tName - 0.25, tName));
      if (k > 0) {
        ctx.save(); ctx.beginPath(); const hh = ph * k; ctx.rect(0, top + (ph - hh) / 2, W, hh); ctx.clip();
        kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: t >= lockT ? pal.lock : pal.white, each: scan(t, tName - 0.05, name.size) });
        ctx.restore();
      }
      M.brackets(ctx, nb, span(t, lockT - T.dur.lock, lockT), pal);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.white, each: scan(t, lockT + 0.05, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.soft, each: scan(t, lockT + 0.3, slogan.size) });
    },
  };
}
