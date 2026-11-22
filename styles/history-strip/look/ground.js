// The history strip ground: a comic page in the brand's lighter colour, cut into panels with heavy ink frames. Every panel looks
// onto the same old printed map: seas tinted faintly with the accent, land a shade of the dark colour with a paler rim where the
// plate inked thin, rings of engraved ripple lines off every coast, dashed borders, a dashed grid of latitude and longitude, a
// compass rose and a scale bar. The big middle panel is the stage (the safe area); a narrow strip above and two small panels below
// are the rest of the page. The map in the stage drifts very slowly, as if the page were being read. Built once per brand.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, tile } from './motion.js';

export const STAGE = { x: 36, y: 258, w: 1008, h: 1012 };
const cache = new Map();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

function blob(r, cx, cy, R, n = 46) {
  const pts = [], k1 = r() * 6, k2 = r() * 6, a1 = 0.18 + r() * 0.12, a2 = 0.08 + r() * 0.08;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = R * (1 + a1 * Math.sin(a * 2 + k1) + a2 * Math.sin(a * 5 + k2) + (r() - 0.5) * 0.08); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85]); }
  const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return { p, pts };
}

function rose(g, x, y, R, P) {
  g.save(); g.translate(x, y); g.strokeStyle = P.ink; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, R * 0.62, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.56, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, L = i % 2 ? R * 0.55 : R, w = i % 2 ? R * 0.09 : R * 0.14;
    for (const side of [-1, 1]) {
      g.fillStyle = side < 0 ? P.ink : P.paper; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * L, Math.sin(a) * L);
      g.lineTo(Math.cos(a + side * Math.PI / 2) * w, Math.sin(a + side * Math.PI / 2) * w); g.closePath(); g.fill(); g.stroke();
    }
  }
  g.restore();
}

function build(W, H, P) {
  const key = W + P.paper + P.ink + P.accent; if (cache.has(key)) return cache.get(key);
  const r = rng(1648), MW = 1700, MH = 2300;
  const [map, g] = mk(MW, MH);
  g.fillStyle = P.sea; g.fillRect(0, 0, MW, MH);
  const lands = [];
  for (const [cx, cy, R] of [[260, 300, 300], [1150, 420, 360], [700, 980, 330], [250, 1450, 280], [1300, 1300, 260], [800, 1900, 380], [1550, 1950, 220], [80, 2100, 200]]) lands.push(blob(r, cx, cy, R));
  for (let k = 7; k >= 1; k--) for (const L of lands) {              // engraved ripple lines off each coast
    g.strokeStyle = P.ripple; g.lineWidth = k * 16; g.lineJoin = 'round'; g.stroke(L.p);
    g.strokeStyle = P.sea; g.lineWidth = k * 16 - 3; g.stroke(L.p);
  }
  g.strokeStyle = P.grid; g.lineWidth = 2; g.setLineDash([10, 9]);
  for (let x = 120; x < MW; x += 230) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 40, MH / 2, x, MH); g.stroke(); }
  for (let y = 140; y < MH; y += 230) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(MW / 2, y - 30, MW, y); g.stroke(); }
  g.setLineDash([]);
  for (const L of lands) {
    g.fillStyle = P.land; g.fill(L.p);
    g.save(); g.clip(L.p); g.strokeStyle = P.rim; g.lineWidth = 46; g.stroke(L.p);
    g.strokeStyle = mix(P.land, P.ink, 0.35); g.lineWidth = 2; g.setLineDash([12, 6, 3, 6]);   // borders across the land
    for (let i = 0; i < 3; i++) { const a = L.pts[(r() * L.pts.length) | 0], b = L.pts[(r() * L.pts.length) | 0]; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2 + (r() - 0.5) * 120, (a[1] + b[1]) / 2 + (r() - 0.5) * 120, b[0], b[1]); g.stroke(); }
    g.setLineDash([]); g.restore();
    g.strokeStyle = P.ink; g.lineWidth = 2.5; g.stroke(L.p);
    const c0 = [(L.pts[0][0] + L.pts[15][0] + L.pts[30][0]) / 3, (L.pts[0][1] + L.pts[15][1] + L.pts[30][1]) / 3];   // towns
    for (let i = 0; i < 3; i++) { g.fillStyle = P.paper; g.beginPath(); g.arc(c0[0] + (r() - 0.5) * 160, c0[1] + (r() - 0.5) * 160, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 2; g.stroke(); }
  }
  // the page: paper, panels with ink frames, the map seen through each
  const [page, pg] = mk(W, H);
  pg.fillStyle = P.paper; pg.fillRect(0, 0, W, H);
  pg.fillStyle = pg.createPattern(tile(P), 'repeat'); pg.fillRect(0, 0, W, H);
  const panels = [{ x: 36, y: 44, w: 1008, h: 190, mx: 400, my: 80 }, { x: 36, y: 1294, w: 492, h: 582, mx: 900, my: 1250 }, { x: 552, y: 1294, w: 492, h: 582, mx: 150, my: 1700 }];
  for (const q of panels) {
    pg.save(); pg.beginPath(); pg.rect(q.x, q.y, q.w, q.h); pg.clip(); pg.drawImage(map, q.x - q.mx, q.y - q.my); pg.restore();
  }
  rose(pg, 36 + 300, 1294 + 300, 110, P);
  // a scale bar on the second small panel, and a compass mark on the top strip
  pg.fillStyle = P.paper; pg.fillRect(600, 1790, 340, 26); pg.strokeStyle = P.ink; pg.lineWidth = 2.5; pg.strokeRect(600, 1790, 340, 26);
  pg.fillStyle = P.ink; for (let i = 0; i < 4; i++) pg.fillRect(600 + i * 85, 1790 + (i % 2 ? 13 : 0), 85, 13);
  rose(pg, W - 150, 139, 70, P);
  const mott = mk(W, H); const mg = mott[1];
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, R = 120 + r() * 260, gr = mg.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, rgba(P.ink, 0.03)); gr.addColorStop(1, rgba(P.ink, 0)); mg.fillStyle = gr; mg.fillRect(x - R, y - R, R * 2, R * 2); }
  pg.drawImage(mott[0], 0, 0);
  const frame = (ctx, q) => { ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.strokeRect(q.x, q.y, q.w, q.h); };
  for (const q of panels) frame(pg, q);
  const out = { map, page, mott: mott[0], frame }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), L = build(W, H, P), S = STAGE;
  return {
    pal: P, stage: S,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(L.page, 0, 0);
      const mx = 320 + time * 7, my = 520 + time * 4;              // the map in the stage drifts slowly
      ctx.save(); ctx.beginPath(); ctx.rect(S.x, S.y, S.w, S.h); ctx.clip(); ctx.drawImage(L.map, -mx + S.x, -my + S.y);
      ctx.drawImage(L.mott, 0, 0); ctx.restore();
      L.frame(ctx, S);
    },
  };
}
