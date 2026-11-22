// The letter-city ground: one dusk street, built in 3D. A shared WebGL renderer (one for the whole reel, so eight scenes do not each
// open a context) draws a level camera with a shifted lens (verticals stay vertical, the horizon sits where the layout wants it).
// Words are solid letter towers that stand on the street; the city around them is a deterministic grid of low-poly blocks with lit
// windows, lamps along the kerbs and a sky that runs from the brand's dark colour to a dusk glow mixed from its accent.
//
//   const g = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
//   const w = await g.world({ seed });           // w.scene, w.camera, w.P (palette), w.row(text), w.layout(rows, {...}), w.city({...}), w.render(ctx)
//
// Layout is solved backwards from the screen: each row says where its foot lands on screen (y) and how big its type should look (px);
// the solver puts it at the distance that gives exactly that, so 3D text sits in the safe area like flat text.
import { THREE, logo3d } from '/engine/three3d.js';
import { text3d } from './glyphs.js';
import { mix, rng, contrast, clamp } from '/engine/kit.js';
import { normalPath } from './path.js';

export const SL = 120;                 // every 3D text is built at this size, then scaled into place
const lumOf = (h) => contrast(h, '#000000');

// ---------- one renderer for every scene of the reel ----------
let shared = null;
function glOf(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W, H, false); r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  shared = { W, H, canvas, r }; return shared;
}

// ---------- colours: everything is a mix of the brand's three ----------
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const night = lumOf(bg) <= lumOf(text) ? bg : text, light = night === bg ? text : bg;
  const P = {
    night, light, accent,
    skyTop: mix(night, '#000000', 0.3), skyMid: mix(night, accent, 0.16),
    glow: mix(mix(night, accent, 0.5), light, 0.18), haze: mix(mix(night, accent, 0.34), light, 0.08),
    asphalt: mix(night, light, 0.07), walk: mix(night, light, 0.15), paint: mix(night, light, 0.45),
    wall: mix(night, light, 0.2), wallB: mix(mix(night, accent, 0.22), light, 0.1), roof: mix(night, light, 0.12),
    lit: mix(light, accent, 0.1), litB: mix(light, accent, 0.4),
    face: light, side: mix(night, light, 0.3), old: mix(light, night, 0.42), oldSide: mix(night, light, 0.18),
  };
  // the key colour must stand out against the dusk: a dark accent is lifted towards the light colour until it does
  let key = accent; for (let k = 0.15; contrast(key, P.night) < 3.5 && k <= 0.75; k += 0.15) key = mix(accent, light, k);
  P.key = key; P.keySide = mix(key, night, 0.5); P.keyLit = mix(key, light, 0.35);
  P.ink = contrast(night, key) >= contrast(light, key) ? night : light;      // what reads on an accent plate
  return P;
}

