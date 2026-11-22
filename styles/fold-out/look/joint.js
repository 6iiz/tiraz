// The fold-out joint: a page turn. The old scene is a page lifting from its free edge and turning over the spine on the reading side:
// cut into vertical strips, each strip narrower and a little taller the further it is from the spine (it comes toward the lens), shaded
// as it turns away from the lamp; the next spread lies under it, with the turning page's shadow falling on it.
const sm = (p) => p * p * (3 - 2 * p);
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', N = 36;
  return {
    draw(ctx, from, to, p) {
      const q = sm(Math.min(1, Math.max(0, p))), th = q * Math.PI / 2, cw = Math.cos(th), sn = Math.sin(th);
      ctx.drawImage(to, 0, 0);
      if (cw <= 0.002) return;
      const spine = rtl ? W : 0, dir = rtl ? -1 : 1, edge = spine + dir * W * cw;
      const g = ctx.createLinearGradient(edge, 0, edge + dir * 160 * sn, 0); g.addColorStop(0, `rgba(0,0,0,${0.35 * sn})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(rtl ? edge - 160 : edge, 0, 160, H);
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, sx = rtl ? W - u1 * W : u0 * W, sw = W / N;
        const xa = spine + dir * u0 * W * cw, xb = spine + dir * u1 * W * cw, um = (u0 + u1) / 2, grow = 1 + 0.1 * um * sn;
        const dx = Math.min(xa, xb), dw = Math.abs(xb - xa) + 0.6, dh = H * grow, dy = (H - dh) / 2;
        ctx.drawImage(from, sx, 0, sw, H, dx, dy, dw, dh);
        ctx.fillStyle = `rgba(0,0,0,${0.3 * sn * um})`; ctx.fillRect(dx, dy, dw, dh);
      }
    },
  };
}
