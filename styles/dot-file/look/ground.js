// The dot-file ground: the open case file. A sheet of the brand's lighter colour with a soft mottle and fine grain, a fold across
// its foot, a folder tab and a paper clip at the top, a height chart ruled down the far margin, and halftone dots crowding the edges
// of the frame in two screens (ink and accent) that overprint. Everything is built once. Per frame: dust specks reseeded every two
// frames, and the accent screen breathing a few pixels out of register. Uses `clock`.
import { mix, rgba, rng, SAFE } from '/engine/kit.js';
import { palette, dotField } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), rtl = brand.dir !== 'ltr';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const r = rng(1945);

  // the mottle: a coarse random tile, smoothed up to the frame
  const [mot, m] = mk(27, 48);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 27; x++) { m.fillStyle = mix(P.paper, P.ink, r() * T.tone.mottle); m.fillRect(x, y, 1, 1); }
  const [base, b] = mk(W, H);
  b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high'; b.drawImage(mot, 0, 0, W, H);
  for (let i = 0; i < 9000; i++) { b.fillStyle = rgba(r() < 0.7 ? P.ink : P.paper, 0.04 + r() * 0.05); b.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  const v = b.createRadialGradient(W / 2, H * 0.42, H * 0.3, W / 2, H * 0.5, H * 0.8);
  v.addColorStop(0, rgba(P.ink, 0)); v.addColorStop(1, rgba(P.ink, T.tone.vignette)); b.fillStyle = v; b.fillRect(0, 0, W, H);
  // the fold, under the safe area
  const fy = SAFE.bottom + 150; b.fillStyle = rgba(P.ink, 0.07); b.fillRect(0, fy, W, 3); b.fillStyle = rgba(P.paper, 0.5); b.fillRect(0, fy + 3, W, 2);
  // the folder tab and its label box, top, on the reading side
  const tx = rtl ? W - 470 : 70;
  b.fillStyle = P.folder; b.beginPath(); b.moveTo(tx, 0); b.lineTo(tx + 400, 0); b.lineTo(tx + 370, 120); b.lineTo(tx + 30, 120); b.closePath(); b.fill();
  b.strokeStyle = P.rule; b.lineWidth = 2; b.stroke();
  b.strokeStyle = rgba(P.ink, 0.35); b.lineWidth = 2; b.strokeRect(tx + 60, 34, 280, 58);
  b.fillStyle = rgba(P.ink, 0.25); for (let i = 0; i < 3; i++) b.fillRect(tx + 80, 48 + i * 14, 120 + r() * 110, 4);
  // the paper clip, on the far side
  const cx = rtl ? 150 : W - 150;
  b.strokeStyle = mix(P.ink, P.paper, 0.45); b.lineWidth = 6; b.lineCap = 'round'; b.beginPath();
  b.moveTo(cx - 22, 190); b.lineTo(cx - 22, 30); b.arc(cx, 30, 22, Math.PI, 0); b.lineTo(cx + 22, 160); b.arc(cx + 6, 160, 16, 0, Math.PI); b.lineTo(cx - 10, 60); b.stroke();
  // the height chart down the far margin
  const hx = rtl ? 0 : W - 54;
  b.fillStyle = P.rule;
  for (let y = 300, k = 0; y < SAFE.bottom; y += 24, k++) { const l = k % 5 === 0 ? 46 : 22; b.fillRect(rtl ? hx : hx + 54 - l, y, l, 2); }
  b.fillRect(rtl ? 52 : W - 54, 290, 2, SAFE.bottom - 290);

  // halftone crowding the frame's edges: an ink screen and an accent screen at other angles
  const edge = (x, y) => Math.max(1 - y / 250, 1 - (H - y) / 560, 1 - Math.min(x, W - x) / 64) * 0.95;
  const inkDots = dotField(W, H, T.screen.step, T.screen.angleInk, P.dotInk, (x, y) => edge(x, y) * (0.5 + 0.5 * Math.sin(x * 0.004 + y * 0.003)));
  const accDots = dotField(W + 40, H + 40, T.screen.step + 4, T.screen.angleAccent, P.accent, (x, y) => edge(x - 20, y - 20) * 0.8 * (0.5 + 0.5 * Math.cos(x * 0.003 - y * 0.002)));

  return {
    P, reg: { x: T.reg.x, y: T.reg.y },
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(accDots, -20 + Math.sin(time * 0.7) * 3, -20 + Math.cos(time * 0.5) * 3);
      ctx.drawImage(inkDots, 0, 0); ctx.restore();
      const q = rng(1000 + Math.floor(time * 30));                                         // dust on the print, every two frames
      for (let i = 0; i < 140; i++) { ctx.fillStyle = q() < 0.75 ? rgba(P.paper, 0.8) : rgba(P.ink, 0.35); ctx.fillRect(q() * W, q() * H, 1.5 + q() * 2, 1.5 + q() * 2); }
    },
  };
}
