// Before and after as a collision: the old value is slammed in on an ink beam and marked like a document, a red marker bar dragged
// through it; then a film window between the two accelerates (cuts on a beat, a half, a quarter, an eighth) and the new value is slammed
// in huge on a red block, on the downbeat after the run. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare, weight: 800, maxW: maxW - 160, single: true, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: Math.round(T.size.compare * 1.45), weight: 900, maxW: maxW - 100, single: true, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 80, single: true, where: 'the compare label' }) : null;
  const labH = label ? label.size * 1.6 + 36 : 0, wasH = was.size * 1.7, winH = 210, nowH = now.size * 1.35;
  const top = kit.place(labH + wasH + 40 + winH + 46 + nowH, 760);
  const yLab = top + (label ? label.size * 0.8 : 0), yWas = top + labH + wasH / 2, yWin = top + labH + wasH + 40, yNow = yWin + winH + 46 + nowH / 2;
  const tWas = at + 0.15, tMark = at + 0.7, tRun = at + 0.95;
  const cuts = [0, 0.25, 0.375, 0.4375, 0.5].map((x) => tRun + x), tNow = tRun + 0.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), o = M.I(out), away = (s) => (rtl ? 1 : -1) * s * o * W;
      if (label) {
        const p = M.E(span(t, at, at + T.dur.slam));
        if (p > 0) {
          const dx = (rtl ? 1 : -1) * (1 - p) * W + away(1);
          const b = M.beamRow(kit, ctx, label, label.rows[0], { x0: SAFE.left, x1: SAFE.right, y: yLab, pad: 18, fill: P.ink, ink: P.paper, keyFill: P.red, keyInk: P.onRed, dx });
          ctx.fillStyle = P.red; ctx.fillRect((rtl ? b.left - 36 : b.left + b.w + 12) + dx, yLab - 12, 24, 24);
        }
      }
      // the old value on an ink beam, then marked: a red bar dragged through it at the reading speed
      const pw = span(t, tWas, tWas + T.dur.slam);
      if (pw > 0) {
        const dx = (rtl ? -1 : 1) * (1 - M.E(pw)) * W + away(-1), dy = M.kick(t - tWas - T.dur.slam, 6);
        const b = M.beamRow(kit, ctx, was, was.rows[0], { x0: SAFE.left, x1: SAFE.right - 60, y: yWas, pad: 30, fill: P.tone(0.3), ink: P.paper, keyFill: P.tone(0.3), keyInk: P.paper, dx, dy });
        const m = M.E(span(t, tMark, tMark + 0.2));
        if (m > 0) { const L = (b.w + 40) * m; ctx.fillStyle = P.red; ctx.fillRect((rtl ? b.left + b.w + 20 - L : b.left - 20) + dx, yWas - 7 + dy, L, 14); }
      }
      // the run: a window that cuts faster and faster, then holds while the new value stands under it
      if (t >= cuts[0] - 0.12) {
        const ow = M.E(span(t, cuts[0] - 0.12, cuts[0])), h = winH * ow;
        let n = 0; for (let i = 0; i < cuts.length; i++) if (t >= cuts[i]) n = i;
        const c = t > tNow + T.beat ? M.cutAt(t, tNow + T.beat, T.beat, 20) : { k: n * 3 + 2, u: t - cuts[n] };
        M.window(ctx, SAFE.left + away(1) * 0, yWin + (winH - h) / 2 - o * H, maxW, h, c.k, Math.max(0, c.u), t, P);
      }
      const pn = span(t, tNow, tNow + T.dur.slam);
      if (pn > 0) {
        const dx = (rtl ? 1 : -1) * (1 - M.E(pn)) * W + away(1), dy = M.kick(t - tNow - T.dur.slam, 10);
        ctx.save(); ctx.translate(dx, dy);
        ctx.fillStyle = P.ink; ctx.fillRect(SAFE.left + 16, yNow - nowH / 2 + 16, maxW, nowH);
        ctx.fillStyle = P.red; ctx.fillRect(SAFE.left, yNow - nowH / 2, maxW, nowH);
        kit.drawText(ctx, now, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: yNow + now.size * 0.04, align: 'center', color: P.onRed, key: P.onRed });
        ctx.restore();
      }
    },
  };
}
