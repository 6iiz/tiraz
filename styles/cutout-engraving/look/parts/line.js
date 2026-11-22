// A line as a collage: the lead-in is a small dark label slip, the statement is set on a torn paper slip, and both are put down
// lifted and pressed onto the table on twos. Then the key word (*…*) is pasted over itself on its own slip of the accent, turned
// the other way and a touch larger, so it stands off the page. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: T.textW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: T.textW - 60, minScale: 0.75, where: 'the lead-in' }) : null;
  const sw = line.width + 90, sh = line.height + 50, lw = lead ? lead.width + 60 : 0, lh = lead ? lead.height + 26 : 0;
  const block = lh + (lead ? 26 : 0) + sh, top = spec.y ?? Math.min(kit.place(block, 660), T.floor - block);
  const cxL = W / 2 + (rtl ? 1 : -1) * Math.max(0, (sw - lw) / 2 - 20), cyL = top + lh / 2, cy = top + lh + (lead ? 26 : 0) + sh / 2;
  const slipS = M.torn(sw, sh, 31, 12), leadS = lead ? M.torn(lw, lh, 37, 8) : null;
  const keys = []; { const c = document.createElement('canvas').getContext('2d');
    kit.drawText(c, line, { x0: -line.width / 2, x1: line.width / 2, y: -line.height / 2 + line.lead / 2, each: (w, i, b) => { if (w.key) keys.push({ b, w }); return false; } }); }
  const keyS = keys.map(({ b }, i) => M.torn(b.width + line.size * 0.3, line.size * 1.24, 41 + i, 7));
  const keyText = keys.map(({ w }) => kit.fit(w.w, { size: line.size, weight: T.weight.line, maxW: 2000, single: true, where: 'the key word' }));
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      if (lead) M.piece(ctx, P, M.press(span(tt, at, at + T.dur.press), -1.6, -1), cxL, cyL, leadS, (c) => {
        M.slip(c, P, leadS, P.ink); kit.drawText(c, lead, { x0: -lead.width / 2, x1: lead.width / 2, y: -lead.height / 2 + lead.lead / 2, color: P.paper, key: P.paper });
      });
      M.piece(ctx, P, M.press(span(tt, at + 0.17, at + 0.17 + T.dur.press), 0.8, 1), W / 2, cy, slipS, (c) => {
        M.slip(c, P, slipS, P.paper);
        kit.drawText(c, line, { x0: -line.width / 2, x1: line.width / 2, y: -line.height / 2 + line.lead / 2, color: P.ink, key: P.ink });
        keys.forEach(({ b }, i) => M.piece(c, P, M.press(span(tt, at + 0.6 + i * 0.1, at + 0.6 + i * 0.1 + T.dur.press), -2.4, -1), b.x + b.width / 2, b.y, keyS[i], (k) => {
          k.scale(1.03, 1.03); M.slip(k, P, keyS[i], P.accent);
          kit.drawText(k, keyText[i], { x0: -b.width / 2 - 20, x1: b.width / 2 + 20, y: 0, color: P.onAccent, key: P.onAccent });
        }));
      });
    },
  };
}
