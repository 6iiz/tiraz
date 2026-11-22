// The ticking-split joint: a cut that is a layout change. The frame is divided into six cells by hard gutters; the cells switch from the
// old scene to the new one one after another (each a hard cut, no blend), and the gutters close again.
import { contrast } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const g = look.tokens.gutter * 2, rtl = brand.dir !== 'ltr', ground = brand.colors;
  const lumDark = contrast(ground.bg, '#000000') <= contrast(ground.text, '#000000') ? ground.bg : ground.text;
  const cells = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) cells.push({ x: c * W / 2, y: r * H / 3, w: W / 2, h: H / 3, k: r * 2 + (rtl ? 1 - c : c) });
  return {
    draw(ctx, from, to, p) {
      for (const C of cells) {
        const src = p > 0.12 + C.k * 0.11 ? to : from;
        ctx.drawImage(src, C.x, C.y, C.w, C.h, C.x, C.y, C.w, C.h);
      }
      const a = Math.sin(Math.PI * Math.min(1, Math.max(0, p))), w = g * a;
      if (w > 0.5) {
        ctx.fillStyle = lumDark;
        ctx.fillRect(W / 2 - w / 2, 0, w, H);
        for (let r = 1; r < 3; r++) ctx.fillRect(0, (r * H) / 3 - w / 2, W, w);
      }
    },
  };
}
