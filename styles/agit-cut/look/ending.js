// The agit-cut ending, the signature build: a tower of floors stacked from the bottom of the safe area upward, one floor per eighth,
// slammed in from alternate sides. Film strips alternate with beams of type: the slogan, the handle, then the brand's name on the red
// beam; the logo is stamped last on top as the crown, on the downbeat. Then the strips keep cutting on the beat while it holds.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: maxW - 80, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: maxW - 80, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: maxW - 80, single: true, where: 'the slogan' }) : null;
  const gap = 22, strip = 104, crown = 250;
  // floors from the bottom up
  const floors = [{ kind: 'strip' }];
  if (slogan) floors.push({ kind: 'type', f: slogan, fill: P.ink, ink: P.paper, w: 0.86 }, { kind: 'strip' });
  floors.push({ kind: 'type', f: handle, fill: P.ink, ink: P.paper, w: 0.7 }, { kind: 'type', f: name, fill: P.red, ink: P.onRed, w: 1, big: true });
  floors.forEach((fl) => { fl.h = fl.kind === 'strip' ? strip : fl.f.size * (fl.big ? 1.62 : 1.6); });
  const total = floors.reduce((s, f) => s + f.h + gap, 0) + crown;
  let y = SAFE.bottom - Math.max(0, (SAFE.bottom - SAFE.top - total) / 2);
  floors.forEach((fl, i) => { fl.y1 = y; fl.y0 = y - fl.h; y = fl.y0 - gap; fl.t0 = 0.1 + i * 0.25; fl.side = i % 2 ? -1 : 1; });
  const crownY1 = y, tCrown = 0.1 + floors.length * 0.25 + 0.1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      floors.forEach((fl, i) => {
        const p = span(t, fl.t0, fl.t0 + T.dur.slam); if (p <= 0) return;
        const dx = (1 - M.E(p)) * fl.side * W, dy = M.kick(t - fl.t0 - T.dur.slam, 6);
        if (fl.kind === 'strip') {
          const c = M.cutAt(t, fl.t0, T.beat, i * 3 + 1);
          M.window(ctx, SAFE.left + dx, fl.y0 + dy, maxW, fl.h, c.k, c.u, t, P, 6);
          return;
        }
        const w = maxW * fl.w, left = (fl.w === 1 ? SAFE.left : (i % 4 === 1) === rtl ? SAFE.left : SAFE.right - w);
        ctx.save(); ctx.translate(dx, dy);
        if (fl.big) { ctx.fillStyle = P.ink; ctx.fillRect(left + 14, fl.y0 + 14, w, fl.h); }
        ctx.fillStyle = fl.fill; ctx.fillRect(left, fl.y0, w, fl.h);
        kit.drawText(ctx, fl.f, { x0: left + 30, x1: left + w - 30, y: (fl.y0 + fl.y1) / 2 + fl.f.size * 0.04, align: 'center', color: fl.ink, key: fl.ink });
        ctx.restore();
      });
      // the crown: an ink square slammed down from above, the logo stamped into it on red
      const pc = span(t, tCrown, tCrown + T.dur.slam);
      if (pc > 0) {
        const s = crown - 20, x = W / 2 - s / 2, yy = crownY1 - s - (1 - M.E(pc)) * 900 + M.kick(t - tCrown - T.dur.slam, 10);
        ctx.fillStyle = P.ink; ctx.fillRect(x - 12, yy - 12, s + 24, s + 24);
        ctx.fillStyle = P.red; ctx.fillRect(x, yy, s, s);
        const st = span(t, tCrown + T.dur.slam, tCrown + T.dur.slam + 1 / 15);
        if (st > 0) brand.logo.draw(ctx, x + s * 0.17, yy + s * 0.17, s * 0.66, P.onRed);
        // rivets at the crown's corners
        ctx.fillStyle = P.paper; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) ctx.fillRect(x - 6 + a * (s), yy - 6 + b * (s), 12, 12);
      }
    },
  };
}
