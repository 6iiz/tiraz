// A line: every word is its own sheet of paper. In reading order each one stands up off the table on its bottom crease and opens
// out of a pleat, panel after panel from its reading-start edge, and lies flat. The key words (*…*) are one sheet of the accent's
// paper; once everything is open it flexes its creases once and settles a little higher, so its shadow deepens. The optional
// lead is a narrower strip above. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; joints are the card)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, D = T.dur, at = spec.at ?? 0, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 + Math.round(clock * 7) });
  const { E, flex, DEG } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 20;

  // rows: wrap on the flat measure, then make sure every row of sheets (with its paper margins) fits
  let size = T.size.line, rowsT;
  for (let tries = 0; tries < 6; tries++) {
    const f = kit.fit(spec.says.text, { size, weight: 800, maxW: maxW * 0.74, minScale: 0.72, where: 'the line' });
    size = f.size; rowsT = f.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' ').replace(/\*\s+\*/g, ' '));
    const widest = Math.max(...rowsT.map((t) => W3.measure(t, { size }).width));
    if (widest <= maxW) break;
    size = Math.floor(size * maxW / widest);
  }
  const rows = []; for (const t of rowsT) rows.push(await W3.row(t, { size }));
  let lead = null;
  if (spec.says.lead) {
    let ls = T.size.lead; const lw = W3.measure(spec.says.lead, { size: ls, weight: 600, whole: true }).width;
    if (lw > maxW) ls = Math.max(44, Math.floor(ls * maxW / lw));
    lead = await W3.row(spec.says.lead, { size: ls, weight: 600, kind: 'lead', whole: true });
  }
  const gapL = 30, gapR = T.sheet.rowGap;
  const total = (lead ? lead.h + gapL : 0) + rows.reduce((a, r) => a + r.h, 0) + gapR * (rows.length - 1);
  let y = kit.place(total, spec.y ?? T.layout.centre);
  if (lead) { lead.place({ y }); y += lead.h + gapL; }
  for (const r of rows) { r.place({ y }); y += r.h + gapR; }

  // timing: everything is open inside the window, so a hook (at = -0.8) is whole on its first frame
  const all = rows.flatMap((r) => r.sheets), n = all.length, u = D.unfold;
  const stg = n > 1 ? Math.min(D.stagger, (D.window - u - D.first) / (n - 1)) : 0;
  const t0 = (k) => at + D.first + k * stg;
  const tEnd = t0(n - 1) + u, tFlex = tEnd + 0.12;
  return {
    duration: d,
    draw(ctx, t) {
      if (lead) lead.sheets[0].pose(span(t, at, at + u));
      all.forEach((sh, k) => {
        const p = span(t, t0(k), t0(k) + u);
        if (sh.kind === 'key') {
          const q = span(t, tFlex, tFlex + D.flex), up = E(span(t, tFlex, tFlex + D.flex * 0.7));
          sh.pose(p, { flex: flex(q) * T.fold.flex * DEG, z: up * T.z.key });
        } else sh.pose(p);
      });
      W3.draw(ctx, t);
    },
  };
}
