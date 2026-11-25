// A soft fall-off of the light towards the corners of the frame, the way a gallery corridor darkens away from its picture lights.
// Neutral black at low alpha, outside the reading area; it carries no text (the wall label under each canvas holds the handle).
export async function create({ W, H }) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const r = g.createRadialGradient(W / 2, H * 0.42, H * 0.36, W / 2, H * 0.46, H * 0.78);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = r; g.fillRect(0, 0, W, H);
  return { draw(ctx) { ctx.drawImage(cv, 0, 0); } };
}
