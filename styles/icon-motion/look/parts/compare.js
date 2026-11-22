// Before and after: the old value slides in grey and a round-capped ink bar shoots across it on the beat; then the new value slides in
// below it on an accent capsule, and on the stage disc the balance tips from one pan to the other.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, S = ground.stage;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S0.unit ? ' ' + S0.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right - 40, maxW = x1 - x0 - 60;
  const was = kit.fit(asText(S0.was), { size: T.size.compare * 0.82, weight: 800, maxW, where: 'the old value' });
  const now = kit.fit('*' + asText(S0.now) + '*', { size: T.size.compare, weight: 900, maxW, where: 'the new value' });
  const label = S0.label ? kit.fit(S0.label, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left, minScale: 0.9, where: 'the compare label' }) : null;
  const gapA = 30, gapB = 50, block = (label ? label.height + gapA : 0) + was.height + gapB + now.height;
  const top = Math.min(kit.place(block, 680), T.textBottom - block);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + gapA : 0) + was.lead / 2, yNow = yWas - was.lead / 2 + was.height + gapB + now.lead / 2;
  const cutT = at + 0.85, nowT = at + 1.3, o0 = d - T.dur.out - 0.1;
  const R = (t0) => (r) => (t) => span(t, t0 + r * T.dur.stagger, t0 + r * T.dur.stagger + T.dur.row);
  const O = (k) => (t) => span(t, o0 + k * 0.05, o0 + k * 0.05 + T.dur.out);
  const wb = M.boxes(kit, was, { x0, x1, y: yWas });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tip = -1 + 2 * M.snap(span(t, nowT, nowT + 0.35));
      M.stage(ctx, S.x, S.y, S.r, P); M.balance(ctx, S.x, S.y, S.r, P, kit.rtl ? -tip : tip, tip < 0 === kit.rtl);
      if (label) M.slideText(ctx, kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.grey, P, keyed: false, rowIn: (r) => R(at)(r)(t), rowOut: () => O(0)(t) });
      M.slideText(ctx, kit, was, { x0, x1, y: yWas, color: P.grey, P, keyed: false, rowIn: (r) => R(at + 0.15)(r)(t), rowOut: () => O(1)(t) });
      const pk = span(t, cutT, cutT + 0.22), po = O(1)(t);
      if (pk > 0 && po < 1) for (let r = 0; r < was.rows.length; r++) {                    // the strike, one per row, from the reading side
        const bs = wb.filter((b) => b.row === r), a = Math.min(...bs.map((b) => b.x)) - 18, b = Math.max(...bs.map((b) => b.x + b.width)) + 18;
        const len = (b - a) * M.snap(span(t, cutT + r * 0.06, cutT + r * 0.06 + 0.22)), dx = -M.accel(po) * ((x1 - x0) * 0.9 + 80) * (kit.rtl ? 1 : -1);
        if (len > 0) M.bar(ctx, (kit.rtl ? b - len : a) + dx, bs[0].y, (kit.rtl ? b : a + len) + dx, bs[0].y, Math.max(10, was.size * 0.12), P.ink);
      }
      M.slideText(ctx, kit, now, { x0, x1, y: yNow, color: P.ink, P, rowIn: (r) => R(nowT)(r)(t), rowOut: () => O(2)(t) });
    },
  };
}
