// A line painted in: the lead-in develops word by word in a quiet tone; then for each row of the statement a broad, pale wash of the
// pigment is brushed across in the reading direction, and every word appears as the wet front reaches it, first in the wet colour,
// then drying to ink. The key word (*…*) gets a second, stronger stroke of the pigment glazed over the first, and a few drops flicked off
// the brush. Centred on the page. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; the page lifts the same way)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0 - 40;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 40 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const bx = M.boxes(line, { x0, x1, y: yLine, rtl });
  const tLine = at + 0.15 + nLead * T.dur.step;
  const rows = line.rows.map((row, r) => {
    const w = row.width + line.size * 0.7, h = line.size * 1.45, b0 = bx.find((b) => b.row === r), xl = b0.left - line.size * 0.35;
    const t0 = tLine + r * 0.5;
    return { B: M.band(w, h, pal.accent, T.tone.band, 11 + r, rtl), x: xl, w, y: yLine + r * line.lead, t0, t1: t0 + T.dur.pass,
      D: M.drops(60 + r, 7, rtl ? xl - 10 : xl + w + 10, yLine + r * line.lead + h * 0.3, 70) };
  });
  const wordT = bx.map((b) => { const R = rows[b.row]; return M.passTime(b, R.x, R.x + R.w, R.t0, R.t1, rtl); });
  const keys = M.keySpans(bx).map((s, k) => {
    const w = s.x1 - s.x0 + line.size * 0.5, h = line.size * 1.15, t0 = wordT[s.first] + 0.05;
    return { B: M.band(w, h, pal.accent, T.tone.key, 30 + k, rtl), x: s.x0 - line.size * 0.25, w, y: s.y + line.size * 0.02, t0, t1: t0 + 0.32 };
  });
  const keyInk = pal.on(pal.tint(0.75));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), keep = 1 - M.I(out);
      for (const R of rows) { M.lay(ctx, R.B, R.x, R.y, M.BR(span(t, R.t0, R.t1)), rtl, keep); M.splash(ctx, R.D, span(t, R.t1 - 0.05, R.t1 + 0.25) * keep, pal.accent); }
      for (const K of keys) M.lay(ctx, K.B, K.x, K.y, M.BR(span(t, K.t0, K.t1)), rtl, keep);
      const grey = pal.quiet(T.tone.grey);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, color: grey,
        each: (w, i, box, c) => M.develop(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.dry), out, pal.wet, grey) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: pal.ink, key: keyInk,
        each: (w, i, box, c) => M.develop(c, span(t, wordT[i], wordT[i] + T.dur.dry), span(t, out0 + i * 0.02, d), pal.wet, w.key ? keyInk : pal.ink) });
    },
  };
}
