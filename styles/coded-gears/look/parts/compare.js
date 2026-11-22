// Before and after is a change of wheel. A slate driver turns in the lower corner; the old wheel, in the neutral, meshes with it. The
// old value is struck and greys back as the old wheel is pulled out of mesh, stops and drops away; the new wheel slides into mesh in
// the neutral, is dyed in the accent from the tooth that meets the driver, and the new value clicks in on an accent chip.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.72, weight: 600, maxW, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.96, minPx: 44, where: 'the compare label' }) : null;
  let y = SAFE.top + 40;
  const yLabel = label ? y + label.lead / 2 : 0; if (label) y += label.height + 14;
  const yWas = y + was.lead / 2; y += was.height + 16;
  const yNow = y + now.lead / 2; y += now.height;
  const nowRuns = M.keyRuns(M.boxes(kit, now, x0, x1, yNow).map((b) => ({ ...b, key: true })));
  const wb = M.boxes(kit, was, x0, x1, yWas);
  const m = T.drive.module, sx = rtl ? -1 : 1;
  const tr = M.train(m, { N: 22, x: W / 2 + sx * 300, y: Math.max(1080, y + 260) }, [{ N: 16, phi: rtl ? -0.25 : Math.PI + 0.25 }]);
  const drv = tr.g[0], wh = tr.g[1], kk = drv.G.r / (drv.G.r + wh.G.r), contact = [drv.x + (wh.x - drv.x) * kk, drv.y + (wh.y - drv.y) * kk];
  const cutT = at + 0.85, nowT = at + 1.35, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d), speed = T.drive.speed * 1.3;
      ctx.save(); ctx.globalAlpha = 1 - q;
      const A = tr.angles(t * speed), Acut = tr.angles(cutT * speed);
      M.drawGear(ctx, drv.G, drv.x, drv.y, A[0], pal.B, { depth: 12 });
      // the old wheel: out of mesh at cutT, then frozen, pulled away and dropped
      const po = M.smooth(span(t, cutT, cutT + 0.5));
      if (po < 1) M.drawGear(ctx, wh.G, wh.x + (wh.x - drv.x) * 0.35 * po, wh.y + po * po * 420, t < cutT ? A[1] : Acut[1], pal.N, { alpha: 1 - po * 0.7 });
      // the new wheel slides into mesh and is dyed from the contact
      const pn = M.smooth(span(t, nowT - 0.4, nowT));
      if (pn > 0) {
        const dx = (1 - pn) * (wh.x - drv.x) * 1.4;
        M.drawGear(ctx, wh.G, wh.x + dx, wh.y, A[1], pal.A, { neutral: pal.N, dye: { x: contact[0], y: contact[1], r: 2.6 * wh.G.r * M.smooth(span(t, nowT - 0.02, nowT + 0.5)) } });
      }
      ctx.restore();
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.click(c, t, at + i * 0.05, T.dur.word, out0, d, box) === false) return false; } });
      const ghost = lerp(1, 0.45, M.soft(span(t, cutT + 0.1, cutT + 0.5)));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.grey, key: pal.grey,
        each: (w, i, box, c) => { if (M.click(c, t, at + 0.15 + i * 0.05, T.dur.word, out0, d, box) === false) return false; c.globalAlpha *= ghost; } });
      const ps = span(t, cutT - 0.1, cutT + 0.12) * (1 - q);
      if (ps > 0) was.rows.forEach((r, ri) => {
        const b = wb.filter((z) => z.row === ri), a0 = Math.min(...b.map((z) => z.x)) - 10, a1 = Math.max(...b.map((z) => z.x + z.width)) + 10, w = (a1 - a0) * ps;
        ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? a1 - w : a0, yWas + ri * was.lead + was.size * 0.06 - 2, w, 4);
      });
      const kp = span(t, nowT + 0.05, nowT + 0.3);
      ctx.save(); ctx.globalAlpha = 1 - q; nowRuns.forEach((r) => M.chip(ctx, pal, r, now.size, kp, rtl)); ctx.restore();
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: M.keyInk(pal, kp), key: M.keyInk(pal, kp),
        each: (w, i, box, c) => { if (M.click(c, t, nowT + i * 0.05, T.dur.word, out0, d, box) === false) return false; } });
    },
  };
}
