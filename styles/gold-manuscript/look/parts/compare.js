// Before and after as a scribe's correction. The old value is written on a small vellum panel; then it is cancelled the way a scribe
// cancels a word: a red-letter stroke drawn through it from the reading side and a row of dots pricked under it one by one, while its
// ink fades. Three pearls lead down to the new value, which is written on a larger panel framed in gold leaf, laid square by square
// before the pen arrives; a light then runs across the frame. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, rtl = kit.rtl;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 180;
  const was = kit.fit(asText(S.was), { size: T.size.was, weight: 700, maxW: maxW - 80, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.now, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 160, single: true, where: 'the compare label' }) : null;
  const ww = Math.max(420, was.width + 140), wh = was.height + 80, fb = 30;
  const nw = Math.min(SAFE.right - SAFE.left + 30, Math.max(600, now.width + 150 + fb * 2)), nh = now.height + 90 + fb * 2;
  const rh = label ? label.lead + 24 : 0, lH = label ? rh + 46 : 0, gap = 100;
  const top = kit.place(lH + wh + gap + nh, 720);
  const yL = top + rh / 2, wy = top + lH, ny = wy + wh + gap;
  const wo = { x0: cx - was.width / 2, x1: cx + was.width / 2, y: wy + wh / 2 - was.height / 2 + was.lead / 2, align: 'center' };
  const no = { x0: cx - now.width / 2, x1: cx + now.width / 2, y: ny + nh / 2 - now.height / 2 + now.lead / 2, align: 'center' };
  const lo = label ? { x0: cx - label.width / 2, x1: cx + label.width / 2, y: yL, align: 'center' } : null;
  const seq = (f, o, t0) => { let tt = t0; return M.boxesOf(kit, f, o).map((b) => { const a = tt; tt += b.width / T.pen + 0.04; return [a, a + b.width / T.pen]; }); };
  const lw = label ? seq(label, lo, at) : [], wW = seq(was, wo, at + 0.4), tNow = at + 1.35, nW = seq(now, no, tNow + 0.55);
  const tCut = Math.max(at + 0.85, wW.at(-1)[1] + 0.1), nEnd = nW.at(-1)[1];
  const frame = [M.leaf(cx - nw / 2, ny, nw, fb, pal, 41, 15), M.leaf(cx - nw / 2, ny + nh - fb, nw, fb, pal, 42, 15),
    M.leaf(cx - nw / 2, ny + fb, fb, nh - 2 * fb, pal, 43, 15), M.leaf(cx + nw / 2 - fb, ny + fb, fb, nh - 2 * fb, pal, 44, 15)];
  const nd = Math.max(4, Math.round(was.width / 34)), dots = Array.from({ length: nd }, (_, i) => cx + (rtl ? 1 : -1) * (was.width / 2 - (i + 0.5) * (was.width / nd)));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d), light = ground.light(time);
      ctx.save(); ctx.globalAlpha = 1 - out;
      if (label) {
        M.painted(ctx, span(t, at - 0.15, at + 0.3), (c) => M.ribbonPath(c, cx, yL, label.width + 70, rh), label.width * 2 + 260, pal, { weight: 3.5 });
        kit.drawText(ctx, label, { ...lo, color: pal.rubric, each: (w, i, box, c) => M.pen(c, span(t, lw[i][0], lw[i][1]), box, label.size, rtl) });
      }
      M.painted(ctx, span(t, at + 0.05, at + 0.6), (c) => M.panelPath(c, cx - ww / 2, wy, ww, wh, 26), (ww + wh) * 2, pal,
        { inset: (c) => M.panelPath(c, cx - ww / 2 + 11, wy + 11, ww - 22, wh - 22, 16) });
      const cut = span(t, tCut, tCut + 0.3);
      kit.drawText(ctx, was, { ...wo, color: cut > 0.6 ? pal.faded : pal.ink, key: cut > 0.6 ? pal.faded : pal.ink, each: (w, i, box, c) => M.pen(c, span(t, wW[i][0], wW[i][1]), box, was.size, rtl) });
      if (cut > 0) {
        const L = (was.width + 50) * M.S(cut), x0 = rtl ? cx + was.width / 2 + 25 - L : cx - was.width / 2 - 25;
        ctx.fillStyle = pal.rubric; ctx.fillRect(x0, wo.y + 2, L, 6);
        dots.forEach((x, i) => { if (span(t, tCut + 0.3 + i * 0.05, tCut + 0.32 + i * 0.05) > 0) { ctx.beginPath(); ctx.arc(x, wo.y + was.size * 0.78, 4, 0, Math.PI * 2); ctx.fill(); } });
      }
      for (let i = 0; i < 3; i++) if (t > tNow - 0.3 + i * 0.08) M.pearl(ctx, cx, wy + wh + 26 + i * 24, 5, pal);
      M.painted(ctx, span(t, tNow, tNow + 0.5), (c) => { c.beginPath(); c.rect(cx - nw / 2, ny, nw, nh); }, (nw + nh) * 2, pal, { weight: 5 });
      const lf = span(t, tNow + 0.15, tNow + 0.7);
      frame.forEach((f) => f.draw(ctx, lf, M.sweep(cx - nw / 2, cx + nw / 2, span(t, nEnd + 0.1, nEnd + 1.0), rtl, light)));
      if (lf > 0.9) { ctx.strokeStyle = pal.ink; ctx.lineWidth = 4; ctx.strokeRect(cx - nw / 2, ny, nw, nh); ctx.strokeRect(cx - nw / 2 + fb, ny + fb, nw - 2 * fb, nh - 2 * fb); }
      kit.drawText(ctx, now, { ...no, color: pal.ink, key: pal.ink, each: (w, i, box, c) => M.pen(c, span(t, nW[i][0], nW[i][1]), box, now.size, rtl) });
      ctx.restore();
    },
  };
}
