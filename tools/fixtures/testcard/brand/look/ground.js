// The test card's ground: a flat colour and one thin bar that crosses the frame at 120 px per second of REEL time.
// The bar proves that `clock` keeps the ground continuous when scenes follow each other in a sequence.
export function create({ W, H, brand, clock = 0 }) {
  return {
    draw(ctx, t) {
      ctx.fillStyle = brand.colors.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = brand.colors.accent; ctx.fillRect(((t + clock) * 120) % W, 0, 6, H);
    },
  };
}
