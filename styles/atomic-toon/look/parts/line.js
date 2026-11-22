// A line as a classroom card on a colour-plane wall: the lead-in pops on in a paper pill printed off register inside its broken ink
// line, then the statement's words pop on one by one in held drawings (small, overshoot, settle). The key word (*…*) sits on a kidney
// of the accent printed off its own line, and two atomic sparkles pop beside it and twinkle while the card holds.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (the joint makes the cut)
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, room: 0 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 60, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 90, minScale: 0.9, where: 'the lead-in' }) : null;
  const pw = lead ? lead.width + 90 : 0, ph = lead ? lead.height + 26 : 0, gap = lead ? 60 : 0;
  const block = ph + gap + line.height, top = spec.y ?? kit.place(block, 720);
  const px = rtl ? X1 - pw : X0, yLine = top + ph + gap + line.lead / 2;
  const pill = M.round(px, top, pw, ph, Math.min(ph / 2, 50));
  const words = line.rows.reduce((s, r) => s + r.words.length, 0), keyT = at + 0.12 + words * T.dur.step + 0.04;
  let keyBox = null, k = 0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (lead) {
        ctx.save();
        if (M.grow(ctx, M.pop(t, at, T.dur.pop), rtl ? px + pw : px, top + ph / 2) !== false) {
          M.cel(ctx, pill, { fill: P.paper, line: P.ink, width: 4, id: 31, t, gaps: 0.16 });
          kit.drawText(ctx, lead, { x0: px + 45, x1: px + pw - 45, y: top + 13 + lead.lead / 2, align: 'start', color: P.ink });
        }
        ctx.restore();
      }
      keyBox = null;
      const tw = { x0: X0, x1: X1, y: yLine, align: 'center' };
      M.blobs(kit, ctx, line, tw, P, t, 40, (w, i, b, c) => M.grow(c, M.pop(t, keyT, T.dur.pop), b.x + b.width / 2, b.y));
      k = 0;
      kit.drawText(ctx, line, { ...tw, color: P.ink, key: P.onAccent,
        each: (w, i, b, c) => {
          const t0 = w.key ? keyT : at + 0.12 + (k++) * T.dur.step;
          if (M.grow(c, M.pop(t, t0, T.dur.pop), b.x + b.width / 2, b.y) === false) return false;
          if (w.key && !keyBox) keyBox = b;
        } });
      if (keyBox && t >= keyT + 0.2) {                                // two sparkles pop beside the key word and twinkle on twos
        const n = M.twos(t), xs = rtl ? keyBox.x - 10 : keyBox.x + keyBox.width + 10;
        [[xs, keyBox.y - line.size * 0.7, 30, 0], [rtl ? keyBox.x + keyBox.width + 16 : keyBox.x - 16, keyBox.y - line.size * 0.62, 20, 1]].forEach(([x, y, r, j]) => {
          const s = M.pop(t, keyT + 0.2 + j * 0.12, 0.3) * (1 + 0.18 * Math.sin(n * 1.7 + j * 2));
          if (s <= 0) return;
          M.cel(ctx, M.sparkle(x, y, r * s), { fill: j ? P.accent : P.paper, line: P.ink, width: 3, id: 60 + j, t, gaps: 0.05 });
        });
      }
    },
  };
}
