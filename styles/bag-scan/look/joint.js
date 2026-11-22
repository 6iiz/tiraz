// The Bag Scan joint: the belt runs. Inside the scanner window the old picture is pulled out the far side, while the next scene's own
// belt brings its case in past the line sensor behind it; the console chrome above and below does not move.
export function create({ W, H, brand, look }) {
  const G = look.tokens.console, rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1;
  const e = (p) => p ** 2.2;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(to, 0, 0);
      const s = e(p) * W, y0 = G.top, h = H - G.top - G.bottom;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
      ctx.drawImage(from, 0, y0, W, h, dir * s, y0, W, h);
      ctx.restore();
    },
  };
}
