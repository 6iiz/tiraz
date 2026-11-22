// A line as a comic page of three panels cut by slanted gutters. The panels are inked in reading order; the big middle panel fills
// with focus lines that rush in toward a clear centre, the lead-in drops in a narration box at its reading-side top, and the
// statement is lettered word by word in the clear (each word stamped on). The key word (*…*) comes last, lettered as a sound
// effect: the brand's spot colour inside an ink outline and a paper rim. The camera drifts slowly down the page while it holds.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (the joint makes the cut; `cut` changes nothing here)
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 30, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 60, minScale: 0.88, where: 'the lead-in' }) : null;
  const bw = lead ? lead.width + 56 : 0, bh = lead ? lead.height + 26 : 0, gap = lead ? 56 : 0;
  const block = bh + gap + line.height;
  const top = spec.y ?? kit.place(block, 740);
  const bx = kit.rtl ? X1 - bw : X0, yLead = top + 13 + (lead ? lead.lead / 2 : 0), yLine = top + bh + gap + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const cy = top + block / 2, a = Math.max(line.width, bw) / 2 + 70, b = block / 2 + 80;
  // the page: three panels; tones and lines are built once
  const [p0, p1, p2] = M.page(W, H, [{ y: Math.min(232, top - 40), slope: -0.035 }, { y: Math.max(1300, top + block + 60), slope: 0.03 }]);
  const lines = M.focus(W, H, W / 2, cy, a, b, 170, 7 + line.width | 0, P.ink);
  const toneTop = M.tone(W, 300, T.tone.cell, (u, v) => 0.12 + 0.5 * (1 - u) * (0.6 + 0.4 * v), P.ink);
  const toneLow = M.tone(W, 700, T.tone.cell, (u, v) => 0.08 + 0.35 * v * u, P.ink);
  const rush = M.speed(W, 700, 70, 31, P.ink);
  const keyAt = at + 0.3 + line.rows.reduce((s, r) => s + r.words.length, 0) * T.dur.step + 0.04;
  let k = 0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.camera(ctx, W, H, span(t, 0, d));
      const i0 = 1, i1 = span(t, at, at + T.dur.ink), i2 = 1;                 // the page around is printed; the hero panel is inked
      M.panel(ctx, p0, i0, P.ink, i0 > 0.5 ? () => ctx.drawImage(toneTop, 0, 0) : null);
      M.panel(ctx, p2, i2, P.ink, i2 > 0.5 ? () => { ctx.drawImage(toneLow, 0, 1200); ctx.drawImage(rush, 0, 1200); } : null);
      M.panel(ctx, p1, i1, P.ink, () => {
        const f = M.SNAP(span(t, at + 0.1, at + 0.38));
        if (f <= 0) return;
        const s = 1 + 0.6 * (1 - f);
        ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s); ctx.translate(-W / 2, -cy); ctx.drawImage(lines, 0, 0); ctx.restore();
      });
      if (lead) {
        ctx.save();
        if (M.stamp(ctx, span(t, at + 0.15, at + 0.15 + T.dur.stamp), bx + bw, top, 0.12) !== false) {
          M.box(ctx, bx, top, bw, bh, P);
          kit.drawText(ctx, lead, { x0: bx + 28, x1: bx + bw - 28, y: yLead, align: 'start', color: P.ink });
        }
        ctx.restore();
      }
      k = 0;
      kit.drawText(ctx, line, { x0: X0, x1: X1, y: yLine, align: 'center', color: P.ink, key: P.accent,
        each: (w, i, bx_, c) => {
          const t0 = w.key ? keyAt : at + 0.3 + (k++) * T.dur.step;
          if (M.stamp(c, span(t, t0, t0 + T.dur.stamp), bx_.x + bx_.width / 2, bx_.y, w.key ? 0.5 : 0.18) === false) return false;
          if (w.key) return M.sfx(c, w, bx_, line.size, P);
        } });
      ctx.restore();
    },
  };
}
