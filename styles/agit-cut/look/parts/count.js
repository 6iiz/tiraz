// A number counted by the cuts: a grid of eight small film windows lights one cell per sixteenth, and the figure steps up with every
// cell (eight steps, the last one exact). When the grid is full the figure is slammed onto a red block on an ink beam; the label is
// stacked under it as ink beams. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, room = maxW - 80;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 80, minScale: 0.8, where: 'the count label' });
  const cols = 4, rowsN = 2, gapC = 14, cw = (maxW - gapC * (cols - 1)) / cols, ch = 150;
  const gridH = rowsN * ch + gapC, blockH = size * 1.12, labH = label.rows.length * (label.size * 1.6 + 12);
  const top = kit.place(gridH + 50 + blockH + 40 + labH, 760);
  const yBlock = top + gridH + 50, yLab = yBlock + blockH + 40;
  const n = cols * rowsN, tCell = (i) => at + 0.1 + i * T.dur.step, tLand = tCell(n - 1) + T.dur.step;
  // cells light in reading order: from the reading side, row by row
  const cell = (i) => { const r = Math.floor(i / cols), c = i % cols, cc = rtl ? cols - 1 - c : c; return [SAFE.left + cc * (cw + gapC), top + r * (ch + gapC)]; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), o = M.I(out);
      let lit = 0;
      for (let i = 0; i < n; i++) {
        const t0 = tCell(i); if (t < t0) continue; lit++;
        const [x, y] = cell(i), oy = o * (i % 2 ? 1 : -1) * H * 0.8;
        const c = M.cutAt(t, t0, T.beat * 2, i);
        M.window(ctx, x, y + oy, cw, ch, c.k, c.u, t, P, 4);
        if (t - t0 < 1 / 30) { ctx.fillStyle = P.paper; ctx.globalAlpha = 0.6; ctx.fillRect(x, y + oy, cw, ch); ctx.globalAlpha = 1; }   // one paper frame as the cell lights
      }
      // the figure steps with the cells, then lands on the red block
      const p = lit / n, landed = t >= tLand, pb = M.E(span(t, tLand, tLand + T.dur.slam));
      const dx = (rtl ? 1 : -1) * o * W, dy = M.kick(t - tLand - T.dur.slam, 8);
      ctx.save(); ctx.translate(dx, dy);
      ctx.fillStyle = P.ink; ctx.fillRect(SAFE.left + 14, yBlock + 14, maxW, blockH);
      ctx.fillStyle = landed ? P.red : P.ink;
      const bw = landed ? maxW * (0.35 + 0.65 * pb) : maxW;
      ctx.fillRect(rtl ? SAFE.right - bw : SAFE.left, yBlock, bw, blockH);
      if (lit > 0) kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: SAFE.left + maxW / 2, y: yBlock + blockH / 2 + size * 0.04, size, color: landed ? P.onRed : P.paper, settle: landed ? 1 : 0 });
      ctx.restore();
      label.rows.forEach((r, k) => {
        const t0 = tLand + 0.12 + k * T.dur.step, q = span(t, t0, t0 + T.dur.slam); if (q <= 0) return;
        const side = k % 2 ? 1 : -1, ox = ((1 - M.E(q)) * side - o * side) * W;
        M.beamRow(kit, ctx, label, r, { x0: SAFE.left, x1: SAFE.right - k * 40, y: yLab + k * (label.size * 1.6 + 12) + label.size * 0.8, pad: 22, fill: P.ink, ink: P.paper, keyFill: P.red, keyInk: P.onRed, dx: ox });
      });
    },
  };
}
