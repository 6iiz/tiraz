// A number built of lit blocks: each dot of a pixel digit is a small cube, and the cubes fall into place column by column while a
// lamp swells behind them; then the value counts up, the digits rebuilding drawing by drawing, and lands with a flare. The whole
// sign floats gently in the focus band. The label is on a glass plate under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const pw = SAFE.right - SAFE.left, pad = 50;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const full = text(S.value), vox = M.canBlock(full);
  const s = vox ? Math.max(12, Math.min(T.size.cube, Math.floor((pw - 60) / (M.blockUnits(full) + 0.4)))) : 0;
  let nsize = 7 * T.size.cube; if (!vox) while (kit.numberWidth(full, nsize, 900, 1) > pw - 40 && nsize > 80) nsize -= 6;
  const nh = vox ? 7 * s : nsize;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: pw - 2 * pad, minPx: 44, where: 'the count label' });
  const ph = label.height + 2 * pad - 20, top = kit.place(nh + 80 + ph, 720), yNum = top + 20, py = top + nh + 80;
  const tIn = at, tCount = at + 0.55, tLand = at + 1.6;
  const ghost = M.cellsOf(text(0));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pout = M.in2(span(t, d - 0.35, d)), bob = Math.sin((t + clock) * 1.4) * 6;
      const flare = Math.max(0, 1 - Math.abs(t - tLand) / 0.5);
      M.bloom(ctx, ground.lampGlow, W / 2, yNum + nh / 2, 420 + 140 * flare, (0.35 + 0.4 * flare) * M.out3(span(t, tIn, tIn + 0.6)) * (1 - pout));
      ctx.save(); ctx.globalAlpha = 1 - pout; ctx.translate(0, bob + pout * 20);
      const q = Math.floor(span(t, tCount, tLand) * 10) / 10, str = t < tCount ? text(0) : text(countValue(0, S.value, q, (x) => x));
      if (vox) {
        const cells = t < tCount ? ghost : M.cellsOf(str), wpx = cells[0].length * s, x = W / 2 - wpx / 2 - s * 0.16;
        M.cubes(ctx, cells, x, yNum, s, P, (r, c) => {                     // each column falls in, then settles
          const p = span(t, tIn + c * 0.025, tIn + c * 0.025 + 0.45); if (p <= 0) return null; return -(1 - M.out3(p)) * 160;
        });
        kit.rec(x, x + wpx, yNum, yNum + nh, str);
      } else kit.number(ctx, str, { x: W / 2, y: yNum + nh / 2, size: nsize, color: P.l, align: 'center' });
      ctx.restore();
      const pin = M.out3(span(t, at + 0.35, at + 0.65));
      if (pin <= 0) return;
      ctx.save(); ctx.globalAlpha = 1 - pout; ctx.translate(0, (1 - pin) * 24 + pout * 22);
      M.plate(ctx, SAFE.left, py, pw, ph, P, pin);
      kit.drawText(ctx, label, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: py + pad - 10 + label.lead / 2, align: 'center', color: P.l, key: P.l,
        each: (w, i, box, c) => { if (M.rise(c, span(t, at + 0.45 + i * 0.06, at + 0.75 + i * 0.06), label.size) === false) return false;
          if (w.key) { M.keyPill(c, box, label.size, P); return P.onA; } } });
      ctx.restore();
    },
  };
}
