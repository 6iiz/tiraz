// The liquid-pour ground: a dark studio wall, a shallow pool of the brand's liquid along the bottom of the frame (under the safe
// area), and words that are glossy liquid poured into invisible moulds. A thin stream falls from above the frame behind the word,
// the mould fills from the bottom (the level rises fastest under the stream and spreads to the ends, its surface still moving),
// the word sets with one soft wobble, and drops grow on its lowest edges; on the lowest row some of them let go and fall into the
// pool, where rings spread. Leaving, the moulds drain from the top down.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed });
//   const sl = await W3.slab('بتشبه *مية* شركة', { size: 104 });   // extruded words, each with its own liquid level
//   W3.place(sl, { y: 700 });                                        // frame pixels: the reading plane maps 1 unit to 1 px
//   const pour = W3.pour(sl, { t0, step, out0, out1, drop: true });   // then per frame: pour(t); W3.draw(ctx, t)
//
// The fill is a cut in the shader (world y above the level is discarded). Through the open top one sees the inside of the solid;
// those back faces are shaded as a level liquid surface, which is what makes a cut solid read as a filling mould.
// One WebGL renderer and one studio environment map are shared by every part of a reel. Frames are a function of t + clock only.
import { THREE, text3d, logo3d, screenBox } from '/engine/three3d.js';
import { mix, contrast, SAFE } from '/engine/kit.js';
import { E, fill, drain, wobble, fall, fallTime, hash, span, clamp } from './motion.js';

const lumOf = (h) => contrast(h, '#000000');
// The palette, all from the brand. The darker of bg/text is always the wall (gloss reads on a dark room); the lighter is the
// liquid of the words. The accent is the key liquid, lifted towards the light colour when it is too dark to read on the wall.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const night = lumOf(bg) <= lumOf(text) ? bg : text, light = night === bg ? text : bg;
  let key = accent; for (let k = 0.15; contrast(key, night) < 3.4 && k <= 0.75; k += 0.15) key = mix(accent, light, k);
  return {
    night, light, accent, key,
    wallC: mix(night, light, 0.13), wallE: mix(night, '#000000', 0.35),
    pool: mix(night, key, 0.16), poolDeep: mix(night, key, 0.16),
    ink: light, lead: mix(light, night, 0.3), old: mix(light, night, 0.46),
    onKey: contrast(night, key) >= contrast(light, key) ? night : light,
  };
}

// ---------- one renderer + one studio environment for the whole reel ----------
let shared = null;
function renderer(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0;
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  // a neutral photo studio: a dark room with three soft boxes and a card behind the camera (white light only, no hue)
  const pm = new THREE.PMREMGenerator(gl), room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.BackSide })));
  const panel = (w, h, pos, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); room.add(m);
  };
  panel(44, 14, [0, 30, 4], 4.5);        // the big box overhead
  panel(5, 36, [-27, 4, 10], 3.0);       // a tall strip, left front
  panel(4, 30, [27, 3, -6], 2.2);        // a tall strip, right back
  panel(22, 6, [4, 12, 33], 2.4);        // a low card behind the camera, high
  panel(110, 9, [0, 8, -45], 0.55);        // a long low strip far behind the wall: the sheen on the pool
  const env = pm.fromScene(room, 0.02).texture; pm.dispose();
  shared = { W, H, canvas, gl, env }; return shared;
}

// ---------- the liquid material: a glossy dielectric (strong diffuse colour, clear coat on top) with a level cut ----------
const VERT_PARS = 'uniform float uMelt;\nuniform vec4 uBox;\nvarying vec3 vWP;\n';
// melting: the top sags, the foot spreads and bulges forward (mesh-local units; uBox = minY, maxY, centre x, bulge)
const VERT_MELT = `
{ float hgt = max(1.0, uBox.y - uBox.x), hh = clamp((transformed.y - uBox.x) / hgt, 0.0, 1.0);
  transformed.y -= uMelt * hgt * 0.42 * pow(hh, 1.25) * (0.82 + 0.18 * sin(transformed.x * 0.05 + 1.3));
  transformed.x += uMelt * (transformed.x - uBox.z) * 0.14 * (1.0 - hh) * (1.0 - hh);
  transformed.z += uMelt * uBox.w * (1.0 - hh) * (1.0 - hh); }`;
