// The stage of an old cartoon short: a painted backdrop in soft grey washes of the brand's two colours (striped wallpaper, a dado rail,
// a checker floor running back to a vanishing point, watercolour blotches and paper grain), framed by a scalloped valance and two drapes
// that sway to the two-beat swing, on twos. The backdrop is painted once per palette; only the drapes are drawn each frame.
import { rng, rgba, span } from '/engine/kit.js';
import { palette, twos } from './motion.js';

const cache = new Map();
function paint(W, H, P, T) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), r = rng(1931), S = T.stage;
  g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
  // wallpaper: paired stripes with a small diamond between them
  for (let x = 30; x < W; x += 96) {
    g.fillStyle = P.wash; g.fillRect(x, 0, 6, S.rail); g.fillRect(x + 14, 0, 2, S.rail);
    for (let y = 70; y < S.rail - 20; y += 120) { g.beginPath(); g.moveTo(x + 56, y - 9); g.lineTo(x + 64, y); g.lineTo(x + 56, y + 9); g.lineTo(x + 48, y); g.closePath(); g.fill(); }
  }
  // watercolour blotches, the hand of the background painter
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * H, rad = 90 + r() * 260, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(P.dark, 0.035 + r() * 0.03)); gr.addColorStop(1, rgba(P.dark, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  }
  // dado rail and the wainscot below it
  g.fillStyle = P.wash2; g.fillRect(0, S.rail, W, S.floor - S.rail);
  g.fillStyle = P.ink; g.fillRect(0, S.rail - 3, W, 5); g.fillRect(0, S.rail + 14, W, 2);
  for (let x = 60; x < W; x += 180) { g.strokeStyle = rgba(P.dark, 0.35); g.lineWidth = 2; g.strokeRect(x, S.rail + 30, 120, S.floor - S.rail - 48); }
  // checker floor in perspective
  const vx = W / 2, vy = S.floor - 520, n = 14, xs = []; for (let i = -n; i <= n; i++) xs.push(vx + i * 150);
  const ys = []; for (let k = 0, y = S.floor; y < H + 60; k++) { ys.push(y); y += 26 + k * 16; }
  const at = (X, y) => vx + (X - vx) * (y - vy) / (H - vy);
  for (let k = 0; k < ys.length - 1; k++) for (let i = 0; i < xs.length - 1; i++) {
    g.fillStyle = (i + k) % 2 ? P.wash2 : P.paper;
    g.beginPath(); g.moveTo(at(xs[i], ys[k]), ys[k]); g.lineTo(at(xs[i + 1], ys[k]), ys[k]); g.lineTo(at(xs[i + 1], ys[k + 1]), ys[k + 1]); g.lineTo(at(xs[i], ys[k + 1]), ys[k + 1]); g.closePath(); g.fill();
  }
  g.fillStyle = P.ink; g.fillRect(0, S.floor - 2, W, 4);
  // paper grain
  for (let i = 0; i < 9000; i++) { g.fillStyle = rgba(r() < 0.5 ? P.dark : P.light, T.tone.grain * (0.4 + r())); g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  return cv;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), id = P.paper + P.dark + P.accent;
  if (!cache.has(id)) cache.set(id, paint(W, H, P, T));
  const back = cache.get(id), floor = T.stage.floor;
  // a drape on one side: hangs from the top, gathered at a tie-back, flaring to the floor; sway moves its free edge
  const drape = (ctx, side, sway) => {
    const X = (x) => (side < 0 ? x : W - x);
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(150), 0);
    ctx.bezierCurveTo(X(130 + sway), 420, X(52 + sway * 0.6), 900, X(44), 1180);
    ctx.bezierCurveTo(X(70), 1260, X(110 + sway * 0.5), 1360, X(128 + sway * 0.4), floor);
    ctx.lineTo(X(0), floor); ctx.closePath();
    ctx.fillStyle = P.drape; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = rgba(P.dark, 0.45); ctx.lineWidth = 3;
    for (const f of [0.3, 0.6]) { ctx.beginPath(); ctx.moveTo(X(150 * f), 6); ctx.bezierCurveTo(X(130 * f + sway * f), 500, X(40 * f), 1000, X(30 * f), 1180); ctx.stroke(); }
    ctx.fillStyle = P.accent; ctx.beginPath(); ctx.ellipse(X(44), 1190, 26, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  };
  return {
    P, floor,
    draw(ctx, t) {
      const time = twos(t + clock), sway = 10 * Math.sin(Math.PI * time / T.beat);
      ctx.drawImage(back, 0, 0);
      drape(ctx, -1, sway); drape(ctx, 1, -sway);
      // the valance: a scalloped band across the top
      const vb = 150 + 4 * Math.sin(Math.PI * time / T.beat + 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, vb);
      for (let x = W, k = 0; x > -1; x -= 90, k++) ctx.arc(x - 45, vb, 45, 0, Math.PI, false);
      ctx.closePath(); ctx.fillStyle = P.drape; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = rgba(P.dark, 0.35); ctx.fillRect(0, 36, W, 6);
    },
  };
}
export { span };
