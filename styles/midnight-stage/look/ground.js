// The midnight-stage ground: an empty theatre stage seen from the stalls. A dark back wall, a boarded floor running away in
// perspective, velvet side curtains in the wings and a swagged velvet pelmet across the top, all dyed with the brand's accent and
// kept dark. Two lamps in the flies throw faint beams down onto the boards, where they leave a pool; specks of dust turn slowly in
// the beams. Everything but the dust and the slow breathing of the beams is one picture made once. The parts bring their own
// follow-spot and set pieces.
import { rgba, rng, lerp } from '/engine/kit.js';
import { palette, velvet, pool, PELMET, LEGS } from './motion.js';

export const FLOOR = 1330;

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand);
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const c = base.getContext('2d');
  c.fillStyle = pal.wall; c.fillRect(0, 0, W, H);
  // the back wall: a cyclorama barely lit from below
  { const g = c.createLinearGradient(0, PELMET, 0, FLOOR); g.addColorStop(0, rgba(pal.dark, 0.5)); g.addColorStop(1, rgba(pal.light, 0.035)); c.fillStyle = g; c.fillRect(0, 0, W, FLOOR); }
  // the floor: boards converging on a point above the stage, joints getting closer toward the back
  c.fillStyle = pal.floor; c.fillRect(0, FLOOR, W, H - FLOOR);
  const vx = W / 2, vy = FLOOR - 900;
  c.strokeStyle = pal.seam; c.lineWidth = 2;
  for (let i = -14; i <= 14; i++) { const xb = W / 2 + i * 120; c.beginPath(); c.moveTo(lerp(vx, xb, (FLOOR - vy) / (H - vy)), FLOOR); c.lineTo(xb, H); c.stroke(); }
  for (let k = 1; k < 9; k++) { const y = FLOOR + (H - FLOOR) * (k / 9) ** 1.7; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  { const g = c.createLinearGradient(0, FLOOR - 6, 0, FLOOR + 30); g.addColorStop(0, rgba(pal.dark, 0)); g.addColorStop(0.2, rgba(pal.dark, 0.6)); g.addColorStop(1, rgba(pal.dark, 0)); c.fillStyle = g; c.fillRect(0, FLOOR - 6, W, 36); }
  // the pool the lamps leave on the boards
  c.drawImage(pool(pal.light, 800, 0.12, 0.6), W / 2 - 520, FLOOR + 40, 1040, 420);
  // the wings: velvet legs
  const leg = velvet(LEGS + 40, H, pal, 34);
  c.drawImage(leg, -40, 0); c.drawImage(leg, W - LEGS, 0);
  // the pelmet: velvet with swags (each swag a fold hanging lower in the middle)
  const pel = velvet(W, PELMET + 60, pal, 90, 0.25), r = rng(31);
  const p2 = document.createElement('canvas'); p2.width = W; p2.height = PELMET + 60;
  { const g = p2.getContext('2d'); g.drawImage(pel, 0, 0); g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000';
    const n = 4, w = W / n; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0);
    for (let i = n; i > 0; i--) { const x1 = i * w, x0 = (i - 1) * w; g.lineTo(x1, PELMET - 40); g.quadraticCurveTo((x0 + x1) / 2, PELMET + 55, x0, PELMET - 40); }
    g.closePath(); g.fill(); }
  c.drawImage(p2, 0, 0);
  // a gold-free trim: a thin lit cord along the swags
  c.strokeStyle = rgba(pal.light, 0.16); c.lineWidth = 3; c.beginPath();
  for (let i = 0; i < 4; i++) { const x0 = i * W / 4, x1 = x0 + W / 4; c.moveTo(x0, PELMET - 46); c.quadraticCurveTo((x0 + x1) / 2, PELMET + 44, x1, PELMET - 46); }
  c.stroke();
  // beams from two lamps in the flies (cached), and the dust in them
  const beam = document.createElement('canvas'); beam.width = W; beam.height = H;
  { const g = beam.getContext('2d');
    for (const [lx, tx] of [[150, W / 2 + 60], [W - 150, W / 2 - 60]]) {
      const gr = g.createLinearGradient(0, PELMET, 0, FLOOR + 200); gr.addColorStop(0, rgba(pal.light, 0.075)); gr.addColorStop(1, rgba(pal.light, 0.015));
      g.fillStyle = gr; g.beginPath(); g.moveTo(lx - 18, PELMET - 20); g.lineTo(lx + 18, PELMET - 20); g.lineTo(tx + 330, FLOOR + 200); g.lineTo(tx - 330, FLOOR + 200); g.closePath(); g.fill();
    } }
  const motes = []; for (let i = 0; i < 46; i++) motes.push([r(), r(), r(), 0.6 + r() * 1.6]);
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      ctx.save(); ctx.globalAlpha = 0.85 + 0.15 * Math.sin(time * 0.8); ctx.drawImage(beam, 0, 0); ctx.restore();
      ctx.fillStyle = rgba(pal.light, 0.22);
      for (const [a, b, ph, s] of motes) {
        const y = PELMET + ((b * (FLOOR - PELMET) + time * 9 * s) % (FLOOR - PELMET)), side = a < 0.5;
        const u = (y - PELMET) / (FLOOR - PELMET + 200), cx = side ? lerp(150, W / 2 + 60, u) : lerp(W - 150, W / 2 - 60, u);
        const x = cx + (ph - 0.5) * 2 * lerp(18, 330, u) * 0.9 + Math.sin(time * 0.6 + ph * 9) * 12;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
      }
    },
  };
}
