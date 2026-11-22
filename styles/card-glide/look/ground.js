// The card-glide ground: a desk in low warm sunlight. Long planks with a soft grain, two blurred window-light patches, a dotted paper
// mat in the middle where the cards lie, and a few plain desk things at the edges (a pencil, a sticky note, a mug seen from above),
// each with the same long shadow down and to the right. Built once into one canvas; it wanders slowly with the reel's clock, so the
// one take never restarts at a cut. Draw it inside the scene's camera.
import { rng, rr, mix } from '/engine/kit.js';
import { tones } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = tones(brand, T), pad = 260, CW = W + pad * 2, CH = H + pad * 2;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'), r = rng(2417);
  // planks and grain
  g.fillStyle = P.desk; g.fillRect(0, 0, CW, CH);
  for (let y = 0, k = 0; y < CH; y += 210, k++) {
    g.fillStyle = mix(P.desk, k % 2 ? P.light : P.dark, 0.035); g.fillRect(0, y, CW, 210);
    g.fillStyle = P.plank; g.fillRect(0, y, CW, 3);
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = mix(P.desk, P.dark, 0.05 + r() * 0.05); g.lineWidth = 1 + r() * 2; g.beginPath();
      const yy = y + 20 + r() * 170, a = r() * 6, f = 0.002 + r() * 0.004; g.moveTo(0, yy);
      for (let x = 0; x <= CW; x += 40) g.lineTo(x, yy + Math.sin(x * f + a) * 6);
      g.stroke();
    }
  }
  // window light: two soft four-pane patches of the paper colour
  g.save(); g.filter = 'blur(30px)'; g.globalAlpha = 0.5; g.fillStyle = P.light;
  for (const [x, y] of [[pad + 640, pad - 120], [pad - 60, pad + H - 330]]) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    g.beginPath(); g.moveTo(x + i * 190 + j * 90, y + j * 150); g.lineTo(x + i * 190 + j * 90 + 170, y + j * 150); g.lineTo(x + i * 190 + j * 90 + 230, y + j * 150 + 135); g.lineTo(x + i * 190 + j * 90 + 60, y + j * 150 + 135); g.fill();
  }
  g.restore();
  const shadowed = (fn, lift = 18) => { g.save(); g.shadowColor = P.shade(0.24); g.shadowBlur = 18; g.shadowOffsetX = lift * 0.85; g.shadowOffsetY = lift * 1.15; fn(); g.restore(); fn(); };
  // the mat: a dotted paper sheet, its size a whole number of dot steps
  const step = T.dot, mx = pad - 40, my = pad + 150, mw = Math.round((W + 80) / step) * step, mh = Math.round(1330 / step) * step;
  shadowed(() => { g.fillStyle = P.light; rr(g, mx, my, mw, mh, 18); g.fill(); }, 12);
  g.fillStyle = P.dot; for (let y = my + step / 2; y < my + mh; y += step) for (let x = mx + step / 2; x < mx + mw; x += step) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  // desk things, at the edges only
  const bot = pad + 1480;
  shadowed(() => { g.save(); g.translate(pad + 120, bot + 140); g.rotate(-0.22); g.fillStyle = P.accent; rr(g, 0, 0, 430, 26, 12); g.fill();
    g.fillStyle = mix(P.accent, P.light, 0.55); g.beginPath(); g.moveTo(430, 0); g.lineTo(480, 13); g.lineTo(430, 26); g.fill();
    g.fillStyle = P.dark; g.beginPath(); g.moveTo(466, 9); g.lineTo(480, 13); g.lineTo(466, 17); g.fill(); g.restore(); }, 14);
  shadowed(() => { g.save(); g.translate(pad + W - 250, bot + 40); g.rotate(0.12); g.fillStyle = mix(P.accent, P.light, 0.62); g.fillRect(0, 0, 210, 210);
    g.fillStyle = mix(P.accent, P.light, 0.4); for (let i = 0; i < 3; i++) g.fillRect(28, 60 + i * 42, 150 - i * 30, 10); g.restore(); }, 8);
  shadowed(() => { g.fillStyle = mix(P.light, P.dark, 0.18); g.beginPath(); g.arc(pad + W - 120, pad + 40, 120, 0, Math.PI * 2); g.fill(); }, 40);
  g.fillStyle = mix(P.dark, P.accent, 0.25); g.beginPath(); g.arc(pad + W - 120, pad + 40, 96, 0, Math.PI * 2); g.fill();
  g.fillStyle = mix(P.light, P.dark, 0.18); g.fillRect(pad + W - 250, pad + 30, 40, 22);
  return {
    pal: P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(c, -pad + Math.sin(time * 0.09) * 70, -pad + Math.cos(time * 0.06) * 50 - 50);
    },
  };
}
