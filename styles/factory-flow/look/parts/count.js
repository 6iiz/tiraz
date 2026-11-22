// A number as a counting machine: a room with the accent frame holds a counter window, two gears beside it and a belt below. The
// light comes on, the gears turn and crates ride the belt past while the figure in the window counts up; the gears stop as it lands
// on the value. The label is printed on a plaque hung under the machine. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const gearW = 170, room = SAFE.right - SAFE.left - gearW - 80;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > room && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 80, minScale: 0.8, where: 'the count label' });
  const winH = size * 1.2, roomH = winH + 60 + 90, plH = label.height + 40;
  const top = kit.place(roomH + 60 + plH, 750), ry0 = top, ry1 = top + roomH;
  const rx0 = SAFE.left - 6, rx1 = SAFE.right + 6;
  const wx0 = rtl ? rx0 + gearW + 20 : rx0 + 30, wx1 = rtl ? rx1 - 30 : rx1 - gearW - 20, wy0 = ry0 + 40, wy1 = wy0 + winH;
  const gx = rtl ? rx0 + gearW / 2 + 10 : rx1 - gearW / 2 - 10;
  const py0 = ry1 + 60, py1 = py0 + plH;
  const run = (t) => span(t, at + 0.1, at + 1.5);
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, out0, d)), lit = span(t, at - 0.3, at) * (1 - span(t, out0, out0 + 0.15));
      M.room(ctx, rx0, ry0, rx1, ry1, P, lit);
      const p = run(t), turn = 7 * (1 - (1 - p) ** 2);
      M.belt(ctx, rx0 + 16, rx1 - 16, ry1 - 32, P, turn * 60 * (rtl ? -1 : 1));
      for (let k = 0; k < 3; k++) {                                     // crates ride past while it counts
        const q = span(t, at + 0.1 + k * 0.4, at + 0.9 + k * 0.4); if (q <= 0 || q >= 1) continue;
        const x = rtl ? rx1 - 40 - q * (rx1 - rx0 - 80) : rx0 + 40 + q * (rx1 - rx0 - 80);
        ctx.save(); ctx.beginPath(); ctx.rect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.clip(); M.crate(ctx, x, ry1 - 68, 44, P); ctx.restore();
      }
      M.gear(ctx, gx, wy0 + winH * 0.38, 62, turn, P.steel, P, 12);
      M.gear(ctx, gx + (rtl ? 30 : -30), wy0 + winH * 0.38 + 100, 40, -turn * 1.55 + 0.2, P.crate, P, 8);
      M.shape(ctx, M.rectPath(wx0, wy0, wx1 - wx0, wy1 - wy0, 8), P.night, P, 5, 0);
      kit.number(ctx, text(p > 0 ? countValue(0, S.value, p, (x) => 1 - (1 - x) ** 2) : 0), { x: (wx0 + wx1) / 2, y: (wy0 + wy1) / 2, size, weight: 800, color: P.light, settle: p });
      // the plaque, hung on two rods
      const dp = M.E(span(t, at + 0.2, at + 0.5));
      if (dp > 0) {
        ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, (1 - dp) * -50);
        ctx.fillStyle = P.line; ctx.fillRect(SAFE.left + 60, ry1 + 10, 8, 52); ctx.fillRect(SAFE.right - 68, ry1 + 10, 8, 52);
        M.plaque(ctx, SAFE.left + 20, py0, SAFE.right - 20, py1, P);
        kit.drawText(ctx, label, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: py0 + 20 + label.lead / 2, color: P.onPlaque });
        ctx.restore();
      }
    },
  };
}
