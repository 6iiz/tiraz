// The Quest Pixels ending, a save point: the brand's logo is rebuilt as pixel art (its shape sampled onto a grid, given a dark pixel
// outline and a lit edge) and appears row by row inside a square window, where it floats with a two-frame bob while stars twinkle.
// Then the message window opens with the name, the handle in the mono face and the slogan, word by word. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, u = M.PX;
  const N = T.logo.cells, cs = T.logo.cell, grid = M.logoGrid(brand, N);
  const at = (x, y) => (y >= 0 && x >= 0 && y < N && x < N ? grid[y][x] : false);
  // the logo, pixel by pixel: fill, lit upper edge, dark outline around it
  const art = document.createElement('canvas'); art.width = art.height = (N + 2) * cs; const g = art.getContext('2d');
  for (let y = -1; y <= N; y++) for (let x = -1; x <= N; x++) {
    let c = null;
    if (at(x, y)) c = !at(x, y - 1) || !at(x - 1, y) ? M.palette(brand).lead : P.a;
    else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) c = P.d;
    if (c) { g.fillStyle = c; g.fillRect((x + 1) * cs, (y + 1) * cs, cs, cs); }
  }
  const box = M.snap((N + 2) * cs + 12 * u), bx = M.snap(W / 2 - box / 2), by = M.snap(SAFE.top + 30);
  const wx = 72, ww = 936, pad = 8 * u, inner = ww - 2 * pad;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: inner, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: 44, maxW: inner, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW: inner, minPx: 44, where: 'the slogan' }) : null;
  const h = M.snap(2 * pad + name.height + handle.height + (slogan ? slogan.height : 0)), top = M.snap(Math.min(by + box + 6 * u, SAFE.bottom - h));
  const yName = top + pad + name.lead / 2, yHandle = top + pad + name.height + handle.lead / 2, ySlogan = top + pad + name.height + handle.height + (slogan ? slogan.lead / 2 : 0);
  const stars = [[-0.62, 0.1], [0.6, 0.25], [-0.5, 0.85], [0.64, 0.8], [0.05, -0.05]];
  const words = (t, t0) => (w, i) => (t < t0 + i * 0.08 ? false : undefined);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o1 = M.stepped(span(t, 0, 0.24));
      if (M.win(ctx, bx, by, box, box, P, o1) && o1 >= 1) {
        const rows = Math.floor(span(t, 0.3, 0.9) * (N + 2)) * cs, bob = Math.floor(t * 2) % 2 ? u : 0;
        const ax = M.snap(bx + (box - art.width) / 2), ay = M.snap(by + (box - art.height) / 2) - bob;
        if (rows > 0) ctx.drawImage(art, 0, 0, art.width, rows, ax, ay, art.width, rows);
        if (t > 1) stars.forEach(([sx, sy], i) => M.sprite(ctx, M.STAR[(Math.floor(t * 5) + i) % 2], M.snap(bx + box / 2 + sx * box * 0.5 - 2.5 * u), M.snap(by + sy * box), { o: P.lead }, u));
      }
      const o2 = M.stepped(span(t, 0.9, 1.14));
      if (!M.win(ctx, wx, top, ww, h, P, o2) || o2 < 1) return;
      kit.drawText(ctx, name, { x0: wx + pad, x1: wx + ww - pad, y: yName, align: 'center', color: P.l, key: P.l, each: words(t, 1.25) });
      if (t >= 1.7) kit.drawText(ctx, handle, { x0: wx + pad, x1: wx + ww - pad, y: yHandle, align: 'center', color: P.lead, key: P.lead });
      if (slogan) kit.drawText(ctx, slogan, { x0: wx + pad, x1: wx + ww - pad, y: ySlogan, align: 'center', color: P.l, key: P.l, each: words(t, 2.0) });
    },
  };
}
