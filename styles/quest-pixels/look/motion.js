// Quest Pixels motion and drawing kit. The world lives on a grid of 6 px "pixels" (180 x 320 on a 1080 x 1920 frame) and moves in
// whole steps: windows open in four steps, words appear whole on the beat like a game typing its message, cursors jump, the camera
// scrolls one pixel at a time. Only the brand's three colours exist; every other tone is a fixed mix of them (an indexed palette).
import { mix, contrast, clamp } from '/engine/kit.js';

export const PX = 6;                                         // one game pixel in frame pixels
export const snap = (v) => Math.round(v / PX) * PX;
// a progress that moves in n hard steps (a game updates in frames, not curves)
export const stepped = (p, n = 4) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.ceil(clamp(p) * n) / n);
export const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// The palette: which brand colour is dark and which is light is measured, so any brand reads.
export function palette(brand) {
  const { bg, text, accent: a } = brand.colors, L = (c) => contrast(c, '#000000');
  const [d, l] = L(bg) < L(text) ? [bg, text] : [text, bg];
  const onA = contrast(a, d) >= contrast(a, l) ? d : l;
  return {
    d, l, a, onA,
    grass: mix(l, a, 0.2), grassD: mix(l, a, 0.32), path: mix(l, d, 0.05), pathD: mix(l, d, 0.16), edge: mix(mix(l, a, 0.2), d, 0.3),
    water: mix(a, l, 0.42), waterD: mix(a, d, 0.12), waterL: l,
    tree: mix(a, d, 0.28), treeD: mix(a, d, 0.58), treeL: mix(a, l, 0.22), trunk: mix(d, l, 0.3),
    rock: mix(l, d, 0.36), rockL: mix(l, d, 0.16), shadow: mix(mix(l, a, 0.2), d, 0.22),
    win: mix(d, a, 0.14), winHi: mix(mix(d, a, 0.14), l, 0.1), lead: mix(l, a, 0.38), grey: mix(l, d, 0.42),
  };
}

// ---- sprites: rows of characters, each character a palette key ('.' is empty) ----
export function sprite(ctx, rows, x, y, map, s = 1, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, r) => {
    for (let c = 0; c < w; c++) {
      const k = row[c]; if (k === '.' || !map[k]) continue;
      ctx.fillStyle = map[k]; ctx.fillRect(x + (flip ? w - 1 - c : c) * s, y + r * s, s, s);
    }
  });
}

// The hero, seen from behind as it walks up the path: four walk frames.
const HB = ['....oooo....', '...ohhhho...', '..ohhhhhho..', '..ohhhhhho..', '..ohhhhhho..', '...oohhoo...',
  '..oCccccCo..', '.oCccccccCo.', '.oCccccccCo.', '.oCcccCccCo.', '.oCccccccCo.', '..oCCCCCCo..'];
export const HERO = [
  [...HB, '...ob..bo...', '...ob..bo...', '...oo..oo...', '............'],
  [...HB, '...ob..bo...', '...oo..bo...', '.......oo...', '............'],
  [...HB, '...ob..bo...', '...ob..bo...', '...oo..oo...', '............'],
  [...HB, '...ob..bo...', '...ob..oo...', '...oo.......', '............'],
];
export const heroMap = (P) => ({ o: P.d, h: mix(P.d, P.l, 0.28), c: P.a, C: mix(P.a, P.d, 0.35), b: mix(P.d, P.l, 0.15) });

export const CHEST = {
  shut: ['..oooooooooooo..', '.occcccccccccco.', 'occcccccccccccco', 'oCCCCCCCCCCCCCCo', 'oooooooYYooooooo', 'obbbbbbYYbbbbbbo',
    'obbbbbbbbbbbbbbo', 'obbbbbbbbbbbbbbo', 'oBBBBBBBBBBBBBBo', 'oooooooooooooooo'],
  open: ['.oooooooooooooo.', '.oCCCCCCCCCCCCo.', '.occcccccccccco.', 'oooooooooooooooo', 'oYLLYLLLLYLLYLLo', 'obbbbbbYYbbbbbbo',
    'obbbbbbbbbbbbbbo', 'obbbbbbbbbbbbbbo', 'oBBBBBBBBBBBBBBo', 'oooooooooooooooo'],
};
export const chestMap = (P) => ({ o: P.d, c: P.a, C: mix(P.a, P.d, 0.3), b: mix(P.a, P.d, 0.5), B: mix(P.a, P.d, 0.7), Y: P.l, L: mix(P.l, P.a, 0.25) });
// The menu cursor: a pointing hand, drawn facing the text (flip for right-to-left).
export const HAND = ['....ooo...', '...oLLLo..', 'oooooLLLLo', 'oLLLLLLLLo', 'ooooLLLLLo', '...oLLLLLo', '...oLLLLo.', '....oooo..'];   // points left
export const ARROW_DOWN = ['ooooooo', '.ooooo.', '..ooo..', '...o...'];
export const ARROW_UP = ['...o...', '..ooo..', '.ooooo.', 'ooooooo', '..ooo..', '..ooo..'];
export const STAR = [['..o..', '..o..', 'oo.oo', '..o..', '..o..'], ['.....', '..o..', '.o.o.', '..o..', '.....']];