// ---------- textures, made once per palette ----------
const cache = new Map();
const tex = (cv, rep = true) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const CELLS = 8;                // window cells per texture tile
// A tile of 8 x 8 windows: `map` is the wall (white, multiplied by the material colour) with dark glass; `glow` holds only the lit panes.
function windows(P, seed, share, colours) {
  const k = `w${seed}${share}${colours.join()}`; if (cache.has(k)) return cache.get(k);
  const n = 256, c = n / CELLS, A = canvas(n, n), B = canvas(n, n), a = A.getContext('2d'), b = B.getContext('2d'), r = rng(seed);
  a.fillStyle = '#ffffff'; a.fillRect(0, 0, n, n); b.fillStyle = '#000000'; b.fillRect(0, 0, n, n);
  for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) {
    const x = i * c + c * 0.2, y = j * c + c * 0.18, w = c * 0.6, h = c * 0.62;
    a.fillStyle = '#2a2a2a'; a.fillRect(x, y, w, h);
    if (r() < share) { const col = colours[Math.floor(r() * colours.length)]; b.globalAlpha = 0.55 + r() * 0.45; b.fillStyle = col; b.fillRect(x, y, w, h); a.fillStyle = '#9a9a9a'; a.fillRect(x, y, w, h); }
  }
  b.globalAlpha = 1;
  const out = { map: tex(A), glow: tex(B) }; cache.set(k, out); return out;
}
// Floor lines for the front of a letter tower: white with a faint band every floor, so a face reads as a building and stays clean.
function floorLines() {
  if (cache.has('fl')) return cache.get('fl');
  const A = canvas(16, 64), a = A.getContext('2d'); a.fillStyle = '#ffffff'; a.fillRect(0, 0, 16, 64); a.fillStyle = '#d9d9d9'; a.fillRect(0, 58, 16, 6);
  const t = tex(A); cache.set('fl', t); return t;
}
// A soft dusk haze behind flat text, so a lead or a label reads over lit windows: a feathered band of the night colour.
export function haze(ctx, P, x0, x1, yc, h, alpha) {
  const k = `h${Math.round(x1 - x0)}x${Math.round(h)}${P.night}`;
  let c = cache.get(k);
  if (!c) {
    const pad = 60; c = canvas(Math.round(x1 - x0) + pad * 2, Math.round(h) + pad * 2); const a = c.getContext('2d');
    a.filter = 'blur(26px)'; a.fillStyle = P.night; a.globalAlpha = 0.72; a.beginPath(); a.roundRect(pad, pad, c.width - pad * 2, c.height - pad * 2, h / 2); a.fill();
    cache.set(k, c);
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(c, x0 - 60, yc - c.height / 2); ctx.restore();
}
export function glowTex() {
  if (cache.has('g')) return cache.get('g');
  const A = canvas(128, 128), a = A.getContext('2d'), g = a.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  a.fillStyle = g; a.fillRect(0, 0, 128, 128); const t = tex(A, false); cache.set('g', t); return t;
}

// ---------- box geometry with windows that line up with floors (u, v in world units / tile) ----------
class Boxes {
  constructor() { this.p = []; this.n = []; this.uv = []; }
  quad(v, nrm, uv) { for (const i of [0, 1, 2, 0, 2, 3]) { this.p.push(...v[i]); this.n.push(...nrm); this.uv.push(...uv[i]); } }
  box(x0, x1, y0, y1, z0, z1, T, ou = 0, ov = 0, roof = null) {
    const U = (u) => u / T + ou, V = (y) => (y - y0) / T + ov;
    this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[U(x0), V(y0)], [U(x1), V(y0)], [U(x1), V(y1)], [U(x0), V(y1)]]);
    this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [[U(-x1), V(y0)], [U(-x0), V(y0)], [U(-x0), V(y1)], [U(-x1), V(y1)]]);
    this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [[U(-z1), V(y0)], [U(-z0), V(y0)], [U(-z0), V(y1)], [U(-z1), V(y1)]]);
    this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[U(z0), V(y0)], [U(z1), V(y0)], [U(z1), V(y1)], [U(z0), V(y1)]]);
    (roof || this).quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.computeBoundingSphere(); return g;
  }
}

// ---------- the lens: a level camera whose horizon sits at screen y = Yh ----------
function lens(cam, W, H, f, Yh, near = 8, far = 80000) {
  cam.projectionMatrix.makePerspective(-near * (W / 2) / f, near * (W / 2) / f, near * Yh / f, -near * (H - Yh) / f, near, far);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}

