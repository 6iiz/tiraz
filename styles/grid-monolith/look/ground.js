// The grid-monolith ground: a floor of square blocks on the six-column grid, seen through a shifted lens from high above one
// corner, so every block shows two of its sides and every vertical stays parallel. The brand's lighter colour is the floor and
// the blocks, its darker colour is the ink of the text and of a few standing blocks, and its accent is one single unit.
// Each part builds its own world here once (create), then each frame only moves blocks and slabs and renders.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
//   const sl = await W3.slab('بتشبه *مية* شركة', { size: 96 });     // extruded text, words slide out of a gate on their row
//   W3.place(sl, { row: 2 }); const pose = W3.animate(sl, {...});   // then per frame: pose(t); W3.draw(ctx, t)
//
// One WebGL renderer is shared by every part of a reel (one context, created on first use); each part has its own scene.
// The camera's frustum is solved so that the reading plane (the front of a word that sits on a raised stage) maps 1 unit to
// 1 frame pixel: layout is done in frame pixels, the 3D lives behind it. Frames are a function of t + clock only.
import { THREE, text3d, screenBox } from '/engine/three3d.js';
import { mix, span, SAFE } from '/engine/kit.js';
import { E, sink, press, hash, beatEnv } from './motion.js';

let shared = null;
function renderer(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0;
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.localClippingEnabled = true;
  shared = { W, H, canvas, gl }; return shared;
}

