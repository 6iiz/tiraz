// The intertitle ground: a picture house. Dark velvet folds at the sides and a scalloped valance at the top frame a rounded screen; the
// print on it is the brand's darker colour, lit from the middle, with a soft dark rim and uneven density. Over the content (over()) the
// projector adds what lives on a print: grain that changes with every film frame, a faint flicker, dust, a hair now and then and broken
// vertical scratches. weave(t) is the gate weave the parts apply to their content (about a pixel). Everything heavy is built once per
// brand (a module cache), from rng(seed); the flicker stays under two percent so the print never flashes.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
const canvasOf = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const screenPath = (g, S) => { g.beginPath(); g.roundRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0, S.r); };

function build(W, H, brand, T) {
  const key = `${W}x${H}:${JSON.stringify(brand.colors)}:${JSON.stringify(T.screen)}`;
  if (cache.has(key)) return cache.get(key);
  const P = palette(brand), S = T.screen, r = rng(1923);
  const base = canvasOf(W, H), g = base.getContext('2d');
  g.fillStyle = P.house; g.fillRect(0, 0, W, H);
  // velvet folds: soft vertical gradients, side drapes and the valance
  const folds = (x0, x1, y0, y1, pitch) => {
    for (let x = x0; x < x1; x += pitch) {
      const gr = g.createLinearGradient(x, 0, x + pitch, 0);
      gr.addColorStop(0, mix(P.velvet, '#000000', 0.45)); gr.addColorStop(0.45, mix(P.velvet, P.light, 0.1)); gr.addColorStop(1, mix(P.velvet, '#000000', 0.5));
      g.fillStyle = gr; g.fillRect(x, y0, pitch + 1, y1 - y0);
    }
  };
  folds(0, S.x0 + 6, 0, H, 13); folds(S.x1 - 6, W, 0, H, 13);
  folds(0, W, 0, S.y0 - 24, 26);
  g.fillStyle = mix(P.velvet, '#000000', 0.3);
  for (let x = 0; x < W; x += 60) { g.beginPath(); g.arc(x + 30, S.y0 - 26, 30, 0, Math.PI); g.fill(); }
  g.fillStyle = mix(P.velvet, P.accent, 0.25); g.fillRect(0, S.y0 - 30, W, 4);
  // the screen: lit from the middle, uneven density, a soft dark rim
  g.save(); screenPath(g, S); g.clip();
  const lit = g.createRadialGradient(W / 2, 760, 60, W / 2, 820, 1050);
  lit.addColorStop(0, mix(mix(P.dark, P.light, 0.17), P.accent, 0.03)); lit.addColorStop(0.5, mix(P.dark, P.light, 0.08)); lit.addColorStop(1, mix(P.dark, '#000000', 0.35));
  g.fillStyle = lit; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = r() * H, rad = 80 + r() * 260, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(r() < 0.5 ? P.light : '#000000', 0.035)); gr.addColorStop(1, rgba(P.dark, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.filter = 'blur(14px)'; g.lineWidth = 46; g.strokeStyle = rgba('#000000', 0.55); screenPath(g, S); g.stroke(); g.filter = 'none';
  g.restore();
  // the audience: a row of heads and shoulders in silhouette across the foot of the screen (below the safe area)
  g.fillStyle = mix(P.house, '#000000', 0.3);
  for (let x = -30, i = 0; x < W + 60; i++) {
    const s = 0.85 + r() * 0.35, hx = x + 50 * s, hy = H - 150 * s - r() * 26;
    g.beginPath(); g.ellipse(hx, hy, 30 * s, 37 * s, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(hx - 70 * s, H); g.lineTo(hx - 72 * s, hy + 80 * s); g.quadraticCurveTo(hx - 70 * s, hy + 34 * s, hx, hy + 28 * s); g.quadraticCurveTo(hx + 70 * s, hy + 34 * s, hx + 72 * s, hy + 80 * s); g.lineTo(hx + 72 * s, H); g.fill();
    if (r() < 0.25) { g.beginPath(); g.ellipse(hx, hy - 30 * s, 44 * s, 10 * s, 0, 0, Math.PI * 2); g.fill(); g.fillRect(hx - 26 * s, hy - 62 * s, 52 * s, 34 * s); }   // a hat
    x += 105 * s + r() * 20;
  }
  // grain: four plates, one per film frame in turn
  const grain = [0, 1, 2, 3].map((k) => {
    const c = canvasOf(W, H), q = c.getContext('2d'), rr = rng(400 + k);
    for (let i = 0; i < 24000; i++) {
      q.fillStyle = rgba(rr() < 0.55 ? P.light : '#000000', T.tone.grain * (0.35 + rr()));
      const s = 1 + rr() * 1.6; q.fillRect(rr() * W, rr() * H, s, s);
    }
    return c;
  });
  const out = { base, grain, P };
  cache.set(key, out);
  return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, S = T.screen, B = build(W, H, brand, T), P = B.P, F = T.film;
  const frameOf = (t) => Math.floor((t + clock) * F + 1e-6);
  return {
    pal: P, screen: S,
    weave(t) { const r = rng(frameOf(t) * 5 + 11); return { x: (r() - 0.5) * 1.2, y: (r() - 0.5) * 2.2 }; },
    draw(ctx) { ctx.drawImage(B.base, 0, 0); },
    over(ctx, t) {
      const f = frameOf(t), time = t + clock;
      ctx.save(); screenPath(ctx, S); ctx.clip();
      ctx.drawImage(B.grain[((f % 4) + 4) % 4], 0, 0);
      const r = rng(f * 13 + 1);
      ctx.fillStyle = rgba(P.light, T.tone.flicker * r()); ctx.fillRect(0, 0, W, H);        // flicker: a lift of a percent or two
      for (let i = 0, n = Math.floor(r() * 4); i < n; i++) {                                  // dust: a few specks for one frame
        ctx.fillStyle = r() < 0.6 ? rgba('#000000', 0.55) : rgba(P.silver, 0.4);
        ctx.beginPath(); ctx.arc(S.x0 + r() * (S.x1 - S.x0), S.y0 + r() * (S.y1 - S.y0), 1 + r() * 2.6, 0, 7); ctx.fill();
      }
      if (r() < 0.05) {                                                                       // a hair in the gate
        const x = S.x0 + 80 + r() * (S.x1 - S.x0 - 160), y = S.y0 + 80 + r() * (S.y1 - S.y0 - 160);
        ctx.strokeStyle = rgba('#000000', 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 40 * r(), y + 30, x - 30, y + 60 * r(), x + 20, y + 90); ctx.stroke();
      }
      for (let k = 0; k < 2; k++) {                                                           // scratches: each lasts a couple of seconds
        const e = Math.floor((time + k * 1.7) / 2.3), q = rng(e * 31 + k * 7 + 1000);
        if (q() > 0.65) continue;
        const x = S.x0 + 40 + q() * (S.x1 - S.x0 - 80) + Math.sin(time * 1.3 + k) * 6 + (r() - 0.5) * 1.2;
        ctx.strokeStyle = rgba(q() < 0.7 ? P.silver : '#000000', 0.16); ctx.lineWidth = 1.3; ctx.beginPath();
        for (let y = S.y0; y < S.y1;) { const l = 60 + q() * 260; ctx.moveTo(x, y); ctx.lineTo(x + (q() - 0.5) * 3, Math.min(S.y1, y + l)); y += l + q() * 120; }
        ctx.stroke();
      }
      ctx.restore();
    },
  };
}
