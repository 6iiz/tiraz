// Below the safe area: a compass cross in the accent and the handle in the mono face, on a small night plate so the machine does
// not run through it. Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const { bg, text, accent } = brand.colors;
  const lum = (h) => parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11;
  const night = lum(text) >= lum(bg) ? bg : text, paper = night === bg ? text : bg, c = mix(paper, night, 0.35);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 72, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; const w = ctx.measureText(brand.handle).width;
      ctx.fillStyle = night; ctx.fillRect(x - 14, y - 26, w + 84, 52);
      ctx.fillStyle = accent; ctx.fillRect(x, y - 1.5, 30, 3); ctx.fillRect(x + 13.5, y - 15, 3, 30);
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 15, y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 48, y + 1); ctx.restore();
    },
  };
}
