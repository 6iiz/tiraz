// A line as a page of the file: the lead-in is set in paper on an ink file chip that slams down first; then the statement prints word
// by word in heavy ink with the accent out of register behind it, each word slammed down. The key word (*…*) is not printed: it is
// stamped, last, on an accent rubber-stamp block turned a little off square, its letters in the colour that reads on the accent.
// The page leaves by being flipped up. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut: a quicker flip)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, wear = M.wearTile(P.paper);
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 40, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 60, single: true, where: 'the lead-in' }) : null;
  const chipH = lead ? lead.lead + 20 : 0, chipW = lead ? lead.width + 60 : 0, gap = lead ? 46 : 0;
  const top = spec.y ?? kit.place(chipH + gap + line.height, 600);
  const yText = top + chipH + gap + line.lead / 2, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const nWords = line.rows.reduce((s, row) => s + row.words.length, 0);
  const keyAt = at + 0.2 + nWords * T.dur.step + 0.15, step = T.dur.step;
  const out = (t) => span(t, d - (spec.cut ? 0.25 : 0.32), d);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = out(t);
      if (lead) {
        const cx = rtl ? SAFE.right - chipW : SAFE.left;
        ctx.save();
        if (M.slam(ctx, (t - at) / 0.16, q, cx + chipW / 2, top + chipH / 2, 0.3) !== false) {
          M.chip(ctx, cx, top, chipW, chipH, P, rtl);
          kit.drawText(ctx, lead, { x0: cx + 30, x1: cx + chipW - 30, y: top + chipH / 2, align: 'start', color: P.onInk });
        }
        ctx.restore();
      }
      let k = 0;
      const each = (w, i, box, c) => {
        if (w.key) {
          if (M.slam(c, (t - keyAt) / 0.18, q, box.x + box.width / 2, box.y, 0.6, -0.035) === false) return false;
          const px = line.space * 0.5;
          M.stampBlock(c, box.x - px, box.y - line.size * 0.7, box.width + px * 2, line.size * 1.4, P, wear);
          return P.onAccent;
        }
        const t0 = at + 0.2 + (k++) * step;
        return M.slamWord(t, () => t0, q)(w, i, box, c);
      };
      ctx.save(); ctx.translate(ground.reg.x, ground.reg.y);                             // the accent drum, out of register
      k = 0;
      kit.drawText(ctx, line, { x0, x1, y: yText, align: 'start', color: P.accent, decor: true,
        each: (w, i, box, c) => (w.key ? false : M.slamWord(t, () => at + 0.2 + (k++) * step, q)(w, i, box, c)) });
      ctx.restore();
      k = 0;
      kit.drawText(ctx, line, { x0, x1, y: yText, align: 'start', color: P.ink, key: P.onAccent, each });
    },
  };
}
