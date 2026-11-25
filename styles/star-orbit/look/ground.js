// The star-orbit ground: deep space, built in 3D. A dark sky (always the darker brand colour, pressed towards night if it is not
// dark enough), a seeded field of stars in three depths, a soft nebula mixed from the accent, and one planet in the brand's colours
// that sits outside the reading zone (a giant limb under the safe area, or a small ringed world in the top corner).
// Words are extruded solids on a reading plane at z = 0 that maps 1 unit to 1 frame pixel; the camera never turns, it only drifts
// through a shifted lens, so the text stays exactly where the layout put it while the stars and the planet slide behind it.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed });
//   const row = await W3.row('بتشبه *مية* شركة', { size: 100 });   // words = moons; key runs get a ring with a small moon on it
//   W3.place(row, { y: 700 });                                     // then per frame: W3.fly(row, t, { t0 }); W3.render(ctx, t)
//
// One WebGL renderer is shared by every part of a reel; each part has its own scene. Everything is built in create();
// a frame only moves things and renders. No Math.random: every star, cloud and crater comes from rng(seed).
import { THREE, text3d, screenBox } from '/engine/three3d.js';
import { mix, contrast, rgba, rng, span, SAFE } from '/engine/kit.js';
import { E, S, away, onOrbit } from './motion.js';

let shared = null;
function renderer(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0;
  shared = { W, H, canvas, gl }; return shared;
}

// ---------- colours: all from the brand ----------
const dark = (c) => contrast(c, '#000000');          // 1 = black, 21 = white
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const night = dark(bg) <= dark(text) ? bg : text;
  let light = night === bg ? text : bg;
  // space is never the light colour: the darker brand colour is the sky, pressed towards night only when it is not dark enough
  let sky = night; for (let k = 0.1; dark(sky) > 1.3 && k <= 0.9; k += 0.1) sky = mix(night, '#000000', k);
  for (let k = 0.1; contrast(light, sky) < 9 && k <= 0.8; k += 0.1) light = mix(night === bg ? text : bg, '#ffffff', k);
  let key = accent; for (let k = 0.12; contrast(key, sky) < 4.6 && k <= 0.84; k += 0.12) key = mix(accent, light, k);
  let old = mix(light, sky, 0.4); while (contrast(old, sky) < 4 && old !== light) old = mix(old, light, 0.25);
  const P = {
    night, sky, light, accent, key, old,
    deep: mix(sky, '#000000', 0.3), haze: mix(sky, accent, 0.2), dust: mix(sky, light, 0.12),
    lead: mix(light, sky, 0.22), side: mix(light, sky, 0.5), keySide: mix(key, sky, 0.48), oldSide: mix(old, sky, 0.45),
    moon: mix(mix(light, sky, 0.22), accent, 0.08), crater: mix(light, sky, 0.5),
    p1: mix(accent, sky, 0.3), p2: mix(accent, light, 0.35), p3: mix(sky, light, 0.28), p4: mix(accent, sky, 0.62), p5: mix(mix(accent, light, 0.6), sky, 0.2),
    atmo: mix(accent, light, 0.35), starA: light, starB: mix(light, accent, 0.45), starC: mix(light, '#ffffff', 0.6),
  };
  P.onKey = contrast(P.sky, key) >= contrast(P.light, key) ? P.sky : P.light;
  return P;
}

// ---------- textures, painted once ----------
const cache = new Map();
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

