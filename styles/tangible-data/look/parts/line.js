// A line in the studio: the statement is set flush to the reading side, words set down one after another; the key phrase (*…*) stands
// on a raised accent plaque (one plaque per phrase, with its own thickness and shadow) that falls into place under it. Below, on the
// inlaid stone base, a stack of plates is assembled one plate per beat while the line holds: it counts time, not data, and carries no
// number. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette;
  const maxW = SAFE.right - SAFE.left - 40;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 680);
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const spans = M.keySpans(line, x0, x1, yLine, 'start', rtl);
  const nWords = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const stagger = Math.min(T.dur.stagger, 0.34 / Math.max(1, nWords - 1));       // an opening hook has landed by its first frame
  const keyT = at + Math.min(0.38, 0.1 + nWords * stagger);
  const floor = T.floor, PL = T.plate, sw = PL.w, sx = rtl ? SAFE.left + 60 : SAFE.right - 60 - sw;
  const maxPlates = Math.max(0, Math.min(9, Math.floor((floor - (top + block + 120)) / (PL.thick + PL.gap))));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const up = M.lift(span(t, out0, d)), rise = -up * 140, fade = 1 - up;
      // the base, and the stack that keeps time on it
      M.base(ctx, SAFE.left - 30, SAFE.right + 30, floor, P, rtl, span(t, at - 0.2, at + 0.3));
      ctx.save(); ctx.globalAlpha = fade;
      for (let k = 0; k < maxPlates; k++) {
        const t0 = at + 0.5 + k * T.beat, p = span(t, t0, t0 + T.dur.fall);
        if (p <= 0) break;
        const j = M.jitter(11, k), y = floor - (k + 1) * (PL.thick + PL.gap) + M.fall(p, 260) + rise * (k / maxPlates);
        M.shadow(ctx, sx + j.x, floor - PL.thick, sw + j.w, PL.thick, PL.depth, P, rtl, p * 0.35, 0.4 + k * 0.12);
        M.box(ctx, sx + j.x, y, sw + j.w, PL.thick, PL.depth, k % 5 === 4 ? P.ruler : P.metal, rtl, 1);
      }
      ctx.restore();
      ctx.save(); ctx.translate(0, rise); ctx.globalAlpha = fade;
      // the plaque under the key phrase falls into place, with its shadow tightening as it lands
      const pk = span(t, keyT, keyT + T.dur.fall), off = M.fall(pk, 180);
      for (const s of spans) {
        if (pk <= 0) break;
        const pad = line.size * 0.07, bx = s.x0 - pad, by = s.y - line.size * 0.66, bw = s.x1 - s.x0 + pad * 2, bh = line.size * 1.3;
        M.shadow(ctx, bx, by, bw, bh, 12, P, rtl, pk, 0.35);
        M.box(ctx, bx, by + off, bw, bh, 12, P.acc, rtl);
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.muted,
        each: (w, i, box, c) => { const t0 = at + i * stagger; if (M.setDown(c, span(t, t0, t0 + T.dur.word), lead.size) === false) return false; } });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.onAccent,
        each: (w, i, box, c) => {
          const t0 = at + (nLead + i) * stagger;
          if (w.key) { if (pk <= 0) return false; c.translate(0, off); return; }
          if (M.setDown(c, span(t, t0, t0 + T.dur.word), line.size) === false) return false;
        } });
      ctx.restore();
    },
  };
}
