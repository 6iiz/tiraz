// How two scenes of the test card join: a straight edge uncovers the next scene from the reading side. Plain on purpose: it tests that a
// brand can bring its own joint, and is not a look.
// from and to are canvases holding the outgoing and the incoming scene at this moment; p runs 0..1 across the joint.
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      const w = Math.round(W * Math.min(1, Math.max(0, p)));     // how much of the next scene shows
      ctx.drawImage(from, 0, 0);
      if (w > 0) { const x = rtl ? W - w : 0; ctx.drawImage(to, x, 0, w, H, x, 0, w, H); }
    },
  };
}
