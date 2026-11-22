// A line as a chip: the statement is printed in silkscreen on the body of a long chip that lies across the board, pins along its top
// and bottom edges. Current comes up the stubs into the bottom pins from the reading side and sweeps across; each word powers up as
// the sweep passes above it. Then the key word (*…*) gets its own exposed gold pad, which lights, and the word is set on it in the
// colour that reads best on gold. The lead-in is a small designator note above the chip. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const tx0 = SAFE.left + 30, tx1 = SAFE.right - 30;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: tx1 - tx0, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 20, single: true, where: 'the lead-in' }) : null;
  const padY = 58, bodyH = line.height + padY * 2, leadH = lead ? lead.lead + 34 : 0, pinL = 34, stub = 70;
  const top = spec.y ?? kit.place(leadH + pinL + bodyH + pinL + stub, 660);
  const yLead = top + (lead ? lead.lead / 2 : 0), b0 = top + leadH + pinL, b1 = b0 + bodyH, yLine = b0 + padY + line.lead / 2;
  const cx0 = SAFE.left - 24, cx1 = SAFE.right + 24;
  // pins, numbered from the reading side
  const n = Math.floor((cx1 - cx0 - 60) / 58), pitch = (cx1 - cx0 - 60) / (n - 1);
  const pins = Array.from({ length: n }, (_, j) => { const x = rtl ? cx1 - 30 - j * pitch : cx0 + 30 + j * pitch; return { x, t: at + T.dur.spread * (j / (n - 1)) }; });
  const stubs = pins.map((p) => M.route([[p.x, b1 + pinL + stub], [p.x, b1 + pinL]]));
  // when the sweep reaches a point of the chip
  const sweepAt = (x) => at + T.dur.spread * Math.max(0, Math.min(1, (rtl ? cx1 - 30 - x : x - cx0 - 30) / (cx1 - cx0 - 60)));
  const wb = M.boxes(kit, line, { x0: tx0, x1: tx1, y: yLine, align: 'start' });
  const keys = wb.filter((b) => b.key), keyT = at + T.dur.key;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), o = M.I(out);
      if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -36 * o);
      // a clear field under the chip and the note, so nothing on the board runs under the words
      M.field(ctx, cx0 - 30, top - 14, cx1 + 30, b1 + pinL + stub + 22, P);
      for (let j = 0; j < n; j++) {
        const p = pins[j], q = span(t, p.t - T.dur.run, p.t);
        M.trace(ctx, stubs[j], P, 8);
        if (q > 0 && q < 1) M.glow(ctx, stubs[j], P, stubs[j].total * M.Q(q) - 50, stubs[j].total * M.Q(q), 8);
        const lit = span(t, p.t, p.t + 0.1) * (1 - 0.6 * span(t, p.t + 0.1, p.t + 0.6));
        M.via(ctx, p.x, b1 + pinL + stub, 8, P);
        M.pad(ctx, p.x - 11, b0 - pinL, 22, pinL - 2, 3, P, lit);
        M.pad(ctx, p.x - 11, b1 + 2, 22, pinL - 2, 3, P, lit);
      }
      M.chip(ctx, cx0, b0, cx1, b1, P, rtl);
      // the key pad
      const kp = span(t, keyT, keyT + 0.22);
      if (kp > 0) for (const k of M.spans(keys)) {
        const s = line.size, e = M.E(kp), w = k.width + s * 0.36, h = s * 1.22;
        ctx.save(); ctx.translate(k.x + k.width / 2, k.y); ctx.scale(0.86 + 0.14 * e, 0.86 + 0.14 * e); ctx.globalAlpha *= Math.min(1, kp * 3);
        M.pad(ctx, -w / 2, -h / 2 - s * 0.04, w, h, 10, P, Math.sin(Math.PI * Math.min(1, kp * 1.6)) * 0.9);
        ctx.restore();
      }
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: P.dim,
        each: (w, i, box, c) => M.power(c, t, at - 0.3 + i * 0.05, T.dur.in, box, lead.size, P) });
      kit.drawText(ctx, line, { x0: tx0, x1: tx1, y: yLine, align: 'start', color: P.silk, key: P.silk,
        each: (w, i, box, c) => {
          if (M.power(c, t, sweepAt(box.x + box.width / 2) + 0.04, T.dur.in, box, line.size, P) === false) return false;
          if (w.key && t >= keyT + 0.08) return P.onGold;
        } });
      ctx.restore();
    },
  };
}
