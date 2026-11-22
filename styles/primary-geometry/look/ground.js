// The primary-geometry ground: the brand's darker colour as a night ground ruled into square cells by faint construction lines, with
// compass crosses at some crossings. On it runs the machine: flat shapes, one per cell, each turning a quarter (or an eighth) on its
// own count of beats and locking with a snap; one square hops between three cells, one dot walks round a ring. The shapes leave the
// middle of the frame mostly to the plates the parts lay there. The construction layer is built once; the machine runs on `clock`,
// so it keeps turning across cuts instead of restarting.
import { rng } from '/engine/kit.js';
import { palette, steps, Q } from './motion.js';

// [col, row, kind, every (beats), phase (beats), fill]
const TILES = [
  [0, 0, 'quarter', 2, 0, 'accent'], [1, 0, 'square', 1, 0.5, 'slate'], [3, 0, 'half', 3, 1, 'deep'], [4, 0, 'ring', 1, 0, 'slate'], [5, 0, 'tri', 2, 1, 'slate'],
  [0, 1, 'bar', 1, 0.25, 'slate'], [1, 1, 'half', 2, 0, 'deep'], [2, 1, 'hop', 2, 0.5, 'accent'], [5, 1, 'quarter', 2, 1, 'deep'],
  [0, 3, 'half', 3, 0, 'deep'], [5, 4, 'quarter', 2, 0.5, 'slate'], [0, 5, 'tri', 2, 1.5, 'slate'], [5, 6, 'half', 2, 1, 'deep'],
  [0, 7, 'ring', 1, 0.5, 'slate'], [1, 7, 'quarter', 2, 0, 'deep'], [2, 7, 'square', 1, 0, 'slate'], [4, 7, 'tri', 3, 0, 'deep'], [5, 7, 'bar', 1, 0.5, 'slate'],
  [0, 8, 'half', 2, 1, 'slate'], [1, 8, 'hop', 2, 0, 'deep'], [4, 8, 'quarter', 2, 0.5, 'accent'], [5, 8, 'square', 1, 0.25, 'deep'],
  [0, 9, 'tri', 2, 0, 'deep'], [2, 9, 'ring', 1, 0, 'slate'], [3, 9, 'half', 3, 2, 'slate'], [5, 9, 'quarter', 2, 1.5, 'slate'],
  [1, 10, 'square', 1, 0.75, 'slate'], [3, 10, 'quarter', 2, 1, 'deep'], [4, 10, 'bar', 1, 0, 'deep'],
];

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), c = T.cell, rtl = brand.dir !== 'ltr', beat = T.beat;
  const cols = Math.round(W / c), rows = Math.ceil(H / c);
  // the construction layer, once
  const con = document.createElement('canvas'); con.width = W; con.height = H;
  const g = con.getContext('2d'), r = rng(1923);
  g.fillStyle = P.night; g.fillRect(0, 0, W, H);
  g.fillStyle = P.line;
  for (let i = 1; i < cols; i++) g.fillRect(i * c - 1, 0, 2, H);
  for (let j = 1; j < rows; j++) g.fillRect(0, j * c - 1, W, 2);
  g.strokeStyle = P.line; g.lineWidth = 2;
  for (let i = 1; i < cols; i++) for (let j = 1; j < rows; j++) if (r() < 0.35) {
    const x = i * c, y = j * c; g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.stroke();
    g.fillRect(x - 26, y - 1, 52, 2); g.fillRect(x - 1, y - 26, 2, 52);
  }
  g.beginPath(); g.arc(W / 2, H * 0.5, c * 4.6, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H * 0.5, c * 2.5, 0, Math.PI * 2); g.stroke();
  const fill = (k) => P[k];
  const dir = rtl ? -1 : 1;

  function tile(ctx, time, [col, row, kind, every, phase, fk]) {
    if (row * c < 1420 && row * c + c > 1250 && (rtl ? cols - 1 - col : col) * c < 400) return;   // the mark's corner stays clear
    const s = steps(time, every * beat, phase * beat, T.dur.snap), x = (rtl ? cols - 1 - col : col) * c + c / 2, y = row * c + c / 2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = fill(fk);
    const h = c / 2;
    switch (kind) {
      case 'quarter': ctx.rotate(dir * s * Q); ctx.beginPath(); ctx.moveTo(-h, -h); ctx.arc(-h, -h, c, 0, Q); ctx.closePath(); ctx.fill(); break;
      case 'half': ctx.rotate(dir * s * Q); ctx.beginPath(); ctx.arc(0, h, h, Math.PI, 0); ctx.closePath(); ctx.fill(); break;
      case 'tri': ctx.rotate(dir * s * Q); ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(h, -h); ctx.lineTo(-h, h); ctx.closePath(); ctx.fill(); break;
      case 'square': ctx.rotate(dir * s * Q / 2); ctx.fillRect(-c * 0.31, -c * 0.31, c * 0.62, c * 0.62); break;
      case 'bar': ctx.rotate(dir * s * Q / 2); ctx.fillRect(-c * 0.46, -11, c * 0.92, 22); break;
      case 'ring': {
        ctx.strokeStyle = fill(fk); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, c * 0.33, 0, Math.PI * 2); ctx.stroke();
        const a = dir * s * Q / 2; ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(Math.cos(a) * c * 0.33, Math.sin(a) * c * 0.33, 15, 0, Math.PI * 2); ctx.fill(); break;
      }
      case 'hop': {                                                  // a square shuttles over three cells, turning as it goes
        const u = ((s % 4) + 4) % 4, pos = u < 2 ? u : 4 - u;
        ctx.translate(dir * pos * c, 0); ctx.rotate(dir * s * Q); ctx.fillRect(-c * 0.25, -c * 0.25, c * 0.5, c * 0.5); break;
      }
    }
    ctx.restore();
  }
  return {
    P, cell: c,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(con, 0, 0);
      for (const d of TILES) tile(ctx, time, d);
    },
  };
}
