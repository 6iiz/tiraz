// The Ghost Overlay ground: pale paper (the lighter brand colour) with the world outside the windows printed very faintly along the
// bottom, two far ridges that drift slowly with the reel's clock, and a fixed film grain. Everything is a pale step of tone, so text
// on the paper keeps its contrast. Ridges and grain are built once.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), r = rng(4511);
  const grain = document.createElement('canvas'); grain.width = W; grain.height = H;
  const g = grain.getContext('2d');
  for (let i = 0; i < 22000; i++) { g.fillStyle = rgba(r() < 0.55 ? P.ink : P.paper, T.tone.grain * (0.3 + r())); g.fillRect(r() * W, r() * H, 1 + r() * 1.6, 1 + r() * 1.6); }
  const ridges = document.createElement('canvas'); ridges.width = W * 2; ridges.height = 520;
  const rg = ridges.getContext('2d');
  [[0.35, T.tone.world * 0.7, 0.22], [0.6, T.tone.world, 0.16]].forEach(([base, k, amp], j) => {
    const f = [r() * 6, r() * 6], s = [2 + j, 5 + j * 2];
    rg.fillStyle = mix(P.paper, P.ink, k); rg.beginPath(); rg.moveTo(0, 520);
    for (let x = 0; x <= W * 2; x += 8) { const u = x / (W * 2) * Math.PI * 2; rg.lineTo(x, 520 * (base - amp * (0.7 * Math.sin(u * s[0] + f[0]) + 0.3 * Math.sin(u * s[1] + f[1])))); }
    rg.lineTo(W * 2, 520); rg.fill();
  });
  // a soft wash of light from the top corner on the reading side, like the bright sky of a first exposure
  const wash = document.createElement('canvas'); wash.width = W; wash.height = H;
  const wg = wash.getContext('2d'), rtl = brand.dir !== 'ltr';
  const lg = wg.createRadialGradient(rtl ? W * 0.8 : W * 0.2, H * 0.12, 0, rtl ? W * 0.8 : W * 0.2, H * 0.12, H * 0.9);
  lg.addColorStop(0, rgba(P.paper, 0)); lg.addColorStop(1, rgba(P.ink, 0.07));
  wg.fillStyle = lg; wg.fillRect(0, 0, W, H);
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(wash, 0, 0);
      const off = -((time * 10) % W);
      ctx.drawImage(ridges, off, H - 520); ctx.drawImage(ridges, off + W * 2, H - 520);
      ctx.drawImage(grain, 0, 0);
    },
  };
}
