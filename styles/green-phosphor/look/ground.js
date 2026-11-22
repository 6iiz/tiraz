// The phosphor ground: the dark glass of a monochrome tube. A faint lift of phosphor in its middle (the tube is warm), the character
// grid shown as the dimmest possible dots at every cell corner, and a soft brighter band that rolls slowly down the glass (the
// refresh you see when a tube is filmed). Built once; the band's position comes from the reel's time, so it never restarts at a cut.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), cw = T.cell.w, ch = T.cell.h;
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  {
    const c = base.getContext('2d');
    c.fillStyle = pal.glass; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, H * 0.62);
    g.addColorStop(0, rgba(pal.phos, T.tone.lift)); g.addColorStop(1, rgba(pal.phos, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = pal.faint;
    for (let y = 0; y < H; y += ch) for (let x = 0; x < W; x += cw * 2) c.fillRect(x, y, 2, 2);
    // a text-mode frame round the working area: + corners, - rules, | sides, all on the cell grid
    const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, x0 = 2 * cw, x1 = W - 3 * cw, y0 = SAFE.top - 2 * ch, y1 = SAFE.bottom + ch;
    c.font = `500 ${Math.round(ch * 0.62)}px "${mono}"`; c.fillStyle = pal.frame; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr';
    const xl = x0 + Math.floor((x1 - x0) / cw) * cw;
    for (let x = x0; x <= xl; x += cw) { const e = x === x0 || x === xl; c.fillText(e ? '+' : '-', x + cw / 2, y0); c.fillText(e ? '+' : '-', x + cw / 2, y1); }
    for (let y = y0 + ch; y < y1 - 1; y += ch) { c.fillText('|', x0 + cw / 2, y); c.fillText('|', xl + cw / 2, y); }
  }
  const band = document.createElement('canvas'); band.width = 4; band.height = 420;
  {
    const c = band.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, rgba(pal.phos, 0)); g.addColorStop(0.5, rgba(pal.phos, T.tone.roll)); g.addColorStop(1, rgba(pal.phos, 0));
    c.fillStyle = g; c.fillRect(0, 0, 4, 420);
  }
  return {
    pal, cw, ch,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      const y = ((time * T.roll) % (H + 420)) - 420;
      ctx.drawImage(band, 0, y, W, 420);
    },
  };
}
