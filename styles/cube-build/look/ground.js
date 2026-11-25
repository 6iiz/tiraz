// The cube-build ground: a work mat seen from above and a little in front, and words made of small cubes that stand on it.
// The brand's background is the mat (with a faint construction grid), its text colour is the cubes, its accent the key cubes.
// Text is voxelised once in create(): the browser shapes and paints the words (joins, dots and marks right), the painting is
// sampled on a square grid, and every covered cell becomes one cube of an InstancedMesh. Frames only move cubes and render.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed });
//   const set = await W3.voxels(fitted, { x0, x1, y, align, pitch });   // cells in frame pixels, word and key flags
//   const pool = W3.pool(n);  pool.put(i, x, y, z, side, height, rx, ry, rz);  pool.color(i, hex);   then W3.draw(ctx, t)
//
// The camera's frustum is solved so the mat (z = 0) maps 1 unit to 1 frame pixel: layout is in frame pixels, the 3D lives on it.
// One WebGL renderer is shared by every part of a reel (one context); each part has its own scene.
import { THREE } from '/engine/three3d.js';
import { mix, contrast, font, SAFE, clamp } from '/engine/kit.js';

let shared = null;
function renderer(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0;
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  shared = { W, H, canvas, gl }; return shared;
}

// Colour roles, all from the brand. The mat is the background, the cubes the text colour (they always contrast). The key colour is
// the accent, lifted towards the text colour if it is too close to the mat; the old value is a grey mix that still reads.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  let key = accent; for (let k = 0.15; contrast(key, bg) < 3 && k <= 0.9; k += 0.15) key = mix(accent, text, k);
  let old = mix(text, bg, 0.45); for (let k = 0.4; contrast(old, bg) < 3.2 && k > 0; k -= 0.05) old = mix(text, bg, k);
  const dark = contrast(bg, '#000000') < contrast(bg, '#ffffff');
  return { mat: dark ? mix(bg, text, 0.07) : bg, ink: text, key, old, accent, dark,
    line: mix(bg, text, dark ? 0.13 : 0.09), cross: mix(bg, text, dark ? 0.22 : 0.18), lead: mix(text, bg, 0.22), soft: mix(text, bg, 0.5) };
}

