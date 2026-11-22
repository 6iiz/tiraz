// A line as a scanned object. The lead-in (grey, may take two rows) and the statement are one block: a scan front runs down it, the
// returns of the words fly in behind it and condense into solid type. A key phrase (*…*) is classified: its type and returns take the
// class colour and one bracket box closes on the whole phrase; when the phrase ends the block, a hairline leader drops from it into
// the cloud below. On the way out the type gives way to its returns, which lift off. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const atLine = { x0, x1, y: yLine, align: 'start' }, atLead = { x0, x1, y: yLead, align: 'start' };
  const sL = M.sampleText(kit, line, atLine, T.step.line), sA = lead ? M.sampleText(kit, lead, atLead, T.step.line) : null;
  if (sA) sA.pts.forEach((p) => { p.dim = true; });
  const S = { pts: [...(sA ? sA.pts : []), ...sL.pts], top: sA ? sA.top : sL.top, x0, x1 };
  S.h = sL.top + sL.h - S.top;
  const out0 = d - T.dur.out, scan = M.scanned(S, { t0: at, sweep: T.dur.sweep, land: T.dur.land, out0, outDur: T.dur.out });
  const keyRuns = M.runs(M.layout(kit, line, atLine));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const solid = (a, b) => {
        ctx.save(); ctx.beginPath(); ctx.rect(0, a, W, b - a); ctx.clip();
        if (lead) kit.drawText(ctx, lead, { ...atLead, color: pal.grey });
        kit.drawText(ctx, line, { ...atLine, color: pal.light, key: pal.key });
        ctx.restore();
      };
      const fy = t >= out0 ? -1 : scan.front(t), live = t < out0 ? 1 : 1 - M.inC(span(t, out0, out0 + T.dur.out * 0.6));
      keyRuns.forEach((r) => {
        const p = span(t, scan.done - 0.3, scan.done) * (fy > r.y + line.size * 0.5 || t >= out0 ? 1 : 0);
        ctx.save(); ctx.globalAlpha = live; M.bracket(ctx, r, line.size, p, pal.accent, line.space * 0.45);
        if (r.row === line.rows.length - 1) {                               // a measuring leader into the cloud
          const lp = M.outC(span(t, scan.done - 0.1, scan.done + 0.35)), xm = (r.x0 + r.x1) / 2, ya = r.y + line.size * 0.78, yb = ya + (1160 - ya) * lp;
          if (lp > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(xm - 1, ya, 2, yb - ya); ctx.beginPath(); ctx.arc(xm, yb, 7 * lp, 0, 6.283); ctx.lineWidth = 2; ctx.strokeStyle = pal.key; ctx.stroke(); }
        }
        ctx.restore();
      });
      scan.draw(ctx, t, { text: pal.light, key: pal.key, grey: pal.grey }, solid);
    },
  };
}
