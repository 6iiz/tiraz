// The terrain-story ground: a relief map of an invented island seen from a low oblique camera, built once in code. Heights are
// stood up (exaggerated) and lit by one low sun from behind on the left, so ridges throw their shading toward the viewer; contour
// lines ring the land and soundings ring the sea, which darkens with depth. The far land dissolves into the sky's haze.
// Every tone is a mix of the brand's light and dark colours: the sky is the light one, so text reads in the dark one above the land.
// The relief is rendered once (a voxel sweep, front to back, column by column) into an image; the camera's slow push over it runs
// on the reel's clock, so it never restarts at a cut. `at(u, v, lift)` projects a map point (plus a height) to the screen for the
// data layer, which is the only thing that glows.
import { rgba, rng, clamp, mix } from '/engine/kit.js';
import { palette } from './motion.js';

const MAP = 384, N = 768, E = 78, SEA = 0.42;                 // map units, grid cells, height scale, sea level (0..1)
const IW = 1300, IH = 1100, OX = -110, OY = 860;               // the rendered relief image and where it sits on the frame
const CAM = { u: MAP / 2, v: 40, h: 190, f: 1000, hy: -346 };
let CACHE = null;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

function field() {
  if (CACHE?.H) return CACHE;
  const r = rng(9031), lat = Array.from({ length: 6 }, (_, o) => { const n = 4 << o; return { n, v: Float32Array.from({ length: (n + 1) * (n + 1) }, () => r()) }; });
  const noise = (x, y) => { let s = 0, a = 0.5, tot = 0; for (const L of lat) { const fx = x * L.n, fy = y * L.n, ix = Math.min(L.n - 1, Math.floor(fx)), iy = Math.min(L.n - 1, Math.floor(fy)), u = fx - ix, w = fy - iy;
    const k = (i, j) => L.v[(iy + j) * (L.n + 1) + ix + i], su = u * u * (3 - 2 * u), sw = w * w * (3 - 2 * w);
    s += a * ((k(0, 0) * (1 - su) + k(1, 0) * su) * (1 - sw) + (k(0, 1) * (1 - su) + k(1, 1) * su) * sw); tot += a; a *= 0.45; } return s / tot; };
  const H = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i / N, y = j / N, dx = (x - 0.5) / 0.3, dy = (y - 0.66) / 0.23, d = Math.sqrt(dx * dx + dy * dy);
    const ridge = 1 - Math.abs(noise(0.05 + x * 0.9, 0.05 + y * 0.9) * 2 - 1);
    const n = noise(x, y), wob = (noise(0.5 + x * 0.5, 0.2 + y * 0.5) - 0.5) * 0.7, m = clamp((1.0 - d + wob) / 0.8);
    H[j * N + i] = clamp(SEA - 0.16 + m * m * (3 - 2 * m) * (0.06 + (n - 0.3) * 0.75 + ridge * 0.16) + (n - 0.5) * 0.12, 0, 1);
  }
  CACHE = { H };
  return CACHE;
}
const lift = (h) => (h < SEA ? SEA * E : SEA * E + (h - SEA) * E * 1.6);   // land stood up (exaggerated), sea flat
const hAt = (H, u, v) => {                                     // bilinear height (0..1) at map point
  const x = clamp(u / MAP * (N - 1), 0, N - 1.001), y = clamp(v / MAP * (N - 1), 0, N - 1.001), i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j;
  return (H[j * N + i] * (1 - a) + H[j * N + i + 1] * a) * (1 - b) + (H[(j + 1) * N + i] * (1 - a) + H[(j + 1) * N + i + 1] * a) * b;
};