const VERT_WP = '\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;';
const FRAG_PARS = 'uniform float uLevel;\nuniform float uSx;\nuniform float uSpread;\nuniform float uWave;\nuniform float uWet;\nuniform float uT;\nvarying vec3 vWP;\n';
const FRAG_CUT = `
{ float lev = uLevel - uSpread * abs(vWP.x - uSx) + uWave * (0.6 * sin(vWP.x * 0.045 + uT * 9.0) + 0.4 * sin(vWP.x * 0.11 - uT * 13.0));
  if (vWP.y > lev) discard; }`;
// inside faces seen through the open top are the liquid's surface (level, facing up); front faces get a faint wet ripple
const FRAG_NORMAL = `
if (!gl_FrontFacing) { normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); }
else if (normal.z > 0.96) { normal = normalize(normal + uWet * 0.07 * vec3(sin(vWP.y * 0.05 + vWP.x * 0.013 + uT * 3.0), cos(vWP.x * 0.04 - uT * 2.0), 0.0)); }
nonPerturbedNormal = normal;`;
function inject(shader, u, colour) {
  Object.assign(shader.uniforms, u);
  shader.vertexShader = VERT_PARS + shader.vertexShader
    .replace('#include <begin_vertex>', '#include <begin_vertex>' + VERT_MELT)
    .replace('#include <project_vertex>', '#include <project_vertex>' + VERT_WP);
  shader.fragmentShader = FRAG_PARS + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>' + FRAG_CUT);
  if (colour) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>' + FRAG_NORMAL);
}
const uniformsNew = () => ({ uLevel: { value: -1e5 }, uSx: { value: 0 }, uSpread: { value: 0 }, uWave: { value: 0 }, uWet: { value: 0 }, uT: { value: 0 },
  uMelt: { value: 0 }, uBox: { value: new THREE.Vector4(0, 1, 0, 0) } });

// Flat-shaded extrusions show every facet in a glossy material. Smooth the bevel and the walls (faces that do not face ±z), keep the
// front and back caps flat, and never smooth across a crease sharper than ~55°.
function smoothNormals(geo) {
  const p = geo.attributes.position.array, n = p.length / 3, fn = new Float32Array(p.length);
  for (let i = 0; i < n; i += 3) {
    const a = i * 3, b = a + 3, c = a + 6;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (let k = 0; k < 3; k++) { fn[a + k * 3] = nx; fn[a + k * 3 + 1] = ny; fn[a + k * 3 + 2] = nz; }
  }
  const len = (i) => Math.hypot(fn[i * 3], fn[i * 3 + 1], fn[i * 3 + 2]) || 1e-9;
  const cap = (i) => Math.abs(fn[i * 3 + 2]) / len(i) > 0.999;
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    if (cap(i)) continue;
    const k = `${Math.round(p[i * 3] * 32)}|${Math.round(p[i * 3 + 1] * 32)}|${Math.round(p[i * 3 + 2] * 32)}`;
    let g = groups.get(k); if (!g) groups.set(k, (g = [])); g.push(i);
  }
  const out = new Float32Array(p.length), cosC = Math.cos(55 * Math.PI / 180);
  for (let i = 0; i < n; i++) { const l = len(i); out[i * 3] = fn[i * 3] / l; out[i * 3 + 1] = fn[i * 3 + 1] / l; out[i * 3 + 2] = fn[i * 3 + 2] / l; }
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    for (const i of g) {
      const li = len(i); let sx = 0, sy = 0, sz = 0;
      for (const j of g) {
        const lj = len(j), d = (fn[i * 3] * fn[j * 3] + fn[i * 3 + 1] * fn[j * 3 + 1] + fn[i * 3 + 2] * fn[j * 3 + 2]) / (li * lj);
        if (d > cosC) { sx += fn[j * 3] / lj; sy += fn[j * 3 + 1] / lj; sz += fn[j * 3 + 2] / lj; }
      }
      const l = Math.hypot(sx, sy, sz) || 1; out[i * 3] = sx / l; out[i * 3 + 1] = sy / l; out[i * 3 + 2] = sz / l;
    }
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
}

