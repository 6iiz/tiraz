// The chart-tale ground: one long chart on paper, and the camera travels along it for the whole reel. A pencil draws a single line
// (an area tint under it) at a steady pace; behind it the drawn line slides away, with its points, its tick marks and faint week
// lines. Time runs in the reading direction of the brand: for a right-to-left brand the pencil travels to the left, so the past is
// on the right and the newest point on the left. The chart lives in the lower part of the frame; notes grow out of it above.
// It uses `clock`, so the line is continuous across scenes: the joint only changes the notes.
import { rng, clamp } from '/engine/kit.js';
import { palette } from './motion.js';

export const V = 105, TOP = 990, BASE = 1470;           // pencil speed (px per second), the chart's top and its zero line
const STEP = 36, N = 400;
let paperCache = null;

function texture(W, H, pal) {
  const key = `${W}x${H}:${pal.paper}:${pal.dark}`;
  if (paperCache?.key === key) return paperCache.c;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rng(5150);
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 2600; k++) {                         // paper fibres: short faint strokes
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 4 + r() * 14;
    g.strokeStyle = pal.rgba(pal.dark, 0.025 + r() * 0.035); g.lineWidth = 1 + r();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  paperCache = { key, c }; return c;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1, penX = rtl ? 330 : W - 330;
  const r = rng(3141), noise = Array.from({ length: N + 2 }, () => r() - 0.5);
  const value = (wx) => {                                   // 0..1, a story with ups and downs
    const i = Math.max(0, Math.min(N, Math.floor(wx / STEP))), f = clamp(wx / STEP - i), n = noise[i] * (1 - f) + noise[i + 1] * f;
    return clamp(0.47 + 0.2 * Math.sin(wx / 430 - 1.2) + 0.1 * Math.sin(wx / 147 + 0.6) + 0.07 * n, 0.08, 0.95);
  };
  const yOf = (v) => BASE - v * (BASE - TOP);
  const wxAt = (time) => 1600 + V * time;
  const sx = (wx, time) => penX + dir * (wx - wxAt(time));
  const paper = texture(W, H, pal);
  return {
    pal, penX, dir, rtl, value, yOf, wxAt, sx,
    // the point the pencil is drawing at this moment
    tip: (t) => { const wx = wxAt(t + clock); return [penX, yOf(value(wx))]; },
    // a point of the line by its world position, at this moment
    point: (wx, t) => [sx(wx, t + clock), yOf(value(wx))],
    draw(ctx, t, o = {}) {
      const time = t + clock, wx = wxAt(time), back = (rtl ? W - penX : penX) + 60;
      const off = Math.round(((-dir * wx) % W + W) % W);                  // the paper slides with the camera
      ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H); ctx.drawImage(paper, off, 0); ctx.drawImage(paper, off - W, 0);
      ctx.fillStyle = pal.grid; for (let k = 1; k <= 4; k++) ctx.fillRect(0, yOf(k / 4) - 1, W, 2);
      const first = Math.floor((wx - back) / 160) * 160;
      for (let g = first; g <= wx + 2000; g += 160) {         // faint week lines and ticks, ahead and behind
        const x = sx(g, time); if (x < -10 || x > W + 10) continue;
        ctx.fillStyle = pal.faint; ctx.fillRect(x - 1, TOP - 60, 2, BASE - TOP + 60);
        ctx.fillStyle = pal.ink; ctx.fillRect(x - 1.5, BASE, 3, g % 640 === 0 ? 22 : 12);
      }
      ctx.fillStyle = pal.ink; ctx.fillRect(0, BASE - 2, W, 4);
      // the line so far: area, stroke, points
      const end = Math.min(wx, o.until ?? Infinity), ex = sx(end, time);
      const pts = []; for (let a = Math.max(0, wx - back); a < end; a += 12) pts.push([sx(a, time), yOf(value(a))]);
      pts.push([ex, yOf(value(end))]);
      ctx.fillStyle = pal.area; ctx.beginPath(); ctx.moveTo(pts[0][0], BASE);
      for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(ex, BASE); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      for (let g = Math.ceil((wx - back) / 160) * 160; g <= end; g += 160) {
        const x = sx(g, time), y = yOf(value(g)), p = clamp((wx - g) / 30);
        ctx.fillStyle = pal.paper; ctx.strokeStyle = pal.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9 * p, 0, 7); ctx.fill(); ctx.stroke();
      }
      if (o.pen !== false) this.pen(ctx, t);
    },
    // the pencil, its graphite tip on the line, leaning back against the way it travels and bobbing a little as it writes
    pen(ctx, t) {
      const time = t + clock, [x, y] = [penX, yOf(value(wxAt(time)))];
      const lean = -0.62 + Math.sin(time * 9) * 0.03, ux = -dir * Math.cos(lean), uy = Math.sin(lean);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux));
      ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.moveTo(14, 18); ctx.lineTo(240, 30); ctx.lineTo(240, 52); ctx.lineTo(40, 30); ctx.fill();
      ctx.fillStyle = pal.wood; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(40, -13); ctx.lineTo(40, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.graphite; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -4); ctx.lineTo(12, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.body; ctx.fillRect(40, -13, 170, 26);
      ctx.fillStyle = pal.rgba(pal.paper, 0.22); ctx.fillRect(40, -13, 170, 7);
      ctx.fillStyle = pal.wood; ctx.fillRect(210, -14, 12, 28);
      ctx.fillStyle = pal.band; ctx.beginPath(); ctx.roundRect(222, -13, 30, 26, [0, 8, 8, 0]); ctx.fill();
      ctx.restore();
    },
  };
}
