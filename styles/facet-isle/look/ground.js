// The facet-isle ground: a sky that runs from the brand's ground colour to a faint wash of its accent, and below the safe area a small
// floating island of hexagonal columns standing in a faceted sea, seen by an orthographic camera at 30 degrees. The island turns very
// slowly through the whole reel, so every facet changes tone as it swings past the light; the sea's triangles tilt on summed waves,
// each catching the light by itself. In the first seconds trees, houses and a lookout sprout on the tiles, each landing with the
// bounce. Built once (tiles, props, sea mesh, sky); drawn from the reel's time (t + clock), so it never restarts at a scene.
import { rng, mix } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = M.palette(brand), G = look.tokens.isle;
  const C = M.cam(W / 2, G.y, G.scale);
  const sky = document.createElement('canvas'); sky.width = W; sky.height = H;
  { const g = sky.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, P.bg); gr.addColorStop(0.55, P.bg); gr.addColorStop(1, P.skyLow);
    g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // the island: axial hex tiles within radius 3, a few rim tiles missing
  const r = rng(4651), tiles = [], hex = M.ngon(6, 0.9);
  for (let q = -3; q <= 3; q++) for (let s = -3; s <= 3; s++) {
    const d = Math.max(Math.abs(q), Math.abs(s), Math.abs(-q - s)); if (d > 3) continue;
    if (d === 3 && r() < 0.3) continue;
    const h = 0.35 + (3 - d) * 0.42 + r() * 0.55 + (q === 1 && s === -1 ? 0.7 : 0);
    const base = h < 0.75 ? P.sand : h < 1.3 ? P.grass : h < 1.75 ? P.hill : P.rock;
    tiles.push({ q, s, h, d, faces: M.prismY(hex, 0, h), color: mix(base, r() < 0.5 ? P.light : P.dark, r() * 0.06), at: [Math.sqrt(3) * (q + s / 2), 0, 1.5 * s], mid: h / 2 });
  }
  // props that sprout on the tiles, one after another
  const props = [], pick = tiles.filter((t) => t.d <= 2).sort((a, b) => a.h - b.h);
  const slots = [3, 6, 9, 12, 14, 16, 17, 18].map((i) => pick[Math.min(pick.length - 1, i)]);
  slots.forEach((t, k) => {
    const born = 0.15 + k * 0.3, at = [t.at[0] + (r() - 0.5) * 0.3, t.h, t.at[2] + (r() - 0.5) * 0.3];
    if (t.h > 1.75) {                                     // a lookout on the highest rock: a slim hex tower with a pointed cap
      props.push({ faces: M.prismY(M.ngon(6, 0.28), 0, 0.9), color: P.light === P.bg ? mix(P.text, P.bg, 0.5) : P.rock, at, born, mid: 0.45 });
      props.push({ faces: M.pyramid(M.ngon(6, 0.38), 0.9, 1.4), color: P.accent, at, born: born + 0.12, mid: 1 });
    } else if (k % 3 === 1) {                            // a house: a box with a ridge roof
      props.push({ faces: M.prismY([[-0.32, -0.26], [0.32, -0.26], [0.32, 0.26], [-0.32, 0.26]], 0, 0.42), color: mix(P.light, P.dark, 0.12), at, born, mid: 0.2, turn: r() * 3 });
      props.push({ faces: M.prismZ([[-0.38, 0.42], [0.38, 0.42], [0, 0.72]], -0.3, 0.3), color: P.accent, at, born: born + 0.1, mid: 0.55, turn: 0 });
      props.at(-1).turn = props.at(-2).turn;
    } else {                                             // a tree: a short trunk under a five-sided cone
      props.push({ faces: M.prismY(M.ngon(4, 0.07, 0.3), 0, 0.25), color: P.trunk, at, born, mid: 0.12 });
      props.push({ faces: M.pyramid(M.ngon(5, 0.32 + r() * 0.1), 0.2, 0.95 + r() * 0.35), color: P.hill, at, born: born + 0.06, mid: 0.5, turn: r() * 2 });
    }
  });
  const sprites = tiles.concat(props);
  // the sea: a triangle mesh in the camera's frame, inside a disk; and the disk's faceted rim below it
  const R = G.sea, tri = [];
  for (let i = -R; i < R; i++) for (let j = -R; j < R; j++) {
    const a = [i, j], b = [i + 1, j], c = [i, j + 1], d = [i + 1, j + 1];
    for (const t of [[a, b, c], [b, d, c]]) { const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, mz = (t[0][1] + t[1][1] + t[2][1]) / 3; if (Math.hypot(mx, mz) < R - 0.4) tri.push(t); }
  }
  const rim = { faces: M.prismY(M.ngon(48, R - 0.2, 0), -1.1, -0.03), color: mix(P.sea, P.dark, 0.35), at: [0, 0, 0], mid: -0.5 };
  const floaters = [0, 1].map((k) => ({ faces: M.gem(0.32, 0.9), color: P.accent, at: [k ? -2.6 : 3.1, 0, k ? 1.2 : -1.6], mid: 0.45 }));
  // three low-poly clouds high in the sky: flat hexagon clusters a step off the ground's tone, drifting slowly
  const cloudC = mix(P.bg, P.text, 0.06), cloudTone = (b, k) => P.tone(b, Math.max(0.25, k)), clouds = [[180, 330, 1.1], [820, 210, 0.8], [600, 1120, 0.9]].map(([x, y, k], i) => ({
    x, y, k, parts: [[0, 0, 0.9], [0.95, 0.2, 0.7], [-0.9, 0.25, 0.65], [0.3, -0.45, 0.6]].map(([px, pz, pr]) => ({ faces: M.prismY(M.ngon(6, pr), 0, 0.28), color: cloudC, at: [px, 0, pz], mid: 0.14 })) }));
  const wave = (x, z, tm) => 0.09 * Math.sin(x * 0.9 + tm * 1.3) + 0.07 * Math.sin(z * 1.3 - tm * 1.1) + 0.04 * Math.sin((x + z) * 1.7 + tm * 2.1);
  const turnAt = (time) => G.turn0 + time * G.speed;
  return {
    P, C, turnAt, hex, tiles, centreH: tiles.find((u) => u.q === 0 && u.s === 0).h,
    // extra: solids that stand on the island this frame (a part's own column), sorted in with the tiles
    draw(ctx, t, extra = []) {
      const time = t + clock, a = turnAt(time);
      ctx.drawImage(sky, 0, 0);
      for (const c of clouds) {
        const x = ((c.x + time * 10 * c.k) % (W + 300) + W + 300) % (W + 300) - 150, cc = M.cam(x, c.y, 46 * c.k);
        const ps = c.parts.map((o) => ({ o, d: M.depthOf(o, a * 0.5) })).sort((u, v) => u.d - v.d);
        for (const { o } of ps) M.drawSolid(ctx, cc, o, a * 0.5, cloudTone);
      }
      M.drawSolid(ctx, C, rim, a, P.tone);
      ctx.save(); ctx.beginPath(); ctx.ellipse(C.cx, C.cy, (R - 0.2) * C.S, (R - 0.2) * C.S * 0.5, 0, 0, Math.PI * 2); ctx.clip();
      // sea facets, each tilted by the waves
      for (const T of tri) {
        const p = T.map(([x, z]) => [x, wave(x, z, time), z]);
        const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], v = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
        let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; if (n[1] < 0) n = n.map((x) => -x);
        const m = Math.hypot(...n), s = (n[0] * M.LIGHT[0] + n[1] * M.LIGHT[1] + n[2] * M.LIGHT[2]) / m;
        ctx.fillStyle = P.tone(P.sea, (s - 0.86) * 4 + 0.2); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8;
        ctx.beginPath(); p.forEach(([x, y, z], i) => { const [px, py] = C.at(x, y, z); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      // tiles and props, far to near; props grow from their tile with the bounce
      const list = [];
      for (const o of sprites) {
        let sy = 1, sx = 1;
        if (o.born !== undefined) { const p = (time - o.born) / 0.5; if (p <= 0) continue; sy = M.B(p); sx = Math.min(1, 0.4 + p); }
        list.push({ o, sx, sy, d: M.depthOf(o, a) + (o.born !== undefined ? 0.05 : 0) });
      }
      for (const o of extra) list.push({ o, sx: 1, sy: 1, d: M.depthOf(o, a) + 0.02 });
      list.sort((x, y) => x.d - y.d);
      for (const { o, sx, sy } of list) M.drawSolid(ctx, C, { ...o, sx, sy }, a, P.tone);
      // two small gems hover over the island, bobbing and turning on their own
      floaters.forEach((f, k) => M.drawSolid(ctx, C, { ...f, lift: 2.6 + k * 0.5 + 0.18 * Math.sin(time * 1.4 + k * 2), turn: time * (k ? -0.8 : 0.9) }, a, P.tone));
    },
  };
}
