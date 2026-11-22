// The line-network ground: a printed map sheet lying on a dark table. The sheet (the brand's lighter colour) has paper tooth and a few
// fibres, a flat water band running through it on 45-degree banks, a faint printed network in the top band and below the safe area
// (other lines, other stops, in pale tints), and a legend panel with a north arrow at the foot. One raking light drifts slowly across
// the sheet. Everything but the light is printed once into a picture.
import { rgba, rng } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, I = M.inks(brand, T), edge = T.sheet.edge;
  const sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H;
  const c = sheet.getContext('2d'), r = rng(1933);
  c.fillStyle = I.table; c.fillRect(0, 0, W, H);
  c.save(); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 30; c.shadowOffsetY = 8;
  c.fillStyle = I.paper; c.fillRect(edge, edge, W - 2 * edge, H - 2 * edge); c.restore();
  c.save(); c.beginPath(); c.rect(edge, edge, W - 2 * edge, H - 2 * edge); c.clip();
  // tooth and fibres
  for (let i = 0; i < 22000; i++) { c.fillStyle = rgba(r() < 0.5 ? I.ink : I.paper, 0.035 * r()); c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  c.strokeStyle = rgba(I.ink, 0.05); c.lineWidth = 1;
  for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 10 + r() * 26; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4, y + Math.sin(a) * l * 0.5 - 4, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  // water: a flat band with 45-degree banks
  c.strokeStyle = I.water; c.lineWidth = 70; c.lineJoin = 'round'; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(-20, 1180); c.lineTo(240, 1180); c.lineTo(420, 1000); c.lineTo(W + 20, 1000); c.stroke();
  // the faint printed network: top band and foot
  const lw = T.line.w * 0.6;
  const faint = [
    [[[-20, 150], [300, 150], [380, 230], [W + 20, 230]], 0],
    [[[180, -20], [180, 120], [260, 200], [260, 250]], 1],
    [[[W + 20, 110], [760, 110], [680, 190], [560, 190]], 2],
    [[[-20, 1360], [420, 1360], [500, 1440], [W + 20, 1440]], 1],
    [[[640, H + 20], [640, 1520], [560, 1440], [560, 1300]], 0],
    [[[W + 20, 1330], [860, 1330], [780, 1410]], 2],
  ];
  for (const [pts, k] of faint) {
    const R = M.route(pts, 36); M.line(c, R, I.ghost(I.lines[k]), lw);
    for (let s = 80; s < R.total - 30; s += 150) { const [x, y] = M.at(R, s); c.fillStyle = I.paper; c.beginPath(); c.arc(x, y, lw * 0.55, 0, Math.PI * 2); c.fill(); c.strokeStyle = I.faint; c.lineWidth = 3; c.stroke(); }
  }
  // the legend panel at the foot, with swatches of the three lines and a north arrow
  const lx = 90, ly = 1560, lwid = W - 180, lh = 250;
  c.fillStyle = I.paper; c.fillRect(lx, ly, lwid, lh);
  c.strokeStyle = I.faint; c.lineWidth = 3; c.strokeRect(lx, ly, lwid, lh); c.lineWidth = 1.5; c.strokeRect(lx + 10, ly + 10, lwid - 20, lh - 20);
  I.lines.forEach((col, k) => { c.strokeStyle = I.ghost(col); c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx + 60, ly + 60 + k * 60); c.lineTo(lx + 220, ly + 60 + k * 60); c.stroke();
    c.fillStyle = I.faint; for (let j = 0; j < 3; j++) c.fillRect(lx + 260 + j * 0, ly + 54 + k * 60, 260 - j * 60, 4 + j * 0); });
  const nx = lx + lwid - 110, ny = ly + lh / 2; c.fillStyle = I.faint; c.beginPath(); c.moveTo(nx, ny - 70); c.lineTo(nx + 26, ny + 40); c.lineTo(nx, ny + 20); c.lineTo(nx - 26, ny + 40); c.closePath(); c.fill();
  c.strokeStyle = I.faint; c.lineWidth = 2; c.beginPath(); c.arc(nx, ny, 84, 0, Math.PI * 2); c.stroke();
  c.restore();
  return {
    I,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(sheet, 0, 0);
      // the raking light: a broad soft wash that drifts across the sheet
      const lx2 = W * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(time * 0.12))), ly2 = H * 0.3;
      const g = ctx.createRadialGradient(lx2, ly2, 0, lx2, ly2, H * 0.7);
      g.addColorStop(0, rgba(I.paper, 0.10)); g.addColorStop(0.6, rgba(I.ink, 0)); g.addColorStop(1, rgba(I.ink, 0.06));
      ctx.fillStyle = g; ctx.fillRect(edge, edge, W - 2 * edge, H - 2 * edge);
    },
  };
}
