// Before and after in real time: the label in a top cell; under it two cameras side by side. The old value is on the reading side; at
// its call it is struck and its chip goes grey (no longer live). The new cell waits with a grey pending mark; at zero its value cuts in,
// and the new cell closes over the old one into one picture while the clock flips. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock: clk, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, A = T.area, gut = T.gutter;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: clk });
  const M = await import(look.base + 'motion.js'), P = ground.palette, mono = ground.mono, vig = M.vignette(P);
  const x0 = Math.max(A.x0 + 40, SAFE.left + 6), x1 = Math.min(A.x1 - 40, SAFE.right - 6);
  const half = (A.x1 - A.x0 - gut) / 2;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: half - 70, single: true, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minPx: 44, where: 'the compare label' }) : null;
  const hL = label ? Math.round(label.height + 70) : 0, hV = Math.round(was.size * 1.6 + 170);
  const top = A.y0 + Math.max(0, Math.round((A.y1 - A.y0 - hL - gut - hV) / 2) - 60);
  const RL = { x: A.x0, y: top, w: A.x1 - A.x0, h: hL }, vy = top + (label ? hL + gut : 0);
  const RW = { x: rtl ? A.x0 + half + gut : A.x0, y: vy, w: half, h: hV }, RN = { x: rtl ? A.x0 : A.x0 + half + gut, y: vy, w: half, h: hV };
  const both = { x: A.x0, y: vy, w: A.x1 - A.x0, h: hV };
  const cutT = at + 0.85, zero = at + 1.4;
  const inner = (R) => ({ x0: Math.max(R.x + 30, SAFE.left + 6), x1: Math.min(R.x + R.w - 30, SAFE.right - 6) });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.clock(ctx, t, zero, P, mono, rtl, M.clockBox(T, rtl));
      const m = M.snap(span(t, zero, zero + T.dur.merge)), cut = t >= cutT;
      if (label) { M.cell(ctx, RL, P, mono, rtl, { vignette: vig, chip: 0 }); kit.drawText(ctx, label, { x0, x1, y: RL.y + RL.h / 2 - ((label.rows.length - 1) * label.lead) / 2, align: 'start', color: P.muted }); }
      // the old camera
      if (m < 1) {
        M.cell(ctx, RW, P, mono, rtl, { vignette: vig, code: 'CAM 1', live: !cut });
        const I = inner(RW), yv = RW.y + RW.h / 2 + 16;
        kit.drawText(ctx, was, { x0: I.x0, x1: I.x1, y: yv, color: cut ? P.muted : P.text, key: cut ? P.muted : P.text });
        if (cut) { const w = (was.width + 30) * M.snap(span(t, cutT, cutT + 0.1)), cx = (I.x0 + I.x1) / 2; ctx.fillStyle = P.accent; ctx.fillRect(cx - w / 2, yv + 2, w, 6); }
      }
      // the new camera closes over the old one at zero
      const R = M.lerpRect(RN, both, m);
      M.cell(ctx, R, P, mono, rtl, { vignette: vig, code: t >= zero ? 'CAM 2' : 'CAM 2', live: t >= zero, chip: 1 - m });
      const I = inner(R), yv = R.y + R.h / 2 + 16 * (1 - m);
      if (t >= zero) kit.drawText(ctx, now, { x0: I.x0, x1: I.x1, y: yv, color: P.keyText, key: P.keyText });
      else { ctx.fillStyle = P.pending; const w = 90, on = Math.floor(t * 4) % 2 === 0; if (on) ctx.fillRect((I.x0 + I.x1) / 2 - w / 2, yv - 3, w, 6); }
    },
  };
}
