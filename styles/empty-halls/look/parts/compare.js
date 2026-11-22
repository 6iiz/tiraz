// Before and after on tape: the old value comes into focus, dim; a tracking fault runs through it (a pale line that shakes it sideways)
// and leaves it struck through and dimmer still; then the new value comes into focus below it, held by the focus brackets.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S0.unit ? ' ' + S0.unit : '');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0 - 80;
  const was = kit.fit(asText(S0.was), { size: T.size.compare * 0.8, weight: 700, maxW, where: 'the old value' });
  const now = kit.fit('*' + asText(S0.now) + '*', { size: T.size.compare, weight: 800, maxW, where: 'the new value' });
  const label = S0.label ? kit.fit(S0.label, { size: T.size.lead, weight: 600, maxW: x1 - x0, minScale: 0.92, where: 'the compare label' }) : null;
  const gA = 26, gB = 70, block = (label ? label.height + gA : 0) + was.height + gB + now.height;
  const top = kit.place(block, T.vy - 20);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + gA : 0) + was.lead / 2, yNow = yWas - was.lead / 2 + was.height + gB + now.lead / 2;
  const cutT = at + 0.85, nowT = at + 1.25, wb = M.boxes(kit, was, { x0, x1, y: yWas });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = ground.time(t), out = span(t, d - T.dur.out, d), fault = span(t, cutT, cutT + 0.3);
      M.shade(ctx, P, x0, x1, top, top + block);
      if (label) M.focusText(ctx, kit, label, { x0, x1, y: yLabel, color: P.grey, P, keyed: false, when: () => at, out, t, time });
      ctx.save();
      if (fault > 0 && fault < 1) ctx.translate(Math.sin(fault * 40) * 14 * (1 - fault), 0);
      M.focusText(ctx, kit, was, { x0, x1, y: yWas, color: fault >= 1 ? P.grey : P.dim, P, keyed: false, when: () => at + 0.15, out, t, time });
      ctx.restore();
      if (fault > 0 && fault < 1) { const yb = yWas + was.size * (0.9 - 1.8 * fault); ctx.fillStyle = rgba(P.light, 0.4); ctx.fillRect(0, yb - 3, W, 6); }
      if (fault > 0.5 && out < 1) for (let r = 0; r < was.rows.length; r++) {
        const bs = wb.filter((b) => b.row === r), a = Math.min(...bs.map((b) => b.x)) - 16, b = Math.max(...bs.map((b) => b.x + b.width)) + 16;
        const len = (b - a) * M.soft((fault - 0.5) * 2);
        ctx.fillStyle = P.grey; ctx.globalAlpha = 1 - M.accel(out); ctx.fillRect(kit.rtl ? b - len : a, bs[0].y - 3, len, 7); ctx.globalAlpha = 1;
      }
      M.focusText(ctx, kit, now, { x0, x1, y: yNow, color: P.text, keyColor: P.text, P, when: () => nowT, out, t, time });
      ground.over(ctx, t);
    },
  };
}
