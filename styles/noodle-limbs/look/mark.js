// Over every frame: the worn print. A heavy rounded vignette like a projector gate, a flicker of a few percent, one or two scratches
// that live for a few frames, dust specks that change every frame and now and then a hair. All seeded by the frame number, so the same
// moment always shows the same damage. Under the gate, the handle in the mono face, small: decoration only.
import { rng, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
export async function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  if (!cache.has(P.dark)) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.45, W * 0.42, W / 2, H * 0.45, H * 0.72);
    gr.addColorStop(0, rgba(P.dark, 0)); gr.addColorStop(1, rgba(P.dark, 0.42)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the gate's soft rounded edge
    g.strokeStyle = rgba(P.dark, 0.5); g.lineWidth = 40; g.filter = 'blur(14px)';
    g.beginPath(); g.roundRect(0, 0, W, H, 90); g.stroke(); g.filter = 'none';
    cache.set(P.dark, cv);
  }
  const gate = cache.get(P.dark);
  return {
    draw(ctx, t) {
      const f = Math.floor(t * 24), r = rng(7 + f), slow = rng(101 + Math.floor(f / 5));
      ctx.save();
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.grey; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, W / 2, H - 70);
      ctx.drawImage(gate, 0, 0);
      const fl = r() - 0.5; ctx.fillStyle = fl > 0 ? rgba(P.light, fl * 0.07) : rgba(P.dark, -fl * 0.07); ctx.fillRect(0, 0, W, H);
      const ns = slow() < 0.55 ? 1 : 2;
      for (let i = 0; i < ns; i++) {
        const x = slow() * W, a = 0.18 + slow() * 0.2, light = slow() < 0.5;
        ctx.strokeStyle = rgba(light ? P.light : P.dark, a); ctx.lineWidth = 1.5 + slow() * 1.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 6, H * 0.3, x - 8, H * 0.7, x + (r() - 0.5) * 4, H); ctx.stroke();
      }
      const nd = 3 + Math.floor(r() * 5); ctx.fillStyle = rgba(P.dark, 0.55);
      for (let i = 0; i < nd; i++) { ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 1.5 + r() * 4, 1.5 + r() * 3, r() * 3, 0, Math.PI * 2); ctx.fill(); }
      if (r() < 0.07) {
        const x = r() * W, y = r() * H; ctx.strokeStyle = rgba(P.dark, 0.5); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y - 30, x + 10, y + 60, x + 70, y + 40); ctx.stroke();
      }
      ctx.restore();
    },
  };
}
