// The wax world: a small toy world at dusk, built of solids and drawn in crayon. The sky is the brand's darker colour, scribbled
// over towards the horizon with a glow of the accent; a crayon moon hangs in the upper corner and lights everything from there. Below
// the horizon a floor runs off in perspective, its lines converging far away, and a few solids stand on it (cubes, balls, cone
// trees) with their shadows smudged on the floor. The camera sways slowly from side to side, stepped twelve times a second: the moon
// hardly moves, the floor shears, near solids slide past far ones. Everything is built once per brand; a frame only places it.
import { rng, mix } from '/engine/kit.js';
import { palette, masks, grain, hatch, solid, ball, smudge, step, FPS } from './motion.js';

export const HORIZON = 930;
const cache = new Map();
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function build(W, H, P) {
  const key = W + P.light + P.night + P.accent; if (cache.has(key)) return cache.get(key);
  const M = masks(W, H), r = rng(333), Y = HORIZON;
  // the sky, a little wider than the frame for the sway
  const sky = cv(W + 240, Y + 40), sg = sky.getContext('2d');
  sg.fillStyle = P.sky; sg.fillRect(0, 0, sky.width, sky.height);
  const band = cv(sky.width, sky.height), bg = band.getContext('2d');
  bg.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const u = Math.pow(r(), 0.45), y = Y + 40 - u * Y * 0.62, x = r() * sky.width;
    bg.strokeStyle = r() < 0.75 ? P.glow : P.haze; bg.globalAlpha = 0.35 + (1 - (Y + 40 - y) / (Y * 0.62)) * 0.65; bg.lineWidth = 3 + r() * 5;
    bg.beginPath(); bg.moveTo(x, y); bg.quadraticCurveTo(x + 90, y - 4 + r() * 8, x + 200 + r() * 160, y + (r() - 0.5) * 10); bg.stroke();
  }
  grain(band, M.mid, 0, 0); sg.drawImage(band, 0, 0);
  const stars = cv(sky.width, Y), st = stars.getContext('2d'); st.strokeStyle = P.haze; st.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const x = r() * sky.width, y = 30 + r() * Y * 0.5, s = 4 + r() * 6; st.lineWidth = 2.5;
    st.beginPath(); st.moveTo(x - s, y); st.lineTo(x + s, y); st.moveTo(x, y - s); st.lineTo(x, y + s); st.stroke();
  }
  grain(stars, M.mid, 100, 0); sg.drawImage(stars, 0, 0);
  // the moon: the light of the world
  const moon = ball(W, H, 86, P.light, mix(P.light, P.night, 0.3), 7, false);
  const halo = cv(320, 320), hg = halo.getContext('2d'); hg.strokeStyle = P.glow; hg.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r0 = 104 + r() * 10, r1 = 120 + r() * 30; hg.lineWidth = 5; hg.beginPath(); hg.moveTo(160 + Math.cos(a) * r0, 160 + Math.sin(a) * r0); hg.lineTo(160 + Math.cos(a) * r1, 160 + Math.sin(a) * r1); hg.stroke(); }
  grain(halo, M.mid, 300, 40);
  // the floor, wider than the frame: a hatched plane with lines running to the vanishing point and across in perspective
  const FW = W + 700, floor = cv(FW, H - Y + 10), fg = floor.getContext('2d'), fh = floor.height;
  fg.fillStyle = P.floor; fg.fillRect(0, 0, FW, fh);
  hatch(fg, FW, fh, mix(P.floor, P.night, 0.2), 0.08, 10, 3, 41, 0.6);
  fg.strokeStyle = P.floorLine; fg.lineCap = 'round';
  const vx = FW / 2;
  for (let i = -14; i <= 14; i++) { fg.lineWidth = 3 + Math.abs(i) * 0.1; fg.beginPath(); fg.moveTo(vx + i * 12, 0); fg.lineTo(vx + i * 210 + (r() - 0.5) * 20, fh); fg.stroke(); }
  for (let k = 1; k <= 11; k++) { const y = fh * (k / 11) ** 2.1; fg.lineWidth = 2 + k * 0.35; fg.beginPath(); fg.moveTo(0, y); fg.quadraticCurveTo(FW / 2, y + (r() - 0.5) * 8, FW, y + (r() - 0.5) * 6); fg.stroke(); }
  grain(floor, M.heavy, 0, Y);
  // the props: solids standing on the floor (x in the frame, base y, size), with their shadows
  const box = (s, face, side, deep, seed) => solid(W, H, { w: s, h: s, D: s * 0.4, face, side, deep, streak: P.light, seed, draw: (g, c) => { g.fillStyle = c; g.fillRect(0, 0, s, s); } });
  const cone = (s, seed) => solid(W, H, { w: s, h: s * 1.5, D: s * 0.25, face: P.keySide, side: P.keyDeep, deep: mix(P.keyDeep, P.night, 0.3), streak: P.keyFace, seed,
    draw: (g, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s, s * 1.25); g.lineTo(0, s * 1.25); g.closePath(); g.fill(); g.fillRect(s * 0.42, s * 1.2, s * 0.16, s * 0.3); } });
  const props = [
    { x: 40, y: 1010, s: 0.5, sp: box(70, P.light, P.side, P.sideDeep, 3) },
    { x: W - 90, y: 1000, s: 0.45, sp: cone(60, 4) },
    { x: -30, y: 1560, s: 1, sp: box(210, P.keyFace, P.keySide, P.keyDeep, 5) },
    { x: 250, y: 1700, s: 1, sp: { cv: ball(W, H, 95, P.light, P.side, 9, false), ox: 0, oy: 0 } },
    { x: W - 300, y: 1640, s: 1, sp: cone(150, 6) },
    { x: W - 120, y: 1830, s: 1, sp: box(170, P.light, P.side, P.sideDeep, 8) },
  ].map((q) => ({ ...q, sh: smudge(W, H, q.sp.cv.width * 1.1, P.shadow, q.x | 0) }));
  const out = { sky, moon, halo, floor, props }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), L = build(W, H, P), Y = HORIZON;
  const cam = (t) => Math.sin(step(t + clock) * 0.21 + 0.6) * 70;     // the camera's sway, stepped
  return {
    pal: P, horizon: Y, cam, step: (t) => step(t + clock) - clock, fps: FPS,
    depth: (y) => Math.max(0, (y - Y) / (H - Y)),                     // 0 at the horizon, 1 at the foot of the frame
    draw(ctx, t) {
      const cx = cam(t);
      ctx.drawImage(L.sky, -120 - cx * 0.2, 0);
      const mx = W - 190 - cx * 0.08, my = 175;
      ctx.drawImage(L.halo, mx - 160, my - 160); ctx.drawImage(L.moon, mx - L.moon.width / 2, my - L.moon.height / 2);
      ctx.save(); ctx.translate(0, Y); ctx.transform(1, 0, -cx / (H - Y), 1, 0, 0);       // the floor shears with the camera
      ctx.drawImage(L.floor, -350, 0); ctx.restore();
      for (const q of L.props) {
        const k = (q.y - Y) / (H - Y), x = q.x - cx * k, w = q.sp.cv.width * q.s, h = q.sp.cv.height * q.s;
        ctx.drawImage(q.sh, x - w * 0.1 - 30 * q.s, q.y - q.sh.height * q.s * 0.55, q.sh.width * q.s, q.sh.height * q.s);
        ctx.drawImage(q.sp.cv, x, q.y - h, w, h);
      }
    },
  };
}