// The low points of a solid's outline (the feet of letters, the tips of descenders): where drops hang. Mesh-local [x, y].
function lowPoints(geo, gb, n, seed) {
  const p = geo.attributes.position.array, B = 30, lo = new Float32Array(B).fill(1e9), lx = new Float32Array(B), w = Math.max(1, gb.max.x - gb.min.x);
  for (let i = 0; i < p.length; i += 3) { const b = Math.min(B - 1, Math.floor((p[i] - gb.min.x) / w * B)); if (p[i + 1] < lo[b]) { lo[b] = p[i + 1]; lx[b] = p[i]; } }
  const hgt = gb.max.y - gb.min.y, c = [];
  for (let b = 0; b < B; b++) {
    if (lo[b] > 1e8 || lo[b] > gb.min.y + hgt * 0.24) continue;
    if ((b > 0 && lo[b - 1] < lo[b]) || (b < B - 1 && lo[b + 1] < lo[b])) continue;
    c.push({ x: lx[b], y: lo[b], r: hash(b, seed) });
  }
  c.sort((a, b) => a.y - b.y + (a.r - b.r) * hgt * 0.08);
  const pick = [];
  for (const q of c) { if (pick.length >= n) break; if (pick.every((o) => Math.abs(o.x - q.x) > w / 4.5)) pick.push(q); }
  return pick;
}

const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };

