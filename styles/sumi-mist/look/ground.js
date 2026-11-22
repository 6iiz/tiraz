// The sumi ground: rice paper in the brand's lighter colour (cloudy mottling, long fibres, pulp flecks, a soft darkening at the edges)
// and, at the foot of the frame below the safe area, three ranges of mountains in pale ink that dissolve downward into mist. Most of the
// frame stays empty paper. The ranges are painted in during the first second and a half of the reel; after that a band of mist drifts
// slowly across them, so a held line is never on a dead frame. Everything is built once per brand (module cache) and uses `clock`.
import { span, rng, rgba } from '/engine/kit.js';
import { palette, noise1, stroke, paint, E } from './motion.js';

const cache = new Map();
function build(W, H, pal, T) {
  const key = pal.paper + pal.ink; if (cache.has(key)) return cache.get(key);
  const r = rng(808);
  // the paper
  const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
  const g = paper.getContext('2d');
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {                                     // cloud mottling
    const x = r() * W, y = r() * H, rad = 120 + r() * 300, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(pal.ink, T.tone.grain * (0.08 + r() * 0.2))); gr.addColorStop(1, rgba(pal.ink, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {                                    // long fibres
    const x = r() * W, y = r() * H, a = r() * Math.PI * 2, l = 10 + r() * 46, bend = (r() - 0.5) * 16;
    g.strokeStyle = rgba(r() < 0.8 ? pal.ink : pal.paper, 0.025 + r() * 0.045); g.lineWidth = 0.5 + r() * 0.7;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 - Math.sin(a) * bend, y + Math.sin(a) * l / 2 + Math.cos(a) * bend, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = rgba(pal.ink, 0.06 + r() * 0.12); g.beginPath(); g.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, 7); g.fill(); }   // pulp flecks
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, H * 0.78);
  vg.addColorStop(0, rgba(pal.ink, 0)); vg.addColorStop(1, rgba(pal.ink, 0.09)); g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // three ranges, far to near. Each is a soft mass with its top edge as the darkest part, dissolving downward.
  const ranges = [
    { base: 1450, amp: 330, k: T.tone.qing, seed: 3, peaks: 2, tex: 0 },
    { base: 1600, amp: 230, k: T.tone.dan * 0.8, seed: 5, peaks: 2, tex: 0 },
    { base: 1780, amp: 200, k: T.tone.dan * 1.25, seed: 9, peaks: 1, tex: 4 },
  ].map((R, ri) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), nz = noise1(R.seed), nz2 = noise1(R.seed + 1, 160), q = rng(R.seed * 13);
    // a few peaks, each a soft hump with a steeper face on one side, plus a small irregular edge
    const peaks = Array.from({ length: Math.round(R.peaks) + 1 }, (_, i) => ({ x: (i + 0.2 + q() * 0.6) / (Math.round(R.peaks) + 1) * W, h: 0.45 + q() * 0.55, w: 130 + q() * 150, k: 0.6 + q() * 0.8 }));
    const ridge = []; for (let x = -40; x <= W + 40; x += 5) {
      let hgt = 0; for (const P of peaks) { const dx = (x - P.x) / (P.w * (x < P.x ? P.k : 1 / P.k)); hgt = Math.max(hgt, P.h * Math.exp(-dx * dx)); }
      ridge.push([x, R.base - R.amp * hgt - (nz(x / W * 3) - 0.5) * 22 - (nz2(x / W) - 0.5) * 6]);
    }
    const top = Math.min(...ridge.map((p) => p[1]));
    c.fillStyle = pal.tone(R.k); c.beginPath(); c.moveTo(-40, H); ridge.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W + 40, H); c.closePath(); c.fill();
    // a darker loaded line along the ridge, broken in places
    for (let i = 0; i < ridge.length - 8; i += 7 + Math.floor(q() * 10)) {
      const seg = ridge.slice(i, i + 6 + Math.floor(q() * 10)).map(([x, y]) => [x, y + 3]);
      if (seg.length > 2) paint(c, stroke(seg, { w: 5 + ri * 2, seed: R.seed + i, dry: 0.6, bristles: 5 }), 1, pal.tone(Math.min(1, R.k * 1.9)), 0.8);
    }
    // hemp-fibre texture strokes and moss dots on the nearer ranges
    for (let i = 0; i < R.tex; i++) {
      const j = Math.floor(q() * (ridge.length - 2)), p = ridge[j], sl = Math.sign(ridge[j + 1][1] - p[1]) || 1, x = p[0], y = p[1] + 14 + q() * 30;
      paint(c, stroke([[x, y], [x + sl * (14 + q() * 20), y + 40 + q() * 40], [x + sl * (20 + q() * 30), y + 90 + q() * 50]], { w: 4 + q() * 4, seed: R.seed * 7 + i, dry: 0.7, bristles: 4 }), 1, pal.tone(Math.min(1, R.k * 1.6)), 0.6);
    }
    for (let i = 0; i < R.tex * 1.4; i++) {
      const p = ridge[Math.floor(q() * ridge.length)];
      c.fillStyle = pal.tone(Math.min(1, R.k * 2.6)); c.globalAlpha = 0.5 + q() * 0.4;
      c.beginPath(); c.ellipse(p[0] + (q() - 0.5) * 20, p[1] + q() * 10, 2 + q() * 3, 1.5 + q() * 2, q() * 3, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    // dissolve downward: erase with a gradient from clear at the ridge to full a little below
    c.globalCompositeOperation = 'destination-out';
    const dg = c.createLinearGradient(0, top + 40, 0, top + 40 + 210 + ri * 40);
    dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,1)'); c.fillStyle = dg; c.fillRect(0, top, W, H - top);
    return { cv, top };
  });
  // a band of mist, paper-coloured and soft, wider than the frame so it can drift
  const mist = document.createElement('canvas'); mist.width = W * 2; mist.height = 260;
  const m = mist.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = r() * W * 2, y = 130 + (r() - 0.5) * 120, rx = 120 + r() * 220, gr = m.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, rgba(pal.paper, 0.32)); gr.addColorStop(1, rgba(pal.paper, 0));
    m.save(); m.translate(x, y); m.scale(1, 0.32); m.translate(-x, -y); m.fillStyle = gr; m.fillRect(x - rx, y - rx, rx * 2, rx * 2); m.restore();
  }
  const out = { paper, ranges, mist }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), L = build(W, H, pal, T);
  return {
    pal, paper: pal.paper, ink: pal.ink,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(L.paper, 0, 0);
      L.ranges.forEach((R, i) => {
        const p = E(span(time, -0.6 + i * 0.35, 0.6 + i * 0.35));
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 30); ctx.drawImage(R.cv, 0, 0); ctx.restore();
      });
      // the mist drifts sideways and breathes up and down across the ranges
      const dx = -((time * 14) % W), y = 1440 + Math.sin(time * 0.35) * 26;
      ctx.drawImage(L.mist, dx, y - 130); ctx.drawImage(L.mist, dx + W * 2, y - 130);
      ctx.drawImage(L.mist, -((time * 8 + 400) % W) , y + 140 - 130);
    },
  };
}
