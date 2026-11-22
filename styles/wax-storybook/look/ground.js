// The storybook ground: one page of a picture book in the brand's lighter colour, with the paper's tooth pressed into it, a warm
// darkening at the edges, and a crayon border drawn by hand round the page. A crayon sun sits in the top corner on the far side and,
// below the safe area, two hills, a little house and a lollipop tree are coloured in. Three drawings of the whole page are made once
// (per brand) and shown in turn, eight a second, so every line boils softly while a page holds.
import { rng, rgba } from '/engine/kit.js';
import { palette, masks, wax, stroke, loop, colour, shapeOf, ellipse, boilAt } from './motion.js';

const cache = new Map();
function build(W, H, pal, rtl) {
  const key = W + pal.paper + pal.ink + pal.accent + rtl; if (cache.has(key)) return cache.get(key);
  const M = masks(W, H), r = rng(808);
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const g = base.getContext('2d');
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  const tile = document.createElement('canvas'); tile.width = tile.height = 160; const tg = tile.getContext('2d');
  for (let i = 0; i < 1400; i++) { tg.fillStyle = rgba(r() < 0.55 ? pal.ink : '#ffffff', 0.025 + r() * 0.03); tg.fillRect(r() * 160, r() * 160, 1 + r() * 1.6, 1 + r() * 1.6); }
  g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const y = r() * H; g.fillStyle = rgba(pal.ink, 0.012); g.fillRect(0, y, W, 1 + r() * 2); }
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.78);
  v.addColorStop(0, rgba(pal.ink, 0)); v.addColorStop(1, rgba(pal.ink, 0.09)); g.fillStyle = v; g.fillRect(0, 0, W, H);

  const far = rtl ? 0 : 1, sx = far ? W - 165 : 165, sy = 150;           // the sun sits on the far side of the reading direction
  const hills = (k) => {
    const back = [[-40, 1560]], front = [[-40, 1640]];
    for (let x = -40; x <= W + 40; x += 30) back.push([x, 1500 - Math.sin((x + 120) / 260) * 70 - Math.sin(x / 90 + k) * 3]);
    for (let x = -40; x <= W + 40; x += 30) front.push([x, 1610 - Math.sin((x - 380) / 300) * 90 - Math.sin(x / 70 + k) * 3]);
    back.push([W + 40, H + 20], [-40, H + 20]); front.push([W + 40, H + 20], [-40, H + 20]);
    return { back, front };
  };
  const frames = [0, 1, 2].map((k) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.drawImage(base, 0, 0);
    const s = (n) => n * 97 + k * 13;
    // the sun: coloured in, a loop round it, short rays
    wax(c, M.mid, [sx - 150, sy - 150, 300, 300], (q) => {
      colour(q, ellipse(sx, sy, 62, 62), [sx - 70, sy - 70, 140, 140], pal.accent, 1, s(1), -0.7, 12);
      stroke(q, loop(sx, sy, 64, 62, s(2)), 6, pal.deep, s(3));
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.2; stroke(q, [[sx + Math.cos(a) * 84, sy + Math.sin(a) * 84], [sx + Math.cos(a) * 118, sy + Math.sin(a) * 118]], 6, pal.deep, s(4 + i)); }
    });
    // a cloud on the reading side
    const cx = far ? 230 : W - 230, cy = 170;
    wax(c, M.mid, [cx - 170, cy - 90, 340, 180], (q) => {
      const cl = [[-90, 10, 55], [-30, -20, 62], [40, -8, 58], [95, 18, 44], [10, 28, 60]];
      const sh = new Path2D(); cl.forEach(([dx, dy, rr]) => sh.addPath(ellipse(cx + dx, cy + dy, rr, rr * 0.8)));
      colour(q, sh, [cx - 160, cy - 80, 320, 160], pal.shade, 1, s(20), 0.3, 11);
    });
    wax(c, M.mid, [cx - 170, cy - 90, 340, 180], (q) => {
      stroke(q, loop(cx - 30, cy + 2, 150, 70, s(21), 1.05, 46).map(([x, y], i) => [x, y + Math.sin(i * 1.1) * 9]), 4, pal.grey, s(22));
    });
    // the hills, the house, the tree
    const { back, front } = hills(k);
    wax(c, M.mid, [0, 1380, W, H - 1380], (q) => {
      colour(q, shapeOf(back), [0, 1400, W, H - 1400], pal.hill2, 1, s(30), -0.35, 15);
      stroke(q, back.slice(0, -2), 6, pal.soft, s(31));
    });
    const hx = far ? W - 300 : 300, hy = 1535;
    wax(c, M.heavy, [0, 1480, W, H - 1480], (q) => {
      colour(q, shapeOf(front), [0, 1500, W, H - 1500], pal.hill, 1, s(40), 0.4, 14);
      stroke(q, front.slice(0, -2), 7, pal.ink, s(41));
    });
    wax(c, M.heavy, [hx - 140, hy - 170, 280, 260], (q) => {
      const wall = shapeOf([[hx - 80, hy - 60], [hx + 80, hy - 60], [hx + 80, hy + 60], [hx - 80, hy + 60]]);
      const roof = shapeOf([[hx - 100, hy - 58], [hx, hy - 150], [hx + 100, hy - 58]]);
      colour(q, wall, [hx - 90, hy - 70, 180, 140], pal.paper, 1, s(50), 0.2, 11);
      colour(q, roof, [hx - 110, hy - 160, 220, 110], pal.accent, 1, s(51), -0.6, 11);
      stroke(q, [[hx - 80, hy - 60], [hx + 80, hy - 60], [hx + 80, hy + 62], [hx - 80, hy + 62], [hx - 80, hy - 64]], 6, pal.ink, s(52));
      stroke(q, [[hx - 108, hy - 56], [hx, hy - 152], [hx + 108, hy - 56]], 6, pal.ink, s(53));
      stroke(q, [[hx - 22, hy + 62], [hx - 22, hy + 8], [hx + 18, hy + 8], [hx + 18, hy + 62]], 5, pal.ink, s(54));
      stroke(q, loop(hx + 48, hy - 20, 15, 15, s(55)), 4, pal.ink, s(56));
    });
    const tx = far ? 180 : W - 180, ty = 1610;
    wax(c, M.heavy, [tx - 110, ty - 260, 220, 330], (q) => {
      colour(q, ellipse(tx, ty - 160, 78, 80), [tx - 90, ty - 250, 180, 180], pal.hill, 1, s(60), 0.9, 12);
      stroke(q, [[tx - 4, ty + 40], [tx, ty - 90]], 12, pal.ink, s(61));
      stroke(q, loop(tx, ty - 160, 80, 82, s(62)), 6, pal.ink, s(63));
    });
    // the page's border, drawn round by hand
    wax(c, M.mid, [0, 0, W, H], (q) => {
      const m = 34, pts = [[m, m + 6], [W - m, m], [W - m + 3, H - m], [m - 2, H - m + 2], [m, m - 8]];
      const dense = []; for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < 12; j++) { const a = pts[i], b = pts[i + 1], u = j / 12; dense.push([a[0] + (b[0] - a[0]) * u + Math.sin(j + k) * 1.5, a[1] + (b[1] - a[1]) * u + Math.cos(j * 1.3 + k) * 1.5]); }
      dense.push(pts.at(-1)); stroke(q, dense, 7, pal.ink, s(70), 1, 2.2);
    });
    return cv;
  });
  const out = { frames }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), rtl = brand.dir !== 'ltr', L = build(W, H, pal, rtl), fps = look.tokens.boil ?? 8;
  return {
    pal, paper: pal.paper, ink: pal.ink,
    boil: (t) => boilAt(t + clock, fps),
    draw(ctx, t) { ctx.drawImage(L.frames[boilAt(t + clock, fps) % 3], 0, 0); },
  };
}
