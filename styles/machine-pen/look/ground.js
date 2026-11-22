// The machine-pen ground: a sheet of paper (the lighter brand colour) clamped on a flatbed plotter, seen from straight above. Two
// steel rails run down the frame's edges; a plotted border, corner registration crosses and an empty title block are already on the
// sheet. The gantry (a see-through beam of two bars, a carriage and the pen in it) and the pen rack are drawn by `machine()`, which
// every part calls last with the pen's state. Paper grain is built once.
import { rng, rgba } from '/engine/kit.js';
import { inks } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, K = inks(brand, T), rail = T.rail;
  const grain = document.createElement('canvas'); grain.width = W; grain.height = H;
  const g = grain.getContext('2d'), r = rng(4417);
  for (let i = 0; i < 18000; i++) { g.fillStyle = rgba(K.ink, 0.018 + r() * 0.03); g.fillRect(r() * W, r() * H, 1 + r() * 1.6, 1 + r() * 1.6); }
  g.lineCap = 'round';
  for (let i = 0; i < 140; i++) {               // a few paper fibres
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 8 + r() * 26;
    g.strokeStyle = rgba(K.ink, 0.035 + r() * 0.03); g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // what is already plotted on the sheet: border, registration crosses, title block
  const m = rail + 26;
  g.strokeStyle = K.rule; g.lineWidth = 2; g.strokeRect(m, 64, W - 2 * m, H - 128);
  g.lineWidth = 1; g.strokeRect(m + 10, 74, W - 2 * m - 20, H - 148);
  for (const [x, y] of [[m + 34, 98], [W - m - 34, 98], [m + 34, H - 98], [W - m - 34, H - 98]]) {
    g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.moveTo(x, y - 16); g.lineTo(x, y + 16); g.stroke();
    g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
  }
  const tb = { x0: W - m - 10 - 420, x1: W - m - 10, y0: H - 74 - 150, y1: H - 74 };
  if (brand.dir === 'ltr') { tb.x0 = m + 10; tb.x1 = m + 10 + 420; }
  g.strokeRect(tb.x0, tb.y0, tb.x1 - tb.x0, tb.y1 - tb.y0);
  g.beginPath(); g.moveTo(tb.x0, tb.y0 + 50); g.lineTo(tb.x1, tb.y0 + 50); g.moveTo(tb.x0, tb.y0 + 100); g.lineTo(tb.x1, tb.y0 + 100);
  g.moveTo(tb.x0 + 140, tb.y0); g.lineTo(tb.x0 + 140, tb.y1); g.moveTo(tb.x0 + 280, tb.y0 + 50); g.lineTo(tb.x0 + 280, tb.y1); g.stroke();

  const park = { x: W / 2, y: T.park };
  const rack = [{ pen: 'ink', x: W / 2 - 70 }, { pen: 'grey', x: W / 2 }, { pen: 'accent', x: W / 2 + 70 }];
  const colorOf = (p) => (p === 'accent' ? K.accent : p === 'grey' ? K.grey : K.ink);
  return {
    K, park, tb, colorOf,
    draw(ctx, t) {
      ctx.fillStyle = K.paper; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(grain, 0, 0);
      this.rails(ctx);
    },
    // the bed's steel rails at the frame's edges, outside the sheet
    rails(ctx) {
      for (const x of [0, W - rail]) {
        ctx.fillStyle = K.steel; ctx.fillRect(x, 0, rail, H);
        ctx.fillStyle = rgba(K.paper, 0.22); ctx.fillRect(x + rail * 0.3, 0, 3, H);
        ctx.fillStyle = rgba('#000000', 0.12); ctx.fillRect(x === 0 ? rail : x - 6, 0, 6, H);
      }
    },
    // the gantry at the pen's height, its carriage at the pen, and the rack of pens (the stall of the pen in use is empty)
    machine(ctx, s) {
      const y = s.y, x = s.x;
      ctx.save();
      // rack, top of the sheet
      ctx.fillStyle = K.steel; ctx.fillRect(W / 2 - 112, T.rackY - 26, 224, 52);
      for (const st of rack) {
        ctx.fillStyle = rgba(K.paper, 0.2); ctx.beginPath(); ctx.arc(st.x, T.rackY, 19, 0, Math.PI * 2); ctx.fill();
        if (s.pen !== st.pen) { ctx.fillStyle = colorOf(st.pen); ctx.beginPath(); ctx.arc(st.x, T.rackY, 14, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = rgba(K.paper, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(st.x, T.rackY, 14, 0, Math.PI * 2); ctx.stroke(); }
      }
      // beam shadow, beam (two bars with a gap you see the sheet through), end blocks on the rails
      ctx.fillStyle = rgba('#000000', 0.08); ctx.fillRect(0, y - 20 + 10, W, 6); ctx.fillRect(0, y + 14 + 10, W, 6);
      ctx.fillStyle = K.steel; ctx.fillRect(0, y - 20, W, 6); ctx.fillRect(0, y + 14, W, 6);
      for (const bx of [0, W - rail - 6]) ctx.fillRect(bx, y - 30, rail + 6, 60);
      // carriage
      const cw = 74, ch = 64, lift = s.down ? 0 : 4;
      ctx.fillStyle = rgba('#000000', s.down ? 0.12 : 0.18); ctx.fillRect(x - cw / 2 + 6 + lift, y - ch / 2 + 8 + lift, cw, ch);
      ctx.fillStyle = K.steel; ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch);
      ctx.strokeStyle = rgba(K.paper, 0.35); ctx.lineWidth = 2; ctx.strokeRect(x - cw / 2 + 5, y - ch / 2 + 5, cw - 10, ch - 10);
      if (s.pen !== 'none') {
        ctx.fillStyle = colorOf(s.pen); ctx.beginPath(); ctx.arc(x, y, s.down ? 13 : 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(K.paper, 0.85); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, s.down ? 13 : 15, 0, Math.PI * 2); ctx.stroke();
      } else { ctx.strokeStyle = rgba(K.paper, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
  };
}
