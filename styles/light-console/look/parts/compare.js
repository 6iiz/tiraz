// Before and after as a replaced reading. The old value resolves on a plate; then its signal breaks (the plate's rows slip sideways for a
// moment) and the plate collapses to a line, leaving only a dashed outline and a faint trace of the old words. Under it a new plate
// opens, the new value resolves, and brackets lock it into the hologram's hue. On the pad the old wire cube breaks up and a crystal grows
// in its place. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, sub = T.subject;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const padX = 44, x0 = SAFE.left + padX, x1 = SAFE.right - padX;
  const [was, now] = kit.fitAll([asText(S.was).replace(/\*/g, ''), asText(S.now).replace(/\*/g, '')], { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  const ph1 = was.height + 60, ph2 = now.height + 70, head = label ? label.lead + 20 : 0, gap = 40;
  const top = kit.place(head + ph1 + gap + ph2, 600), yLabel = top + (label ? label.lead / 2 : 0);
  const top1 = top + head, top2 = top1 + ph1 + gap, yWas = top1 + 30 + was.lead / 2, yNow = top2 + 35 + now.lead / 2;
  const tWas = at + 0.1, tCut = at + 0.85, tGone = tCut + 0.35, tNow = tGone + 0.05, lockT = tNow + 0.65;
  const nb = { x0: (W - now.width) / 2, x1: (W + now.width) / 2, y0: yNow - now.height / 2 + now.lead * 0.2, y1: yNow + now.height / 2 - now.lead * 0.2 };
  const slices = 7, r = rng(77), jit = Array.from({ length: 40 }, () => (r() - 0.5) * 70);
  const cube = M.meshes.box(0.75, 0.75, 0.75), crystal = M.meshes.join(M.meshes.octa(), M.meshes.box(0.4, 0.4, 0.4));
  const scan = (t, t0, size) => (w, i, box, c) => M.resolve(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.scan), box, size, pal, rtl);
  const out0 = d - T.dur.out;
  // the old plate's contents, drawn into the frame (used whole, or slipped in slices while the signal breaks)
  const drawWas = (ctx, t, alpha) => {
    ctx.save(); ctx.globalAlpha = alpha;
    kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: pal.soft, key: pal.soft, each: scan(t, tWas + T.dur.open * 0.6, was.size) });
    ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), alive = 1 - M.I(out), yaw = (t + clock) * 0.45;
      // the subject: the old cube breaks up, the crystal grows
      const brk = span(t, tCut, tGone);
      if (brk < 1) M.wire(ctx, M.meshes.move(cube, 0, 0, 0), { cx: sub.x + (brk > 0 ? jit[Math.floor(t * 30) % 40] * brk : 0), cy: sub.y, s: sub.s * (1 + brk * 0.3), a: yaw, pal, alpha: (1 - brk) * 0.7 * Math.min(1, span(t, at, at + 0.3) * 2) });
      if (t >= tNow) M.wire(ctx, crystal, { cx: sub.x, cy: sub.y, s: sub.s, a: yaw, pal, alpha: alive, scanY: M.scanFrom(span(t, tNow, tNow + T.dur.grow), sub.y, sub.s), hot: t >= lockT ? Math.max(0, 1 - (t - lockT) / 0.4) : 0 });
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.soft, each: (w, i, box, c) => (out >= 1 ? false : scan(t, at, label.size)(w, i, box, c)) });
      // the old plate
      const pw = SAFE.right - SAFE.left;
      if (t < tCut) {
        const k = M.plate(ctx, SAFE.left, top1, pw, ph1, pal, span(t, at, at + T.dur.open));
        if (k > 0) { ctx.save(); ctx.beginPath(); const hh = ph1 * k; ctx.rect(0, top1 + (ph1 - hh) / 2, W, hh); ctx.clip(); drawWas(ctx, t, 1); ctx.restore(); }
      } else if (t < tGone) {
        const q = span(t, tCut, tGone), slip = q < 0.5, sh = ph1 / slices, f = Math.floor(t * 30);
        const k = M.plate(ctx, SAFE.left, top1, pw, ph1, pal, 1, slip ? 0 : (q - 0.5) * 2);
        if (k > 0) for (let s = 0; s < slices; s++) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, top1 + s * sh, W, sh); ctx.clip(); ctx.translate(slip ? jit[(f + s * 3) % 40] * q * 2 : 0, 0);
          ctx.translate(0, yWas); ctx.scale(1, k); ctx.translate(0, -yWas); drawWas(ctx, t, slip ? 1 : 1 - q); ctx.restore();
        }
      } else if (alive > 0) {
        ctx.save(); ctx.globalAlpha = alive; ctx.strokeStyle = rgba(pal.hue, 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([10, 8]); ctx.strokeRect(SAFE.left + 0.5, top1 + 0.5, pw - 1, ph1 - 1); ctx.restore();
        drawWas(ctx, t, 0.28 * alive);
      }
      // the new plate
      const k2 = M.plate(ctx, SAFE.left, top2, pw, ph2, pal, span(t, tNow, tNow + T.dur.open), out);
      if (k2 > 0) {
        ctx.save(); ctx.beginPath(); const hh = ph2 * k2; ctx.rect(0, top2 + (ph2 - hh) / 2, W, hh); ctx.clip();
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: t >= lockT ? pal.lock : pal.white, key: t >= lockT ? pal.lock : pal.white, each: scan(t, tNow + T.dur.open * 0.6, now.size) });
        ctx.restore();
      }
      M.brackets(ctx, nb, span(t, lockT - T.dur.lock, lockT), pal, out);
    },
  };
}
