// The tiny-world ground: a town seen from high above through a tilted lens, so it reads as a tabletop model. Blocks of rooftops with
// their south walls, windows and cast shadows, streets with lane marks and zebra crossings, parks with round trees. Cars and people
// run along the streets in the time-lapse stutter; soft cloud shadows glide over everything; the camera drifts slowly on the reel's
// clock. Only one horizontal band is sharp (the band the part asks for, where its rooftop with the words sits); above and below it
// the town melts into blur. The town is drawn once per page; each frame lays the moving things on it, blurs a small copy, and masks the
// sharp copy into the band.
import { rng, clamp } from '/engine/kit.js';
import { palette, lapse } from './motion.js';

let cityCache = null;
function buildCity(CW, CH, pal, seed) {
  const key = `${CW}x${CH}:${pal.light}:${pal.dark}:${pal.accent}`;
  if (cityCache?.key === key) return cityCache;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const g = cv.getContext('2d'), r = rng(seed);
  const RW = 54, SW = 14;
  g.fillStyle = pal.walk; g.fillRect(0, 0, CW, CH);
  const hs = [], vs = [];
  for (let y = 90; y < CH; y += 300 + r() * 90) hs.push(y);
  for (let x = 70; x < CW; x += 250 + r() * 90) vs.push(x);
  // the streets, with crossings at every corner
  g.fillStyle = pal.asphalt;
  for (const y of hs) g.fillRect(0, y, CW, RW);
  for (const x of vs) g.fillRect(x, 0, RW, CH);
  g.fillStyle = pal.mark;
  for (const y of hs) for (let x = 0; x < CW; x += 44) g.fillRect(x, y + RW / 2 - 1.5, 22, 3);
  for (const x of vs) for (let y = 0; y < CH; y += 44) g.fillRect(x + RW / 2 - 1.5, y, 3, 22);
  for (const y of hs) for (const x of vs) {
    g.fillStyle = pal.asphalt; g.fillRect(x - 4, y - 4, RW + 8, RW + 8);
    g.fillStyle = pal.mark;
    for (let k = 0; k < 6; k++) { g.fillRect(x + 4 + k * 8.5, y - 26, 5, 20); g.fillRect(x + 4 + k * 8.5, y + RW + 6, 5, 20); g.fillRect(x - 26, y + 4 + k * 8.5, 20, 5); g.fillRect(x + RW + 6, y + 4 + k * 8.5, 20, 5); }
  }
  // the blocks between the streets
  const lots = [], trees = [];
  const xs = [-200, ...vs, CW + 100], ys = [-200, ...hs, CH + 100];
  for (let i = 0; i < ys.length - 1; i++) for (let j = 0; j < xs.length - 1; j++) {
    const bx0 = xs[j] + RW + SW, bx1 = xs[j + 1] - SW, by0 = ys[i] + RW + SW, by1 = ys[i + 1] - SW;
    if (bx1 - bx0 < 60 || by1 - by0 < 60) continue;
    if (r() < 0.16) {                                          // a park: grass, a path, trees
      g.fillStyle = pal.grass; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      g.fillStyle = pal.walk; g.fillRect(bx0, (by0 + by1) / 2 - 6, bx1 - bx0, 12); g.fillRect((bx0 + bx1) / 2 - 6, by0, 12, by1 - by0);
      for (let k = 0; k < 14; k++) trees.push([bx0 + 20 + r() * (bx1 - bx0 - 40), by0 + 20 + r() * (by1 - by0 - 40), 13 + r() * 10]);
      continue;
    }
    const rows = Math.max(1, Math.round((by1 - by0) / 115)), rh = (by1 - by0 - (rows - 1) * 8) / rows;
    for (let q = 0; q < rows; q++) {
      let x = bx0;
      while (x < bx1 - 40) {
        const w = Math.min(bx1 - x, 44 + r() * 80); if (bx1 - x - w < 40) { lots.push([x, by0 + q * (rh + 8), bx1 - x, rh]); break; }
        lots.push([x, by0 + q * (rh + 8), w, rh]); x += w + 6;
      }
    }
    for (let k = 0; k < 3; k++) if (r() < 0.5) trees.push([bx0 + r() * (bx1 - bx0), ys[i + 1] - SW / 2 - 2, 10 + r() * 5]);
  }
  // shadows first, then buildings from the far (top) row to the near one, so a taller roof in front covers what is behind it
  const B = lots.map(([x, y, w, d]) => ({ x, y, w, d, h: 10 + r() ** 1.8 * 70, roof: pal.roofs[Math.floor(r() * pal.roofs.length)], ac: r(), gardens: r() < 0.12 }));
  g.fillStyle = pal.shadow;
  for (const b of B) g.fillRect(b.x + 6, b.y - b.h * 0.5 + 8, b.w + b.h * 0.45, b.d + b.h * 0.5 - 4);
  B.sort((a, b) => a.y + a.d - (b.y + b.d));
  for (const b of B) {
    const top = b.y - b.h * 0.5;
    g.fillStyle = pal.wall; g.fillRect(b.x, top + b.d, b.w, b.h * 0.5);
    g.fillStyle = pal.walk;                                      // windows: rows of light dots on the south wall
    for (let wy = top + b.d + 8; wy < b.y + b.d - 6; wy += 12) for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 11) g.fillRect(wx, wy, 5, 6);
    g.fillStyle = b.roof; g.fillRect(b.x, top, b.w, b.d);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.strokeRect(b.x + 1.5, top + 1.5, b.w - 3, b.d - 3);
    if (b.gardens) { g.fillStyle = pal.grass; g.fillRect(b.x + 10, top + 10, b.w - 20, b.d - 20); }
    else if (b.ac < 0.6) {                                       // roof clutter: a box or two with a little shadow
      const n = b.ac < 0.3 ? 2 : 1;
      for (let k = 0; k < n; k++) { const ax = b.x + 10 + r() * Math.max(1, b.w - 40), ay = top + 10 + r() * Math.max(1, b.d - 40);
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(ax + 4, ay + 4, 20, 16); g.fillStyle = pal.rim; g.fillRect(ax, ay, 20, 16); }
    }
  }
  for (const [x, y, s] of trees) {
    g.fillStyle = pal.shadow; g.beginPath(); g.arc(x + s * 0.5, y + s * 0.35, s, 0, 7); g.fill();
    g.fillStyle = pal.tree; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    g.fillStyle = pal.treeLit; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.3, s * 0.55, 0, 7); g.fill();
  }
  // the moving things: cars on every street (both ways), people on the pavements
  const cars = [], people = [];
  for (const y of hs) for (let k = 0; k < 9; k++) { const dir = k % 2 ? 1 : -1; cars.push({ h: true, a: y + RW / 2 + dir * 13, p: r() * CW, v: dir * (70 + r() * 60), c: pal.cars[Math.floor(r() * pal.cars.length)], L: CW }); }
  for (const x of vs) for (let k = 0; k < 7; k++) { const dir = k % 2 ? 1 : -1; cars.push({ h: false, a: x + RW / 2 - dir * 13, p: r() * CH, v: dir * (70 + r() * 60), c: pal.cars[Math.floor(r() * pal.cars.length)], L: CH }); }
  for (const y of hs) for (let k = 0; k < 14; k++) { const side = r() < 0.5 ? -SW / 2 : RW + SW / 2; people.push({ h: true, a: y + side, p: r() * CW, v: (r() < 0.5 ? -1 : 1) * (14 + r() * 14), L: CW, c: pal.cars[Math.floor(r() * pal.cars.length)] }); }
  cityCache = { key, cv, cars, people };
  return cityCache;
}

