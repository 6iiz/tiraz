// The ops-wall ground: a whiteboard in the brand's lighter colour. Window light falls off across it, a soft reflection slides very
// slowly over the enamel, and ghosts of earlier, wiped-out work (boxes, arrows, a scribbled line or two) sit faintly under everything.
// Its frame runs along the top and the marker tray along the foot, holding three markers and an eraser, both outside the safe area.
// No side frame: the camera pans along one continuous wall between scenes. Built once; the reflection and a slight drift use `clock`.
import { rgba, rng, mix } from '/engine/kit.js';
import { palette, line, loop, head } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), rtl = brand.dir !== 'ltr';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const [base, b] = mk(W, H), r = rng(808);
  b.fillStyle = P.board; b.fillRect(0, 0, W, H);
  const f = b.createLinearGradient(rtl ? W : 0, 0, rtl ? 0 : W, 0);                      // the window is on the reading side
  f.addColorStop(0, rgba(P.ink, 0)); f.addColorStop(1, rgba(P.ink, T.tone.falloff)); b.fillStyle = f; b.fillRect(0, 0, W, H);
  // ghosts of earlier work
  const ghost = (pts, w) => { b.strokeStyle = P.ghost; b.lineWidth = w; b.lineCap = 'round'; b.lineJoin = 'round'; b.beginPath(); pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y))); b.stroke(); };
  ghost(loop(250, 330, 150, 60, 11), 9);
  ghost(line([620, 1120], [940, 1010], 12, 6), 8); ghost(head([620, 1120], [940, 1010], 30), 8);
  for (let i = 0; i < 4; i++) { const y = 1330 + i * 44 + r() * 10, x = 120 + r() * 200; ghost(line([x, y], [x + 260 + r() * 260, y + (r() - 0.5) * 12], 20 + i, 4), 7); }
  ghost([[700, 1450], [980, 1450], [980, 1600], [700, 1600], [700, 1450]], 6);
  b.save(); b.globalAlpha = 0.5; ghost(line([90, 560], [90, 1180], 41, 5), 14); b.restore();
  // the frame along the top, the tray along the foot
  b.fillStyle = P.frame; b.fillRect(0, 0, W, 26); b.fillStyle = rgba('#ffffff', 0.35); b.fillRect(0, 24, W, 2);
  b.fillStyle = rgba('#000000', 0.12); b.fillRect(0, 26, W, 8);
  const ty = H - 150;
  b.fillStyle = rgba('#000000', 0.12); b.fillRect(0, ty - 6, W, 10);
  b.fillStyle = P.frame; b.fillRect(0, ty, W, 60); b.fillStyle = rgba('#ffffff', 0.3); b.fillRect(0, ty, W, 3);
  b.fillStyle = mix(P.frame, P.ink, 0.35); b.fillRect(0, ty + 46, W, 14);
  const pen = (x, c) => { b.fillStyle = rgba('#000000', 0.2); b.beginPath(); b.roundRect(x + 4, ty + 10, 210, 30, 12); b.fill();
    b.fillStyle = P.card; b.beginPath(); b.roundRect(x, ty + 4, 210, 30, 12); b.fill(); b.fillStyle = c; b.beginPath(); b.roundRect(x + 150, ty + 2, 66, 34, 10); b.fill(); };
  pen(rtl ? W - 330 : 120, P.ink); pen(rtl ? W - 580 : 370, P.accent); pen(rtl ? W - 830 : 620, P.measure);
  b.fillStyle = P.ink; b.fillRect(rtl ? 70 : W - 250, ty - 6, 180, 26); b.fillStyle = P.frame; b.fillRect(rtl ? 70 : W - 250, ty + 20, 180, 22);
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      const x = ((time * 26) % (W + 1400)) - 700;                                         // a reflection sliding over the enamel
      const g = ctx.createLinearGradient(x - 260, 0, x + 260, 520);
      g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(0.5, rgba('#ffffff', T.tone.sheen)); g.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  };
}
