// A line as a stretch of the map: the statement is printed in ink, and under it one map line is drawn by its pen tip from the
// reading side's edge. Each word is a stop: a tick appears on the line under it as the tip passes and the word is printed out of that
// side. The key word (*…*) is an interchange: its name plate in the accent and a capsule on the line drop into place together, and a
// second line grows out of the capsule and away down the sheet. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, w = T.line.w;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), I = ground.I;
  const X = (x) => (rtl ? x : W - x);
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.lead + 20 : 0, below = 50 + 260;
  const top = spec.y ?? kit.place(leadH + line.height + below, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + leadH + line.lead / 2, yR = top + leadH + line.height + 40;
  const R = M.route([[X(W + 20), yR], [X(SAFE.left + 120), yR], [X(SAFE.left + 40), yR + 80], [X(-20), yR + 80]], T.line.r);
  const t0 = at - 0.1, tD = T.dur.draw;
  const tip = (t) => R.total * M.D(span(t, t0, t0 + tD));
  const inv = (f) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (M.D(m) < f) lo = m; else hi = m; } return lo; };
  const when = (x) => t0 + tD * inv(clamp(M.lengthAt(R, x) / R.total));
  const wb = M.boxes(kit, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start' });
  const stops = []; for (const b of wb) { const x = b.x + b.width / 2; if (!stops.some((s) => Math.abs(s.x - x) < 70)) stops.push({ x, t: when(x), key: b.key }); }
  const keys = wb.filter((b) => b.key), k0 = keys[0];
  const kx = k0 ? (Math.min(...keys.map((b) => b.x)) + Math.max(...keys.map((b) => b.x + b.width))) / 2 : 0;
  const kW = k0 ? Math.max(...keys.map((b) => b.x + b.width)) - Math.min(...keys.map((b) => b.x)) : 0;
  const kT = k0 ? when(kx) + 0.08 : 0;
  const s = rtl ? -1 : 1;
  const L2 = k0 ? M.route([[kx, yR], [kx, yR + 110], [kx + s * 110, yR + 220], [X(-40), yR + 220]], T.line.r) : null;
  const wordT = (b) => when(rtl ? b.x + b.width : b.x);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, d - T.dur.out, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -30 * o);
      if (L2) { const p = M.D(span(t, kT + 0.1, kT + 0.6)); if (p > 0) M.line(ctx, L2, I.lines[1], w, 0, L2.total * p, true); }
      M.line(ctx, R, I.lines[0], w, 0, tip(t), true);
      for (const st of stops) if (!st.key) M.tick(ctx, st.x, yR, 0, -1, I.lines[0], w, span(t, st.t, st.t + 0.12));
      if (k0) M.capsule(ctx, kx, yR, Math.max(30, kW * 0.45), w, I, span(t, kT, kT + 0.3));
      if (k0) for (const b of M.spans(keys)) M.plate(ctx, b, line.size, I.accent, span(t, kT, kT + 0.3));
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: I.dim,
        each: (w2, i, box, c) => M.print(c, span(t, at - 0.35 + i * 0.06, at - 0.35 + i * 0.06 + T.dur.print), box, lead.size, rtl) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start', color: I.ink, key: I.ink,
        each: (w2, i, box, c) => {
          const tw = wordT(box);
          if (M.print(c, span(t, tw, tw + T.dur.print), box, line.size, rtl) === false) return false;
          if (w2.key && t >= kT) return I.onAccent;
        } });
      ctx.restore();
    },
  };
}
