// The floating-world ground: one woodblock sheet. Washi paper in the brand's lighter colour with long fibres; at the head a sky printed
// in the accent and wiped away by hand (bokashi) along an uneven edge, with the wood's grain showing in it; at the foot, below the safe
// area, rows of scalloped waves cut as key lines over two printed blues of the accent; a heavy and a fine border around the sheet.
// Two bands of mist drift slowly across, one in the sky and one over the water, so a held line is never a still frame.
// Paper, sky and waves are built once per brand and kept; only the drift uses time (`clock`, so a cut does not restart it).
import { mix, rgba, rng, clamp } from '/engine/kit.js';
import { palette, rgbOf, mist } from './motion.js';

const made = new Map();
function build(W, H, P, T) {
  const key = [W, H, P.paper, P.ink, P.accent].join();
  if (made.has(key)) return made.get(key);
  const r = rng(1760);
  // fibres and specks of the paper
  const fib = document.createElement('canvas'); fib.width = W; fib.height = H;
  const g = fib.getContext('2d');
  for (let i = 0; i < 7000; i++) {
    const x = r() * W, y = r() * H, a = (r() - 0.5) * 1.2, l = 6 + r() * 26;
    g.strokeStyle = rgba(r() < 0.75 ? P.ink : P.accent, T.tone.fibre * (0.3 + r())); g.lineWidth = 0.5 + r() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 5000; i++) { g.fillStyle = rgba(P.ink, 0.05 + r() * 0.07); g.fillRect(r() * W, r() * H, 1 + r() * 1.4, 1 + r() * 1.4); }
  // the sky: accent wiped to nothing by y ≈ 240, along an edge that wanders, with grain lines through it
  const SH = 260, sky = document.createElement('canvas'); sky.width = W; sky.height = SH;
  const sg = sky.getContext('2d'), img = sg.createImageData(W, SH), [ar, ag, ab] = rgbOf(P.accent);
  const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
  for (let x = 0; x < W; x++) {
    const depth = 150 + 26 * Math.sin(x * 0.006 + ph[0]) + 14 * Math.sin(x * 0.017 + ph[1]) + 6 * Math.sin(x * 0.045 + ph[2]);
    for (let y = 0; y < SH; y++) {
      const u = clamp(y / depth), s = u * u * (3 - 2 * u);
      const grain = 0.9 + 0.1 * Math.sin(y * 0.42 + 3 * Math.sin(x * 0.008 + ph[3]) + Math.sin(x * 0.031));
      const i = (y * W + x) * 4; img.data[i] = ar; img.data[i + 1] = ag; img.data[i + 2] = ab; img.data[i + 3] = Math.round(255 * 0.92 * (1 - s) * grain);
    }
  }
  sg.putImageData(img, 0, 0);
  sg.globalCompositeOperation = 'destination-out';                  // specks where the block took no ink
  for (let i = 0; i < 900; i++) { sg.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`; sg.fillRect(r() * W, r() * 180, 1 + r() * 2, 1 + r() * 2); }
  // the waves: rows of scallops, each row a printed band under a key line, with two finer arcs inside every scallop
  const per = 132, rad = per / 2, WH = 560, wav = document.createElement('canvas'); wav.width = W + per; wav.height = WH;
  const wg = wav.getContext('2d');
  for (let row = 0; row < 10; row++) {
    const yy = 40 + row * 58, off = (row % 2) * rad;
    wg.fillStyle = row % 2 ? P.wave : P.deep;
    wg.beginPath(); wg.moveTo(-per, WH);
    for (let cx = -per + off; cx < W + 2 * per; cx += per) wg.arc(cx + rad, yy + rad, rad, Math.PI, 0);
    wg.lineTo(W + 2 * per, WH); wg.closePath(); wg.fill();
    wg.strokeStyle = P.ink; wg.lineWidth = 3;
    wg.beginPath(); for (let cx = -per + off; cx < W + 2 * per; cx += per) { wg.moveTo(cx, yy + rad); wg.arc(cx + rad, yy + rad, rad, Math.PI, 0); } wg.stroke();
    wg.lineWidth = 1.3;
    for (const k of [0.68, 0.38]) { wg.beginPath(); for (let cx = -per + off; cx < W + 2 * per; cx += per) { wg.moveTo(cx + rad - rad * k, yy + rad); wg.arc(cx + rad, yy + rad, rad * k, Math.PI, 0); } wg.stroke(); }
    wg.fillStyle = P.paper;                                          // foam on the crests
    for (let cx = -per + off; cx < W + 2 * per; cx += per) { wg.beginPath(); wg.arc(cx + rad, yy + 3, 4, 0, Math.PI * 2); wg.fill(); }
  }
  // two ridges of hills between the text and the sea: far ones in a pale grey block, near ones a step darker under a key line
  const RH = 300, hills = document.createElement('canvas'); hills.width = W; hills.height = RH;
  const hg = hills.getContext('2d'), ridge = (base, amp, f, ph0) => (x) => base - amp * (0.55 * Math.sin(x * f + ph0) + 0.3 * Math.sin(x * f * 2.3 + ph0 * 1.7) + 0.15 * Math.sin(x * f * 5.1 + ph0 * 0.6));
  for (const [fn, col, key] of [[ridge(150, 90, 0.0052, r() * 6), P.far, false], [ridge(220, 60, 0.0081, r() * 6), P.near, true]]) {
    hg.beginPath(); hg.moveTo(0, RH); for (let x = 0; x <= W; x += 6) hg.lineTo(x, fn(x)); hg.lineTo(W, RH); hg.closePath();
    const gr = hg.createLinearGradient(0, 40, 0, RH); gr.addColorStop(0, col); gr.addColorStop(1, rgba(col, 0.35)); hg.fillStyle = gr; hg.fill();
    if (key) { hg.strokeStyle = P.ink; hg.lineWidth = 2.6; hg.beginPath(); for (let x = 0; x <= W; x += 6) (x ? hg.lineTo : hg.moveTo).call(hg, x, fn(x)); hg.stroke(); }
  }
  const out = { fib, sky, wav, per, WH, hills, RH };
  made.set(key, out);
  return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), B = build(W, H, P, T), rtl = brand.dir !== 'ltr';
  const dir = rtl ? 1 : -1;
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(B.sky, 0, 0);
      // mist in the sky, drifting
      const m1 = ((time * 16 * dir) % (W + 900) + (W + 900)) % (W + 900) - 700;
      mist(ctx, m1, 196, 700, 34, P.paper, 0.9);
      const m3 = ((time * 9 * dir + 600) % (W + 600) + (W + 600)) % (W + 600) - 420;
      mist(ctx, m3, 142, 420, 22, P.paper, 0.7);
      // the sea below the safe area, rolling slowly toward the reading direction
      ctx.drawImage(B.hills, 0, H - B.WH + 60 - B.RH + 60);
      const wy = H - B.WH + 40, sx = ((time * 22 * dir) % B.per + B.per) % B.per;
      ctx.drawImage(B.wav, sx - B.per, wy);
      const m2 = ((time * 11 * -dir) % (W + 1000) + (W + 1000)) % (W + 1000) - 800;
      mist(ctx, m2, wy + 34, 800, 40, P.mist, 0.95);
      ctx.drawImage(B.fib, 0, 0);
      // the border of the sheet: a heavy key line and a hairline inside it
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.strokeRect(26, 26, W - 52, H - 52);
      ctx.lineWidth = 1.5; ctx.strokeRect(40, 40, W - 80, H - 80);
    },
  };
}
