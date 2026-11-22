// Depth Pixels motion and drawing kit. Two speeds live together: the pixel things (the people, the lanterns, the block numbers) change
// by whole drawings, while the camera, the light, the dust and the focus glide on every frame. Plates are dark glass with a thin metal
// rule and small corner diamonds; words rise into them softly. Colour is the brand's three, and fixed mixes of them.
import { mix, contrast, rgba, clamp } from '/engine/kit.js';

export const PX = 4;                                          // one texel of the model in frame pixels
export const out3 = (p) => 1 - (1 - clamp(p)) ** 3;
export const in2 = (p) => clamp(p) ** 2;
export const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

export function palette(brand) {
  const { bg, text, accent: a } = brand.colors, L = (c) => contrast(c, '#000000');
  const [d, l] = L(bg) < L(text) ? [bg, text] : [text, bg];
  const onA = contrast(a, d) >= contrast(a, l) ? d : l;
  return {
    d, l, a, onA,
    floor: mix(d, l, 0.1), floorD: mix(d, l, 0.04), floorL: mix(d, l, 0.14), path: mix(d, l, 0.2), pathL: mix(d, l, 0.24),
    wall: mix(d, l, 0.2), wallD: mix(d, l, 0.12), roof: mix(d, a, 0.34), roofD: mix(d, a, 0.2), roofL: mix(mix(d, a, 0.34), l, 0.15),
    leaf: mix(d, a, 0.26), leafD: mix(d, a, 0.12), leafL: mix(mix(d, a, 0.26), l, 0.14), trunk: mix(d, l, 0.16),
    light: mix(a, l, 0.38), pane: mix(a, l, 0.5), metal: mix(a, l, 0.5), grey: mix(l, d, 0.48), glass: rgba(d, 0.84),
  };
}

export function sprite(ctx, rows, x, y, map, s = PX, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, r) => { for (let c = 0; c < w; c++) { const k = row[c]; if (k === '.' || !map[k]) continue;
    ctx.fillStyle = map[k]; ctx.fillRect(x + (flip ? w - 1 - c : c) * s, y + r * s, s, s); } });
}

// The traveller, from the front, in a cloak of the brand's accent: two idle drawings (breathing).
const TOP = ['...oooo...', '..ohhhho..', '.ohhhhhho.', '.ohsssho..', '.ohsesso..', '..ossso...'];
export const TRAVELLER = [
  [...TOP, '.occccco..', 'occcCccco.', 'occcCccco.', 'occcCccco.', 'oCccCccCo.', '.occCcco..', '.occcccco.', '..ob.bo...', '..ob.bo...', '..oo.oo...'],
  [...TOP, '.occccco..', 'occcCccco.', 'occcCccco.', 'occcCccco.', 'oCccCccCo.', 'oCccCccCo.', '.occcccco.', '..ob.bo...', '..oo.oo...', '..........'],
];
export const travellerMap = (P) => ({ o: mix(P.d, P.l, 0.04), h: mix(P.d, P.l, 0.3), s: mix(P.l, P.a, 0.15), e: P.d, c: P.a, C: mix(P.a, P.d, 0.4), b: mix(P.d, P.l, 0.22) });
export const LANTERN = ['..ooo..', '.o...o.', 'ooooooo', 'oLLLLLo', 'oLLWLLo', 'oLWWWLo', 'oLLWLLo', 'oLLLLLo', 'ooooooo', '.ooooo.'];

