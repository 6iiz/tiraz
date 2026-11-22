// The glass in front of every frame: fine scanlines, a vignette that darkens toward the tube's rounded edge, the curved bezel corners,
// and a faint reflection across the top. Below the safe area, a status row in the mono face: the handle after a prompt. Built once;
// drawn as one picture plus one short row. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';

export async function create({ W, H, brand, look }) {
  const T = look.tokens, pal = palette(brand, T), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const glass = document.createElement('canvas'); glass.width = W; glass.height = H;
  {
    const c = glass.getContext('2d');
    c.fillStyle = rgba('#000000', T.tone.scan); for (let y = 0; y < H; y += 4) c.fillRect(0, y + 2, W, 2);
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.62);
    v.addColorStop(0, rgba(pal.glass, 0)); v.addColorStop(1, rgba(pal.glass, T.tone.edge)); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = pal.glass; c.beginPath(); c.rect(0, 0, W, H); c.roundRect(14, 14, W - 28, H - 28, 70); c.fill('evenodd');
    const r = c.createLinearGradient(0, 0, W, H * 0.3);
    r.addColorStop(0, rgba('#ffffff', 0.035)); r.addColorStop(0.5, rgba('#ffffff', 0)); c.fillStyle = r; c.fillRect(0, 0, W, H * 0.3);
  }
  const y = SAFE.bottom + 74;
  return {
    draw(ctx, t) {
      ctx.drawImage(glass, 0, 0);
      ctx.save(); ctx.font = `500 24px "${mono}"`; ctx.fillStyle = pal.dim; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      const s = '> ' + brand.handle; ctx.fillText(s, SAFE.left, y);
      if ((t % 1.2) < 0.6) { const w = ctx.measureText(s + ' ').width; ctx.fillRect(SAFE.left + w, y - 12, 12, 24); }
      ctx.restore();
    },
  };
}
