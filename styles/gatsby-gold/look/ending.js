// The Gatsby ending: a marquee. A burst of engraved rays opens out from the axis behind a stepped arch; the arch is drawn on from its
// foot up both sides at once and its bulbs switch on in counted pairs until they meet at the crown; the logo is cast in the metal in
// the arch, under a passing sheen. The name rises on a plate that opens from the axis, the handle and the slogan follow beneath it, and
// a slow chase runs round the arch for as long as the ending holds. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, B = M.bulbs(pal);
  const cx = W / 2, maxW = SAFE.right - SAFE.left - 120;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  // the arch: a doorway with three steps up to its crown
  const aw = 360, ah = 400, aTop = 300, aFoot = aTop + ah;
  const archPts = (k = 0) => {
    const x0 = cx - aw / 2 + k, x1 = cx + aw / 2 - k, yt = aTop + k, yb = aFoot, s = 40;
    return [[x0, yb], [x0, yt + 2 * s], [x0 + 40, yt + 2 * s], [x0 + 40, yt + s], [x0 + 80, yt + s], [x0 + 80, yt], [x1 - 80, yt], [x1 - 80, yt + s], [x1 - 40, yt + s], [x1 - 40, yt + 2 * s], [x1, yt + 2 * s], [x1, yb]];
  };
  // half the outline, from the foot to the centre of the crown (the other half is its mirror), and points spaced along a path
  const halfArch = (k) => { const p = archPts(k); return [...p.slice(0, 6), [cx, p[5][1]]]; };
  const along = (pts, step) => {
    const out = []; let next = 0, run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
      while (next <= run + L) { const f = (next - run) / L; out.push([ax + (bx - ax) * f, ay + (by - ay) * f]); next += step; }
      run += L;
    }
    return out;
  };
  const lamps = along(halfArch(-26), 34).filter(([x]) => x < cx - 10), nL = lamps.length;
  const ph = name.lead + 60, yName = aFoot + 70 + ph / 2;
  const yHandle = yName + ph / 2 + 40 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const pw = Math.min(SAFE.right - SAFE.left + 40, Math.max(560, name.width + 160));
  const nameO = { x0: cx - name.width / 2, x1: cx + name.width / 2, y: yName, align: 'center' };
  const rn = M.centreOut(kit, name, nameO).rank;
  const pathOf = (pts, p) => (c) => {                                  // the arch drawn on from its foot, both sides at once
    c.beginPath();
    const n = pts.length - 1, upto = p * n;
    for (const side of [-1, 1]) {
      const P = pts.map(([x, y]) => [side < 0 ? x : 2 * cx - x, y]);
      c.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i <= n; i++) {
        if (i <= upto) c.lineTo(P[i][0], P[i][1]);
        else { const f = upto - (i - 1); if (f > 0) c.lineTo(P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f); break; }
      }
    }
  };
  const outer = halfArch(0), inner = halfArch(14);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, sh = M.sheenAt(time, 3);
      // the burst behind the arch
      const pb = M.E(span(t, 0, 0.8));
      if (pb > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(70, 235, W - 140, 520); ctx.clip(); ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.beginPath();
        const oy = aTop + ah * 0.55;
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2, r0 = 250, r1 = 250 + 260 * pb * (i % 2 ? 0.7 : 1);
          ctx.moveTo(cx + Math.cos(a) * r0, oy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, oy + Math.sin(a) * r1);
        }
        ctx.stroke(); ctx.restore();
      }
      const pa = M.E(span(t, 0.1, 0.9));
      if (pa > 0) {
        if (pa > 0.98) {                                                // the lacquer inside the arch
          ctx.beginPath(); archPts(0).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
          ctx.fillStyle = pal.lacquer; ctx.fill();
        }
        const paint = M.metal(ctx, cx - aw / 2, aTop, cx + aw / 2, aFoot, pal, sh);
        M.gline(ctx, pathOf(outer, pa), 3.4, pal, paint);
        M.gline(ctx, pathOf(inner, pa), 1.4, pal, paint);
        M.gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - (aw / 2 + 50) * pa, aFoot); c.lineTo(cx + (aw / 2 + 50) * pa, aFoot); }, 3.4, pal, paint);
      }
      // the bulbs: pairs from the foot to the crown, then a chase
      const tB = 0.5, tTop = 1.5;
      for (let k = 0; k < nL; k++) {
        const on = tB + (k / nL) * (tTop - tB);
        let lvl = M.ignite(span(t, on, on + 0.5));
        if (t > tTop + 0.5) lvl *= 0.72 + 0.28 * Math.cos(k * 0.9 - (t - tTop) * 6);
        const [x, y] = lamps[k];
        B.draw(ctx, x, y, lvl, 6); B.draw(ctx, 2 * cx - x, y, lvl, 6);
      }
      // the logo, cast in the metal
      const pl = M.L(span(t, 0.9, 1.3));
      if (pl > 0) {
        const s = 200, x = cx - s / 2, y = aTop + 120 + (1 - pl) * 30;
        ctx.save(); ctx.beginPath(); ctx.rect(x - 20, aTop + 100, s + 40, s * pl + 30); ctx.clip();
        brand.logo.draw(ctx, x, y, s, M.metal(ctx, x, y, x + s, y + s, pal, M.sheenAt(time, 2.8, 1.2), true));
        ctx.restore();
        M.sparkle(ctx, x + s + 8, y - 4, 46, M.flare(t, 1.35) + (t > 2 ? 0.3 + 0.25 * Math.sin((t - 2) * 2.2) : 0), pal);
      }
      // the name plate, the handle and the slogan
      const op = M.opening(span(t, 1.3, 1.3 + T.dur.open));
      M.plate(ctx, cx, yName, pw, ph, pal, { ...op, sheen: sh });
      if (op.hf > 0.05) {
        ctx.save(); M.notched(ctx, cx, yName, pw * op.wf - 8, ph * op.hf - 8, 12); ctx.clip();
        kit.drawText(ctx, name, { ...nameO, color: pal.ivory, each: (w, i, box, c) => { const t0 = 1.6 + rn[i] * T.dur.stagger; return M.rise(c, span(t, t0, t0 + T.dur.in), 0, name.size); } });
        ctx.restore();
      }
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.gold, each: (w, i, box, c) => M.rise(c, span(t, 2.0, 2.0 + T.dur.in), 0, handle.size) });
      if (slogan) {
        M.flank(ctx, cx, ySlogan, slogan.width / 2 + 24, 70, pal, span(t, 2.2, 2.7), sh);
        kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.muted, each: (w, i, box, c) => M.rise(c, span(t, 2.2 + i * T.dur.stagger, 2.2 + i * T.dur.stagger + T.dur.in), 0, slogan.size) });
      }
    },
  };
}
