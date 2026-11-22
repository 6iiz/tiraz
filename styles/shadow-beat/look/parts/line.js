// A line in silhouette: the statement set in the brand's dark colour straight on the bright sky, like another black shape against the
// sunset. Words snap into place one per half-beat (a swell of three frames, then still). The key phrase (*…*) is one black slab with
// its words cut out of it in the sun's colour, and when it lands the dancers below freeze on their pose while the sun keeps sinking.
// The lead-in sits above, smaller, after a short black bar. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: x1 - x0, minScale: 0.85, minPx: 64 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0 - 70, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const n = line.rows.reduce((s, r) => s + r.words.length, 0), step = n > 1 ? Math.min(T.beat / 2, T.dur.words / (n - 1)) : 0;
  const wordAt = (i) => at + 0.1 + i * step;
  const runs = M.keyRuns(kit, line, { x0, x1, y: yLine });
  const freeze = runs.length ? [wordAt(runs[0].first), wordAt(runs[0].first) + T.dur.freeze] : null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { freeze });
      const down = M.sink(span(t, d - T.dur.out, d)) * 700;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, T.horizon); ctx.clip(); ctx.translate(0, down);
      if (lead && t >= at) {
        ctx.fillStyle = pal.ink; ctx.fillRect(kit.rtl ? x1 - 46 : x0, yLead - 4, 46, 8);
        kit.drawText(ctx, lead, { x0: kit.rtl ? x0 : x0 + 66, x1: kit.rtl ? x1 - 66 : x1, y: yLead, align: 'start', color: pal.ink });
      }
      for (const r of runs) M.slab(ctx, r, line, pal.ink, M.snap(t, wordAt(r.first), T.dur.snap));
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.sun,
        each: (w, i, box, c) => { const s = M.snap(t, wordAt(i), T.dur.snap); if (s <= 0) return false; c.translate(box.x + box.width / 2, box.y); c.scale(s, s); c.translate(-(box.x + box.width / 2), -box.y); } });
      ctx.restore();
    },
  };
}
