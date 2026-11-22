// A line over the night city: the lead-in is small and grey, the statement large in the city's light. Each word is written by a light
// trail that runs along its row on its own subdivision of the beat, with a short rest before the key phrase; the key phrase is set in
// the accent and gets one long-exposure trail under the whole phrase. spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
//   cut: the words stay to the last frame and the joint cuts them away (a hard cut on the downbeat), instead of being wiped out.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 1, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const words = M.layout(kit, line, { x0, x1, y: yLine }), R = M.runs(words);
  const firstKey = words.find((w) => w.key)?.index ?? Infinity;
  const t0 = (k) => at + k * T.dur.step + (k >= nLead + firstKey ? T.dur.keyGap : 0);
  const out0 = d - T.dur.out - 0.12;
  const each = (t, base, size) => (w, i, box, c) => {
    const k = base + i;
    if (M.streakIn(c, span(t, t0(k), t0(k) + T.dur.in), box, size, rtl, pal) === false) return false;
    if (!spec.cut && M.streakOut(c, span(t, out0 + i * 0.02, out0 + i * 0.02 + T.dur.out), box, size, rtl, pal) === false) return false;
  };
  // a little life while the line holds: the trail under the key phrase breathes with the beat
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = spec.cut ? 1 : 1 - span(t, out0, out0 + T.dur.out);
      for (const r of R) {
        const ts = t0(nLead + r.first), te = t0(nLead + r.last) + T.dur.in;
        const pulse = 0.85 + 0.15 * Math.cos(((t + clock) / T.beat) * Math.PI * 2);
        M.trail(ctx, r, line.size, span(t, ts, te + 0.1), rtl, pal, fade * (t > te + 0.1 ? pulse : 1));
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, key: pal.key, each: each(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.light, key: pal.key, each: each(t, nLead, line.size) });
    },
  };
}
