// The gallery-walk ground: a long gallery wall in the brand's dark colour, a row of framed canvases hung on it at equal spacing, each
// with its own picture light, a plank floor and a skirting board. The canvas of the current part is the one at x = 0; its neighbours
// (blank) hang at +/- spacing so the corridor is the same in every part: that is what lets the joint walk from one part's canvas to the
// next without a seam (see joint.js).
//
//   const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
//   const rows = await G.rows(fit, { y, color });      // painted rows on the canvas, each its own layer
//   per frame: const walking = G.pose(t, at, d); G.wipe(layer, q); G.rec(layer, walking); G.render(ctx);
//
// The camera's frustum is solved so that the canvas surface maps 1 unit to 1 frame pixel when the camera is at rest: layout is done in
// frame pixels (tokens.canvas is the painted area on screen). One WebGL renderer is shared by every part of a reel.
import { THREE, logo3d } from '/engine/three3d.js';
import { mix, contrast, rng, span, font } from '/engine/kit.js';
import { walk, bump, E, EI } from './motion.js';

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

const lum = (h) => contrast(h, '#000000');
// Colour roles, all from the brand: the darker of bg/text is the gallery (wall, frames), the lighter is the canvas (paper); the darker
// one is also the ink on the canvas. The key colour is the accent, deepened towards the ink until it reads on the paper.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const [night, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const paper = light, ink = night;
  let key = accent; for (let k = 0.1; contrast(key, paper) < 3.4 && k <= 0.8; k += 0.1) key = mix(accent, ink, k);
  return {
    night, light, accent, paper, ink, key,
    grey: mix(ink, paper, 0.4), soft: mix(ink, paper, 0.62),
    wall: mix(mix(night, light, 0.16), accent, 0.05), skirt: mix(night, light, 0.07),
    floor: mix(night, light, 0.27), floorB: mix(night, light, 0.2), groove: mix(night, light, 0.08),
    frame: mix(night, light, 0.04), brass: mix(light, accent, 0.28), card: mix(paper, ink, 0.05),
  };
}

