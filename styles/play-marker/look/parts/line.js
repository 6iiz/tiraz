// A line as one freeze, one finding. The passage of play runs on the broadcast picture, then freezes with a punch-in; the analyst
// shades the gap nobody covered, rings the runner's feet and draws the pass as a curved marker arrow. The statement sits on a
// broadcast card at the top, slid in from the reading side; the key phrase (*…*) is in the marker's colour with one hand-drawn
// underline per run. spec: { duration, at?, y?, cut?, says: { text, lead? } }  (cut: accepted; the card always slides out the same way)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, field = ground.field, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const pad = 40, bar = 12, x0 = SAFE.left + pad + (rtl ? 0 : bar), x1 = SAFE.right - pad - (rtl ? bar : 0), maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.96, where: 'the lead-in' }) : null;
  const gap = lead ? 6 : 0, cardH = pad * 2 - 10 + (lead ? lead.height + gap : 0) + line.height, cy = spec.y ?? 300;
  const yLead = cy + pad - 5 + (lead ? lead.lead / 2 : 0), yLine = cy + pad - 5 + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const keyRuns = M.runs(M.boxes(kit, line, { x0, x1, y: yLine, align: 'start' }));
  const stagger = Math.min(T.dur.stagger, 0.3 / Math.max(1, nAll - 1));
  const t0 = at - 1.0, fT = at + 0.25;                         // the play starts a second before the part, and freezes here
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const live = Math.min(t, fT), tau = Math.max(0, live - t0), out = span(t, d - T.dur.out, d);
      const zoom = M.punch(t, fT) * (1 + 0.035 * M.IO(span(t, fT + 0.3, d))), pan = -50 * M.IO(tau / 1.6);
      const V = M.view(ctx, W, H, field, tau, { pan, zoom, fx: W / 2, fy: 1150, P });
      M.flash(ctx, W, H, t, fT, P);
      const pl = V.pl, keep = 1 - M.I(out);
      ctx.save(); ctx.globalAlpha = keep;
      const B2 = pl.B2, B4 = pl.B4, A1 = pl.A1, A2 = pl.A2;
      M.zone(ctx, V.to, [[B2.x + 1.2, B2.z - 2], [B4.x - 1.2, B4.z - 2], [B4.x - 1.8, B4.z + 4], [B2.x + 1.8, B2.z + 4]], M.E(span(t, fT + 0.05, fT + 0.3)), P.pen);
      const [ax, ay] = V.to(A2.x, A2.z); M.ring(ctx, ax, ay, V.k(A2.z), span(t, fT + 0.1, fT + 0.38), P.pen, T.pen);
      const [px, py] = V.to(A1.x, A1.z); M.arrow(ctx, [px, py - 6], [ax - 10, ay - 20], span(t, fT + 0.2, fT + 0.5), P.pen, T.pen, rtl ? 0.2 : -0.2);
      ctx.restore();
      M.chip(ctx, t < fT ? 'live' : 'freeze', live * T.fps + 3120, P, mono, rtl);
      // the card and its words
      const off = M.card(ctx, SAFE.left, cy, SAFE.right - SAFE.left, cardH, span(t, at - 0.05, at + T.dur.card), out, P, rtl, bar);
      ctx.save(); ctx.translate(off, 0);
      const word = (k, size) => (w, i, box, c) => { const s0 = at + 0.08 + (k + i) * stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), out, size, rtl) === false) return false; };
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.grey, key: P.key, each: word(0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.light, key: P.key, each: word(nLead, line.size) });
      keyRuns.forEach((r, j) => {
        const y = r.y + line.size * 0.6, a = rtl ? r.x + r.width + 6 : r.x - 6, b = rtl ? r.x - 6 : r.x + r.width + 6;
        const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([a + (b - a) * u, y + Math.sin(u * 3.1 + j) * 4 + u * 5]); }
        ctx.globalAlpha = keep; M.pen(ctx, pts, span(t, at + 0.38, at + 0.38 + T.dur.pen), P.pen, 7, 11 + j);
      });
      ctx.restore();
    },
  };
}
