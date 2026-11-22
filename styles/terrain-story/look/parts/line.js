// A line in the sky above the map. The lead-in (grey, may take two rows) and the statement come down word by word out of the haze
// and settle on their rows. The key phrase (*…*) becomes a map callout: one accent plate behind the whole phrase; on the last row a
// stem drops from it to a pillar of light that rises from the place on the terrain it is about. On the way out the words lift back
// into the haze and the pillar sinks. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 540);
  const aLead = { x0, x1, y: top + (lead ? lead.lead / 2 : 0), align: 'start' }, aLine = { x0, x1, y: top + (lead ? lead.height + gap : 0) + line.lead / 2, align: 'start' };
  const count = (f) => f.rows.reduce((s, r) => s + r.words.length, 0), nL = lead ? count(lead) : 0, n = nL + count(line);
  const step = Math.min(0.055, 0.34 / Math.max(1, n));
  const keyRuns = M.runs(M.layout(kit, line, aLine)), last = line.rows.length - 1, t0 = clock + Math.max(0, at);
  const sites = keyRuns.map((r) => (r.row === last ? ground.pick((r.x0 + r.x1) / 2, 1230, t0) : null));
  const out0 = d - T.dur.out, calT = at + 0.22;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), time = t + clock, keep = 1 - M.inC(out);
      keyRuns.forEach((r, k) => {
        const s = sites[k]; if (!s) return;
        const b = ground.at(s.u, s.v, 0, time), ph = (b.y - (r.y + line.size * 0.66) - 40) * 0.42;
        const hp = M.outC(span(t, calT + 0.2, calT + 0.2 + T.dur.pillar)) * keep;
        M.pillar(ctx, pal, b, ph * hp, keep);
        const sp = M.outC(span(t, calT + 0.15, calT + 0.6)) * keep, ya = r.y + line.size * 0.66, yb = ya + (b.y - ph - ya) * sp;
        if (sp > 0) { const xa = (r.x0 + r.x1) / 2, xb = xa + (b.x - xa) * sp; ctx.strokeStyle = pal.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke(); }
      });
      keyRuns.forEach((r) => M.callout(ctx, pal, r, line.size, line.space, span(t, calT, calT + 0.3) * keep));
      if (lead) kit.drawText(ctx, lead, { ...aLead, color: pal.grey, each: M.drop(t, at, step, T.dur.word, out, lead.size) });
      const cal = span(t, calT, calT + 0.3);
      kit.drawText(ctx, line, { ...aLine, color: pal.dark, key: cal > 0.5 && out < 0.5 ? pal.onAccent : pal.dark, each: M.drop(t, at + nL * step, step, T.dur.word, out, line.size) });
    },
  };
}
