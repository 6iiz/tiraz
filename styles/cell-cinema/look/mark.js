// The window's bottom: the active sheet tab carries the brand's short name, and the status bar carries the handle in the mono face with a
// small zoom slider. Below the safe area; decoration only.
import { mix, contrast } from '/engine/kit.js';
export async function create({ W, H, brand, look, kit }) {
  const T = look.tokens, g = T.grid, F = T.shell, rtl = brand.dir !== 'ltr';
  const { bg, text } = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg, c = mix(dark, light, 0.42), line = mix(light, dark, 0.22);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const tabX = rtl ? W - 90 - 260 : 90;
  const tab = kit.fit(brand.shortName ?? brand.name, { size: 26, weight: 700, maxW: 220, single: true, where: 'the sheet tab' });
  const yS = g.bottom + F.tabH + (H - g.bottom - F.tabH) / 2 - 30;
  return {
    draw(ctx) {
      kit.drawText(ctx, tab, { x0: tabX + 20, x1: tabX + 240, y: g.bottom + (F.tabH - 6) / 2, color: dark, decor: true });
      ctx.save(); ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? W - 30 : 30, yS);
      const sx = rtl ? 40 : W - 240; ctx.fillStyle = line; ctx.fillRect(sx, yS - 1, 200, 2); ctx.fillStyle = c; ctx.fillRect(sx + 96, yS - 9, 8, 18);
      ctx.restore();
    },
  };
}
