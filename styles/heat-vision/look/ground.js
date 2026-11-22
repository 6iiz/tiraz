// The Heat Vision ground: the frame is a low-resolution thermal sensor picture, blown up with optical softness. Each cell is an apparent
// temperature mapped through the brand's heat ramp: a cool room with a few warm bodies drifting slowly at the edges and below, sensor noise
// at 30 frames a second, faint fixed column stripes and lens shading. Over it, the camera's own instruments: a vertical colour scale on the
// far side and corner brackets of the viewfinder. Uses `clock`, so the picture never restarts at a cut.
import { rng, clamp } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens.sensor, pal = palette(brand), rtl = brand.dir !== 'ltr';
  const cw = T.cols, chh = Math.round(cw * H / W);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
  const c2 = cv.getContext('2d', { willReadFrequently: true }), img = c2.createImageData(cw, chh);
  const r = rng(T.seed), stripes = Array.from({ length: cw }, () => (r() - 0.5) * 0.03);
  // a cool room seen at night: ambient warm patches kept off the middle band where text sits, a warm pipe running up the far side,
  // a cold window high up, and two people standing low in the frame (head + body), swaying a little. All in cell units, relative.
  const bodies = [
    [0.1, 0.16, 0.13, 0.22, 0.04, 0.03, 0.21], [0.88, 0.1, 0.12, 0.2, 0.04, 0.05, 0.17],
    [0.5, 1.02, 0.3, 0.25, 0.06, 0.0, 0.11],
  ];
  const people = [[0.27, 0.76, 1.5, 0.09], [0.75, 0.83, 1.25, 0.13]];   // x, y of the head, scale, sway speed
  const pipeX = rtl ? 0.955 : 0.045;
  // lens shading, once
  const shade = document.createElement('canvas'); shade.width = W; shade.height = H;
  { const s = shade.getContext('2d'), g = s.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.45, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)'); s.fillStyle = g; s.fillRect(0, 0, W, H); }
  // the colour scale bar, once
  const bar = document.createElement('canvas'); bar.width = 18; bar.height = 820;
  { const b = bar.getContext('2d'); for (let y = 0; y < 820; y++) { const c = pal.lut[Math.round(255 * (1 - y / 819))]; b.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; b.fillRect(0, y, 18, 1); } }
  const hash = (x, y, f) => { let h = (x * 374761393 + y * 668265263 + f * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const barX = rtl ? 26 : W - 44, barY = 330;
  return {
    pal, barX, barY, barH: 820,
    // extra: optional [{ x, y, r, k }] heat sources in frame pixels (a part may warm the picture where its subject is)
    draw(ctx, t, extra) {
      const time = t + clock, f = Math.floor(time * 30), d = img.data;
      const B = bodies.map(([x, y, rad, k, dx, dy, sp]) => [(x + dx * Math.sin(time * sp * 6.28)) * cw, (y + dy * Math.cos(time * sp * 5.1)) * chh, (rad * cw) ** 2, k]);
      for (const [px, py, sc, sp] of people) {                          // head and shoulders/body as soft ellipses
        const x = (px + 0.012 * Math.sin(time * sp * 6.28)) * cw, y = py * chh;
        B.push([x, y, (0.045 * sc * cw) ** 2, 0.8], [x, y + 0.075 * sc * chh, (0.085 * sc * cw) ** 2, 0.66, 2.4]);
      }
      if (extra) for (const e of extra) B.push([e.x / W * cw, e.y / H * chh, (e.r / W * cw) ** 2, e.k]);
      for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
        let v = 0.05 + 0.12 * (y / chh) ** 2 + stripes[x];
        for (const b of B) { const dx = x - b[0], dy = (y - b[1]) / (b[4] || 1); v += b[3] * Math.exp(-(dx * dx + dy * dy) / b[2]); }
        const ex = (x / cw - pipeX) * 40; v += 0.3 * Math.exp(-ex * ex) * (0.8 + 0.2 * Math.sin(y * 0.35 - time * 2));      // the pipe
        const wx = Math.abs(x / cw - (rtl ? 0.3 : 0.7)) - 0.14, wy = Math.abs(y / chh - 0.06) - 0.05;                       // the window
        if (wx < 0 && wy < 0) v -= 0.07 * Math.min(1, -wx * 30, -wy * 30);
        v += (hash(x, y, f) - 0.5) * 0.05;
        const c = pal.lut[Math.round(clamp(v) * 255)], o = (y * cw + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      c2.putImageData(img, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cv, 0, 0, W, H); ctx.restore();
      ctx.drawImage(shade, 0, 0);
      // instruments: the scale with its two ends, the viewfinder corners
      ctx.save();
      ctx.fillStyle = pal.plate; ctx.globalAlpha = 0.7; ctx.fillRect(barX - 4, barY - 4, 26, 828); ctx.globalAlpha = 1;
      ctx.drawImage(bar, barX, barY);
      ctx.fillStyle = pal.dim; ctx.font = `600 20px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'left' : 'right';
      ctx.textBaseline = 'bottom'; ctx.fillText('▲', rtl ? barX : barX + 18, barY - 10);
      ctx.textBaseline = 'top'; ctx.fillText('▼', rtl ? barX : barX + 18, barY + 830);
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 3; ctx.beginPath();
      const m = 30, L = 60, yt = 200, yb = H - 120;
      for (const [cx, cy, sx, sy] of [[m, yt, 1, 1], [W - m, yt, -1, 1], [m, yb, 1, -1], [W - m, yb, -1, -1]]) { ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); }
      ctx.stroke();
      ctx.restore();
    },
  };
}
