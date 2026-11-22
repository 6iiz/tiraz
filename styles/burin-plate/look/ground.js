// The burin-plate ground: a proof on laid paper (the brand's lighter colour, faint laid and chain lines, a few spots of foxing). The plate
// has been pressed into it: a sunken, faintly toned rectangle with a lit and a shaded bevel, and inside it a heavy rule and a hairline.
// At the head, above the safe area, an engine-turned band of interlaced waves slowly shifts its phase. At the foot, below the safe area,
// the plate's specimen: a sphere engraved in the classic order (swelling contour, a first family of lines that wraps the form, a second
// crossing it in the half-tones, a third in the deepest shade, a hatched cast shadow), cut during the first seconds of the reel, and
// then washed by hand with the accent. Paper and the engraved families are built once per brand; their reveal uses `clock`.
import { rng, span, clamp, rgba } from '/engine/kit.js';
import { palette, swell, wash, E } from './motion.js';

const made = new Map();
function build(W, H, P, T) {
  const key = [W, H, P.paper, P.ink, P.accent].join();
  if (made.has(key)) return made.get(key);
  const r = rng(1858), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
  g.fillStyle = rgba(P.ink, T.tone.laid * 0.5); for (let y = 0; y < H; y += 5) g.fillRect(0, y, W, 0.6);
  g.fillStyle = rgba(P.ink, T.tone.laid); for (let x = 40; x < W; x += 118) g.fillRect(x, 0, 1.2, H);
  for (let i = 0; i < 26; i++) { g.fillStyle = rgba(P.ink, 0.03 + r() * 0.04); g.beginPath(); g.arc(r() * W, r() * H, 2 + r() * 7, 0, Math.PI * 2); g.fill(); }
  // the plate mark
  const m = 46; g.fillStyle = rgba(P.ink, T.tone.plate); g.fillRect(m, m, W - 2 * m, H - 2 * m);
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(m, H - m - 3, W - 2 * m, 3); g.fillRect(W - m - 3, m, 3, H - 2 * m);
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(m, m, W - 2 * m, 3); g.fillRect(m, m, 3, H - 2 * m);
  g.fillStyle = P.ink; g.fillRect(64, 64, W - 128, 3); g.fillRect(64, H - 67, W - 128, 3); g.fillRect(64, 64, 3, H - 128); g.fillRect(W - 67, 64, 3, H - 128);
  g.fillRect(74, 74, W - 148, 1); g.fillRect(74, H - 75, W - 148, 1); g.fillRect(74, 74, 1, H - 148); g.fillRect(W - 75, 74, 1, H - 148);
  // the specimen, one canvas per pass
  const cx = W * 0.5, cy = 1585, R = 205, L = [-0.55, -0.62, 0.56], ln = Math.hypot(...L), l = L.map((v) => v / ln);
  const tone = (x, y) => { const dx = (x - cx) / R, dy = (y - cy) / R, d2 = dx * dx + dy * dy; if (d2 >= 1) return -1; const nz = Math.sqrt(1 - d2); return 1 - clamp(dx * l[0] + dy * l[1] + nz * l[2]); };
  const layer = () => { const c = document.createElement('canvas'); c.width = W; c.height = 560; const x = c.getContext('2d'); x.translate(0, -(cy - 300)); x.fillStyle = P.ink; return [c, x]; };
  const passes = [];
  // contour: heavier where it turns from the light
  { const [c, x] = layer(); const n = 120;
    for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, f = Math.max(0, -(Math.cos(a0) * l[0] + Math.sin(a0) * l[1]));
      x.lineWidth = 1 + 3.4 * f; x.strokeStyle = P.ink; x.beginPath(); x.arc(cx, cy, R, a0, a1 + 0.01); x.stroke(); }
    passes.push(c); }
  // three families of lines, each switched on by tone, swelling with it
  const family = (angle, gap, lo, wmax, bend) => {
    const [c, x] = layer(); const ca = Math.cos(angle), sa = Math.sin(angle);
    for (let o = -R; o <= R; o += gap) {
      let run = [];
      const flush = () => {                              // the run as one swelling cut that follows its own curve
        if (run.length > 2) {
          const n = run.length - 1, top = [], bot = [];
          run.forEach((p, k) => {
            const q = run[Math.min(n, k + 1)], o2 = run[Math.max(0, k - 1)], tx = q[0] - o2[0], ty = q[1] - o2[1], tl = Math.hypot(tx, ty) || 1;
            const hw = (wmax / 2) * Math.min(1, p[2]) * (0.25 + 0.75 * Math.sin(Math.PI * (k / n)) ** 0.5);
            top.push([p[0] - (ty / tl) * hw, p[1] + (tx / tl) * hw]); bot.push([p[0] + (ty / tl) * hw, p[1] - (tx / tl) * hw]);
          });
          x.beginPath(); x.moveTo(top[0][0], top[0][1]); for (const p of top) x.lineTo(p[0], p[1]);
          for (let i = bot.length - 1; i >= 0; i--) x.lineTo(bot[i][0], bot[i][1]); x.closePath(); x.fill();
        }
        run = [];
      };
      for (let s = -R; s <= R; s += 5) {
        const px = cx + ca * s - sa * o, py = cy + sa * s + ca * o + bend * (1 - (s / R) ** 2) * Math.sqrt(Math.max(0, 1 - (o / R) ** 2)), t = tone(px, py);
        if (t > lo) run.push([px, py, clamp((t - lo) / (1 - lo) * 1.4)]); else flush();
      }
      flush();
    }
    x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(cx, cy, R - 1, 0, Math.PI * 2); x.fill();
    return c;
  };
  passes.push(family(-0.08, 6.5, 0.14, 2.2, 26), family(1.0, 7.5, 0.5, 1.7, 0), family(-0.6, 8.5, 0.75, 1.4, 0));
  // the cast shadow, hatched level, on the side away from the light
  { const [c, x] = layer(); const sx = cx + 150, sy = cy + R - 8, rx = 300, ry = 46;
    for (let y = sy - ry; y <= sy + ry; y += 5) { const h = Math.sqrt(Math.max(0, 1 - ((y - sy) / ry) ** 2)) * rx; if (h > 8) swell(x, sx - h, y, sx + h, y, 1.7 * (1 - Math.abs(y - sy) / ry * 0.5)); }
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx, cy, R + 5, 0, Math.PI * 2); x.fill();
    passes.unshift(c); }
  const out = { cv, passes, sy: cy - 300, cx, cy, R };
  made.set(key, out);
  return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), B = build(W, H, P, T), rtl = brand.dir !== 'ltr';
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.cv, 0, 0);
      // the engine-turned band at the head
      ctx.save(); ctx.strokeStyle = P.hair; ctx.lineWidth = 1.1;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        for (let x = 90; x <= W - 90; x += 6) { const y = 175 + 34 * Math.sin(x * 0.021 + i * 0.7 + time * 0.35 * (rtl ? 1 : -1)) * Math.sin(x * 0.0035 + 0.4); x === 90 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = P.ink; ctx.fillRect(90, 126, W - 180, 1.5); ctx.fillRect(90, 224, W - 180, 1.5);
      // the specimen: each pass is uncovered by a burin sweep, the passes one after another, then the wash
      B.passes.forEach((c, i) => {
        const p = E(span(time, 0.1 + i * 0.45, 0.65 + i * 0.45)); if (p <= 0) return;
        const w = W * p; ctx.drawImage(c, rtl ? W - w : 0, 0, w, c.height, rtl ? W - w : 0, B.sy, w, c.height);
      });
      wash(ctx, B.cx + 10, B.cy + 6, B.R * 1.0, B.R * 0.97, span(time, 2.6, 3.4), P, 77);
    },
  };
}
