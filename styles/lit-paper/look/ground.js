// The lit-paper ground: the inside of a paper-cut shadow box. At the back a sheet glows with the lamp behind it (brightest in the middle,
// with a moon cut through and a few pin-prick stars); in front of it three cut sheets rise from the bottom, each darker than the one
// behind: far hills, a small town whose windows are cuts with the lamp showing through, and near hills with round trees. Every sheet has
// a hair of lamp light on its upper edge and casts a soft shadow on the sheet behind. The front of the box is a near-black sheet with a
// scalloped opening (drawn last by the parts, with drawFront). The box breathes: the sheets slide against each other a few pixels,
// nearer sheets more, and the lamp swells and settles slowly. Every sheet is built once.
import { rng, rgba } from '/engine/kit.js';
import { palette, sheet, cloudRect, cv, grain } from './motion.js';

const cache = new Map();
function build(W, H, P) {
  const key = [P.light, P.dark, P.accent].join('|'); if (cache.has(key)) return cache.get(key);
  const r = rng(1937);
  // the back sheet
  const back = cv(W, H), g = back.getContext('2d');
  const sky = g.createRadialGradient(W / 2, 720, 40, W / 2, 760, 1150);
  sky.addColorStop(0, P.sky0); sky.addColorStop(0.55, P.sky1); sky.addColorStop(1, P.sky2); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  grain(g, W, H, 3, 0.05);
  const moon = { x: 250, y: 330, r: 62 };
  const mg = g.createRadialGradient(moon.x, moon.y, moon.r, moon.x, moon.y, moon.r * 3); mg.addColorStop(0, rgba(P.glow, 0.5)); mg.addColorStop(1, rgba(P.glow, 0));
  g.fillStyle = mg; g.fillRect(moon.x - moon.r * 3, moon.y - moon.r * 3, moon.r * 6, moon.r * 6);
  g.fillStyle = P.glow; g.beginPath(); g.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2); g.fill();
  g.fillStyle = rgba(P.glow, 0.9); for (let i = 0; i < 40; i++) { const x = 60 + r() * (W - 120), y = 210 + r() * 500, s = 1.5 + r() * 2.5; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); }
  const WW = W + 140;
  // far hills
  const hills = (base, amp, f1, f2, ph) => (q) => { q.beginPath(); q.moveTo(0, 600); for (let x = 0; x <= WW; x += 10) q.lineTo(x, base - amp * (0.6 * Math.sin(x / f1 + ph) + 0.4 * Math.sin(x / f2 + ph * 2))); q.lineTo(WW, 600); q.closePath(); };
  const far = sheet(WW, 600, hills(150, 80, 160, 70, 0.4), P.l1, rgba(P.glow, 0.9), 11, 12); far.y = 1080;
  // the town: houses, a dome and a tower, lit windows
  const houses = []; for (let x = 0, k = 0; x < WW; k++) { const w = 70 + r() * 90, h = 120 + r() * 170, roof = r(); houses.push({ x, w, h, roof }); x += w + 6 + r() * 20; }
  const townShape = (q) => {
    q.beginPath(); q.moveTo(0, 640);
    for (const hs of houses) {
      const top = 380 - hs.h;
      q.lineTo(hs.x, 640); q.lineTo(hs.x, top);
      if (hs.roof < 0.4) { q.lineTo(hs.x + hs.w / 2, top - hs.w * 0.45); q.lineTo(hs.x + hs.w, top); }
      else if (hs.roof < 0.65) { q.arc(hs.x + hs.w / 2, top, hs.w / 2, Math.PI, 0); }
      else { q.lineTo(hs.x + hs.w * 0.4, top); q.lineTo(hs.x + hs.w * 0.4, top - 60); q.lineTo(hs.x + hs.w * 0.6, top - 60); q.lineTo(hs.x + hs.w * 0.6, top); q.lineTo(hs.x + hs.w, top); }
      q.lineTo(hs.x + hs.w, 640);
    }
    q.lineTo(WW, 640); q.closePath();
  };
  const town = sheet(WW, 640, townShape, P.l2, rgba(P.glow, 0.9), 21, 10); town.y = 1250;
  { const q = town.img.getContext('2d'); q.save(); q.fillStyle = P.glow; q.shadowColor = rgba(P.glow, 0.8); q.shadowBlur = 14;
    for (const hs of houses) { const top = 380 - hs.h; for (let y = top + 24; y < 470; y += 46) for (let x = hs.x + 14; x < hs.x + hs.w - 22; x += 30) if (r() < 0.5) { q.beginPath(); q.roundRect(x, y, 13, 20, [7, 7, 0, 0]); q.fill(); } }
    q.restore(); }
  // near hills with round trees
  const trees = []; for (let x = 30; x < WW; x += 110 + r() * 150) trees.push({ x, r: 26 + r() * 24, h: 40 + r() * 40 });
  const nearShape = (q) => {
    q.beginPath(); q.moveTo(0, 480); for (let x = 0; x <= WW; x += 10) q.lineTo(x, 150 - 50 * Math.sin(x / 230 + 1.2) - 20 * Math.sin(x / 90)); q.lineTo(WW, 480); q.closePath();
    for (const tr of trees) { const yb = 150 - 50 * Math.sin(tr.x / 230 + 1.2) - 20 * Math.sin(tr.x / 90); q.rect(tr.x - 4, yb - tr.h, 8, tr.h + 4); q.moveTo(tr.x + tr.r, yb - tr.h - tr.r * 0.7); q.arc(tr.x, yb - tr.h - tr.r * 0.7, tr.r, 0, Math.PI * 2); }
  };
  const near = sheet(WW, 480, nearShape, P.l3, rgba(P.glow, 0.85), 31, 12); near.y = 1450;
  // the front of the box: a near-black sheet with a scalloped opening, and a row of pin holes along its top
  const FW = W + 80, open = cloudRect(86, 196, W - 92, 1600, 30);
  const frame = sheet(FW, H, (q) => { q.beginPath(); q.rect(0, 0, FW, H); open(q, false); }, P.front, rgba(P.glow, 0.7), 41, 16, 'evenodd');
  { const q = frame.img.getContext('2d'); q.save(); q.fillStyle = P.glow; q.shadowColor = rgba(P.glow, 0.9); q.shadowBlur = 10;
    for (let x = 120; x < FW - 100; x += 46) { q.beginPath(); q.arc(x, 120 + Math.sin(x / 60) * 8, 3.2, 0, Math.PI * 2); q.fill(); }
    for (let x = 160; x < FW - 140; x += 92) { q.beginPath(); q.moveTo(x, 70); q.lineTo(x + 9, 82); q.lineTo(x, 94); q.lineTo(x - 9, 82); q.closePath(); q.fill(); }
    q.restore(); }
  const out = { back, far, town, near, frame }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), L = build(W, H, P);
  const sway = (time, k) => Math.sin(time * 0.33) * k;
  const lay = (ctx, S, x, y, d) => { ctx.save(); ctx.globalAlpha = 0.8; ctx.drawImage(S.shadow, x + 6 + d, y + 12); ctx.restore(); ctx.drawImage(S.img, x, y); };
  return {
    P,
    // the sideways breath of a sheet at depth k (0 back .. 1 front), for parts that sit between the sheets
    drift: (t, k) => sway(t + clock, 22 * k),
    draw(ctx, t, lamp = 0) {
      const time = t + clock;
      ctx.drawImage(L.back, 0, 0);
      const a = 0.08 + 0.05 * Math.sin(time * 0.9) + 0.3 * lamp, g = ctx.createRadialGradient(W / 2, 760, 30, W / 2, 760, 760);
      g.addColorStop(0, rgba(P.glow, a)); g.addColorStop(1, rgba(P.glow, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      lay(ctx, L.far, -70 + sway(time, 5), L.far.y, 0);
      lay(ctx, L.town, -70 + sway(time, 10), L.town.y, 2);
      lay(ctx, L.near, -70 + sway(time, 15), L.near.y, 4);
    },
    drawFront(ctx, t) {
      const time = t + clock;
      ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(L.frame.shadow, -40 + sway(time, 22) + 10, 16); ctx.restore();
      ctx.drawImage(L.frame.img, -40 + sway(time, 22), 0);
    },
  };
}
