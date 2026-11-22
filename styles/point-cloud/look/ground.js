// The point-cloud ground: a near-black field (the brand's darker colour) and, in the lower part of the frame, a scanned place built in
// code: rolling ground laid down in along-track scan rows, a handful of block buildings (roofs dense, walls sparse) and clumps of trees.
// Every return is coloured by its height on a ramp from the dark ground to the light colour, the top of the ramp warmed by the accent.
// One camera move carries the whole reel: the cloud turns slowly about its centre on the reel's clock, so it never restarts at a cut.
// A faint survey sweep passes through it every few seconds. A scrim keeps the upper frame clean for reading.
// draw(ctx, t, { plane }) — plane 0..1 lifts a classification plane through the cloud; returns under it take the class colour.
import { mix, rgba, rng, clamp } from '/engine/kit.js';
import { palette } from './motion.js';

let CACHE = null;
function build() {
  if (CACHE) return CACHE;
  const r = rng(4417), P = [];
  const ground = (x, z) => 9 * Math.sin(x * 0.031 + 0.7) + 7 * Math.cos(z * 0.027 - 0.4) + 4 * Math.sin((x + z) * 0.06) + 3 * Math.cos(x * 0.09 - z * 0.05);
  const blocks = [];
  for (let i = 0; i < 9; i++) blocks.push({ x: -70 + r() * 130, z: -60 + r() * 110, w: 12 + r() * 16, d: 10 + r() * 18, h: 14 + r() * 34 });
  const inBlock = (x, z) => blocks.some((b) => Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2);
  for (let z = -100; z <= 100; z += 2.3) for (let x = -100; x <= 100; x += 2.0) {       // along-track scan rows
    const jx = x + (r() - 0.5) * 1.2, jz = z + (r() - 0.5) * 0.5;
    if (jx * jx + jz * jz > 108 * 108 || inBlock(jx, jz) || r() < 0.12) continue;
    P.push([jx, ground(jx, jz), jz]);
  }
  for (const b of blocks) {
    const g = ground(b.x, b.z) - 2, top = g + b.h;
    for (let u = -b.w / 2; u <= b.w / 2; u += 1.5) for (let v = -b.d / 2; v <= b.d / 2; v += 1.5) P.push([b.x + u + (r() - 0.5) * 0.6, top + (r() - 0.5) * 0.4, b.z + v + (r() - 0.5) * 0.6]);
    for (let k = 0; k < b.h * 5; k++) {                                                   // sparse walls, the side the scanner saw
      const s = r() < 0.5, u = (r() - 0.5) * (s ? b.w : b.d);
      P.push(s ? [b.x + u, g + r() * b.h, b.z - b.d / 2] : [b.x - b.w / 2, g + r() * b.h, b.z + u]);
    }
  }
  for (let i = 0; i < 34; i++) {                                                          // tree crowns
    const cx = -95 + r() * 190, cz = -95 + r() * 190; if (cx * cx + cz * cz > 100 * 100 || inBlock(cx, cz)) continue;
    const rad = 4 + r() * 4, cy = ground(cx, cz) + 7 + r() * 6;
    for (let k = 0; k < 70; k++) { const a = r() * 6.283, b = Math.acos(2 * r() - 1), q = rad * Math.cbrt(r()); P.push([cx + q * Math.sin(b) * Math.cos(a), cy + q * Math.cos(b) * 0.8, cz + q * Math.sin(b) * Math.sin(a)]); }
  }
  let lo = Infinity, hi = -Infinity; for (const p of P) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
  const n = P.length, X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), Hn = new Float32Array(n);
  P.forEach((p, i) => { X[i] = p[0]; Y[i] = p[1]; Z[i] = p[2]; Hn[i] = (p[1] - lo) / (hi - lo); });
  CACHE = { n, X, Y, Z, Hn, lo, hi };
  return CACHE;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand), C = build(), BINS = 10;
  const ramp = (h) => (h < 0.7 ? mix(mix(pal.dark, pal.light, 0.24), mix(pal.dark, pal.light, 0.68), h / 0.7) : mix(mix(pal.dark, pal.light, 0.68), mix(pal.light, pal.accent, 0.45), (h - 0.7) / 0.3));
  const colors = Array.from({ length: BINS }, (_, b) => ramp((b + 0.5) / BINS));
  const bins = Array.from({ length: BINS }, () => []);
  for (let i = 0; i < C.n; i++) bins[Math.min(BINS - 1, Math.floor(C.Hn[i] * BINS))].push(i);
  const cam = T.cloud, sx = new Float32Array(C.n), sy = new Float32Array(C.n), ss = new Float32Array(C.n);
  const view = (time) => ({ a: cam.yaw + time * cam.turn, p: cam.pitch });
  const project = (x, y, z, time) => {
    const { a, p } = view(time), ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(p), sp = Math.sin(p);
    const xr = x * ca - z * sa, zr = x * sa + z * ca, yy = y - 12;
    const yc = yy * cp + zr * sp, zc = zr * cp - yy * sp, k = cam.f / (zc + cam.dist);
    return { x: W / 2 + xr * k, y: cam.cy - yc * k, k };
  };
  const scrim = (ctx) => {
    const g = ctx.createLinearGradient(0, cam.scrim[0], 0, cam.scrim[1]);
    g.addColorStop(0, rgba(pal.dark, 1)); g.addColorStop(1, rgba(pal.dark, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, cam.scrim[1]);
  };
  return {
    pal, project, colors,
    draw(ctx, t, opt = {}) {
      const time = t + clock;
      ctx.fillStyle = pal.dark; ctx.fillRect(0, 0, W, H);
      const { a, p } = view(time), ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(p), sp = Math.sin(p);
      for (let i = 0; i < C.n; i++) {
        const x = C.X[i], z = C.Z[i], y = C.Y[i] - 12, xr = x * ca - z * sa, zr = x * sa + z * ca;
        const yc = y * cp + zr * sp, zc = zr * cp - y * sp, k = cam.f / (zc + cam.dist);
        sx[i] = W / 2 + xr * k; sy[i] = cam.cy - yc * k; ss[i] = clamp(k * 0.32, 1.3, 4.2);
      }
      for (let b = 0; b < BINS; b++) {
        ctx.fillStyle = colors[b];
        for (const i of bins[b]) ctx.fillRect(sx[i], sy[i], ss[i], ss[i]);
      }
      const sweep = ((time / cam.sweep) % 1) * 260 - 130;                 // the survey sweep: a band of returns lit for a moment
      ctx.fillStyle = rgba(pal.light, 0.55);
      for (let i = 0; i < C.n; i++) { const dx = C.X[i] * 0.8 + C.Z[i] * 0.6 - sweep; if (dx > -3 && dx < 3) ctx.fillRect(sx[i] - 0.5, sy[i] - 0.5, ss[i] + 1, ss[i] + 1); }
      if (opt.plane > 0) {                                                 // the classification plane
        const hp = C.lo + (C.hi - C.lo) * opt.plane * 0.4;
        ctx.fillStyle = pal.key;
        for (let i = 0; i < C.n; i++) if (C.Y[i] < hp) ctx.fillRect(sx[i], sy[i], ss[i], ss[i]);
        const R = 106, cs = [[-R, -R], [R, -R], [R, R], [-R, R]].map(([x, z]) => project(x, hp, z, time));
        ctx.beginPath(); cs.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y))); ctx.closePath();
        ctx.fillStyle = rgba(pal.accent, 0.05); ctx.fill(); ctx.strokeStyle = rgba(pal.key, 0.9); ctx.lineWidth = 2; ctx.stroke();
      }
      scrim(ctx);
    },
  };
}
