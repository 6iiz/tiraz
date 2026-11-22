// Before and after as two channels. On the upper channel the old value sits over a ragged, noisy signal; then the signal goes flat (the
// old thing stops carrying anything) and its words cool to a dim afterimage. On the lower channel the beam sweeps in a clean, strong wave
// from the reading side, and the new value lights above it in the full beam colour as the beam passes.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, g = ground.g;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const nowText = asText(S.now).replace(/\*/g, '').split(/\s+/).filter(Boolean).map((w) => '*' + w + '*').join(' ');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const [was, now] = kit.fitAll([asText(S.was).replace(/\*/g, ''), nowText], { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, single: true, where: 'the compare label' }) : null;
  const wave = 70, head = label ? label.lead + 30 : 0, blk = was.height + wave * 2 + 50, block = head + blk * 2 + 30;
  const top = kit.place(block, 700), yLabel = top + (label ? label.lead / 2 : 0);
  const yWas = top + head + was.lead / 2, b1 = top + head + was.height + 30 + wave;
  const yNow = top + head + blk + 30 + now.lead / 2, b2 = top + head + blk + 30 + now.height + 30 + wave;
  const sLabel = label && M.lightText(kit, label, { x0, x1, y: yLabel, align: 'start' }, pal, T, pal.soft);
  const sWas = M.lightText(kit, was, { x0, x1, y: yWas, align: 'start' }, pal, T, pal.soft);
  const sNow = M.lightText(kit, now, { x0, x1, y: yNow, align: 'start' }, pal, T);
  const r = rng(91), noise = Array.from({ length: 400 }, () => r() * 2 - 1);
  const tCut = at + 0.9, tFlat = tCut + 0.3, tNow = tFlat + 0.1, sw = 0.6, out0 = d - T.dur.out;
  const xa = rtl ? g.x1 : g.x0, xb = rtl ? g.x0 : g.x1;
  const good = M.curve(xa, xb, (x) => b2 - Math.sin((x - g.x0) / 40) * wave * 0.9, 4);
  const pass = (x) => tNow + sw * Math.abs(x - xa) / Math.abs(xb - xa);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = t < out0 ? 1 : Math.exp(-(t - out0) / 0.09);
      if (sLabel) sLabel.draw(ctx, () => (t >= at ? 0.9 * fade : 0), () => M.cool(t - at, T.dur.heat, 0));
      // the old channel: noise that dies to a flat line
      const on = span(t, at, at + 0.25), amp = wave * 0.75 * (1 - M.E(span(t, tCut, tFlat))), f = Math.floor((t + clock) * 30);
      if (on > 0) {
        const pts = M.curve(g.x0, g.x1, (x) => { const i = Math.floor((x - g.x0) / 12); return b1 - (noise[(i + f * 7) % 400] * 0.7 + Math.sin(x / 23 + t * 9) * 0.3) * amp; }, 12);
        M.trace(ctx, pts, pal, { head: 1, alpha: fade * on * (t < tFlat ? 0.9 : 0.5), width: 2.2, spot: false });
      }
      sWas.draw(ctx, () => (t >= at + 0.1 ? (t < tCut ? 0.9 : M.cool(t - tCut, 0.25, 0.3)) * fade : 0), () => (t < tCut ? M.cool(t - at - 0.1, T.dur.heat, 0) : 0));
      // the new channel: one clean sweep
      if (t >= tNow) M.trace(ctx, good, pal, { head: span(t, tNow, tNow + sw), alpha: fade, width: 3.2, age: (k) => M.cool(t - pass(good[k][0]), T.dur.tau, 0.55) });
      const lv = (i) => M.cool(t - pass(sNow.boxes[i].x + sNow.boxes[i].width / 2), T.dur.tau, 0.8) * fade;
      sNow.draw(ctx, lv, (i) => M.cool(t - pass(sNow.boxes[i].x + sNow.boxes[i].width / 2), T.dur.heat * 1.5, 0));
    },
  };
}
