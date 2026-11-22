// The white board: the brand's lighter colour, glossy. Faint ghosts of old lessons that were never fully wiped (rings, arrows, a scrawl,
// a little sum) sit in the surface; a soft band of sheen drifts slowly across it; an aluminium rail runs along the top and the foot,
// and the foot rail carries a capped marker of each colour. The board is long and the camera travels along it, so it has no side
// edges. Textures are built once per palette; the sheen uses `clock`, so a cut does not restart it.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, stroke, ring, arrow } from './motion.js';

const cache = new Map();
function layers(W, H, P, T) {
  const id = P.board + P.dark + P.accent; if (cache.has(id)) return cache.get(id);
  const r = rng(808), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  // scuffs: very fine level micro-scratches
  g.strokeStyle = rgba(P.dark, 0.025); g.lineWidth = 1;
  for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, l = 20 + r() * 120; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 6); g.stroke(); }
  // ghosts of old lessons, wiped but not gone
  const line = (pts, w) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  g.strokeStyle = P.ghost;
  for (let i = 0; i < 16; i++) {
    const x = 60 + r() * (W - 120), y = 180 + r() * (H - 420), k = r();
    g.globalAlpha = 0.5 + r() * 0.5;
    if (k < 0.3) line(ring(900 + i, x, y, 50 + r() * 90, 36 + r() * 50), 6);
    else if (k < 0.55) line(arrow(900 + i, x, y, x + (r() - 0.5) * 300, y + (r() - 0.5) * 200), 6);
    else { const pts = []; let px = x; for (let j = 0; j < 9; j++) { pts.push([px, y + Math.sin(j * 1.9 + i) * 14]); px += 18 + r() * 14; } line(pts, 5); }
  }
  g.globalAlpha = 1;
  // the rails
  const rail = (y, h) => { g.fillStyle = P.rail; g.fillRect(0, y, W, h); g.fillStyle = rgba('#ffffff', 0.35); g.fillRect(0, y + 3, W, 3); g.fillStyle = rgba('#000000', 0.12); g.fillRect(0, y + h - 4, W, 4); };
  rail(0, T.rail); g.fillStyle = rgba('#000000', 0.06); g.fillRect(0, T.rail, W, 10);
  const fy = H - T.tray; rail(fy, 34); g.fillStyle = rgba('#000000', 0.08); g.fillRect(0, fy + 34, W, 14);
  const pen = (x, color) => {            // a capped marker lying on the tray
    g.fillStyle = rgba('#000000', 0.15); g.beginPath(); g.roundRect(x + 6, fy - 26, 230, 34, 12); g.fill();
    g.fillStyle = mix(P.board, P.dark, 0.06); g.beginPath(); g.roundRect(x, fy - 34, 230, 34, 12); g.fill();
    g.fillStyle = color; g.beginPath(); g.roundRect(x + 160, fy - 36, 76, 38, 12); g.fill(); g.fillRect(x + 30, fy - 34, 90, 7);
  };
  pen(W * 0.18, P.ink); pen(W * 0.52, P.accent);
  return cache.set(id, cv).get(id);
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), L = layers(W, H, P, T);
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.board; ctx.fillRect(0, 0, W, H);
      // the sheen: a broad soft diagonal band moving slowly across the gloss
      const x = ((time * 26) % (W + 1400)) - 700;
      ctx.save(); ctx.translate(x, 0); ctx.rotate(-0.35);
      const g = ctx.createLinearGradient(-260, 0, 260, 0);
      g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(0.5, rgba('#ffffff', T.tone.sheen)); g.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = g; ctx.fillRect(-260, -400, 520, H * 1.6); ctx.restore();
      ctx.drawImage(L, 0, 0);
    },
  };
}
