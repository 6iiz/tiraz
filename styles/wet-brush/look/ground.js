// The wet brush ground: a sheet of warm cotton paper in the brand's lighter colour, with the soft tooth of cold-pressed paper, and two
// washes already on it: a pale bloom of the pigment (the accent) breaking in from the top corner on the far side, and at the foot of the
// frame, below the safe area, a wide graded wash of pigment and ink laid wet-in-wet, its top edge drying in a ragged line. In the first
// second the washes spread out from nothing; after that they keep creeping outward very slowly, as wet paint does. Built once per brand.
import { span, rng, rgba } from '/engine/kit.js';
import { palette, bloomSprite, E } from './motion.js';

const cache = new Map();
function build(W, H, pal, T) {
  const key = pal.paper + pal.ink + pal.accent; if (cache.has(key)) return cache.get(key);
  const r = rng(2024);
  const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
  const g = paper.getContext('2d');
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  // cold-press tooth: a tile of soft pits and bumps, repeated
  const tile = document.createElement('canvas'); tile.width = tile.height = 192;
  const tg = tile.getContext('2d');
  for (let i = 0; i < 700; i++) { const x = r() * 192, y = r() * 192, s = 1.5 + r() * 4; tg.fillStyle = rgba(r() < 0.6 ? pal.ink : '#ffffff', 0.01 + r() * 0.02); tg.beginPath(); tg.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); tg.fill(); }
  g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H, rad = 200 + r() * 300, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(pal.ink, 0.018)); gr.addColorStop(1, rgba(pal.ink, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  // the corner bloom
  const corner = bloomSprite(330, pal.accent, T.tone.field * 1.4, 5);
  // the wash at the foot: three graded glazes, ragged at the top
  const foot = document.createElement('canvas'); foot.width = W; foot.height = 720;
  const f = foot.getContext('2d');
  const layer = (color, a, y0, seed) => {
    const q = rng(seed); f.fillStyle = rgba(color, a); f.beginPath(); f.moveTo(-20, 720);
    let y = y0; for (let x = -20; x <= W + 20; x += 14) { y += (q() - 0.5) * 18; y = Math.max(y0 - 40, Math.min(y0 + 40, y)); f.lineTo(x, y + Math.sin(x / 90 + seed) * 14); }
    f.lineTo(W + 20, 720); f.closePath(); f.fill(); f.strokeStyle = rgba(color, a * 1.4); f.lineWidth = 2; f.stroke();
  };
  layer(pal.accent, 0.14, 120, 3); layer(pal.accent, 0.12, 260, 4); layer(pal.ink, 0.08, 330, 7); layer(pal.ink, 0.1, 470, 8);
  for (let i = 0; i < 16; i++) {                         // backruns: soft, uneven pale patches where water ran back into the wash
    const x = r() * W, y = 260 + r() * 380, rad = 40 + r() * 90, gr = f.createRadialGradient(x, y, rad * 0.2, x, y, rad);
    gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.8, 'rgba(0,0,0,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    f.globalCompositeOperation = 'destination-out'; f.save(); f.translate(x, y); f.scale(1.6, 0.7); f.translate(-x, -y); f.fillStyle = gr; f.fillRect(x - rad, y - rad, rad * 2, rad * 2); f.restore();
  }
  f.globalCompositeOperation = 'source-over';
  const out = { paper, corner, foot }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand), L = build(W, H, pal, T), rtl = brand.dir !== 'ltr';
  return {
    pal, paper: pal.paper, ink: pal.ink,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(L.paper, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      const pc = E(span(time, -0.5, 0.9)), creep = 1 + Math.min(time, 40) * 0.0012;
      if (pc > 0) {
        const s = (0.55 + 0.45 * pc) * creep, c = L.corner, cx = rtl ? -60 : W + 60, cy = -40, sz = c.cv.width * s;
        ctx.globalAlpha = pc; ctx.drawImage(c.cv, cx - sz / 2, cy - sz / 2, sz, sz);
      }
      const pf = E(span(time, -0.3, 1.1));
      if (pf > 0) { ctx.globalAlpha = pf; const rise = (1 - pf) * 160 - Math.sin(time * 0.4) * 6 - Math.min(time, 40) * 0.6; ctx.drawImage(L.foot, 0, H - 720 + 40 + rise); }
      ctx.restore();
    },
  };
}
