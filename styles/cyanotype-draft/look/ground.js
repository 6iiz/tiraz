// The cyanotype ground: a sheet of the brand's light colour as rag paper (faint fibres), brushed with the light-sensitive coating
// and exposed: a deep field in the print colour with dry-brush edges, uneven density (darker pools, paler streaks along the brush),
// and white specks where the coating skipped. On it the photograms that were exposed with it: a fern frond rising from the lower
// corner and a single leaf in the upper corner, and a thin drawing border with a title block. All of it is painted once; while a
// scene holds, the frond sways a fraction of a degree and a faint patch of light drifts over the sheet, as if the print were
// still lying in the sun.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette, leaf } from './motion.js';

export const SHEET = { x0: 28, x1: 1052, y0: 118, y1: 1500 };

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), S = SHEET, r = rng(1842);
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const c = base.getContext('2d');
  // paper and fibres
  c.fillStyle = pal.paper; c.fillRect(0, 0, W, H);
  c.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 22;
    c.strokeStyle = rgba(pal.fibre, 0.25 + r() * 0.35); c.lineWidth = 0.6 + r();
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  // the coated field, on its own canvas so the texture can be laid only where the coating is
  const coat = document.createElement('canvas'); coat.width = W; coat.height = H;
  const g = coat.getContext('2d');
  const noise = (seed) => { const q = rng(seed), k = []; for (let i = 0; i < 9; i++) k.push([q() * 0.02 + 0.004, q() * 6.28, q()]); return (v) => k.reduce((s, [f, ph, a]) => s + Math.sin(v * f + ph) * a, 0) / 3; };
  const nl = noise(3), nr = noise(5), nt = noise(8), nb = noise(13);
  g.fillStyle = pal.coat; g.beginPath();
  for (let y = S.y0; y <= S.y1; y += 6) g.lineTo(S.x0 + 10 * nl(y) + (r() - 0.5) * 3, y);
  for (let x = S.x0; x <= S.x1; x += 6) g.lineTo(x, S.y1 + 16 * nb(x) + (r() - 0.5) * 3);
  for (let y = S.y1; y >= S.y0; y -= 6) g.lineTo(S.x1 + 10 * nr(y) + (r() - 0.5) * 3, y);
  for (let x = S.x1; x >= S.x0; x -= 6) g.lineTo(x, S.y0 + 16 * nt(x) + (r() - 0.5) * 3);
  g.closePath(); g.fill();
  // dry-brush bristles running out past the top and bottom edges (the brush went across the sheet, up and down)
  for (let i = 0; i < 240; i++) {
    const x = S.x0 + r() * (S.x1 - S.x0), top = r() < 0.5, l = 3 + r() ** 3 * 24, y = top ? S.y0 + 16 * nt(x) + 4 : S.y1 + 16 * nb(x) - 4;
    g.strokeStyle = rgba(pal.coat, 0.2 + r() * 0.45); g.lineWidth = 0.8 + r() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + (top ? -l : l)); g.stroke();
  }
  for (let i = 0; i < 160; i++) {
    const y = S.y0 + r() * (S.y1 - S.y0), left = r() < 0.5, l = 3 + r() ** 3 * 18, x = left ? S.x0 + 10 * nl(y) + 3 : S.x1 + 10 * nr(y) - 3;
    g.strokeStyle = rgba(pal.coat, 0.3 + r() * 0.5); g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (left ? -l : l), y + (r() - 0.5) * 3); g.stroke();
  }
  // uneven density: pools and pale streaks, only where the coating is
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 70; i++) {
    const x = S.x0 + r() * (S.x1 - S.x0), y = S.y0 + r() * (S.y1 - S.y0), rad = 80 + r() * 260, col = r() < 0.55 ? pal.deep : pal.wet;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(col, 0.16 + r() * 0.14)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 260; i++) {
    const y = S.y0 + r() * (S.y1 - S.y0), x = S.x0 + r() * (S.x1 - S.x0) * 0.6, l = 120 + r() * 520;
    g.strokeStyle = rgba(r() < 0.5 ? pal.wet : pal.deep, 0.05 + r() * 0.08); g.lineWidth = 2 + r() * 9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 10); g.stroke();
  }
  for (let i = 0; i < 520; i++) { g.fillStyle = rgba(pal.white, 0.12 + r() * 0.45); g.beginPath(); g.arc(S.x0 + r() * (S.x1 - S.x0), S.y0 + r() * (S.y1 - S.y0), 0.6 + r() ** 3 * 2.6, 0, 6.283); g.fill(); }
  // the drawing border and the title block (thin white drafting lines, no words)
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = rgba(pal.white, 0.42); g.lineWidth = 2; g.strokeRect(54, 150, W - 108, S.y1 - 186);
  g.lineWidth = 1; g.strokeRect(62, 158, W - 124, S.y1 - 202);
  const tb = { x: W - 62 - 330, y: S.y1 - 44 - 110, w: 330, h: 110 };
  g.strokeStyle = rgba(pal.white, 0.38); g.strokeRect(tb.x, tb.y, tb.w, tb.h);
  g.beginPath(); g.moveTo(tb.x, tb.y + 40); g.lineTo(tb.x + tb.w, tb.y + 40); g.moveTo(tb.x + 120, tb.y + 40); g.lineTo(tb.x + 120, tb.y + tb.h);
  g.moveTo(tb.x + 120, tb.y + 75); g.lineTo(tb.x + tb.w, tb.y + 75); g.stroke();
  c.drawImage(coat, 0, 0);
  // photograms
  const frond = leaf(270, 77, pal.white, 'frond'), sprig = leaf(150, 21, pal.white, 'leaf');
  const halo = (img) => { const h = document.createElement('canvas'); h.width = img.width + 40; h.height = img.height + 40; const k = h.getContext('2d'); k.filter = 'blur(6px)'; k.globalAlpha = 0.5; k.drawImage(img, 20, 20); k.filter = 'none'; k.globalAlpha = 0.92; k.drawImage(img, 20, 20); return h; };
  const F = halo(frond), L = halo(sprig);
  const light = document.createElement('canvas'); light.width = 900; light.height = 900;
  { const k = light.getContext('2d'), gr = k.createRadialGradient(450, 450, 0, 450, 450, 450); gr.addColorStop(0, rgba(pal.white, 0.07)); gr.addColorStop(1, rgba(pal.white, 0)); k.fillStyle = gr; k.fillRect(0, 0, 900, 900); }
  const rtl = brand.dir !== 'ltr';
  const fx = rtl ? 150 : W - 150, fy = S.y1 - 50, lx = rtl ? W - 200 : 200, ly = 210;
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(S.x0 - 30, S.y0 - 30, S.x1 - S.x0 + 60, S.y1 - S.y0 + 60); ctx.clip();
      ctx.drawImage(light, 140 + Math.sin(time * 0.21) * 220 - 450, 760 + Math.cos(time * 0.17) * 300 - 450);
      ctx.save(); ctx.translate(fx, fy); ctx.rotate((rtl ? 0.32 : -0.32) + Math.sin(time * 0.9) * 0.012); ctx.drawImage(F, -F.width / 2, -F.height + 20); ctx.restore();
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.sin(time * 0.7 + 1) * 0.02); ctx.drawImage(L, -L.width / 2, -L.height / 2); ctx.restore();
      ctx.restore();
    },
  };
}
