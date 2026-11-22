// A line in a comic panel: the panel zooms in at a slight tilt, then the words pop in one after another; the key word (*…*) bursts
// out of an accent starburst set behind it, in whichever ink reads on the accent. An optional lead-in rides on a small accent caption
// box pinned to the panel's top corner, like a comic's narration box. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, zoom, panel, burstPath, burst, keyBoxes } = await import(look.base + 'motion.js');
  const P = ground.P, padX = 56, padY = 22, maxW = SAFE.right - SAFE.left - 2 * padX;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.9, lead: 2 });   // room above and below each row for a key word's burst
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 80, single: true, where: 'the lead-in' }) : null;
  const capH = lead ? lead.lead + 16 : 0, block = capH * 0.6 + line.height + 2 * padY;
  const top = spec.y ?? kit.place(block, 700);
  const pTop = top + capH * 0.6, pH = line.height + 2 * padY, yLine = pTop + padY + line.lead / 2;
  const box = { x: SAFE.left, y: pTop, w: SAFE.right - SAFE.left, h: pH }, cx = W / 2, cy = pTop + pH / 2;
  const opts = { x0: SAFE.left + padX, x1: SAFE.right - padX, y: yLine };
  const keys = keyBoxes(kit, line, opts).map((b) => ({ ...b, path: burstPath(b.x + b.width / 2, b.y, b.width / 2 + line.space * 0.4, line.size * 0.56, line.size * 0.58, 14, b.i) }));
  const capW = lead ? lead.width + 60 : 0, capX = kit.rtl ? SAFE.right - capW - 30 : SAFE.left + 30, capY = top;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, out0 = d - T.dur.out;
  const word = (t, base, size) => (w, i, b, c) => {
    const t0 = at + 0.2 + (base + i) * T.dur.step;
    if (arrive(c, span(t, t0, t0 + T.dur.in), b, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      ctx.save();
      if (zoom(ctx, span(t, at, at + T.dur.panel), q, cx, cy, -0.02) !== false) {
        panel(ctx, box.x, box.y, box.w, box.h, P.paper, P, T);
        for (const k of keys) {
          const t0 = at + 0.2 + (nLead + k.i) * T.dur.step;
          ctx.save(); if (arrive(ctx, span(t, t0 - 0.05, t0 + T.dur.in), { x: k.x, y: k.y, width: k.width }, line.size) !== false) { ctx.fillStyle = P.accent; ctx.fill(k.path); } ctx.restore();
        }
        kit.drawText(ctx, line, { ...opts, color: P.ink, key: P.on, each: word(t, nLead, line.size) });
      }
      ctx.restore();
      if (lead) {
        ctx.save();
        if (zoom(ctx, span(t, at + 0.1, at + 0.1 + T.dur.panel), q, capX + capW / 2, capY + capH / 2, 0.035) !== false) {
          panel(ctx, capX, capY, capW, capH, P.accent, P, { ink: { line: T.ink.line * 0.75, shadow: T.ink.shadow * 0.6 } });
          kit.drawText(ctx, lead, { x0: capX, x1: capX + capW, y: capY + capH / 2, color: P.on, each: word(t, 0, lead.size) });
        }
        ctx.restore();
      }
    },
  };
}
