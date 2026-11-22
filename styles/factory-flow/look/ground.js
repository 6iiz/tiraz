// The factory-flow ground: a factory seen in elevation, cut open, against the night (the brand's darker colour). A thick-outlined
// outer wall with a sawtooth roof and a chimney frames the frame; inside, the back wall is a flat panel with faint seams, where the
// parts set their rooms. Below the safe area is the works floor: a belt carrying crates, two gears and a pipe run, and two small
// faceless workers. Static parts are drawn once; per frame the belt and its crates run, the gears turn, the chimney breathes.
import { rgba } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = M.palette(brand, T);
  const wx0 = 26, wx1 = W - 26, wy0 = 150, floor = 1290, beltY = 1430;
  const pic = document.createElement('canvas'); pic.width = W; pic.height = H;
  const c = pic.getContext('2d');
  c.fillStyle = P.night; c.fillRect(0, 0, W, H);
  // the chimney (behind the roof)
  M.shape(c, M.rectPath(W - 230, 20, 90, 150), P.wall, P, 6, 10);
  c.fillStyle = P.accent; c.fillRect(W - 230, 46, 90, 14);
  // roof: three saw teeth
  const teeth = 3, tw = (wx1 - wx0) / teeth;
  M.shape(c, (g) => { g.beginPath(); g.moveTo(wx0, wy0); for (let i = 0; i < teeth; i++) { g.lineTo(wx0 + i * tw, wy0 - 80); g.lineTo(wx0 + (i + 1) * tw, wy0); } g.closePath(); }, P.wall, P, 6, 10);
  for (let i = 0; i < teeth; i++) { c.fillStyle = rgba(P.light, 0.12); c.beginPath(); c.moveTo(wx0 + i * tw + 14, wy0 - 56); c.lineTo(wx0 + i * tw + 14, wy0 - 6); c.lineTo(wx0 + i * tw + 70, wy0 - 6); c.closePath(); c.fill(); }
  // the outer wall, cut open
  M.shape(c, M.rectPath(wx0, wy0, wx1 - wx0, H - wy0 + 40), P.wall, P, 8, 12);
  c.strokeStyle = rgba(P.light, 0.04); c.lineWidth = 2;
  for (let y = wy0 + 90; y < floor; y += 90) { c.beginPath(); c.moveTo(wx0 + 10, y); c.lineTo(wx1 - 10, y); c.stroke(); }
  for (let x = wx0 + 180; x < wx1; x += 180) { c.beginPath(); c.moveTo(x, wy0 + 6); c.lineTo(x, floor - 6); c.stroke(); }
  // the works floor
  c.fillStyle = P.off; c.fillRect(wx0 + 4, floor, wx1 - wx0 - 8, H - floor);
  c.fillStyle = P.line; c.fillRect(wx0, floor - 4, wx1 - wx0, 10);
  c.fillStyle = P.accent; for (let x = wx0 + 10; x < wx1 - 30; x += 60) c.fillRect(x, floor + 6, 30, 8);
  // a pipe run along the floor, up the far wall
  M.pipe(c, [[wx0 + 40, H + 20], [wx0 + 40, 1640], [W - 300, 1640], [W - 300, 1560]], P, 26);
  // two workers: faceless figures, one beside the belt, one at a valve
  const worker = (x, y, s) => {
    M.shape(c, (g) => { g.beginPath(); g.roundRect(x - 16 * s, y - 50 * s, 32 * s, 54 * s, 12 * s); }, P.plaque, P, 3, 4);
    M.shape(c, (g) => { g.beginPath(); g.arc(x, y - 66 * s, 13 * s, 0, Math.PI * 2); }, P.crate, P, 3, 4);
    c.fillStyle = P.line; c.fillRect(x - 14 * s, y + 4 * s, 10 * s, 26 * s); c.fillRect(x + 4 * s, y + 4 * s, 10 * s, 26 * s);
  };
  worker(170, 1540, 1); worker(W - 440, 1760, 1.1);
  // the valve wheel
  c.strokeStyle = P.line; c.lineWidth = 6; c.beginPath(); c.arc(W - 300, 1600, 22, 0, Math.PI * 2); c.stroke();
  return {
    P, wall: { x0: wx0, x1: wx1, y0: wy0, floor },
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(pic, 0, 0);
      // smoke: three puffs rising from the chimney, each on its own cycle
      for (let i = 0; i < 3; i++) {
        const q = ((time * 0.35 + i / 3) % 1), x = W - 185 + q * 60, y = 16 - q * 90, r = 16 + q * 26;
        ctx.fillStyle = rgba(P.light, 0.14 * (1 - q)); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      // the belt and its crates, running toward the far side
      const v = 90, dir = brand.dir !== 'ltr' ? -1 : 1, s = time * v * dir;
      M.belt(ctx, wx0 + 60, wx1 - 60, beltY, P, s);
      for (let k = 0; k < 5; k++) {
        const span = wx1 - wx0 - 200, x = wx0 + 100 + ((((k * span / 5) + s) % span) + span) % span;
        M.crate(ctx, x, beltY - 38, 50, P);
      }
      M.gear(ctx, W - 150, 1560, 62, time * 0.9, P.steel, P, 12);
      M.gear(ctx, W - 230, 1660, 40, -time * 0.9 * (62 / 40) + 0.2, P.crate, P, 8);
    },
  };
}
