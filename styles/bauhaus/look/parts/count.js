// A number in a circle: a large accent circle rolls in from the far end of the reading line (a small ink dot on its rim shows it
// turning) and stops with weight; the numeral counts up inside it in the ink that reads on the accent. An ink square stands behind
// the circle, a heavy mid-tone diagonal runs under it, and the label is set solid on an ink slab below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, heavy, square, bar } = await import(look.base + 'motion.js');
  const P = ground.P, dir = ground.dir, sx = ground.sx, rtl = ground.rtl;
  const pad = T.size.label * T.bar.pad, maxW = SAFE.right - SAFE.left - pad;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 2 * 440 - 120 && size > 110) size -= 8;
  const wNum = kit.numberWidth(text(S.value), size, 900, 1), r = Math.min(440, Math.max(size * 0.72, wNum / 2 + 60));
  const block = 2 * r + 80 + label.height, top = kit.place(block, 720);
  const cx = Math.max(SAFE.left + r * 0.6, Math.min(W - SAFE.left - r * 0.6, sx(W / 2 - 40 + 0))), cy = top + r;
  const yLabel = top + 2 * r + 80 + label.lead / 2;
  const x0 = rtl ? SAFE.left + pad : SAFE.left, x1 = rtl ? SAFE.right : SAFE.right - pad, bh = label.size * T.bar.h;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), gone = (p) => (out > 0 ? Math.max(0, p - out * 1.4) : p);
      bar(ctx, gone(span(t, at, at + 0.6)), sx(-20), cy + r * 0.9, sx(1100), cy - r * 1.3, 46, P.mid);
      square(ctx, gone(span(t, at + 0.1, at + 0.75)), cx - dir * r * 0.75, cy - r * 0.7, r * 0.9, P.ink, { x: 0, y: -700 });
      // the roll: distance travelled turns the circle, so the rim dot turns by distance / radius
      const q = heavy(gone(span(t, at, at + 0.9))), dist = (1 - q) * (r * 2 + 600), x = cx - dir * dist;
      if (q > 0 || t >= at) {
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
        const a = -Math.PI / 4 + (dir * dist) / r;
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86, r * 0.07, 0, Math.PI * 2); ctx.fill();
        const p = span(t, at + 0.55, at + 1.6);
        if (t >= at + 0.5 && out < 0.5) {
        ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.clip();
        kit.number(ctx, text(countValue(0, S.value, p)), { x, y: cy + size * 0.04, size, color: P.on, settle: p });
        ctx.restore(); }
      }
      label.rows.forEach((row, k) => {
        const y = yLabel + k * label.lead, a = rtl ? x1 - row.width - pad : 0, b = rtl ? W : x0 + row.width + pad;
        ctx.save(); ctx.translate(-dir * W * out ** 2, 0);
        ground.slab(ctx, span(t, at + 0.7 + k * 0.08, at + 0.7 + k * 0.08 + T.dur.in), a, b, y, bh, P.ink);
        ctx.restore();
      });
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.paper, key: P.on,
        each: (w, i, box, c) => {
          const t0 = at + 0.85 + i * T.dur.step;
          if (arrive(c, span(t, t0, t0 + T.dur.in), box, label.size, dir) === false) return false;
          if (leave(c, out, box, label.size, dir) === false) return false;
        } });
    },
  };
}
