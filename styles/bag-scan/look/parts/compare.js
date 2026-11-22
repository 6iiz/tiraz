// Before and after as two cases on the belt. The first case (the old value) is pulled in and stops; the operator flags it: a cross is
// struck through its contents and it is dimmed to a low-penetration ghost (still readable). Then the second lane runs: the new case is
// pulled in under it past the same sensor, stops, and its value is selected and switched to inverse.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0 - 30, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the compare label' }) : null;
  const pad = 36, hWas = (label ? label.height + 8 : 0) + was.height + pad * 2, hNow = now.height + pad * 2, gapV = 90;
  const top = kit.place(hWas + gapV + hNow, 720);
  const bWas = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h: hWas }, bNow = { x: SAFE.left, y: top + hWas + gapV, w: SAFE.right - SAFE.left, h: hNow };
  const yLabel = top + pad + (label ? label.lead / 2 : 0), yWas = top + pad + (label ? label.height + 8 : 0) + was.lead / 2;
  const yNow = bNow.y + pad + now.lead / 2;
  const sWas = M.bag(bWas.w, bWas.h, pal, 3), sNow = M.bag(bNow.w, bNow.h, pal, 4);
  const runs = M.keyRuns({ ...now, rows: now.rows.map((r) => ({ ...r, words: r.words.map((w) => ({ ...w, key: true })) })) }, { x0, x1, y: yNow, align: 'start', rtl });
  const flag = at + T.dur.belt + 0.1, nowIn = at + 1.05, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx);
      const offA = M.belt(t, at, T.dur.belt, out0, W, ground.dir), offB = M.belt(t, nowIn, T.dur.belt, out0, W, ground.dir);
      const running = Math.min(1, Math.max(Math.abs(offA), Math.abs(offB) * (t > nowIn ? 1 : 0)) / 60);
      ctx.save(); ctx.beginPath();
      ctx.rect(rtl ? 0 : ground.sensorX, ground.top, rtl ? ground.sensorX : W - ground.sensorX, ground.bottomY - ground.top); ctx.clip();
      ground.items(ctx, offA);
      // the old case
      ctx.save(); ctx.translate(offA, 0);
      ctx.drawImage(sWas.cv, bWas.x - sWas.pad, bWas.y - sWas.pad);
      const pf = span(t, flag, flag + 0.3), dim = M.outC(pf);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', decor: Math.abs(offA) > 1, color: pal.soft });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', decor: Math.abs(offA) > 1, color: dim > 0.5 ? pal.soft : pal.ink, key: dim > 0.5 ? pal.soft : pal.ink });
      if (pf > 0) {                                   // the flag: a cross struck over the contents, corner to corner, then a strike
        const cx0 = rtl ? x1 - was.width - 20 : x0 - 20, cx1 = cx0 + was.width + 40, cy0 = yWas - was.size * 0.6, cy1 = yWas + was.size * 0.6;
        const a = M.outC(span(t, flag, flag + 0.15)), b = M.outC(span(t, flag + 0.12, flag + 0.27));
        ctx.strokeStyle = pal.mixed; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + (cx1 - cx0) * a, cy0 + (cy1 - cy0) * a);
        if (b > 0) { ctx.moveTo(cx1, cy0); ctx.lineTo(cx1 - (cx1 - cx0) * b, cy0 + (cy1 - cy0) * b); }
        ctx.stroke();
      }
      ctx.restore();
      // the new case
      if (t >= nowIn) {
        ctx.save(); ctx.translate(offB, 0);
        ctx.drawImage(sNow.cv, bNow.x - sNow.pad, bNow.y - sNow.pad);
        const ps = span(t, nowIn + T.dur.belt + 0.05, nowIn + T.dur.belt + 0.35);
        runs.forEach((r) => M.inverse(ctx, pal, r, ps, rtl));
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', decor: Math.abs(offB) > 1, color: pal.ink, key: pal.ink, each: () => (ps > 0.5 ? pal.light : undefined) });
        runs.forEach((r) => { const px = r.size * 0.12 + 4, h = r.size * 1.2 + 30; M.select(ctx, pal, r.x - px, r.y - h / 2, r.w + px * 2, h, ps, t); });
        ctx.restore();
      }
      ctx.restore();
      ground.sensor(ctx, running);
    },
  };
}
