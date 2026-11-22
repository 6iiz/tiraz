// The Urban Pulse ending: the city keeps running for one bar, then a hard cut on the downbeat takes the whole city away (no fade) and
// leaves the night. On that same downbeat the logo is cut on in the city's light, and one accent light trail circles it once like a car
// on a ring road. The name, handle and slogan are written by passing lights; in the quiet coda the windows come back one beat at a time.
// spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the slogan' }) : null;
  const cut = 0.5, S = 250, cx = W / 2, cy = 560, R = S * 0.82;
  const yName = cy + R + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 20 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const write = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * T.dur.step; if (M.streakIn(c, span(t, s, s + T.dur.in), box, size, rtl, pal) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      // before the downbeat the city runs; after it, only the night, and in the coda the lights return beat by beat
      const coda = Math.floor(span(t, 2.6, 4.6) * 4) / 4;
      ground.draw(ctx, t, { city: t < cut ? 1 : coda * 0.7 });
      if (t < cut) return;
      ctx.save();
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
      halo.addColorStop(0, rgba(pal.accent, 0.12)); halo.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = halo; ctx.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
      brand.logo.draw(ctx, cx - S / 2, cy - S / 2, S, pal.light);
      // one trail around the logo: the head runs a full circle and the tail fades behind it, then it stays as a faint ring
      const p = M.E(span(t, cut, cut + 1.1)), a0 = -Math.PI / 2, dirn = rtl ? -1 : 1, head = a0 + dirn * p * Math.PI * 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(pal.accent, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, a0, head, dirn < 0); ctx.stroke();
      if (p < 1) {
        for (let k = 0; k < 14; k++) {
          const a1 = head - dirn * k * 0.07, a2 = head - dirn * (k + 1) * 0.07;
          ctx.strokeStyle = rgba(k < 2 ? pal.light : pal.accent, (1 - k / 14) * 0.95); ctx.lineWidth = 9 - k * 0.4;
          ctx.shadowColor = rgba(pal.accent, 0.8); ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(cx, cy, R, a2, a1, dirn > 0); ctx.stroke();
        }
      } else {
        ctx.strokeStyle = pal.accent; ctx.lineWidth = 6; ctx.shadowColor = rgba(pal.accent, 0.8); ctx.shadowBlur = 14;
        const pulse = (Math.floor((t + clock) / T.beat) % 4) / 4;
        ctx.beginPath(); ctx.arc(cx, cy, R, a0 + dirn * pulse * Math.PI * 2, a0 + dirn * (pulse * Math.PI * 2 + 0.5), dirn < 0); ctx.stroke();
      }
      ctx.restore();
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.light, each: write(t, 1.0, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.key, each: write(t, 1.4, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.grey, each: write(t, 1.7, slogan.size) });
    },
  };
}
