// The Quest Pixels ground: an overworld seen from above, drawn on a 180 x 320 game screen and scaled up six times with hard edges.
// A path winds up through dithered grass, past a pond whose highlights cycle, trees with a dark pixel outline, rocks and flowers.
// The hero walks up the path for the whole reel: the map scrolls one game pixel at a time on `clock`, so every scene picks up the
// walk where the last one left it. The map is built once per scene as an indexed buffer (palette indices), then painted.
import { rng } from '/engine/kit.js';
import { palette, PX, BAYER, sprite, HERO, heroMap } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), LW = Math.round(W / PX), LH = Math.round(H / PX), MW = LW, MH = LH + 240;
  const T = look.tokens.world ?? {}, speed = T.speed ?? 7;
  const pal = [P.grass, P.grassD, P.path, P.pathD, P.edge, P.water, P.waterD, P.waterL, P.tree, P.treeD, P.treeL, P.trunk, P.rock, P.rockL, P.d, P.l, P.a, P.shadow];
  const [GR, GD, PA, PD, ED, WA, WD, WL, TR, TD, TL, TK, RK, RL, INK, LI, AC, SH] = pal.map((_, i) => i);
  const idx = new Uint8Array(MW * MH), r = rng(4501);
  const set = (x, y, i) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < MW && y < MH) idx[y * MW + x] = i; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < MW && y < MH ? idx[(y | 0) * MW + (x | 0)] : -1);
  const pc = (y) => MW / 2 + 24 * Math.sin(y * 0.016) + 9 * Math.sin(y * 0.047 + 1.3), half = 12;
  // grass: dithered darker patches and small blades
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const n = 0.5 + 0.28 * Math.sin(x * 0.07 + y * 0.031) + 0.22 * Math.sin(y * 0.052 - x * 0.023 + 2);
    if (n * 16 > BAYER[y & 3][x & 3] + 10) idx[y * MW + x] = GD;
  }
  for (let k = 0; k < 700; k++) { const x = r() * MW, y = r() * MH; set(x, y, GD); set(x + 1, y - 1, GD); set(x + 2, y, GD); }
  // the path, with a dithered worn edge and a dark rim
  for (let y = 0; y < MH; y++) { const c = pc(y);
    for (let x = Math.floor(c - half - 2); x <= c + half + 2; x++) { const dx = Math.abs(x - c);
      if (dx <= half - 2) set(x, y, PA);
      else if (dx <= half) set(x, y, (dx - half + 2) * 8 > BAYER[y & 3][x & 3] ? PD : PA);
      else if (dx <= half + 1) set(x, y, ED); } }
  for (let k = 0; k < 160; k++) { const y = r() * MH, x = pc(y) + (r() - 0.5) * (half * 1.6); set(x, y, PD); }
  // a pond on the side away from the path
  const py = MH * 0.46, pcx = pc(py) > MW / 2 ? 38 : MW - 38, rx = 25, ry = 13, water = [];
  for (let y = Math.floor(py - ry - 2); y <= py + ry + 2; y++) for (let x = pcx - rx - 2; x <= pcx + rx + 2; x++) {
    const e = ((x - pcx) / rx) ** 2 + ((y - py) / ry) ** 2;
    if (e < 0.72) { set(x, y, WA); water.push([x, y]); } else if (e < 1) set(x, y, WD); else if (e < 1.18) set(x, y, ED);
  }
  // trees: a shaded round crown with a pixel outline (dark toward the lower side), a trunk and a shadow
  const trees = [];
  for (let k = 0; k < 400 && trees.length < 34; k++) {
    const y = 8 + r() * (MH - 12), x = 6 + r() * (MW - 12);
    if (Math.abs(x - pc(y)) < half + 10) continue;
    if (((x - pcx) / rx) ** 2 + ((y - py) / ry) ** 2 < 2.2) continue;
    if (trees.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 13)) continue;
    trees.push([Math.round(x), Math.round(y)]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of trees) {
    for (let j = -1; j <= 1; j++) for (let i = -6; i <= 7; i++) if ((i / 7) ** 2 + j * j / 2.5 < 1) set(x + i + 1, y + 3 + j, SH);
    set(x - 1, y, TK); set(x, y, TK); set(x - 1, y + 1, TK); set(x, y + 1, TK); set(x - 1, y + 2, INK); set(x, y + 2, INK);
    const R = 6.5, cy = y - 6;
    for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) {
      const dd = Math.hypot(i + 0.5, j + 0.5); if (dd > R) continue;
      if (dd > R - 1) { set(x + i, cy + j, i + j > -2 ? INK : TD); continue; }
      const v = 0.5 - (i + j) / (R * 2.6);
      const b = BAYER[(cy + j) & 3][(x + i) & 3] / 16;
      set(x + i, cy + j, v > 0.72 + b * 0.2 ? TL : v < 0.32 + b * 0.2 ? TD : TR);
    }
  }
  // rocks and flowers
  for (let k = 0; k < 26; k++) {
    const y = r() * MH, x = r() * MW; if (Math.abs(x - pc(y)) < half + 3 || get(x, y) === WA || get(x, y) === TR) continue;
    if (k % 2) { set(x, y, RL); set(x + 1, y, RL); set(x - 1, y + 1, RK); set(x, y + 1, RK); set(x + 1, y + 1, RK); set(x + 2, y + 1, RK); set(x, y + 2, INK); set(x + 1, y + 2, INK); }
    else { set(x, y, AC); set(x - 1, y, LI); set(x + 1, y, LI); set(x, y - 1, LI); set(x, y + 1, LI); }
  }
  const rgb = pal.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const map = document.createElement('canvas'); map.width = MW; map.height = MH;
  const mg = map.getContext('2d'), img = mg.createImageData(MW, MH);
  for (let i = 0; i < idx.length; i++) { const c = rgb[idx[i]]; img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
  mg.putImageData(img, 0, 0);
  // the pond's highlights cycle through three frames (palette cycling, four times a second)
  const shimmer = [0, 1, 2].map((f) => {
    const c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d'); g.fillStyle = P.waterL;
    for (const [x, y] of water) { const hsh = ((x * 73856093) ^ (y * 19349663)) >>> 0; if ((hsh + f * 7) % 23 === 0) g.fillRect(x, y, 3, 1); }
    return c;
  });
  const screen = document.createElement('canvas'); screen.width = LW; screen.height = LH;
  const sc = screen.getContext('2d'), hm = heroMap(P);
  return {
    P, LW, LH,
    // the top row of the map on screen, in game pixels, at a moment of the reel
    draw(ctx, t) {
      const time = Math.max(0, t + clock), s = Math.min(MH - LH, Math.floor(time * speed)), y0 = MH - LH - s;
      sc.drawImage(map, 0, -y0); sc.drawImage(shimmer[Math.floor(time * 4) % 3], 0, -y0);
      const f = Math.floor(time * 8) % 4, hy = 254, hx = Math.round(pc(y0 + hy + 14)) - 6;
      sc.fillStyle = P.shadow; sc.fillRect(hx + 2, hy + 15, 8, 2); sc.fillRect(hx + 3, hy + 17, 6, 1);
      sprite(sc, HERO[f], hx, hy + (f % 2 ? -1 : 0), hm);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(screen, 0, 0, W, H); ctx.restore();
    },
  };
}
