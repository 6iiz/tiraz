// The gallery-walk joint: the walk. Both parts render the same corridor (the same wall, floor, frames and lights, their canvases one
// spacing apart) and both put the camera on the same walk at this moment (motion.js walk()), so the two pictures are the same except on
// their own canvases. The joint keeps the leaving part on the side it leaves and the arriving part on the side it walks to, split at the
// point of the wall half-way between the two canvases: one continuous walk, no seam, no flash.
import { THREE } from '/engine/three3d.js';
import { camRig } from './ground.js';
import { walk } from './motion.js';

export function create({ W, H, brand, look }) {
  const T = look.tokens, dir = brand.dir !== 'ltr' ? -1 : 1, rig = camRig(W, H, T), v = new THREE.Vector3();
  return {
    draw(ctx, from, to, p) {
      const q = walk(p, T, dir); rig.set(q.x, q.y, q.z, q.yaw);
      v.set(dir * T.corridor.spacing / 2, 0, 0).project(rig.cam);
      const sx = Math.round(Math.max(0, Math.min(W, (v.x + 1) / 2 * W)));
      ctx.drawImage(from, 0, 0);
      if (dir < 0) { if (sx > 0) ctx.drawImage(to, 0, 0, sx, H, 0, 0, sx, H); }        // walking to the left: the next canvas is on the left
      else if (sx < W) ctx.drawImage(to, sx, 0, W - sx, H, sx, 0, W - sx, H);
    },
  };
}
