// The crimson-cut ground: the brand's background as a sheet of dyed paper with its grain, a sawtooth border cut from the far red along
// the top and the bottom of the frame, and four window flowers (rosettes in the far red) at the corners, half off the sheet, turning
// very slowly on the reel's clock. The sheet is built once per pair of papers; only the corner flowers move.
import { rng } from '/engine/kit.js';
import { papers, rosette, lay } from './motion.js';

const cache = new Map();
function sheet(W, H, P) {
  const key = P.ground + P.red; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rng(1958);
  g.fillStyle = P.ground; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 20000; i++) { g.fillStyle = r() < 0.55 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  g.strokeStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 600; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  const saw = (y0, down) => {                                         // a border strip with a sawtooth edge facing the sheet
    g.save(); g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 6; g.shadowOffsetY = down ? 4 : -2; g.fillStyle = P.far; g.beginPath();
    const tooth = 24, h = 34, d = 18, e = down ? y0 + h : y0 - h;
    g.moveTo(0, y0); g.lineTo(0, e); for (let x = 0; x <= W; x += tooth) { g.lineTo(x + tooth / 2, e + (down ? d : -d)); g.lineTo(x + tooth, e); } g.lineTo(W, y0); g.closePath(); g.fill(); g.restore();
  };
  saw(0, true); saw(H, false);
  cache.set(key, c); return c;
}
export function create({ W, H, brand, look, clock = 0 }) {
  const P = papers(brand), tex = sheet(W, H, P), flower = rosette(190, P.far, 0, 77);
  return {
    P,
    draw(ctx, t) {
      ctx.drawImage(tex, 0, 0);
      const a = (t + clock) * 0.05;
      for (const [x, y, s] of [[0, 120, 1], [W, 120, -1], [0, H - 120, -1], [W, H - 120, 1]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a * s); lay(ctx, flower, 0, 0); ctx.restore(); }
    },
  };
}
