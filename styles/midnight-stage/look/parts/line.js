// A line spoken into a follow-spot: the spot irises open on the back wall and the words, centred, come up with the light from the
// middle out. The key phrase (*…*) is lit by a marquee: one sign plate behind the whole run, its bulbs switching on round the frame
// and then chasing. At the end the spot irises closed and the words go back into the dark.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 30;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62, lead: 1.85 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 40 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 730);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const boxes = M.layout(kit, line, { x0, x1, y: yLine, align: 'center' }), runs = M.keyRuns(boxes);
  const cx = W / 2, cy = top + block / 2, R = Math.max(block * 0.9, Math.max(line.width, lead ? lead.width : 0) * 0.62) + 80, sy = 0.78;
  const sprite = M.pool(pal.light, 900, 0.2, 0.8), bulb = M.bulbSprite(pal);
  const irisAt = (t) => R * M.IN(span(t, at, at + T.dur.iris)) * (1 - M.OUT(span(t, d - T.dur.out, d)));
  const word = (t, r, to) => (w, i, box) => { const q = M.inIris(box.x + box.width / 2, box.y, cx, cy, r, 1, sy); if (q <= 0) return false; return M.lit(pal, q, w.key ? pal.light : to); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const r = irisAt(t);
      M.spot(ctx, sprite, cx, cy, r * 1.08, r * 1.08 * sy);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'center', color: pal.dim, each: word(t, r, pal.dim) });
      for (const run of runs) {
        const q = M.inIris((run.x0 + run.x1) / 2, run.y, cx, cy, r, 1, sy); if (q <= 0) continue;
        const on = span(t, at + 0.2, at + 0.2 + T.dur.marquee) * (r > 10 ? 1 : 0), px = line.space * 0.45, py = line.size * 0.1;
        M.marquee(ctx, pal, bulb, run.x0 - px, run.y - line.size * 0.62 - py, run.x1 + px, run.y + line.size * 0.62 + py, t + clock, on * Math.min(1, q * 1.5), true, false);
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: pal.light, key: pal.light, each: word(t, r, pal.light) });
    },
  };
}
