// A number as a range reading: a ping finds the numeral, which then counts up while a range ring in the accent opens out from the
// scope's centre to match it (the further the ring, the bigger the value), with a contact riding its edge. The label is found by the
// same ping, under the number. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 && size > 120) size -= 8;
  const hAll = size * 1.1 + 30 + label.height, top = kit.place(hAll, 600);
  const yNum = top + size * 0.55, yLabel = top + size * 1.1 + 30 + label.lead / 2;
  const dNum = Math.abs(yNum - ground.cy);
  const dLab = M.wordCentres(label, { x0, x1, y: yLabel, align: 'center', rtl }).map((p) => Math.hypot(p.x - ground.cx, p.y - ground.cy));
  const t0 = at + 0.03, speed = T.dur.speed, out0 = d - T.dur.out, hitN = t0 + dNum / speed;
  const quiet = [{ y0: top - 10, y1: top + hAll + 10 }];
  const a0 = Math.PI * 0.12, a1 = Math.PI * 0.88;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, quiet);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t0, speed), Math.max(dNum, ...dLab) + 300);
      const fade = 1 - span(t, out0, out0 + T.dur.out), p = span(t, hitN, hitN + 1.3), e = M.outC(p);
      if (p > 0 && fade > 0) {                                          // the range ring under the centre, opening with the count
        const R = 70 + 330 * e, a = a0 + (a1 - a0) * e;
        ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = pal.accent; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ground.cx, ground.cy, R, a0, a1); ctx.stroke();
        ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(ground.cx + Math.cos(a) * R, ground.cy + Math.sin(a) * R, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      const r = M.ret(t, t0, speed, dNum);
      if (r.on && fade > 0) {
        ctx.save(); ctx.globalAlpha = fade; if (r.flare > 0.02) { ctx.shadowColor = pal.light; ctx.shadowBlur = 30 * r.flare; }
        kit.number(ctx, text(countValue(0, S.value, p)), { x: W / 2, y: yNum, size, color: pal.echo, align: 'center', settle: p });
        ctx.restore();
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.soft,
        each: (w, i, b, c) => M.echo(c, M.ret(t, t0, speed, dLab[i]), pal.soft, pal, fade) });
    },
  };
}
