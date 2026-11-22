// A line, set centred like a slide: an optional lead-in in a small pill above it, then the statement. Words snap up into place in quick
// succession while a beam of light crosses the stage from the reading side and lights them as it passes. The key word (*…*) is the
// one accent thing on the slide, with a faint pool of its own light under it. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 80, single: true, where: 'the lead-in' }) : null;
  const chipH = lead ? lead.size * 2 : 0, chipW = lead ? lead.width + 64 : 0, gap = lead ? 48 : 0;
  const block = chipH + gap + line.height, top = spec.y ?? kit.place(block, 640);
  const yChip = top, yLine = top + chipH + gap + line.lead / 2;
  const nLead = lead ? lead.rows[0].words.length : 0;
  const glow = M.pool(brand.colors.accent, 600, 240, T.tone.glow);
  const sweep0 = at + 0.1, out0 = d - T.dur.out;
  const word = (t, offset, size, base) => (w, i, box, c) => {
    const k = offset + i, t0 = at + k * T.dur.step;
    if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, size) === false) return false;
    if (M.leave(c, span(t, out0, d), box, size) === false) return false;
    const q = M.lit(span(t, sweep0, sweep0 + T.dur.sweep), box.x + box.width / 2, x0, x1, rtl);
    if (w.key) {
      c.save(); c.globalAlpha *= q; c.drawImage(glow, box.x - box.width * 0.45, box.y - size * 0.95, box.width * 1.9, size * 1.9); c.restore();
      return M.glowOf(pal, pal.key, q, T);
    }
    return M.glowOf(pal, base, q, T);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.beam(ctx, W, H, span(t, sweep0 - 0.1, sweep0 + T.dur.sweep + 0.2), pal.light, rtl);
      if (lead) {
        const cp = span(t, at - 0.1, at + T.dur.in), out = span(t, out0, d);
        ctx.save(); ctx.globalAlpha = 1 - M.S(out);
        M.card(ctx, (W - chipW) / 2, yChip, chipW, chipH, chipH / 2, pal.s2, pal.border, cp);
        ctx.restore();
        kit.drawText(ctx, lead, { x0, x1, y: yChip + chipH / 2, align: 'center', color: pal.dim, each: word(t, 0, lead.size, pal.dim) });
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: pal.light, key: pal.key, each: word(t, nLead, line.size, pal.light) });
    },
  };
}