export const glowTex = () => once('glow', () => {
  const A = canvas(128, 128), a = A.getContext('2d'), g = a.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  a.fillStyle = g; a.fillRect(0, 0, 128, 128); return tex(A);
});
const dotTex = () => once('dot', () => {
  const A = canvas(32, 32), a = A.getContext('2d'), g = a.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  a.fillStyle = g; a.fillRect(0, 0, 32, 32); return tex(A);
});
// A bright star: a soft core with four thin diffraction spikes.
export const flareTex = () => once('flare', () => {
  const n = 256, A = canvas(n, n), a = A.getContext('2d'), c = n / 2;
  const g = a.createRadialGradient(c, c, 0, c, c, c * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, 'rgba(255,255,255,0.75)'); g.addColorStop(0.4, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  a.fillStyle = g; a.fillRect(0, 0, n, n);
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const l = a.createLinearGradient(c - dx * c, c - dy * c, c + dx * c, c + dy * c);
    l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.85)'); l.addColorStop(1, 'rgba(255,255,255,0)');
    a.fillStyle = l; if (dx) a.fillRect(0, c - 1.5, n, 3); else a.fillRect(c - 1.5, 0, 3, n);
  }
  return tex(A);
});
// The sky behind everything: a vertical run deep -> sky -> haze and a few soft clouds of the accent, kept faint in the reading band.
function skyTex(P, seed) {
  return once(`sky${seed}${P.sky}${P.accent}`, () => {
    const w = 540, h = 960, A = canvas(w, h), a = A.getContext('2d'), r = rng(seed * 7 + 3);
    const g = a.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.deep); g.addColorStop(0.5, P.sky); g.addColorStop(1, P.haze);
    a.fillStyle = g; a.fillRect(0, 0, w, h);
    const blob = (x, y, rad, col, al) => { const q = a.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, rgba(col, al)); q.addColorStop(1, rgba(col, 0)); a.fillStyle = q; a.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    for (let i = 0; i < 9; i++) {
      const y = r() < 0.5 ? r() * h * 0.3 : h * 0.7 + r() * h * 0.3, x = r() * w, rad = 90 + r() * 200;
      blob(x, y, rad, i % 3 ? mix(P.sky, P.accent, 0.55) : mix(P.sky, P.light, 0.35), i % 3 ? 0.26 : 0.12);
    }
    for (let i = 0; i < 5; i++) blob(r() * w, h * (0.3 + r() * 0.4), 120 + r() * 160, mix(P.sky, P.accent, 0.45), 0.08);
    for (let i = 0; i < 260; i++) { a.fillStyle = rgba(P.light, 0.05 + r() * 0.12); const s = r() < 0.9 ? 1 : 2; a.fillRect(r() * w, r() * h, s, s); }
    return tex(A);
  });
}
// A gas giant in the brand's colours: wavy bands, blurred, and one oval storm.
export function planetTex(P, seed) {
  return once(`pl${seed}${P.accent}${P.sky}`, () => {
    const w = 2048, h = 1024, A = canvas(w, h), a = A.getContext('2d'), r = rng(seed * 13 + 1), cols = [P.p1, P.p2, P.p3, P.p4, P.p5];
    a.fillStyle = P.p1; a.fillRect(0, 0, w, h);
    const band = (y, bh, col, al, amp, fr, ph) => {
      a.fillStyle = col; a.globalAlpha = al; a.beginPath(); a.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) a.lineTo(x, y + amp * Math.sin(x / w * 6.283 * fr + ph) + amp * 0.4 * Math.sin(x / w * 6.283 * fr * 3.1 + ph * 2));
      for (let x = w; x >= 0; x -= 16) a.lineTo(x, y + bh + amp * Math.sin(x / w * 6.283 * fr + ph + 0.9));
      a.closePath(); a.fill();
    };
    let y = 0;
    while (y < h) { const bh = 14 + r() * 70; band(y, bh, cols[Math.floor(r() * cols.length)], 0.6 + r() * 0.4, 4 + r() * 10, 1 + Math.floor(r() * 4), r() * 6.28); y += bh * (0.6 + r() * 0.5); }
    for (let i = 0; i < 90; i++) band(r() * h, 1 + r() * 4, cols[Math.floor(r() * cols.length)], 0.25 + r() * 0.35, 2 + r() * 6, 2 + Math.floor(r() * 5), r() * 6.28);
    a.globalAlpha = 1;
    const B = canvas(w, h), b = B.getContext('2d'); b.filter = 'blur(2px)'; b.drawImage(A, 0, 0); b.filter = 'none';
    const sx = w * (0.3 + r() * 0.4), sy = h * (0.58 + r() * 0.12);
    for (let k = 0; k < 4; k++) { b.fillStyle = rgba(k % 2 ? P.p5 : P.p4, 0.45); b.beginPath(); b.ellipse(sx, sy, 46 - k * 9, 20 - k * 4, 0, 0, 6.283); b.fill(); }
    return tex(B);
  });
}
// Moon rock: the moon colour with soft darker craters.
export function moonTex(P) {
  return once(`moon${P.moon}`, () => {
    const w = 512, h = 256, A = canvas(w, h), a = A.getContext('2d'), r = rng(91);
    a.fillStyle = P.moon; a.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rad = 3 + r() * r() * 26;
      a.fillStyle = rgba(P.crater, 0.35 + r() * 0.3); a.beginPath(); a.arc(x, y, rad, 0, 6.283); a.fill();
      a.strokeStyle = rgba(P.light, 0.22); a.lineWidth = 1.5; a.beginPath(); a.arc(x - 1, y - 1, rad, 3.6, 5.4); a.stroke();
    }
    return tex(A);
  });
}
function ringTex(P) {
  return once(`ring${P.light}${P.accent}`, () => {
    const n = 512, A = canvas(n, n), a = A.getContext('2d'), c = n / 2, r = rng(17);
    for (let rad = c * 0.62; rad < c; rad += 2 + r() * 5) {
      a.strokeStyle = rgba(r() < 0.5 ? P.p2 : P.p3, 0.15 + r() * 0.55); a.lineWidth = 1 + r() * 4; a.beginPath(); a.arc(c, c, rad, 0, 6.283); a.stroke();
    }
    return tex(A);
  });
}

