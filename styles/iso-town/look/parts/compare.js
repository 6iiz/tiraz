// Before and after on the town square: the label and the old value stand up in muted ink and the old value is crossed by a paper
// strip laid over it; then a trail of footsteps walks down the square from it, step by step, and the new value stands up where they
// stop, under the awning. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 40;
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the compare label' }) : null;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: Math.round(T.size.compare * 0.8), weight: 700, maxW, minPx: 52, where: 'the old value' });
  const now = kit.fit(`*${asText(S.now).replace(/\*/g, '')}*`, { size: Math.round(T.size.compare * 1.12), weight: 800, maxW: maxW - 40, minPx: 64, where: 'the new value' });
  const trail = 200, block = (label ? label.height + 20 : 0) + was.height + trail + now.height;
  const top = kit.place(block, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + 20 : 0) + was.lead / 2;
  const yNow = top + block - now.height + now.lead / 2, ya = yWas + was.lead / 2 + 10, yb = yNow - now.lead / 2 - 10;
  const runs = M.keyRuns(now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'center' }, rtl);
  const cutT = at + 0.75, walkT = at + 0.95, nowT = at + 1.45, nSteps = 6;
  const rise = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * 0.07; if (M.unfold(c, span(t, s, s + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: pal.muted, each: rise(t, at, label.size) });
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'center', color: pal.muted, key: pal.muted, each: rise(t, at + 0.2, was.size) });
      const cw = (was.width + 50) * M.E(span(t, cutT, cutT + 0.3));       // the paper strip, laid from the reading side
      if (cw > 0) { const x = rtl ? W / 2 + (was.width + 50) / 2 - cw : W / 2 - (was.width + 50) / 2; ctx.fillStyle = pal.shadow; ctx.fillRect(x + 3, yWas + 2, cw, 7); ctx.fillStyle = pal.ink; ctx.fillRect(x, yWas - 3, cw, 6); }
      for (let k = 0; k < nSteps; k++) {                                    // footsteps, left and right, one after the other
        const s = walkT + k * ((nowT - walkT) / nSteps); if (t < s) break;
        const y = ya + (yb - ya) * ((k + 0.5) / nSteps), x = W / 2 + (k % 2 ? 16 : -16);
        ctx.save(); ctx.globalAlpha = Math.min(1, (t - s) * 8); ctx.fillStyle = pal.muted;
        ctx.beginPath(); ctx.ellipse(x, y, 7, 11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - 15, 5, 5, 0, 0, 7); ctx.fill(); ctx.restore();
      }
      for (const r of runs) M.awning(ctx, r, now.size, span(t, nowT - 0.05, nowT + 0.4), pal);
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'center', color: pal.ink, key: pal.onAccent, each: rise(t, nowT, now.size) });
    },
  };
}
