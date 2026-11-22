// The scratch-pass joint: the camera never cuts. A near post passes in front of the lens, faster than the fence (it is closer), and the next
// scene is already behind it. The post is ink with paper cuts of wood grain and a lit edge, paper-heavy at the top and ink-heavy at the foot,
// so each part of the frame keeps its tone as it passes.
import { rng } from '/engine/kit.js';

export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand), rtl = brand.dir !== 'ltr', PW = 560;
  const post = document.createElement('canvas'); post.width = PW; post.height = H;
  const g = post.getContext('2d'), r = rng(808);
  g.fillStyle = P.ink; g.fillRect(0, 0, PW, H);
  g.fillStyle = P.paper;
  for (let x = 14; x < PW - 30; x += 11) {                              // grain: long cuts that wander and break, wider near the top
    let y = -20;                                                        // so the post keeps the tone of what it passes (light sky, dark water)
    while (y < H) { const l = 60 + r() * 200, w = 11 * (0.76 - 0.42 * Math.min(1, Math.max(0, (y + l / 2) / H))); g.fillRect(x + Math.sin(y * 0.01) * 3, y, w, l); y += l + 4 + r() * 14; }
  }
  g.fillRect(rtl ? 8 : PW - 44, 0, 36, H);                               // the edge toward the sun is lit
  g.fillStyle = P.ink; for (let y = 0; y < H; y += 11) g.fillRect(rtl ? 8 : PW - 44, y, 36, 2);
  return {
    draw(ctx, from, to, p) {
      const q = p * p * (3 - 2 * p);
      const x = rtl ? -PW + q * (W + PW) : W - q * (W + PW);            // the post's left edge
      const mid = x + PW / 2;
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath();
      if (rtl) ctx.rect(0, 0, mid, H); else ctx.rect(mid, 0, W - mid, H);  // what the post has passed shows the next scene
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.drawImage(post, x, 0);
    },
  };
}
