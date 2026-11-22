// The Urban Pulse ground: a city at night in time-lapse, drawn from nothing. A dark sky with fast streaked clouds, a skyline whose
// windows switch on and off on every beat, and a road below the horizon where traffic has turned into rivers of light (white heads
// coming, accent tails going). The framing cuts between three crops of the city once per bar; the upper sky is held calm behind the
// text. Everything costly is painted once per brand into canvases; a frame only moves and stacks them.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
function canvas(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

function build(W, H, pal, T) {
  const C = T.city, hz = C.horizon, r = rng(4517);
  // sky + calm band
  const sky = canvas(W, H), s = sky.getContext('2d');
  const g = s.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, pal.dark); g.addColorStop(0.6, mix(pal.dark, pal.accent, 0.05)); g.addColorStop(1, mix(mix(pal.dark, pal.accent, 0.2), pal.light, 0.05));
  s.fillStyle = g; s.fillRect(0, 0, W, hz);
  s.fillStyle = pal.dark; s.fillRect(0, hz, W, H - hz);
  // the glow of the traffic where the road meets the city
  const rg = s.createRadialGradient(W / 2, hz, 0, W / 2, hz, 700); rg.addColorStop(0, rgba(pal.accent, 0.22)); rg.addColorStop(0.4, rgba(pal.accent, 0.06)); rg.addColorStop(1, rgba(pal.accent, 0));
  s.fillStyle = rg; s.fillRect(0, hz - 700, W, 1400);
  // skyline: far row then near row, each a silhouette a shade off the night
  const blds = [];
  for (const [row, tone, hmin, hmax] of [[0, T.tone.building * 0.6, 60, 240], [1, T.tone.building, 40, 200]]) {
    let x = -40;
    while (x < W + 40) {
      const w = 40 + r() * 90, side = Math.abs(x + w / 2 - W / 2) / (W / 2);
      const h = hmin + r() * (hmax - hmin) + (side > 0.75 ? r() * 260 : 0);
      blds.push({ x, w, h, row, tone }); x += w + (row ? 6 + r() * 20 : 2);
    }
  }
  for (const b of blds) { s.fillStyle = mix(pal.dark, pal.light, b.tone); s.fillRect(b.x, hz - b.h, b.w, b.h + 2); }
  // windows: two states, the beat switches between them
  const wins = [canvas(W, H), canvas(W, H)];
  for (const b of blds) {
    for (let y = hz - b.h + 10; y < hz - 8; y += 14) for (let x = b.x + 6; x < b.x + b.w - 8; x += 11) {
      const on = r(), flip = r() < 0.35, warm = r() < 0.18;
      const col = warm ? rgba(pal.accent, 0.55) : rgba(pal.light, b.row ? 0.42 : 0.26);
      for (const k of [0, 1]) { const lit = k === 0 ? on < 0.42 : (flip ? on >= 0.42 : on < 0.42); if (lit) { const c = wins[k].getContext('2d'); c.fillStyle = col; c.fillRect(x, y, 5, 7); } }
    }
  }
  // clouds: a strip twice as wide as the frame of soft streaks, scrolled fast
  const cl = canvas(W * 2, 760), c = cl.getContext('2d');
  c.filter = 'blur(18px)';
  for (let i = 0; i < 40; i++) {
    const x = r() * W * 2, y = 60 + r() * 640, w = 220 + r() * 520, h = 16 + r() * 40;
    c.fillStyle = rgba(pal.light, C.cloud * (0.5 + r()));
    for (const dx of [0, -W * 2, W * 2]) { c.beginPath(); c.ellipse(x + dx, y, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill(); }
  }
  c.filter = 'none';
  // the traffic: lanes from a vanishing point to the bottom edge, trails along them
  const lanes = []; for (let i = 0; i < C.lanes; i++) lanes.push({ xb: W * (-0.7 + 2.4 * (i + 0.5) / C.lanes), toward: i < C.lanes / 2 });
  const trails = []; for (let i = 0; i < C.trails; i++) trails.push({ lane: Math.floor(r() * C.lanes), off: r(), speed: 0.25 + r() * 0.35, len: 0.1 + r() * 0.3 });
  return { sky, wins, cl, lanes, trails };
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), key = [W, H, pal.dark, pal.light, pal.accent].join();
  if (!cache.has(key)) cache.set(key, build(W, H, pal, T));
  const B = cache.get(key), hz = T.city.horizon, vx = W / 2;
  const frames = [[1, 0, 0], [1.07, -60, -40], [1.04, 50, -70]];
  const road = (ctx, time) => {
    ctx.save(); ctx.lineCap = 'round';
    for (const l of B.lanes) { ctx.strokeStyle = rgba(pal.light, 0.05); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx, hz); ctx.lineTo(l.xb, H); ctx.stroke(); }
    for (const tr of B.trails) {
      const l = B.lanes[tr.lane], u = (tr.off + time * tr.speed) % 1, s1 = l.toward ? u : 1 - u, s0 = l.toward ? s1 - tr.len : s1 + tr.len;
      const P = (s) => { const q = Math.max(0, Math.min(1, s)) ** 2.2; return [vx + (l.xb - vx) * q, hz + (H - hz) * q]; };
      const [ax, ay] = P(s0), [bx, by] = P(s1), wdt = 1 + 12 * Math.max(0, Math.min(1, Math.max(s0, s1))) ** 2;
      const gr = ctx.createLinearGradient(ax, ay, bx, by);
      const col = l.toward ? pal.light : pal.accent;
      gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, l.toward ? 0.85 : 0.75));
      ctx.strokeStyle = gr; ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.restore();
  };
  return {
    pal, horizon: hz,
    draw(ctx, t, { city = 1 } = {}) {
      const time = t + clock, beat = T.beat, bar = Math.floor(time / (beat * 2)), [k, dx, dy] = frames[((bar % 3) + 3) % 3];
      ctx.fillStyle = pal.dark; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2 + dx, hz + dy); ctx.scale(k, k); ctx.translate(-W / 2, -hz);
      ctx.drawImage(B.sky, 0, 0);
      const cx = -((time * 240) % (W * 2));
      ctx.drawImage(B.cl, cx, 200); ctx.drawImage(B.cl, cx + W * 2, 200);
      if (city > 0) {
        ctx.globalAlpha = city;
        ctx.drawImage(B.wins[Math.floor(time / beat) % 2 ? 1 : 0], 0, 0);
        road(ctx, time);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // the sky above the city is held calm behind the words
      const cg = ctx.createLinearGradient(0, 180, 0, 1240);
      cg.addColorStop(0, rgba(pal.dark, 0)); cg.addColorStop(0.2, rgba(pal.dark, T.city.calm)); cg.addColorStop(0.85, rgba(pal.dark, T.city.calm)); cg.addColorStop(1, rgba(pal.dark, 0));
      ctx.fillStyle = cg; ctx.fillRect(0, 180, W, 1060);
    },
  };
}