export async function create({ W, H, brand, look, clock = 0, kit, seed = 0 }) {
  const T = look.tokens, C = T.camera, P = palette(brand), rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1;
  const R = renderer(W, H);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.mat);

  // ---- camera: a shifted lens, eye above and a little in front of the mat (so cubes show their front side), aimed straight down z
  const cam = new THREE.PerspectiveCamera(30, W / H, 20, 20000), eye = new THREE.Vector3();
  function aim(time) {
    const a = (time / C.period) * Math.PI * 2;
    eye.set(-dir * C.ex + C.drift * Math.sin(a), C.ey + C.drift * 0.5 * Math.cos(a * 0.7), C.dist);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / C.dist;
    cam.projectionMatrix.makePerspective((-W / 2 - eye.x) * k, (W / 2 - eye.x) * k, (H / 2 - eye.y) * k, (-H / 2 - eye.y) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: a soft sky and one key light from above the far reading-end corner, the only one that casts shadows
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, T.light.sky));
  const sun = new THREE.DirectionalLight(0xfffaf3, T.light.sun);
  sun.position.set(dir * 700, 1300, 2400); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -900, right: 900, top: 1300, bottom: -1300, near: 200, far: 6000 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6; sun.shadow.radius = 3;

  // ---- the mat: the brand background with a faint construction grid and a small cross on every fourth crossing
  const M = T.grid.module, tile = document.createElement('canvas'); tile.width = tile.height = 256;
  { const g = tile.getContext('2d'), n = 4, c = 256 / n;
    g.fillStyle = P.mat; g.fillRect(0, 0, 256, 256); g.fillStyle = P.line;
    for (let i = 0; i < n; i++) { g.fillRect(i * c, 0, 2, 256); g.fillRect(0, i * c, 256, 2); }
    g.fillStyle = P.cross; g.fillRect(0, 0, 3, 3); g.fillRect(-9, 0, 21, 2); g.fillRect(0, -9, 2, 21); g.fillRect(247, 0, 9, 2); g.fillRect(0, 247, 2, 9); g.fillRect(0, 0, 12, 2); g.fillRect(0, 0, 2, 12); }
  const tex = new THREE.CanvasTexture(tile); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  const span4 = M * 4, FW = W * 3, FH = H * 3; tex.repeat.set(FW / span4, FH / span4);
  tex.offset.set(((FW / 2 - W / 2) % span4) / span4, ((FH / 2 - H / 2) % span4) / span4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.92, metalness: 0 }));
  floor.receiveShadow = true; scene.add(floor);

  // ---- supply: a few small piles of spare cubes at the top and bottom edges, where no text ever sits (frame px, seeded per part)
  { const hs = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return v - Math.floor(v); };
    const spots = [], tone = mix(P.ink, P.mat, T.supply.tone);
    // (off by default: tokens supply.piles = 0 — a clean mat reads better) one tidy stepped stack in the bottom corner on the reading-start side (scattered little piles read as noise)
    const cube = 30, cols = 6, side = rtl ? 1 : -1, bx = side > 0 ? W - 70 : 70, by = 1760;
    if (T.supply.piles > 0) for (let lvl = 0; lvl < 3; lvl++) for (let row = 0; row < 3 - lvl; row++) for (let c = 0; c < cols - lvl * 2; c++) {
      spots.push({ x: bx - side * (c + lvl * 0.5) * cube, y: by - (row + lvl * 0.5) * cube, z: cube / 2 + lvl * cube, r: 0,
        c: lvl === 2 && c === 0 ? P.key : tone });
    }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 }), Math.max(1, spots.length));
    const mm = new THREE.Matrix4(), cc = new THREE.Color();
    spots.forEach((s, i) => { mm.makeRotationZ(s.r); mm.scale(new THREE.Vector3(cube * 0.88, cube * 0.88, cube * 0.95)); mm.setPosition(s.x - W / 2, H / 2 - s.y, s.z); im.setMatrixAt(i, mm); im.setColorAt(i, cc.set(s.c)); });
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.count = spots.length; if (spots.length) scene.add(im); }

  const toW = (x, y, z) => new THREE.Vector3(x - W / 2, H / 2 - y, z);
  const v3 = new THREE.Vector3();
  // where a box in frame pixels, standing from z0 to z1, lands on screen
  function screen(x0, x1, y0, y1, z0 = 0, z1 = 0) {
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    for (const X of [x0, x1]) for (const Y of [y0, y1]) for (const Z of [z0, z1]) {
      v3.set(X - W / 2, H / 2 - Y, Z).project(cam); const sx = (v3.x + 1) / 2 * W, sy = (1 - v3.y) / 2 * H;
      a = Math.min(a, sx); b = Math.max(b, sx); c = Math.min(c, sy); d = Math.max(d, sy);
    }
    return [a, b, c, d];
  }

  const world = {
    THREE, scene, camera: cam, P, T, rtl, dir, W, H, toW, screen,
    pitch: (size) => Math.max(T.vox.min, size * T.vox.k),

    // A fitted text (kit.fit) as cells. Rows are laid out exactly like kit.drawText (x0..x1, y = middle of the first row, align).
    // Returns { cells: [{ x, y, gx, gy, w, key, row, u }], rows: [{ x0, x1, y0, y1, text }], pitch, x0, x1, y0, y1 }.
    //  u is the reading position 0..1 over the whole text (rows in order), used to stagger arrivals.
    async voxels(f, { x0 = SAFE.left, x1 = SAFE.right, y, align = 'center', pitch, grow = T.vox.grow, thr = T.vox.thr, family = f.family }) {
      const p = pitch ?? world.pitch(f.size);
      await document.fonts.load(font(f.weight, f.size, family));
      const g0 = document.createElement('canvas').getContext('2d'); g0.font = font(f.weight, f.size, family);
      const words = []; let wi = 0;
      f.rows.forEach((row, r) => {
        const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
        const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
        let cur = rtl ? left + row.width : left;
        for (const w of row.words) {
          const wl = rtl ? cur - w.width : cur;
          words.push({ w: w.w, key: !!w.key, arabic: w.arabic, x0: wl, x1: wl + w.width, y: yy, row: r, i: wi++ });
          cur = rtl ? wl - f.space : wl + w.width + f.space;
        }
      });
      const pad = f.size * 0.6 + p * 2;
      const bx0 = Math.floor((Math.min(...words.map((w) => w.x0)) - pad) / p) * p, bx1 = Math.ceil((Math.max(...words.map((w) => w.x1)) + pad) / p) * p;
      const by0 = Math.floor((y - f.size - p * 2) / p) * p, by1 = Math.ceil((y + (f.rows.length - 1) * f.lead + f.size + p * 2) / p) * p;
      const S = clamp(14 / p, 1, 3), cw = Math.ceil((bx1 - bx0) * S), ch = Math.ceil((by1 - by0) * S);
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.scale(S, S); g.translate(-bx0, -by0); g.font = font(f.weight, f.size, family); g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = p * grow;
      for (const w of words) {
        const c = `rgb(${w.i + 1},${w.key ? 200 : 0},0)`; g.fillStyle = c; g.strokeStyle = c;
        g.direction = w.arabic ? 'rtl' : 'ltr'; g.textAlign = w.arabic ? 'right' : 'left';
        const xx = w.arabic ? w.x1 : w.x0;
        if (grow > 0) g.strokeText(w.w, xx, w.y); g.fillText(w.w, xx, w.y);
      }
      const px = g.getImageData(0, 0, cw, ch).data, cells = [];
      const nx = Math.round((bx1 - bx0) / p), ny = Math.round((by1 - by0) / p);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const sx0 = Math.floor(i * p * S), sx1 = Math.min(cw, Math.floor((i + 1) * p * S)), sy0 = Math.floor(j * p * S), sy1 = Math.min(ch, Math.floor((j + 1) * p * S));
        let sum = 0, n = 0, best = -1, bi = 0;
        for (let yy = sy0; yy < sy1; yy++) for (let xx = sx0; xx < sx1; xx++) { const o = (yy * cw + xx) * 4, a = px[o + 3]; sum += a; n++; if (a > best) { best = a; bi = o; } }
        if (!n || sum / (n * 255) < thr) continue;
        const word = words[Math.max(0, px[bi] - 1)] ?? words[0];
        cells.push({ x: bx0 + (i + 0.5) * p, y: by0 + (j + 0.5) * p, gx: Math.round(bx0 / p) + i, gy: Math.round(by0 / p) + j, w: word.i, key: px[bi + 1] > 100, row: word.row });
      }
      // reading position: rows in order, and along each row from its reading start
      const rows = f.rows.map((_, r) => {
        const cs = cells.filter((c) => c.row === r);
        const a = Math.min(...cs.map((c) => c.x)) - p / 2, b = Math.max(...cs.map((c) => c.x)) + p / 2, c0 = Math.min(...cs.map((c) => c.y)) - p / 2, c1 = Math.max(...cs.map((c) => c.y)) + p / 2;
        return { x0: a, x1: b, y0: c0, y1: c1, text: f.rows[r].words.map((w) => w.w).join(' ') };
      });
      const nr = rows.length;
      for (const c of cells) {
        const r = rows[c.row], along = (rtl ? r.x1 - c.x : c.x - r.x0) / Math.max(1, r.x1 - r.x0);
        c.u = (c.row + along) / nr;
      }
      const all = { cells, rows, pitch: p, words,
        x0: Math.min(...rows.map((r) => r.x0)), x1: Math.max(...rows.map((r) => r.x1)), y0: Math.min(...rows.map((r) => r.y0)), y1: Math.max(...rows.map((r) => r.y1)) };
      return all;
    },

    // The brand logo as cells, `size` px wide, centred on (cx, cy).
    logoVoxels(size, cx, cy, pitch) {
      const L = brand.logo, box = L.box || 256, p = pitch, S = clamp(14 / p, 1, 3);
      const n = Math.ceil(size / p) + 2, cw = Math.ceil(n * p * S);
      const cv = document.createElement('canvas'); cv.width = cv.height = cw;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.scale(S, S); g.translate(p, p); g.scale(size / box, size / box); g.fillStyle = '#fff';
      if (L.path) g.fill(new Path2D(L.path), L.rule === 'evenodd' ? 'evenodd' : 'nonzero');
      else if (L.draw) L.draw(g, 0, 0, box, '#ffffff');
      const px = g.getImageData(0, 0, cw, cw).data, cells = [], x0 = cx - size / 2 - p, y0 = cy - size / 2 - p;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        let sum = 0, k = 0;
        for (let yy = Math.floor(j * p * S); yy < Math.min(cw, Math.floor((j + 1) * p * S)); yy++) for (let xx = Math.floor(i * p * S); xx < Math.min(cw, Math.floor((i + 1) * p * S)); xx++) { sum += px[(yy * cw + xx) * 4 + 3]; k++; }
        if (k && sum / (k * 255) >= 0.5) cells.push({ x: x0 + (i + 0.5) * p, y: y0 + (j + 0.5) * p, gx: i, gy: j, w: 0, key: true, row: 0 });
      }
      const ys = cells.map((c) => c.y);
      for (const c of cells) c.u = (c.y - Math.min(...ys)) / Math.max(1, Math.max(...ys) - Math.min(...ys));
      return { cells, pitch: p };
    },

    // Instanced cubes. put() takes frame pixels for x, y, the height z of the cube's centre, its side and its height.
    pool(n) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: T.cube.rough, metalness: 0 });
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const col = new THREE.Color(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < im.count; i++) { im.setColorAt(i, col.set(P.ink)); im.setMatrixAt(i, zero); }
      scene.add(im);
      const cur = new Array(im.count).fill(null);
      return {
        n: im.count, mesh: im,
        put(i, x, y, z, s, h, rx = 0, ry = 0, rz = 0) {
          if (s <= 0.05 || h <= 0.05) { im.setMatrixAt(i, zero); return; }
          e.set(rx, ry, rz); q.setFromEuler(e); pv.set(x - W / 2, H / 2 - y, z); sv.set(s, s, h); m.compose(pv, q, sv); im.setMatrixAt(i, m);
        },
        hide(i) { im.setMatrixAt(i, zero); },
        color(i, hex) { if (cur[i] === hex) return; cur[i] = hex; im.setColorAt(i, col.set(hex)); im.instanceColor.needsUpdate = true; },
        clear() { for (let i = 0; i < im.count; i++) im.setMatrixAt(i, zero); },
        commit() { im.instanceMatrix.needsUpdate = true; },
      };
    },

    // Flat text on top of the 3D (leads, labels, the handle): drawn with the kit, so it is shaped and measured like any text.
    flat(ctx, f, { x0 = SAFE.left, x1 = SAFE.right, y, align = 'center', color = P.lead, key = P.key, dy = 0, alpha = 1 }) {
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(0, dy);
      kit.drawText(ctx, f, { x0, x1, y, align, color, key });
      ctx.restore();
    },

    draw(ctx, t) {
      aim(t + clock);
      R.gl.render(scene, cam);
      ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}
