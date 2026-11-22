// A line scratched into the emulsion: an optional faint lead-in is cut first with a needle rule under it, then the statement is cut word by
// word from the reading side behind the hot point, boiling as it holds. The key word (*…*) gets dye laid into its groove. Below, away
// from the words, the ground carries the scratched sun and sea. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = 46, block = (lead ? lead.lead + gap : 0) + line.height, top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yRule = yLead + (lead ? lead.lead / 2 + 10 : 0), yLine = top + (lead ? lead.lead + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, tLine = lead ? 0.12 + nLead * 0.06 + 0.2 : 0.1;
  const ox = rtl ? 130 : W - 130, oy = 1560;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const n = ground.n(t), w = ground.weave(t), tl = t - at;
      ctx.save(); ctx.translate(w.x, w.y);
      if (lead) {
        M.cutText(kit, ctx, lead, { x0, x1, y: yLead, t: tl, t0: 0, step: 0.06, dur: 0.14, n, seed: 3, P, color: P.faint });
        const L = Math.min(maxW, lead.width + 60) * span(tl, 0.1, 0.4);
        M.needle(ctx, M.seg(rtl ? x1 : x0, yRule, rtl ? x1 - L : x0 + L, yRule + 3), { w: 2.4, n, seed: 9, color: P.dye });
      }
      M.cutText(kit, ctx, line, { x0, x1, y: yLine, t: tl, t0: tLine, step: T.dur.step, dur: T.dur.cut, n, seed: 5, P });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
