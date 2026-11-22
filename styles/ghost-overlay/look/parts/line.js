// A line as a double exposure: the lead-in and the statement arrive word by word as two exposures, a faint ghost and a print, that
// slide into register and become one sharp image. The key phrase (*…*) is itself a window: its letters hold the deep landscape,
// which drifts slower than the words, with a lamp-coloured rule under it. Below the text a stag's head is the large window of the
// scene, a landscape printed inside it, breathing slowly. spec: { duration, at?, y?, cut?, says: { text, lead? } }
//   cut: accepted for the shared spec; the line always leaves the same way (it loses register).
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.92, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 540);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const x0 = SAFE.left, x1 = SAFE.right;
  const K = M.keys(kit, line, { x0, x1, y: yLine, align: 'start' }, P, T, rtl ? 1 : -1), keyRuns = K.runs;
  const stagger = Math.min(T.dur.stagger, 0.3 / Math.max(1, nAll - 1));
  let curT = 0;
  const when = (k) => [span(curT, at + k * stagger, at + k * stagger + T.dur.in), span(curT, d - T.dur.out, d)];
  const tex = M.landscape(W + 320, 1100, P, 31);
  const bottom = yLine + line.height - line.lead / 2;
  const s = 1.02, sy = Math.max(bottom + 120 + 470 * s, 1430);
  const dir = rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      curT = t;
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d);
      // the window: a stag drifting one way, its landscape the other way, more slowly
      ctx.save(); ctx.globalAlpha = 1 - M.I(out);
      M.window(ctx, M.stag(0.035 * Math.sin(time * 1.3)), { x: W * 0.52 + T.drift.shape * t * dir, y: sy, s, flip: rtl ? 1 : -1 }, tex,
        -160 + T.drift.inside * t * dir, sy - 560, P, span(t, at, at + T.dur.rise));
      ctx.restore();
      // the lamp rule under each key run, and a glow that brightens once the line has settled
      const lp = M.E(span(t, at + 0.4, at + 0.75)) * (1 - M.I(out)), glow = span(t, 0.8, 1.2) * (1 - out);
      for (const r of keyRuns) {
        if (glow > 0) {
          const cx = r.x + r.width / 2, g = ctx.createRadialGradient(cx, r.y, 0, cx, r.y, r.width * 0.7 + 40);
          g.addColorStop(0, rgba(P.lamp, 0.16 * glow)); g.addColorStop(1, rgba(P.lamp, 0));
          ctx.fillStyle = g; ctx.fillRect(r.x - r.width, r.y - line.size * 1.4, r.width * 3, line.size * 2.8);
        }
      }
      K.rule(ctx, lp);
      if (lead) M.twice(kit, ctx, lead, { x0, x1, y: yLead, align: 'start' }, { shift: T.ghost.shift * 0.7, ghostA: T.ghost.alpha, dir, when, color: P.grey, ghostColor: P.grey });
      M.twice(kit, ctx, line, { x0, x1, y: yLine, align: 'start' }, {
        shift: T.ghost.shift, ghostA: T.ghost.alpha, dir, when: (i) => when(nLead + i), color: P.ink, ghostColor: P.ink,
        style: K.style(t) });
    },
  };
}
