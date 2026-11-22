// Letter-city motion. Two ideas only:
//  - the camera glides: it comes down the street from behind and to one side, turning to keep the block ahead in view, settles square
//    to the fronts while they are read (a slow creep forward keeps it alive), then pulls on down the street, faster, into the next block;
//  - buildings rise floor by floor: a tower climbs out of the street in whole storeys, each storey a quick lift and a short stop.
import { clamp, span, ease } from '/engine/kit.js';

export const E = ease.outCubic;
export const EI = ease.inOutCubic;
// Climb to 1 in n storeys: each storey lifts in the first 70% of its slot (out-quart) and rests for the rest.
export const floors = (p, n = 6) => {
  p = clamp(p); if (p >= 1) return 1; const q = p * n, i = Math.floor(q), f = clamp((q - i) / 0.7);
  return (i + ease.outQuart(f)) / n;
};

// The camera along the street, in the scene's own time. rest: { x, y, z } (the reading pose, looking straight down -z).
//  side: +1 / -1, which kerb the glide starts from. back: how far behind the rest pose it starts. Returns { x, y, z, aimX, aimZ }.
export function glide(t, { at = 0, d, rest, side = 1, back, len = 1.1, outLen = 0.55, creep = 0.04, target }) {
  const pin = E(span(t, at, at + len)), c = span(t, at, d - outLen), pout = ease.inQuad(span(t, d - outLen, d));
  const x = rest.x + side * back * 0.42 * (1 - pin) - side * back * 0.06 * pout;
  const y = rest.y * (1 + 0.22 * (1 - pin) + 0.08 * pout);
  const z = rest.z + back * (1 - pin) - back * creep * c - back * 0.45 * pout;
  return { x, y, z, aimX: target.x, aimZ: target.z };
}
