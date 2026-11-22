// The two-tone ground: a small 3D world drawn with two inks only, at a quarter of the frame's resolution (one dot = 4 px) and
// scaled up without smoothing. The camera glides over an endless chequered plain toward the horizon; a big banded planet turns in the
// sky. Every grey is a density of dots from the 8x8 ordered dither, and the dots belong to the surfaces: on the plain the threshold
// is taken in world coordinates (its scale chosen from each row's footprint, so it neither swims nor shimmers), on the planet in its
// own longitude and latitude, so the pattern turns with it. A one-dot paper rim outlines the planet and the horizon.
// The world steps at 15 frames a second. One low-res buffer per frame (about 130 000 dots), no full-size pixel loop.
import { palette, BAYER, DOT, step } from './motion.js';

export const HORIZON = 1176;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16); };

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), w = W / DOT, h = H / DOT, hy = HORIZON / DOT, f = 210, camH = 2.4, cx = w / 2;
  const INK = hex(P.ink), PAPER = hex(P.paper);
  const low = document.createElement('canvas'); low.width = w; low.height = h;
  const lg = low.getContext('2d', { willReadFrequently: true }), img = lg.createImageData(w, h), buf = new Uint32Array(img.data.buffer);
  const rtl = brand.dir !== 'ltr';
  const sp = { x: rtl ? w * 0.28 : w * 0.72, y: 104, r: 64 };          // the planet, in dots
  const L = [-0.55 * (rtl ? -1 : 1), -0.5, 0.67];                        // light from the upper side
  // per-row data for the plain: depth and the threshold cell sizes for that row's footprint
  const rows = [];
  for (let y = hy + 1; y < h; y++) {
    const dy = (y - hy + 0.5) / f, z = camH / dy, fx = z / f, fz = z * z / (f * camH);
    const oct = (v) => 0.06 * 2 ** Math.max(0, Math.ceil(Math.log2(v / 0.06)));
    rows[y] = { z, cxs: oct(fx), czs: oct(fz), fog: Math.min(1, z / 30) ** 0.8 };
  }
  // stars, fixed in the sky
  const stars = []; { let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 70; i++) stars.push([Math.floor(r() * w), Math.floor(r() * (hy - 8)), r()]); }
  let last = null;
  const render = (time) => {
    const camZ = time * 2.6, camX = Math.sin(time * 0.21) * 3, rot = time * 0.22;
    for (let y = 0; y < h; y++) {
      const o = y * w, by = (y & 7) * 8;
      if (y < hy) {
        const tone = 0.03 + 0.2 * (y / hy) ** 4;
        for (let x = 0; x < w; x++) {
          const nx = (x - sp.x) / sp.r, ny = (y - sp.y) / sp.r, d2 = nx * nx + ny * ny;
          if (d2 < 1) {
            const nz = Math.sqrt(1 - d2), lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
            if (nz < 0.16 && lam > 0.02) { buf[o + x] = PAPER; continue; }
            const lat = Math.asin(ny), lon = Math.atan2(nx, nz) + rot;
            let v = 0.04 + 0.95 * lam ** 1.2 + 0.14 * Math.sin(lat * 9 + Math.sin(lon * 2) * 1.5);
            const ti = (Math.floor(((lat + 1.571) / 3.1416) * 170) & 7) * 8 + (Math.floor((lon / 6.2832) * 340 + 4096) & 7);
            buf[o + x] = v * 64 > BAYER[ti] + 0.5 ? PAPER : INK;
          } else if (d2 < 1.06) buf[o + x] = INK;                       // a ring of ink keeps the rim clean
          else buf[o + x] = tone * 64 > BAYER[by + (x & 7)] + 0.5 ? PAPER : INK;
        }
      } else if (y === hy) { for (let x = 0; x < w; x++) buf[o + x] = PAPER; }
      else {
        const R = rows[y];
        for (let x = 0; x < w; x++) {
          const X = ((x - cx) / f) * R.z + camX, Z = R.z + camZ;
          const tile = ((Math.floor(X / 3) + Math.floor(Z / 3)) & 1);
          const edge = (Math.abs(X / 3 - Math.round(X / 3)) * 3 < R.cxs * 0.6) || (Math.abs(Z / 3 - Math.round(Z / 3)) * 3 < R.czs * 0.6 && R.z < 30);
          let v = tile ? 0.5 : 0.1; if (edge && R.z < 18) v = 0.95;
          v = v * (1 - R.fog) + 0.22 * R.fog;
          const ti = (Math.floor(Z / R.czs) & 7) * 8 + (Math.floor(X / R.cxs) & 7);
          buf[o + x] = v * 64 > BAYER[ti] + 0.5 ? PAPER : INK;
        }
      }
    }
    for (const [x, y, k] of stars) { const nx = (x - sp.x) / sp.r, ny = (y - sp.y) / sp.r; if (nx * nx + ny * ny < 1.1) continue;
      if ((Math.floor(time * 15 + k * 40) % 23) !== 0) buf[y * w + x] = PAPER; }
    lg.putImageData(img, 0, 0);
  };
  return {
    P, ink: P.ink, paper: P.paper,
    draw(ctx, t) {
      const time = step(t + clock);
      if (last !== time) { render(time); last = time; }
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(low, 0, 0, W, H); ctx.restore();
    },
  };
}
