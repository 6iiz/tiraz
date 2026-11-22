// The line-network ending: three lines of the map are drawn in from the edges of the sheet at once and meet at one great
// interchange, a ring of ink around a disc of paper. The ring drops into place, the logo is printed inside it, and the name, the
// handle (mono) and the slogan are printed below as the map's title. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, w = T.line.w, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), I = ground.I;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, Rr = 150;
  const yName = cy + Rr + 120, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const lines = [
    [M.route([[W + 20, cy + 70], [W - 150, cy + 70], [W - 220, cy], [cx + Rr, cy]], T.line.r), I.lines[0]],
    [M.route([[cx - 120, -20], [cx - 120, cy - 260], [cx, cy - 140]], T.line.r), I.lines[1]],
    [M.route([[-20, cy - 130], [150, cy - 130], [280, cy], [cx - Rr, cy]], T.line.r), I.lines[2]],
  ];
  const word = (t, t0, size) => (w2, i, box, c) => M.print(c, span(t, t0 + i * 0.05, t0 + i * 0.05 + T.dur.print), box, size, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = M.D(span(t, 0.05, 0.8));
      for (const [R, col] of lines) {
        M.line(ctx, R, col, w * 1.2, 0, R.total * p, true);
        for (let s = 110; s < R.total - 120; s += 170) if (s <= R.total * p) { const a = M.at(R, s), b = M.at(R, s + 2); const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; M.tick(ctx, a[0], a[1], nx / l, ny / l, col, w * 1.2); }
      }
      const pr = span(t, 0.8, 1.15);
      if (pr > 0) {
        const s = M.land(pr);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.fillStyle = I.paper; ctx.beginPath(); ctx.arc(0, 0, Rr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = I.ink; ctx.lineWidth = 16; ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, Rr - 22, 0, Math.PI * 2); ctx.stroke();
        const st = M.E(span(t, 1.0, 1.3));
        if (st > 0) { ctx.beginPath(); ctx.rect(-Rr, -Rr, Rr * 2, Rr * 2 * st); ctx.clip(); brand.logo.draw(ctx, -Rr * 0.55, -Rr * 0.55, Rr * 1.1, I.ink); }
        ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: I.ink, each: word(t, 1.2, name.size) });
      const rw = name.width * M.D(span(t, 1.35, 1.7)); ctx.fillStyle = I.accent; ctx.fillRect(cx - rw / 2, yRule, rw, 8);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: I.dim, each: word(t, 1.5, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: I.dim, each: word(t, 1.7, slogan.size) });
    },
  };
}
