// The squiggle-box ending: the window over the town draws back into a small round porthole (the town still alive inside it); an accent
// disc with the brand's logo pops onto its lower edge like a stamp; then the name, the handle (mono) and the slogan pop in under it,
// and a few Memphis marks pop out around the porthole. spec: { duration }
import { need, span, mix, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, F = T.frame, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' · '), { size: T.size.lead, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const cx = W / 2, sy = F.shutY + F.r, R = 78;
  const yName = sy + R + 40 + name.lead / 2, yHandle = yName + name.lead / 2 + 30, ySlogan = yHandle + 34 + (slogan ? slogan.lead / 2 : 0);
  const soft = mix(P.ink, P.paper, 0.3);
  const popWords = (t, t0) => (w, i, box, c) => { if (M.pop(c, span(t, t0 + i * 0.05, t0 + i * 0.05 + T.dur.in), box.x + box.width / 2, box.y) === false) return false; };
  const confetti = [[0, -1.25, -0.55, P.pastel], [1, 1.3, -0.45, P.accent], [2, -1.2, 0.5, P.ink], [3, 1.25, 0.6, P.soft]];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { shut: ease.inOutCubic(span(t, 0, 0.6)) });
      confetti.forEach(([k, ax, ay, c], i) => {
        const q = span(t, 0.65 + i * 0.07, 1.05 + i * 0.07); if (q <= 0) return;
        const x = cx + ax * F.r * 1.25, y = F.shutY + ay * F.r * 1.3 + Math.sin((t + i) * 2) * 3;
        ctx.save(); M.pop(ctx, q, x, y, 30); M.mark(ctx, P, k, x, y, 46, c); ctx.restore();
      });
      const p = span(t, 0.5, 0.5 + T.dur.in + 0.1);
      if (p > 0) {
        ctx.save(); M.pop(ctx, p, cx, sy, -12);
        ctx.fillStyle = P.shade; ctx.beginPath(); ctx.arc(cx + 8, sy + 8, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.accent; ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, sy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        brand.logo.draw(ctx, cx - R * 0.6, sy - R * 0.6, R * 1.2, P.onAccent);
        ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.ink, each: popWords(t, 0.85) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: soft, each: popWords(t, 1.15) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.ink, each: popWords(t, 1.35) });
    },
  };
}