export function create({ W, H, brand, look }) {
  const T = look.tokens, F = T.lens.f, P = palette(brand), rtl = brand.dir !== 'ltr';
  const R = glOf(W, H);

  async function world({ seed = 1 } = {}) {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, W / H, 8, 80000);
    camera.matrixAutoUpdate = true;
    const Pw = T.city.window;                                       // one window cell, in world units
    const win = windows(P, 7 + seed % 5, 0.34, [P.lit, P.lit, P.litB]);
    const mkWall = (col) => { const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, metalness: 0.05, map: win.map, emissiveMap: win.glow, emissive: 0xffffff, emissiveIntensity: 1.25 }); return m; };
    const wallA = mkWall(P.wall), wallB = mkWall(P.wallB);
    const plinthM = new THREE.MeshStandardMaterial({ color: mix(P.night, P.light, 0.3), roughness: 0.8, emissive: mix(P.night, P.accent, 0.5), emissiveIntensity: 0.35 });
    const roofM = new THREE.MeshStandardMaterial({ color: P.roof, roughness: 0.95 });
    // text materials: in text units (built at SL), so every letter tower has the same floors whatever its distance
    const Pl = SL * 0.13, rep = 1 / (CELLS * Pl);
    const wt = windows(P, 31, 0.3, [P.lit, P.litB]), wk = windows(P, 53, 0.78, [P.keyLit, P.key, P.light]);
    const rp = (t) => { const c = t.clone(); c.repeat.set(rep, rep); c.needsUpdate = true; return c; };
    const fl = floorLines().clone(); fl.repeat.set(1 / 64, 1 / Pl); fl.needsUpdate = true;
    const M = {
      face: new THREE.MeshStandardMaterial({ color: P.face, map: fl, roughness: 0.55, metalness: 0.05, emissive: P.face, emissiveIntensity: 0.32, fog: false }),
      side: new THREE.MeshStandardMaterial({ color: P.side, map: rp(wt.map), emissiveMap: rp(wt.glow), emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.8, fog: false }),
      keyFace: new THREE.MeshStandardMaterial({ color: P.key, map: fl, roughness: 0.45, metalness: 0.1, emissive: P.key, emissiveIntensity: 0.5, fog: false }),
      keySide: new THREE.MeshStandardMaterial({ color: P.keySide, map: rp(wk.map), emissiveMap: rp(wk.glow), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.7, fog: false }),
      old: new THREE.MeshStandardMaterial({ color: P.old, map: fl, roughness: 0.8, emissive: P.old, emissiveIntensity: 0.18, fog: false }),
      oldSide: new THREE.MeshStandardMaterial({ color: P.oldSide, map: rp(wt.map), emissiveMap: rp(wt.glow), emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.9, fog: false }),
    };
    M.keySideLit = 1.6;                                              // emissive intensity of the key tower's windows once they are on

    scene.fog = new THREE.Fog(P.haze, 2600, 16000);
    const hemi = new THREE.HemisphereLight(mix(P.light, P.accent, 0.25), P.night, 0.9); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(mix(P.light, P.accent, 0.5), 1.4); scene.add(rim, rim.target);

    let Yh = H * 0.5, hc = 100;
    // ---------- sky, baked for this scene's horizon ----------
    function sky() {
      const w = 270, h = 480, A = canvas(w, h), a = A.getContext('2d'), y = Yh / H * h;
      const g = a.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, P.skyTop); g.addColorStop(clamp(y / h * 0.55), P.skyMid); g.addColorStop(clamp((y - 6) / h), P.glow); g.addColorStop(clamp((y + 4) / h), P.haze); g.addColorStop(1, P.haze);
      a.fillStyle = g; a.fillRect(0, 0, w, h);
      const r = rng(seed * 13 + 5); a.fillStyle = P.light;
      for (let i = 0; i < 60; i++) { const sy = r() * y * 0.6; a.globalAlpha = 0.15 + r() * 0.4 * (1 - sy / y); a.fillRect(r() * w, sy, 1, 1); }
      a.globalAlpha = 1;
      const t = tex(A, false); t.minFilter = THREE.LinearFilter; scene.background = t;
    }

    // ---------- a row of letter towers ----------
    // text may carry *key* words. mats(word) -> [front, sides]. keyScale: how much taller a key word stands. Returns a row:
    //  { root, words: [{ group, key, x, y, k, h }], minY, maxY, width, depth, text } in text units (scaled later by layout()).
    async function row(text, { depth = SL * 0.55, keyScale = T.city.keyScale, mats, face = 'display' } = {}) {
      const pick = mats || ((w) => (w.key ? [M.keyFace, M.keySide] : [M.face, M.side]));
      const tx = await text3d(brand, text, { size: SL, weight: 800, depth, curve: 5, face, material: pick }), baseline = tx.baseline;
      tx.root.updateMatrixWorld(true);
      const ws = tx.words.map((w) => {
        const b = new THREE.Box3().setFromObject(w.group), k = w.key ? keyScale : 1;
        return { ...w, x0: b.min.x, x1: b.max.x, gx: w.group.position.x, minY: b.min.y, maxY: b.max.y, k };
      }).sort((a, b) => a.x0 - b.x0);
      // key words stand taller: scale them about the baseline and open the gaps so nothing collides
      let cur = 0;
      ws.forEach((w, i) => {
        const wid = (w.x1 - w.x0) * w.k, off = ((w.x0 + w.x1) / 2 - w.gx) * w.k;
        w.group.scale.setScalar(w.k); w.x = cur + wid / 2 - off; w.y = baseline * (1 - w.k);
        cur += wid + (i < ws.length - 1 ? ws[i + 1].x0 - w.x1 : 0);
      });
      ws.forEach((w) => { w.x -= cur / 2; w.group.position.set(w.x, w.y, 0); w.lo = baseline + (w.minY - baseline) * w.k; w.hi = baseline + (w.maxY - baseline) * w.k; });
      const minY = Math.min(...ws.map((w) => w.lo)), maxY = Math.max(...ws.map((w) => w.hi));
      const reading = tx.words.map((w) => ws.find((x) => x.group === w.group));
      const holder = new THREE.Group(); holder.add(tx.root);
      return { root: holder, inner: tx.root, words: reading, minY, maxY, baseline, width: cur, depth, text: reading.map((w) => w.text).join(' ') };
    }

    // ---------- layout: rows from far (first) to near (last), solved from where they land on screen ----------
    //  rows[i] = { item, size (px of type on screen), y (screen y of its lowest point) }. Yh: the horizon on screen. dNear: distance of the nearest row.
    function layout(rows, { horizon, dNear = T.lens.near }) {
      Yh = horizon; const last = rows.at(-1); hc = dNear * (last.y - Yh) / F;
      rows.forEach((r) => {
        const it = r.item, d = F * hc / (r.y - Yh), s = r.size * d / (F * SL);
        it.s = s; it.d = d; it.zFront = -d;
        it.root.scale.setScalar(s); it.root.position.set(0, -it.minY * s, -d - it.depth * s);
        it.footY = -it.minY * s; it.halfW = it.width * s / 2; it.screen = r;
      });
      lens(camera, W, H, F, Yh); sky();
      return { hc, Yh };
    }
    const pose = (x, y, z, yaw = 0) => { camera.position.set(x, y, z); camera.rotation.set(0, yaw, 0); camera.updateMatrixWorld(true); };
    const lookAt = (x, y, z, tx, tz) => pose(x, y, z, Math.atan2(-(tx - x), -(tz - z)));

    // a podium under a row: from the ground to its baseline, set back so descenders stand in front of it
    function podium(it, mat = plinthM) {
      const s = it.s, top = (it.baseline - it.minY) * s; if (top < 6) return null;
      const b = new Boxes(), z1 = it.zFront - it.depth * s * 0.45, z0 = it.zFront - it.depth * s * 1.1, hw = it.halfW + SL * s * 0.15;
      b.box(-hw, hw, 0, top, z0, z1, Pw * CELLS);
      const m = new THREE.Mesh(b.geometry(), mat); scene.add(m); return m;
    }

    // ---------- lights aimed at the rows ----------
    function aim(items) {
      const near = items.at(-1), cz = near.zFront, hw = Math.max(...items.map((i) => i.halfW)) + 300;
      key.position.set(hw * 0.9, near.s * SL * 9 + 900, cz + 1400); key.target.position.set(0, 0, cz);
      Object.assign(key.shadow.camera, { left: -hw * 1.6, right: hw * 1.6, top: hw * 1.6, bottom: -hw * 1.6, near: 10, far: 8000 }); key.shadow.camera.updateProjectionMatrix();
      rim.position.set(-hw, 1200, items[0].zFront - 3000); rim.target.position.set(0, 0, cz);
    }

    // ---------- the city: street, kerbs, lamps, blocks. keep: screen rects ([x0,x1,y0,y1], distance) no nearer building may cover ----------
    const lamps = [], traffic = [];
    function city({ items = [], poses = [], plaza = null, street = null } = {}) {
      const r = rng(seed * 7919 + 17), farZ = items.length ? Math.min(...items.map((i) => i.zFront)) : -3000;
      const nearZ = items.length ? Math.max(...items.map((i) => i.zFront)) : -1500;
      const sh = street ?? Math.max(T.city.street, ...items.filter((i) => i.zFront === nearZ).map((i) => i.halfW + 120));
      // the street
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), new THREE.MeshStandardMaterial({ color: P.asphalt, roughness: 0.92 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const kerb = new Boxes(), paint = new Boxes(), posts = new Boxes(), zEnd = nearZ + 260;
      const walkM = new THREE.MeshStandardMaterial({ color: P.walk, roughness: 0.9 }), paintM = new THREE.MeshBasicMaterial({ color: P.paint });
      if (!plaza) {
        for (const sgn of [-1, 1]) kerb.box(sgn > 0 ? sh : -sh - 260, sgn > 0 ? sh + 260 : -sh, 0, 9, farZ - 1200, 3000, 1e6);
        for (let z = 2600; z > zEnd + 400; z -= 300) paint.box(-7, 7, 0, 1.5, z - 120, z, 1e6);
        for (let i = 0; i < 7; i++) { const x0 = -sh + 40 + i * (2 * sh - 80) / 7; paint.box(x0, x0 + (2 * sh - 80) / 14, 0, 1.5, zEnd + 60, zEnd + 260, 1e6); }
      } else {
        const disc = new THREE.Mesh(new THREE.CircleGeometry(plaza.r, 48), walkM); disc.rotation.x = -Math.PI / 2; disc.position.set(0, 2, plaza.z); disc.receiveShadow = true; scene.add(disc);
        const ring = new THREE.Mesh(new THREE.RingGeometry(plaza.r * 0.97, plaza.r, 64), paintM); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 3, plaza.z); scene.add(ring);
        for (const sgn of [-1, 1]) kerb.box(sgn > 0 ? sh : -sh - 260, sgn > 0 ? sh + 260 : -sh, 0, 9, plaza.z + plaza.r, 3000, 1e6);
        for (let z = 2600; z > plaza.z + plaza.r + 200; z -= 300) paint.box(-7, 7, 0, 1.5, z - 120, z, 1e6);
      }
      const glowM = new THREE.SpriteMaterial({ map: glowTex(), color: P.lit, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.95 });
      const poolM = new THREE.MeshBasicMaterial({ map: glowTex(), color: P.lit, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.22 });
      const lampAt = (x, z) => {
        posts.box(x - 6, x + 6, 0, 300, z - 6, z + 6, 1e6); const arm = x > 0 ? -1 : 1; posts.box(Math.min(x, x + arm * 60), Math.max(x, x + arm * 60), 292, 300, z - 5, z + 5, 1e6);
        const s = new THREE.Sprite(glowM); s.position.set(x + arm * 60, 290, z); s.scale.set(110, 110, 1); scene.add(s);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), poolM); pool.rotation.x = -Math.PI / 2; pool.position.set(x + arm * 90, 1, z); scene.add(pool);
        lamps.push(s);
      };
      if (!plaza) for (let z = 2400; z > nearZ + 200; z -= 560) { lampAt(-sh - 40, z); lampAt(sh + 40, z - 280); }
      else for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * Math.PI * 2; if (Math.cos(a) > 0.55) continue; lampAt(Math.sin(a) * plaza.r * 1.05, plaza.z + Math.cos(a) * plaza.r * 1.05); }
      scene.add(new THREE.Mesh(kerb.geometry(), walkM), new THREE.Mesh(paint.geometry(), paintM), new THREE.Mesh(posts.geometry(), roofM));

      // cross traffic in front of the block, low enough on screen never to cover a word: cars with lit heads and tails
      const ch = 46;
      if (!plaza && hc > ch * 1.5) {
        const Yn = Yh + F * hc / -nearZ, dc = Math.min(-nearZ - 500, F * (hc - ch) / (Yn + 50 - Yh));
        if (dc > 450) {
          const bodyM = [new THREE.MeshStandardMaterial({ color: mix(P.night, P.light, 0.55), roughness: 0.5, metalness: 0.1, emissive: mix(P.night, P.light, 0.3), emissiveIntensity: 0.4 }), new THREE.MeshStandardMaterial({ color: P.key, roughness: 0.5, metalness: 0.1, emissive: P.key, emissiveIntensity: 0.3 })];
          const glassM = new THREE.MeshStandardMaterial({ color: P.night, roughness: 0.2, metalness: 0.5 });
          const headM = new THREE.SpriteMaterial({ map: glowTex(), color: P.light, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
          const tailM = new THREE.SpriteMaterial({ map: glowTex(), color: P.key, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
          const bodyG = new THREE.BoxGeometry(230, 30, 96), cabG = new THREE.BoxGeometry(120, 22, 84);
          for (let i = 0; i < 6; i++) {
            const dir = i % 2 ? 1 : -1, g = new THREE.Group(), b = new THREE.Mesh(bodyG, bodyM[i % 3 === 0 ? 1 : 0]), c = new THREE.Mesh(cabG, glassM);
            b.position.y = 24; c.position.set(-dir * 15, 50, 0); g.add(b, c);
            for (const zz of [-32, 32]) { const h = new THREE.Sprite(headM); h.position.set(dir * 118, 26, zz); h.scale.set(70, 70, 1); const tl = new THREE.Sprite(tailM); tl.position.set(-dir * 118, 28, zz); tl.scale.set(48, 48, 1); g.add(h, tl); }
            g.position.set(0, 0, -dc + (dir > 0 ? 70 : -90)); scene.add(g);
            traffic.push({ g, dir, x0: -3600 + r() * 7200 + i * 900, v: 520 + r() * 260 });
          }
        }
      }

      // the blocks
      const rects = []; const v = new THREE.Vector3();
      for (const p of poses) {
        pose(...p);
        for (const it of items) {
          const b = new THREE.Box3().setFromObject(it.root); b.min.y = Math.max(0, b.min.y);
          rects.push({ box: proj(b), d: camera.position.z - it.zFront, pose: p });
        }
        if (plaza?.keep) for (const k of plaza.keep) rects.push({ box: proj(k), d: camera.position.z - plaza.z, pose: p });
      }
      function proj(b) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) {
          v.set(X, Y, Z).applyMatrix4(camera.matrixWorldInverse); if (v.z > -1) { v.z = -1; }
          const sx = W / 2 + F * v.x / -v.z, sy = Yh - F * v.y / -v.z; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
        return [x0, x1, y0, y1];
      }
      const walls = [new Boxes(), new Boxes()], roofs = new Boxes(), cell = Pw * 9, TT = Pw * CELLS;
      const zFarCity = farZ - 11000, zNearCity = 2600;
      for (let z = zNearCity; z > zFarCity; z -= cell) for (let x = -5600; x < 5600; x += cell) {
        if (r() < 0.14) continue;
        const behind = z < farZ - 500, side = Math.abs(x + cell / 2);
        if (!behind && side < sh + 300) continue;                                    // the street stays open up to the last row
        if (plaza && Math.hypot(x + cell / 2, z - cell / 2 - plaza.z) < plaza.r + 500) continue;
        const wC = Pw * (4 + Math.floor(r() * 4)), dC = Pw * (4 + Math.floor(r() * 4));
        const x0 = x + Pw * Math.floor(r() * (9 - wC / Pw)), z1 = z - Pw * Math.floor(r() * (9 - dC / Pw)), x1 = x0 + wC, z0 = z1 - dC;
        const far = behind || side > sh + 1800;
        let fl = 4 + Math.floor(r() * r() * (far ? 30 : 14)); if (far && r() < 0.08) fl += 18;
        const h = fl * Pw;
        const bb = new THREE.Box3(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, h, z1));
        let hit = false;
        for (const rc of rects) {
          pose(...rc.pose); const s = proj(bb), dN = camera.position.z - z1;
          if (dN > rc.d - 40) continue;                                                // behind the text: it is skyline, not a wall in front
          if (s[1] > rc.box[0] - 30 && s[0] < rc.box[1] + 30 && s[3] > rc.box[2] - 30 && s[2] < rc.box[3] + 30) { hit = true; break; }
        }
        if (hit) continue;
        const ou = Math.floor(r() * 8) / 8, ov = Math.floor(r() * 8) / 8;
        walls[r() < 0.3 ? 1 : 0].box(x0, x1, 0, h, z0, z1, TT, ou, ov, roofs);
        if (r() < 0.35 && fl > 6) { const ix = Pw * 1, top = h + Pw * (1 + Math.floor(r() * 3)); walls[0].box(x0 + ix, x1 - ix, h, top, z0 + ix, z1 - ix, TT, ou, ov, roofs); }
      }
      walls.forEach((b, i) => { const m = new THREE.Mesh(b.geometry(), i ? wallB : wallA); m.receiveShadow = true; scene.add(m); });
      scene.add(new THREE.Mesh(roofs.geometry(), roofM));
    }

    // where a box of the scene lands on screen right now, with the part under the street cut off
    const tmp = new THREE.Box3();
    function screenOf(obj) {
      tmp.setFromObject(obj); if (tmp.isEmpty()) return null; tmp.min.y = Math.max(0, tmp.min.y); if (tmp.max.y <= 0) return null;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const v = new THREE.Vector3();
      for (const X of [tmp.min.x, tmp.max.x]) for (const Y of [tmp.min.y, tmp.max.y]) for (const Z of [tmp.min.z, tmp.max.z]) {
        v.set(X, Y, Z).project(camera); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      return [x0, x1, y0, y1];
    }

    return {
      scene, camera, P, M, T, F, SL, rtl, row, layout, podium, aim, city, pose, lookAt, screenOf, lamps, key, glow: glowTex,
      get hc() { return hc; }, get Yh() { return Yh; },
      // a small glow in the key colour that sits on a tower's roof and follows it up
      beacon() {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: P.key, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
        const b = new THREE.Box3();
        return { s: sp, at(group, a) { b.setFromObject(group); const h = b.max.y - b.min.y; sp.position.set((b.min.x + b.max.x) / 2, b.max.y + h * 0.08, (b.min.z + b.max.z) / 2); sp.scale.set(h * 0.45, h * 0.45, 1); sp.material.opacity = a; } };
      },
      async logo(size = SL * 3) { return logoSolid(brand, size, M, P); },
      render(ctx, t = 0) {
        for (const c of traffic) { const x = c.x0 + c.dir * c.v * t; c.g.position.x = ((x + 3600) % 7200 + 7200) % 7200 - 3600; }
        R.r.render(scene, camera); ctx.drawImage(R.canvas, 0, 0); },
    };
  }
  return { P, world, rtl };
}

// The brand logo as a solid landmark: front in the key colour, sides with lit windows. Paths with arcs or relative commands are
// rewritten first (the shared base reads only M L Q C Z); a logo given as a picture becomes a lit sign on a slab.
function logoSolid(brand, size, M, P) {
  const L = brand.logo;
  if (L.path) {
    const b = { ...brand, logo: { ...L, path: normalPath(L.path) } };
    const g = logo3d(b, { size, depth: size * 0.32, bevel: 0, material: [M.keyFace, M.keySide] });
    return g;
  }
  const n = 512, A = canvas(n, n), a = A.getContext('2d'); L.draw(a, 0, 0, n, P.key);
  const t = tex(A, false), g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(size, size, size * 0.2), [M.keySide, M.keySide, M.keySide, M.keySide, new THREE.MeshStandardMaterial({ color: P.night, roughness: 0.6, fog: false }), M.keySide]);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.92, size * 0.92), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false }));
  sign.position.z = size * 0.101; g.add(slab, sign); return g;
}
