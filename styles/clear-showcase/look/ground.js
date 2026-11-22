// The clear-showcase ground: an endless dark-field studio. The darkest brand colour pushed towards black, a wide soft grey bloom behind
// where the glass floats (it separates the rim from the dark), and the sweep: a tall soft strip that crosses the back of the studio
// once every few seconds, very faint on the ground and bright only where it is seen through glass. No floor line, no horizon.
import { rgba, mix } from '/engine/kit.js';
import { tones, sweepX } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = tones(brand, T);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = P.field; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W / 2, 560, 40, W / 2, 620, 1000);
  rg.addColorStop(0, rgba(mix(P.field, P.light, 0.16), 1)); rg.addColorStop(0.55, rgba(mix(P.field, P.light, 0.05), 1)); rg.addColorStop(1, rgba(P.field, 1));
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const strip = document.createElement('canvas'); strip.width = 400; strip.height = 8; const s = strip.getContext('2d');
  const sg = s.createLinearGradient(0, 0, 400, 0); sg.addColorStop(0, rgba(P.light, 0)); sg.addColorStop(0.5, rgba(P.light, 0.05)); sg.addColorStop(1, rgba(P.light, 0));
  s.fillStyle = sg; s.fillRect(0, 0, 400, 8);
  return {
    pal: P,
    sweep: (t) => sweepX(t + clock, W, T.period),
    draw(ctx, t) {
      ctx.drawImage(c, 0, 0);
      const x = sweepX(t + clock, W, T.period); if (x !== null) ctx.drawImage(strip, x - 200, 0, 400, H);
    },
  };
}
