// The shadow-beat ground: a sunset made only of the brand's colours. The sky runs from a deep mix of the accent at the top to a pale,
// glowing band at the horizon; a big sun sits on the horizon and sinks a little through the whole reel (the sky is the clock). Below,
// water reflects it with a column of glitter. On a jetty, three black figures dance in unison, a new pose on every beat (the middle
// one mirrored), their reflections broken by ripples. freeze: [t0, t1] in scene seconds stops the figures, glitter and clouds while
// the sun keeps sinking. Sky, water and glow are drawn once; the figures are strokes, cheap to draw per frame.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

const D = Math.PI / 180;
// Poses: absolute angles in degrees (0 = straight down, 180 = straight up, positive towards +x) for upper/lower arm and leg.
const POSES = [
  { lean: 0, aL: [-150, -165], aR: [150, 165], lL: [-8, -6], lR: [8, 6] },          // arms up in a V
  { lean: 8, aL: [-35, -15], aR: [92, 92], lL: [-12, -6], lR: [38, 12] },            // point and lunge
  { lean: 0, aL: [-55, 35], aR: [55, -35], lL: [-7, -5], lR: [7, 5] },               // hands on hips
  { lean: -10, aL: [-115, -150], aR: [28, 62], lL: [-36, -10], lR: [5, 4] },         // step and wave
  { lean: 0, aL: [-82, -82], aR: [82, 82], lL: [-48, 18], lR: [48, -18] },           // crouch, arms out
  { lean: -8, aL: [-130, -170], aR: [60, 22], lL: [0, 0], lR: [72, 72] },            // kick
  { lean: 4, aL: [-20, -100], aR: [20, 100], lL: [-15, -5], lR: [15, 5] },           // elbows down, fists up
  { lean: 0, aL: [-170, -178], aR: [170, 178], lL: [-4, -4], lR: [4, 4] },           // reach, arms together
];
const ORDER = [0, 1, 2, 3, 4, 5, 6, 1, 3, 2, 5, 4, 0, 6, 7, 2];

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), HZ = T.horizon, SH = T.shore, beat = T.beat;
  const sky = document.createElement('canvas'); sky.width = W; sky.height = H;
  const g = sky.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, HZ);
  gr.addColorStop(0, pal.top); gr.addColorStop(0.13, pal.sky); gr.addColorStop(0.7, mix(pal.sky, pal.low, 0.5)); gr.addColorStop(1, pal.low);
  g.fillStyle = gr; g.fillRect(0, 0, W, HZ);
  gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, mix(pal.low, pal.water, 0.45)); gr.addColorStop(0.35, pal.water); gr.addColorStop(1, pal.deep);
  g.fillStyle = gr; g.fillRect(0, HZ, W, H - HZ);
  const r = rng(77);
  g.fillStyle = rgba(pal.low, 0.18); for (let i = 0; i < 60; i++) { const y = HZ + 8 + (r() ** 1.6) * (H - HZ); g.fillRect(r() * W, y, 40 + r() * 220, 2 + (y - HZ) / 140); }
  const glow = document.createElement('canvas'); glow.width = 1200; glow.height = 1200;
  { const c = glow.getContext('2d'), rg = c.createRadialGradient(600, 600, 0, 600, 600, 600);
    rg.addColorStop(0, rgba(pal.sun, 0.7)); rg.addColorStop(0.35, rgba(pal.sun, 0.28)); rg.addColorStop(1, rgba(pal.sun, 0)); c.fillStyle = rg; c.fillRect(0, 0, 1200, 1200); }
  const glints = []; for (let i = 0; i < 70; i++) { const dy = r() ** 1.3; glints.push({ y: HZ + 6 + dy * 330, dx: (r() - 0.5) * (60 + dy * 380), w: 14 + r() * 50 * (0.4 + dy), ph: r(), rate: 0.8 + r() * 1.6 }); }
  const clouds = [[0.2, 360, 520, 14], [0.65, 520, 380, 10], [0.35, 980, 640, 16], [0.85, 1180, 420, 12]];

  const limb = (ctx, x, y, a1, a2, l1, l2, w1, w2) => {
    const ex = x + Math.sin(a1 * D) * l1, ey = y + Math.cos(a1 * D) * l1;
    ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    const hx = ex + Math.sin(a2 * D) * l2, hy = ey + Math.cos(a2 * D) * l2;
    ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    return hy;
  };
  const figure = (ctx, x, P, m) => {
    const s = (a) => a * m, legY = (l) => Math.cos(s(l[0]) * D) * 62 + Math.cos(s(l[1]) * D) * 60;
    const hipY = SH - Math.max(legY(P.lL), legY(P.lR)) - 6;
    ctx.strokeStyle = pal.ink; ctx.fillStyle = pal.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    limb(ctx, x - 10, hipY, s(P.lL[0]), s(P.lL[1]), 62, 60, 32, 24);
    limb(ctx, x + 10, hipY, s(P.lR[0]), s(P.lR[1]), 62, 60, 32, 24);
    const lean = s(P.lean) * D, nx = x + Math.sin(lean) * 92, ny = hipY - Math.cos(lean) * 92;
    ctx.lineWidth = 54; ctx.beginPath(); ctx.moveTo(x, hipY - 10); ctx.lineTo(nx, ny + 14); ctx.stroke();
    if (m < 0) { ctx.beginPath(); ctx.moveTo(x - 30, hipY - 26); ctx.lineTo(x + 30, hipY - 26); ctx.lineTo(x + 50, hipY + 34); ctx.lineTo(x - 50, hipY + 34); ctx.closePath(); ctx.fill(); }   // the middle dancer's skirt
    limb(ctx, nx - 16, ny + 12, s(P.aL[0]), s(P.aL[1]), 52, 48, 22, 17);
    limb(ctx, nx + 16, ny + 12, s(P.aR[0]), s(P.aR[1]), 52, 48, 22, 17);
    ctx.beginPath(); ctx.arc(nx + Math.sin(lean) * 30, ny - Math.cos(lean) * 34, 28, 0, Math.PI * 2); ctx.fill();
  };
  const poseAt = (ft) => {
    const i = Math.floor(ft / beat), u = ft / beat - i, A = POSES[ORDER[((i - 1) % 16 + 16) % 16]], B = POSES[ORDER[((i % 16) + 16) % 16]];
    const k = Math.min(1, u * beat / 0.06);                                   // the snap: three or four frames into the new pose
    const L = (a, b) => a + (b - a) * k, LL = (a, b) => [L(a[0], b[0]), L(a[1], b[1])];
    return { lean: L(A.lean, B.lean), aL: LL(A.aL, B.aL), aR: LL(A.aR, B.aR), lL: LL(A.lL, B.lL), lR: LL(A.lR, B.lR) };
  };
  const dancers = (ctx, P) => { figure(ctx, 290, P, 1); figure(ctx, 540, P, -1); figure(ctx, 790, P, 1); };

  return {
    pal,
    draw(ctx, t, { freeze = null, pose = null } = {}) {
      const time = t + clock;
      let ft = time;                                                         // the figures' time: stopped inside the freeze
      if (freeze) { if (t >= freeze[0] && t < freeze[1]) ft = freeze[0] + clock; else if (t >= freeze[1]) ft = time - (freeze[1] - freeze[0]); }
      ctx.drawImage(sky, 0, 0);
      const sunY = HZ - 150 + 120 * Math.min(1, Math.max(0, time / 28)), sunR = 205;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HZ); ctx.clip();
      ctx.drawImage(glow, 540 - 600, sunY - 600);
      ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(540, sunY, sunR, 0, Math.PI * 2); ctx.fill();
      for (const [fx, y, w, h] of clouds) {                                   // thin streaks, lit on the side that faces the sun
        const x = ((fx * W + ft * 7) % (W + w)) - w / 2;
        ctx.fillStyle = mix(pal.sky, pal.paper, 0.3); ctx.beginPath(); ctx.ellipse(x, y, w / 2, h, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = mix(pal.sky, pal.paper, 0.55); ctx.beginPath(); ctx.ellipse(x, y + h * 0.45, w / 2.4, h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(0, HZ, W, H - HZ); ctx.clip();      // the sun's long reflection and its glitter
      ctx.globalAlpha = 0.5; ctx.drawImage(glow, 540 - 300, HZ - 80, 600, 900); ctx.globalAlpha = 1;
      ctx.fillStyle = pal.sun;
      for (const q of glints) if (((ft * q.rate + q.ph) % 1) < 0.55) ctx.fillRect(540 + q.dx - q.w / 2, q.y, q.w, 2 + (q.y - HZ) / 110);
      ctx.restore();
      const P = pose ?? poseAt(ft);
      ctx.save(); ctx.translate(0, SH + 14); ctx.scale(1, -0.5); ctx.translate(0, -(SH + 14)); ctx.globalAlpha = 0.42; dancers(ctx, P); ctx.restore();
      ctx.fillStyle = pal.water;
      for (let i = 0; i < 9; i++) { const y = SH + 22 + i * 13, sh = Math.sin(ft * 2.2 + i * 1.7) * 30; ctx.fillRect(130 + sh + (i % 3) * 40, y, 820 - (i % 3) * 80, 3); }
      ctx.fillStyle = pal.ink; ctx.fillRect(100, SH, W - 200, 14);           // the jetty, with two posts into the water
      ctx.fillRect(150, SH, 12, 70); ctx.fillRect(W - 162, SH, 12, 70);
      dancers(ctx, P);
    },
    poseUp: POSES[7],
  };
}
