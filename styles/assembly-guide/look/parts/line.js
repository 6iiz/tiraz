// A line as a step of the manual: the step number at the top of the page, the words sliding a short way along the isometric axis into
// place, the key phrase on a slab of the accent that drops in along dotted guides and clicks, and under it all the build, where this
// step's new part arrives in the accent and turns white once fitted. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K, n = M.nextStep(clock), R = M.rig(W, T, K);
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 20, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 20 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = Math.max(450, spec.y ?? kit.place(block, 660));
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const groups = M.keyGroups(M.boxes(line, x0, x1, yLine, 'start', rtl));
  const st = at < 0 ? Math.min(0.07, 0.35 / (nLead + line.rows.reduce((s, r) => s + r.words.length, 0))) : 0.07;
  const slabT = groups.map((g) => at + 0.12 + (nLead + g.firstI) * st);
  const slabD = at < 0 ? 0.3 : 0.38;
  const keyOf = (i) => groups.findIndex((g) => i >= g.firstI && i <= g.lastI);
  const tWord = (i) => { const k = keyOf(i); return k >= 0 ? slabT[k] + slabD - 0.05 : at + (nLead + i) * st; };
  const drop = Math.max(at + 0.4, 0.25);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.stepNumber(ctx, kit, n, rtl ? x1 : x0, 330, T.size.step, K.ink, (t - at) / 0.3, rtl);
      const offs = groups.map((g, k) => M.slab(ctx, g, (t - slabT[k]) / slabD, K, T, rtl));
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: K.grey, each: (w, i, b, c) => M.arrive(c, (t - at - i * st) / 0.3, rtl, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: K.ink, key: K.onAccent,
        each: (w, i, b, c) => { const k = keyOf(i); if (k >= 0) { if (offs[k] === null || t < tWord(i)) return false; c.translate(0, offs[k]); return; } return M.arrive(c, (t - tWord(i)) / 0.3, rtl, line.size); } });
      R.draw(ctx, n, t, drop);
    },
  };
}
