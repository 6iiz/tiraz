// Gallery-walk motion. One idea carries the style: the visitor walks. Between two ideas the camera walks along the corridor from one
// framed canvas to the next (a smooth start and stop, a small step back to take in the wall, the head turning a little towards where it
// goes, two soft steps of bob). At a canvas it stands still and leans in a little while reading. Inside a canvas things are painted:
// a brush stroke wipes in from the reading side; nothing bounces, spins or flashes.
import { clamp, ease } from '/engine/kit.js';

export const E = ease.outCubic;
// in-out sine: the walk starts and stops with no jolt
export const EI = (p) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p));
// 0 -> 1 -> 0 with a flat start and end (sin squared)
export const bump = (p) => { const s = Math.sin(Math.PI * clamp(p)); return s * s; };

// The walk from one canvas to the next, u in 0..1. Offsets of the camera from the canvas it leaves: x along the wall (dir = +1 walks to
// +x, -1 to -x), y the bob of two steps, z the step back, yaw the head turning towards the next canvas. A pure function of u, so the
// scene that leaves, the scene that arrives and the joint all compute the same camera.
export function walk(u, T, dir) {
  u = clamp(u); const C = T.cam;
  return {
    x: dir * T.corridor.spacing * EI(u),
    y: -C.bob * (1 - Math.cos(4 * Math.PI * u)) / 2,
    z: C.back * C.dist * bump(u),
    yaw: -dir * C.yaw * Math.sin(Math.PI * u),
  };
}
