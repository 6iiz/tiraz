// A line read off the scope. The beam sweeps once across the screen from the reading side, drawing a quiet signal under the words;
// each word lights the moment the beam runs beneath it, hot at first, then glowing as it cools. Under the key word (*…*) the signal
// rises into one clean peak, and the key word is in the full beam colour. On the way out the light dies away.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, g = ground.g;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 20 : 0, block = (lead ? lead.height + gap : 0) + line.height, under = 230;
  const top = spec.y ?? kit.place(block + under, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const sLead = lead && M.lightText(kit, lead, { x0, x1, y: yLead, align: 'start' }, pal, T, pal.soft);
  const sLine = M.lightText(kit, line, { x0, x1, y: yLine, align: 'start' }, pal, T);
  const keys = sLine.boxes.filter((b) => b.key), kc = keys.length ? (Math.min(...keys.map((b) => b.x)) + Math.max(...keys.map((b) => b.x + b.width))) / 2 : null;
  const base = top + block + under * 0.62, xa = rtl ? g.x1 : g.x0, xb = rtl ? g.x0 : g.x1;
  const pts = M.curve(xa, xb, (x) => base + Math.sin((x - g.x0) / 26) * 9 * (1 - (kc != null ? M.bump(x, kc, 90) : 0)) - (kc != null ? M.bump(x, kc, 60) * 120 : 0));
  const sw = T.dur.sweep, out0 = d - T.dur.out;
  const pass = (x) => at + sw * Math.abs(x - xa) / Math.abs(xb - xa);              // when the beam is under x
  const tOf = (b) => pass(b.x + b.width / 2);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = t < out0 ? 1 : Math.exp(-(t - out0) / 0.09);
      const head = span(t, at, at + sw);
      M.trace(ctx, pts, pal, { head, alpha: fade, age: (k) => M.cool(t - pass(pts[k][0]), T.dur.tau, 0.4) });
      const lv = (bx) => (i) => M.cool(t - tOf(bx[i]), T.dur.tau, 0.7) * fade, ht = (bx) => (i) => M.cool(t - tOf(bx[i]), T.dur.heat, 0);
      if (sLead) sLead.draw(ctx, lv(sLead.boxes), ht(sLead.boxes));
      sLine.draw(ctx, lv(sLine.boxes), ht(sLine.boxes));
    },
  };
}
