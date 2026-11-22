// Ground of copper-traces: a circuit board viewed from directly overhead. The coating takes the brand's dark colour, shifted by its
// accent, a fine glass-weave texture, copper pour along the top and bottom with buses of traces cut into it, a big chip below the
// safe area, traces running up both side margins, stitching vias, fiducials and a few silkscreen designators. The middle of the board,
// where words sit, is bare mask with only faint traces on the far layer. All of that is etched once into a picture; at every frame
// only current moves: pulses run the buses on their own clock, and a soft key light drifts over the board.
import { rgba, rng, mix } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = M.palette(brand, T);
  const R = (pts) => M.route(pts);
  // buses of traces: [centre line, count, pitch]
  const buses = [
    [[[150, -30], [150, 110], [234, 194], [560, 194]], 5, 22],
    [[[W + 30, 78], [830, 78], [744, 164], [646, 164]], 4, 22],
    [[[430, 1560], [312, 1560], [240, 1632], [240, 1760], [-30, 1760]], 5, 24],
    [[[540, 1480], [540, 1450], [610, 1380], [W + 30, 1380]], 4, 24],
    [[[650, 1610], [800, 1610], [880, 1690], [880, H + 30]], 5, 24],
    [[[28, 290], [28, 1300]], 2, 22],
    [[[W - 28, 330], [W - 28, 1280]], 2, 22],
  ].map(([pts, n, pitch]) => M.bus(pts, n, pitch).map(R));
  const routes = buses.flat();
  // far-layer traces behind the middle: thin and faint
  const far = [
    [[-20, 640], [180, 640], [300, 760], [780, 760], [900, 880], [W + 20, 880]],
    [[-20, 1040], [260, 1040], [380, 1160], [W + 20, 1160]],
    [[W + 20, 470], [700, 470], [600, 370], [-20, 370]],
  ].map(R);
  const qfp = { x: 430, y: 1490, s: 220 };

  const etched = document.createElement('canvas'); etched.width = W; etched.height = H;
  const c = etched.getContext('2d'), r = rng(4417);
  c.fillStyle = P.mask; c.fillRect(0, 0, W, H);
  // glass weave: a small basket pattern, very faint
  const tile = document.createElement('canvas'); tile.width = tile.height = 16; const tg = tile.getContext('2d');
  tg.fillStyle = rgba(P.light, 0.022); tg.fillRect(0, 2, 8, 3); tg.fillRect(8, 10, 8, 3); tg.fillRect(10, 0, 3, 8); tg.fillRect(2, 8, 3, 8);
  c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, W, H);
  // mottling of the mask
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, s = 80 + r() * 220, g = c.createRadialGradient(x, y, 0, x, y, s);
    g.addColorStop(0, rgba(r() < 0.5 ? P.light : P.dark, 0.025)); g.addColorStop(1, rgba(P.dark, 0)); c.fillStyle = g; c.fillRect(x - s, y - s, 2 * s, 2 * s);
  }
  // far layer
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const f of far) { M.sub(c, f, 0, f.total); c.strokeStyle = mix(P.mask, P.rim, 0.45); c.lineWidth = 5; c.stroke(); }
  // copper pour, top band and bottom band
  c.fillStyle = P.pour; c.fillRect(0, 0, W, 236); c.fillRect(0, 1296, W, H - 1296);
  c.fillStyle = P.rim; c.fillRect(0, 236, W, 3); c.fillRect(0, 1293, W, 3);
  // stitching vias in the pour, kept clear of traces
  const near = (x, y, d) => routes.some((rt) => rt.pts.some((p, i) => {
    if (!i) return false; const a = rt.pts[i - 1], dx = p[0] - a[0], dy = p[1] - a[1], l2 = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)); return Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy) < d;
  }));
  const vias = [];
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) {
    if (!(y < 220 || y > 1320)) continue;
    if (x > qfp.x - 60 && x < qfp.x + qfp.s + 60 && y > qfp.y - 60 && y < qfp.y + qfp.s + 60) continue;
    if (near(x, y, 30)) continue;
    if (r() < 0.55) vias.push([x, y]);
  }
  for (const [x, y] of vias) { c.fillStyle = P.mask; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); M.via(c, x, y, 5, P); }
  // traces
  for (const rt of routes) M.trace(c, rt, P, 9);
  // ends of the buses that stop on the board: a via each
  for (const rt of routes) for (const e of [rt.pts[0], rt.pts.at(-1)]) if (e[0] > 0 && e[0] < W && e[1] > 0 && e[1] < H) {
    c.fillStyle = P.mask; c.beginPath(); c.arc(e[0], e[1], 15, 0, Math.PI * 2); c.fill(); M.via(c, e[0], e[1], 9, P);
  }
  // the big chip below the safe area, with pins on four sides
  c.fillStyle = P.mask; c.fillRect(qfp.x - 40, qfp.y - 40, qfp.s + 80, qfp.s + 80);
  for (let k = 0; k < 8; k++) {
    const o = 22 + k * 25;
    M.pad(c, qfp.x - 30, qfp.y + o - 6, 24, 12, 3, P); M.pad(c, qfp.x + qfp.s + 6, qfp.y + o - 6, 24, 12, 3, P);
    M.pad(c, qfp.x + o - 6, qfp.y - 30, 12, 24, 3, P); M.pad(c, qfp.x + o - 6, qfp.y + qfp.s + 6, 12, 24, 3, P);
  }
  M.chip(c, qfp.x, qfp.y, qfp.x + qfp.s, qfp.y + qfp.s, P, brand.dir !== 'ltr');
  // two-pad parts (resistors, capacitors) in the top band, with outlines
  for (const [x, y] of [[360, 60], [470, 60], [930, 190], [W - 140, 1460], [120, 1420]]) {
    c.fillStyle = P.mask; c.fillRect(x - 40, y - 22, 80, 44);
    M.pad(c, x - 34, y - 14, 22, 28, 4, P); M.pad(c, x + 12, y - 14, 22, 28, 4, P);
    c.strokeStyle = rgba(P.silk, 0.6); c.lineWidth = 2; c.strokeRect(x - 42, y - 22, 84, 44);
  }
  // fiducials and mounting holes
  for (const [x, y] of [[W - 60, 200], [60, 1880], [W - 60, 1880]]) {
    c.fillStyle = P.mask; c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); c.fill(); c.fillStyle = P.gold; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill();
  }
  for (const [x, y] of [[54, 54]]) {
    c.fillStyle = P.mask; c.beginPath(); c.arc(x, y, 36, 0, Math.PI * 2); c.fill(); M.via(c, x, y, 26, P);
  }
  // a few designators in silkscreen
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  c.fillStyle = rgba(P.silk, 0.62); c.font = `600 20px "${mono}"`; c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (const [s, x, y] of [['R' + 3, 330, 104], ['C' + 7, 444, 104], ['U' + 1, qfp.x, qfp.y + qfp.s + 62], ['J' + 2, W - 120, 1500]]) c.fillText(s, x, y);
  // vignette
  const v = c.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)'); c.fillStyle = v; c.fillRect(0, 0, W, H);

  // pulses: each runs one trace of a bus on its own period, so the board is never still
  const runs = routes.map((rt, i) => ({ rt, speed: 520 + (i % 5) * 60, phase: (i * 337) % 1000, gap: 700 + (i % 3) * 300 }));
  return {
    P, routes,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(etched, 0, 0);
      for (const u of runs) {
        const cyc = u.rt.total + u.gap, head = (time * u.speed + u.phase) % cyc;
        if (head - 140 < u.rt.total) M.glow(ctx, u.rt, P, head - 140, head, 9, 0.85);
      }
      // the key light: a soft warm wash drifting slowly over the upper part of the board
      const lx = W * (0.25 + 0.08 * Math.sin(time * 0.21)), ly = H * (0.18 + 0.04 * Math.cos(time * 0.17));
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, H * 0.6);
      g.addColorStop(0, rgba(P.light, 0.05)); g.addColorStop(1, rgba(P.light, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  };
}
