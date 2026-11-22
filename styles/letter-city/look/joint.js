// The letter-city joint: the camera keeps gliding, and a dark building close to the lens passes across the frame against the reading
// direction, its lit windows streaking by. Ahead of it is the old block, behind it the new one. The slab is the city's own dusk
// tone, so the frame's brightness hardly moves (no flash).
import { mix, rgba, rng, ease } from '/engine/kit.js';
import { palette } from './ground.js';

export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', sw = Math.round(W * 0.62);
  const slab = document.createElement('canvas'); slab.width = sw; slab.height = H; const c = slab.getContext('2d'), r = rng(911);
  const g = c.createLinearGradient(0, 0, sw, 0);
  g.addColorStop(0, mix(P.night, P.light, 0.1)); g.addColorStop(0.5, mix(P.night, P.light, 0.15)); g.addColorStop(1, mix(P.night, P.light, 0.07));
  c.fillStyle = g; c.fillRect(0, 0, sw, H);
  const cw = 86, ch = 120;
  for (let y = 40; y < H; y += ch) for (let x = 34; x + cw * 0.6 < sw; x += cw) {
    const lit = r() < 0.32; c.fillStyle = lit ? rgba(r() < 0.75 ? P.lit : P.litB, 0.55 + r() * 0.4) : mix(P.night, P.light, 0.04);
    c.fillRect(x, y, cw * 0.58, ch * 0.62);
  }
  c.fillStyle = rgba(P.glow, 0.9); c.fillRect(rtl ? sw - 6 : 0, 0, 6, H);       // the lit edge that leads
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), travel = W + sw;
      // right-to-left brands: the slab enters from the left and moves right (the camera trucks left past it)
      const x = rtl ? -sw + travel * q : W - travel * q;
      const xa = Math.max(0, Math.min(W, x)), xb = Math.max(0, Math.min(W, x + sw));
      if (rtl) {               // behind the slab (left of it) the new block, ahead of it (right) the old one
        if (xa > 0) ctx.drawImage(to, 0, 0, xa, H, 0, 0, xa, H);
        if (xb < W) ctx.drawImage(from, xb, 0, W - xb, H, xb, 0, W - xb, H);
      } else {
        if (xa > 0) ctx.drawImage(from, 0, 0, xa, H, 0, 0, xa, H);
        if (xb < W) ctx.drawImage(to, xb, 0, W - xb, H, xb, 0, W - xb, H);
      }
      if (xb > xa) ctx.drawImage(slab, xa - x, 0, xb - xa, H, xa, 0, xb - xa, H);
    },
  };
}
