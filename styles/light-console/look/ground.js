// The light-console ground: a near-black stage in three depths. Far: a dot grid that drifts slowly (parallax). Middle: the projector pad
// in perspective low in the frame, its rings turning (one bright, one dashed, a ring of ticks), a soft cone of light rising from it, and a
// lift of the hue behind where the subject floats. Near: corner brackets of the frame and two side rulers whose ticks drift faster than
// the dots. Built once where it can be; the turning and drifting use the reel's time, so nothing restarts at a cut.
import { rgba, mix } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), P = T.pad, sub = T.subject;
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  {
    const c = base.getContext('2d');
    c.fillStyle = pal.stage; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(sub.x, sub.y, 20, sub.x, sub.y, 620);
    g.addColorStop(0, rgba(pal.hue, T.tone.lift)); g.addColorStop(1, rgba(pal.hue, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the cone of light from the pad
    const cone = c.createLinearGradient(0, P.y, 0, sub.y - 260);
    cone.addColorStop(0, rgba(pal.hue, T.tone.cone)); cone.addColorStop(1, rgba(pal.hue, 0));
    c.fillStyle = cone; c.beginPath(); c.moveTo(P.x - P.rx * 0.8, P.y); c.lineTo(P.x - P.rx * 0.35, sub.y - 260); c.lineTo(P.x + P.rx * 0.35, sub.y - 260); c.lineTo(P.x + P.rx * 0.8, P.y); c.closePath(); c.fill();
    const v = c.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.75);
    v.addColorStop(0, rgba(pal.stage, 0)); v.addColorStop(1, rgba(pal.stage, 0.85)); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // corner brackets of the frame
    c.strokeStyle = pal.dim; c.lineWidth = 2; c.beginPath();
    for (const [x, y, dx, dy] of [[36, 150, 1, 1], [W - 36, 150, -1, 1], [36, H - 520, 1, -1], [W - 36, H - 520, -1, -1]]) { c.moveTo(x + dx * 60, y); c.lineTo(x, y); c.lineTo(x, y + dy * 60); }
    c.stroke();
  }
  const sp = T.dots, dots = document.createElement('canvas'); dots.width = W + sp; dots.height = H + sp;
  { const c = dots.getContext('2d'); c.fillStyle = pal.faint; for (let y = 0; y < dots.height; y += sp) for (let x = 0; x < dots.width; x += sp) c.fillRect(x, y, 2, 2); }
  const tick = mix(pal.stage, pal.hue, 0.32);
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      const ox = (time * 6) % sp, oy = (time * 9) % sp;
      ctx.drawImage(dots, -ox, -oy);
      // the side rulers: ticks drift down faster than the dots, a long tick every fifth
      ctx.fillStyle = tick; const off = (time * 26) % 30;
      for (let y = 200 - 30 + off; y < H - 560; y += 30) { const k = Math.round((y - off) / 30) % 5 === 0 ? 18 : 8; ctx.fillRect(22, y, k, 2); ctx.fillRect(W - 22 - k, y, k, 2); }
      // the projector pad
      ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1, P.ry / P.rx);
      ctx.strokeStyle = rgba(pal.hue, 0.18); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, P.rx, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = pal.hue; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, P.rx, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.setLineDash([22, 14]); ctx.lineDashOffset = -time * 40;
      ctx.beginPath(); ctx.arc(0, 0, P.rx * 0.74, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0, 0, P.rx * 0.46, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(time * 0.25); ctx.beginPath();
      for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r0 = P.rx * 1.06, r1 = P.rx * (i % 4 ? 1.1 : 1.16); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    },
  };
}
