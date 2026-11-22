// A line, set solid: every row of the statement sits on its own ink slab that runs off the reading-side edge of the frame, the words
// in paper colour sliding into their slots after it; the key word (*…*) gets an accent block that stands a little proud of the slab,
// set in whichever ink reads on the accent. Above, a composition lands: an accent circle rolls in, a heavy diagonal is drawn across
// behind it, a mid-tone triangle turns into place. An optional lead-in sits on the paper above the slabs.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, circle, triangle, bar } = await import(look.base + 'motion.js');
  const P = ground.P, dir = ground.dir, sx = ground.sx, rtl = ground.rtl;
  const pad = T.size.line * T.bar.pad, maxW = SAFE.right - SAFE.left - pad;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 820);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const x0 = rtl ? SAFE.left + pad : SAFE.left, x1 = rtl ? SAFE.right : SAFE.right - pad;
  const bh = line.size * T.bar.h, out0 = d - T.dur.out;
  const C = { x: sx(320), y: Math.max(top - 300, 60), r: 210 };
  const word = (t, base, size) => (w, i, box, c) => {
    const t0 = at + 0.18 + (base + i) * T.dur.step;
    if (arrive(c, span(t, t0, t0 + T.dur.in), box, size, dir) === false) return false;
    if (leave(c, span(t, out0, d), box, size, dir) === false) return false;
    if (w.key) { c.fillStyle = P.accent; const g = line.space * 0.42; c.fillRect(box.x - g, box.y - size * 0.72, box.width + 2 * g, size * 1.44); return P.on; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), gone = (p) => (out > 0 ? Math.max(0, p - out * 1.4) : p);
      const sh = (i) => gone(span(t, at + i * 0.1, at + i * 0.1 + T.dur.shape));
      bar(ctx, sh(0), sx(-40), C.y + 260, sx(1120), C.y - 250, 54, P.ink);
      circle(ctx, sh(1), C.x, C.y, C.r, P.accent, { x: dir * -(C.r * 2 + 400), y: 0 });
      triangle(ctx, sh(2), sx(760), C.y + 80, 230, P.mid, { x: 0, y: -260 }, Math.PI);
      line.rows.forEach((row, r) => {
        const y = yLine + r * line.lead, a = rtl ? x1 - row.width - pad : 0, b = rtl ? W : x0 + row.width + pad;
        ctx.save(); ctx.translate(-dir * W * span(t, out0 + r * 0.04, d) ** 2, 0);
        ground.slab(ctx, span(t, at + r * 0.08, at + r * 0.08 + T.dur.in), a, b, y, bh, P.ink);
        ctx.restore();
      });
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.ink, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.paper, key: P.on, each: word(t, nLead, line.size) });
    },
  };
}
