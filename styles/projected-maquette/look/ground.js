// The Projected Maquette ground: a dark room with a white massing model of a small city on a dark plinth, seen from above at an angle,
// built from seeded boxes on a street grid with a river cut through the base plate. The house lights are low; the camera orbits the
// table very slowly on the reel's clock. A part lays light on the model by passing `lit(b)` (colour and strength per building) and/or
// `level` (a projected level that has risen up the facades); light is strongest on roofs, weaker on walls turned toward the projector,
// and spills a little onto the plate around a lit building. The model itself never changes.
import { mix, rgba, rng, clamp } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
function city(T) {
  const r = rng(9173), B = [], M = T.model;
  for (let ix = 0; ix < M.cols; ix++) for (let iz = 0; iz < M.rows; iz++) {
    const x0 = ix * M.cell, z0 = iz * M.cell;
    if (z0 + M.cell > M.river[0] && z0 < M.river[1]) continue;              // the river
    const n = r() < 0.55 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const w = 0.45 + r() * (n === 2 ? 0.35 : 0.75), d = 0.45 + r() * 0.6;
      const x = x0 + 0.15 + (n === 2 ? k * 0.62 : r() * (M.cell - 0.3 - w)), z = z0 + 0.15 + r() * Math.max(0, M.cell - 0.3 - d);
      const tower = r() < 0.12, h = tower ? 2.0 + r() * 1.6 : 0.25 + r() * 1.05;
      B.push({ x, z, w: Math.min(w, M.cell - 0.3), d, h });
    }
  }
  const W = M.cols * M.cell, D = M.rows * M.cell;
  B.forEach((b, i) => { b.id = i; b.cx = b.x + b.w / 2; b.cz = b.z + b.d / 2; b.band = clamp(Math.floor((b.cx / W) * 5), 0, 4); });
  return { B, W, D };
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), C = T.cam;
  if (!cache.has('city')) cache.set('city', city(T));
  const { B, W: MW, D: MD } = cache.get('city');
  const M = T.model;
  let yaw = C.yaw, cy, cs, sy, ss, F = C.f, ox = W / 2, oy = C.y;
  const setCam = (time) => { yaw = C.yaw + Math.sin(time * C.orbit) * C.swing; cy = Math.cos(yaw); sy = Math.sin(yaw); cs = Math.cos(C.pitch); ss = Math.sin(C.pitch); };
  const P = (X, Y, Z) => {
    const x = X - MW / 2, z = Z - MD / 2, xr = x * cy - z * sy, zr = x * sy + z * cy;
    const u = Y * cs + zr * ss, w = zr * cs - Y * ss + C.dist;
    return [ox + (F * xr) / w, oy - (F * u) / w, w];
  };
  const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a; };
  // faces of a box, outward winding; facing: how much the face turns to the projector (above and in front)
  const faces = (b, h) => {
    const { x, z, w, d } = b, X1 = x + w, Z1 = z + d;
    return [
      { v: [[x, h, z], [X1, h, z], [X1, h, Z1], [x, h, Z1]], shade: 1, facing: 1 },
      { v: [[x, 0, z], [X1, 0, z], [X1, h, z], [x, h, z]], shade: 0.74, facing: 0.5 },
      { v: [[X1, 0, Z1], [x, 0, Z1], [x, h, Z1], [X1, h, Z1]], shade: 0.5, facing: 0.2 },
      { v: [[x, 0, Z1], [x, 0, z], [x, h, z], [x, h, Z1]], shade: 0.62, facing: 0.36 },
      { v: [[X1, 0, z], [X1, 0, Z1], [X1, h, Z1], [X1, h, z]], shade: 0.62, facing: 0.36 },
    ];
  };
  const api = {
    pal, B,
    // where a building's roof centre is on screen right now (for pins); call after draw() has set the camera
    roof(b, t) { setCam(t + clock); const p = P(b.cx, b.h, b.cz); return { x: p[0], y: p[1] }; },
    pick(rank = 0) { return [...B].filter((b) => b.cz > MD * 0.45 && Math.abs(b.cx - MW / 2) < MW * 0.3).sort((a, b) => b.h - a.h)[rank] ?? B[0]; },
    draw(ctx, t, { lit = null, level = null, house = T.house } = {}) {
      const time = t + clock; setCam(time);
      // the room: dark, a slightly lifted centre where the throw lands, the faint cone of the projector from above
      ctx.fillStyle = pal.dark; ctx.fillRect(0, 0, W, H);
      const room = ctx.createRadialGradient(W / 2, oy - 120, 0, W / 2, oy - 120, H * 0.7);
      room.addColorStop(0, rgba(pal.light, 0.06 * (0.5 + house))); room.addColorStop(1, rgba(pal.light, 0));
      ctx.fillStyle = room; ctx.fillRect(0, 0, W, H);
      const cone = ctx.createLinearGradient(0, 0, 0, oy);
      cone.addColorStop(0, rgba(pal.light, 0)); cone.addColorStop(1, rgba(pal.beam, 0.05));
      ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(W / 2 - 60, 0); ctx.lineTo(W / 2 + 60, 0); ctx.lineTo(W + 120, oy + 40); ctx.lineTo(-120, oy + 40); ctx.closePath(); ctx.fill();
      // the plinth and the base plate, with the river inlay
      const m = 0.5, pl = [P(-m, 0, -m), P(MW + m, 0, -m), P(MW + m, 0, MD + m), P(-m, 0, MD + m)];
      const base = (s) => mix(pal.dark, pal.light, (T.tone.model0 + T.tone.model * house) * s);
      for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
        const A = [-m, MW + m, MW + m, -m][a], Az = [-m, -m, MD + m, MD + m][a], Bx = [-m, MW + m, MW + m, -m][b], Bz = [-m, -m, MD + m, MD + m][b];
        const f = [P(A, 0, Az), P(Bx, 0, Bz), P(Bx, -0.7, Bz), P(A, -0.7, Az)];
        if (area(f) > 0) { ctx.fillStyle = mix(pal.dark, pal.light, 0.06 + 0.04 * house); poly(ctx, f); ctx.fill(); }
      }
      ctx.fillStyle = base(0.42); poly(ctx, pl); ctx.fill();
      ctx.fillStyle = mix(pal.dark, pal.light, 0.08); poly(ctx, [P(-m, 0.001, M.river[0] + 0.1), P(MW + m, 0.001, M.river[0] + 0.1), P(MW + m, 0.001, M.river[1] - 0.1), P(-m, 0.001, M.river[1] - 0.1)]); ctx.fill();
      // light spilled onto the plate around lit buildings
      const L = lit ? B.map((b) => lit(b)) : null;
      if (L) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        B.forEach((b, i) => {
          const l = L[i]; if (!l || l[1] <= 0.02) return;
          const c = P(b.cx, 0, b.cz), rad = (F / c[2]) * (Math.max(b.w, b.d) * 0.9 + 0.3);
          const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], rad); g.addColorStop(0, rgba(l[0], 0.22 * l[1])); g.addColorStop(1, rgba(l[0], 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c[0], c[1], rad, rad * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
      }
      // the buildings, far to near
      const order = B.map((b, i) => ({ b, i, w: P(b.cx, b.h / 2, b.cz)[2] })).sort((a, b) => b.w - a.w);
      for (const { b, i } of order) {
        const l = L ? L[i] : null;
        for (const f of faces(b, b.h)) {
          const pts = f.v.map((v) => P(...v)); if (area(pts) >= 0) continue;
          let col = base(f.shade);
          if (l && l[1] > 0) col = mix(col, mix(l[0], pal.light, 0.12 * f.shade), clamp(l[1] * (0.42 + 0.58 * f.facing)));
          ctx.fillStyle = col; poly(ctx, pts); ctx.fill();
          if (f.facing === 1) { ctx.strokeStyle = rgba(pal.light, 0.22 + 0.25 * house); ctx.lineWidth = 1.2; ctx.stroke(); }
        }
        if (level && level.w > 0) {
          const h = Math.min(b.h, level.h); if (h <= 0.001) continue;
          for (const f of faces(b, h)) {
            if (f.facing === 1 && h < b.h) continue;                          // the roof is lit only once the level passes it
            const pts = f.v.map((v) => P(...v)); if (area(pts) >= 0) continue;
            ctx.fillStyle = rgba(mix(level.col, pal.light, 0.1), clamp(level.w * (0.5 + 0.5 * f.facing)) * 0.85); poly(ctx, pts); ctx.fill();
          }
          // the bright edge of the level, where the light stops on the wall
          if (h < b.h) { const e = [P(b.x, h, b.z), P(b.x + b.w, h, b.z)]; ctx.strokeStyle = rgba(pal.light, 0.7 * level.w); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...e[0].slice(0, 2)); ctx.lineTo(...e[1].slice(0, 2)); ctx.stroke(); }
        }
      }
      // corners of the room fall off into the dark
      const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.35, W / 2, H * 0.5, H * 0.8);
      v.addColorStop(0, rgba(pal.dark, 0)); v.addColorStop(1, rgba(pal.dark, 0.7));
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
  };
  return api;
}
