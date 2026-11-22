// A line as montage: a film window above cuts to a new shot on every beat; under it the statement is built as a stack of ink beams,
// one beam per row, each slammed in from alternate sides a sixteenth after the one before, stepping in from the reading side. The key
// word (*…*) is a red segment of its beam. The lead-in is a small ink tab with a red rivet. spec: { duration, at?, y?, cut?, says: { text, lead? } }
//   cut: the reel cuts away hard (no exit move; the joint takes it).
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, step = 46;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: 760, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 120, single: true, where: 'the lead-in' }) : null;
  const rowH = line.size * 1.6, gap = 14, leadH = lead ? lead.size * 1.6 + 26 : 0;
  const block = leadH + line.rows.length * (rowH + gap) - gap;
  const top = spec.y ?? kit.place(block, 960);
  const winTop = T.window.top, winBot = Math.min(top - 44, winTop + T.window.max), showWin = winBot - winTop >= T.window.min;
  const yLead = top + (lead ? lead.size * 0.8 : 0);
  const rows = line.rows.map((r, k) => ({ r, y: top + leadH + k * (rowH + gap) + rowH / 2, t0: at + 0.15 + k * T.dur.step, side: k % 2 ? -1 : 1 }));
  const S = (x) => (rtl ? -x : x);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = spec.cut ? 0 : span(t, d - T.dur.out, d);
      if (showWin) {                                                  // the window opens on the downbeat, then cuts every beat
        const o = M.E(span(t, at - 0.05, at + T.dur.slam)), h = (winBot - winTop) * o, lift = M.I(out) * (winBot + 20);
        if (h > 2) { const c = M.cutAt(t, at, T.beat, 1); M.window(ctx, SAFE.left, winTop - lift, SAFE.right - SAFE.left, h, c.k, c.u, t, P); }
      }
      if (lead) {
        const p = M.E(span(t, at, at + T.dur.slam)), o = M.I(out), dx = S((1 - p) * -W + o * W);
        if (p > 0) {
          const b = M.beamRow(kit, ctx, lead, lead.rows[0], { x0: SAFE.left, x1: SAFE.right, y: yLead, pad: 18, fill: P.ink, ink: P.paper, keyFill: P.red, keyInk: P.onRed, dx });
          ctx.fillStyle = P.red; ctx.fillRect((rtl ? b.left - 36 : b.left + b.w + 12) + dx, yLead - 12, 24, 24);
        }
      }
      rows.forEach(({ r, y, t0, side }, k) => {
        const p = span(t, t0, t0 + T.dur.slam); if (p <= 0) return;
        const o = M.I(span(t, d - T.dur.out + k * 0.04, d)) * (spec.cut ? 0 : 1); if (o >= 1) return;
        const dx = ((1 - M.E(p)) * side - o * side) * W, dy = M.kick(t - t0 - T.dur.slam, 6);
        const inset = Math.min(k, 3) * step;
        // the ink beam under each floor: a thin red under-rule offset below, like a printed girder
        M.beamRow(kit, ctx, line, r, { x0: SAFE.left, x1: SAFE.right - inset, y, fill: P.ink, ink: P.paper, keyFill: P.red, keyInk: P.onRed, dx, dy });
      });
    },
  };
}
