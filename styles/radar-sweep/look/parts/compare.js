// Before and after as two contacts. The old value is found first and held in a plain (cold) lock; then the track is lost: the lock
// breaks open, the word decays to a faint echo (still readable) and a dashed line runs through it. A second ping finds the new value
// under it, the one warm contact, and the accent lock closes on it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 40, x1 = SAFE.right - 40;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the compare label' }) : null;
  const gapV = 70, hAll = (label ? label.height + 16 : 0) + was.height + gapV + now.height, top = kit.place(hAll, 640);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + 16 : 0) + was.lead / 2;
  const yNow = yWas - was.lead / 2 + was.height + gapV + now.lead / 2;
  const D = (f, y) => M.wordCentres(f, { x0, x1, y, rtl }).map((p) => Math.hypot(p.x - ground.cx, p.y - ground.cy));
  const dLab = label ? D(label, yLabel) : [], dWas = D(was, yWas), dNow = D(now, yNow);
  const speed = T.dur.speed, t0 = at + 0.03, lost = at + 0.85, t1 = at + 1.15, out0 = d - T.dur.out;
  const runs = M.keyRuns({ ...now, rows: now.rows.map((r) => ({ ...r, words: r.words.map((w) => ({ ...w, key: true })) })) }, { x0, x1, y: yNow, align: 'start', rtl });
  const wasX = rtl ? x1 - was.width : x0, quiet = [{ y0: top - 10, y1: top + hAll + 10 }];
  const coldLock = { ...pal, accent: pal.ringHi };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, quiet);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t0, speed), 900);
      M.ping(ctx, pal, ground.cx, ground.cy, M.pingR(t, t1, speed), 900);
      const fade = 1 - span(t, out0, out0 + T.dur.out), pl = span(t, lost, lost + 0.35);
      // the old contact: a cold lock that breaks open when the track is lost
      const hitW = t0 + Math.max(...dWas) / speed, lp = span(t, hitW + 0.05, hitW + 0.3) * (1 - M.outC(pl));
      if (lp > 0) M.lock(ctx, coldLock, wasX - 10, yWas - was.size * 0.58, was.width + 20, was.size * 1.16, lp * fade);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.soft, each: (w, i, b, c) => M.echo(c, M.ret(t, t0, speed, dLab[i]), pal.soft, pal, fade) });
      const wasCol = pl > 0.4 ? pal.lost : pal.echo;
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: wasCol, key: wasCol, each: (w, i, b, c) => M.echo(c, M.ret(t, t0, speed, dWas[i]), wasCol, pal, fade) });
      if (pl > 0 && fade > 0) {
        const w = (was.width + 40) * M.outC(span(t, lost + 0.1, lost + 0.4));
        ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = pal.soft; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.beginPath();
        if (rtl) { ctx.moveTo(wasX + was.width + 20, yWas); ctx.lineTo(wasX + was.width + 20 - w, yWas); } else { ctx.moveTo(wasX - 20, yWas); ctx.lineTo(wasX - 20 + w, yWas); }
        ctx.stroke(); ctx.restore();
      }
      // the new contact: warm, locked
      const hitN = t1 + Math.max(...dNow) / speed;
      runs.forEach((r) => { const px = r.size * 0.04, h = r.size * 1.1; M.lock(ctx, pal, r.x - px, r.y - h / 2, r.w + px * 2, h, span(t, hitN + 0.05, hitN + 0.05 + T.dur.lock) * fade); });
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.target, key: pal.target, each: (w, i, b, c) => M.echo(c, M.ret(t, t1, speed, dNow[i]), pal.target, pal, fade) });
    },
  };
}
