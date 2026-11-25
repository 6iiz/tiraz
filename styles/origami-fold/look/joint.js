// The origami-fold joint: every scene opens like a greeting card. The outgoing frame is the card's cover: hinged on the
// reading-start edge of the frame, it swings open towards you, darkening as it turns from the lamp, and leaves past the edge;
// the incoming scene is the inside of the card, with the cover's soft shadow sliding off it. Real 3D on the shared renderer.
import { ease, mix } from '/engine/kit.js';
import { THREE } from '/engine/three3d.js';
import { glOf, palette } from './ground.js';

export async function create({ W, H, brand }) {
  const R = glOf(W, H), rtl = brand.dir !== 'ltr', s = rtl ? -1 : 1, P = palette(brand);
  const Dd = 2600, scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(H / 2 / Dd) * 180 / Math.PI, W / H, 10, 20000); cam.position.set(0, 0, Dd);
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(s * W / 2, 0, 0);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide });
  const back = new THREE.MeshBasicMaterial({ color: P.back, side: THREE.BackSide });
  const hinge = new THREE.Group(); hinge.position.set(-s * W / 2, 0, 0); scene.add(hinge);
  const cover = new THREE.Mesh(geo, mat); cover.add(new THREE.Mesh(geo, back)); hinge.add(cover);
  // the cover's cut edge: a thin lit strip of paper along its free side, so it reads against a page of the same colour
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(5, H), new THREE.MeshBasicMaterial({ color: mix(P.ground, P.paper, 0.55) }));
  edge.position.set(s * (W - 2.5), 0, 0.5); cover.add(edge);
  let texture = null, src = null;
  return {
    draw(ctx, from, to, p) {
      if (p <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      if (src !== from) { texture?.dispose(); texture = new THREE.CanvasTexture(from); texture.colorSpace = THREE.SRGBColorSpace; mat.map = texture; mat.needsUpdate = true; src = from; }
      texture.needsUpdate = true;
      const q = ease.inOutCubic(p), a = q * Math.PI * 0.5;
      hinge.rotation.y = -s * a;
      const shade = 1 - 0.38 * Math.sin(a); mat.color.setScalar(shade);
      ctx.drawImage(to, 0, 0);
      // the cover's shadow on the inside page: deepest at the spine, sliding away as the cover lifts
      const reach = W * (1 - q) * 1.1, x0 = rtl ? W : 0, g = ctx.createLinearGradient(x0, 0, x0 + s * reach, 0);
      g.addColorStop(0, `rgba(0,0,0,${0.32 * (1 - q)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      R.gl.setClearColor(0x000000, 0); R.gl.render(scene, cam); ctx.drawImage(R.canvas, 0, 0);
    },
  };
}
