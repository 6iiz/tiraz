// A line in shadow: the lead-in is a softer, smaller shadow above; the statement is the hard dark shadow of cut hide letters pressed to
// the cloth, centred like a play's title. Words are brought from the lamp to the screen one after another from the reading side. A key
// phrase (*…*) is pressed onto one carved plaque of dyed hide held on a rod; the rod taps it once. The whole line lands within 0.68 s of
// `at`, so a hook that opens the reel at at = -0.8 is complete on the first frame.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   cut: the line stays until the joint takes it (no lift).
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 40;
  const line = M.isolate(kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.85, where: 'the line' }), M.plaquePx(T.size.line) + 12, maxW);
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 30 : 0, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? kit.place(block, 740);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const count = (f) => f.rows.reduce((s, r) => s + r.words.filter((w) => !w.ph).length, 0);
  const nLead = lead ? count(lead) : 0, n = nLead + count(line), pr = T.dur.press;
  const step = n > 1 ? Math.min(T.dur.step, (0.68 - pr) / (n - 1)) : 0, tw = (i) => at + i * step;
  const runs = M.keyRuns(line, x0, x1, yLine, 'center', rtl).map((r, k) => ({ ...r, pl: M.runPlaque(r, line.size, P, 30 + k), tj: Math.max(tw(nLead + r.first) + pr, 0.55), seed: k }));
  const runOf = new Map(); runs.forEach((r) => { for (let i = r.first; i <= r.last; i++) runOf.set(i, r); });
  const outAt = (i) => d - T.dur.out + Math.min(i * 0.02, 0.1);
  const word = (t, base) => (w, i, box, c) => {
    if (w.ph) return false;
    const j = w.idx ?? i, k = base + j, cx = box.x + box.width / 2;
    if (M.press(c, span(t, tw(k), tw(k) + pr), cx, box.y, dir) === false) return false;
    if (!spec.cut && M.lift(c, span(t, outAt(k), d), cx, box.y) === false) return false;
    if (w.key && base === nLead && runOf.has(j)) c.translate(0, M.bob(t, runOf.get(j).tj, runOf.get(j).seed));
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      for (const r of runs) {
        const k = nLead + r.first, cx = (r.x0 + r.x1) / 2;
        ctx.save();
        if (M.press(ctx, span(t, tw(k), tw(k) + pr), cx, r.y, dir) === false || (!spec.cut && M.lift(ctx, span(t, outAt(k), d), cx, r.y) === false)) { ctx.restore(); continue; }
        ctx.translate(0, M.bob(t, r.tj, r.seed));
        const end = rtl ? cx - r.pl.w / 2 + 40 : cx + r.pl.w / 2 - 40;
        M.rod(ctx, end, r.y + line.size * 0.6, rtl ? -50 : 50, 150, P);
        M.lay(ctx, r.pl, cx, r.y);
        ctx.restore();
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'center', color: P.soft, each: word(t, 0) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: P.ink, key: P.ink, each: word(t, nLead) });
    },
  };
}
