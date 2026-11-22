// The slate: the brand's darker colour, freshly wiped, with a fine grain and a soft mottling that drifts very slowly (the board is
// never quite still while a line holds). A plain painted wooden frame runs round the edge, and a ledge at the foot, far below the safe
// area, holds a white stick and an accent stick of chalk with a little dust. No old lessons, nothing floating in front of the board.
// Textures are built once per palette and shared by every scene; the drift uses `clock`, so a cut does not restart it.
import { rng, mix, rgba } from '/engine/kit.js';
import { palette, chalk } from './motion.js';

const cache = new Map();
function textures(W, H, P, T) {
  const id = P.slate + P.light + P.dark; if (cache.has(id)) return cache.get(id);
  const r = rng(4242);
  // mottling: soft blobs on a small canvas, scaled up when drawn so they stay soft for free
  const mw = 300, mh = 520, m = document.createElement('canvas'); m.width = mw; m.height = mh; const g = m.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = r() * mw, y = r() * mh, rad = 20 + r() * 70, c = r() < 0.55 ? P.light : P.dark, a = (c === P.light ? T.tone.mottle : T.tone.mottle * 1.6) * (0.4 + r());
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // grain: a tile of pale and dark specks
  const N = 256, gt = document.createElement('canvas'); gt.width = gt.height = N; const gg = gt.getContext('2d');
  for (let i = 0; i < 2600; i++) { gg.fillStyle = rgba(r() < 0.6 ? P.light : P.dark, T.tone.grain * (0.3 + r())); gg.fillRect(r() * N, r() * N, 1 + r() * 1.5, 1 + r() * 1.5); }
  // the frame and the ledge, drawn once on a full-size layer
  const f = document.createElement('canvas'); f.width = W; f.height = H; const fg = f.getContext('2d'), b = T.frame;
  fg.fillStyle = P.wood; fg.fillRect(0, 0, W, b); fg.fillRect(0, H - b, W, b); fg.fillRect(0, 0, b, H); fg.fillRect(W - b, 0, b, H);
  fg.strokeStyle = rgba(P.dark, 0.35); fg.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { const y = r() * H; fg.beginPath(); fg.moveTo(0, y); fg.lineTo(b, y + 30 + r() * 60); fg.moveTo(W - b, y); fg.lineTo(W, y + 30 + r() * 60); fg.stroke(); }
  for (let i = 0; i < 26; i++) { const x = r() * W; fg.beginPath(); fg.moveTo(x, 0); fg.lineTo(x + 40 + r() * 80, b); fg.moveTo(x, H - b); fg.lineTo(x + 40 + r() * 80, H); fg.stroke(); }
  fg.fillStyle = 'rgba(0,0,0,0.30)'; fg.fillRect(b, b, W - 2 * b, 6); fg.fillRect(b, b, 6, H - 2 * b);            // the board sits in the frame
  const ly = H - T.ledge;                                                                                     // the ledge
  fg.fillStyle = 'rgba(0,0,0,0.35)'; fg.fillRect(b, ly + 26, W - 2 * b, 16);
  fg.fillStyle = mix(P.wood, P.light, 0.12); fg.fillRect(b, ly, W - 2 * b, 28);
  fg.fillStyle = rgba(P.light, 0.1); fg.fillRect(b, ly, W - 2 * b, 3);
  return cache.set(id, { m, gt, f, ly }).get(id);
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), X = textures(W, H, P, T), rtl = brand.dir !== 'ltr';
  const stick = (ctx, x, y, w, color, seed) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(x + 4, y + 6, w, 22, 9); ctx.fill();
    ctx.fillStyle = chalk(ctx, color, seed); ctx.beginPath(); ctx.roundRect(x, y, w, 22, 9); ctx.fill();
  };
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.slate; ctx.fillRect(0, 0, W, H);
      const dx = Math.sin(time * 0.07) * 60 - 80, dy = Math.cos(time * 0.05) * 50 - 80;
      ctx.drawImage(X.m, dx, dy, W + 160, H + 160);
      ctx.save(); ctx.fillStyle = ctx.createPattern(X.gt, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.drawImage(X.f, 0, 0);
      // chalk on the ledge, and the dust it shed
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = chalk(ctx, P.chalk, 31); ctx.fillRect(T.frame + 40, X.ly + 2, W - 2 * T.frame - 80, 8); ctx.restore();
      stick(ctx, rtl ? W - 330 : 210, X.ly - 18, 120, P.chalk, 5);
      stick(ctx, rtl ? W - 520 : 400, X.ly - 18, 70, P.accent, 6);
    },
  };
}
