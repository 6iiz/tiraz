// Before and after as a ruling in the file: the old value is typed in a soft ink and then barred out by a thick ink rule slammed across
// it; the new value is stamped beneath on an accent rubber block, turned off square, with a halftone burst printed around it.
// The label is set in paper on an ink file chip. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, wear = M.wearTile(P.paper, 77);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.8, weight: 600, maxW: maxW - 60, where: 'a compared value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: 900, maxW: maxW - 160, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 60, single: true, where: 'the compare label' }) : null;
  const chipH = label ? label.lead + 20 : 0, chipW = label ? label.width + 60 : 0;
  const sw = now.width + 110, sh = now.height + 70;
  const top = kit.place(chipH + 60 + was.height + 150 + sh, 680);
  const yWas = top + chipH + 60 + was.lead / 2, yNow = top + chipH + 60 + was.height + 150 + sh / 2;
  const tCut = at + 0.7, tNow = at + 1.15;
  const burst = M.dotField(W, 900, T.screen.step, 15, P.accent, (x, y) => { const r = Math.hypot((x - W / 2) / 1.6, y - 450) / 230; return r < 0.55 ? 0 : Math.max(0, 1 - Math.abs(r - 0.95) * 2.4) * 0.8; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.32, d);
      if (label) {
        const cx = rtl ? SAFE.right - chipW : SAFE.left;
        ctx.save();
        if (M.slam(ctx, (t - at) / 0.16, q, cx + chipW / 2, top + chipH / 2, 0.3) !== false) {
          M.chip(ctx, cx, top, chipW, chipH, P, rtl);
          kit.drawText(ctx, label, { x0: cx + 30, x1: cx + chipW - 30, y: top + chipH / 2, align: 'start', color: P.onInk });
        }
        ctx.restore();
      }
      ctx.save();
      if (M.slam(ctx, (t - at - 0.2) / 0.16, q, W / 2, yWas, 0.15) !== false) {
        kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: P.soft, key: P.soft });
        const c = M.E(span(t, tCut, tCut + 0.12));                                   // the bar, slammed across in one stroke
        if (c > 0) {
          const x1 = rtl ? SAFE.right + 10 : SAFE.left - 10, w = (Math.min(maxW, was.width) + 30) * c;
          ctx.fillStyle = P.ink; ctx.fillRect(rtl ? x1 - w : x1, yWas - 4 + (was.rows.length - 1) * was.lead / 2, w, 9);
        }
      }
      ctx.restore();
      ctx.save();
      if (M.slam(ctx, (t - tNow) / 0.2, q, W / 2, yNow, 0.6, -0.04) !== false) {
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(burst, 0, yNow - 450); ctx.restore();
        M.stampBlock(ctx, W / 2 - sw / 2, yNow - sh / 2, sw, sh, P, wear);
        kit.drawText(ctx, now, { x0: W / 2 - sw / 2, x1: W / 2 + sw / 2, y: yNow - now.height / 2 + now.lead / 2, color: P.onAccent, key: P.onAccent });
      }
      ctx.restore();
    },
  };
}
