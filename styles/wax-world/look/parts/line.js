// A line as solid crayon words hanging in the toy world: every word is a block of wax with depth, its face in firm wax and its sides
// hatched dark, and the words drop in one by one from above, land with a small squash and settle, stepped twelve times a second.
// The key word (*…*) is a block of the accent. The lead is a smaller, quieter row of solids above. The words sit at a middle depth,
// so they slide a little against the floor as the camera sways, and each row casts a smudge of shadow on the floor far below.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, C = M.sets(P);
  const maxW = SAFE.right - SAFE.left - 60;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: 900, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 700, maxW, minScale: 0.6, where: 'the lead-in' }) : null;
  const gapL = lead ? 34 : 0, block = (lead ? lead.height + gapL : 0) + line.height + T.depth.line;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gapL : 0) + line.lead / 2;
  const x0 = SAFE.left + 30, x1 = SAFE.right - 30;
  const L1 = lead ? M.solidText(kit, W, H, lead, { x0, x1, y: yLead, D: T.depth.lead, colours: { plain: C.dim, key: C.key }, seed: 11 }) : [];
  const L2 = M.solidText(kit, W, H, line, { x0, x1, y: yLine, D: T.depth.line, colours: C, seed: 31 });
  const R1 = lead ? M.rowsOf(L1, lead.size) : [], R2 = M.rowsOf(L2, line.size);
  const shadows = R2.map((r) => ({ cv: M.smudge(W, H, (r.x1 - r.x0) * 0.9, P.shadow, 5), x: (r.x0 + r.x1) / 2 - 40 }));
  const n = L1.length + L2.length, total = (n - 1) * T.dur.gap + T.dur.drop;
  const f = at < 0 ? Math.min(1, (-at - 0.1) / total) : 1;              // an opening line has landed by the first frame
  const when = (k) => at + k * T.dur.gap * f;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = ground.step(t), dx = -ground.cam(t) * 0.3;
      const o = { dx, h: T.drop, dur: T.dur.drop * f };
      M.words(ctx, kit, L2, R2, ts, (k) => when(L1.length + k), { ...o, shadows, shadowY: ground.horizon + 70 });
      if (lead) M.words(ctx, kit, L1, R1, ts, when, o);
    },
  };
}