const lum = (h) => {
  const n = parseInt(String(h).replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The style's palette, all from the brand: the lighter of bg/text is the floor (paper), the darker one the ink.
export function tones(brand, T) {
  const a = brand.colors.bg, b = brand.colors.text, [paper, ink] = lum(a) >= lum(b) ? [a, b] : [b, a];
  return { paper, ink, accent: brand.colors.accent, grey: mix(ink, paper, T.tone.grey), gutter: mix(paper, ink, T.tone.gutter),
    margin: mix(paper, ink, T.tone.margin), soft: mix(paper, ink, T.tone.soft) };
}

export async function create({ W, H, brand, look, clock = 0, kit, seed = 0 }) {
  const T = look.tokens, G = T.grid, C = T.camera, HT = T.height;
  const tone = tones(brand, T), rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1;
  const P = (SAFE.right - SAFE.left) / G.cols, side = P * (1 - G.gap);
  const rows = Math.floor((SAFE.bottom - SAFE.top) / P);              // whole grid rows inside the safe area
  const Zt = HT.stage + T.depth.text;                                    // the reading plane
  const R = renderer(W, H);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(tone.gutter);
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;                // frame pixels -> world, on the reading plane
  const colX = (i) => SAFE.left + (i + 0.5) * P, rowY = (j) => SAFE.top + (j + 0.5) * P;   // cell centres, frame pixels

  // ---- camera: shifted lens, eye high above the far corner, looking straight down the z axis
  const cam = new THREE.PerspectiveCamera(30, W / H, 20, 30000);
  const eye = new THREE.Vector3();
  function aim(time) {
    const a = (time / C.period) * Math.PI * 2;
    eye.set(dir * -C.ex + C.drift * Math.sin(a), C.ey + C.drift * 0.4 * Math.sin(a * 0.5), Zt + C.dist);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / C.dist;
    cam.projectionMatrix.makePerspective((-W / 2 - eye.x) * k, (W / 2 - eye.x) * k, (H / 2 - eye.y) * k, (-H / 2 - eye.y) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: soft sky, one sun from the upper far side (opposite the eye) casting the only shadows
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfbfbf, T.light.sky));
  const sun = new THREE.DirectionalLight(0xfffaf2, T.light.sun);
  sun.position.set(dir * 1300, 1700, 2600); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1500, right: 1500, top: 1800, bottom: -1800, near: 200, far: 7000 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 1.2; sun.shadow.radius = 4;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 4, H * 4), new THREE.MeshStandardMaterial({ color: tone.gutter, roughness: 0.95 }));
  floor.receiveShadow = true; scene.add(floor);

  // ---- the blocks: one instanced mesh, base on the floor, height set per frame
  const I0 = -2, I1 = G.cols + 3, J0 = -5, J1 = Math.ceil((H - SAFE.top) / P) + 1;
  const cells = [], at = new Map();
  for (let j = J0; j < J1; j++) for (let i = I0; i < I1; i++) {
    const c = { i, j, x: wx(colX(i)), y: wy(rowY(j)), stages: [], reserved: false, color: null };
    cells.push(c); at.set(i + ',' + j, c);
  }
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0, 0.5);
  const blocks = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 }), cells.length);
  blocks.castShadow = true; blocks.receiveShadow = true; scene.add(blocks);
  const M = new THREE.Matrix4(), col = new THREE.Color();

  // The accent unit: one block, never part of the floor's rhythm.
  const unit = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: tone.accent, roughness: 0.5, metalness: 0.05 }));
  unit.castShadow = true; unit.receiveShadow = true; unit.visible = false; scene.add(unit);

  const markRow = Math.floor((SAFE.bottom + 60 - SAFE.top) / P);
  let painted = false;
  function paint() {                                                    // colours are decided once, after the part has reserved its cells
    cells.forEach((c, n) => {
      let k = c.color;
      if (!k) {
        const inSafe = c.i >= 0 && c.i < G.cols;
        k = inSafe ? tone.paper : tone.margin;
        if (!c.reserved && c.j !== markRow && hash(c.i, c.j, seed + 99) < T.floor.ink) k = tone.ink;   // never under the mark
        else if (!c.reserved && hash(c.j, c.i, seed + 7) < T.floor.soft) k = tone.soft;
      }
      blocks.setColorAt(n, col.set(k));
    });
    blocks.instanceColor.needsUpdate = true; painted = true;
  }

  const world = {
    THREE, scene, camera: cam, eye, tone, P, side, rows, rtl, dir, Zt, wx, wy, colX, rowY, unit,
    cell: (i, j) => at.get(i + ',' + j),
    // A part claims cells (with a margin around them): no standing ink block and no beat riser lands there.
    reserve(i0, i1, j0, j1, pad = 1) {
      for (let j = j0 - pad; j <= j1 + pad; j++) for (let i = i0 - pad; i <= i1 + pad; i++) { const c = at.get(i + ',' + j); if (c) c.reserved = true; }
    },
    // A height function for a cell (frame time of the part -> height). The highest function wins.
    stage(i, j, fn, color) { const c = at.get(i + ',' + j); if (!c) return; c.stages.push(fn); c.reserved = true; if (color) c.color = color; },
    // Places the accent unit on a cell, at height h, with its side scaled by s.
    placeUnit(x, y, h, s = 1, z0 = 0) {
      unit.visible = h > 0.5;
      unit.position.set(x, y, z0); unit.scale.set(side * s, side * s, Math.max(0.01, h));
    },

    // Extruded text. Each word gets its own material with a clipping gate, so it can slide out of the edge where it begins.
    async slab(text, { size, weight = 800, face = 'display', depth = T.depth.text, color = tone.ink, keyColor = tone.paper, ltr = false, maxW = SAFE.right - SAFE.left - 30 }) {
      const mats = new Map(), b = ltr ? { ...brand, dir: 'ltr' } : brand;
      const material = (w) => {
        if (!mats.has(w)) {
          const plane = new THREE.Plane(new THREE.Vector3(dir, 0, 0), 1e6);
          const m = new THREE.MeshStandardMaterial({ color: w.key ? keyColor : color, roughness: 0.52, metalness: 0, clippingPlanes: [plane], clipShadows: true, side: THREE.DoubleSide });
          const c0 = w.key ? keyColor : color, sideC = mix(c0, w.key ? tone.ink : tone.paper, w.key ? 0.3 : 0.42);
          m.userData.plane = plane; m.userData.side = new THREE.MeshStandardMaterial({ color: sideC, roughness: 0.6, metalness: 0, clippingPlanes: [plane], clipShadows: true, side: THREE.DoubleSide });
          mats.set(w, m);
        }
        return mats.get(w);
      };
      const tx = await text3d(b, text, { size, weight, depth, bevel: 0, curve: 6, face, material });
      tx.root.traverse((o) => { if (o.isMesh && o.material?.userData?.side) o.material = [o.material, o.material.userData.side]; });   // crisp face, lighter sides
      const bb = new THREE.Box3().setFromObject(tx.root), cy = (bb.min.y + bb.max.y) / 2;
      const words = tx.words.map((w) => {
        w.group.position.y -= cy;
        const wb = new THREE.Box3().setFromObject(w.group);
        return { ...w, mat: mats.get(w), home: w.group.position.clone(), x0: wb.min.x, x1: wb.max.x, plane: mats.get(w)?.userData.plane };
      });
      const sl = { root: tx.root, words, x0: bb.min.x, x1: bb.max.x, h: bb.max.y - bb.min.y, size, depth, plain: words.map((w) => w.text).join(' '), s: 1 };
      sl.s = Math.min(1, maxW / (sl.x1 - sl.x0)); tx.root.scale.setScalar(sl.s);
      // one ink block under each run of key words
      sl.keys = [];
      for (let k = 0; k < words.length; k++) {
        if (!words[k].key) continue;
        let e = k; while (e + 1 < words.length && words[e + 1].key) e++;
        const run = words.slice(k, e + 1), a = Math.min(...run.map((w) => w.x0)), z = Math.max(...run.map((w) => w.x1));
        const pad = size * 0.09, kb = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: tone.ink, roughness: 0.6 }));
        kb.position.set((a + z) / 2, 0, 0); kb.scale.set(z - a + pad * 2, sl.h + pad * 3, 0.01); kb.castShadow = true; kb.receiveShadow = true; kb.visible = false;
        tx.root.add(kb); sl.keys.push({ mesh: kb, words: run, first: k });
        k = e;
      }
      scene.add(tx.root);
      return sl;
    },

    // Puts a slab on a row of the grid (or at frame y), flush to the reading side (or centred), and records where it rests.
    place(sl, { row, y, x0 = SAFE.left, x1 = SAFE.right, align = 'start', z = HT.stage }) {
      const yy = y ?? rowY(row), s = sl.s;
      let x;
      if (align === 'center') x = (wx(x0) + wx(x1)) / 2 - (sl.x0 + sl.x1) / 2 * s;
      else if ((align === 'start') === rtl) x = wx(x1) - sl.x1 * s - 2; else x = wx(x0) - sl.x0 * s + 2;
      sl.root.position.set(x, wy(yy), z); sl.rest = new THREE.Vector3(x, wy(yy), z); sl.restZ = z;
      aim(clock); const b = screenBox(sl.root, cam, W, H);              // the slab's sides lean towards the eye: keep them inside the safe area
      const m = 13;
      if (b[1] > SAFE.right - m) sl.rest.x -= b[1] - (SAFE.right - m);
      if (b[0] < SAFE.left + m) sl.rest.x += SAFE.left + m - b[0];
      if (b[2] < SAFE.top + m) sl.rest.y -= SAFE.top + m - b[2];
      sl.root.position.copy(sl.rest);
      const sx0 = W / 2 + sl.rest.x + sl.x0 * s, sx1 = W / 2 + sl.rest.x + sl.x1 * s;   // its cells on the grid
      sl.i0 = Math.max(0, Math.floor((sx0 - SAFE.left) / P)); sl.i1 = Math.min(G.cols - 1, Math.floor((sx1 - SAFE.left - 1) / P));
      sl.row = row ?? Math.round((yy - SAFE.top) / P - 0.5);
      return sl;
    },

    // Sets a slab's pose for frame time t. o: { t0, step, slide, keyAt?, out0, out1, z(t) -> stage top, lift? }
    //  words slide out of the gate at their reading-start edge, one per step, and lock; key runs are then lifted on an ink block;
    //  between out0 and out1 the slab sinks into the floor along its line of sight. Records the visible text for the check.
    pose(sl, t, o) {
      const s = sl.s, k0 = sl.keys[0]?.first ?? 1e9, ks = (k) => o.t0 + k * o.step + (k >= k0 ? (o.keyGap ?? 0) : 0);
      const so = sink(span(t, o.out0, o.out1));
      const zNow = o.z(t) - so * (sl.depth + HT.stage + 50);
      const f = (sl.restZ - zNow) / (eye.z - sl.restZ);
      sl.root.position.set(sl.rest.x + (sl.rest.x - eye.x) * f, sl.rest.y + (sl.rest.y - eye.y) * f, zNow);
      const lift = new Map();
      for (const r of sl.keys) {
        const tl = ks(r.first) + o.slide * 0.9, h = (o.lift ?? HT.key) * E(span(t, tl, tl + 0.25));
        r.mesh.visible = h > 0.5; r.mesh.scale.z = Math.max(0.01, h);
        r.words.forEach((w) => lift.set(w, h));
      }
      let any = false, bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
      sl.words.forEach((w, k) => {
        const p = span(t, ks(k), ks(k) + o.slide);
        w.group.visible = p > 0 && so < 1;
        if (!w.group.visible) return;
        const lead = (1 - E(p)) * (w.x1 - w.x0 + 16) * -dir;           // still behind its gate, on the reading-start side
        const pr = press(span(t, ks(k) + o.slide, ks(k) + o.slide + 0.16));
        w.group.position.set(w.home.x + lead, w.home.y, (lift.get(w) ?? 0) - pr * 3);
        const gate = sl.root.position.x + (rtl ? w.x1 + 3 : w.x0 - 3) * s;
        if (w.plane) w.plane.constant = -dir * gate;
        if (so > 0.92) return;
        const b = screenBox(w.group, cam, W, H); any = true;
        const g = W / 2 + gate;                                          // what shows of a word still sliding ends at its gate
        if (p < 1) { if (rtl) b[1] = Math.min(b[1], g); else b[0] = Math.max(b[0], g); }
        if (b[1] <= b[0]) return;
        bx0 = Math.min(bx0, b[0]); bx1 = Math.max(bx1, b[1]); by0 = Math.min(by0, b[2]); by1 = Math.max(by1, b[3]);
      });
      if (any && bx1 > bx0 && kit) kit.rec(bx0, bx1, by0, by1, sl.plain);
    },

    // A whole slab shown at once (no gates), e.g. a numeral, sitting at height z; sinks like pose().
    still(sl, t, { z, out0, out1, show = true, rec = true, decor = false }) {
      const so = sink(span(t, out0, out1)), zNow = z - so * (sl.depth + HT.stage + 50);
      const f = (sl.restZ - zNow) / (eye.z - sl.restZ);
      sl.root.position.set(sl.rest.x + (sl.rest.x - eye.x) * f, sl.rest.y + (sl.rest.y - eye.y) * f, zNow);
      sl.root.visible = show && so < 1;
      sl.words.forEach((w) => { w.group.visible = true; w.group.position.copy(w.home); if (w.plane) w.plane.constant = 1e6; });
      if (sl.root.visible && rec && so < 0.92 && kit) kit.rec(...screenBox(sl.root, cam, W, H), sl.plain, decor ? { decor: true } : undefined);
    },

    // The rhythm of the free floor: on every beat a few blocks rise and sink again; standing ink blocks rise a little more.
    draw(ctx, t) {
      if (!painted) paint();
      const time = t + clock; aim(time);
      const beat = T.beat, b = Math.floor(time / beat);
      cells.forEach((c, n) => {
        let h = HT.rest;
        if (c.stages.length) { h = 0; for (const fn of c.stages) h = Math.max(h, fn(t)); }
        else if (!c.reserved) {
          for (const bb of [b, b - 1]) {
            if (hash(c.i, c.j, bb * 3 + seed) < T.floor.rise) h += HT.riser * (0.45 + 0.55 * hash(c.j, c.i, bb)) * beatEnv(time - bb * beat, beat);
          }
        }
        M.makeScale(side, side, Math.max(0.5, h)); M.setPosition(c.x, c.y, 0); blocks.setMatrixAt(n, M);
      });
      blocks.instanceMatrix.needsUpdate = true;
      R.gl.render(scene, cam);
      ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}