// A soft round light, built once: draw it with 'lighter' over the scene to make bloom.
export function glow(color, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  r.addColorStop(0, rgba(color, 0.85)); r.addColorStop(0.18, rgba(color, 0.4)); r.addColorStop(0.5, rgba(color, 0.1)); r.addColorStop(1, rgba(color, 0));
  g.fillStyle = r; g.fillRect(0, 0, size, size); return c;
}
export function bloom(ctx, img, x, y, r, a = 1) {
  if (a <= 0 || r <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a); ctx.drawImage(img, x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
// A flame never holds still: a few summed sines, from a seed.
export const flicker = (t, k) => 0.82 + 0.1 * Math.sin(t * 7.3 + k * 1.7) + 0.06 * Math.sin(t * 13.1 + k * 3.1) + 0.04 * Math.sin(t * 23.7 + k);

// The dialogue plate: dark glass, a soft drop shadow, a metal rule with an inner hairline and a small diamond at each corner.
export function plate(ctx, x, y, w, h, P, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.shadowColor = rgba('#000000', 0.55); ctx.shadowBlur = 46; ctx.shadowOffsetY = 14;
  ctx.fillStyle = P.glass; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = P.metal; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.stroke();
  ctx.strokeStyle = rgba(P.metal, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x + 9, y + 9, w - 18, h - 18, 4); ctx.stroke();
  ctx.fillStyle = P.metal;
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    ctx.beginPath(); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 11, cy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// A word rises softly into place (glides, unlike the sprites). Use inside kit.drawText's `each`.
export function rise(c, p, size) {
  if (p <= 0) return false;
  c.globalAlpha *= out3(p); c.translate(0, (1 - out3(p)) * size * 0.22);
}
// The key word sits in a lit pill of the accent, with its own halo.
export function keyPill(c, box, size, P, a = 1) {
  c.save(); c.globalAlpha *= a; c.shadowColor = rgba(P.a, 0.8); c.shadowBlur = size * 0.5;
  c.fillStyle = P.a; c.beginPath(); c.roundRect(box.x - size * 0.16, box.y - size * 0.6, box.width + size * 0.32, size * 1.2, size * 0.2); c.fill(); c.restore();
}

// ---- digits as blocks: our own 5 x 7 cut; each dot becomes a small lit cube ----
const G = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'], '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['#..#.', '#..#.', '#..#.', '#####', '...#.', '...#.', '...#.'], '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], '7': ['#####', '....#', '...#.', '..#..', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '٠': ['.....', '.....', '..#..', '.###.', '..#..', '.....', '.....'], '١': ['.#...', '.##..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  '٢': ['#..#.', '.###.', '...#.', '...#.', '...#.', '...#.', '...#.'], '٣': ['#.#.#', '.#.##', '....#', '....#', '....#', '....#', '....#'],
  '٤': ['..###', '.#...', '..##.', '.#...', '#....', '.####', '.....'], '٥': ['.....', '..#..', '.#.#.', '#...#', '#...#', '.###.', '.....'],
  '٦': ['####.', '...#.', '...#.', '...#.', '...#.', '...#.', '...#.'], '٧': ['#...#', '#...#', '.#.#.', '.#.#.', '..#..', '..#..', '.....'],
  '٨': ['.....', '..#..', '..#..', '.#.#.', '.#.#.', '#...#', '#...#'], '٩': ['.##..', '#..#.', '#..#.', '.###.', '...#.', '...#.', '...#.'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'], '٬': ['..', '..', '..', '..', '..', '.#', '#.'], '.': ['.', '.', '.', '.', '.', '.', '#'],
  '٫': ['..', '..', '..', '..', '..', '.#', '#.'], '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '-': ['.....', '.....', '.....', '####.', '.....', '.....', '.....'], ' ': ['..', '..', '..', '..', '..', '..', '..'],
};
export const canBlock = (s) => [...s].every((ch) => G[ch]);
export const blockUnits = (s) => [...s].reduce((w, ch, i) => w + G[ch][0].length + (i ? 1 : 0), 0);
// The cells of a string as a boolean grid (7 rows).
export function cellsOf(s) {
  const rows = Array.from({ length: 7 }, () => []);
  [...s].forEach((ch, i) => { const g = G[ch]; rows.forEach((row, r) => { if (i) row.push(false); for (const k of g[r]) row.push(k === '#'); }); });
  return rows;
}
// Draws a grid of cells as lit cubes seen from a little above and to the left: front faces, a top where nothing sits above, a side
// where nothing sits beside. lift(r, c) may return a vertical offset per cube (for drops); return null to skip a cube.
export function cubes(ctx, cells, x, y, s, P, lift = () => 0) {
  const k = s * 0.32, n = cells.length, m = cells[0].length, on = (r, c) => r >= 0 && c >= 0 && r < n && c < m && cells[r][c];
  const F = mix(P.l, P.a, 0.12), Tp = P.l, Sd = mix(P.a, P.d, 0.35), E = mix(mix(P.l, P.a, 0.12), mix(P.a, P.d, 0.35), 0.4);
  for (let r = n - 1; r >= 0; r--) for (let c = 0; c < m; c++) {
    if (!cells[r][c]) continue; const dy = lift(r, c); if (dy === null) continue;
    const X = x + c * s, Y = y + r * s + dy;
    if (!on(r, c + 1)) { ctx.fillStyle = Sd; ctx.beginPath(); ctx.moveTo(X + s, Y); ctx.lineTo(X + s + k, Y - k); ctx.lineTo(X + s + k, Y + s - k); ctx.lineTo(X + s, Y + s); ctx.fill(); }
    if (!on(r - 1, c)) { ctx.fillStyle = Tp; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + s, Y); ctx.lineTo(X + s + k, Y - k); ctx.lineTo(X + k, Y - k); ctx.fill(); }
    ctx.fillStyle = F; ctx.fillRect(X, Y, s, s); if (s >= 18 || !on(r + 1, c)) { ctx.fillStyle = E; ctx.fillRect(X, Y + s - Math.max(1.5, s * 0.07), s, Math.max(1.5, s * 0.07)); }
  }
}
// The brand's logo sampled onto an n x n grid (built once).
export function logoGrid(brand, n) {
  const c = document.createElement('canvas'); c.width = c.height = n * 4;
  const g = c.getContext('2d', { willReadFrequently: true }); brand.logo.draw(g, 0, 0, n * 4, '#000000');
  const data = g.getImageData(0, 0, n * 4, n * 4).data, cells = [];
  for (let y = 0; y < n; y++) { const row = []; for (let x = 0; x < n; x++) {
    let s = 0; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) s += data[((y * 4 + j) * n * 4 + x * 4 + i) * 4 + 3];
    row.push(s / 16 > 110); } cells.push(row); }
  return cells;
}
