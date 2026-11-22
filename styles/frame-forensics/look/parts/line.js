// A line as a finding: an evidence frame (a fixed street camera at night) plays at the top with its timecode burnt in, then freezes
// on the decisive frame; a ring is drawn around the figure and a leader runs from it down the frame's edge to the place of the key
// phrase. Under the frame the lead-in and the statement are set like a transcription, and the key phrase (*…*) is highlighted with
// one accent band per run. While the line holds, the frozen frame keeps pushing in slowly on what was found.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }  (cut: accepted; the line always leaves the same way)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right;
  const F = M.footage(T.frame.w, T.frame.h, P, 23), fy = T.frame.top, fh = T.frame.h;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.95, where: 'the lead-in' }) : null;
  const gap = lead ? 16 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? Math.max(fy + fh + 90, kit.place(block, 900));
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const keyRuns = M.runs(M.boxes(kit, line, { x0, x1, y: yLine, align: 'start' }));
  const stagger = Math.min(T.dur.stagger, 0.32 / Math.max(1, nAll - 1));
  const fT = at + 0.35, srcT = 14 * 60 + 7.3;                       // the freeze, and the source clock at the start
  const k0 = keyRuns[0];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), live = Math.min(t, fT), frozen = t >= fT;
      const zoom = 1 + 0.12 * M.IO(span(t, fT + 0.3, d));
      const f0 = F.walk(span(fT, at - 1.6, fT));
      const fig = M.playFootage(ctx, F, x0, fy, T.frame.w, span(live, at - 1.6, fT), frozen ? Math.floor(fT * T.fps) : Math.floor(t * T.fps), P, zoom, f0.x, f0.y);
      ctx.strokeStyle = P.rule; ctx.lineWidth = 2; ctx.strokeRect(x0, fy, T.frame.w, fh);
      M.code(ctx, M.tc(srcT + live - at, T.fps), x0 + 20, fy + fh - 26, { mono, size: T.size.code, color: P.ink });
      // play / pause in the frame's far corner
      const ix = x1 - 44, iy = fy + 26; ctx.fillStyle = frozen ? P.mark : P.ink;
      if (frozen) { ctx.fillRect(ix, iy, 8, 26); ctx.fillRect(ix + 14, iy, 8, 26); } else { ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + 22, iy + 13); ctx.lineTo(ix, iy + 26); ctx.fill(); }
      const keep = 1 - M.I(out);
      ctx.save(); ctx.globalAlpha = keep;
      M.ring(ctx, fig.x, fig.y, Math.max(34, fig.r), M.E(span(t, fT, fT + 0.3)), P.mark, 3);
      if (k0) {
        const kx = k0.x + k0.width / 2, lp = span(t, fT + 0.2, fT + 0.42);
        M.leader(ctx, fig.x, fig.y + Math.max(34, fig.r) + 20, kx, fy + fh + 30, lp, P.mark, 2);
        if (lp >= 1) { ctx.fillStyle = P.mark; ctx.beginPath(); ctx.arc(kx, fy + fh + 30, 5, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
      // the transcription: lead in grey, the statement in the light ink, the key runs highlighted
      const hp = M.E(span(t, at + 0.3, at + 0.3 + T.dur.wipe)) * keep;
      for (const r of keyRuns) M.highlight(ctx, r, line.size, hp, P, rtl);
      const word = (k, size) => (w, i, box, c) => {
        const s0 = at + (k + i) * stagger;
        if (M.set(c, span(t, s0, s0 + T.dur.in), out, size) === false) return false;
        if (w.key && hp > 0.5) return P.onAccent;
      };
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.grey, each: word(0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.ink, each: word(nLead, line.size) });
    },
  };
}