// ---------- textures, made once ----------
const cache = new Map();
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
const texOf = (cv, { srgb = true, rep = false, mips = true } = {}) => {
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.generateMipmaps = mips;
  if (!mips) t.minFilter = THREE.LinearFilter; return t;
};
// canvas weave as a bump map: threads over and under, a little irregular
function weave() {
  if (cache.has('weave')) return cache.get('weave');
  const n = 64, cv = canvasOf(n, n), g = cv.getContext('2d'), im = g.createImageData(n, n), r = rng(41);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const over = ((x >> 2) + (y >> 2)) % 2 === 0, fx = ((x & 3) + 0.5) / 4, fy = ((y & 3) + 0.5) / 4;
    const h = over ? Math.sin(Math.PI * fy) : Math.sin(Math.PI * fx), v = Math.round(255 * Math.min(1, Math.max(0, 0.3 + 0.55 * h + (r() - 0.5) * 0.18)));
    const i = (y * n + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = texOf(cv, { srgb: false, rep: true }); cache.set('weave', t); return t;
}
// floor planks running away from the wall: 4 planks per tile across, butt joints staggered along their length
function planks(P) {
  const k = 'planks' + P.floor; if (cache.has(k)) return cache.get(k);
  const w = 256, h = 1024, cv = canvasOf(w, h), g = cv.getContext('2d'), r = rng(77);
  g.fillStyle = P.groove; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    let y = -Math.floor(r() * 400);
    while (y < h) {
      const len = 300 + Math.floor(r() * 420), c = mix(P.floor, P.floorB, r());
      g.fillStyle = c; g.fillRect(i * 64 + 1.5, y + 1.5, 61, len - 3);
      g.globalAlpha = 0.07; g.fillStyle = P.floorB;                     // a faint grain along the plank
      for (let s = 0; s < 9; s++) g.fillRect(i * 64 + 4 + r() * 54, y + 4, 1, len - 8);
      g.globalAlpha = 1; y += len;
    }
  }
  const t = texOf(cv, { rep: true }); cache.set(k, t); return t;
}
// a brush stroke: ragged edges, tapered ends, a few dry streaks (white; the material gives the colour)
function brush() {
  if (cache.has('brush')) return cache.get('brush');
  const w = 512, h = 64, cv = canvasOf(w, h), g = cv.getContext('2d'), r = rng(9);
  const top = [], bot = [];
  for (let x = 0; x <= w; x += 4) {
    const end = Math.min(1, x / 46, (w - x) / 30), sq = Math.sqrt(Math.max(0, end));
    top.push([x, 32 - 26 * sq + (r() - 0.5) * 5]); bot.push([x, 32 + 24 * sq + (r() - 0.5) * 5]);
  }
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(...top[0]); top.forEach((p) => g.lineTo(...p)); bot.reverse().forEach((p) => g.lineTo(...p)); g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (let s = 0; s < 14; s++) { g.globalAlpha = 0.25 + r() * 0.4; const y = 10 + r() * 44, x0 = w * (0.35 + r() * 0.6); g.fillRect(x0, y, w - x0, 1 + r() * 1.5); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const t = texOf(cv); cache.set('brush', t); return t;
}

// ---------- the camera rig: a level camera whose frustum maps the canvas surface 1:1 to frame pixels at rest ----------
export function camRig(W, H, T) {
  const D0 = T.cam.dist, ey0 = H / 2 - T.cam.eyeY, Zc = 8 + T.canvas.depth;
  const cam = new THREE.PerspectiveCamera(40, W / H, 20, 40000);
  const k = cam.near / D0;
  cam.projectionMatrix.makePerspective((-W / 2) * k, (W / 2) * k, (H / 2 - ey0) * k, (-H / 2 - ey0) * k, cam.near, cam.far);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  const set = (x, y, z, yaw) => { cam.position.set(x, ey0 + y, Zc + D0 + z); cam.rotation.set(0, yaw, 0); cam.updateMatrixWorld(true); };
  set(0, 0, 0, 0);
  return { cam, set, D0, ey0, Zc };
}

export async function create({ W, H, brand, look, clock = 0, kit, plaque = true }) {
  const T = look.tokens, P = palette(brand), rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1;
  const C = T.canvas, F = T.frame, K = T.corridor, L = T.light, S = K.spacing;
  const R = renderer(W, H), rig = camRig(W, H, T), cam = rig.cam, Zc = rig.Zc, D0 = rig.D0;
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.wall);

  // ---- light: a soft room light, a frontal fill, and one picture light per canvas (only this part's casts shadows)
  scene.add(new THREE.HemisphereLight(0xfff7ec, 0x2e2e2e, L.sky));
  const fill = new THREE.DirectionalLight(0xffffff, L.fill); fill.position.set(0, 1400, 3200); fill.target.position.set(0, 0, 0); scene.add(fill, fill.target);

  // ---- the canvas geometry (world units = frame pixels on the canvas surface at rest)
  const X0 = wx(C.x0), X1 = wx(C.x1), Y0 = wy(C.y1), Y1 = wy(C.y0), cw = X1 - X0, ch = Y1 - Y0, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2;
  const lip = 20, bx0 = X0 - lip, by0 = Y0 - lip, bw = cw + 2 * lip, bh = ch + 2 * lip;
  const tile = C.tile, weaveT = weave();
  const bumpOf = (x0, y0, w, h) => { const t = weaveT.clone(); t.repeat.set(w / tile, h / tile); t.offset.set((x0 - bx0) / tile, (y0 - by0) / tile); t.needsUpdate = true; return t; };
  const boardG = new THREE.BoxGeometry(bw, bh, C.depth);
  const front = new THREE.MeshStandardMaterial({ color: P.paper, roughness: 0.93, metalness: 0, bumpMap: bumpOf(bx0, by0, bw, bh), bumpScale: 0.6 });
  const edge = new THREE.MeshStandardMaterial({ color: mix(P.paper, P.ink, 0.2), roughness: 0.95 });
  const boardM = [edge, edge, edge, edge, front, edge];
  const rect = (x0, y0, x1, y1, path) => { path.moveTo(x0, y0); path.lineTo(x1, y0); path.lineTo(x1, y1); path.lineTo(x0, y1); path.lineTo(x0, y0); return path; };
  const ring = (ox0, oy0, ox1, oy1, ix0, iy0, ix1, iy1) => { const s = rect(ox0, oy0, ox1, oy1, new THREE.Shape()); s.holes.push(rect(ix0, iy0, ix1, iy1, new THREE.Path())); return s; };
  const b = F.bevel, fw = F.width;
  const mouldG = new THREE.ExtrudeGeometry(ring(X0 - fw + b, Y0 - fw + b, X1 + fw - b, Y1 + fw - b, X0 - b, Y0 - b, X1 + b, Y1 + b),
    { depth: F.depth, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 1 });
  const mouldM = new THREE.MeshStandardMaterial({ color: P.frame, roughness: 0.4, metalness: 0.15 });
  const filletG = new THREE.ExtrudeGeometry(ring(X0, Y0, X1, Y1, X0 + F.fillet, Y0 + F.fillet, X1 - F.fillet, Y1 - F.fillet), { depth: 3, bevelEnabled: false });
  const filletM = new THREE.MeshStandardMaterial({ color: P.accent, roughness: 0.35, metalness: 0.3 });
  // the picture light: a wall plate, two arms and a bar above the frame, with a lit strip under it
  const barY = Y1 + fw + 74, barZ = 240, barL = (cw + 2 * fw) * 0.5;
  const brassM = new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.32, metalness: 0.55, emissive: P.brass, emissiveIntensity: 0.12 });
  const barG = new THREE.CylinderGeometry(15, 15, barL, 20); barG.rotateZ(Math.PI / 2);
  const armG = new THREE.CylinderGeometry(4.5, 4.5, barZ, 8); armG.rotateX(Math.PI / 2);
  const plateG = new THREE.BoxGeometry(84, 34, 10), stripG = new THREE.BoxGeometry(barL * 0.94, 4, 14);

  const spots = [];
  function hang(x, own) {
    const g = new THREE.Group(); g.position.x = x;
    const board = new THREE.Mesh(boardG, boardM); board.position.set(cx, cy, 8 + C.depth / 2); board.receiveShadow = true; g.add(board);
    const mould = new THREE.Mesh(mouldG, mouldM); mould.position.z = 4 + b; mould.castShadow = true; mould.receiveShadow = true; g.add(mould);
    const fil = new THREE.Mesh(filletG, filletM); fil.position.z = Zc; fil.castShadow = own; g.add(fil);
    const bar = new THREE.Mesh(barG, brassM); bar.position.set(cx, barY, barZ); bar.castShadow = false; g.add(bar);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(armG, brassM); a.position.set(cx + s * barL * 0.3, barY, barZ / 2); g.add(a); }
    const plate = new THREE.Mesh(plateG, brassM); plate.position.set(cx, barY, 5); g.add(plate);
    const strip = new THREE.Mesh(stripG, new THREE.MeshBasicMaterial({ color: P.light })); strip.position.set(cx, barY - 15, barZ); g.add(strip);
    const sp = new THREE.SpotLight(0xfff3e2, L.neighbour, 0, 1, L.penumbra, 0);
    sp.position.set(cx, barY - 12, barZ + 10); sp.target.position.set(cx, cy - ch * 0.14, Zc);
    const v = new THREE.Vector3(), axis = new THREE.Vector3().subVectors(sp.target.position, sp.position).normalize();
    let ang = 0;
    for (const [px, py] of [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1]]) { v.set(px, py, Zc).sub(sp.position).normalize(); ang = Math.max(ang, Math.acos(v.dot(axis))); }
    sp.angle = Math.min(1.25, ang * 1.12);
    if (own) { sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0003; sp.shadow.normalBias = 0.8; sp.shadow.camera.near = 40; sp.shadow.camera.far = 3200; sp.shadow.radius = 5; }
    g.add(sp, sp.target); spots.push({ sp, strip, own });
    scene.add(g); return g;
  }
  const ownFrame = hang(0, true); hang(dir * S, false); hang(-dir * S, false);

  // ---- the room: wall, skirting, floor
  const yF = wy(K.floorY);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40000, 9000), new THREE.MeshStandardMaterial({ color: P.wall, roughness: 0.96 }));
  wall.position.set(0, yF + 4500, 0); wall.receiveShadow = true; scene.add(wall);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(40000, K.skirt, 16), new THREE.MeshStandardMaterial({ color: P.skirt, roughness: 0.6 }));
  skirt.position.set(0, yF + K.skirt / 2, 8); scene.add(skirt);
  const ft = planks(P).clone(); ft.repeat.set(40000 / 250, 6000 / 1000); ft.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40000, 6000), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.55, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, yF, 3000); floor.receiveShadow = true; scene.add(floor);

  // ---- painted layers on the canvas
  const SS = 2, layers = [];
  const plane = (n) => new THREE.Plane(new THREE.Vector3(n, 0, 0), 1e6);
  function layerMesh(cv, sx0, sy0, w, h, z, mat0 = {}) {
    const tex = texOf(cv), wx0 = wx(sx0), wy0 = wy(sy0 + h);
    const clip = plane(rtl ? 1 : -1);
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.92, metalness: 0,
      bumpMap: bumpOf(wx0, wy0, w, h), bumpScale: 0.6, clippingPlanes: [clip], ...mat0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); mesh.position.set(wx0 + w / 2, wy0 + h / 2, z); mesh.receiveShadow = true;
    scene.add(mesh);
    return { mesh, mat, tex, clip, cv };
  }
  const A0 = C.x0 + C.pad, A1 = C.x1 - C.pad;
  const G = {
    THREE, scene, camera: cam, P, T, rtl, dir, Zc, wx, wy, S,
    area: { x0: A0, x1: A1, y0: C.y0 + C.pad, y1: C.y1 - C.pad, cx: (C.x0 + C.x1) / 2, cy: (C.y0 + C.y1) / 2 },

    // One painted row of a fitted text (row r of f). y: the screen y of the row's middle. Returns a layer with the row's screen rect and
    // the screen rects of its key runs (for the brush stroke under them).
    async row(f, r, { y, x0 = A0, x1 = A1, align = 'center', color = P.ink, key = P.key, z = 0.45 }) {
      await document.fonts.load(font(f.weight, f.size, f.family));
      const one = { ...f, rows: [f.rows[r]], width: f.rows[r].width, height: f.lead };
      const m = Math.round(f.size * 0.5), w = x1 - x0 + 2 * m, h = Math.round(f.size * 2.3);
      const cv = canvasOf(w * SS, h * SS), g = cv.getContext('2d'); g.scale(SS, SS);
      const words = [];
      kit.drawText(g, one, { x0: m, x1: m + (x1 - x0), y: h / 2, align, color, key, decor: true, each: (wd, i, bx) => { words.push({ key: wd.key, a: bx.x, b: bx.x + bx.width }); } });
      const sx0 = x0 - m, sy0 = y - h / 2;
      const Lr = layerMesh(cv, sx0, sy0, w, h, Zc + z);
      const a = Math.min(...words.map((q) => q.a)), bb = Math.max(...words.map((q) => q.b));
      const keys = [];
      for (let k = 0; k < words.length; k++) {                 // runs of neighbouring key words
        if (!words[k].key) continue; let e = k; while (e + 1 < words.length && words[e + 1].key) e++;
        const run = words.slice(k, e + 1); keys.push({ x0: sx0 + Math.min(...run.map((q) => q.a)), x1: sx0 + Math.max(...run.map((q) => q.b)), y, size: f.size }); k = e;
      }
      const lay = { ...Lr, x0: sx0 + a, x1: sx0 + bb, y0: y - f.size * 0.7, y1: y + f.size * 0.7, text: f.rows[r].words.map((q) => q.w).join(' '), keys, size: f.size };
      layers.push(lay); return lay;
    },
    // All rows of a fitted text, the first row's middle at y.
    async rows(f, o) { const out = []; for (let r = 0; r < f.rows.length; r++) out.push(await G.row(f, r, { ...o, y: o.y + r * f.lead })); return out; },
    // A stroke of the brush across [x0, x1] at screen y (its middle), h tall: under a key run, or through an old value.
    bar({ x0, x1, y, h, color = P.accent, z = 0.3 }) {
      const pad = h * 0.9, w = x1 - x0 + 2 * pad;
      const tx = brush().clone();                                  // the dry end of the stroke is where it stops: on the left in a right-to-left brand
      if (rtl) { tx.wrapS = THREE.RepeatWrapping; tx.repeat.x = -1; tx.offset.x = 1; } tx.needsUpdate = true;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, color, transparent: true, depthWrite: false, roughness: 0.6, metalness: 0, clippingPlanes: [plane(rtl ? 1 : -1)] }));
      mesh.position.set(wx(x0 - pad + w / 2), wy(y), Zc + z); scene.add(mesh);
      return { mesh, mat: mesh.material, clip: mesh.material.clippingPlanes[0], x0: x0 - pad, x1: x1 + pad, y0: y - h / 2, y1: y + h / 2, bar: true };
    },
    // A canvas that is repainted while the part runs (a counting number). paint(g, w, h) draws in screen pixels.
    live({ x0, x1, y0, y1, z = 0.45 }) {
      const w = x1 - x0, h = y1 - y0, cv = canvasOf(w * SS, h * SS), g = cv.getContext('2d');
      const Lr = layerMesh(cv, x0, y0, w, h, Zc + z);
      let last = null;
      return { ...Lr, x0, x1, y0, y1, text: '',
        paint(keyStr, fn) { if (keyStr === last) return; last = keyStr; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.scale(SS, SS); fn(g, w, h); Lr.tex.needsUpdate = true; } };
    },
    // How much of a layer shows: q = 0 nothing, 1 all; it is uncovered from the reading side (a wipe of the brush).
    wipe(l, q) {
      l.mesh.visible = q > 0; l.q = q; if (q <= 0) return;
      const a = wx(l.x0) - 2, z = wx(l.x1) + 2;
      if (q >= 1) { l.clip.constant = 1e6; return; }
      if (rtl) { const xe = z - q * (z - a); l.clip.constant = -xe; } else { const xe = a + q * (z - a); l.clip.constant = xe; }
    },
    // Report a layer's text to the safe-area check, where it is on screen now (the part already uncovered). While walking, the text is
    // passing by, not being read: it is reported as decoration.
    rec(l, walking) {
      if (!kit || !l.mesh.visible || !l.text) return;
      const q = l.q ?? 1; let a = l.x0, z = l.x1;
      if (q < 1) { if (rtl) a = z - q * (z - a); else z = a + q * (z - a); }
      const v = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [sx, sy] of [[a, l.y0], [z, l.y0], [a, l.y1], [z, l.y1]]) {
        v.set(wx(sx), wy(sy), l.mesh.position.z).project(cam); const px = (v.x + 1) / 2 * W, py = (1 - v.y) / 2 * H;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      kit.rec(x0, x1, y0, y1, l.text, walking ? { decor: true } : undefined);
    },
    // The brand's logo as a relief standing out of the canvas, `size` px, centred at screen (sx, sy). grow(q) pushes it out.
    logo(size, sx, sy) {
      const m = new THREE.MeshStandardMaterial({ color: P.accent, roughness: 0.36, metalness: 0.12 });
      const lg = logo3d(brand, { size, depth: 12, bevel: 1.5, material: m }), bb = new THREE.Box3().setFromObject(lg);
      const k = size / Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y); lg.scale.set(k, k, 1);
      const holder = new THREE.Group(); holder.add(lg); holder.position.set(wx(sx), wy(sy), Zc);
      lg.children[0].castShadow = true; scene.add(holder);
      const half = (bb.max.z - bb.min.z) / 2;
      return { holder, grow(q) { holder.visible = q > 0; lg.scale.z = Math.max(0.02, q); lg.position.z = half * Math.max(0.02, q) + 0.5; } };
    },

    // The camera for part time t: walking in from the previous canvas during [at, at + walk], standing (leaning in a little) while the
    // canvas is read, walking on to the next during the last `walk` seconds. Returns true while it walks. o.exit = false: it stays.
    // o.pull: { t0, t1, by } steps back slowly at the end (the ending).
    pose(t, at, d, o = {}) {
      const w = T.walk, exit = o.exit !== false, uIn = span(t, at, at + w), uOut = exit ? span(t, d - w, d) : 0;
      let x = 0, y = 0, z = 0, yaw = 0, walking = false;
      if (uIn < 1) { const q = walk(uIn, T, dir); x = q.x - dir * S; y = q.y; z = q.z; yaw = q.yaw; walking = true; }
      else if (uOut > 0) { const q = walk(uOut, T, dir); x = q.x; y = q.y; z = q.z; yaw = q.yaw; walking = true; }
      else {
        const t1 = exit ? d - w : d;
        if (o.pull) { z = -T.cam.lean * D0 * E(span(t, at + w, o.pull.t0)) + o.pull.by * D0 * EI(span(t, o.pull.t0, o.pull.t1)); }
        else z = -T.cam.lean * D0 * bump(span(t, at + w, t1));
      }
      rig.set(x, y, z, yaw); return walking;
    },
    // The picture light of this canvas: it sits at the corridor's level while walking and comes up when the visitor stands in front.
    lamp(t, at, d, exit = true) {
      const w = T.walk, up = E(span(t, at + w, at + w + 0.28)) * (exit ? 1 - E(span(t, d - w - 0.3, d - w)) : 1);
      for (const s of spots) if (s.own) { s.sp.intensity = L.neighbour + (L.spot - L.neighbour) * up; }
      return up;
    },
    render(ctx) { R.gl.render(scene, cam); ctx.drawImage(R.canvas, 0, 0); },
  };

  // ---- the wall label under the frame, on the reading side: the brand's short name and handle (decoration)
  if (plaque) {
    const pw = 214, ph = 92, px1 = rtl ? C.x1 : C.x0 + pw, px0 = px1 - pw, py0 = C.y1 + fw + 70;
    const card = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 6), new THREE.MeshStandardMaterial({ color: P.card, roughness: 0.85 }));
    card.position.set(wx((px0 + px1) / 2), wy(py0 + ph / 2), 3); card.castShadow = false; card.receiveShadow = true; scene.add(card);
    const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, disp = brand.fonts.display.family;
    await document.fonts.load(font(700, T.size.plaque, disp)); await document.fonts.load(font(500, 18, mono));
    const cv = canvasOf(pw * SS, ph * SS), g = cv.getContext('2d'); g.scale(SS, SS);
    const xs = rtl ? pw - 18 : 18;
    g.textAlign = rtl ? 'right' : 'left'; g.direction = rtl ? 'rtl' : 'ltr'; g.textBaseline = 'middle';
    g.fillStyle = P.ink; g.font = font(700, T.size.plaque, disp); g.fillText(brand.shortName ?? brand.name, xs, 32);
    g.fillStyle = P.accent; g.fillRect(rtl ? pw - 18 - 34 : 18, 52, 34, 3);
    g.direction = 'ltr'; g.fillStyle = P.grey; g.font = font(500, 18, mono); g.fillText(brand.handle, xs, 70);
    const lt = texOf(cv), lm = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: lt, transparent: true, depthWrite: false, roughness: 0.85 }));
    lm.position.set(card.position.x, card.position.y, 6.4); scene.add(lm);
  }
  return G;
}
