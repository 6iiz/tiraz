// The ben-day-burst joint: the next poster is pulled over the old one by the squeegee. A dark blade crosses the frame from the reading
// side and the new print lies behind it; a narrow bead of accent ink rides just ahead of the blade.
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', E = (p) => { p = Math.min(1, Math.max(0, p)); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; };
  const L = (h) => parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11;
  const night = L(brand.colors.text) >= L(brand.colors.bg) ? brand.colors.bg : brand.colors.text;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const x = W * E(p), edge = rtl ? W - x : x;
      ctx.save(); ctx.beginPath(); if (rtl) ctx.rect(edge, 0, x, H); else ctx.rect(0, 0, x, H); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = brand.colors.accent; ctx.fillRect(rtl ? edge - 34 : edge + 14, 0, 20, H);
        ctx.fillStyle = night; ctx.fillRect(edge - 14, 0, 28, H);
      }
    },
  };
}
