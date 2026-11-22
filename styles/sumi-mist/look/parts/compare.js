// Before and after in ink: the old value blooms in a pale middle tone; one fast, dry diagonal stroke of the darkest ink cuts through it,
// and it sinks back toward the paper, blurred like a word seen through mist. Then the new value blooms in full ink below, over a pale
// swash with the seal at its tail. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right - 20, maxW = x1 - x0 - 60;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: T.weight.line, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const hL = label ? label.lead + 40 : 0, gapV = 90;
  const top = kit.place(hL + was.height + gapV + now.height, 640);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + hL + was.lead / 2, yNow = top + hL + was.height + gapV + now.lead / 2;
  const tCut = at + 0.95, tNow = at + 1.45;
  // the cut: a dry diagonal across the old value's real extent
  const wb = M.boxes(was, { x0, x1, y: yWas, rtl }), wx0 = Math.min(...wb.map((b) => b.x)), wx1 = Math.max(...wb.map((b) => b.x + b.width));
  const yb = Math.max(...wb.map((b) => b.y));
  const ca = rtl ? [wx1 + 40, yWas - was.size * 0.55] : [wx0 - 40, yWas - was.size * 0.55], cb = rtl ? [wx0 - 50, yb + was.size * 0.5] : [wx1 + 50, yb + was.size * 0.5];
  const cut = M.stroke([ca, [(ca[0] * 0.55 + cb[0] * 0.45), (ca[1] * 0.45 + cb[1] * 0.55) - 6], cb], { w: Math.max(16, was.size * 0.2), seed: 91, dry: 0.75, bristles: 16, lift: 0.1 });
  // the new value's swash, under all of it
  const nb = M.boxes(now, { x0, x1, y: yNow, rtl });
  const sw = nb.filter((b) => b.row === 0), nx0 = Math.min(...sw.map((b) => b.x)), nx1 = Math.max(...sw.map((b) => b.x + b.width));
  const swash = M.swash(nx0, nx1, yNow, now.size, rtl, 93);
  const tail = swash.P[Math.floor(0.86 * (swash.P.length - 1))];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), fade = 1 - M.I(out);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey,
        each: (w, i, box, c) => M.bloom(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), out, pal.ink, label.size) });
      // the old value: after the cut it sinks into the paper but stays legible as what was
      const sink = M.E(span(t, tCut + 0.2, tCut + 0.8));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.quiet(T.tone.zhong), key: pal.quiet(T.tone.zhong),
        each: (w, i, box, c) => {
          if (M.bloom(c, span(t, at + 0.2 + i * T.dur.step, at + 0.2 + i * T.dur.step + T.dur.in), out, pal.ink, was.size) === false) return false;
          if (sink > 0) { c.globalAlpha *= 1 - 0.45 * sink; c.shadowColor = pal.rgba(pal.ink, 0.5); c.shadowBlur = was.size * 0.12 * sink; }
        } });
      M.paint(ctx, cut, M.B(span(t, tCut, tCut + 0.22)), pal.ink, fade);
      M.paint(ctx, swash, M.B(span(t, tNow - 0.25, tNow - 0.25 + T.dur.stroke)), pal.tone(T.tone.wash), fade);
      ctx.save(); ctx.globalAlpha = fade; M.seal(ctx, rtl ? nx1 - 14 : nx0 + 14, yNow + now.size * 0.58, T.size.seal, pal, span(t, tNow + 0.55, tNow + 0.75)); ctx.restore();
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.ink, key: pal.ink,
        each: (w, i, box, c) => M.bloom(c, span(t, tNow + i * T.dur.step, tNow + i * T.dur.step + T.dur.in), out, pal.ink, now.size) });
    },
  };
}