export async function create({ W, H, brand, look, clock = 0, kit, seed = 0 }) {
  const T = look.tokens, P = palette(brand), R = renderer(W, H), rtl = brand.dir !== 'ltr';
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.night);
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;

  // ---- camera: straight on, shifted lens solved so the reading plane z = 0 maps 1 unit to 1 frame pixel; the eye drifts a little
  const C = T.camera.dist, cam = new THREE.PerspectiveCamera(30, W / H, 20, 30000), eye = new THREE.Vector3();
  function aim(time) {
    const a = time / T.camera.period * Math.PI * 2;
    eye.set(wx(W / 2 + T.camera.drift * Math.sin(a)), wy(T.camera.eyeY + T.camera.drift * 0.6 * Math.sin(a * 0.5 + 1)), C);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / C;
    cam.projectionMatrix.makePerspective((-W / 2 - eye.x) * k, (W / 2 - eye.x) * k, (H / 2 - eye.y) * k, (-H / 2 - eye.y) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: soft sky, one key from the upper reading side (the only shadows), a rim from behind for the edges and the pool
  const L = T.light;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7a7a7a, L.sky));
  const key = new THREE.DirectionalLight(0xffffff, L.key);
  key.position.set((rtl ? 1 : -1) * 700, 1000, 2300); key.target.position.set(0, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1300, right: 1300, top: 1400, bottom: -1400, near: 300, far: 6000 });
  key.shadow.bias = -0.0006; key.shadow.normalBias = 1.0; key.shadow.radius = 6;
  const rim = new THREE.DirectionalLight(0xffffff, L.rim); rim.position.set((rtl ? -1 : 1) * 500, 900, -1400); rim.target.position.set(0, 0, 0);
  scene.add(key, key.target, rim, rim.target);

  // ---- the wall: the brand's dark colour, a little lighter where the words stand. It takes no shadows: a soft dark copy of the
  //      words on the wall reads as a ghost of the text
  const D = T.wall.back, WW = W * 2.4, WH = H * 2.4;
  {
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 427; const g = cv.getContext('2d');
    const cy = (1 - (wy(T.wall.glowY) + WH / 2) / WH) * cv.height, r = T.wall.glowR / WW * cv.width;
    const gr = g.createRadialGradient(cv.width / 2, cy, 0, cv.width / 2, cy, r);
    gr.addColorStop(0, P.wallC); gr.addColorStop(0.55, mix(P.wallC, P.night, 0.55)); gr.addColorStop(1, P.night);
    g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: tex(cv) }));
    wall.position.z = -D; scene.add(wall);
  }

  // ---- the pool: a level sheet of the brand's liquid along the foot of the wall; rings where drops land
  const yPool = wy(T.pool.y), ripples = [], RU = { uR: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -99, 0)) }, uT: { value: 0 } };
  {
    const geo = new THREE.PlaneGeometry(WW, 4200); geo.rotateX(-Math.PI / 2);
    const m = new THREE.MeshPhysicalMaterial({ color: P.pool, roughness: 0.18, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.2, envMap: R.env, envMapIntensity: L.poolEnv });
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, RU);
      s.vertexShader = 'varying vec3 vWP;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>' + VERT_WP);
      s.fragmentShader = 'uniform vec4 uR[8];\nuniform float uT;\nvarying vec3 vWP;\n' + s.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
{ vec2 g = vec2(0.0);
  for (int i = 0; i < 8; i++) { vec4 r = uR[i]; float age = uT - r.z; if (age <= 0.0 || r.w <= 0.0) continue;
    vec2 dv = vWP.xz - r.xy; float d = length(dv) + 0.001, front = age * ${T.pool.speed.toFixed(1)};
    float en = exp(-abs(d - front) / 34.0) * exp(-age * 1.3) * r.w;
    g += dv / d * sin((d - front) * 0.085) * en; }
  g += vec2(sin(vWP.x * 0.006 + uT * 0.9) + 0.5 * sin(vWP.z * 0.017 - uT * 1.3), cos(vWP.z * 0.011 + uT * 0.7)) * 0.035;
  normal = normalize((viewMatrix * vec4(normalize(vec3(-g.x, 1.0, -g.y)), 0.0)).xyz); nonPerturbedNormal = normal; }`);
    };
    m.customProgramCacheKey = () => 'liquid-pool';
    const pool = new THREE.Mesh(geo, m); pool.position.set(0, yPool, -D + 2100); scene.add(pool);
  }

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true); cyl.translate(0, -0.5, 0);
  const ball = new THREE.SphereGeometry(1, 24, 16);
  const plain = new Map();
  const liquid = (colour, cut = true) => {
    if (!cut && plain.has(colour)) return plain.get(colour);
    const u = uniformsNew();
    const m = new THREE.MeshPhysicalMaterial({ color: colour, roughness: L.rough, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMap: R.env, envMapIntensity: L.env, side: cut ? THREE.DoubleSide : THREE.FrontSide });
    if (cut) { m.onBeforeCompile = (s) => inject(s, u, true); m.customProgramCacheKey = () => 'liquid-cut'; }
    m.userData.u = u; if (!cut) plain.set(colour, m);
    return m;
  };
  const depthOf = (u) => { const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }); d.onBeforeCompile = (s) => inject(s, u, false); d.customProgramCacheKey = () => 'liquid-depth'; return d; };

  // one poured solid (a word, a numeral, the logo): its material, its stream, its drops
  function piece(group, mesh, colour, { size, depth, bevel, drops = 2, k = 0 }) {
    smoothNormals(mesh.geometry);
    mesh.geometry.computeBoundingBox(); const gb = mesh.geometry.boundingBox.clone();
    const u = mesh.material.userData.u; u.uBox.value.set(gb.min.y, gb.max.y, (gb.min.x + gb.max.x) / 2, depth * 0.3);
    mesh.customDepthMaterial = depthOf(u); mesh.castShadow = true; mesh.receiveShadow = true;
    const sm = liquid(colour, false);
    const stream = new THREE.Mesh(cyl, sm), head = new THREE.Mesh(ball, sm); stream.visible = head.visible = false; stream.renderOrder = head.renderOrder = -1; scene.add(stream, head);
    const anchors = lowPoints(mesh.geometry, gb, drops, seed * 31 + k).map((a) => {
      const m = new THREE.Mesh(ball, sm); m.visible = false; m.castShadow = true; scene.add(m);
      return { local: new THREE.Vector3(a.x, a.y, (gb.min.z + gb.max.z) / 2), mesh: m, world: new THREE.Vector3() };
    });
    return { group, mesh, u, gb, colour, size, depth, bevel, stream, head, anchors, home: group.position.clone() };
  }

  const world = {
    THREE, scene, camera: cam, eye, P, rtl, wx, wy, yPool, ripples,

    // Liquid text. role: 'ink' | 'lead' | 'old' | 'key' (the colour of the words that are not *key*). Words are centred in their row.
    async slab(text, { size, weight = 800, face = 'display', role = 'ink', ltr = false, maxW = SAFE.right - SAFE.left - 24, drops = 2 }) {
      const b = ltr ? { ...brand, dir: 'ltr' } : brand, base = P[role] ?? P.ink;
      const depth = size * T.depth, bevel = Math.max(1.5, size * T.bevel);
      const material = (w) => liquid(w.key ? P.key : base);
      const tx = await text3d(b, text, { size, weight, depth, bevel, curve: 6, face, material });
      const bb = new THREE.Box3().setFromObject(tx.root), cy = (bb.min.y + bb.max.y) / 2;
      const words = [];
      tx.words.forEach((w, k) => {
        w.group.position.y -= cy;
        const mesh = w.group.children.find((o) => o.isMesh); if (!mesh) return;
        words.push({ ...piece(w.group, mesh, w.key ? P.key : base, { size, depth, bevel, drops: w.key ? drops + 1 : drops, k }), text: w.text, key: w.key });
      });
      const sl = { root: tx.root, words, x0: bb.min.x, x1: bb.max.x, h: bb.max.y - bb.min.y, size, depth, bevel, plain: tx.words.map((w) => w.text).join(' '), s: 1 };
      sl.s = Math.min(1, maxW / (sl.x1 - sl.x0)); tx.root.scale.setScalar(sl.s);
      scene.add(tx.root);
      return sl;
    },

    // The brand's logo as one poured solid, `size` px wide (its larger side), in the key liquid.
    logo(size) {
      const depth = size * T.depth * 0.8, bevel = size * T.bevel * 0.8;
      const g = logo3d(brand, { size, depth, bevel, material: liquid(P.key) }), mesh = g.children[0];
      const bx = new THREE.Box3().setFromObject(g), k = size / Math.max(bx.max.x - bx.min.x, bx.max.y - bx.min.y);
      mesh.geometry.scale(k, k, 1); mesh.geometry.computeBoundingBox();
      const root = new THREE.Group(); root.add(g); scene.add(root);
      const bb = new THREE.Box3().setFromObject(root);
      const w = { ...piece(g, mesh, P.key, { size: size * 0.5, depth, bevel, drops: 3, k: 7 }), text: '', key: true };
      return { root, words: [w], x0: bb.min.x, x1: bb.max.x, h: bb.max.y - bb.min.y, size, depth, bevel, plain: '', s: 1, logo: true };
    },

    // Puts a slab with its middle at frame y, centred between x0 and x1 (frame px), front face on the reading plane.
    place(sl, { y, x0 = SAFE.left, x1 = SAFE.right, align = 'center', z }) {
      const s = sl.s, wdt = (sl.x1 - sl.x0) * s;
      const cx = align === 'center' ? (x0 + x1) / 2 : ((align === 'start') === rtl ? x1 - wdt / 2 : x0 + wdt / 2);
      sl.root.position.set(wx(cx) - (sl.x0 + sl.x1) / 2 * s, wy(y), z ?? -(sl.depth + sl.bevel) * s);
      sl.root.updateMatrixWorld(true);
      for (const w of sl.words) {
        const b = new THREE.Box3().setFromObject(w.group);
        w.yBot = b.min.y; w.yTop = b.max.y; w.cx = (b.min.x + b.max.x) / 2; w.halfW = (b.max.x - b.min.x) / 2; w.zBack = b.min.z;
        w.sx = w.cx + (hash(w.cx, seed, 11) - 0.5) * w.halfW * 0.5;
        w.rS = clamp(w.size * s * T.stream.r, 4, 15); w.sc = s;
      }
      sl.yMid = y;
      return sl;
    },

    // A pour plan for a slab. o: { t0, step, fall?, fill?, out0, out1, drop? (drops fall into the pool), melt?(t) -> 0..1, order? }
    // Returns pose(t), which sets every level, stream and drop for frame time t and records the readable text for the check.
    pour(sl, o) {
      const tf = o.fall ?? T.pour.fall, tfill = o.fill ?? T.pour.fill, step = o.step ?? T.pour.step;
      const yS = wy(-80);
      const plan = sl.words.map((w, i) => {
        const k = o.order ? o.order[i] : i;
        const tp = o.t0 + k * step, tl = tp + tf, td = tl + tfill, tc = td - 0.05;
        const g = 2 * (yS - w.yBot) / (tf * tf);
        const tTail = tc + fallTime(yS - w.yTop, g);
        const q0 = o.out0 + k * 0.035;
        const drops = w.anchors.map((a, j) => {
          const tg = td + 0.06 + 0.14 * j + 0.1 * hash(k, j, seed);
          const falls = !!o.drop && (j === 0 || hash(j, k, seed + 3) < T.drip.fallShare);
          const tDet = tg + T.drip.hang + 0.45 * hash(k, j, seed + 5);
          const r = clamp(w.size * w.sc * T.drip.r, 4, 17) * (w.key ? 1.15 : 1);
          let tLand = 1e9;
          if (falls && tDet < q0) {
            w.mesh.updateMatrixWorld(true); const pt = w.mesh.localToWorld(a.local.clone());
            tLand = tDet + fallTime(pt.y - r - yPool, T.drip.g);
            world.ripples.push({ x: pt.x, z: pt.z, t: tLand, a: T.pool.ring * (0.7 + 0.3 * hash(j, k, 9)) });
          }
          return { tg, falls: falls && tDet < q0, tDet, tLand, r };
        });
        return { tp, tl, td, tc, tTail, g, q0, drops };
      });
      const v = new THREE.Vector3();
      return (t) => {
        let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
        sl.words.forEach((w, i) => {
          const p = plan[i], u = w.u, s = w.sc;
          u.uT.value = t + clock; u.uSx.value = w.sx;
          const melt = o.melt ? o.melt(t) : 0; u.uMelt.value = melt;
          let lev, wave = 0, spread = 0, wet = 0.35;
          if (t < p.tl) lev = -1e5;
          else if (t < p.td) {
            const f = fill((t - p.tl) / (p.td - p.tl)); spread = T.pour.spread;
            lev = w.yBot - 6 + (w.yTop - w.yBot + 12 + spread * w.halfW) * f; wave = w.size * s * T.pour.wave * (1 - f); wet = 1;
          } else { lev = 1e5; wet = 0.35 + 0.65 * Math.exp(-(t - p.td) * 4); }
          const q = drain(span(t, p.q0, Math.max(p.q0 + 0.05, o.out1 - 0.02)));
          if (q > 0) { const top = w.yTop + 10 + w.halfW * 0.0; lev = Math.min(lev, top - (w.yTop - w.yBot + 24) * q); wave = w.size * s * T.pour.wave * 0.6 * Math.sin(q * Math.PI); spread = 0; wet = 1; }
          u.uLevel.value = lev; u.uSpread.value = spread; u.uWave.value = wave; u.uWet.value = wet;
          // the set: one soft wobble when the mould is full
          const wb = wobble(t - p.td) * T.pour.set;
          w.group.scale.set(1 + wb * 0.6, 1 - wb, 1);
          // the stream: falls behind the word from above the frame; cut off just before the mould is full, its tail falls in
          const zS = w.zBack - w.rS - 4;
          const yHead = yS - fall(t - p.tp, p.g), top = t < p.tc ? yS : yS - fall(t - p.tc, p.g);
          const bottom = Math.max(yHead, w.yBot + 2);
          const on = t >= p.tp && t < p.tTail && q <= 0 && top > bottom + 2;
          w.stream.visible = on;
          if (on) { const r = w.rS * (t < p.tl ? 0.85 : 1); w.stream.scale.set(r, top - bottom, r); w.stream.position.set(w.sx, top, zS); }
          w.head.visible = on && t < p.tl && yHead > w.yBot;
          if (w.head.visible) { w.head.scale.set(w.rS * 1.25, w.rS * 1.9, w.rS * 1.25); w.head.position.set(w.sx, yHead, zS); }
          // drops on the low edges
          w.mesh.updateMatrixWorld(true);
          w.anchors.forEach((a, j) => {
            const d = p.drops[j], gr = E(span(t, d.tg, d.tg + 0.45)) * (1 - E(span(t, p.q0 - 0.1, p.q0 + 0.15)));
            const r = d.r * gr * (1 + melt * 0.6);
            a.world.copy(a.local); a.world.x += melt * (a.local.x - u.uBox.value.z) * 0.14; a.world.z += melt * u.uBox.value.w; w.mesh.localToWorld(a.world);
            if (r < 0.6 || t < p.td) { a.mesh.visible = false; return; }
            if (d.falls && t >= d.tDet) {
              const y = a.world.y - d.r * 1.2 - fall(t - d.tDet, T.drip.g);
              a.mesh.visible = y > yPool + d.r * 0.5;
              a.mesh.scale.set(d.r * 0.85, d.r * 1.3, d.r * 0.85); a.mesh.position.set(a.world.x, y, a.world.z);
              return;
            }
            const st = 0.35 * gr + 0.18 * Math.sin((t - d.tg) * 5.5 + j) * gr + melt * 0.8;
            a.mesh.visible = true;
            a.mesh.scale.set(r, r * (1 + st), r); a.mesh.position.set(a.world.x, a.world.y - r * (0.5 + st * 0.7), a.world.z);
          });
          // what a reader sees: words from the moment a third of them is full, until they have drained by two thirds
          if (sl.logo || !kit) return;
          const shown = (t >= p.tl + (p.td - p.tl) * 0.33) && q < 0.66;
          if (!shown) return;
          const b = screenBox(w.group, cam, W, H);
          bx0 = Math.min(bx0, b[0]); bx1 = Math.max(bx1, b[1]); by0 = Math.min(by0, b[2]); by1 = Math.max(by1, b[3]);
        });
        if (kit && bx1 > bx0) kit.rec(bx0, bx1, by0, by1, sl.plain);
      };
    },

    // A bead of the key liquid (a list bullet): falls from above the frame, splats on its spot, settles round; drains away at out0.
    bead({ x, y, r, t0, out0, out1 }) {
      const m = new THREE.Mesh(ball, liquid(P.key, false)); m.castShadow = true; m.visible = false; scene.add(m);
      const X = wx(x), Y = wy(y), yS = wy(-60), tf = T.pour.fall * 1.2, g = 2 * (yS - Y) / (tf * tf), t1 = t0 - tf;
      return (t) => {
        const q = E(span(t, out0, out1)); m.visible = t >= t1 && q < 1;
        if (!m.visible) return;
        if (t < t0) { m.position.set(X, yS - fall(t - t1, g), r); m.scale.set(r * 0.8, r * 1.5, r * 0.8); return; }
        const wb = wobble(t - t0, 13, 6) * 0.9, k = 1 - q;
        m.position.set(X, Y - r * wb * 0.3, r * 0.4); m.scale.set(r * (1 + wb * 0.5) * k, r * (1 - wb * 0.5) * k, r * 0.7 * k);
      };
    },

    draw(ctx, t) {
      const time = t + clock; aim(time);
      RU.uT.value = t;
      const live = ripples.filter((r) => r.t <= t + 0.001 && t - r.t < 3).sort((a, b) => b.t - a.t).slice(0, 8);
      RU.uR.value.forEach((v, i) => { const r = live[i]; if (r) v.set(r.x, r.z, r.t, r.a); else v.set(0, 0, -99, 0); });
      R.gl.render(scene, cam);
      ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}
