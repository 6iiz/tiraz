// A line as a title card over the painted night: the lead-in on a dark cel plate edged with the accent, then the statement in cel
// lettering (outline, flat fill, a hard shadow band), each row sliding in from the reading side on a few held drawings with speed
// streaks behind it. The key word (*…*) is lit from behind: it glows in the accent, and a star glint catches it when it lands and
// again now and then while the card holds. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (the joint makes the cut)
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 40, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 90, minScale: 0.9, where: 'the lead-in' }) : null;
  const bw = lead ? lead.width + 90 : 0, bh = lead ? lead.height + 22 : 0, gap = lead ? 50 : 0;
  const block = bh + gap + line.height, top = spec.y ?? kit.place(block, 700);
  const bx = rtl ? X1 - bw + 20 : X0 - 20, yLine = top + bh + gap + line.lead / 2;
  const rowT = (r) => at + 0.15 + r * T.dur.step;
  const keyT = rowT(line.rows.length - 1) + T.dur.slide;
  let keyBox = null;
  return {
    duration: d,
    draw(ctx, t) {
      const th = M.held(t);
      ground.draw(ctx, t);
      if (lead) {
        M.bar(ctx, bx, top, bw, bh, P, span(th, at, at + 0.17));
        M.cel(kit, ctx, lead, { x0: bx + 45, x1: bx + bw - 45, y: top + 11 + lead.lead / 2, align: 'start', P, rtl,
          at: () => span(th, at + 0.08, at + 0.08 + T.dur.slide) });
      }
      keyBox = null;
      M.cel(kit, ctx, line, { x0: X0, x1: X1, y: yLine, align: 'center', P, rtl,
        at: (w, i, b) => span(th, rowT(b.row), rowT(b.row) + T.dur.slide), onKey: (b, dx) => { if (!keyBox) keyBox = { x: b.x + dx, y: b.y, w: b.width }; } });
      if (keyBox && th >= keyT) {
        const cyc = (th - keyT) % 1.5;
        M.glint(ctx, rtl ? keyBox.x + keyBox.w * 0.1 : keyBox.x + keyBox.w * 0.9, keyBox.y - line.size * 0.45, line.size * 0.55, cyc / 0.5, P.light);
      }
      ground.over(ctx, t);
    },
  };
}