export async function create({ W, H, brand, look, clock = 0, kit, seed = 1 }) {
  const T = look.tokens, C = T.camera, O = T.orbit, Lt = T.light;
  const P = palette(brand), rtl = brand.dir !== 'ltr', dir = rtl ? -1 : 1;
  const R = renderer(W, H), r = rng(seed * 101 + 7);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.deep);
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;              // frame pixels -> world, on the reading plane z = 0
  const D = (H / 2) / Math.tan((C.fov / 2) * Math.PI / 180);           // camera distance at which z = 0 maps 1:1
  const fz = (z) => D / (D - z);                                       // screen scale of something at depth z

  // ---- camera: level, never turning; a shifted lens keeps the reading plane fixed while the eye drifts (parallax)
  const cam = new THREE.PerspectiveCamera(C.fov, W / H, 10, 40000), eye = new THREE.Vector3();
  function aim(time) {
    const a = (time / C.period) * Math.PI * 2;
    eye.set(C.drift * Math.sin(a), C.drift * 0.55 * Math.sin(a * 0.7 + 1), D);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / D;
    cam.projectionMatrix.makePerspective((-W / 2 - eye.x) * k, (W / 2 - eye.x) * k, (H / 2 - eye.y) * k, (-H / 2 - eye.y) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: a white star high on the far side, a soft fill, an accent rim from behind that edges every solid
  scene.add(new THREE.AmbientLight(0xffffff, Lt.ambient));
  const sun = new THREE.DirectionalLight(0xfff6ea, Lt.star); sun.position.set(-dir * 900, 1500, 1100); scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(new THREE.Color(mix(P.key, P.light, 0.3)), Lt.rim); rim.position.set(dir * 700, -300, -900); scene.add(rim, rim.target);

  // ---- the sky plane, far back, covering the view at any drift
  const zSky = -12000, sk = 1 / fz(zSky) * 1.12;
  const skyM = new THREE.Mesh(new THREE.PlaneGeometry(W * sk, H * sk), new THREE.MeshBasicMaterial({ map: skyTex(P, seed % 4), toneMapped: false, depthWrite: false }));
  skyM.position.z = zSky; scene.add(skyM);

  // ---- stars: three sizes in depth, each set twinkling on its own slow phase
  const starSets = [];
  const nStars = T.stars.count, cols = [P.starA, P.starB, P.starC].map((c) => new THREE.Color(c));
  for (const [share, size, ph] of [[0.62, 1.7, 0], [0.3, 2.6, 2.1], [0.08, 3.8, 4.2]]) {
    const n = Math.round(nStars * share), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const z = -8500 - r() * 3000, k = 1.25 / fz(z);
      pos[i * 3] = (r() - 0.5) * W * k; pos[i * 3 + 1] = (r() - 0.5) * H * k; pos[i * 3 + 2] = z;
      const c = cols[Math.floor(r() * 3)], b = 0.45 + r() * 0.55; col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const pts = new THREE.Points(g, m); scene.add(pts); starSets.push({ m, ph });
  }
  // a few bright stars with spikes, only outside the reading band (top strip, bottom strip or the far sides)
  const flares = [];
  for (let i = 0; i < T.stars.bright; i++) {
    const z = -8000 - r() * 3000, f = fz(z), band = r();
    const sy = band < 0.45 ? 30 + r() * 230 : band < 0.9 ? 1290 + r() * 600 : 300 + r() * 950;
    const sx = band < 0.9 ? r() * W : (r() < 0.5 ? r() * 60 : W - r() * 60);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex(), color: i % 3 ? P.starA : P.starB, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    const s = (26 + r() * 46) / f; sp.position.set(wx(sx) / f, wy(sy) / f, z); sp.scale.set(s, s, 1); scene.add(sp);
    flares.push({ sp, s, ph: r() * 6.28, w: 0.6 + r() * 0.9 });
  }

  // ---- the planet: even seeds a giant limb under the safe area, odd seeds a small ringed world in the top corner
  const planet = new THREE.Group(); scene.add(planet);
  const giant = seed % 2 === 0;
  const pz = giant ? -5200 : -3800, pf = fz(pz);
  const psr = giant ? 760 + r() * 140 : 150 + r() * 40;                                  // screen radius
  const psx = giant ? W * (0.3 + r() * 0.4) : (rtl ? 120 + r() * 60 : W - 120 - r() * 60), psy = giant ? 1350 + psr : 140 + r() * 30;
  const pr = psr / pf;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(pr, 72, 40), new THREE.MeshStandardMaterial({ map: planetTex(P, seed % 5), roughness: 0.92, metalness: 0 }));
  ball.rotation.set(giant ? 1.57 : 0.45, 0, giant ? -0.1 : 0.3); planet.add(ball);
  planet.position.set(wx(psx) / pf, wy(psy) / pf, pz);
  const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: P.atmo, transparent: true, opacity: giant ? 0.5 : 0.42, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  atmo.scale.set(pr * 2.7, pr * 2.7, 1); planet.add(atmo);
  if (!giant) {
    const rg = new THREE.Mesh(new THREE.RingGeometry(pr * 1.35, pr * 2.25, 128), new THREE.MeshStandardMaterial({ map: ringTex(P), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.8, emissive: new THREE.Color(P.p2), emissiveIntensity: 0.25 }));
    rg.rotation.set(-1.22, 0.25 * dir, 0); planet.add(rg);
  }

  // ---- materials for text: a lit face that glows its own colour (always readable on the sky), darker lit sides
  const mats = new Map();
  const matsFor = (c, sideC) => {
    const k = c + '|' + sideC; if (mats.has(k)) return mats.get(k);
    const face = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: Lt.face, roughness: 0.55, metalness: 0 });
    const side = new THREE.MeshStandardMaterial({ color: sideC, emissive: sideC, emissiveIntensity: 0.18, roughness: 0.42, metalness: 0.25 });
    const m = [face, side]; mats.set(k, m); return m;
  };
  const moonGeo = new THREE.SphereGeometry(1, 28, 16), moonMat = new THREE.MeshStandardMaterial({ map: moonTex(P), roughness: 0.95 });
  const ringMat = new THREE.MeshBasicMaterial({ color: P.key, transparent: true, opacity: 0.85, toneMapped: false });
  const traceMat = new THREE.LineBasicMaterial({ color: P.key, transparent: true, opacity: 0.0, toneMapped: false, depthWrite: false });

  const world = {
    THREE, scene, camera: cam, eye, P, rtl, dir, wx, wy, fz, D, seed,
    // a small textured moon of radius rad (world units)
    moon(rad) { const m = new THREE.Mesh(moonGeo, moonMat); m.scale.setScalar(rad); return m; },
    mats: matsFor,
    box: (obj) => screenBox(obj, cam, W, H),

    // Extruded text on one row. Key runs (*…*) are in the key colour and get a ring with a small moon riding on it.
    async row(text, { size, weight = 800, face = 'display', depth = T.depth.text, color = P.light, sideColor, keyColor = P.key, ltr = false, maxW = SAFE.right - SAFE.left - 20, rings = true }) {
      const b = ltr ? { ...brand, dir: 'ltr' } : brand;
      const mFace = matsFor(color, sideColor ?? mix(color, P.sky, 0.5)), mKey = matsFor(keyColor, P.keySide);
      const tx = await text3d(b, text, { size, weight, depth, bevel: 0, curve: 6, face, material: (w) => (w.key ? mKey : mFace) });
      const bb = new THREE.Box3().setFromObject(tx.root), cy = (bb.min.y + bb.max.y) / 2;
      const words = tx.words.map((w, k) => {
        w.group.position.y -= cy;
        const wb = new THREE.Box3().setFromObject(w.group);
        return { ...w, home: w.group.position.clone(), x0: wb.min.x, x1: wb.max.x, y0: wb.min.y, y1: wb.max.y, k };
      });
      if (rings) {                                                       // room for the ring: words beside a key run step aside
        const push = size * 0.16; let shift = 0; const xs = words.map(() => 0);
        words.forEach((w, k) => { if (k && w.key !== words[k - 1].key) shift += push; xs[k] = shift; });
        const mid = shift / 2;
        words.forEach((w, k) => { const d = (xs[k] - mid) * (rtl ? -1 : 1); w.home.x += d; w.group.position.x += d; w.x0 += d; w.x1 += d; });
      }
      const row = { root: tx.root, words, x0: Math.min(...words.map((w) => w.x0)), x1: Math.max(...words.map((w) => w.x1)), h: bb.max.y - bb.min.y, size, depth, plain: words.map((w) => w.text).join(' '), s: 1, rings: [] };
      row.s = Math.min(1, maxW / (row.x1 - row.x0)); tx.root.scale.setScalar(row.s);
      if (rings) for (let k = 0; k < words.length; k++) {
        if (!words[k].key) continue;
        let e = k; while (e + 1 < words.length && words[e + 1].key) e++;
        const run = words.slice(k, e + 1), a = Math.min(...run.map((w) => w.x0)), z = Math.max(...run.map((w) => w.x1));
        const rx = (z - a) / 2 + size * 0.12, bh = size * 0.7, tilt = Math.acos(Math.min(0.88, bh / rx));
        const outer = new THREE.Group(), frame = new THREE.Group(); outer.add(frame);
        outer.position.set((a + z) / 2, 0, depth * 0.5); outer.rotation.z = 0.08 * dir; frame.rotation.x = -tilt;
        const torus = new THREE.Mesh(new THREE.TorusGeometry(rx, Math.max(1.6, size * 0.016), 6, 160), ringMat); frame.add(torus);
        const mo = world.moon(size * 0.1); frame.add(mo);
        outer.visible = false; tx.root.add(outer);
        row.rings.push({ outer, frame, mo, rx, last: e, words: run });
        k = e;
      }
      // a faint trace of the orbit the words travel on, seen only while they fly
      const pts = []; for (let i = 0; i <= 96; i++) { const p = onOrbit(i / 96 * Math.PI * 2, 1, 1, O.tilt); pts.push(new THREE.Vector3(...p)); }
      row.trace = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), traceMat.clone()); tx.root.add(row.trace);
      scene.add(tx.root);
      return row;
    },

    // Puts a row at frame y, centred (or flush to the reading side between x0 and x1); the front face lands on z = 0.
    place(row, { y, x0 = SAFE.left, x1 = SAFE.right, align = 'center' }) {
      const s = row.s; let x;
      if (align === 'center') x = (wx(x0) + wx(x1)) / 2 - (row.x0 + row.x1) / 2 * s;
      else if ((align === 'start') === rtl) x = wx(x1) - row.x1 * s; else x = wx(x0) - row.x0 * s;
      row.root.position.set(x, wy(y), -row.depth * s); row.y = y;
      row.cx = W / 2 + x + (row.x0 + row.x1) / 2 * s;                  // frame x of its middle
      return row;
    },

    // The signature move. Each word is a moon on an orbit round `centre` (frame px; default the row's middle): it appears at t0,
    // whips round, and its orbit decays into its place in the line, in reading order, all landed by t0 + window.
    // After the last key word lands, its ring opens and a moon starts to circle it. Records the visible text for the check.
    fly(row, t, { t0, window = O.window, travel = O.travel, rx, rz = O.rz, centre, ringAt, out0 = 1e9, out1 = 1e9 + 1, rec = true, decor = false }) {
      const s = row.s, n = row.words.length;
      const step = n > 1 ? Math.min(O.step, (window - travel) / (n - 1)) : 0;
      const halfMax = Math.max(...row.words.map((w) => (w.x1 - w.x0) / 2)) * s;
      const cX = centre?.x ?? row.cx, cY = centre?.y ?? row.y;
      const room = Math.min(cX - SAFE.left, SAFE.right - cX) - halfMax;
      const R = Math.max(40, Math.min(rx ?? O.rx, room / 1.2));       // px, so a moon's box stays inside the frame's safe sides
      const w2 = O.turns * Math.PI * 2 / travel;                        // angular speed of the orbit
      const lc = new THREE.Vector3((wx(cX) - row.root.position.x) / s, (wy(cY) - row.root.position.y) / s, (0 - row.root.position.z) / s - row.depth);
      const q = away(span(t, out0, out1));
      let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity, flying = 0;
      row.words.forEach((w, k) => {
        const a = t0 + travel + k * step, p = E(span(t, a - travel, a));
        w.group.visible = t >= t0 - 1e-6 && q < 1;
        if (!w.group.visible) return;
        const ang = Math.PI / 2 - w2 * (a - t) * (p < 1 ? 1 : 0);
        const [ox, oy, oz] = onOrbit(ang, R / s, rz / s, O.tilt);
        const born = E(span(t, t0, t0 + 0.14));
        const home = w.home;
        w.group.position.set(home.x + (lc.x + ox - home.x) * (1 - p), home.y + (lc.y + oy - home.y) * (1 - p), (lc.z + oz) * (1 - p) - q * 2600 / s);
        w.group.rotation.set(0, -(1 - p) * Math.cos(ang) * 0.9 + q * 0.6 * dir, 0);
        w.group.scale.setScalar(Math.max(0.001, (0.55 + 0.45 * p) * born));
        if (p < 1) flying = Math.max(flying, 1 - p);
        if (!rec) return;
        const b = screenBox(w.group, cam, W, H); bx0 = Math.min(bx0, b[0]); bx1 = Math.max(bx1, b[1]); by0 = Math.min(by0, b[2]); by1 = Math.max(by1, b[3]);
      });
      row.trace.position.copy(lc); row.trace.scale.set(R / s, rz / s, rz / s); row.trace.material.opacity = 0.32 * flying * (t >= t0 ? 1 : 0);
      row.trace.visible = flying > 0.01 && t >= t0;
      const ra = ringAt ?? (row.rings.length ? t0 + travel + Math.max(...row.rings.map((g) => g.last)) * step + 0.06 : 0);
      for (const g of row.rings) {
        const o = S(span(t, ra, ra + 0.32)) * (1 - q);
        g.outer.visible = o > 0.01; g.outer.scale.setScalar(Math.max(0.001, o));
        const am = (t - ra) * 1.9 + 2.2;
        g.mo.position.set(g.rx * Math.cos(am), g.rx * Math.sin(am), 0); g.mo.visible = t >= ra + 0.3;
        g.mo.rotation.y = t * 0.8;
      }
      if (rec && bx1 > bx0 && kit) kit.rec(bx0, bx1, by0, by1, row.plain, decor ? { decor: true } : undefined);
      return ra;
    },

    // A row shown whole (no orbit), coming in from deep space towards the reading plane.
    arrive(row, t, { t0, dur = 0.4, out0 = 1e9, out1 = 1e9 + 1, rec = true, decor = false }) {
      const p = E(span(t, t0, t0 + dur)), q = away(span(t, out0, out1)), s = row.s;
      row.root.visible = t >= t0 && q < 1; row.trace.visible = false;
      row.words.forEach((w) => { w.group.visible = true; w.group.position.set(w.home.x, w.home.y, -(1 - p) * 1400 / s - q * 2600 / s); w.group.rotation.set(0, 0, 0); w.group.scale.setScalar(1); });
      for (const g of row.rings) g.outer.visible = false;
      if (row.root.visible && rec && kit) kit.rec(...screenBox(row.root, cam, W, H), row.plain, decor ? { decor: true } : undefined);
    },

    render(ctx, t) {
      const time = t + clock; aim(time);
      starSets.forEach((st, i) => { st.m.opacity = 0.78 + 0.22 * Math.sin(time * (1.3 + i * 0.7) + st.ph); });
      for (const f of flares) { const k = 0.85 + 0.15 * Math.sin(time * f.w * 2 + f.ph); f.sp.scale.set(f.s * k, f.s * k, 1); }
      ball.rotation.y = time * (giant ? 0.018 : 0.05);
      R.gl.render(scene, cam);
      ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}

