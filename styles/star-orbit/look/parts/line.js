// A line: the words are moons. They appear on an orbit round the middle of their row, whip round it and settle into the line one
// by one in reading order (all landed 0.78 s after `at`, so a hook at -0.8 is whole on frame 0). The key run is set in the key
// colour, then a thin ring opens round it and a small moon starts to circle it, passing behind the letters and in front of them.
// The optional lead comes in from deep space above the line.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; joints carry the exit)
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 + Math.round(clock * 3) });
  const maxW = SAFE.right - SAFE.left - 40;
  const asRows = (f) => f.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '));
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gapL = line.size * 1.42, gapLead = lead ? lead.size * 1.3 : 0;
  const hAll = (lead ? lead.rows.length * gapLead + line.size * 0.5 : 0) + line.rows.length * gapL;
  let y = kit.place(hAll, spec.y ?? 720) + (lead ? gapLead / 2 : gapL / 2);
  const leads = [], rows = [];
  if (lead) for (const s of asRows(lead)) { const r = await W3.row(s, { size: lead.size, weight: T.weight.lead, depth: T.depth.lead, color: W3.P.lead, rings: false }); W3.place(r, { y }); leads.push(r); y += gapLead; }
  if (lead) y += line.size * 0.5 + gapL / 2 - gapLead / 2;
  for (const s of asRows(line)) { const r = await W3.row(s, { size: line.size, weight: T.weight.line }); W3.place(r, { y }); rows.push(r); y += gapL; }
  return {
    duration: d,
    draw(ctx, t) {
      leads.forEach((r, i) => W3.arrive(r, t, { t0: at + i * 0.05, dur: 0.38 }));
      rows.forEach((r, i) => W3.fly(r, t, { t0: at + i * 0.04, window: T.orbit.window - i * 0.04 }));
      W3.render(ctx, t);
    },
  };
}
