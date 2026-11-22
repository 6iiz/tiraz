// Ground of depth-pixels: a little town square at night, looked at from above through a lens that keeps only a band in focus. The model is
// built once per scene from pixel textures (cobbles, brick fronts, tiled roofs, round trees), lit by lamps whose light is baked into
// the texels in dithered steps, then scaled up four times with hard edges. Each frame the camera glides over it on `clock`, the top
// and bottom of the frame go out of focus, the lamps breathe and bloom, dust drifts through the light, and a traveller in the
// brand's accent stands by a lamp, breathing in two drawings, his shadow thrown away from the flame.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, PX, BAYER, sprite, TRAVELLER, travellerMap, glow, bloom, flicker } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), T = look.tokens.world ?? {}, r = rng(3535);
  const MW = 300, MH = 560, FW = MW * PX, FH = MH * PX;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const buf = new Uint8ClampedArray(MW * MH * 3), lit = new Float32Array(MW * MH);    // colour per texel, and whether it glows itself
  const set = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= MW || y >= MH) return; const v = hex(c), i = (y * MW + x) * 3; buf[i] = v[0]; buf[i + 1] = v[1]; buf[i + 2] = v[2]; };
  const glowSet = (x, y, c) => { set(x, y, c); if (x >= 0 && y >= 0 && x < MW && y < MH) lit[(y | 0) * MW + (x | 0)] = 1; };
  // cobbles: rows of stones, each a slightly different tone, with dark joints
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const row = Math.floor(y / 5), off = row % 2 ? 4 : 0, col = Math.floor((x + off) / 8);
    const joint = y % 5 === 4 || (x + off) % 8 === 7, k = ((row * 7919 + col * 104729) >>> 0) % 5;
    set(x, y, joint ? P.floorD : k === 0 ? P.floorL : k === 1 ? mix(P.floor, P.floorD, 0.4) : P.floor);
  }
  // the street: big pale flagstones down the middle, with a worn dark kerb on both sides
  const sc = (y) => 150 + 10 * Math.sin(y * 0.012);
  for (let y = 0; y < MH; y++) { const c = sc(y);
    for (let x = Math.floor(c - 44); x <= c + 44; x++) { const dx = Math.abs(x - c), row = Math.floor(y / 9), off = row % 2 ? 7 : 0;
      const joint = y % 9 === 8 || (x + off) % 14 === 13, k = ((row * 31 + Math.floor((x + off) / 14) * 17) >>> 0) % 4;
      set(x, y, dx > 41 ? P.d : dx > 39 ? P.wallD : joint ? P.floor : k === 0 ? P.path : P.pathL); } }
  // a building: a roof seen from above, a brick front with lit windows and a door, a shadow on the cobbles below
  const house = (x0, y0, w, roofH, wallH) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < w + 3; x++) set(x0 + x, y0 + roofH + wallH + y, mix(P.floorD, P.d, 0.5));
    for (let y = 0; y < roofH; y++) for (let x = 0; x < w; x++) {
      const ridge = y < 2, tile = (y % 3 === 2) || ((x + (Math.floor(y / 3) % 2) * 2) % 5 === 4);
      set(x0 + x, y0 + y, ridge ? P.roofL : tile ? P.roofD : P.roof);
    }
    for (let y = 0; y < wallH; y++) for (let x = 0; x < w; x++) {
      const brick = y % 3 === 2 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 5;
      set(x0 + x, y0 + roofH + y, y === 0 ? P.d : brick ? P.wallD : P.wall);
    }
    for (let wx = x0 + 4; wx + 6 < x0 + w - 2; wx += 12) {                       // windows: lit panes with a dark frame
      const on = r() > 0.25;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
        const edge = x === 0 || y === 0 || x === 5 || y === 7, mull = x === 3 || y === 4;
        (on && !edge && !mull ? glowSet : set)(wx + x, y0 + roofH + 3 + y, edge || mull ? P.d : on ? P.pane : P.wallD);
      }
    }
    const dx = x0 + Math.floor(w / 2) - 3;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 7; x++) set(dx + x, y0 + roofH + wallH - 10 + y, x === 0 || x === 6 || y === 0 ? P.d : mix(P.roofD, P.d, 0.3));
  };
  // a round tree: shaded crown with a dark rim, a short trunk, a shadow
  const tree = (cx, cy, R) => {
    for (let j = -2; j <= 2; j++) for (let i = -R; i <= R + 3; i++) if ((i / (R + 1)) ** 2 + j * j / 5 < 1) set(cx + i + 2, cy + R + 4 + j, mix(P.floorD, P.d, 0.5));
    for (let y = 0; y < 5; y++) { set(cx - 1, cy + R - 1 + y, P.trunk); set(cx, cy + R - 1 + y, P.trunk); }
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const dd = Math.hypot(i + 0.5, j + 0.5); if (dd > R) continue;
      const v = 0.5 - (i + j) / (R * 2.4), b = BAYER[(cy + j) & 3][(cx + i) & 3] / 16;
      set(cx + i, cy + j, dd > R - 1 ? P.d : v > 0.7 + b * 0.2 ? P.leafL : v < 0.32 + b * 0.2 ? P.leafD : P.leaf);
    }
  };
  // the square: a row of houses across the far side, houses down both sides, trees, a well, lamps
  for (let x = -6, i = 0; x < MW; i++) { const w = 44 + ((i * 13) % 4) * 6; house(x, 4, w, 20 + (i % 2) * 6, 32); x += w + 3; }
  [[-4, 96, 70], [-8, 236, 74], [-4, 400, 70], [234, 150, 70], [238, 300, 66], [232, 450, 72]].forEach(([x, y, w], i) => house(x, y, w, 22 + (i % 2) * 4, 36));
  [[84, 200, 9], [216, 116, 8], [80, 380, 10], [222, 260, 8], [86, 520, 9], [214, 410, 9]].forEach(([x, y, R]) => tree(x, y, R));
  // crates and barrels by the doors
  const crate = (x, y) => { for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) set(x + i, y + j, j < 3 ? P.roofL : (i === 0 || i === 8 || j === 8 || i === j - 1) ? P.d : P.roofD); };
  [[72, 150], [82, 154], [208, 360], [70, 330], [214, 220]].forEach(([x, y]) => crate(x, y));
  const lamps = [[104, 140], [198, 210], [104, 300], [198, 380], [104, 470], [198, 540]];
  for (const [x, y] of lamps) {
    for (let k = 0; k < 18; k++) { set(x, y - k, P.d); set(x + 1, y - k, mix(P.d, P.l, 0.15)); }
    for (let j = -3; j <= 2; j++) for (let i = -2; i <= 3; i++) (Math.abs(j) < 2 && i > -2 && i < 3 ? glowSet : set)(x + i, y - 20 + j, Math.abs(j) < 2 && i > -2 && i < 3 ? P.light : P.d);
  }
  // lamplight baked into the texels in four dithered steps: warm pools on a cold square
  const lc = hex(P.light);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x; if (lit[i]) continue;
    let L = 0; for (const [lx, ly] of lamps) { const dx = x - lx, dy = (y - ly) * 1.4; L += Math.exp(-(dx * dx + dy * dy) / 760); }
    const q = Math.min(3, Math.floor(Math.min(1, L) * 4 + BAYER[y & 3][x & 3] / 16)) / 3 * 0.5;
    for (let k = 0; k < 3; k++) buf[i * 3 + k] = buf[i * 3 + k] + (lc[k] - buf[i * 3 + k]) * q;
  }
  const small = document.createElement('canvas'); small.width = MW; small.height = MH;
  const sg = small.getContext('2d'), img = sg.createImageData(MW, MH);
  for (let i = 0; i < MW * MH; i++) { img.data[i * 4] = buf[i * 3]; img.data[i * 4 + 1] = buf[i * 3 + 1]; img.data[i * 4 + 2] = buf[i * 3 + 2]; img.data[i * 4 + 3] = 255; }
  sg.putImageData(img, 0, 0);
  const sharp = document.createElement('canvas'); sharp.width = FW; sharp.height = FH;
  const shg = sharp.getContext('2d'); shg.imageSmoothingEnabled = false; shg.drawImage(small, 0, 0, FW, FH);
  const soft = document.createElement('canvas'); soft.width = FW; soft.height = FH;
  const sog = soft.getContext('2d'); sog.filter = `blur(${T.blur ?? 9}px)`; sog.drawImage(sharp, 0, 0); sog.filter = 'none';
  // the lens: out of focus above and below a band, a dark vignette
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
  { const g = mask.getContext('2d'), lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, '#000'); lg.addColorStop(0.16, 'rgba(0,0,0,0.85)'); lg.addColorStop(0.27, 'rgba(0,0,0,0)'); lg.addColorStop(0.7, 'rgba(0,0,0,0)'); lg.addColorStop(0.84, 'rgba(0,0,0,0.85)'); lg.addColorStop(1, '#000');
    g.fillStyle = lg; g.fillRect(0, 0, W, H); }
  const vig = document.createElement('canvas'); vig.width = W; vig.height = H;
  { const g = vig.getContext('2d'), rg = g.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.48, H * 0.72);
    rg.addColorStop(0, rgba(P.d, 0)); rg.addColorStop(1, rgba(P.d, 0.82)); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; const scg = scratch.getContext('2d');
  const lampGlow = glow(P.light), paneGlow = glow(P.pane, 128), tm = travellerMap(P);
  const motes = Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * H, v: 8 + r() * 16, s: r() < 0.3 ? 6 : 4, a: 0.2 + r() * 0.45, ph: r() * 6 }));
  const hero = [128, 372];                                                        // texel where the traveller stands
  const cam = (time) => ({ x: -60 + 52 * Math.sin(time * 0.11 + 0.4), y: -40 - Math.min(FH - H - 80, time * 8) });
  return {
    P, lampGlow, cam: (t) => cam(Math.max(0, t + clock)),
    draw(ctx, t) {
      const time = Math.max(0, t + clock), c = cam(time);
      ctx.fillStyle = P.d; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(sharp, c.x, c.y);
      // the lens: blurred model laid over the top and bottom
      scg.globalCompositeOperation = 'source-over'; scg.clearRect(0, 0, W, H); scg.drawImage(soft, c.x, c.y);
      scg.globalCompositeOperation = 'destination-in'; scg.drawImage(mask, 0, 0); ctx.drawImage(scratch, 0, 0);
      // the traveller: two drawings, swapped about twice a second; his shadow falls away from the nearest lamp
      const hs = 6, hx = c.x + hero[0] * PX, hy = c.y + hero[1] * PX, f = Math.floor(time * 1.6) % 2;
      ctx.save(); ctx.fillStyle = rgba(P.d, 0.5); ctx.beginPath(); ctx.ellipse(hx + 30, hy + 95, 34, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.transform(1, 0, -0.9, 0.35, hx + 30, hy + 96); ctx.globalAlpha = 0.5;
      sprite(ctx, TRAVELLER[f], -30, -96, { o: P.d, h: P.d, s: P.d, e: P.d, c: P.d, C: P.d, b: P.d }, hs); ctx.restore();
      sprite(ctx, TRAVELLER[f], hx, hy, tm, hs);
      // lamps breathe and bloom; windows glow a little
      lamps.forEach(([x, y], k) => { const a = flicker(time, k); bloom(ctx, lampGlow, c.x + (x + 0.5) * PX, c.y + (y - 20) * PX, 150 * a, 0.7 * a); });
      // dust drifting through the light
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = P.light;
      for (const m of motes) { const y = ((m.y - time * m.v) % H + H) % H, x = m.x + Math.sin(time * 0.6 + m.ph) * 18;
        ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(time * 1.3 + m.ph)); ctx.fillRect(Math.round(x), Math.round(y), m.s, m.s); }
      ctx.restore();
      ctx.drawImage(vig, 0, 0);
    },
  };
}
