// A number, printed big on a card: it counts up while data cubes pop out of the card one by one into a stack on the far side, and the
// voxel toy rides the stack up, hopping onto each new cube. The label is printed under a hairline. The last cube is the accent.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rr, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, toy = M.toy(brand, P);
  const C = T.card, x0 = C.x0 + C.pad, x1 = C.x1 - C.pad, maxW = x1 - x0, colW = 150;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - colW && size > 110) size -= 8;
  const headH = 60, numH = Math.max(size * 1.15, 6 * 0 + 330), cardH = headH + numH + 24 + label.height + 40 + 26 + 34;
  const top = kit.place(cardH, 720), yNum = top + headH + numH / 2 + 6, yRule = top + headH + numH + 6, yLabel = yRule + 22 + label.lead / 2;
  const n = 5, cube = 58, cx = rtl ? C.x0 + C.pad + colW / 2 - 20 : C.x1 - C.pad - colW / 2 + 20, base = yRule - 14;
  const t0 = at + 0.15, t1 = at + 1.45, pop = (k) => t0 + ((k + 1) / n) * (t1 - t0) - 0.12;
  const stops = [{ t: 0, x: cx, y: base }];
  for (let k = 0; k < n; k++) stops.push({ t: pop(k) - 0.02, x: cx, y: base - (k + 1) * cube, height: 50 });
  return {
    duration: d,
    draw(ctx, t) {
      ctx.save(); M.camera(ctx, W, H, t, at, rtl);
      ground.draw(ctx, t);
      M.card(ctx, P, C.x0, top, C.x1 - C.x0, cardH, { r: C.r });
      M.printHead(ctx, P, C.x0, top, C.x1 - C.x0, rtl, brand);
      M.printFoot(ctx, P, C.x0, top + cardH - 26 - 30, C.x1 - C.x0, rtl, 2, 1);
      const p = span(t, t0, t1);
      kit.number(ctx, text(countValue(0, S.value, p)), { x: rtl ? x1 : x0, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: p });
      ctx.fillStyle = P.print; ctx.fillRect(x0, yRule, maxW, 3);
      ctx.fillStyle = P.accent; ctx.fillRect(rtl ? x1 - maxW * p : x0, yRule - 1, maxW * p, 5);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey });
      // the stack: each cube pops out of the card with a small overshoot
      for (let k = 0; k < n; k++) {
        const e = M.POP(span(t, pop(k), pop(k) + 0.22)); if (e <= 0) continue;
        const y = base - (k + 1) * cube, last = k === n - 1, f = last ? P.accent : mix(P.light, P.dark, 0.08 + k * 0.03);
        ctx.save(); ctx.translate(cx, y + cube); ctx.scale(1, e); ctx.translate(-cx, -(y + cube));
        M.card(ctx, P, cx - cube / 2, y, cube, cube - 8, { r: 8, fill: f, edge: last ? P.chipEdge : mix(f, P.dark, 0.3), thick: 8, shadow: k === 0 ? 1 : 0.4 });
        ctx.restore();
      }
      const tr = M.track(stops, t, 0.2);
      M.ring(ctx, P, cx, tr.y, tr.landed);
      M.drawToy(ctx, toy, tr.x, tr.y, { air: tr.air, sq: tr.sq, e: span(t, at, at + 0.3), time: t + clock, scale: 0.8 });
      ctx.restore();
    },
  };
}
