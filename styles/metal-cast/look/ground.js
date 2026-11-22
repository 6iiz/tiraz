// The metal-cast ground: a dark studio table seen from where you stand at its edge, looking down. The table is the brand's dark
// colour with a soft pool where the key light falls (baked once into a texture, finely dithered so the dark gradient never bands);
// a spot light from the upper left gives every piece a real shadow; a second, soft light sweeps across the table now and then and
// slides a highlight over the polished faces. The camera drifts a few pixels sideways and leans in by about 2 %, so a hold is never dead.
// create() -> { scene, camera, pal, at(sx, sy) (a frame point on the table, in world units), passes(t0, every), render(ctx, t) }
import { THREE } from '/engine/three3d.js';
import { mix, span, clamp } from '/engine/kit.js';

const TABLES = new Map();
function tableTexture(pal) {
  const k = pal.table + pal.pool;
  if (TABLES.has(k)) return TABLES.get(k);
  const n = 1536, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const edge = mix(pal.table, '#000000', 0.38);
  g.fillStyle = edge; g.fillRect(0, 0, n, n);
  // the plane spans 5000 units; the pool is centred a little above the middle of the frame
  const cx = n / 2, cy = n / 2 - (120 / 5000) * n, r = (2300 / 5000) * n;
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  grd.addColorStop(0, pal.pool); grd.addColorStop(0.42, mix(pal.pool, pal.table, 0.6)); grd.addColorStop(0.75, pal.table); grd.addColorStop(1, edge);
  g.fillStyle = grd; g.fillRect(0, 0, n, n);
  const im = g.getImageData(0, 0, n, n), d = im.data;
  let s = 0x9e3779b9;                                                  // seeded dither: one level up or down, never random per run
  for (let i = 0; i < d.length; i += 4) {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; const q = ((s >>> 0) % 3) - 1;
    d[i] = clamp(d[i] + q, 0, 255); d[i + 1] = clamp(d[i + 1] + q, 0, 255); d[i + 2] = clamp(d[i + 2] + q, 0, 255);
  }
  g.putImageData(im, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const out = { tex, edge }; TABLES.set(k, out); return out;
}

export async function create({ W, H, brand, look, clock = 0 }) {
  const S = await import(look.base + 'studio.js');
  const T = look.tokens, pal = S.palette(brand), R = S.renderer(W, H), rtl = brand.dir !== 'ltr';
  const scene = new THREE.Scene(), table = tableTexture(pal);
  scene.background = new THREE.Color(table.edge); scene.environment = R.env;

  const top = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshBasicMaterial({ map: table.tex }));
  scene.add(top);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.ShadowMaterial({ opacity: 0.7 }));
  shade.position.z = 0.3; shade.receiveShadow = true; scene.add(shade);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, T.light.hemi));
  const key = new THREE.SpotLight(0xffffff, T.light.key, 0, 0.42, 0.9, 0);
  key.position.set(-1250, 1500, 2700); key.target.position.set(0, 100, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.6;
  key.shadow.camera.near = 1500; key.shadow.camera.far = 6000;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(900, -300, 1200); scene.add(fill);
  const sweep = new THREE.PointLight(0xffffff, 0, 0, 2); scene.add(sweep);

  const camera = new THREE.PerspectiveCamera(T.cam.fov, W / H, 100, 20000);
  const L = H / 2 / Math.tan(THREE.MathUtils.degToRad(T.cam.fov / 2)), tilt = THREE.MathUtils.degToRad(T.cam.tilt);
  const pose = (t) => {
    const time = t + clock, dx = 12 * Math.sin(time * 0.23), k = 1 - 0.02 * (1 - Math.exp(-Math.max(0, t) / 3));
    camera.position.set(dx, -L * Math.sin(tilt) * k, L * Math.cos(tilt) * k); camera.lookAt(dx, 0, 0); camera.updateMatrixWorld();
  };
  pose(0);
  // A point of the frame (as laid out at rest) on the table plane z.
  const ray = new THREE.Vector3();
  const at = (sx, sy, z = 0) => {
    pose(0);
    ray.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    const d = (z - camera.position.z) / ray.z;
    return camera.position.clone().addScaledVector(ray, d);
  };

  // The direction from a point on the table to the camera at rest: pieces fall along it.
  const up = (b) => { pose(0); return camera.position.clone().sub(b).normalize(); };

  // The soft light passes across the table in the reading direction, starting at t0 and then every `every` seconds.
  let p0 = Infinity, every = Infinity, yLight = 0;
  const passes = (t0, ev = T.light.every, sy = 760) => { p0 = t0; every = ev; yLight = at(W / 2, sy).y + 260; };

  return {
    scene, camera, pal, at, up, passes, rtl, W, H,
    render(ctx, t) {
      pose(t);
      sweep.intensity = 0;
      if (t >= p0) {
        const p = ((t - p0) % every) / T.light.pass;
        if (p < 1) {
          const x = (rtl ? 1 : -1) * (1500 - 3000 * p), z = 520;
          sweep.position.set(x, yLight, z);
          sweep.intensity = T.light.sweep * z * z * Math.sin(Math.PI * p) ** 1.5;
        }
      }
      R.r.render(scene, camera);
      ctx.drawImage(R.canvas, 0, 0);
    },
  };
}
