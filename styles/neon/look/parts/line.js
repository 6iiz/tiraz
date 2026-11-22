// A line as a neon sign: an accent tube frame is mounted round it and lights first, then the words ignite one after another in the
// light tube colour, each with its own stutter; the key word (*…*) is a hot accent tube. An optional lead-in is a smaller tube above.
// The sign's light spills onto the wall behind it. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, inset = 56, x0 = SAFE.left + inset - 30, x1 = SAFE.right - inset + 30, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const padY = 70, gap = lead ? 26 : 0, inner = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(inner + 2 * padY, 640), yLead = top + padY + (lead ? lead.lead / 2 : 0), yLine = top + padY + (lead ? lead.height + gap : 0) + line.lead / 2;
  const fx = SAFE.left - 30, fw = SAFE.right - SAFE.left + 60, fy = top, fh = inner + 2 * padY;
  const frame = M.shape(fx, fy, fw, fh, (c) => { c.beginPath(); c.roundRect(fx, fy, fw, fh, T.tube.radius); c.stroke(); }, pal.hot, pal, T, T.tube.frame);
  const sLead = lead && M.sign(kit, lead, { x0, x1, y: yLead, align: 'center' }, { base: pal.white, key: pal.hot }, pal, T);
  const sLine = M.sign(kit, line, { x0, x1, y: yLine, align: 'center' }, { base: pal.white, key: pal.hot }, pal, T);
  const nLead = sLead ? sLead.words.length : 0, out0 = d - T.dur.out;
  const level = (t, k) => M.flick(span(t, at + k * T.dur.step, at + k * T.dur.step + T.dur.ignite), k + 3) * M.douse(span(t, out0 + (k % 3) * 0.03, d), k + 3);
  const keyAt = sLine.words.find((w) => w.key);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const bf = M.flick(span(t, at - 0.3, at + 0.1), 1) * M.douse(span(t, out0, d - 0.05), 1);
      const bl = level(t, nLead + sLine.words.length - 1);
      ground.spill(ctx, W / 2, fy + fh / 2, 1300, fh + 600, pal.light, bl * 0.6);
      ground.spill(ctx, W / 2, fy + fh / 2, 1200, fh + 500, pal.accent, bf * 0.8);
      if (keyAt) ground.spill(ctx, keyAt.x + keyAt.width / 2, keyAt.y, keyAt.width * 3, line.size * 4, pal.accent, level(t, nLead + sLine.words.indexOf(keyAt)));
      frame.draw(ctx, bf);
      if (sLead) sLead.draw(ctx, (i) => level(t, i) * 0.85);
      sLine.draw(ctx, (i) => level(t, nLead + i));
    },
  };
}
