// Before and after as two rooftops: on the first, lower roof the label and the old value are set down in muted ink, then a striped
// work-site tape is unrolled across the old value in time-lapse steps. A taller roof then rises below it and the new value is set
// down on a painted tarp of the accent. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 40, x1 = SAFE.right - 40, maxW = x1 - x0;
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the compare label' }) : null;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: Math.round(T.size.compare * 0.8), weight: 700, maxW, minPx: 52, where: 'the old value' });
  const now = kit.fit(`*${asText(S.now).replace(/\*/g, '')}*`, { size: T.size.compare * 1.1, weight: 800, maxW: maxW - 30, minPx: 64, where: 'the new value' });
  const hA = (label ? label.height + 10 : 0) + was.height + 70, hB = now.height + 90, gap = 46;
  const top = kit.place(hA + gap + hB, 720);
  const A = { x: 90, y: top, w: W - 180, h: hA }, B = { x: 44, y: top + hA + gap, w: W - 88, h: hB };
  const yLabel = A.y + 35 + (label ? label.lead / 2 : 0), yWas = A.y + 35 + (label ? label.height + 10 : 0) + was.lead / 2, yNow = B.y + 45 + now.lead / 2;
  const nowRuns = M.keyRuns(now, { x0, x1, y: yNow, align: 'center' }, rtl);
  const band = { y: top + (hA + gap + hB) / 2 - 13, h: hA + gap + hB + 30 };
  const tapeT = at + 0.8, bT = at + 1.1, nowT = at + 1.4;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, band);
      const tl = M.lapse(t);
      ctx.save();
      if (M.slab(ctx, A, pal, (tl - at) / 0.24, 16)) {
        if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.muted, each: (w, i, box, c) => M.setDown(c, t, at + 0.25 + i * 0.05, box) });
        kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: pal.muted, key: pal.muted, each: (w, i, box, c) => M.setDown(c, t, at + 0.45 + i * 0.05, box) });
        const k = Math.ceil(Math.min(1, Math.max(0, (tl - tapeT) / 0.25)) * 5) / 5;          // the tape, unrolled in five pictures
        if (k > 0) {
          const tw = (was.width + 80) * k, tx = rtl ? W / 2 + (was.width + 80) / 2 - tw : W / 2 - (was.width + 80) / 2, th = 13;
          ctx.save(); ctx.translate(W / 2, yWas); ctx.rotate(-0.06); ctx.translate(-W / 2, -yWas);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(tx + 4, yWas - th / 2 + 5, tw, th);
          ctx.fillStyle = pal.ink; ctx.fillRect(tx, yWas - th / 2, tw, th);
          ctx.beginPath(); ctx.rect(tx, yWas - th / 2, tw, th); ctx.clip(); ctx.fillStyle = pal.accent;
          for (let x = tx - 40; x < tx + tw + 40; x += 30) { ctx.beginPath(); ctx.moveTo(x, yWas + th / 2); ctx.lineTo(x + 14, yWas + th / 2); ctx.lineTo(x + 30, yWas - th / 2); ctx.lineTo(x + 16, yWas - th / 2); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.save();
      if (M.slab(ctx, B, pal, (tl - bT) / 0.24, 40)) {
        for (const r of nowRuns) M.tarp(ctx, r, now.size, (tl - nowT + 0.08) / 0.2, pal, rtl);
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: pal.ink, key: pal.onAccent, each: (w, i, box, c) => M.setDown(c, t, nowT + i * 0.06, box) });
      }
      ctx.restore();
    },
  };
}
