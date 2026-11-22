// The fold-out ground: a pop-up book open on a desk, seen from the front under a lamp. The upper board stands up as the backdrop (a
// printed sky with a cut-paper sun, clouds and two rows of hills, slightly soft as a macro lens would see it), the spine runs across at
// y = SPINE, and the lower page lies flat toward us as the floor of the stage, with the stack of pages at its front edge. On the floor
// stand pop-up set pieces (two trees, a bush, a little house) that sprang up before the reel began; they breathe and sway a little on
// their hinges. The lamp's light pools on the page and drifts slowly. Everything is built once.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, piece, wobble, rectPts, stand, pop, cv, grain } from './motion.js';

export const SPINE = 1262;
const cache = new Map();

function build(W, H, P) {
  const key = [P.light, P.dark, P.accent].join('|'); if (cache.has(key)) return cache.get(key);
  const r = rng(61), ink = (g, w = 4) => { g.lineWidth = w; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
  // the desk, the cover and the two pages
  const base = cv(W, H), g = base.getContext('2d');
  g.fillStyle = P.desk; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i < 70; i++) { const y = r() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 30, W * 0.7, y + (r() - 0.5) * 30, W, y + (r() - 0.5) * 20); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.filter = 'blur(18px)'; g.fillRect(20, 150, W - 40, H - 150); g.filter = 'none';
  g.fillStyle = P.cover; g.beginPath(); g.roundRect(22, 128, W - 44, SPINE - 128 + 8, 12); g.fill();
  g.beginPath(); g.moveTo(32, SPINE); g.lineTo(W - 32, SPINE); g.lineTo(W + 70, 1888); g.lineTo(-70, 1888); g.closePath(); g.fill();
  // the backdrop page, with its art, softened by the lens
  const bd = cv(W, H), b = bd.getContext('2d');
  b.fillStyle = P.page; b.fillRect(40, 144, W - 80, SPINE - 144); grain(b, W, H, 5, 0.04);
  const sun = piece(150, 150, (q) => {
    q.save(); q.translate(75, 75);
    for (let k = 0; k < 12; k++) { q.save(); q.rotate((k / 12) * Math.PI * 2); q.beginPath(); q.moveTo(46, -9); q.lineTo(74, 0); q.lineTo(46, 9); q.closePath(); q.fillStyle = P.tintA; q.fill(); ink(q, 3); q.restore(); }
    q.beginPath(); q.arc(0, 0, 46, 0, Math.PI * 2); q.fillStyle = P.accent; q.fill(); ink(q); q.beginPath(); q.arc(-14, -12, 12, Math.PI * 1.1, Math.PI * 1.7); ink(q, 3); q.restore();
  }, P, { seed: 7 });
  const cloud = (w, s) => piece(w, w * 0.45, (q) => {
    q.beginPath(); const h = w * 0.45; q.moveTo(10, h - 6); q.bezierCurveTo(-8, h - 10, 0, h * 0.45, w * 0.22, h * 0.5); q.bezierCurveTo(w * 0.25, 4, w * 0.6, 0, w * 0.62, h * 0.38);
    q.bezierCurveTo(w * 0.8, h * 0.2, w + 4, h * 0.6, w - 10, h - 6); q.closePath(); q.fillStyle = P.paper; q.fill(); ink(q, 3.5);
  }, P, { seed: s });
  const hills = (y0, amp, fill, s) => piece(W - 60, 260, (q) => {
    q.beginPath(); q.moveTo(0, 260); for (let x = 0; x <= W - 60; x += 12) q.lineTo(x, 260 - y0 - amp * Math.abs(Math.sin(x / 190 + s))); q.lineTo(W - 60, 260); q.closePath(); q.fillStyle = fill; q.fill(); ink(q, 3.5);
  }, P, { seed: s, border: 0, edge: 3 });
  const put = (pc, x, y) => { b.drawImage(pc.shadow, x - pc.m + 6, y - pc.m + 10); b.drawImage(pc.img, x - pc.m, y - pc.m); };
  b.save(); b.beginPath(); b.rect(40, 144, W - 80, SPINE - 144); b.clip();
  put(sun, 95, 190); put(cloud(230, 11), 700, 205); put(cloud(160, 12), 480, 300);
  put(hills(70, 80, P.tintC, 1.3), 30, SPINE - 250); put(hills(20, 60, P.tintA, 0.2), 30, SPINE - 230);
  b.restore();
  g.filter = 'blur(1.2px)'; g.drawImage(bd, 0, 0); g.filter = 'none';
  // the spine's shadow and the floor page
  const fl = g.createLinearGradient(0, SPINE, 0, 1860); fl.addColorStop(0, mix(P.floor, P.dark, 0.12)); fl.addColorStop(0.08, P.floor); fl.addColorStop(1, mix(P.floor, P.dark, 0.06));
  g.fillStyle = fl; g.beginPath(); g.moveTo(40, SPINE); g.lineTo(W - 40, SPINE); g.lineTo(W + 40, 1846); g.lineTo(-40, 1846); g.closePath(); g.fill();
  const sp = g.createLinearGradient(0, SPINE - 40, 0, SPINE + 30); sp.addColorStop(0, rgba(P.dark, 0)); sp.addColorStop(0.55, rgba(P.dark, 0.22)); sp.addColorStop(1, rgba(P.dark, 0));
  g.fillStyle = sp; g.fillRect(40, SPINE - 40, W - 80, 70);
  // printed on the floor page: a winding path toward the spine and a scatter of small flowers
  g.save(); g.beginPath(); g.moveTo(40, SPINE); g.lineTo(W - 40, SPINE); g.lineTo(W + 40, 1846); g.lineTo(-40, 1846); g.closePath(); g.clip();
  const path = (side) => { g.beginPath(); for (let y = SPINE + 6; y <= 1850; y += 8) { const u = (y - SPINE) / (1850 - SPINE), x = W / 2 + Math.sin(u * 3.2 + 0.6) * 150 * u + side * (16 + 120 * u); y === SPINE + 6 ? g.moveTo(x, y) : g.lineTo(x, y); } };
  g.beginPath(); for (let y = SPINE + 6; y <= 1850; y += 8) { const u = (y - SPINE) / (1850 - SPINE); g.lineTo(W / 2 + Math.sin(u * 3.2 + 0.6) * 150 * u - (16 + 120 * u), y); }
  for (let y = 1850; y >= SPINE + 6; y -= 8) { const u = (y - SPINE) / (1850 - SPINE); g.lineTo(W / 2 + Math.sin(u * 3.2 + 0.6) * 150 * u + (16 + 120 * u), y); }
  g.closePath(); g.fillStyle = P.tintC; g.fill();
  g.setLineDash([16, 12]); for (const sd of [-1, 1]) { path(sd); ink(g, 3); } g.setLineDash([]);
  for (let i = 0; i < 26; i++) { const u = 0.1 + r() * 0.9, y = SPINE + u * (1846 - SPINE), side = r() < 0.5 ? -1 : 1, x = W / 2 + Math.sin(u * 3.2 + 0.6) * 150 * u + side * (60 + 140 * u + r() * 260), s = 6 + 10 * u;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.6, s * 0.6, 0, Math.PI * 2); g.fillStyle = P.tintA; g.fill(); }
    g.beginPath(); g.arc(x, y, s * 0.45, 0, Math.PI * 2); g.fillStyle = P.accent; g.fill(); }
  g.restore();
  for (let k = 0; k < 6; k++) { g.strokeStyle = k % 2 ? rgba(P.dark, 0.18) : rgba(P.paper, 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(-40, 1848 + k * 4); g.lineTo(W + 40, 1848 + k * 4); g.stroke(); }
  // the set pieces on the floor
  const tree = (s) => piece(150, 230, (q) => {
    q.fillStyle = P.tintB; q.fillRect(66, 120, 18, 110); q.beginPath(); q.rect(66, 120, 18, 110); ink(q, 3.5);
    wobble(q, Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2, rr = 62 + 8 * Math.sin(a * 5); return [75 + Math.cos(a) * rr, 72 + Math.sin(a) * rr * 0.9]; }), 2, s);
    q.fillStyle = P.accent; q.fill(); ink(q); q.beginPath(); q.arc(58, 56, 18, Math.PI * 1.1, Math.PI * 1.6); ink(q, 3);
  }, P, { seed: s });
  const bush = piece(150, 80, (q) => { q.beginPath(); q.moveTo(6, 80); q.arc(40, 50, 32, Math.PI, Math.PI * 1.9); q.arc(84, 38, 36, Math.PI * 1.15, Math.PI * 1.95); q.arc(120, 54, 28, Math.PI * 1.3, 0); q.lineTo(148, 80); q.closePath(); q.fillStyle = P.tintA; q.fill(); ink(q); }, P, { seed: 31 });
  const house = piece(170, 190, (q) => {
    q.beginPath(); q.rect(18, 80, 134, 110); q.fillStyle = P.paper; q.fill(); ink(q);
    q.beginPath(); q.moveTo(4, 86); q.lineTo(85, 6); q.lineTo(166, 86); q.closePath(); q.fillStyle = P.accent; q.fill(); ink(q);
    q.beginPath(); q.roundRect(70, 124, 32, 66, [16, 16, 0, 0]); q.fillStyle = P.tintB; q.fill(); ink(q, 3);
    q.beginPath(); q.rect(30, 104, 28, 28); q.rect(114, 104, 28, 28); q.fillStyle = P.tintC; q.fill(); ink(q, 3);
  }, P, { seed: 41 });
  const fence = piece(320, 90, (q) => {
    q.beginPath(); q.rect(0, 30, 320, 14); q.rect(0, 62, 320, 14); q.fillStyle = P.paper; q.fill(); ink(q, 3);
    for (let x = 6; x < 320; x += 44) { q.beginPath(); q.moveTo(x, 90); q.lineTo(x, 14); q.lineTo(x + 14, 0); q.lineTo(x + 28, 14); q.lineTo(x + 28, 90); q.closePath(); q.fillStyle = P.paper; q.fill(); ink(q, 3); }
  }, P, { seed: 51 });
  const props = [{ pc: fence, x: 250, base: 1640 }, { pc: bush, x: 860, base: 1700 }, { pc: tree(23), x: 120, base: 1790 },{ pc: tree(21), x: 130, base: 1420 }, { pc: bush, x: 300, base: 1470 }, { pc: house, x: 905, base: 1430 }, { pc: tree(22), x: 735, base: 1500 }].sort((a, b) => a.base - b.base);
  const out = { base, props }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), B = build(W, H, P);
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.base, 0, 0);
      const lx = W / 2 + Math.sin(time * 0.25) * 120, lg = ctx.createRadialGradient(lx, 760, 40, lx, 760, 900);
      lg.addColorStop(0, rgba(P.paper, 0.22)); lg.addColorStop(1, rgba(P.paper, 0)); ctx.fillStyle = lg; ctx.fillRect(40, 144, W - 80, 1720);
      B.props.forEach((p, i) => {
        const s = pop(((time + 1.0) - i * 0.08) / 0.55) * (1 - 0.015 * (1 + Math.sin(time * 1.3 + i * 1.7)));
        ctx.save(); ctx.translate(p.x, p.base); ctx.transform(1, 0, Math.sin(time * 0.9 + i) * 0.02, 1, 0, 0); ctx.translate(-p.x, -p.base);
        stand(ctx, p.pc, p.x, p.base, s); ctx.restore();
      });
    },
  };
}