let cloudCache = null;
function clouds(pal) {
  if (cloudCache) return cloudCache;
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1600; const g = cv.getContext('2d'), r = rng(77);
  g.filter = 'blur(40px)'; g.fillStyle = 'rgba(0,0,0,0.16)';
  for (let k = 0; k < 5; k++) { const x = 200 + r() * 1200, y = 200 + r() * 1200; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * 260, y + (r() - 0.5) * 140, 120 + r() * 120, 80 + r() * 70, 0, 0, 7); g.fill(); } }
  cloudCache = cv; return cv;
}

const canvases = {};
const spare = (name, w, h) => { let c = canvases[name]; if (!c) { c = canvases[name] = document.createElement('canvas'); c.width = w; c.height = h; } return c; };

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T);
  const CW = W + 520, CH = H + 520, city = buildCity(CW, CH, pal, 3307), cl = clouds(pal);
  const world = spare('world', W, H), wg = world.getContext('2d');
  const SM = T.lens.down, small = spare('small', Math.ceil(W / SM), Math.ceil(H / SM)), sg = small.getContext('2d');
  const mid = spare('mid', Math.ceil(W / 2), Math.ceil(H / 2)), mg = mid.getContext('2d');
  const tmp = spare('tmp', W, H), tg = tmp.getContext('2d');
  const masks = new Map();
  const mask = (y, h, feather) => {                       // a soft-edged horizontal band, kept per position
    const k = `${Math.round(y)}:${Math.round(h)}:${feather}`; if (masks.has(k)) return masks.get(k);
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = H; const g = cv.getContext('2d');
    const a = clamp((y - h / 2 - feather) / H), b = clamp((y - h / 2) / H), c = clamp((y + h / 2) / H), d = clamp((y + h / 2 + feather) / H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(a, 'rgba(0,0,0,0)'); gr.addColorStop(b, 'rgba(0,0,0,1)'); gr.addColorStop(c, 'rgba(0,0,0,1)'); gr.addColorStop(d, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, H); masks.set(k, cv); return cv;
  };
  const vignette = (() => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.32)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); return cv; })();
  const wrap = (v, L) => ((v % L) + L) % L;
  return {
    pal,
    // band: { y, h } the sharp strip (centre and height). pan: extra camera offset in px (a part may glide the camera).
    draw(ctx, t, band = { y: 760, h: 500 }, pan = 0) {
      const time = t + clock, tl = lapse(time);
      const px = 120 + time * T.lens.drift, py = 260 - time * T.lens.drift * 0.6 + pan;
      wg.drawImage(city.cv, -px, -py);
      for (const c of city.cars) {                         // cars: a body, a dark windscreen, a contact shadow; in time-lapse steps
        const s = wrap(c.p + c.v * tl, c.L), x = (c.h ? s : c.a) - px, y = (c.h ? c.a : s) - py;
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
        const lw = c.h ? 34 : 18, lh = c.h ? 18 : 34;
        wg.fillStyle = 'rgba(0,0,0,0.3)'; wg.fillRect(x - lw / 2 + 3, y - lh / 2 + 3, lw, lh);
        wg.fillStyle = c.c; wg.fillRect(x - lw / 2, y - lh / 2, lw, lh);
        wg.fillStyle = pal.asphalt; if (c.h) wg.fillRect(x + (c.v > 0 ? 4 : -10), y - lh / 2 + 3, 6, lh - 6); else wg.fillRect(x - lw / 2 + 3, y + (c.v > 0 ? 4 : -10), lw - 6, 6);
      }
      for (const p of city.people) {
        const s = wrap(p.p + p.v * tl, p.L), x = s - px, y = p.a - py;
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        wg.fillStyle = 'rgba(0,0,0,0.3)'; wg.fillRect(x + 1, y + 1, 6, 6); wg.fillStyle = p.c; wg.fillRect(x - 2, y - 2, 6, 6);
      }
      const cx = wrap(time * 34, 1600), cy = wrap(time * 20, 1600);   // cloud shadows glide (light is not in time-lapse steps)
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) wg.drawImage(cl, cx + i * 1600 - 300, cy + j * 1600 - 300);
      // the lens: everything blurred, a softer copy in a wide band, the sharp copy in the narrow band
      sg.filter = `blur(${T.lens.blur}px)`; sg.drawImage(world, 0, 0, small.width, small.height); sg.filter = 'none';
      ctx.drawImage(small, 0, 0, W, H);
      mg.drawImage(world, 0, 0, mid.width, mid.height);
      tg.globalCompositeOperation = 'copy'; tg.drawImage(mid, 0, 0, W, H); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask(band.y, band.h + 160, 240), 0, 0, W, H);
      ctx.drawImage(tmp, 0, 0);
      tg.globalCompositeOperation = 'copy'; tg.drawImage(world, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask(band.y, band.h, 150), 0, 0, W, H);
      tg.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, 0, 0);
      ctx.drawImage(vignette, 0, 0);
    },
  };
}
