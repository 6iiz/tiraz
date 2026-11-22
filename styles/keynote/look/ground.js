// The keynote ground: a near-black stage in the brand's darker colour, a faint hairline grid that fades out toward the edges, and a
// soft stage light from above that drifts very slowly while a scene holds. The grid and the dark edges are drawn once; the grid comes
// up in the first half second of the reel. Uses `clock`, so the light keeps drifting across cuts instead of jumping.
import { rgba, span } from '/engine/kit.js';
import { palette, pool, S } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), cell = T.grid.cell;
  const grid = document.createElement('canvas'); grid.width = W; grid.height = H;
  {
    const c = grid.getContext('2d'); c.strokeStyle = pal.grid; c.lineWidth = 1; c.beginPath();
    for (let x = (W / 2) % cell; x <= W; x += cell) { c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H); }
    for (let y = (H / 2) % cell; y <= H; y += cell) { c.moveTo(0, Math.round(y) + 0.5); c.lineTo(W, Math.round(y) + 0.5); }
    c.stroke();
    // the grid is seen only near the middle of the stage
    c.globalCompositeOperation = 'destination-in';
    const g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.62);
    g.addColorStop(0, rgba(pal.light, 1)); g.addColorStop(0.6, rgba(pal.light, 0.5)); g.addColorStop(1, rgba(pal.light, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  const edge = document.createElement('canvas'); edge.width = W; edge.height = H;
  {
    const c = edge.getContext('2d'), g = c.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
    g.addColorStop(0, rgba(pal.dark, 0)); g.addColorStop(1, rgba(pal.dark, 0.85)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  const light = pool(pal.light, 1500, 1100, 0.085);
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = pal.dark; ctx.fillRect(0, 0, W, H);
      const lx = W / 2 + Math.sin(time * 0.35) * 70, ly = H * 0.2 + Math.cos(time * 0.27) * 30;
      ctx.drawImage(light, lx - light.width / 2, ly - light.height / 2);
      const g = S(span(time, -0.1, 0.5));
      if (g > 0) { ctx.save(); ctx.globalAlpha = g; ctx.drawImage(grid, 0, 0); ctx.restore(); }
      ctx.drawImage(edge, 0, 0);
    },
  };
}
