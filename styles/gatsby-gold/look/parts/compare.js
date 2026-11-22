// Before and after as two tiers of a deco facade. The old value opens on a small plate in muted ivory and is struck by a double
// engraved line that runs out from the axis to both sides; the plate then sinks to the shade. A chevron points down, and the new value
// opens on a larger plate below, a row of bulbs lighting along its top and foot from the centre outward, the value cast in the metal.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, B = M.bulbs(pal);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const cx = W / 2, maxW = SAFE.right - SAFE.left - 140;
  const was = kit.fit(asText(S.was), { size: T.size.was, weight: 700, maxW: maxW - 120, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.now, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 200, single: true, where: 'the compare label' }) : null;
  const ww = Math.max(420, was.width + 120), wh = was.height + 60, nw = Math.min(SAFE.right - SAFE.left + 40, Math.max(600, now.width + 140)), nh = now.height + 110;
  const lH = label ? label.lead + 50 : 0, gap = 110;
  const top = kit.place(lH + wh + gap + nh, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lH + wh / 2, yNow = top + lH + wh + gap + nh / 2, yChev = top + lH + wh + gap / 2;
  const wo = { x0: cx - was.width / 2, x1: cx + was.width / 2, y: yWas - was.height / 2 + was.lead / 2, align: 'center' };
  const no = { x0: cx - now.width / 2, x1: cx + now.width / 2, y: yNow - now.height / 2 + now.lead / 2, align: 'center' };
  const rw = M.centreOut(kit, was, wo).rank, rn = M.centreOut(kit, now, no).rank;
  const tCut = at + 0.85, tNow = at + 1.2, tLand = tNow + T.dur.open + 0.1 + rn.length * T.dur.stagger + T.dur.in;
  const nb = Math.max(6, Math.floor((nw - 60) / 52));                            // bulbs along each long edge
  const shade = mix(pal.muted, pal.lacquer, 0.35);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d), keep = 1 - M.E(out), sh = M.sheenAt(time, 3.2);
      if (label) {
        M.flank(ctx, cx, yLabel, label.width / 2 + 26, 90, pal, span(t, at, at + 0.45) * keep, sh);
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: pal.muted,
          each: (w, i, box, c) => M.rise(c, span(t, at + i * T.dur.stagger, at + i * T.dur.stagger + T.dur.in), out, label.size) });
      }
      // the old tier
      const ow = M.opening(span(t, at + 0.1, at + 0.1 + T.dur.open), out), cut = M.E(span(t, tCut, tCut + 0.3));
      M.plate(ctx, cx, yWas, ww, wh, pal, { ...ow, sheen: sh, wings: false, step: 12 });
      if (ow.hf > 0.05) {
        ctx.save(); M.notched(ctx, cx, yWas, ww * ow.wf - 6, wh * ow.hf - 6, 8); ctx.clip();
        kit.drawText(ctx, was, { ...wo, color: cut > 0.5 ? shade : pal.muted, key: cut > 0.5 ? shade : pal.muted,
          each: (w, i, box, c) => { const t0 = at + 0.35 + rw[i] * T.dur.stagger; return M.rise(c, span(t, t0, t0 + T.dur.in), out, was.size); } });
        ctx.restore();
        if (cut > 0) {
          const half = (was.width / 2 + 40) * cut * (1 - M.E(span(out, 0, 0.5)));
          M.gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - half, wo.y - 3); c.lineTo(cx + half, wo.y - 3); c.moveTo(cx - half, wo.y + 9); c.lineTo(cx + half, wo.y + 9); }, 3, pal,
            M.metal(ctx, cx - was.width / 2, wo.y, cx + was.width / 2, wo.y, pal, sh));
        }
      }
      // the chevron between the tiers
      const pc = M.E(span(t, tNow - 0.15, tNow + 0.15)) * keep;
      if (pc > 0) for (let i = 0; i < 2; i++) {
        const y = yChev - 14 + i * 18;
        M.gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - 26 * pc, y - 10 * pc); c.lineTo(cx, y + 6); c.lineTo(cx + 26 * pc, y - 10 * pc); }, 2.4, pal);
      }
      // the new tier
      const on = M.opening(span(t, tNow, tNow + T.dur.open), out);
      M.plate(ctx, cx, yNow, nw, nh, pal, { ...on, sheen: sh });
      if (on.hf > 0.6) {
        for (let k = 0; k < nb; k++) {
          const f = (k + 0.5) / nb - 0.5, x = cx + f * (nw - 60), j = Math.abs(f) * 2;      // 0 at the axis, 1 at the ends
          const lvl = M.ignite(span(t, tNow + T.dur.open + j * 0.4, tNow + T.dur.open + j * 0.4 + 0.6)) * keep * (on.hf - 0.6) / 0.4;
          const chase = t > tLand + 0.3 ? 0.8 + 0.2 * Math.cos(j * 6 - (t - tLand) * 5) : 1;
          for (const y of [yNow - nh * on.hf / 2 + 26, yNow + nh * on.hf / 2 - 26]) B.draw(ctx, x, y, lvl * chase, 5.5);
        }
      }
      if (on.hf > 0.05) {
        ctx.save(); M.notched(ctx, cx, yNow, nw * on.wf - 8, nh * on.hf - 50, 10); ctx.clip();
        kit.drawText(ctx, now, { ...no, color: pal.gold, key: pal.gold,
          each: (w, i, box, c) => {
            const t0 = tNow + T.dur.open * 0.8 + rn[i] * T.dur.stagger;
            if (M.rise(c, span(t, t0, t0 + T.dur.in), out, now.size) === false) return false;
            c.fillStyle = M.metal(c, box.x, box.y - now.size / 2, box.x + box.width, box.y + now.size / 2, pal, M.sheenAt(time, 2.4), true);
          } });
        ctx.restore();
        M.sparkle(ctx, cx + now.width / 2 + 26, no.y - now.size * 0.62, now.size * 0.28, M.flare(t, tLand) * keep, pal);
      }
    },
  };
}
