// The gazette ground: a projected film gate. A rounded gate in a dark surround; inside it, a silver screen (the brand's darker colour
// lifted toward its lighter one). Over whatever a part draws, `over()` lays the projection: grain that changes every film frame, a
// light flicker, dust specks that live one frame, a vertical scratch or two that live a few, a vignette, and the gate's edge.
// `weave(ctx, t)` is the gate's slow drift for things that are "on the film" (pages, clippings). Built once; seeded, frame-exact.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, q, fps } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, G = T.gate, F = T.film, P = palette(brand, T);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  // grain: one tile of noise, offset every frame
  const [gc, gg] = mk(256, 256), img = gg.createImageData(256, 256), r = rng(1928);
  for (let i = 0; i < img.data.length; i += 4) { const v = r() < 0.5 ? 0 : 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = Math.floor(r() * 255); }
  gg.putImageData(img, 0, 0);
  // the screen and its vignette
  const [vc, vg] = mk(W, H);
  const rad = vg.createRadialGradient(W / 2, G.y + G.h * 0.45, G.h * 0.2, W / 2, G.y + G.h * 0.45, G.h * 0.75);
  rad.addColorStop(0, rgba(P.dark, 0)); rad.addColorStop(1, rgba(P.dark, 0.6));
  vg.fillStyle = rad; vg.fillRect(0, 0, W, H);
  // scratches: events through the whole reel, each living a few frames
  const sr = rng(1930), scratches = [];
  for (let i = 0; i < 34 * fps * F.scratches / 12; i++) scratches.push({ f0: Math.floor(sr() * 34 * fps), life: 5 + Math.floor(sr() * 9), x: G.x + 40 + sr() * (G.w - 80), dx: (sr() - 0.5) * 3, w: 1 + sr() * 2, a: 0.18 + sr() * 0.3, light: sr() < 0.7 });
  const gate = (ctx) => { ctx.beginPath(); ctx.roundRect(G.x, G.y, G.w, G.h, G.r); };
  let pattern = null;
  return {
    P, G,
    frame: (t) => Math.floor((t + clock) * fps + 1e-6),
    weave(ctx, t) {
      const f = q(t + clock);
      ctx.translate(F.weave * (Math.sin(f * 2.3) * 0.6 + Math.sin(f * 5.9 + 1) * 0.4), F.weave * 1.3 * (Math.sin(f * 1.7 + 2) * 0.6 + Math.sin(f * 4.1) * 0.4));
    },
    draw(ctx, t) {
      ctx.fillStyle = P.dark; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.screen; gate(ctx); ctx.fill();
    },
    over(ctx, t) {
      const f = Math.floor((t + clock) * fps + 1e-6), fr = rng(f * 977 + 13);
      ctx.save(); gate(ctx); ctx.clip();
      for (const s of scratches) if (f >= s.f0 && f < s.f0 + s.life) {
        ctx.fillStyle = rgba(s.light ? P.light : P.dark, s.a); const x = s.x + s.dx * (f - s.f0);
        ctx.fillRect(x, G.y, s.w, G.h);
      }
      const n = Math.floor(fr() * (F.dust + 1));
      for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(fr() < 0.6 ? P.dark : P.light, 0.35 + fr() * 0.4); ctx.beginPath(); ctx.ellipse(G.x + fr() * G.w, G.y + fr() * G.h, 1.5 + fr() * 5, 1.5 + fr() * 3, fr() * 3, 0, Math.PI * 2); ctx.fill(); }
      if (!pattern) pattern = ctx.createPattern(gc, 'repeat');
      const ox = (f * 73) % 256, oy = (f * 151) % 256;
      ctx.globalAlpha = F.grain; ctx.translate(ox, oy); ctx.fillStyle = pattern; ctx.fillRect(-ox, -oy, W, H); ctx.translate(-ox, -oy); ctx.globalAlpha = 1;
      ctx.drawImage(vc, 0, 0);
      const k = (fr() - 0.5) * 2 * F.flicker + Math.sin((t + clock) * Math.PI * 6) * F.flicker * 0.35;
      ctx.fillStyle = k > 0 ? rgba(P.light, k * 0.5) : rgba(P.dark, -k); ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // the surround: the brand's dark, taken down further, outside the rounded gate
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(G.x, G.y, G.w, G.h, G.r);
      ctx.fillStyle = P.dark; ctx.fill('evenodd'); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill('evenodd'); ctx.restore();
    },
  };
}
