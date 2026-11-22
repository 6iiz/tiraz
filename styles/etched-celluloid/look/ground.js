// The etched-celluloid ground: black emulsion, edge to edge. Four mottled plates (warm blotches of the dye, cool ones of the light colour,
// fine grain, a darker fall-off at the corners) take turns, one per drawing, so the black itself is alive. over() adds what a hand-made
// print collects: a few bright dust specks and short curls (scratched-off emulsion), and a flicker of about one percent. weave(t) is
// a pixel of gate movement for the parts. Plates are built once per brand (a module cache), from rng(seed).
import { mix, rgba, rng } from '/engine/kit.js';
import { palette, drawing, needle, seg, arc } from './motion.js';

const cache = new Map();
const canvasOf = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

function build(W, H, brand, T) {
  const key = `${W}x${H}:${JSON.stringify(brand.colors)}`;
  if (cache.has(key)) return cache.get(key);
  const P = palette(brand);
  const plates = [0, 1, 2, 3].map((k) => {
    const c = canvasOf(W, H), g = c.getContext('2d'), r = rng(1955 + k * 101);
    g.fillStyle = P.emulsion; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 34; i++) {
      const x = r() * W, y = r() * H, R = 120 + r() * 380, gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, rgba(r() < 0.55 ? P.dye : P.light, T.tone.blotch * (0.4 + r() * 0.6))); gr.addColorStop(1, rgba(P.emulsion, 0));
      g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
    }
    for (let i = 0; i < 16000; i++) { g.fillStyle = rgba(r() < 0.7 ? P.light : '#000000', T.tone.grain * (0.3 + r())); g.fillRect(r() * W, r() * H, 1.4, 1.4); }
    const v = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.45, H * 0.8);
    v.addColorStop(0, rgba('#000000', 0)); v.addColorStop(1, rgba('#000000', 0.5));
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    return c;
  });
  const out = { plates, P }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0, sun = true }) {
  const T = look.tokens, B = build(W, H, brand, T), P = B.P, rtl = brand.dir !== 'ltr';
  const nOf = (t) => drawing(t + clock);
  // The scratched world behind every scene: a hatched sun high on the far side (above the words) and a sea of swells below the safe area.
  const S = { x: rtl ? 200 : W - 200, y: 330, r: 76 };
  const hatch = [];
  for (let d = -S.r + 6, i = 0; d < S.r - 4; d += 9, i++) {                     // zigzag chords across the disc, at 60 degrees
    const c = Math.sqrt(S.r * S.r - d * d) - 4, ux = Math.cos(1.05), uy = Math.sin(1.05), nx = -uy, ny = ux;
    const a = [S.x + nx * d - ux * c, S.y + ny * d - uy * c], b = [S.x + nx * d + ux * c, S.y + ny * d + uy * c];
    hatch.push(...seg(...(i % 2 ? b : a), ...(i % 2 ? a : b), 12));
  }
  const waves = [];
  for (let k = 0, q = rng(77); k < 14; k++) { const u = k / 13; waves.push({ y: 1400 + 520 * u ** 1.35, A: 4 + 16 * u, f: 0.006 + q() * 0.006, ph: q() * 6, dir: k % 2 ? 1 : -1 }); }
  return {
    pal: P,
    n: nOf,
    weave(t) { const r = rng((nOf(t) * 5 + 11) >>> 0); return { x: (r() - 0.5) * 1.4, y: (r() - 0.5) * 1.8 }; },
    draw(ctx, t) {
      const n = nOf(t), td = n / 12;
      ctx.drawImage(B.plates[((n % 4) + 4) % 4], 0, 0);
      if (sun) {                                                          // the sun: a ring of dye, a needle outline, dense zigzag hatching, rays
        needle(ctx, arc(S.x, S.y, S.r + 10, S.r + 10, 0, Math.PI * 2, 14), { w: 16, n, seed: 301, color: P.dye, alpha: 0.38, tremble: 3 });
        needle(ctx, arc(S.x, S.y, S.r, S.r, 0, Math.PI * 2, 12), { w: 3, n, seed: 302, color: P.cream, tremble: 2 });
        needle(ctx, hatch, { w: 2.2, n, seed: 303, color: P.cream, alpha: 0.8, tremble: 2.2, passes: 1 });
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2 + 0.1, q = rng(k * 17 + 5), L = 26 + q() * 42 + Math.sin(td * 2 + k) * 6;
          needle(ctx, seg(S.x + Math.cos(a) * (S.r + 26), S.y + Math.sin(a) * (S.r + 26), S.x + Math.cos(a) * (S.r + 26 + L), S.y + Math.sin(a) * (S.r + 26 + L), 10), { w: 2.2, n, seed: 310 + k, color: P.cream, alpha: 0.6 });
        }
      }
      for (let k = 0; k < waves.length; k++) {                            // the sea: scratched swells, wider and brighter toward the front
        const { y, A, f, ph, dir } = waves[k], pts = [];
        for (let x = -30; x <= W + 30; x += 16) pts.push([x, y + A * Math.sin(x * f + ph + td * 0.9 * dir) + A * 0.4 * Math.sin(x * f * 2.3 + ph * 1.7)]);
        needle(ctx, pts, { w: 1.2 + k * 0.17, n, seed: 400 + k, color: P.cream, alpha: 0.22 + k * 0.035, tremble: 1.6 });
        const q = rng(500 + k), rx = S.x + (q() - 0.5) * 60, rw = 40 + k * 9 + q() * 30;           // the sun's path on the water, in dye
        const ry = y + A * Math.sin(rx * f + ph + td * 0.9 * dir);
        needle(ctx, seg(rx - rw, ry - 3, rx + rw, ry - 3, 12), { w: 3 + k * 0.4, n, seed: 520 + k, color: P.dye, alpha: 0.55 });
      }
    },
    over(ctx, t) {
      const n = nOf(t), r = rng((n * 13 + 5) >>> 0);
      ctx.save();
      ctx.fillStyle = rgba(P.light, T.tone.flicker * r()); ctx.fillRect(0, 0, W, H);
      for (let i = 0, m = 3 + Math.floor(r() * 5); i < m; i++) {
        const x = r() * W, y = r() * H;
        if (r() < 0.7) { ctx.fillStyle = rgba(P.light, 0.35 + r() * 0.4); ctx.beginPath(); ctx.arc(x, y, 0.8 + r() * 2.2, 0, 7); ctx.fill(); }
        else {                                                             // a short curl of lifted emulsion
          ctx.strokeStyle = rgba(P.light, 0.4); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40, x + (r() - 0.5) * 30, y + (r() - 0.5) * 30); ctx.stroke();
        }
      }
      ctx.restore();
    },
  };
}
