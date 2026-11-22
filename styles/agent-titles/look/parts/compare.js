// Before and after as two locations in one frame: the frame is split on a diagonal cut, the dark ink above and the hot ink below. The
// old value slides in above and a snipped strip of the hot ink is slid across it; then, on the stab, the new value slides in big on the
// hot half and slaps down, and the whole picture stops dead for half a second (the agent freezes mid-stride) before it moves again.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, which: 'ink', seed: 9 });
  const M = await import(look.base + 'motion.js'), I = ground.I, G = ground.color;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare, weight: 800, maxW, single: true, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: Math.round(T.size.compare * 1.3), weight: 900, maxW, single: true, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, single: true, where: 'the compare label' }) : null;
  const yLab = SAFE.top + 40, yWas = yLab + (label ? 60 : 0) + was.lead / 2;
  const s0 = yWas + was.lead / 2 + 30, s1 = s0 + 110, yNow = s1 + 30 + now.lead / 2, ledgeY = 1240;
  const sheet = M.cut([[-40, rtl ? s1 : s0], [W + 40, rtl ? s0 : s1], [W + 40, H + 40], [-40, H + 40]], 100, 2.6);
  const wasInk = mix(I.on(G), G, 0.25), dimmed = mix(I.on(G), G, 0.38);
  const bar = M.cut(M.strip(0, -9, was.width + 80, 18, 10), 101, 1);
  const ledge = M.cut(M.rect(-40, 0, W + 80, 22), 12, 1.4);
  const tSheet = at, tWas = at + 0.2, tStrike = at + 0.8, tNow = at + 1.3, FREEZE = 0.5;
  const onHot = I.on(I.hot);
  return {
    duration: d,
    draw(ctx, t) {
      // stop-time: from the stab, the picture is held for FREEZE seconds, then runs on
      const te = t < tNow + T.dur.slide ? t : t < tNow + T.dur.slide + FREEZE ? tNow + T.dur.slide : t - FREEZE;
      ground.draw(ctx, te);
      const out = span(t, d - T.dur.out, d), o = M.I(out), dir = rtl ? 1 : -1;
      const ps = M.O(span(te, tSheet, tSheet + 0.3));
      ctx.save(); ctx.translate(-dir * o * 1300, (1 - ps) * 900); M.piece(ctx, sheet, I.hot, G);
      ctx.translate(0, ledgeY); M.piece(ctx, ledge, I.ink, I.hot); ctx.restore();
      M.agent(ctx, M.walkX(te, at - 1.2, rtl ? W + 80 : -80, rtl ? -1 : 1) - dir * o * 1300, ledgeY + 2 + (1 - ps) * 900, T.agent * 0.8, rtl ? -1 : 1, te, { fill: I.ink, scarf: I.paper, gap: I.hot });
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLab, align: 'start', color: wasInk, each: M.credit(te, (i) => at + i * T.dur.stagger, T.dur.slide, out, rtl) });
      const struck = span(te, tStrike, tStrike + 0.2);
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: struck > 0 ? dimmed : wasInk, key: struck > 0 ? dimmed : wasInk,
        each: M.credit(te, (i) => tWas + i * T.dur.stagger, T.dur.slide, out, rtl) });
      if (struck > 0) {
        const L = M.O(struck), x0 = rtl ? SAFE.right - was.width - 40 : SAFE.left - 40;
        ctx.save(); ctx.translate(x0 - dir * o * 1300, yWas + 4); ctx.beginPath(); ctx.rect(rtl ? was.width + 80 - (was.width + 80) * L : 0, -30, (was.width + 80) * L, 60); ctx.clip();
        M.piece(ctx, bar, I.hot, G, { gapW: 4 }); ctx.restore();
      }
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'start', color: onHot, key: onHot,
        each: M.credit(t, (i) => tNow + i * 0.06, T.dur.slide, out, rtl) });
    },
  };
}
