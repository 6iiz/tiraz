// The paper: the brand's lighter colour, flat, with a very fine grain, painted once. Across the bottom runs the system line (below the
// safe area) with small round nodes on it; the crowd of stick people who carry the explanation stands on it. `crowd` draws them:
// standing apart, reaching for each other's hands, joined into one line, the accent run passing through their arms (each one hops as it
// arrives, the node under them fills), then the joined arms lift together.
import { rng, rgba } from '/engine/kit.js';
import * as M from './motion.js';

const cache = new Map();
export function create({ W, H, brand, look, clock = 0, rtl = brand.dir !== 'ltr' }) {
  const T = look.tokens, P = M.palette(brand, T), S = T.stage, id = P.paper + P.ink;
  if (!cache.has(id)) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), r = rng(380);
    g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 14000; i++) { g.fillStyle = rgba(r() < 0.5 ? P.ink : P.light, P.grain * (0.3 + r())); g.fillRect(r() * W, r() * H, 1, 1); }
    cache.set(id, cv);
  }
  const paper = cache.get(id), yL = S.line, xs = S.xs.map((x) => (rtl ? W - x : x)).sort((a, b) => (rtl ? b - a : a - b));
  const h = S.h, w = M.weight(h);
  // the shoulders at rest, to time the run
  const rest = xs.map((x) => [x, yL - h * (0.46 + 0.34 * 0.86)]);
  const arms = rest.slice(1).map((b, i) => M.joined(rest[i], b, h, 0));
  const reachAt = [0]; arms.forEach((a, i) => reachAt.push(reachAt[i] + M.lengthOf(a)));
  const total = reachAt.at(-1);
  return {
    P, yL, xs, h,
    draw(ctx) {
      ctx.drawImage(paper, 0, 0);
      ctx.fillStyle = P.ink; ctx.fillRect(0, yL - w / 2, W, w);
    },
    // join 0..1 (hands reach and clasp), runP 0..1 (how far the accent has run), lift 0..1, mood: 'calm' | 'slump'
    // runT: [t0, t1] the run's time span, so each person's hop is timed by when the run reaches them.
    crowd(ctx, t, { join = 0, runP = 0, lift = 0, runT = null, slump = 0, source = 0 } = {}) {
      const tt = t + clock, figs = [];
      xs.forEach((x, i) => {
        const since = runT ? t - (runT[0] + (reachAt[i] / total) * (runT[1] - runT[0])) : -1;
        const sway = Math.sin(tt * 1.3 + i * 1.7) * 3;
        const node = runP * total >= reachAt[i] - 1;
        ctx.beginPath(); ctx.arc(x, yL, 13, 0, Math.PI * 2); ctx.fillStyle = node ? P.accent : P.paper; ctx.fill(); ctx.lineWidth = w * 0.7; ctx.strokeStyle = P.ink; ctx.stroke();
        const skip = join > 0 ? { [rtl ? 'l' : 'r']: i < xs.length - 1, [rtl ? 'r' : 'l']: i > 0 } : null;
        figs.push(M.figure(ctx, P, x, yL - 14, h, { hop: M.reactHop(since, h), lean: sway, slump, head: i === source ? 'accent' : 'paper', skipArms: skip }));
      });
      if (join > 0) {
        const path = [];
        for (let i = 0; i < figs.length - 1; i++) path.push(...M.reach(ctx, P, figs[i].sh, figs[i + 1].sh, h, join, w, lift));
        if (join >= 1 && runP > 0) M.run(ctx, path, runP * M.lengthOf(path), w * 1.15, P.accent);
      }
    },
    runTotal: total,
  };
}
