// Before and after, told by the crowd: five Pips stand on the board under the old value; a printed rule strikes the old value through,
// the new value is stamped below on an accent tape, and the whole crowd hops over, round the far side, to gather under the new one.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S0.unit ? ' ' + S0.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right - 24, maxW = x1 - x0 - 50;
  const was = kit.fit(asText(S0.was), { size: T.size.compare * 0.82, weight: 800, maxW, where: 'the old value' });
  const now = kit.fit('*' + asText(S0.now) + '*', { size: T.size.compare, weight: 900, maxW, where: 'the new value' });
  const label = S0.label ? kit.fit(S0.label, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left, minScale: 0.9, where: 'the compare label' }) : null;
  const shelf = 120, block = (label ? label.height + 24 : 0) + was.height + shelf + now.height + shelf;
  const top = kit.place(block, 690);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + 24 : 0) + was.lead / 2;
  const shelfA = yWas - was.lead / 2 + was.height + shelf - 14, yNow = shelfA + 14 + now.lead / 2, shelfB = yNow - now.lead / 2 + now.height + shelf - 14;
  const cutT = at + 0.85, nowT = at + 1.25, side = kit.rtl ? SAFE.left + 30 : SAFE.right - 30;
  const wb = M.boxes(kit, was, { x0, x1, y: yWas }), r = rng(303), pips = [];
  for (let k = 0; k < 5; k++) {
    const xa = (kit.rtl ? x1 - 60 : x0 + 60) + (kit.rtl ? -1 : 1) * k * 116 + (r() - 0.5) * 16, xb = (kit.rtl ? x1 - 60 : x0 + 60) + (kit.rtl ? -1 : 1) * k * 116;
    const plan = new M.Plan(kit.rtl ? -90 : W + 90, shelfA).hop(xa, shelfA, { at: at + 0.05 + k * 0.05 - 0.2, per: 0.17, h: 26 });
    const go = nowT + 0.15 + (4 - k) * 0.07;
    plan.hop(side + (kit.rtl ? 1 : -1) * k * 4, shelfA + 4, { at: go, per: 0.17, h: 30 }).hop(side, shelfB, { per: 0.2, h: 44 }).hop(xb, shelfB, { per: 0.17, h: 26, happy: true });
    pips.push({ plan, spr: ground.spr[k % 4], size: 86, seed: k });
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = Math.max(0, (t - (d - T.dur.out)) / T.dur.out);
      if (label) M.printText(ctx, kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.grey, P, keyed: false, when: (i) => at + i * 0.06, out, t });
      M.printText(ctx, kit, was, { x0, x1, y: yWas, color: P.grey, P, keyed: false, when: (i) => at + 0.15 + i * 0.06, out, t });
      const pk = span(t, cutT, cutT + 0.25);
      if (pk > 0 && out < 1) for (let rr = 0; rr < was.rows.length; rr++) {
        const bs = wb.filter((b) => b.row === rr), a = Math.min(...bs.map((b) => b.x)) - 14, b = Math.max(...bs.map((b) => b.x + b.width)) + 14, len = (b - a) * M.soft(pk);
        ctx.fillStyle = P.ink; ctx.globalAlpha = 1 - M.soft(out); ctx.beginPath(); ctx.roundRect(kit.rtl ? b - len : a, bs[0].y - 4, len, 9, 4); ctx.fill(); ctx.globalAlpha = 1;
      }
      M.printText(ctx, kit, now, { x0, x1, y: yNow, color: P.ink, P, when: (i) => nowT + i * 0.06, out, t });
      M.crowd(ctx, pips, t);
    },
  };
}
