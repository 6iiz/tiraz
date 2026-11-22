// A line cast in metal: an optional smaller lead-in, then the statement, centred on the table. Every word is its own solid piece;
// they are let go one after another and land with a hop and a ring, the key word (*…*) last of its neighbours, from higher, in the
// brand's accent metal. Once all are down the soft light passes over their faces.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted for the reel's hook; the joint carries every exit here)
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const S = await import(look.base + 'studio.js'), M = await import(look.base + 'motion.js');
  const x0 = SAFE.left + T.margin, x1 = SAFE.right - T.margin, maxW = x1 - x0, pal = ground.pal;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.72 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gapLead = lead ? lead.lead * 0.25 : 0, block = (lead ? lead.lead + gapLead : 0) + line.height;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.lead + gapLead : 0) + line.lead / 2;

  const leadP = lead ? S.castText(ground, lead, { x0, x1, y: yLead, rtl: kit.rtl, color: () => pal.soft }) : [];
  const lineP = S.castText(ground, line, { x0, x1, y: yLine, rtl: kit.rtl, color: (w) => (w.key ? pal.accent : pal.light) });
  const gl = Math.min(0.06, M.gap(T, leadP.length)), g = M.gap(T, lineP.length);
  let extra = 0;
  leadP.forEach((p, k) => { p.t0 = at + k * gl; });
  lineP.forEach((p, i) => { if (p.key && !extra) extra = 0.06; p.t0 = at + (lead ? 0.12 : 0) + i * g + extra; p.o = p.key ? { h0: T.fall.height * 1.3, ring: T.fall.ring * 1.4 } : {}; });
  ground.passes(at + 0.9, T.light.every, (top + top + block) / 2);
  const all = [...leadP, ...lineP];

  return {
    duration: d,
    draw(ctx, t) {
      for (const p of all) M.drop(T, p, t, p.t0, p.o);
      ground.render(ctx, t);
      for (const p of all) M.rec(kit, ground, p);
    },
  };
}
