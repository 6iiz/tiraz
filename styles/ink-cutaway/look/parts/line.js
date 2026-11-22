// A line: the specimen is drawn on the upper sheet and a section is cut into it, a chain line sweeping across as the window opens.
// The statement is inked below, word by word from the reading side. The accent path runs through the cut, leaves by the outlet and
// is routed down the margin to the key word (or key phrase), where it becomes a heavy underline ending in an arrow: the one path the
// drawing explains ends on the one idea the line is about. spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, rtl = kit.rtl;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.96, minPx: 44, where: 'the lead-in' }) : null;
  const g = { cx: W / 2 - 40, cy: 540, L: T.spec.L, R: T.spec.R };
  const block = (lead ? lead.height + 10 : 0) + line.height;
  const top = Math.max(g.cy + g.R + 130, kit.place(block, 930));
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + 10 : 0) + line.lead / 2;
  const runs = M.keyRuns(M.boxes(kit, line, x0, x1, yLine));
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const step = Math.min(T.dur.step, 0.45 / Math.max(1, nAll)), out0 = d - T.dur.out;
  const t0 = Math.min(at, 0);
  const word = (t, base, size) => (w, i, box, c) => { if (M.inked(c, t, at + (base + i) * step, T.dur.word, out0, d, box, size, rtl) === false) return false; if (w.key) return pal.key; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = 1 - span(t, out0, d);
      ctx.save(); ctx.globalAlpha = fade;
      const pts = M.specimen(ctx, pal, g, { draw: span(t, t0, t0 + 0.7), cut: M.E(span(t, 0.1, 0.9)), flow: t, flowP: span(t, 0.35, 1.0), plug: 0, rtl });
      M.balloon(ctx, pal, mono, pts.coil, [pts.coil[0] - 60, g.cy - g.R - 100], 1, span(t, 0.9, 1.25));
      M.balloon(ctx, pal, mono, pts.shell, [pts.shell[0] - 40, g.cy + g.R + 70], 2, span(t, 1.05, 1.4));
      runs.slice(-1).forEach((r) => M.pathToKey(ctx, pal, pts.outlet, r, line.size, span(t, 0.95, 1.6), rtl, SAFE.right + 14));
      runs.forEach((r) => { const p = M.soft(span(t, at + (nLead + r.first) * step, at + (nLead + r.first) * step + 0.25)); if (p > 0) { const w = (r.x1 - r.x0) * p; ctx.fillStyle = pal.path; ctx.fillRect(rtl ? r.x1 - w : r.x0, r.y + line.size * 0.7 - 1.5, w, 3); } });
      ctx.restore();
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.key, each: word(t, nLead, line.size) });
    },
  };
}
