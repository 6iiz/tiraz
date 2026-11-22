// The Frame Forensics ground: the investigation desk. The darker brand colour, a very faint field of registration dots (the desk's
// measuring grid), and a soft falloff at the edges. Still: the life of a scene is in its evidence and its clock, not in the desk.
// Built once.
import { mix, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = P.desk; g.fillRect(0, 0, W, H);
  g.fillStyle = mix(P.desk, P.ink, 0.13);
  for (let y = 54; y < H; y += 54) for (let x = 54; x < W; x += 54) g.fillRect(x - 1, y - 1, 2, 2);
  const v = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
  v.addColorStop(0, rgba(P.desk, 0)); v.addColorStop(1, rgba('#000000', 0.3));
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // below the safe area, the rest of the case file: a dim contact strip of earlier sources with their timecodes (decoration)
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, n = 5, gw = (W - 140 - (n - 1) * 18) / n, gh = gw * 0.62, gy = 1420;
  for (let k = 0; k < n; k++) {
    const x = 70 + k * (gw + 18);
    g.fillStyle = mix(P.desk, P.ink, 0.06); g.fillRect(x, gy, gw, gh); g.strokeStyle = mix(P.desk, P.ink, 0.16); g.lineWidth = 1.5; g.strokeRect(x, gy, gw, gh);
    g.fillStyle = mix(P.desk, P.ink, 0.12);
    if (k % 2) for (let i = 0; i < 5; i++) g.fillRect(x + 12, gy + 14 + i * 14, (gw - 24) * (i === 4 ? 0.5 : 0.9), 5);
    else { g.beginPath(); g.moveTo(x + gw * 0.55, gy + gh * 0.4); g.lineTo(x, gy + gh); g.lineTo(x + gw, gy + gh); g.closePath(); g.fill(); }
    g.font = `500 18px "${mono}"`; g.fillStyle = mix(P.desk, P.ink, 0.3); g.textAlign = 'center'; g.direction = 'ltr';
    g.fillText(`${String(k + 1).padStart(2, "0")} / 05`, x + gw / 2, gy + gh + 28);
  }
  return { P, draw(ctx) { ctx.drawImage(cv, 0, 0); } };
}
