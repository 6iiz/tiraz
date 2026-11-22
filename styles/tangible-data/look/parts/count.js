// A number as a made thing: plates fall one after another onto the stone base and stack in columns of ten (every fifth plate a darker
// accent "ruler" plate, so the stack is its own scale). When the value is a whole number from 1 to 40, one plate is one unit and the
// figure counts up with each plate that lands: the stack is the number. Otherwise the stack is a fixed twenty plates that only keeps
// time with the count and claims no unit. A reading is pinned to the top plate by a dot and a hairline leader; the figure and its label
// sit above it on the plain sweep. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  if (typeof S.value !== 'number') throw new Error('the count spec\'s "value" must be a number');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette;
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const unit = Number.isInteger(S.value) && S.value >= 1 && S.value <= 40;
  const n = unit ? S.value : 20, cols = Math.ceil(n / 10);
  const PL = { ...T.plate, thick: 26 }, floor = T.floor, pitch = PL.thick + PL.gap, cw = 230, cg = 50;
  const groupW = cols * cw + (cols - 1) * cg, gx = (W - groupW) / 2;
  const colX = (c) => (rtl ? gx + groupW - (c + 1) * cw - c * cg : gx + c * (cw + cg));
  const yNum = SAFE.top + 40 + size * 0.55, yLabel = yNum + size * 0.62 + 30 + label.lead / 2;
  const t0 = at + 0.15, t1 = at + 1.6, dt = (t1 - t0) / n;
  const landAt = (k) => t0 + k * dt + T.dur.fall * 0.8;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const up = M.lift(span(t, d - T.dur.out, d)), fade = 1 - up;
      M.base(ctx, SAFE.left - 30, SAFE.right + 30, floor, P, rtl, span(t, at - 0.3, at + 0.2));
      let landed = 0, topY = floor, topX = colX(0) + cw / 2; // the last plate down carries the reading
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, -up * 120);
      for (let k = 0; k < n; k++) {
        const p = span(t, t0 + k * dt, t0 + k * dt + T.dur.fall * 0.8);
        if (p <= 0) break;
        if (p >= 1) landed = k + 1;
        const c = Math.floor(k / 10), r = k % 10, j = M.jitter(7, k), x = colX(c) + j.x, yr = floor - (r + 1) * pitch;
        if (r === 0) M.shadow(ctx, colX(c), floor - PL.thick, cw, PL.thick, PL.depth, P, rtl, Math.min(1, p) * 0.5, 1.2);
        M.box(ctx, x, yr + M.fall(p, 320), cw + j.w, PL.thick, PL.depth, r % 5 === 4 ? P.ruler : P.metal, rtl, 1);
        if (p >= 1) { topY = yr; topX = x + (cw + j.w) / 2; }
      }
      ctx.restore();
      // the reading, pinned to the top plate
      const pr = span(t, t0 + 0.1, t0 + 0.4) * fade;
      if (pr > 0 && landed > 0) {
        const v = M.view(rtl), dx = topX + PL.depth * 0.5 * v.kx, dy = topY + PL.depth * 0.5 * v.ky, yTop = yLabel + label.height - label.lead / 2 + 26;
        ctx.save(); ctx.globalAlpha = pr; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, yTop); ctx.stroke();
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(dx, dy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(dx, yTop, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const shown = unit ? landed : countValue(0, S.value, span(t, t0, t1), M.E);
      ctx.save(); ctx.globalAlpha = M.E(span(t, at, at + 0.25)) * fade; ctx.translate(0, -up * 60);
      kit.number(ctx, text(shown), { x: rtl ? x1 : x0, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: unit ? (landed === n ? 1 : 0) : span(t, t0, t1) });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, -up * 60);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.muted,
        each: (w, i, box, c) => { const tw = at + 0.3 + i * T.dur.stagger; if (M.setDown(c, span(t, tw, tw + T.dur.word), label.size) === false) return false; } });
      ctx.restore();
    },
  };
}
