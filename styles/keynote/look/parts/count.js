// The giant number moment: one number fills the stage, centred, in a gradient of the accent (or of the light colour when the accent is
// too weak to read), with a pool of its own light behind it. It runs up fast and settles exactly. Under it a thin track fills as it
// counts, and the label sits on a panel. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, mix, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: maxW - 96, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 120) size -= 8;
  const yNum = 610, cx = W / 2, top = yNum - size * 0.4, bot = yNum + size * 0.4;
  const fill = (() => {
    const c = document.createElement('canvas').getContext('2d'), g = c.createLinearGradient(0, top, 0, bot);
    if (pal.keyOk) { g.addColorStop(0, mix(pal.accent, pal.light, 0.4)); g.addColorStop(1, pal.accent); }
    else { g.addColorStop(0, pal.light); g.addColorStop(1, mix(pal.light, pal.dark, 0.25)); }
    return g;
  })();
  const glow = M.pool(brand.colors.accent, 1100, 700, T.tone.glow * 1.2);
  const yTrack = bot + 70, trackW = 520;
  const cardW = label.width + 96, cardH = label.height + 48, yCard = yTrack + 60;
  const out0 = d - T.dur.out, run = at + 1.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at, run), out = span(t, out0, d), arr = span(t, at - 0.1, at + T.dur.in);
      ctx.save(); ctx.globalAlpha = M.E(arr) * (1 - M.S(out)) * (0.6 + 0.4 * M.E(p));
      ctx.drawImage(glow, cx - glow.width / 2, yNum - glow.height / 2); ctx.restore();
      ctx.save();
      const nb = { x: cx, y: yNum, width: 0 };
      if (M.arrive(ctx, arr, nb, size * 0.5) !== false && M.leave(ctx, out, nb, size * 0.5) !== false)
        kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: cx, y: yNum, size, color: fill, align: 'center', settle: p });
      ctx.restore();
      // the track: a hairline that fills with the count
      ctx.save(); ctx.globalAlpha = M.E(arr) * (1 - M.S(out));
      ctx.fillStyle = pal.border; ctx.fillRect(cx - trackW / 2, yTrack - 1, trackW, 2);
      const fw = trackW * M.E(p); ctx.fillStyle = pal.light; ctx.fillRect(rtl ? cx + trackW / 2 - fw : cx - trackW / 2, yTrack - 1.5, fw, 3);
      ctx.restore();
      const cp = span(t, at + 0.5, at + 0.5 + T.dur.in);
      ctx.save(); ctx.globalAlpha = 1 - M.S(out);
      M.card(ctx, cx - cardW / 2, yCard, cardW, cardH, T.radius.card, pal.s1, pal.border, cp);
      M.sheen(ctx, cx - cardW / 2, yCard, cardW, cardH, T.radius.card, span(t, at + 0.6, at + 0.6 + T.dur.sweep), pal.light, rtl);
      ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yCard + 24 + label.lead / 2, align: 'center', color: pal.light,
        each: (w, i, box, c) => {
          const t0 = at + 0.6 + i * T.dur.step;
          if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, label.size) === false) return false;
          if (M.leave(c, out, box, label.size) === false) return false;
        } });
    },
  };
}
