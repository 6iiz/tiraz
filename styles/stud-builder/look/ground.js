// The stud-builder ground: a real tabletop shot close. The desk is the brand's ground colour with a faint long grain; behind its far
// edge the room is out of focus (a soft wall and a few blurred discs of light in the brand's colours); in front, below the safe area,
// a matte baseplate of the accent's dark mix with rows of studs and a few loose bricks lying on it. The camera drifts smoothly (it is
// the only thing that does not move in poses). Built once on a canvas a little larger than the frame; drawn from t + clock.
import { rng, mix, rgba } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = M.palette(brand), G = look.tokens.set, mx = 50, my = 30;
  const cv = document.createElement('canvas'); cv.width = W + mx * 2; cv.height = H + my * 2;
  const g = cv.getContext('2d'), r = rng(2381), CW = cv.width, CH = cv.height, edge = G.edge + my;
  g.fillStyle = P.bg; g.fillRect(0, 0, CW, CH);
  // the room behind, out of focus
  g.save(); g.filter = 'blur(26px)';
  g.fillStyle = mix(P.bg, P.text, 0.07); g.fillRect(-60, -60, CW + 120, edge + 40);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = rgba(i % 3 ? P.text : P.accent, i % 3 ? 0.07 : 0.16);
    g.beginPath(); g.arc(r() * CW, r() * edge * 0.85, 30 + r() * 70, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  // the desk: its far edge, then the grain running across it
  g.fillStyle = mix(P.bg, P.dark, 0.25); g.fillRect(0, edge, CW, 6);
  g.save(); g.beginPath(); g.rect(0, edge + 6, CW, CH); g.clip();
  for (let i = 0; i < 160; i++) {
    const y = edge + 6 + r() * (CH - edge), a = r() * 6, f = 0.002 + r() * 0.004;
    g.strokeStyle = rgba(r() < 0.5 ? P.text : P.dark, 0.02 + r() * 0.035); g.lineWidth = 1 + r() * 3;
    g.beginPath(); for (let x = -10; x <= CW + 10; x += 30) { const yy = y + Math.sin(x * f + a) * 8; if (x < 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke();
  }
  g.restore();
  // the baseplate in front, with its studs (rows recede upwards a little)
  const py = G.plate + my;
  g.fillStyle = mix(P.plate, P.dark, 0.35); g.fillRect(0, py - 10, CW, 10);
  g.fillStyle = P.plate; g.fillRect(0, py, CW, CH - py);
  const pitch = 54, rows = Math.ceil((CH - py) / 26) + 1;
  for (let j = 0; j < rows; j++) {
    const yy = py + 16 + j * 26 * (1 + j * 0.03), sc = 1 + j * 0.03;
    for (let x = 20 + (j % 2) * 0; x < CW; x += pitch * sc) {
      const rx = 15 * sc, ry = rx * 0.36, sh = 7 * sc;
      g.fillStyle = mix(P.plate, P.dark, 0.3); g.beginPath(); g.ellipse(x, yy, rx, ry, 0, 0, Math.PI); g.fill(); g.fillRect(x - rx, yy - sh, rx * 2, sh);
      g.fillStyle = mix(P.plate, P.light, 0.16); g.beginPath(); g.ellipse(x, yy - sh, rx, ry, 0, 0, Math.PI * 2); g.fill();
    }
  }
  // loose bricks lying on the plate
  for (const [x, y, w, c] of [[90, py + 120, 170, P.accent], [700, py + 60, 118, P.brick], [430, py + 300, 230, P.mid], [880, py + 330, 118, P.accent]]) {
    const pc = M.piece(P, w, 64, c, { pitch: 58 }); M.put(g, pc, x, y);
  }
  // a soft vignette, a neutral dark at low alpha
  const vg = g.createRadialGradient(CW / 2, CH * 0.45, CH * 0.3, CW / 2, CH * 0.45, CH * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)'); g.fillStyle = vg; g.fillRect(0, 0, CW, CH);
  // the camera: a slow smooth drift; parts translate by cam(t) so their bricks stay on the desk
  const cam = (t) => { const time = t + clock; return [Math.sin(time * 0.17) * 12, Math.sin(time * 0.11 + 1) * 7]; };
  return {
    P, cam,
    draw(ctx, t) {
      const [cx, cy] = cam(t);
      ctx.drawImage(cv, -mx + cx, -my + cy);
    },
  };
}
