// A line seen through the thermal camera: the statement sits in a measuring box (a dark plate with corner brackets). Each word warms up
// in place, from a soft mid-ramp smear to the hottest, sharpest colour; the key phrase (*…*, one or several words) then falls inside the
// isotherm, a flat accent band, with the hot-spot tracker over it. The plate itself warms the picture around it.
// spec: { duration, at?, y?, cut?: true, says: { text, lead? } }   cut: stays until the joint takes it (no cool-down).
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + T.pad * 2, 700) + T.pad;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const box = { x: SAFE.left, y: top - T.pad, w: SAFE.right - SAFE.left, h: block + T.pad * 2 };
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'start', rtl });
  const keyIdx = new Set(); runs.forEach((r) => { for (let i = r.i0; i <= r.i1; i++) keyIdx.add(i); });
  // the whole entrance (last word warm, isotherm and tracker in) takes `need` seconds; a hook that starts before the reel (at < 0) is
  // played faster so that it is complete on the first frame
  const nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0), need0 = 0.13 + (nAll - 1) * T.dur.stagger + 0.55;
  const f = at < 0 ? Math.min(1, (-at - 0.06) / need0) : 1, rise = T.dur.rise * f;
  const start = (k) => at + (0.08 + k * T.dur.stagger + (k >= nLead && keyIdx.has(k - nLead) ? 0.05 : 0)) * f;
  const out0 = spec.cut ? Infinity : d - T.dur.out;
  const word = (t, off, top) => (w, i, b, c) => {
    const k = M.heat(t, start(off + i), rise, out0, T.dur.out);
    return M.warm(c, k, pal, w.key ? pal.onAccent : top);
  };
  return {
    duration: d,
    draw(ctx, t) {
      const live = 1 - span(t, out0, out0 + T.dur.out);
      ground.draw(ctx, t, [{ x: W / 2, y: box.y + box.h / 2, r: 520, k: 0.3 * live * span(t, at, at + 0.5) }]);
      M.areaBox(ctx, pal, box.x, box.y, box.w, box.h, span(t, at, at + 0.25) * live, 'AR1', mono);
      runs.forEach((r) => {
        const p = M.heat(t, start(nLead + r.i1) + 0.1 * f, 0.28 * f, out0, T.dur.out);
        M.isotherm(ctx, pal, r, p, rtl);
        M.tracker(ctx, pal, r, M.heat(t, start(nLead + r.i1) + 0.25 * f, 0.3 * f, out0, T.dur.out), rtl);
      });
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.dim, each: word(t, 0, pal.dim) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.hot, key: pal.onAccent, each: word(t, nLead, pal.hot) });
    },
  };
}
