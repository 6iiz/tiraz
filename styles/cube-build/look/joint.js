// The cube-build joint: the next scene is laid down tile by tile like a course of blocks. Square tiles of the new frame drop onto
// the old one from just above their place, the bottom course first and each course from the reading side, and seat with a snap.
import { SAFE } from '/engine/kit.js';
const out3 = (p) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
export function create({ W, H, brand, look }) {
  const S = 120, rtl = brand.dir !== 'ltr', cols = Math.ceil(W / S), rows = Math.ceil(H / S), tiles = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const course = rows - 1 - j, along = rtl ? cols - 1 - i : i;
    tiles.push({ x: i * S, y: j * S, d: (course / rows) * 0.56 + (along / cols) * 0.12 + ((i * 7 + j * 3) % 5) * 0.01 });
  }
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (const c of tiles) {
        const q = (p - c.d) / 0.24; if (q <= 0) continue;
        const e = out3(q), dy = (1 - e) * -S * 1.1, w = Math.min(S, W - c.x), h = Math.min(S, H - c.y);
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 4);
        ctx.drawImage(to, c.x, c.y, w, h, c.x, c.y + dy, w, h);
        if (q < 1) { ctx.globalAlpha = 0.25 * (1 - e); ctx.fillStyle = '#000'; ctx.fillRect(c.x, c.y + dy + h - 4, w, 4); }
        ctx.restore();
      }
    },
  };
}
