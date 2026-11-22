// The slide-lens ground: a dark bench (the darker brand colour) and, on it, the round field of view of an eyepiece lit from below.
// Inside the circle is a stained section on glass (the lighter brand colour): packed cells with walls and nuclei, fibres and granules,
// all pale tints of the accent so dark type reads over them. The section creeps slowly under the lens, as a stage does when it is
// never quite still; when a scene begins the focus breathes (soft for a moment, then sharp), because the magnification has changed.
// The magnification is chosen per scene from `clock`, and a readout under the lens says it, with a scale bar.
// The section, its soft copy and the lens vignette are built once per brand and kept.
import { rgba, rng, span, SAFE } from '/engine/kit.js';
import { palette, S } from './motion.js';

const cache = new Map();
function build(W, H, brand, T, pal) {
  const id = [W, H, brand.colors.bg, brand.colors.text, brand.colors.accent].join('|');
  if (cache.has(id)) return cache.get(id);
  const N = 1500, sec = document.createElement('canvas'); sec.width = N; sec.height = N;
  const g = sec.getContext('2d'), r = rng(4711);
  g.fillStyle = pal.glass; g.fillRect(0, 0, N, N);
  // fibres between the cells
  g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    g.strokeStyle = pal.stain(1.4 + r()); g.lineWidth = 5 + r() * 9; g.globalAlpha = 0.55;
    const x = r() * N, y = r() * N, a = r() * Math.PI;
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + Math.cos(a) * 400, y + Math.sin(a) * 400, x + Math.cos(a + 1) * 600, y + Math.sin(a + 1) * 500, x + Math.cos(a + 0.4) * 900, y + Math.sin(a + 0.4) * 900);
    g.stroke();
  }
  g.globalAlpha = 1;
  // the cells: a jittered grid, each a wobbly closed outline with a nucleus
  const step = 104;
  for (let gy = -step; gy < N + step; gy += step) for (let gx = -step; gx < N + step; gx += step) {
    const cx = gx + (r() - 0.5) * 40 + ((gy / step) % 2 ? step / 2 : 0), cy = gy + (r() - 0.5) * 40, R = 40 + r() * 12, n = 11, pts = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, q = R * (0.86 + r() * 0.26); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * (0.85 + 0.1 * r())]); }
    g.beginPath();
    for (let k = 0; k <= n; k++) { const p = pts[k % n], q = pts[(k + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (k === 0) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my); }
    g.closePath(); g.fillStyle = pal.stain(0.5 + r() * 0.9); g.fill();
    g.strokeStyle = pal.wall; g.lineWidth = 2.2; g.globalAlpha = 0.75; g.stroke(); g.globalAlpha = 1;
    const nx = cx + (r() - 0.5) * 16, ny = cy + (r() - 0.5) * 16, nr = 10 + r() * 6;
    g.fillStyle = pal.nucleus; g.beginPath(); g.ellipse(nx, ny, nr, nr * (0.75 + r() * 0.2), r() * 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = pal.wall; g.beginPath(); g.arc(nx + 2, ny - 2, 2.4, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = rgba(pal.wall, 0.25 + r() * 0.35); g.beginPath(); g.arc(r() * N, r() * N, 0.8 + r() * 1.8, 0, Math.PI * 2); g.fill(); }
  const soft = document.createElement('canvas'); soft.width = N; soft.height = N;
  const s = soft.getContext('2d'); s.filter = 'blur(9px)'; s.drawImage(sec, 0, 0); s.filter = 'none';
  // the lens vignette: clear in the middle, darker toward the rim (a unit circle drawn at any radius)
  const V = 1024, vig = document.createElement('canvas'); vig.width = V; vig.height = V;
  const v = vig.getContext('2d'), grad = v.createRadialGradient(V / 2, V / 2, V * 0.3, V / 2, V / 2, V / 2);
  grad.addColorStop(0, rgba(pal.bench, 0)); grad.addColorStop(0.7, rgba(pal.bench, 0.04)); grad.addColorStop(1, rgba(pal.bench, 0.42));
  v.fillStyle = grad; v.fillRect(0, 0, V, V);
  const out = { sec, soft, vig, N };
  cache.set(id, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), L = T.lens, rtl = brand.dir !== 'ltr';
  const B = build(W, H, brand, T, pal);
  const mi = clock === 0 ? 2 : Math.floor(Math.abs(Math.sin(clock * 12.9898) * 43758.5453)) % T.mags.length;
  const mag = T.mags[mi], zoom = 0.86 + mi * 0.09;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const bar = Math.round(46 + mi * 22);

  function lens(ctx, t, cx, cy, R, z = 1, breath = 0) {
    const time = t + clock, zz = zoom * z;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.translate(cx + 24 * Math.sin(time * 0.21), cy + 16 * Math.sin(time * 0.16 + 1.3));
    ctx.rotate(0.012 * Math.sin(time * 0.11)); ctx.scale(zz, zz);
    ctx.drawImage(B.sec, -B.N / 2, -B.N / 2);
    if (breath > 0.01) { ctx.globalAlpha = breath; ctx.drawImage(B.soft, -B.N / 2, -B.N / 2); }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(B.vig, cx - R, cy - R, R * 2, R * 2); ctx.restore();
    ctx.save(); ctx.strokeStyle = pal.rim; ctx.lineWidth = L.rim; ctx.beginPath(); ctx.arc(cx, cy, R + L.rim / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function bench(ctx) {
    ctx.fillStyle = pal.bench; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(L.cx, L.cy, L.r * 0.9, L.cx, L.cy, L.r * 1.9);
    g.addColorStop(0, rgba(pal.glass, 0.07)); g.addColorStop(1, rgba(pal.glass, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // the readout under the lens, on the bench: a scale bar and the magnification (decoration, below the safe area)
  function readout(ctx, t, a = 1) {
    if (a <= 0) return;
    const y = SAFE.bottom + 92, x = rtl ? SAFE.left : SAFE.right - bar - 120;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = pal.readout;
    const grow = S(span(t, 0.1, 0.5));
    ctx.fillRect(x, y - 2, bar * grow, 3); ctx.fillRect(x, y - 9, 2, 16); if (grow > 0.98) ctx.fillRect(x + bar - 2, y - 9, 2, 16);
    ctx.font = `500 24px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
    ctx.fillText(`${mag}×`, x + bar + 18, y + 1);
    ctx.restore();
  }
  return {
    pal, mag, lensBox: L,
    lens, bench, readout,
    draw(ctx, t) {
      bench(ctx);
      lens(ctx, t, L.cx, L.cy, L.r, 1, 0.75 * (1 - S(span(t, 0.05, 0.55))));
      readout(ctx, t);
    },
  };
}
