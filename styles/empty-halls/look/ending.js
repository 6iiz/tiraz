// The Empty Halls ending: the walk quickens a little and, out of the dark at the far end, a lit sign comes towards the camera: a panel
// in the accent with the brand's logo, glowing softly in the hall. The walk stops under it; the name, the handle and the slogan come
// into focus below. The hall is not empty after all: the way out was the brand. spec: { duration }
import { need, span, lerp, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  ·  '), { size: 46, weight: 600, maxW: x1 - x0, minScale: 0.92, where: 'the slogan' }) : null;
  const F = 600, SZ = 0.95, Y = 0.28, zEnd = 2.0;
  const signY = T.vy - Y * F / zEnd, half = SZ * F / zEnd / 2;
  const yName = signY + half + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 14 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const textTop = yName - name.lead / 2, textBot = (slogan ? ySlogan + slogan.lead / 2 : yHandle + handle.lead / 2);
  return {
    duration: d,
    draw(ctx, t) {
      const walk = M.soft(span(t, 0, 1.7));
      const g = t < 1.4 ? 0 : t < 2.2 ? (t - 1.4) ** 2 / 1.6 : 0.4 + (t - 2.2);       // the walk slows to a near stop under the sign
      ground.draw(ctx, t, { extra: 1.2 * walk - 0.88 * T.speed * g });
      const z = lerp(16, zEnd, walk), s = SZ * F / z, cx = W / 2 + (1 - walk) * 6 * Math.sin(t * 0.63), cy = T.vy - Y * F / z;
      const fogK = Math.min(1, 1 - Math.exp(-z / 5.5)), col = mix(P.acc, P.deep, fogK * 0.85);
      const glow = ctx.createRadialGradient(cx, cy, s * 0.3, cx, cy, s * 1.6);
      glow.addColorStop(0, rgba(P.acc, 0.35 * (1 - fogK))); glow.addColorStop(1, rgba(P.acc, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, s * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = mix(P.wallLo, P.deep, fogK); ctx.lineWidth = Math.max(1, 6 / z * 2);    // the sign hangs from the ceiling on two rods
      for (const sx of [-0.3, 0.3]) { ctx.beginPath(); ctx.moveTo(cx + sx * s, cy - s / 2); ctx.lineTo(cx + sx * s * 1.3, T.vy - 0.95 * F / z); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(cx - s / 2, cy - s / 2, s, s, s * 0.08); ctx.fill();
      brand.logo.draw(ctx, cx - s * 0.32, cy - s * 0.32, s * 0.64, mix(P.onAcc, col, fogK * 0.7));
      M.shade(ctx, P, x0, x1, textTop, textBot, 0.85 * M.soft(span(t, 1.2, 1.7)));
      M.focusText(ctx, kit, name, { x0, x1, y: yName, color: P.text, P, keyed: false, when: () => 1.6, t, time: t });
      M.focusText(ctx, kit, handle, { x0, x1, y: yHandle, color: P.text, P, keyed: false, when: () => 1.85, t, time: t });
      if (slogan) M.focusText(ctx, kit, slogan, { x0, x1, y: ySlogan, color: P.grey, P, keyed: false, when: () => 2.05, t, time: t });
      ground.over(ctx, t);
    },
  };
}
