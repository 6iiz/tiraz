// The orbit-intel ground: a satellite view of an invented place, built once in code and graded to an analyst's grey (every tone is a
// mix of the brand's dark and light colours). A river meanders through a patchwork of fields; a gridded town with shadowed blocks sits
// at the centre; long roads cross it. A second plate is the same ground later, with a new district built at the edge of town.
// The camera looks straight down and descends through the whole reel on the reel's clock (one continuous zoom, never restarting at a
// cut). draw(ctx, t, { wipe, wipeX }) — wipe 0..1 shows the later plate on the reading side of a divider at screen x `wipeX`.
import { rgba, rng, clamp } from '/engine/kit.js';
import { palette } from './motion.js';

const S = 2400;
let CACHE = null;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

function build(pal) {
  const id = pal.dark + pal.light;
  if (CACHE && CACHE.id === id) return CACHE;
  const D = hex(pal.dark), Lc = hex(pal.light), g = (v, a = 1) => `rgba(${D.map((d, i) => Math.round(d + (Lc[i] - d) * v)).join(',')},${a})`;
  const r = rng(2207);
  // value noise, 3 octaves, on a small grid that is scaled up: the soil and vegetation tone
  const N = 300, lat = Array.from({ length: 4 }, (_, o) => { const n = 8 << o; return { n, v: Float32Array.from({ length: (n + 1) * (n + 1) }, () => r()) }; });
  const noise = (x, y) => { let s = 0, a = 0.55, tot = 0; for (const L of lat) { const fx = x * L.n, fy = y * L.n, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, w = fy - iy, k = (i, j) => L.v[Math.min(L.n, iy + j) * (L.n + 1) + Math.min(L.n, ix + i)];
    const sm = (q) => q * q * (3 - 2 * q), su = sm(u), sw = sm(w);
    s += a * ((k(0, 0) * (1 - su) + k(1, 0) * su) * (1 - sw) + (k(0, 1) * (1 - su) + k(1, 1) * su) * sw); tot += a; a *= 0.5; } return s / tot; };
  const small = document.createElement('canvas'); small.width = small.height = N;
  const sc = small.getContext('2d'), img = sc.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = 0.1 + 0.2 * noise(x / N, y / N), k = (y * N + x) * 4;
    for (let c = 0; c < 3; c++) img.data[k + c] = D[c] + (Lc[c] - D[c]) * v; img.data[k + 3] = 255;
  }
  sc.putImageData(img, 0, 0);
  const plate = document.createElement('canvas'); plate.width = plate.height = S;
  const c = plate.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(small, 0, 0, S, S);
  const town = { x: 1180, y: 1250, r: 470 };
  // field patchwork outside the town, in two tilted zones
  for (let i = 0; i < 420; i++) {
    const x = r() * S, y = r() * S; if (Math.hypot(x - town.x, y - town.y) < town.r + 60) continue;
    const a = (x + y > S ? 0.32 : -0.18) + (r() - 0.5) * 0.06, w = 90 + r() * 200, h = 60 + r() * 150;
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = g(0.08 + r() * 0.3, 0.55); c.fillRect(-w / 2, -h / 2, w, h);
    if (r() < 0.5) { c.fillStyle = g(0.05, 0.25); for (let k = -w / 2; k < w / 2; k += 7) c.fillRect(k, -h / 2, 1.5, h); }
    c.restore();
  }
  // the river: banks, then water
  const river = []; for (let k = 0; k <= 120; k++) { const u = k / 120; river.push([u * S * 1.1 - 120, 260 + u * 1900 + Math.sin(u * 11) * 150 + Math.sin(u * 27) * 40]); }
  const stroke = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  stroke(river, 120, g(0.24, 0.8)); stroke(river, 78, g(0.035)); stroke(river, 30, g(0.06));
  // roads
  const roads = [[[-50, 1500], [900, 1320], [1500, 1180], [2450, 820]], [[1100, -50], [1160, 900], [1240, 1700], [1320, 2450]], [[200, 2450], [800, 1700], [1180, 1250]]];
  for (const rd of roads) { stroke(rd, 18, g(0.18)); stroke(rd, 10, g(0.55, 0.9)); }
  // the town: a tilted street grid, blocks of shadowed roofs
  const blocks = [];
  c.save(); c.translate(town.x, town.y); c.rotate(0.21);
  for (let bx = -town.r; bx < town.r; bx += 74) for (let by = -town.r; by < town.r; by += 74) {
    if (Math.hypot(bx + 37, by + 37) > town.r - r() * 120) continue;
    c.fillStyle = g(0.33, 0.9); c.fillRect(bx, by, 74, 74);                       // streets
    c.fillStyle = g(0.16 + r() * 0.08); c.fillRect(bx + 6, by + 6, 62, 62);
    const n = 3 + Math.floor(r() * 7);
    for (let k = 0; k < n; k++) {
      const w = 10 + r() * 22, h = 10 + r() * 22, x = bx + 8 + r() * (58 - w), y = by + 8 + r() * (58 - h);
      c.fillStyle = g(0.02, 0.7); c.fillRect(x + 5, y + 6, w, h);
      c.fillStyle = g(0.38 + r() * 0.3); c.fillRect(x, y, w, h);
    }
    if (r() < 0.08) { c.fillStyle = g(0.13); c.fillRect(bx + 6, by + 6, 62, 62); for (let k = 0; k < 30; k++) { c.fillStyle = g(0.04, 0.8); c.beginPath(); c.arc(bx + 10 + r() * 54, by + 10 + r() * 54, 3 + r() * 3, 0, 6.283); c.fill(); } }
  }
  c.restore();
  // tree lines along the river
  for (let k = 0; k < 900; k++) { const p = river[Math.floor(r() * river.length)]; c.fillStyle = g(0.03 + r() * 0.06, 0.8); c.beginPath(); c.arc(p[0] + (r() - 0.5) * 170, p[1] + (r() - 0.5) * 170, 2 + r() * 4, 0, 6.283); c.fill(); }
  // grain
  for (let k = 0; k < 90000; k++) { c.fillStyle = g(r() * 0.5, 0.18); c.fillRect(r() * S, r() * S, 1.5, 1.5); }
  // the later plate: a new district on open ground below the town
  const later = document.createElement('canvas'); later.width = later.height = S; const l = later.getContext('2d'); l.drawImage(plate, 0, 0);
  const site = { x: 1010, y: 1810 }, sheds = [];
  l.save(); l.translate(site.x, site.y); l.rotate(-0.18);
  l.fillStyle = g(0.16, 0.8); l.fillRect(-160, -150, 320, 300);
  l.fillStyle = g(0.5); l.fillRect(-160, -6, 320, 12); l.fillRect(-6, -150, 12, 300);
  for (let i = 0; i < 16; i++) { const x = -150 + (i % 4) * 76 + (i % 4 > 1 ? 14 : 0), y = -140 + Math.floor(i / 4) * 70 + (i > 7 ? 14 : 0), w = 56, h = 44 + r() * 8;
    l.fillStyle = g(0.02, 0.75); l.fillRect(x + 7, y + 8, w, h); l.fillStyle = g(0.7); l.fillRect(x, y, w, h); l.fillStyle = g(0.55); l.fillRect(x, y + h / 2 - 1, w, 2); sheds.push([x, y, w, h]); }
  l.restore();
  CACHE = { id, plate, later, site: { ...site, a: -0.18, sheds }, town, river };
  return CACHE;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens.cam, pal = palette(brand), C = build(pal), rtl = brand.dir !== 'ltr';
  const view = (time) => {
    const h = T.h0 * Math.pow(0.5, time / T.half), w = h * W / H;
    const cx = clamp(T.cx + Math.sin(time * 0.07) * 40, w / 2, S - w / 2), cy = clamp(T.cy + time * 6, h / 2, S - h / 2);
    return { x: cx - w / 2, y: cy - h / 2, w, h, k: W / w };
  };
  const toScreen = (px, py, time) => { const v = view(time); return { x: (px - v.x) * v.k, y: (py - v.y) * v.k, k: v.k }; };
  const fromScreen = (sx, sy, time) => { const v = view(time); return { x: v.x + sx / v.k, y: v.y + sy / v.k }; };
  return {
    pal, C, view, toScreen, fromScreen,
    draw(ctx, t, opt = {}) {
      const time = t + clock, v = view(time);
      ctx.fillStyle = pal.dark; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(C.plate, v.x, v.y, v.w, v.h, 0, 0, W, H);
      if (opt.wipe > 0) {                                               // the later plate, uncovered from the reading side
        const x = opt.wipeX, a = rtl ? x : 0, b = rtl ? W : x;
        if (b > a) { const k = v.w / W; ctx.drawImage(C.later, v.x + a * k, v.y, (b - a) * k, v.h, a, 0, b - a, H); }
      }
      // the analyst's grade: the upper frame sinks toward the dark so annotations read
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, rgba(pal.dark, 0.62)); gr.addColorStop(0.55, rgba(pal.dark, 0.3)); gr.addColorStop(1, rgba(pal.dark, 0.45));
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    },
  };
}
