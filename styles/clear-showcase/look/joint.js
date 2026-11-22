// The clear-showcase joint: the sweep carries the cut. A tall soft-edged line of light crosses the frame from the reading side, and the
// next scene is uncovered behind it through a wide soft edge, as if the light revealed it. The line is thin and only lightly bright, so
// the frame's brightness hardly moves.
import { ease, rgba, contrast } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const { bg, text, accent } = brand.colors, light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, rtl = brand.dir !== 'ltr';
  const soft = 260, n = 12;
  return {
    draw(ctx, from, to, p) {
      if (p <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      const q = ease.inOutCubic(p), edge = -soft + q * (W + 2 * soft);      // distance travelled from the reading side
      const X = (d) => (rtl ? W - d : d);
      ctx.drawImage(from, 0, 0);
      const full = Math.max(0, edge - soft);
      if (full > 0) { const x = rtl ? W - full : 0; ctx.drawImage(to, x, 0, full, H, x, 0, full, H); }
      for (let i = 0; i < n; i++) {
        const a = edge - soft + (i * soft) / n, b = a + soft / n; if (b <= 0 || a >= W) continue;
        const lo = Math.max(0, a), hi = Math.min(W, b), x = rtl ? W - hi : lo, w = hi - lo;
        ctx.save(); ctx.globalAlpha = 1 - (i + 0.5) / n; ctx.drawImage(to, x, 0, w, H, x, 0, w, H); ctx.restore();
      }
      const lx = X(edge - soft * 0.5), g = ctx.createLinearGradient(lx - 60, 0, lx + 60, 0);
      g.addColorStop(0, rgba(light, 0)); g.addColorStop(0.5, rgba(light, 0.22)); g.addColorStop(1, rgba(light, 0));
      ctx.fillStyle = g; ctx.fillRect(lx - 60, 0, 120, H);
      ctx.fillStyle = rgba(accent, 0.5); ctx.fillRect(lx + (rtl ? -4 : 2), 0, 2, H);
      ctx.fillStyle = rgba(light, 0.6); ctx.fillRect(lx - 1, 0, 1.5, H);
    },
  };
}
