// The machine-pen ending: the ink pen traces a square frame, rasters the brand's logo inside it in many fine passes, then the name; the
// accent pen rules a double line under the name; the grey pen writes the handle and the slogan. While the reel closes, the machine
// keeps working at drawing speed: it hatches the sheet's title block slowly, then parks and the pen goes back to the rack.
// spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const s = 280, lx = W / 2 - s / 2, ly = 320;
  const yName = ly + s + 70 + name.lead / 2, yRule = yName + name.size * 0.8, yHandle = yRule + 40 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const m = 26;
  const frame = M.strokeJob([[lx - m, ly - m], [lx + s + m, ly - m], [lx + s + m, ly + s + m], [lx - m, ly + s + m], [lx - m, ly - m]], 'ink', T);
  const logo = M.wordJob({ x: lx, y: ly + s / 2, width: s, size: s / 1.5 }, 'ink', T, rtl, 1, 22); logo.dur = 0.9;
  const nb = M.boxes(name, x0, x1, yName, 'center', rtl), nj = nb.map((b) => M.wordJob(b, 'ink', T, rtl));
  const ra = W / 2 + Math.min(maxW, name.width + 60) / 2 * (rtl ? 1 : -1), rb = W - ra;
  const rule = M.strokeJob([[ra, yRule], [rb, yRule], [rb, yRule + 9], [ra, yRule + 9]], 'accent', T, { lifts: [2] });
  const hb = M.boxes(handle, x0, x1, yHandle, 'center', rtl), hj = hb.map((b) => M.wordJob(b, 'grey', T, rtl, 0.8));
  const sb = slogan ? M.boxes(slogan, x0, x1, ySlogan, 'center', rtl) : [], sj = sb.map((b) => M.wordJob(b, 'grey', T, rtl, 0.8));
  const A = M.program([frame, logo, ...nj, rule, ...hj, ...sj], { start: 0.1, park: ground.park, rest: 0.6 });
  const tb = ground.tb, cell = { x: tb.x0 + 6, y: tb.y0 + 6, w: 128, h: tb.y1 - tb.y0 - 12 };
  const slow = M.hatchJob(cell, 'ink', T, rtl, 8); slow.dur = Math.max(1, d - A.end - 1.6);
  const B = M.program([slow], { start: A.end + 0.25, park: ground.park, from: A.pen(A.end + 0.25), rest: 0.7 });
  const penAt = M.chain([A, B]);
  const words = (jobs, P, t) => (w, i, b, c) => (M.rasterClip(c, jobs[i], P.q(jobs[i], t)) ? undefined : false);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      slow.draw(ctx, B.q(slow, t), K.rule, 2);
      frame.draw(ctx, A.q(frame, t), K.ink, 3);
      const q = A.q(logo, t);
      if (q > 0) { ctx.save(); M.rasterClip(ctx, logo, q); brand.logo.draw(ctx, lx, ly, s, K.ink); ctx.restore(); }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: K.ink, each: words(nj, A, t) });
      rule.draw(ctx, A.q(rule, t), K.accent, 4);
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: K.grey, each: words(hj, A, t) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: K.grey, each: words(sj, A, t) });
      ground.machine(ctx, penAt(t));
    },
  };
}
