// A number as a title card on the endless stair: a giant numeral in paper, set flush to the reading side, cuts through its values
// in hard steps a few frames apart (no rolling digits, each value is its own card), and on the last value an accent block cuts in
// behind it. The label sits under it on paper fields, its words cutting in one by one. The strobe behind repeats the number.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, room: 'stairs' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 - 80 && size > 120) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 900, 1);
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.9, minPx: 44, where: 'the count label' });
  const top = kit.place(size * 1.2 + 60 + label.height, 640), yNum = top + size * 0.6, yLab = top + size * 1.2 + 60 + label.lead / 2;
  const steps = 7, st = M.cuts(steps, at + 0.12, T).map((x, i) => x + i * 0.05), land = st[steps - 1];
  const n = label.rows.reduce((s, r) => s + r.words.length, 0), lt = M.cuts(n, at + 0.45, T);
  const boxes = M.rowBoxes(kit, label, x0, x1, yLab);
  const rowFirst = []; { let i = 0; for (const r of label.rows) { rowFirst.push(i); i += r.words.length; } }
  const giant = kit.fit(text(S.value), { size: T.size.ghost * 1.3, weight: 900, maxW: 4000, single: true, overflow: true, where: 'the strobe number' });
  const bx = rtl ? x1 - numW : x0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t / d);
      const off = M.gone(t, d, 1 + label.rows.length, T);
      let k = 0; for (let i = 0; i < steps; i++) if (t >= st[i]) k = i + 1;
      if (k === 0) return;
      if (t >= land && off === 0) {
        const odd = Math.floor((t - land) / T.beat) % 2;
        kit.drawText(ctx, giant, { x0: odd ? -giant.width * 0.2 : W - giant.width * 0.8, x1: (odd ? -giant.width * 0.2 : W - giant.width * 0.8) + giant.width, y: odd ? 1250 : 380, align: 'start', color: pal.ghost, key: pal.ghost, decor: true });
      }
      if (off < 1 + label.rows.length) {
        const won = t >= land;
        if (won) { ctx.fillStyle = pal.accent; const pad = size * 0.16; ctx.fillRect(rtl ? bx - pad : 0, yNum - size * 0.62, rtl ? W - bx + pad : bx + numW + pad, size * 1.24); }
        const v = k >= steps ? S.value : countValue(0, S.value, k / steps, (x) => x);
        kit.number(ctx, text(v), { x: rtl ? x1 : x0, y: yNum, size, color: won ? pal.onAccent : pal.paper, align: rtl ? 'right' : 'left', settle: 1 });
      }
      label.rows.forEach((_, r) => { if (label.rows.length - 1 - r >= off) M.field(ctx, W, boxes[r], label.size, M.opens(t, lt[rowFirst[r]] - 2 * T.frame, T), pal.paper, rtl); });
      kit.drawText(ctx, label, { x0, x1, y: yLab, align: 'start', color: pal.ink, key: pal.ink,
        each: (w, i, box) => { if (t < lt[i] || label.rows.length - 1 - box.row < off) return false; } });
    },
  };
}
