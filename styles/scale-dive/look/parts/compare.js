// Before and after as a change of scale: the old value grows in muted, small, inside a dim ring of its own, and is crossed by one line
// as it falls behind; a dotted sight line then fires down from it, and the new value dives up out of the distance, big, locked on by
// the next-stop pill. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 120, cx = W / 2;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: Math.round(T.size.compare * 0.82), weight: 700, maxW: maxW - 80, minPx: 48, where: 'the old value' });
  const now = kit.fit(`*${asText(S.now).replace(/\*/g, '')}*`, { size: T.size.compare * 1.15, weight: 800, maxW, minPx: 64, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left, minPx: 46, where: 'the compare label' }) : null;
  const yLabel = 400, yWas = 580, yNow = 900;
  const nowRuns = M.keyRuns(now, { x0: SAFE.left, x1: SAFE.right, y: yNow - (now.rows.length - 1) * now.lead / 2, align: 'center' }, rtl);
  const cutT = at + 0.75, fireT = at + 0.95, nowT = at + 1.3;
  const dive = (t, t0, vx, vy) => (w, i, box, c) => { const s = t0 + i * 0.06; if (M.arrive(c, span(t, s, s + T.dur.in), box, vx, vy) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, 0.5 * M.E(span(t, fireT, nowT + 0.4)));
      ctx.save();
      if (M.rushOut(ctx, span(t, d - T.dur.out, d), cx, yNow)) {
        if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: pal.muted, each: dive(t, at, cx, ground.vy) });
        // the old value, in its dim ring; it falls back (shrinks a little) as the line crosses it
        const back = M.E(span(t, cutT, cutT + 0.5)), sw = 1 - 0.18 * back;
        const g = M.Q(span(t, at + 0.1, at + 0.5)), rw = was.width / 2 + 70;
        ctx.save(); ctx.translate(cx, yWas); ctx.scale(sw, sw); ctx.translate(-cx, -yWas);
        if (g > 0) { ctx.save(); ctx.translate(cx, yWas); ctx.scale(g, g); ctx.fillStyle = pal.step1; ctx.beginPath(); ctx.ellipse(0, 0, rw, was.height / 2 + 40, 0, 0, 7); ctx.fill(); ctx.restore(); }
        kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas - (was.rows.length - 1) * was.lead / 2, align: 'center', color: pal.muted, key: pal.muted, each: dive(t, at + 0.15, cx, yWas) });
        const cw = (was.width + 60) * M.E(span(t, cutT, cutT + 0.3));
        if (cw > 0) { ctx.fillStyle = pal.ink; const x = rtl ? cx + (was.width + 60) / 2 - cw : cx - (was.width + 60) / 2; ctx.fillRect(x, yWas - 3, cw, 6); }
        ctx.restore();
        // the sight line fires from the old value down to where the new one will lock
        const f = span(t, fireT, nowT), ya = yWas + was.height / 2 + 30, yb = yNow - now.height / 2 - 40;
        if (f > 0) { ctx.save(); ctx.strokeStyle = pal.sun; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 16]); ctx.beginPath(); ctx.moveTo(cx, ya); ctx.lineTo(cx, ya + (yb - ya) * f); ctx.stroke(); ctx.restore(); }
        // the new value, locked on
        for (const r of nowRuns) M.stop(ctx, r, now.size, span(t, nowT + 0.08, nowT + 0.5), pal, t + clock);
        kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow - (now.rows.length - 1) * now.lead / 2, align: 'center', color: pal.ink, key: pal.onSun,
          each: (w, i, box, c) => { const s = nowT + i * 0.06; if (M.arrive(c, span(t, s, s + T.dur.in), box, cx, ground.vy) === false) return false; return t >= nowT + 0.2 ? pal.onSun : pal.ink; } });
      }
      ctx.restore();
    },
  };
}
