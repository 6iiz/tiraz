// A number on the cartoon stage: a sunburst of painted rays turns slowly behind a title card; the numeral climbs to its value in four
// beats, and on every beat it lands again with a squash (a fresh drawing), set in ink over an accent offset like old poster lettering.
// The label sits under a fine rule; the fellow dances below and cheers when the last value lands.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const cx0 = SAFE.left + 4, cx1 = SAFE.right - 4, x0 = cx0 + 60, x1 = cx1 - 60;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.85, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 - 40 && size > 110) size -= 8;
  const pad = 64, top = kit.place(size * 1.1 + 40 + label.height + 2 * pad, 680), yNum = top + pad + size * 0.55, yRule = yNum + size * 0.62, yLabel = yRule + 34 + label.lead / 2;
  const bot = yLabel + label.height - label.lead / 2 + pad, cy = (top + bot) / 2;
  const runs = M.keyRuns(label, { x0, x1, y: yLabel }, kit.rtl);
  const beats = [0, 1, 2, 3].map((k) => at + 0.25 + k * T.beat), last = beats[3];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      // sunburst behind the card
      ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(tt * 0.12); ctx.fillStyle = rgba(P.dark, 0.08);
      for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1100, a, a + Math.PI / 30); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      M.fellow(ctx, P, W / 2, T.stage.fellowY, T.stage.fellowS, tt + clock, T.beat, tt >= last && tt < last + 1 ? 'cheer' : 'dance');
      const pc = span(tt, at, at + T.pop.card); if (pc <= 0) return;
      ctx.save(); M.popAt(ctx, pc, W / 2, bot);
      M.card(ctx, P, cx0, top, cx1, bot);
      let k = -1; for (let i = 0; i < 4; i++) if (tt >= beats[i]) k = i;
      if (k >= 0) {
        const v = countValue(0, S.value, (k + 1) / 4, (x) => x), str = text(k === 3 ? S.value : v);
        const p = span(tt, beats[k], beats[k] + T.pop.word * 1.2);
        ctx.save(); M.popAt(ctx, p, W / 2, yNum + size * 0.42);
        kit.number(ctx, str, { x: W / 2 + 10, y: yNum + 10, size, color: P.accent, decor: true });
        kit.number(ctx, str, { x: W / 2, y: yNum, size, color: P.ink });
        ctx.restore();
      }
      const rw = (x1 - x0) * span(tt, at + 0.2, at + 0.6);
      ctx.fillStyle = P.ink; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 3);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, color: P.grey, key: P.ink,
        each: (w, i, box, c) => { if (M.popAt(c, span(tt, at + 0.35 + i * 0.08, at + 0.35 + i * 0.08 + T.pop.word), box.x + box.width / 2, box.y + label.size * 0.5) === false) return false;
          if (w.key) { if (runs[i] !== 'skip') M.cartouche(c, P, runs[i], label.size); return P.onAccent; } } });
      ctx.restore();
    },
  };
}
