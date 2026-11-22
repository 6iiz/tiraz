// A line as an analyst's caption over the ground. A dark glass plate opens from the reading side, the lead-in (grey, may take two
// rows) and the statement settle into it word by word, and the key phrase (*…*) is locked on: a reticle leaves a target on the ground
// below and flies onto the phrase, which is set in the class colour; while it holds, a dashed tether ties the phrase to its place.
// The plate closes back to the reading side on the way out. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, P = T.plate;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 560);
  const aLead = { x0, x1, y: top + (lead ? lead.lead / 2 : 0), align: 'start' }, aLine = { x0, x1, y: top + (lead ? lead.height + gap : 0) + line.lead / 2, align: 'start' };
  const py0 = top - P.pad + 6, py1 = top + block + P.pad - 10;
  const nWords = (f) => f.rows.reduce((s, r) => s + r.words.length, 0), nL = lead ? nWords(lead) : 0, n = nL + nWords(line);
  const step = Math.min(0.045, 0.34 / Math.max(1, n));
  const keyRuns = M.runs(M.layout(kit, line, aLine)), last = line.rows.length - 1;
  const g = ground.fromScreen(kit.rtl ? 360 : 720, Math.min(1180, py1 + 300), clock + Math.max(0, at));
  const out0 = d - T.dur.out, lockT = at + 0.32;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pp = M.plateP(t, at, T.dur.open, out0, T.dur.out);
      if (pp <= 0) return;
      M.plate(ctx, pal, P.x0, py0, P.x1, py1, pp, kit.rtl);
      const w = (P.x1 - P.x0) * M.snap(pp);
      ctx.save(); ctx.beginPath(); ctx.rect(kit.rtl ? P.x1 - w : P.x0, py0, w, py1 - py0); ctx.clip();
      if (lead) M.settle(kit, ctx, lead, aLead, t, at + 0.06, step, T.dur.word, pal.grey, pal.grey);
      M.settle(kit, ctx, line, aLine, t, at + 0.06 + nL * step, step, T.dur.word, pal.light, pal.key);
      ctx.restore();
      const hold = 1 - M.inC(span(t, out0, out0 + T.dur.out * 0.5));
      const tg = ground.toScreen(g.x, g.y, t + clock);
      keyRuns.forEach((r) => M.lockOn(ctx, pal, r, line.size, tg, span(t, lockT, lockT + T.dur.lock), r.row === last ? hold : 0, hold, line.space * 0.4));
    },
  };
}