// ---- the game window: a dark panel with a double pixel border and notched corners, opening in four steps ----
// x, y, w, h in frame pixels (snapped); open 0..1 (already stepped). Returns the visible rectangle.
export function win(ctx, x, y, w, h, P, open = 1) {
  x = snap(x); y = snap(y); w = snap(w); h = snap(h);
  if (open <= 0) return null;
  const u = PX, hv = Math.max(4 * u, snap(h * open)), yv = snap(y + (h - hv) / 2);
  const notched = (x0, y0, w0, h0, c, k = u) => { ctx.fillStyle = c; ctx.fillRect(x0 + k, y0, w0 - 2 * k, h0); ctx.fillRect(x0, y0 + k, w0, h0 - 2 * k); };
  ctx.save();
  ctx.globalAlpha = 0.28; notched(x + u, yv + u, w, hv, P.d); ctx.globalAlpha = 1;      // a hard drop shadow, one pixel down and across
  notched(x, yv, w, hv, P.d);
  notched(x + u, yv + u, w - 2 * u, hv - 2 * u, P.l);
  notched(x + 2 * u, yv + 2 * u, w - 4 * u, hv - 4 * u, P.d, 0);
  ctx.fillStyle = P.win; ctx.fillRect(x + 3 * u, yv + 3 * u, w - 6 * u, hv - 6 * u);
  ctx.fillStyle = P.winHi; ctx.fillRect(x + 3 * u, yv + 3 * u, w - 6 * u, u);           // a lit top row, like a bevel
  ctx.restore();
  return { x, y: yv, w, h: hv };
}
// A flat block with notched corners (the key-word backing).
export function block(ctx, x0, y0, x1, y1, c) {
  x0 = snap(x0); y0 = snap(y0); x1 = snap(x1); y1 = snap(y1); const u = PX;
  ctx.fillStyle = c; ctx.fillRect(x0 + u, y0, x1 - x0 - 2 * u, y1 - y0); ctx.fillRect(x0, y0 + u, x1 - x0, y1 - y0 - 2 * u);
}

// ---- the pixel digits: our own 5 x 7 cut, Western and Arabic-Indic ----
const G = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '٠': ['.....', '.....', '..#..', '.#.#.', '..#..', '.....', '.....'], '١': ['.#...', '.##..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  '٢': ['#..#.', '.###.', '...#.', '...#.', '...#.', '...#.', '...#.'], '٣': ['#.#.#', '.#.##', '....#', '....#', '....#', '....#', '....#'],
  '٤': ['..###', '.#...', '..##.', '.#...', '#....', '.####', '.....'], '٥': ['.....', '..#..', '.#.#.', '#...#', '#...#', '.###.', '.....'],
  '٦': ['####.', '...#.', '...#.', '...#.', '...#.', '...#.', '...#.'], '٧': ['#...#', '#...#', '.#.#.', '.#.#.', '..#..', '..#..', '.....'],
  '٨': ['.....', '..#..', '..#..', '.#.#.', '.#.#.', '#...#', '#...#'], '٩': ['.##..', '#..#.', '#..#.', '.###.', '...#.', '...#.', '...#.'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'], '٬': ['..', '..', '..', '..', '..', '.#', '#.'], '.': ['.', '.', '.', '.', '.', '.', '#'],
  '٫': ['..', '..', '..', '..', '..', '.#', '#.'], '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '-': ['.....', '.....', '.....', '####.', '.....', '.....', '.....'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'], '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
};
export const canPix = (s) => [...s].every((ch) => G[ch]);
export const pixUnits = (s) => [...s].reduce((w, ch, i) => w + G[ch][0].length + (i ? 1 : 0), 0);
// Draws s with its top-left at (x, y), each dot b px square; a shadow dot one dot down and across when shadow is given.
export function pixText(ctx, s, x, y, b, color, shadow) {
  const pass = (ox, oy, c) => {
    ctx.fillStyle = c; let cx = x + ox;
    for (const ch of s) { const g = G[ch]; g.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect(cx + i * b, y + oy + r * b, b, b); }); cx += (g[0].length + 1) * b; }
  };
  if (shadow) { const o = Math.max(PX, Math.round(b * 0.2)); pass(o, o, shadow); }
  pass(0, 0, color);
}

// The brand's logo turned into a grid of n x n game pixels (built once): true where the logo is.
export function logoGrid(brand, n) {
  const c = document.createElement('canvas'); c.width = c.height = n * 4;
  const g = c.getContext('2d', { willReadFrequently: true }); brand.logo.draw(g, 0, 0, n * 4, '#000000');
  const data = g.getImageData(0, 0, n * 4, n * 4).data, cells = [];
  for (let y = 0; y < n; y++) { const row = []; for (let x = 0; x < n; x++) {
    let s = 0; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) s += data[((y * 4 + j) * n * 4 + x * 4 + i) * 4 + 3];
    row.push(s / 16 > 110); } cells.push(row); }
  return cells;
}
