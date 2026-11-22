// The word-strobe ground: symbolic architecture in flat, hard-edged polygons, a few tones of the brand's dark colour and no texture.
// Three rooms: a one-point corridor of window grids (lines and lists), an endless stair climbing to the vanishing point (numbers and
// comparisons), a flat façade of windows (the ending). Each room is drawn once to a canvas; while a scene holds, the camera creeps
// in towards the vanishing point (a few per cent over the scene), so a held frame is never dead. A cut starts each scene fresh.
import { mix } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, room = 'corridor' }) {
  const T = look.tokens, pal = palette(brand, T), vx = W / 2, vy = 820;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
  const line = (a, b, c, w = 3) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
  g.fillStyle = pal.ink; g.fillRect(0, 0, W, H);
  if (room === 'corridor') {
    const bw = 220, bh = 330, L = vx - bw / 2, R = vx + bw / 2, Tp = vy - bh / 2, B = vy + bh / 2;
    poly([[0, 0], [L, Tp], [L, B], [0, H]], pal.wall);
    poly([[W, 0], [R, Tp], [R, B], [W, H]], pal.wall);
    poly([[0, H], [L, B], [R, B], [W, H]], pal.wall2);
    poly([[L, Tp], [R, Tp], [R, B], [L, B]], pal.ink);
    // window grids on both walls: verticals at depths that close in on the far wall, two horizontals running to it
    for (let i = 0; i < 9; i++) {
      const z = 1 / (1 + i * 0.55), xl = L * (1 - z), xr = W - (W - R) * (1 - z);
      const yt = Tp * (1 - z), yb = H - (H - B) * (1 - z);
      line([xl, yt], [xl, yb], pal.edge, Math.max(2, 6 * z)); line([xr, yt], [xr, yb], pal.edge, Math.max(2, 6 * z));
    }
    for (const f of [0.28, 0.62]) {
      line([0, H * f], [L, Tp + bh * f], pal.edge, 3); line([W, H * f], [R, Tp + bh * f], pal.edge, 3);
    }
    line([0, H], [L, B], pal.edge, 3); line([W, H], [R, B], pal.edge, 3);
  } else if (room === 'stairs') {
    let y = H, w = W * 1.3, k = 0;
    while (w > 40 && y > vy - 60) {
      const h = Math.max(6, (y - vy + 120) * 0.12), x0 = vx - w / 2;
      g.fillStyle = k % 2 ? pal.wall : pal.wall2; g.fillRect(x0, y - h, w, h);
      g.fillStyle = pal.edge; g.fillRect(x0, y - h, w, Math.max(1.5, h * 0.12));
      y -= h; w *= 0.9; k++;
    }
    poly([[0, 0], [vx - 40, vy - 60], [0, H]], pal.wall);
    poly([[W, 0], [vx + 40, vy - 60], [W, H]], pal.wall);
  } else {
    const cols = 7, rows = 12, cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      g.fillStyle = (r * 5 + c * 3) % 11 === 0 ? pal.wall2 : pal.wall;
      g.fillRect(c * cw + 14, r * rh + 14, cw - 28, rh - 28);
    }
  }
  return {
    pal,
    // k: 0..1, how far the camera has crept in during this scene
    draw(ctx, t, k = 0) {
      const s = 1 + T.push * Math.min(1, Math.max(0, k));
      ctx.save(); ctx.translate(vx, vy); ctx.scale(s, s); ctx.translate(-vx, -vy); ctx.drawImage(cv, 0, 0); ctx.restore();
    },
  };
}
