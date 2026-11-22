// Before and after against the sunset: the old value snaps in in black, then a black bar is laid through it and it fades back into
// the sky's tone (still legible); on the next beat the new value snaps in as a black slab with its words in the sun's colour, and the
// dancers freeze on that beat. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: x1 - x0 - 80, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const labH = label ? label.height + 40 : 0, gap = 90;
  const top = kit.place(labH + was.height + gap + now.height, 600);
  const yWas = top + labH + was.lead / 2, yNow = top + labH + was.height + gap + now.lead / 2;
  const tWas = at + 0.1, tCut = at + 0.1 + T.beat * 2, tNow = tCut + T.beat;
  const freeze = [tNow, tNow + T.dur.freeze];
  const nowRuns = now.rows.map((r, i) => ({ x0: W / 2 - r.width / 2, x1: W / 2 + r.width / 2, y: yNow + i * now.lead, row: i, first: 0 }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { freeze });
      const down = M.sink(span(t, d - T.dur.out, d)) * 800;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, T.horizon); ctx.clip(); ctx.translate(0, down);
      if (label && t >= at) kit.drawText(ctx, label, { x0, x1, y: top + label.lead / 2, align: 'center', color: pal.ink });
      const sw = M.snap(t, tWas, T.dur.snap);
      if (sw > 0) {
        const c = t >= tCut ? pal.dim : pal.ink;
        ctx.save(); ctx.translate(W / 2, yWas); ctx.scale(sw, sw); ctx.translate(-W / 2, -yWas);
        kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: c, key: c });
        ctx.restore();
        if (t >= tCut) { const bw = was.width + 70; ctx.fillStyle = pal.ink; ctx.fillRect(W / 2 - bw / 2, yWas + (was.rows.length - 1) * was.lead / 2 - 6, bw, 12); }
      }
      const sn = M.snap(t, tNow, T.dur.snap);
      if (sn > 0) {
        ctx.save(); ctx.translate(W / 2, yNow); ctx.scale(sn, sn); ctx.translate(-W / 2, -yNow);
        for (const r of nowRuns) M.slab(ctx, { ...r, x0: r.x0 - 20, x1: r.x1 + 20 }, now, pal.ink);
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: pal.sun, key: pal.sun });
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
