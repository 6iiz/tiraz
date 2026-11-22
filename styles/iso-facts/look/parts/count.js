// A number told the Isotype way: identical little crates drop one by one onto the square of the board, in neat rows, and the panel
// pinned above them counts with them, one step per crate that lands, so the number is built before it is read. The label settles
// under the number, a key phrase on the accent marker. Above 36 the crates stand for the amount instead of counting it one to one.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const pad = T.panel.pad, x0 = SAFE.left, x1 = SAFE.right, ix0 = x0 + pad, ix1 = x1 - pad, maxW = ix1 - ix0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 46, where: 'the count label' });
  const cardH = T.panel.top + size * 1.02 + label.height + pad * 0.6;
  const y0 = kit.place(cardH, 590), y1 = y0 + cardH, yNum = y0 + T.panel.top + size * 0.5, yLabel = y0 + T.panel.top + size * 1.02 + label.lead / 2;
  const runs = M.keyRuns(label, { x0: ix0, x1: ix1, y: yLabel, align: 'start' }, rtl);
  const v = Math.abs(Number(S.value)) || 0, n = Math.max(1, Math.min(36, v <= 36 ? Math.round(v) : 30));
  const cols = Math.min(6, Math.ceil(Math.sqrt(n * 1.4))), pitch = 1.08, rowsN = Math.ceil(n / cols);
  const gx = 7.0 - (cols * pitch) / 2, gy = 7.0 - (rowsN * pitch) / 2;
  const c0 = at + 0.45, c1 = at + 1.65, land = (k) => c0 + (n === 1 ? 0 : (k / (n - 1)) * (c1 - c0));
  const crates = Array.from({ length: n }, (_, k) => ({ k, x: gx + (k % cols) * pitch, y: gy + Math.floor(k / cols) * pitch })).sort((a, b) => a.x + a.y - b.x - b.y);
  const plaza = (t) => (ctx, P) => {
    for (const c of crates) {
      const p = span(t, land(c.k) - 0.28, land(c.k)); if (p <= 0) continue;
      const z = (1 - p * p) * 5;                                       // falls, lands without a bounce
      M.block(ctx, P, c.x, c.y, z, 0.84, 0.84, 0.84, c.k === n - 1 ? pal.hot : pal.blocks[1], { shade: p >= 1 });
    }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { plaza: plaza(t) });
      const pin = ground.at(7, 7, 1.6, t), out = M.OUT(span(t, d - T.dur.out, d)), top = [pin[0], y1];
      M.leader(ctx, pin, top, span(t, at, at + 0.25) * (1 - out), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, at + 0.16, at + 0.46)) * (1 - out), top[0], top[1]) === false) { ctx.restore(); return; }
      M.panel(ctx, x0, y0, x1, y1, pal, rtl);
      let k = 0; for (let i = 0; i < n; i++) if (t >= land(i)) k = i + 1;
      const p = k / n;
      kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: rtl ? ix1 : ix0, y: yNum, size, color: pal.ink, align: rtl ? 'right' : 'left', settle: p });
      for (const r of runs) { const s = at + 0.5 + r.first * 0.06; M.marker(ctx, r, label.size, span(t, s, s + 0.25), pal, rtl); }
      kit.drawText(ctx, label, { x0: ix0, x1: ix1, y: yLabel, align: 'start', color: pal.ink, key: pal.onAccent,
        each: (w, i, box, c) => { const s = at + 0.32 + i * 0.06; if (M.settle(c, span(t, s, s + T.dur.in), box) === false) return false; } });
      ctx.restore();
    },
  };
}
