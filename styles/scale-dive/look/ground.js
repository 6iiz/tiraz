// The scale-dive ground: the brand's darker colour as a night, a field of still stars, and an endless dive into nested worlds around a
// vanishing point low in the frame: a lit sphere holds an orbit, the orbit holds a cell, the cell holds an atom, the atom holds the
// next sphere… each a flat shape with one shade step and hard rings for glow. The camera sinks one level every few seconds, on the
// reel's own clock, so the dive never restarts at a cut. On the far side a log scale ribbon scrolls with the dive under a fixed
// pointer. Every tone stays within a few steps of the night, so text over any of it keeps its contrast.
import { rng } from '/engine/kit.js';
import { palette, disc, glow, ring } from './motion.js';

let starCache = null;                                       // the stars are the same for every scene of a page
function stars(W, H, pal, seed) {
  const key = `${W}x${H}:${pal.night}:${pal.light}:${pal.sun}`;
  if (starCache?.key === key) return starCache.cv;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), r = rng(seed);
  const cols = [pal.tone(0.3), pal.tone(0.5), pal.sunTone(0.7)];
  for (let i = 0; i < 260; i++) { g.fillStyle = cols[i % 9 === 0 ? 2 : i % 3 === 0 ? 1 : 0]; g.beginPath(); g.arc(r() * W, r() * H, 1.2 + r() * 2, 0, 7); g.fill(); }
  for (let i = 0; i < 10; i++) {                             // a few four-point sparkles
    const x = r() * W, y = r() * H, s = 6 + r() * 7; g.fillStyle = pal.tone(0.55);
    g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  }
  starCache = { key, cv }; return cv;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), rtl = brand.dir !== 'ltr';
  const vx = W / 2, vy = T.dive.vy, F = T.dive.factor, R0 = T.dive.r0;
  const sky = stars(W, H, pal, 4021);
  const ribX = rtl ? 34 : W - 34, ribY0 = 300, ribY1 = 1240, ribMid = 770, L = T.dive.ribbon;
  const seeds = (n) => rng(1000 + ((n % 997) + 997) % 997);

  // one nested world of level n, radius r, around (x, y)
  function world(ctx, n, r, x, y, time) {
    const kind = ((n % 4) + 4) % 4;
    if (kind === 0) {                                        // a lit sphere with its glow rings and a far moon
      glow(ctx, x, y, r, pal, 0.35);
      disc(ctx, x, y, r, pal.tone(T.tone.sphere), pal.tone(T.tone.sphere * 0.55));
      const a = n * 1.9 + time * 0.05; disc(ctx, x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45, r * 0.09, pal.sunTone(0.5), pal.sunTone(0.32));
    } else if (kind === 1) {                                 // an orbit: one thin ring, one dashed, a body riding on it
      ring(ctx, x, y, r, pal.tone(0.2), Math.max(1.5, r * 0.004));
      ring(ctx, x, y, r * 0.66, pal.tone(0.14), Math.max(1.5, r * 0.003), [r * 0.02 + 2, r * 0.05 + 6], -time * 8);
      const a = n * 2.3 + time * 0.12; disc(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.05, pal.tone(0.4), pal.tone(0.26));
    } else if (kind === 2) {                                 // a cell: a tinted body and a few bodies inside
      disc(ctx, x, y, r, pal.sunTone(T.tone.cell), pal.sunTone(T.tone.cell * 0.6), 0.12);
      const g = seeds(n);
      for (let i = 0; i < 7; i++) { const a = g() * 6.28 + time * 0.03, d = r * (0.5 + g() * 0.35); disc(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.05 + g() * 0.05), pal.sunTone(T.tone.cell + 0.12), pal.sunTone(T.tone.cell + 0.04)); }
    } else {                                                 // an atom: three tilted orbits with their electrons
      ctx.save(); ctx.strokeStyle = pal.tone(0.22); ctx.lineWidth = Math.max(1.5, r * 0.006);
      for (let i = 0; i < 3; i++) {
        const rot = i * Math.PI / 3 + n * 0.4; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.34, rot, 0, 7); ctx.stroke();
        const a = time * (0.5 + i * 0.13) + i * 2; const ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.34;
        ctx.fillStyle = pal.sunTone(0.55); ctx.beginPath(); ctx.arc(x + ex * Math.cos(rot) - ey * Math.sin(rot), y + ex * Math.sin(rot) + ey * Math.cos(rot), Math.max(2, r * 0.025), 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }

  return {
    pal, vx, vy,
    // dive: extra levels on top of the steady sink (a scene may push the camera in a little further)
    draw(ctx, t, dive = 0) {
      const time = t + clock, z = time * T.dive.rate + dive;
      ctx.fillStyle = pal.night; ctx.fillRect(0, 0, W, H);
      // two star layers, each slowly coming closer, handing over to each other
      for (let k = 0; k < 2; k++) {
        const ph = (time * 0.035 + dive * 0.3 + k / 2) % 1, s = 2 ** ph;
        ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * ph); ctx.translate(vx, vy * 0.6); ctx.scale(s, s); ctx.translate(-vx, -vy * 0.6); ctx.drawImage(sky, 0, 0); ctx.restore();
      }
      // the nested worlds, largest first
      const lf = Math.log(F), nMin = Math.ceil(z - Math.log(4200 / R0) / lf), nMax = Math.floor(z - Math.log(5 / R0) / lf);
      for (let n = nMin; n <= nMax; n++) {
        const r = R0 * F ** (z - n);
        ctx.save(); ctx.globalAlpha = Math.min(1, (r - 5) / 40, (4200 - r) / 1400); world(ctx, n, r, vx, vy, time); ctx.restore();
      }
      // the scale ribbon: a log track with a tick per level, the minor ticks between, and a stop ring per level; the pointer stays put
      ctx.save(); ctx.lineCap = 'round';
      ctx.fillStyle = pal.tone(0.24); ctx.fillRect(ribX - 1.5, ribY0, 3, ribY1 - ribY0);
      ctx.beginPath(); ctx.rect(0, ribY0, W, ribY1 - ribY0); ctx.clip();
      const n0 = Math.floor(z - (ribMid - ribY0) / L) - 1, n1 = Math.ceil(z + (ribY1 - ribMid) / L) + 1;
      for (let n = n0; n <= n1; n++) {
        const y = ribMid + (n - z) * L;
        ctx.fillStyle = pal.tone(0.45); ctx.fillRect(ribX - 12, y - 1.5, 24, 3);
        for (let m = 2; m < 10; m++) { const ym = y + Math.log10(m) * L; ctx.fillStyle = pal.tone(0.3); ctx.fillRect(ribX - 6, ym - 1, 12, 2); }
        ring(ctx, ribX + (rtl ? 26 : -26), y, 7, ((n % 4) + 4) % 4 === 2 ? pal.sunTone(0.6) : pal.tone(0.4), 2.5);
      }
      ctx.restore();
      ctx.fillStyle = pal.sun; ctx.beginPath();
      const d = rtl ? 1 : -1; ctx.moveTo(ribX + d * 4, ribMid); ctx.lineTo(ribX + d * 22, ribMid - 11); ctx.lineTo(ribX + d * 22, ribMid + 11); ctx.closePath(); ctx.fill();
    },
  };
}
