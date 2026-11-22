// A line as a poster headline: the statement is set on a band of the accent that crosses the whole frame, and the band with its words
// is turned by the poster's tilt and thrown in up the diagonal as one block. The key word (*…*) is cut out of the band: set in the
// ground's colour on a block of paper. Behind it a radiating wedge and a crossing paper band give the frame its diagonals. The lead-in
// stays level, on the ground, above. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, tilt = T.tilt;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const textW = 800;                                   // narrower than the safe area, so the turned block stays inside it
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: textW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 60, single: true, where: 'the lead-in' }) : null;
  const pad = 46, bandH = line.height + pad * 2;
  const leadH = lead ? lead.lead + 40 : 0;
  const top = spec.y ?? kit.place(leadH + bandH + 60, 560);
  const yLead = top + (lead ? lead.lead / 2 : 0), cy = top + leadH + bandH / 2 + 30, cx = W / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const leadWords = (t, out) => (w, i, box, c) => {
    if (M.arrive(c, span(t, at + i * T.dur.stagger, at + i * T.dur.stagger + T.dur.in), box, lead.size) === false) return false;
    if (M.leave(c, out, box, lead.size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      // the wedge: a slice of the accent's dark mix radiating from the lower corner, under everything
      const pw = M.E(span(t, at, at + T.dur.slam + 0.2)) * keep;
      if (pw > 0) {
        const ox = rtl ? W + 40 : -40, oy = cy + bandH / 2 + 40;
        M.wedge(ctx, ox, H + 60, rtl ? 196 : -16, rtl ? 196 + 26 * pw : -16 - 26 * pw, H, pal.wedge);
        M.wedge(ctx, ox, H + 60, rtl ? 232 : -52, rtl ? 232 + 8 * pw : -52 - 8 * pw, H, pal.accent);
      }
      // the paper band that crosses the headline band the other way, below it
      M.band(ctx, cx, cy + bandH / 2 + 210, 1700, 64, -tilt * 2.2, pal.paper, M.E(span(t, at + 0.15, at + 0.15 + T.dur.slam)) * keep, rtl ? -1 : 1);
      // the headline block: band and words turned and thrown in as one
      M.block(ctx, cx, cy, tilt, span(t, at, at + T.dur.slam), out, (off) => {
        ctx.fillStyle = pal.bg; ctx.fillRect(-1100, -bandH / 2 - 12, 2200, bandH + 24);      // a knockout edge: the band is printed over a gap
        ctx.fillStyle = pal.accent; ctx.fillRect(-1100, -bandH / 2, 2200, bandH);
        if (off < M.SETTLE) kit.drawText(ctx, line, { x0: -textW / 2, x1: textW / 2, y: -line.height / 2 + line.lead / 2, align: 'start', color: pal.onAccent, key: pal.onPaper,
          each: (w, i, box, c) => {
            if (w.key) { c.fillStyle = pal.paper; const kp = line.space * 0.38; c.fillRect(box.x - kp, box.y - line.size * 0.66, box.width + kp * 2, line.size * 1.32); c.fillStyle = pal.onPaper; }
          } });
      });
      if (lead) {
        const pm = M.E(span(t, at, at + 0.3)) * keep;
        if (pm > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? SAFE.right - 22 : SAFE.left, yLead - 11, 22, 22 * pm); }
        kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right - 40, y: yLead, align: 'start', color: pal.text, each: leadWords(t, out) });
      }
    },
  };
}
