// The Rapid Play home stage: a sunburst of the brand's accent turning behind everything (faster at every stage), a dark stage floor
// with a zigzag lip along the foot, and the show's board along the top: three hearts (the lives) on the reading side and eight stage
// pips on the other, lit up to the current stage. In the middle stands the game screen, a thick-outlined frame with a hard shadow;
// each part paints its own medium inside it (`screen`). Under it runs the fuse (`fuse`). Uses `clock` for the stage and the turn.
import { rng } from '/engine/kit.js';
import { palette, stage, speed, toon, rect, heart, OUT } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', S = stage(clock), sp = speed(clock);
  const TV = { x: 78, y: 300, w: W - 156, h: 880 }, cx = W / 2, cy = 740;
  const rays = 22, R = Math.hypot(W, H);
  return {
    P, TV, stage: S, speed: sp, rtl,
    draw(ctx, t, { lives = 3, pips = S, spin = 1 } = {}) {
      const time = t + clock, a0 = time * 0.22 * sp * spin;
      ctx.fillStyle = P.ray2; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.ray; ctx.beginPath();
      for (let i = 0; i < rays; i += 2) { const a = a0 + (i * 2 * Math.PI) / rays, b = a + (2 * Math.PI) / rays;
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.closePath(); }
      ctx.fill();
      // the floor along the foot
      const fy = 1300; ctx.fillStyle = P.floor; ctx.beginPath(); ctx.moveTo(0, fy);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, fy + ((x / 40) % 2 ? 22 : 0)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.lineWidth = OUT; ctx.strokeStyle = P.d; ctx.stroke();
      ctx.fillStyle = P.ray2; for (let k = 0; k < 7; k++) ctx.fillRect(0, fy + 70 + k * k * 16, W, 3 + k);
      ctx.fillStyle = P.ray2; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 60, fy + 22); ctx.lineTo(cx + k * 60 + 4, fy + 22); ctx.lineTo(cx + k * 240 + 6, H); ctx.lineTo(cx + k * 240 - 2, H); ctx.fill(); }
      // the board: lives and stage pips
      const hy = 186, beat = Math.floor(time * 2 * sp) % 2;
      for (let i = 0; i < 3; i++) { const x = rtl ? W - 120 - i * 92 : 120 + i * 92, s = 66 * (i < lives ? (beat && i === 0 ? 1.08 : 1) : 0.9);
        toon(ctx, heart(x, hy - s * 0.35, s), i < lives ? P.a : P.l, P, 6, 6); }
      for (let i = 0; i < 8; i++) { const x = rtl ? 90 + i * 46 : W - 90 - i * 46;
        toon(ctx, (c) => c.arc(x, hy, 15, 0, Math.PI * 2), i < pips ? P.l : P.ray2, P, 4, 5); }
    },
    // the game screen: shadow, the part's own medium clipped inside, the thick frame on top
    screen(ctx, paint, k = 1) {
      const { x, y, w, h } = TV;
      ctx.save(); ctx.translate(cx, y + h / 2); ctx.scale(k, k); ctx.translate(-cx, -(y + h / 2));
      ctx.fillStyle = P.d; ctx.beginPath(); ctx.roundRect(x + 18, y + 18, w, h, 34); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.clip(); paint(ctx); ctx.restore();
      ctx.lineWidth = 12; ctx.strokeStyle = P.d; ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.stroke();
      ctx.restore();
    },
    // the fuse under the screen: burns from the reading side, one knot per beat; the spark spits; a bomb waits at the end
    fuse(ctx, t, d, at = 0) {
      const y = 1236, x0 = rtl ? TV.x + TV.w - 30 : TV.x + 30, x1 = rtl ? TV.x + 70 : TV.x + TV.w - 70, beat = 0.5 / sp;
      const p = Math.min(1, Math.max(0, (t - Math.max(0, at)) / Math.max(0.5, d - Math.max(0, at)))), xs = x0 + (x1 - x0) * p;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = P.d; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.strokeStyle = P.l; ctx.lineWidth = 7; ctx.setLineDash([16, 12]); ctx.lineDashOffset = 0; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      const n = Math.max(2, Math.round((d - Math.max(0, at)) / beat));
      for (let i = 1; i < n; i++) { const kx = x0 + ((x1 - x0) * i) / n; if ((kx - xs) * (x1 - x0) <= 0) continue;
        ctx.fillStyle = P.d; ctx.beginPath(); ctx.arc(kx, y, 13, 0, Math.PI * 2); ctx.fill(); }
      toon(ctx, (c) => c.arc(x1 + (rtl ? -34 : 34), y - 4, 34, 0, Math.PI * 2), P.d, P, 0, 4);
      ctx.fillStyle = P.l; ctx.beginPath(); ctx.arc(x1 + (rtl ? -44 : 24), y - 16, 8, 0, Math.PI * 2); ctx.fill();
      if (p < 1) { const r = rng(Math.floor(t * 30) + 7);                       // the spark
        toon(ctx, (c) => { for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 + r(), rr = i % 2 ? 10 : 24 + r() * 10; i ? c.lineTo(xs + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(xs + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }, P.a, P, 0, 4);
        ctx.fillStyle = P.l; ctx.beginPath(); ctx.arc(xs, y, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    },
  };
}
