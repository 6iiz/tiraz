// The lamp-shadows ground: a small theatre. A dark wooden frame holds a cotton screen lit from behind by an oil lamp: brightest in the
// middle, browning toward the edges, with a fine weave and a few soft stains. Pieces of carved, dyed hide hang on the screen above and
// below the stage area (an eave with a scalloped edge and two tassels at the top, a band of carved waves at the bottom); they are laid on
// in multiply, as light through hide, and sway a little on their threads. The lamp flickers at the screen's edges. Below the screen the
// stage boards catch the light that spills under the cloth. Everything is built once; per frame: one picture, the hanging pieces, a gradient.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, flick, mottle } from './motion.js';

export const S = { x0: 36, x1: 1044, y0: 150, y1: 1372 };
const cache = new Map();
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function stage(W, H, P) {
  const key = 'st' + P.screen + P.dark; if (cache.has(key)) return cache.get(key);
  const c = cv(W, H), g = c.getContext('2d'), r = rng(1926), sw = S.x1 - S.x0, sh = S.y1 - S.y0;
  g.fillStyle = P.wood; g.fillRect(0, 0, W, H);
  for (let y = S.y1 + 40; y < H; y += 74) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y, W, 3); }
  g.strokeStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, l = 30 + r() * 120; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 3); g.stroke(); }
  const spill = g.createRadialGradient(W / 2, S.y1, 20, W / 2, S.y1, 560);
  spill.addColorStop(0, rgba(P.screen, 0.16)); spill.addColorStop(1, rgba(P.screen, 0)); g.fillStyle = spill; g.fillRect(0, S.y1, W, H - S.y1);
  // the cloth
  const lit = g.createRadialGradient(W / 2, 760, 60, W / 2, 760, 980);
  lit.addColorStop(0, P.screen); lit.addColorStop(0.5, mix(P.screen, P.edge, 0.3)); lit.addColorStop(1, P.edge);
  g.fillStyle = lit; g.fillRect(S.x0, S.y0, sw, sh);
  g.save(); g.beginPath(); g.rect(S.x0, S.y0, sw, sh); g.clip();
  g.fillStyle = rgba(P.dark, 0.035); for (let y = S.y0; y < S.y1; y += 3) g.fillRect(S.x0, y, sw, 1);
  g.fillStyle = rgba(P.dark, 0.025); for (let x = S.x0; x < S.x1; x += 3) g.fillRect(x, S.y0, 1, sh);
  for (let i = 0; i < 26; i++) { const x = S.x0 + r() * sw, y = S.y0 + r() * sh, R = 60 + r() * 260, gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, rgba(P.dark, 0.03)); gr.addColorStop(1, rgba(P.dark, 0)); g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); }
  for (let i = 0; i < 5000; i++) { g.fillStyle = rgba(P.dark, 0.04 + r() * 0.05); g.fillRect(S.x0 + r() * sw, S.y0 + r() * sh, 1 + r(), 1 + r()); }
  g.restore();
  // the frame: a dark moulding with a thin lit inner edge, and corner brackets
  g.strokeStyle = P.wood2; g.lineWidth = 20; g.strokeRect(S.x0 - 10, S.y0 - 10, sw + 20, sh + 20);
  g.strokeStyle = rgba(P.light, 0.1); g.lineWidth = 2; g.strokeRect(S.x0 - 21, S.y0 - 21, sw + 42, sh + 42);
  g.fillStyle = P.wood2;
  for (const [x, y, sx, sy] of [[S.x0, S.y0, 1, 1], [S.x1, S.y0, -1, 1], [S.x0, S.y1, 1, -1], [S.x1, S.y1, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 54 * sx, y); g.quadraticCurveTo(x + 16 * sx, y + 16 * sy, x, y + 54 * sy); g.closePath(); g.fill();
  }
  cache.set(key, c); return c;
}
// The eave: a strip of hide hanging from the top of the screen, a scalloped lower edge, a row of coin holes and lattice diamonds.
function eave(w, P) {
  const key = 'ev' + w + P.dye; if (cache.has(key)) return cache.get(key);
  const h = 96, c = cv(w, h + 30), g = c.getContext('2d');
  g.fillStyle = P.dye; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 56);
  for (let x = w; x > 0; x -= 56) g.arc(x - 28, 56, 28, 0, Math.PI, false);
  g.closePath(); g.fill(); mottle(g, w, h, 12);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  for (let x = 28; x < w; x += 56) { g.beginPath(); g.arc(x, 62, 9, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 14, 30); g.lineTo(x, 46); g.lineTo(x - 14, 30); g.closePath(); g.fill(); }
  g.globalCompositeOperation = 'source-over'; g.fillStyle = P.rim; g.fillRect(0, 0, w, 6);
  cache.set(key, c); return c;
}
function tassel(P) {
  const key = 'ts' + P.dye; if (cache.has(key)) return cache.get(key);
  const c = cv(60, 200), g = c.getContext('2d');
  g.strokeStyle = P.rim; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 0); g.lineTo(30, 90); g.stroke();
  g.fillStyle = P.dye; g.beginPath(); g.arc(30, 100, 14, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(16, 116); g.lineTo(44, 116); g.lineTo(52, 196); g.lineTo(8, 196); g.closePath(); g.fill(); mottle(g, 60, 200, 7);
  g.globalCompositeOperation = 'destination-out'; for (let x = 14; x <= 46; x += 6) g.fillRect(x, 132, 2, 64);
  g.globalCompositeOperation = 'source-over';
  cache.set(key, c); return c;
}
// The band: carved waves along the bottom of the screen, rows of crescents cut through the hide.
function band(w, P) {
  const key = 'bd' + w + P.dye; if (cache.has(key)) return cache.get(key);
  const h = 118, c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = P.dye; g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) g.lineTo(x, 30 + Math.sin(x / 70) * 12 + Math.sin(x / 23) * 4);
  g.lineTo(w, h); g.closePath(); g.fill(); mottle(g, w, h, 19);
  for (let row = 0; row < 3; row++) for (let x = (row % 2) * 30; x < w + 30; x += 60) {
    const y = 58 + row * 24 + Math.sin(x / 70) * 6, R = 20;
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, R, Math.PI, 0); g.fill();
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = P.dye; g.beginPath(); g.arc(x, y + 7, R - 2, Math.PI, 0); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  cache.set(key, c); return c;
}

