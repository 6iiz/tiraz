// Before and after with the same light. The old value gathers and kindles; then its points let go, its word cools to a dim ember,
// and the very same points fly down and gather again as the new value, which kindles in the accent's light with a swarm round it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: 820, single: true, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: 820, minPx: T.minPx, where: 'the compare label' }) : null;
  const lH = label ? label.height + 40 : 0, gap = 90, top = kit.place(lH + was.lead + gap + now.lead, 720);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lH + was.lead / 2, yNow = yWas + was.lead / 2 + gap + now.lead / 2;
  const X0 = SAFE.left + 40, X1 = SAFE.right - 40;
  const LB = label && M.lightText(kit, label, { x0: X0, x1: X1, y: yLabel, color: pal.lead, key: pal.key, gap: T.gap.small, seed: 50 });
  const ember = mix(pal.night, pal.lead, 0.62);
  const LW = M.lightText(kit, was, { x0: X0, x1: X1, y: yWas, color: pal.glow, key: pal.glow, gap: T.gap.line, seed: 51 });
  const LWe = M.lightText(kit, was, { x0: X0, x1: X1, y: yWas, color: ember, key: ember, gap: 400, seed: 53 });
  const LN = M.lightText(kit, now, { x0: X0, x1: X1, y: yNow, color: pal.key, key: pal.key, gap: T.gap.line, seed: 52 });
  // conservation: each point of the new value starts where a point of the old one sat
  const r = rng(54);
  for (const p of LN.pts) { const src = LW.pts[Math.floor(r() * LW.pts.length)] ?? p; p.from = { x: src.x, y: src.y }; p.key = true; }
  LN.runs = [{ x0: Math.min(...LN.boxes.map((b) => b.x)), x1: Math.max(...LN.boxes.map((b) => b.x + b.width)), y: yNow, first: 0, last: LN.boxes.length - 1 }];
  const letGo = at + 1.0, t1 = d - T.dur.out - 0.1, fly = 0.75, nowT = letGo + fly;
  const sk = M.sprite(pal.key, mix(pal.key, '#ffffff', 0.5));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (LB) { M.drawLight(ctx, LB, t, (i) => ({ t0: at + i * 0.05, g: 0.55, t1, q: T.dur.out }), { rest: 0.2 }); kit.drawText(ctx, label, { x0: X0, x1: X1, y: yLabel, each: () => false }); }
      // the old value: kindled, then its points leave and the word cools to an ember (still readable, quieter)
      const cool = M.S(span(t, letGo, letGo + 0.4)), gone = M.I(span(t, t1, t1 + T.dur.out));
      if (cool < 1) { ctx.save(); ctx.globalAlpha = 1 - cool; M.drawLight(ctx, LW, t, (i) => ({ t0: at + 0.1 + i * 0.06, g: 0.55, t1: 999, q: 1 }), { rest: T.tone.dotRest * (1 - cool), keyHalo: false }); ctx.restore(); }
      if (cool > 0 && gone < 1) { ctx.save(); ctx.globalAlpha = cool * (1 - gone); M.drawLight(ctx, LWe, t, () => ({ t0: -99, g: 0.01, t1: 999, q: 1 }), { rest: 0, keyHalo: false }); ctx.restore(); }
      // the travelling points: from the old word to the new one, on a curve
      const fp = span(t, letGo, nowT);
      if (fp > 0 && fp < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85;
        for (const p of LN.pts) {
          const e = M.S(Math.min(1, fp * (1 + p.dl))), sw = Math.sin(e * Math.PI) * (90 + p.R * 0.12) * (p.spin > 0 ? 1 : -1);
          const x = p.from.x + (p.x - p.from.x) * e + sw, y = p.from.y + (p.y - p.from.y) * e, s = p.s * (1 + 1.2 * Math.sin(e * Math.PI));
          ctx.drawImage(sk, x - s / 2, y - s / 2, s, s);
        }
        ctx.restore();
      }
      if (fp >= 1) M.drawLight(ctx, LN, t, () => ({ t0: nowT - 0.3, g: 0.3, t1, q: T.dur.out }), { rest: T.tone.dotRest });
      kit.drawText(ctx, was, { x0: X0, x1: X1, y: yWas, each: () => false });
      if (fp > 0.6) kit.drawText(ctx, now, { x0: X0, x1: X1, y: yNow, each: () => false });
    },
  };
}
