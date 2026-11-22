// The iso-town ground: one little town square, full bleed, drawn in true isometric with flat paper colours. The paving runs off every
// edge as a faint lattice; behind the square (top of the frame) the backs of houses and trees, in front of it (below the safe area)
// rows of houses with lit windows, gardens and trees. People seen from behind walk across the front of the square at a walking pace,
// and smoke curls from a chimney or two. The town is drawn once per page; each frame adds the walkers and the smoke.
// The text lives on the open square, where only the faint paving is.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, project, house, tree, person } from './motion.js';

let cache = null;
function build(W, H, pal, T) {
  const key = `${W}x${H}:${pal.light}:${pal.dark}:${pal.accent}`;
  if (cache?.key === key) return cache;
  const u = T.iso.u, ox = W / 2, oy = -400, r = rng(4517);
  const back = document.createElement('canvas'); back.width = W; back.height = H; const b = back.getContext('2d');
  const front = document.createElement('canvas'); front.width = W; front.height = H; const f = front.getContext('2d');
  b.fillStyle = pal.paper; b.fillRect(0, 0, W, H);
  // the paving: a lattice on the two iso axes, and a lighter path where people walk
  b.strokeStyle = pal.tile; b.lineWidth = 2;
  const step = 2.5 * u, k = Math.tan(Math.PI / 6);
  for (let c = -H * 2; c < W * 2 + H; c += step / Math.cos(Math.PI / 6)) {
    b.beginPath(); b.moveTo(c, 0); b.lineTo(c - H / k, H); b.stroke();
    b.beginPath(); b.moveTo(c - W, 0); b.lineTo(c - W + H / k, H); b.stroke();
  }
  const things = (g, sMin, sMax, rows, seedTrees) => {
    const list = [];
    for (let row = 0; row < rows; row++) {
      const s = sMin + row * ((sMax - sMin) / Math.max(1, rows - 1)), off = row % 2 ? 5.5 : 0;
      for (let dd = -44 + off; dd <= 44; dd += 11) {
        const i = (s + dd) / 2, j = (s - dd) / 2;
        if (r() < seedTrees) list.push({ kind: 'tree', i: i + 2, j: j + 2, s: 0.85 + r() * 0.5 });
        else list.push({ kind: 'house', i, j, w: 3.5 + Math.floor(r() * 3), d: 3 + Math.floor(r() * 2), h: 2.2 + r() * 1.6, rh: 1.3 + r() * 0.8, wall: Math.floor(r() * pal.walls.length), roof: Math.floor(r() * pal.roofs.length), lit: r() < 0.5, chim: r() < 0.3 });
        if (r() < 0.6) list.push({ kind: 'tree', i: i + 5.6, j: j + 0.5, s: 0.6 + r() * 0.35 });
      }
    }
    list.sort((a, c) => (a.i + a.j + (a.w ?? 0) + (a.d ?? 0)) - (c.i + c.j + (c.w ?? 0) + (c.d ?? 0)));
    const smoke = [];
    for (const o of list) {
      if (o.kind === 'tree') { const [x, y] = project(ox, oy, u)(o.i, o.j); tree(g, x, y, o.s, pal); continue; }
      const P = project(ox, oy, u), Q = (x, y, z) => P(o.i + x, o.j + y, z);
      house(g, Q, o.w, o.d, o.h, o.rh, pal.walls[o.wall], pal.roofs[o.roof], { glass: pal.glass, lit: o.lit ? pal.lit : null, doorAt: 1 });
      if (o.chim) { const cx = o.w * 0.7;
        const [x, y] = Q(cx, o.d * 0.4, o.h + o.rh * 0.8); g.fillStyle = pal.roofs[o.roof].right; g.fillRect(x - 7, y - 26, 14, 26); g.fillStyle = pal.roofs[o.roof].top; g.fillRect(x - 9, y - 30, 18, 6); smoke.push([x, y - 32]); }
    }
    return smoke;
  };
  const smokeBack = things(b, 6, 30, 3, 0.25);
  const smokeFront = things(f, 104, 136, 4, 0.18);
  cache = { key, back, front, smoke: [...smokeBack, ...smokeFront.map(([x, y]) => [x, y, 1])] };
  return cache;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), town = build(W, H, pal, T), puff = mix(pal.light, pal.dark, 0.12);
  const r = rng(91), walkers = [];
  for (let k = 0; k < 9; k++) walkers.push({ lane: 1300 + (k % 3) * 26, x: r() * (W + 160), v: (r() < 0.5 ? -1 : 1) * (26 + r() * 20), coat: pal.coats[k % pal.coats.length], ph: r() * 6 });
  walkers.sort((a, b) => a.lane - b.lane);
  return {
    pal,
    // people: false hides the walkers (a part that draws its own people near the front of the square)
    draw(ctx, t, o = {}) {
      const time = t + clock;
      ctx.drawImage(town.back, 0, 0);
      for (const [x, y, front] of town.smoke) {                 // three puffs rising from each chimney, each on its own loop
        if (front) continue;
        for (let k = 0; k < 3; k++) { const q = (((time * 0.35 + k / 3 + x * 0.001) % 1) + 1) % 1; ctx.fillStyle = rgba(puff, 0.55 * (1 - q)); ctx.beginPath(); ctx.arc(x + Math.sin(q * 5 + k) * 8 + q * 20, y - q * 90, 7 + q * 14, 0, 7); ctx.fill(); }
      }
      if (o.people !== false) for (const w of walkers) {
        const span = W + 160, x = ((w.x + w.v * time) % span + span) % span - 80;
        person(ctx, x, w.lane, 1, w.coat, pal, time * 7 + w.ph);
      }
      ctx.drawImage(town.front, 0, 0);
      for (const [x, y, front] of town.smoke) {
        if (!front) continue;
        for (let k = 0; k < 3; k++) { const q = (((time * 0.35 + k / 3 + x * 0.001) % 1) + 1) % 1; ctx.fillStyle = rgba(puff, 0.55 * (1 - q)); ctx.beginPath(); ctx.arc(x + Math.sin(q * 5 + k) * 8 + q * 20, y - q * 90, 7 + q * 14, 0, 7); ctx.fill(); }
      }
    },
  };
}