// A jointed bird of carved hide, facing left: a body with its tail and head (one piece) and a wing on a rivet (a second piece).
function bird(P) {
  const key = 'bird' + P.dye; if (cache.has(key)) return cache.get(key);
  const b = cv(260, 130), g = b.getContext('2d');
  g.fillStyle = P.dye;
  g.beginPath(); g.ellipse(130, 72, 70, 30, -0.08, 0, Math.PI * 2); g.fill();                         // body
  g.beginPath(); g.moveTo(80, 60); g.quadraticCurveTo(52, 30, 44, 34); g.lineTo(60, 70); g.fill();     // neck
  g.beginPath(); g.arc(44, 32, 15, 0, Math.PI * 2); g.fill();                                         // head
  g.beginPath(); g.moveTo(32, 26); g.lineTo(4, 36); g.lineTo(32, 38); g.fill();                       // beak
  for (const [a, l] of [[-0.35, 74], [-0.1, 86], [0.15, 72]]) { g.save(); g.translate(192, 70); g.rotate(a); g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(l * 0.6, -16, l, -4); g.quadraticCurveTo(l * 0.6, 6, 0, 8); g.fill(); g.restore(); }
  mottle(g, 260, 130, 33);
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(42, 30, 3.5, 0, Math.PI * 2); g.fill();                                       // the eye
  for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(96 + k * 13, 86 - Math.abs(k - 2.5) * 2, 4, 0, Math.PI * 2); g.fill(); }
  for (let k = 0; k < 3; k++) { g.save(); g.translate(124 + k * 22, 62); g.beginPath(); g.arc(0, 0, 9, Math.PI, 0); g.fill(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = P.dye; g.beginPath(); g.arc(0, 4, 8, Math.PI, 0); g.fill(); g.restore(); g.globalCompositeOperation = 'destination-out'; }
  for (const a of [-0.35, -0.1, 0.15]) { g.save(); g.translate(192, 70); g.rotate(a); g.fillRect(16, -1.5, 44, 3); g.restore(); }
  g.globalCompositeOperation = 'source-over';
  const w = cv(140, 70), h = w.getContext('2d'); h.fillStyle = P.dye;
  h.beginPath(); h.moveTo(10, 56); h.quadraticCurveTo(40, 4, 132, 8); h.quadraticCurveTo(96, 30, 110, 40); h.quadraticCurveTo(70, 44, 26, 64); h.closePath(); h.fill(); mottle(h, 140, 70, 34);
  h.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 5; k++) { h.beginPath(); h.moveTo(34 + k * 18, 46 - k * 6); h.lineTo(48 + k * 18, 26 - k * 4); h.lineTo(52 + k * 18, 30 - k * 4); h.lineTo(38 + k * 18, 50 - k * 6); h.fill(); }
  h.globalCompositeOperation = 'source-over'; h.fillStyle = P.rim; h.beginPath(); h.arc(18, 58, 4, 0, Math.PI * 2); h.fill();
  const out = { body: b, wing: w }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), tex = stage(W, H, P), ev = eave(S.x1 - S.x0 + 40, P), ts = tassel(P), bd = band(S.x1 - S.x0 + 60, P), bi = bird(P);
  return {
    P, S,
    // light: an extra glow of the lamp in the middle of the screen (0..1), for the ending
    draw(ctx, t, light = 0) {
      const time = t + clock;
      ctx.drawImage(tex, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); ctx.clip();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(ev, S.x0 - 20 + Math.sin(time * 0.9) * 4, S.y0);
      [[200, 0], [880, 1.7]].forEach(([x, ph]) => { ctx.save(); ctx.translate(x, S.y0 + 74); ctx.rotate(0.06 * Math.sin(time * 1.8 + ph)); ctx.drawImage(ts, -30, 0); ctx.restore(); });
      ctx.drawImage(bd, S.x0 - 30 + Math.sin(time * 0.6) * 10, S.y1 - 118);
      { // the bird crosses low over the waves on its rod, beating its wing
        const L = W + 420, x = W + 140 - ((time * 42 + 300) % L), y = 1262 + Math.sin(time * 1.6) * 10;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time * 1.6 + 1) * 0.04);
        ctx.strokeStyle = rgba(P.dark, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(40, 200); ctx.stroke();
        ctx.drawImage(bi.body, -130, -72);
        ctx.save(); ctx.translate(-12, -14); ctx.rotate(-0.55 * Math.sin(time * 3.4)); ctx.drawImage(bi.wing, -18, -58); ctx.restore();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (light > 0) {
        const gl = ctx.createRadialGradient(W / 2, 640, 20, W / 2, 640, 620);
        gl.addColorStop(0, rgba(P.light, 0.35 * light)); gl.addColorStop(1, rgba(P.light, 0)); ctx.fillStyle = gl; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
      }
      const f = flick(time), gr = ctx.createRadialGradient(W / 2, 780, 300, W / 2, 780, 1000);
      gr.addColorStop(0, rgba(P.dark, 0)); gr.addColorStop(1, rgba(P.dark, 0.05 + 0.07 * f));
      ctx.fillStyle = gr; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
      ctx.restore();
    },
  };
}
