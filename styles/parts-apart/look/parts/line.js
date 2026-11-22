// A line: the statement sits high on the frame in the light colour, an optional grey lead-in above it. Below, the device stands in
// the studio and comes apart, top part first; a leader climbs from the accent chip on its board to the key word, which is set in the
// key colour over a callout bracket (one bracket for a key phrase). When the scene closes, the parts sit back down on each other.
// spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, M0 = T.model;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  // a long lead-in takes a second row rather than shrinking under a readable size
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.96, minPx: 44, where: 'the lead-in' }) : null;
  const gapLL = lead ? 8 : 0, block = (lead ? lead.height : 0) + gapLL + line.height;
  const top = kit.place(block, 470);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gapLL : 0) + line.lead / 2, bottom = top + block;
  const bLine = M.boxes(kit, line, x0, x1, yLine), runs = M.keyRuns(bLine);
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + bLine.length;
  const step = Math.min(T.dur.step, 0.42 / Math.max(1, nAll)), firstKey = bLine.findIndex((b) => b.key);
  const tWord = (k) => at + k * step + (firstKey >= 0 && k >= nLead + firstKey ? 0.08 : 0);
  const out0 = d - T.dur.out;
  const dev = M.makeDevice(pal, { seed: 5 });
  const s = 0.86, cy = Math.max(1090, bottom + 520), cx = W / 2;
  const word = (t, base) => (w, i, box, c) => {
    const k = base + i;
    if (M.settle(c, t, tWord(k), T.dur.word, out0, d) === false) return false;
    if (w.key) return pal.key;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const P = M.view(M0.theta + M0.turn * t, s, cx, cy, M0.squash);
      const close = M.E(span(t, d - 0.5, d - 0.08));
      const hs = M.heights(dev, M0.gap, (i, n) => M.E(span(t, 0.08 + (n - 1 - i) * 0.09, 0.62 + (n - 1 - i) * 0.09)) * (1 - close));
      M.drawDevice(ctx, dev, P, hs);
      // the leader from the accent chip to the key phrase
      const board = dev.layers.findIndex((L) => L.chipAt);
      if (runs.length && board >= 0) {
        const L = dev.layers[board], [px, py] = P.pt(L.chipAt[0], L.chipAt[1], hs[board]);
        const r = runs[runs.length - 1], kx = (r.x0 + r.x1) / 2, onLast = r.row === line.rows.length - 1;
        const ky = onLast ? r.y + line.size * 0.68 + 10 : bottom + 14, elbow = Math.min(py - 40, bottom + 60);
        const pl = span(t, 0.75, 1.05) * (1 - span(t, d - 0.55, d - 0.35));
        M.leader(ctx, [[px, py], [px, elbow], [kx, elbow], [kx, ky]], pl, pal.wire, pal.accent);
      }
      const q = span(t, out0, d);
      ctx.save(); ctx.globalAlpha = 1 - q;
      runs.forEach((r) => M.bracket(ctx, r, line.size, pal.key, span(t, tWord(nLead + r.first), tWord(nLead + r.first) + 0.25), kit.rtl));
      ctx.restore();
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, each: word(t, 0) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.light, key: pal.key, each: word(t, nLead) });
    },
  };
}