function render(pal) {
  const F = field(), id = pal.dark + pal.light;
  if (F.img && F.id === id) return F;
  const H = F.H, D = hex(pal.dark), L = hex(pal.light);
  // tone (0 = light, 1 = dark) of every cell: hillshade, contours, sea depth
  const K = new Float32Array(N * N), sun = [-0.78, 0.12, 0.5], sl = Math.hypot(...sun);
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
    const h = H[j * N + i];
    if (h < SEA) { const dpt = (SEA - h) / SEA; let k = 0.3 + 0.34 * Math.sqrt(dpt); if ((dpt * 9) % 1 < 0.07) k -= 0.07; if (h > SEA - 0.008) k = 0.28; K[j * N + i] = k; continue; }
    const s = E * 1.6 * (N / MAP), nx = -(H[j * N + i + 1] - H[j * N + i - 1]) * s * 0.5, ny = -(H[(j + 1) * N + i] - H[(j - 1) * N + i]) * s * 0.5;
    const nl = Math.hypot(nx, ny, 1), sh = clamp((nx * sun[0] + ny * sun[1] + sun[2]) / (nl * sl));
    let k = 0.03 + (1 - sh) ** 1.3 * 0.9 + (h - SEA) * 0.1;
    if (((h - SEA) / 0.045) % 1 < 0.09) k += 0.07;
    if (h < SEA + 0.006) k = 0.55;                               // the coastline
    K[j * N + i] = clamp(k);
  }
  const kAt = (u, v) => { const x = clamp(u / MAP * (N - 1), 1, N - 2.001), y = clamp(v / MAP * (N - 1), 1, N - 2.001), i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j;
    return (K[j * N + i] * (1 - a) + K[j * N + i + 1] * a) * (1 - b) + (K[(j + 1) * N + i] * (1 - a) + K[(j + 1) * N + i + 1] * a) * b; };
  const cv = document.createElement('canvas'); cv.width = IW; cv.height = IH;
  const c = cv.getContext('2d'), img = c.createImageData(IW, IH), px = img.data;
  for (let x = 0; x < IW; x++) {
    const lat = (x - IW / 2) / CAM.f; let ybuf = IH;
    for (let z = 40; z < 520 && ybuf > 0; z += Math.max(0.25, z * 0.004)) {
      const u = CAM.u + lat * z, v = CAM.v + z;
      if (v < 0 || v > MAP || u < 0 || u > MAP) continue;
      const y = Math.floor(CAM.hy + (CAM.h - lift(hAt(H, u, v))) * CAM.f / z);
      if (y >= ybuf) continue;
      const fog = clamp((z - 160) / 190) ** 1.3, edge = clamp(Math.min(u, MAP - u) / 30) * clamp((MAP - v) / 50), k = kAt(u, v) * (1 - fog) * edge, a = Math.round(255 * edge);
      for (let yy = Math.max(0, y); yy < ybuf; yy++) { const o = (yy * IW + x) * 4; px[o] = L[0] + (D[0] - L[0]) * k; px[o + 1] = L[1] + (D[1] - L[1]) * k; px[o + 2] = L[2] + (D[2] - L[2]) * k; px[o + 3] = a; }
      ybuf = Math.max(0, y);
    }
  }
  c.putImageData(img, 0, 0);
  Object.assign(F, { img: cv, id });
  return F;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens.cam, pal = palette(brand), F = render(pal);
  const view = (time) => ({ s: 1 + time * T.push, dx: -time * T.drift, fx: T.fx, fy: T.fy });
  const toScreen = (ix, iy, time) => { const v = view(time); return { x: v.fx + (ix + OX + v.dx - v.fx) * v.s, y: v.fy + (iy + OY - v.fy) * v.s, s: v.s }; };
  // a map point (u, v in map units) lifted by `lift` height units, on the screen at this time
  const at = (u, v, up = 0, time = 0) => {
    const z = v - CAM.v, h = lift(hAt(F.H, u, v)) + up;
    return toScreen(IW / 2 + (u - CAM.u) * CAM.f / z, CAM.hy + (CAM.h - h) * CAM.f / z, time);
  };
  const land = (u, v) => hAt(F.H, u, v) > SEA + 0.03;
  const sky = mix(pal.light, pal.dark, 0.07);
  // the land point whose foot lands closest to a screen point at this time (a coarse search, done once per scene)
  const pick = (sx, sy, time) => {
    let best = null, bd = Infinity;
    for (let v = 20; v < MAP - 10; v += 6) for (let u = 10; u < MAP - 10; u += 6) {
      if (!land(u, v)) continue; const q = at(u, v, 0, time), dd = (q.x - sx) ** 2 + (q.y - sy) ** 2; if (dd < bd) { bd = dd; best = { u, v }; }
    }
    return best ?? { u: MAP / 2, v: MAP / 2 };
  };
  return {
    pal, at, land, pick, MAP,
    draw(ctx, t) {
      const time = t + clock, v = view(time);
      const g = ctx.createLinearGradient(0, 0, 0, 1000);
      g.addColorStop(0, sky); g.addColorStop(1, pal.light);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(v.fx, v.fy); ctx.scale(v.s, v.s); ctx.translate(-v.fx + v.dx, -v.fy);
      ctx.drawImage(F.img, OX, OY); ctx.restore();
    },
  };
}
