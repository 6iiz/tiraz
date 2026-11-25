// A number: a wide board with the number painted big, and the label on a plate under it. The board falls into place, then its
// number rolls up to the value (one value per frame, steps shrinking towards the end) and lands.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 + Math.round(clock) });
  const rg = R3.region, tn = R3.tn, pad = 2 * T.sign.padX;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const final = text(S.value);
  let size = T.size.count; while (kit.numberWidth(final, size, 900) > rg.w - pad - 40 && size > 120) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: rg.w - pad, minScale: 0.88, lead: 1.3, where: 'the count label' });
  const nw = Math.max(kit.numberWidth(final, size, 900) + pad + 60, Math.min(rg.w, 460)), nh = Math.round(size * 1.18);
  const bl = R3.boardSize(label);
  const ys = R3.stack([nh, bl.h], T.layout.centre - 20);
  const paintNum = (str, settle) => (g, w, h) => {
    R3.plate(g, w, h);
    kit.number(g, str, { x: w / 2, y: h / 2 + size * 0.05, size, weight: 900, color: tn.ink, align: 'center', settle, decor: true });
  };
  const roll = (t) => span(t, at + 0.32, at + 1.12);
  const valAt = (t) => { const p = roll(t); return p >= 1 ? final : text(countValue(0, S.value, Math.floor(p * 20) / 20, ease.outCubic)); };
  const num = R3.sign({ cx: rg.cx, cy: ys[0], wpx: nw, hpx: nh, depth: 22, paint: paintNum(valAt(at - 1), 0), text: final });
  const lab = R3.sign({ cx: rg.cx, cy: ys[1], wpx: bl.w, hpx: bl.h, depth: 12, paint: R3.textPaint(label, {}), text: label.rows.map((r) => r.words.map((w) => w.w).join(' ')).join(' ') });
  let shown = null;
  return {
    duration: d,
    draw(ctx, t) {
      const v = valAt(t), settle = roll(t) >= 1 ? 1 : 0, key = v + '|' + settle;
      if (key !== shown) { num.repaint(paintNum(v, settle)); shown = key; }
      num.pose(t, at); lab.pose(t, at + 0.5);
      R3.draw(ctx, t);
      num.rec(v); lab.rec();
    },
  };
}
