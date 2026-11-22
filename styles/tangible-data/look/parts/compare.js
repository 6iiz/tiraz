// Before and after, as objects. Two numbers stand as two stacks on one base, built with the same plate so their heights are true to
// each other (the larger is twenty plates; the smaller is in proportion, to the nearest plate): the old one in metal, the new one in the
// accent, each with its value pinned above it. Two words are two blocks: the old one stands on the base, is lifted, set back small and
// grey at the far side, and the new one falls into the hero place in the accent.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0, floor = T.floor, PL = T.plate;
  const numeric = typeof S.was === 'number' && typeof S.now === 'number' && S.was >= 0 && S.now >= 0 && Math.max(S.was, S.now) > 0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the compare label' }) : null;
  let yLabel = SAFE.top + 40 + (label ? label.lead / 2 : 0);
  const cutT = at + 0.9, nowT = at + 1.3;
  const labelDraw = (ctx, t, fade) => {
    if (!label) return;
    ctx.save(); ctx.globalAlpha = fade;
    kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.muted,
      each: (w, i, box, c) => { const tw = at + i * T.dur.stagger; if (M.setDown(c, span(t, tw, tw + T.dur.word), label.size) === false) return false; } });
    ctx.restore();
  };

  if (numeric) {
    const big = Math.max(S.was, S.now), nW = Math.max(S.was > 0 ? 1 : 0, Math.round((S.was / big) * 20)), nN = Math.max(S.now > 0 ? 1 : 0, Math.round((S.now / big) * 20));
    const [vw, vn] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare * 0.8, weight: 800, maxW: maxW / 2 - 30, single: true, where: 'a compared value' });
    const cw = 190, pitch = 16 + 3, xa = rtl ? W / 2 + 70 : W / 2 - 70 - cw, xb = rtl ? W / 2 - 70 - cw : W / 2 + 70;   // the old on the reading side
    const stack = (ctx, t, x, n, t0, t1, mat, seed) => {
      let topY = floor;
      for (let k = 0; k < n; k++) {
        const s = t0 + (k / n) * (t1 - t0), p = span(t, s, s + 0.22); if (p <= 0) break;
        const j = M.jitter(seed, k), y = floor - (k + 1) * pitch; topY = y;
        if (k === 0) M.shadow(ctx, x, floor - 16, cw, 16, PL.depth, P, rtl, 0.5, 1.3);
        M.box(ctx, x + j.x, y + M.fall(p, 300), cw + j.w, 16, PL.depth, mat, rtl, 1);
      }
      return topY;
    };
    return {
      duration: d,
      draw(ctx, t) {
        ground.draw(ctx, t);
        const up = M.lift(span(t, d - T.dur.out, d)), fade = 1 - up;
        labelDraw(ctx, t, fade);
        M.base(ctx, SAFE.left - 30, SAFE.right + 30, floor, P, rtl, span(t, at - 0.3, at + 0.2));
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, -up * 100);
        const ta = stack(ctx, t, xa, nW, at + 0.1, at + 0.8, P.metal, 3), tb = stack(ctx, t, xb, nN, nowT - 0.3, nowT + 0.4, P.acc, 5);
        const read = (f, x, y, color, p) => { if (p <= 0) return; ctx.save(); ctx.globalAlpha *= p; kit.drawText(ctx, f, { x0: x + cw / 2 - 200, x1: x + cw / 2 + 200, y: y - 40 - f.lead / 2 - (1 - M.E(p)) * 14, color, key: color }); ctx.restore(); };
        read(vw, xa, ta, P.muted, span(t, at + 0.8, at + 1.05));
        read(vn, xb, tb, P.ink, span(t, nowT + 0.4, nowT + 0.65));
        ctx.restore();
      },
    };
  }

  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 120, single: true, where: 'a compared value' });
  const fl = 940, bh = Math.round(was.size * 1.7), hw = Math.max(was.width, now.width) + 120, hx = rtl ? x1 - hw : x0, hy = fl - bh;
  // where the old block is set back: smaller, at the far side, further back on the base
  const k = 0.72, bx = rtl ? x0 - 10 : x1 + 10 - hw * k, byy = fl - 34 - bh * k;
  if (label) yLabel = hy - 110 - label.height + label.lead / 2;
  const block = (ctx, f, x, y, s, mat, ink, a) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    M.box(ctx, 0, 0, hw, bh, 40, mat, rtl);
    kit.drawText(ctx, f, { x0: 40, x1: hw - 40, y: bh / 2, color: ink, key: ink });
    ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const up = M.lift(span(t, d - T.dur.out, d)), fade = 1 - up;
      labelDraw(ctx, t, fade);
      M.base(ctx, SAFE.left - 30, SAFE.right + 30, fl, P, rtl, span(t, at - 0.3, at + 0.2));
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, -up * 100);
      // the old block: falls in, then is lifted and set back
      const pIn = span(t, at + 0.15, at + 0.15 + T.dur.fall), pBack = M.E(span(t, cutT, cutT + 0.45)), hop = Math.sin(Math.PI * span(t, cutT, cutT + 0.45)) * 120;
      if (pIn > 0) {
        const x = lerp(hx, bx, pBack), y = lerp(hy, byy, pBack) + M.fall(pIn, 300) - hop, s = lerp(1, k, pBack);
        if (pBack < 1) M.shadow(ctx, hx, hy, hw, bh, 40, P, rtl, pIn * (1 - pBack) * 0.8, 0.5);
        if (pBack > 0) M.shadow(ctx, bx, byy, hw * k, bh * k, 24, P, rtl, pBack * 0.6, 0.5);
        block(ctx, was, x, y, s, pBack > 0.5 ? P.metal : P.pale, P.ink, 1);
        if (pBack > 0) {                                    // the struck mark: a hairline cut across the set-back block
          const w = hw * k * M.E(span(t, cutT + 0.3, cutT + 0.6));
          ctx.fillStyle = P.ink; ctx.fillRect(rtl ? bx + hw * k - w : bx, byy + (bh * k) / 2, w, 3);
        }
      }
      const pN = span(t, nowT, nowT + T.dur.fall);
      if (pN > 0) {
        M.shadow(ctx, hx, hy, hw, bh, 40, P, rtl, pN * 0.8, 0.5);
        block(ctx, now, hx, hy + M.fall(pN, 420), 1, P.acc, P.onAccent, 1);
      }
      ctx.restore();
    },
  };
}
