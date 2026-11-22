// Before and after as a replay. The old reading is on a card over the frozen picture; the analyst strikes it with two marker strokes,
// the picture rewinds (◀◀, the players run backwards) and plays the passage again, and on the new freeze the runner is ringed and
// the new reading slides in on a second card, in the marker's colour with a hand-drawn underline.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, field = ground.field, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S.unit ? ' ' + S.unit : '');
  const pad = 40, bar = 12, x0 = SAFE.left + pad + (rtl ? 0 : bar), x1 = SAFE.right - pad - (rtl ? bar : 0), maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), '*' + asText(S.now) + '*'], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, minScale: 0.96, where: 'the compare label' }) : null;
  const yA = 300, hA = 30 + (label ? label.height : 0) + was.height + 20, yLabel = yA + 22 + (label ? label.lead / 2 : 0), yWas = yA + 26 + (label ? label.height : 0) + was.lead / 2;
  const yB = yA + hA + 30, hB = now.height + 50, yNow = yB + 25 + now.lead / 2;
  const posNow = { x0, x1, y: yNow, align: 'start' }, runsN = M.runs(M.boxes(kit, now, posNow));
  const t0 = at - 1.0, f1 = at + 0.2, strike = at + 0.5, rw0 = at + 0.8, rw1 = at + 1.1, f2 = at + 1.5;
  const tauAt = (t) => {                                          // play, freeze, rewind fast, play again, freeze again
    if (t < f1) return Math.max(0, t - t0);
    if (t < rw0) return f1 - t0;
    if (t < rw1) return (f1 - t0) - ((f1 - t0) - 0.5) * M.IO(span(t, rw0, rw1));
    if (t < f2) return 0.5 + ((f1 - t0) - 0.5) * span(t, rw1, f2);
    return f1 - t0;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tau = tauAt(t), out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      const mode = t < f1 || (t >= rw1 && t < f2) ? 'live' : t >= rw0 && t < rw1 ? 'rewind' : 'freeze';
      const fz = t >= f2 ? f2 : f1, zoom = (mode === 'freeze' ? M.punch(t, fz) : 1) * (t >= f2 ? 1 + 0.03 * M.IO(span(t, f2 + 0.3, d)) : 1);
      const V = M.view(ctx, W, H, field, tau, { pan: -50 * M.IO(tau / 1.6), zoom, fx: W / 2, fy: 1150, P });
      if (mode === 'rewind') { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = Math.floor((t * 900) % 24); y < H; y += 24) ctx.fillRect(0, y, W, 6); }
      M.flash(ctx, W, H, t, f2, P);
      const pl = V.pl;
      if (t >= f2) {
        ctx.save(); ctx.globalAlpha = keep;
        const [ax, ay] = V.to(pl.A2.x, pl.A2.z); M.ring(ctx, ax, ay, V.k(pl.A2.z), span(t, f2 + 0.05, f2 + 0.3), P.pen, T.pen);
        const [px, py] = V.to(pl.A1.x, pl.A1.z); M.arrow(ctx, [px, py - 6], [ax - 10, ay - 20], span(t, f2 + 0.15, f2 + 0.42), P.pen, T.pen, rtl ? 0.2 : -0.2, 7);
        ctx.restore();
      }
      M.chip(ctx, mode, tau * T.fps + 3120, P, mono, rtl);
      // card A: the old reading, struck
      const offA = M.card(ctx, SAFE.left, yA, SAFE.right - SAFE.left, hA, span(t, at - 0.05, at + T.dur.card), out, P, rtl, bar);
      ctx.save(); ctx.translate(offA, 0);
      const sw = (k, size, t0w) => (w, i, box, c) => { const s0 = t0w + i * T.dur.stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), out, size, rtl) === false) return false; };
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey, key: P.key, each: sw(0, label.size, at + 0.05) });
      const struck = t >= strike;
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: struck ? P.grey : P.light, key: P.light, each: sw(0, was.size, at + 0.12) });
      const wx0 = rtl ? x1 - was.width : x0, wx1 = rtl ? x1 : x0 + was.width, h = was.size * 0.5;
      M.pen(ctx, [[wx0 - 10, yWas - h], [wx1 + 10, yWas + h]], span(t, strike, strike + 0.15), P.pen, T.pen, 51);
      M.pen(ctx, [[wx1 + 10, yWas - h], [wx0 - 10, yWas + h]], span(t, strike + 0.13, strike + 0.28), P.pen, T.pen, 52);
      ctx.restore();
      // card B: the new reading, after the replay
      const offB = M.card(ctx, SAFE.left, yB, SAFE.right - SAFE.left, hB, span(t, f2 - 0.05, f2 + T.dur.card), out, P, rtl, bar);
      ctx.save(); ctx.translate(offB, 0);
      kit.drawText(ctx, now, { ...posNow, color: P.light, key: P.key, each: sw(0, now.size, f2 + 0.05) });
      runsN.forEach((r, j) => {
        const y = r.y + now.size * 0.6, a = rtl ? r.x + r.width + 6 : r.x - 6, b = rtl ? r.x - 6 : r.x + r.width + 6;
        const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([a + (b - a) * u, y + Math.sin(u * 3 + j) * 4 + u * 5]); }
        M.pen(ctx, pts, span(t, f2 + 0.3, f2 + 0.55), P.pen, 7, 61 + j);
      });
      ctx.restore();
    },
  };
}
