// The mini-diorama ground: a small room cut away like a model in a box. Two walls (the back wall facing us, a side wall receding
// on the left) stand on a tiled floor slab; the cut edges of the walls and the slab are capped in a light line so the room reads as
// an object floating in the brand's ground. Simple furniture and three tiny people made of primitives live on the front half of the
// floor, below the reading area. The words hang on the back wall as flat sign boards, each on a wire from a nail.
//
//   const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed });
//   const s = await R3.sign({ cx, cy, wpx, hpx, paint: R3.textPaint(fit, {...}), text });   // layout in frame pixels
//   per frame: s.pose(t, t0); s.rec(); R3.draw(ctx, t)
//
// One WebGL renderer is shared by every part of the reel. Each part builds its own room once in create(); draw(t) only moves
// the camera, the signs and the little people, and renders.
import { THREE, logo3d, screenBox } from '/engine/three3d.js';
import { mix, contrast, SAFE } from '/engine/kit.js';
import { flap, hash, pace } from './motion.js';

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

const lum = (h) => {
  const n = parseInt(String(h).replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

// Colour roles, all from the brand. The room is built from bg (light or dark, whichever the brand is); the sign boards are the
// text colour with words in bg, so a sign always stands out from its wall. The accent is the key plaque, the new value, the logo.
export function tones(brand) {
  const { bg, text, accent } = brand.colors, dark = lum(bg) < lum(text), k = (a) => mix(bg, text, a);
  const keyInk = contrast(accent, bg) >= contrast(accent, text) ? bg : text;
  return {
    dark, bg, text, accent, keyInk,
    void: dark ? bg : k(0.03),
    wall: dark ? k(0.24) : k(0.09), side: dark ? k(0.18) : k(0.14),
    wains: mix(dark ? k(0.25) : k(0.15), accent, 0.08), rail: dark ? k(0.4) : k(0.3),
    floorA: mix(dark ? k(0.21) : k(0.12), accent, 0.1), floorB: dark ? k(0.15) : k(0.18),
    cap: mix(text, bg, dark ? 0.12 : 0.2), under: k(dark ? 0.08 : 0.3),
    wood: mix(k(0.42), accent, 0.1), top: k(dark ? 0.62 : 0.3), metal: k(dark ? 0.75 : 0.55), pane: mix(k(dark ? 0.5 : 0.04), accent, 0.25),
    board: text, ink: bg, frame: mix(text, bg, 0.45), line: mix(text, bg, 0.22),
    old: mix(bg, text, 0.34), oldBoard: mix(text, bg, 0.1), wire: mix(bg, text, dark ? 0.55 : 0.2),
    figs: [accent, k(dark ? 0.62 : 0.5), mix(accent, text, 0.45)], head: mix(text, bg, dark ? 0.04 : 0.25), legs: k(dark ? 0.35 : 0.7),
  };
}

export async function create({ W, H, brand, look, clock = 0, kit, seed = 0 }) {
  const T = look.tokens, C = T.camera, RM = T.room, SG = T.sign, tn = tones(brand);
  const R = renderer(W, H);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(tn.void);

  // ---- camera: a shifted lens. The eye sits high in front and to the right and looks straight at the back wall, so the wall
  // and every sign on it stay square to the frame (1 unit = 1 px on the wall plane) while the side wall, the floor and the
  // furniture show their depth. The 'orbit' moves the eye sideways and up and down: the room turns, the signs hold still.
  const cam = new THREE.PerspectiveCamera(30, W / H, 50, 30000), eye = new THREE.Vector3();
  function aim(time, rest = false) {
    const a = rest ? 0 : Math.sin(time / C.period * Math.PI * 2), b = rest ? 0 : Math.sin(time / C.period * Math.PI * 2 * 0.5 + 1.1);
    eye.set(C.ex + C.sway * a, C.cy + C.ey + C.lift * b, C.dist);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / C.dist, rx = eye.x, ry = eye.y - C.cy;
    cam.projectionMatrix.makePerspective((-W / 2 - rx) * k, (W / 2 - rx) * k, (H / 2 - ry) * k, (-H / 2 - ry) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(0, true);

  // ---- light: soft sky and one warm sun from the open front right, the only shadows
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, T.light.sky));
  const sun = new THREE.DirectionalLight(0xfff1e0, T.light.sun);
  sun.position.set(1100, 2400, 2000); sun.target.position.set(0, 300, 300); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1500, right: 1500, top: 1500, bottom: -1500, near: 500, far: 6000 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 1.5; sun.shadow.radius = 5;

  const std = (c, r = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...extra });
  const add = (geo, mat, x, y, z, parent = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (x0, x1, y0, y1, z0, z1, mat, parent) => add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent);
  const cyl = (r0, r1, h, mat, x, y0, z, parent, seg = 20) => add(new THREE.CylinderGeometry(r0, r1, h, seg), mat, x, y0 + h / 2, z, parent);

  // ---- the room shell
  const { xl: XL, xr: XR, h: HH, d: ZD, th: TH, slab: FH } = RM;
  const M = { wall: std(tn.wall, 0.92), side: std(tn.side, 0.92), cap: std(tn.cap, 0.7), under: std(tn.under, 0.9), wains: std(tn.wains, 0.9),
    rail: std(tn.rail, 0.6), wood: std(tn.wood, 0.7), top: std(tn.top, 0.5), metal: std(tn.metal, 0.35, { metalness: 0.2 }), pane: std(tn.pane, 0.2, { emissive: tn.pane, emissiveIntensity: 0.35 }),
    legs: std(tn.legs, 0.8), head: std(tn.head, 0.6), wire: std(tn.wire, 0.5), accent: std(tn.accent, 0.55) };
  const tiles = (() => {
    const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const g = cv.getContext('2d');
    g.fillStyle = tn.floorB; g.fillRect(0, 0, n, n); g.fillStyle = tn.floorA; g.fillRect(0, 0, n / 2, n / 2); g.fillRect(n / 2, n / 2, n / 2, n / 2);
    g.fillStyle = mix(tn.floorB, tn.bg, 0.25); g.fillRect(0, 0, n, 2); g.fillRect(0, 0, 2, n); g.fillRect(0, n / 2, n, 2); g.fillRect(n / 2, 0, 2, n);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    t.repeat.set((XR - XL + TH) / RM.tile / 2, (ZD + TH) / RM.tile / 2); return t;
  })();
  const floorTop = std(0xffffff, 0.8, { map: tiles });
  box(XL - TH, XR, -FH, 0, -TH, ZD, [M.cap, M.cap, floorTop, M.under, M.cap, M.cap]);                        // floor slab
  box(XL - TH, XR, 0, HH, -TH, 0, [M.cap, M.wall, M.cap, M.wall, M.wall, M.wall]);                           // back wall
  box(XL - TH, XL, 0, HH, 0, ZD, [M.side, M.side, M.cap, M.side, M.cap, M.side]);                             // side wall
  box(XL, XR, 0, RM.wains, 0, 6, M.wains); box(XL, XR, RM.wains, RM.wains + 12, 0, 14, M.rail);               // wainscot + rail
  box(XL, XL + 6, 0, RM.wains, 0, ZD, M.wains); box(XL, XL + 14, RM.wains, RM.wains + 12, 0, ZD, M.rail);
  // a window in the side wall, and a short shelf under it
  { const z0 = ZD * 0.34, z1 = ZD * 0.74, y0 = HH * 0.36, y1 = HH * 0.62, x = XL + 2;
    box(x - 2, x + 2, y0, y1, z0, z1, M.pane, scene);
    for (const z of [z0, (z0 + z1) / 2, z1]) box(x, x + 16, y0, y1, z - 7, z + 7, M.cap);
    for (const y of [y0, (y0 + y1) / 2, y1]) box(x, x + 16, y - 7, y + 7, z0, z1, M.cap);
    box(XL, XL + 60, y0 - 110, y0 - 98, z0 - 40, z1 + 40, M.wood);
    [0.15, 0.32, 0.5, 0.7, 0.86].forEach((f, i) => cyl(14, 14, 34 + 22 * hash(i, seed), i % 2 ? M.accent : M.top, XL + 30, y0 - 98, z0 - 30 + (z1 - z0 + 60) * f));
  }

  // ---- furniture on the front half of the floor, low enough never to reach the signs
  const F = RM.furn;
  box(F.counter[0], F.counter[1], 0, F.counterH, F.counter[2], F.counter[3], M.wood);
  box(F.counter[0] - 14, F.counter[1] + 14, F.counterH, F.counterH + 16, F.counter[2] - 14, F.counter[3] + 14, M.top);
  box(F.counter[0], F.counter[1], F.counterH * 0.62, F.counterH * 0.62 + 18, F.counter[3], F.counter[3] + 4, M.accent);
  { const mx = F.counter[1] - 120, mz = (F.counter[2] + F.counter[3]) / 2, y = F.counterH + 16;
    box(mx - 70, mx + 70, y, y + 120, mz - 50, mz + 40, M.metal); box(mx - 76, mx + 76, y + 120, y + 134, mz - 56, mz + 46, M.top);
    cyl(16, 13, 30, M.head, mx - 30, y, mz + 30); cyl(16, 13, 30, M.head, mx + 34, y, mz + 30);
    cyl(18, 15, 36, M.accent, F.counter[0] + 70, y, mz + 10); cyl(18, 15, 36, M.head, F.counter[0] + 130, y, mz - 10); }
  { const [tx, tz] = F.table;
    cyl(110, 110, 12, M.top, tx, 160, tz); cyl(10, 10, 160, M.metal, tx, 0, tz); cyl(46, 52, 8, M.metal, tx, 0, tz);
    cyl(16, 13, 28, M.accent, tx + 30, 172, tz + 20);
    for (const [sx, sz] of F.stools) { cyl(42, 42, 12, M.wood, sx, 100, sz); cyl(8, 8, 100, M.metal, sx, 0, sz); } }
  { const [px, pz] = F.plant;
    cyl(36, 28, 70, M.wood, px, 0, pz);
    const leaf = std(mix(mix(tn.bg, tn.text, 0.4), tn.accent, 0.3), 0.8);
    [[0, 112, 0, 40], [-24, 92, 16, 30], [24, 98, -8, 32], [6, 142, -6, 26]].forEach(([dx, y, dz, r]) => add(new THREE.SphereGeometry(r, 16, 12), leaf, px + dx, y, pz + dz)); }
  // a wall clock high on the back wall, above the reading area; its hands follow the reel's own clock
  const clockHands = [];
  { const cx = RM.clock[0], cy = RM.clock[1], r = 46;
    const face = add(new THREE.CylinderGeometry(r, r, 10, 40), M.cap, cx, cy, 5); face.rotation.x = Math.PI / 2;
    const rim = add(new THREE.TorusGeometry(r, 5, 8, 40), M.rail, cx, cy, 10); rim.castShadow = true;
    for (const [len, w] of [[r * 0.55, 6], [r * 0.8, 4]]) {
      const geo = new THREE.BoxGeometry(w, len, 3); geo.translate(0, len / 2, 0);
      const h = add(geo, M.legs, cx, cy, 12, scene, false); clockHands.push(h);
    }
    add(new THREE.SphereGeometry(5, 10, 8), M.accent, cx, cy, 14, scene, false); }

  // ---- three tiny people, made of primitives
  function person(color) {
    const g = new THREE.Group(), s = RM.fig, mat = std(color, 0.7);
    const legGeo = new THREE.BoxGeometry(20, 84, 22); legGeo.translate(0, -42, 0);
    const legs = [-13, 13].map((x) => add(legGeo, M.legs, x, 84, 0, g));
    const body = add(new THREE.CapsuleGeometry(30, 62, 6, 14), mat, 0, 84 + 58, 0, g);
    const head = add(new THREE.SphereGeometry(25, 18, 14), M.head, 0, 84 + 58 + 66, 0, g);
    const armGeo = new THREE.CapsuleGeometry(9, 56, 4, 8); armGeo.translate(0, -30, 0);
    const arms = [-38, 38].map((x) => add(armGeo, mat, x, 84 + 90, 0, g));
    g.scale.setScalar(s); scene.add(g);
    return { g, legs, arms, body, head };
  }
  const people = [person(tn.figs[0]), person(tn.figs[1]), person(tn.figs[2])];
  const [barista, walker, sitter] = people;
  const stool = F.stools[0];
  sitter.legs.forEach((l) => { l.rotation.x = -Math.PI / 2 + 0.15; });
  sitter.g.position.set(stool[0], 112 - 84 * RM.fig + 10, stool[1]); sitter.g.rotation.y = Math.PI / 2 + 0.25;
  sitter.arms[1].rotation.x = -1.1;
  function people_(time) {
    // the barista works along the counter, turning to the machine now and then
    const b = pace(time + seed * 0.7, F.counter[0] + 70, F.counter[1] - 90, 110, 0.2);
    barista.g.position.set(b.x, 0, F.counter[2] - 70); barista.g.rotation.y = b.walking ? b.dir * Math.PI / 2 : 0;
    const bs = b.walking ? Math.sin(time * 9) : 0; barista.legs[0].rotation.x = bs * 0.45; barista.legs[1].rotation.x = -bs * 0.45;
    barista.arms[0].rotation.x = b.walking ? -bs * 0.4 : -0.9; barista.arms[1].rotation.x = b.walking ? bs * 0.4 : -0.9;
    // a customer walks across the front of the room
    const w = pace(time + seed * 1.3, F.walk[0], F.walk[1], 150, 0.55), ws = w.walking ? Math.sin(time * 8) : 0;
    walker.g.position.set(w.x, Math.abs(ws) * 5, F.walk[2]); walker.g.rotation.y = w.dir * Math.PI / 2;
    walker.legs[0].rotation.x = ws * 0.55; walker.legs[1].rotation.x = -ws * 0.55; walker.arms[0].rotation.x = -ws * 0.5; walker.arms[1].rotation.x = ws * 0.5;
    walker.head.rotation.y = 0;
    // the one at the table lifts the cup now and then
    const sip = Math.max(0, Math.sin(time * 0.9 + seed)); sitter.arms[1].rotation.x = -1.1 - sip * 0.9; sitter.head.position.y = (84 + 124) + Math.sin(time * 1.3) * 2;
  }

  // ---- screen <-> wall: signs are laid out in frame pixels at the camera's rest pose and projected onto the back wall
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitP = new THREE.Vector3();
  const hit = (x, y, z) => { ndc.set(x / W * 2 - 1, 1 - y / H * 2); ray.setFromCamera(ndc, cam); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), hitP); return hitP.clone(); };
  const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  // the part of the safe area that lies on the back wall (right of the room's corner), at every pose of the orbit
  let cornerX = -1e9, wallR = 1e9;
  for (const ph of [0, 0.25, 0.5, 0.75]) {
    aim(ph * C.period);
    for (const y of [RM.wains, HH * 0.5, HH]) { cornerX = Math.max(cornerX, proj(XL, y, 0)[0]); wallR = Math.min(wallR, proj(XR, y, 0)[0]); }
  }
  aim(0, true);
  const region = { x0: Math.max(SAFE.left + SG.margin, cornerX + SG.corner), x1: Math.min(SAFE.right - SG.margin, wallR - SG.corner) };
  region.cx = (region.x0 + region.x1) / 2; region.w = region.x1 - region.x0;

  const signs = [];
  const world = {
    THREE, scene, camera: cam, tn, region, rtl: brand.dir !== 'ltr', M,
    // Paints a board: frame, face, a thin inset line.
    plate(g, w, h, { color = tn.board, frame = tn.frame, line = tn.line } = {}) {
      const r = SG.rim;
      g.fillStyle = frame; g.fillRect(0, 0, w, h);
      g.fillStyle = color; g.fillRect(r, r, w - 2 * r, h - 2 * r);
      g.strokeStyle = line; g.lineWidth = 2; g.strokeRect(r + 7, r + 7, w - 2 * r - 14, h - 2 * r - 14);
    },
    // A painter for fitted text on a board. Key words sit on an accent plaque in the keyInk colour.
    textPaint(f, { color = tn.board, ink = tn.ink, frame = tn.frame, line, padY, align = 'center', keyOff = false } = {}) {
      return (g, w, h) => {
        world.plate(g, w, h, { color, frame, line: line ?? mix(color, ink, 0.22) });
        const py = padY ?? (h - f.rows.length * f.lead) / 2;
        const p = f.space * 0.5 + 2;
        kit.drawText(g, f, { x0: SG.padX, x1: w - SG.padX, y: py + f.lead / 2 + f.size * SG.shift, align, color: ink, key: tn.keyInk, decor: true,
          each: (wd, i, b, c) => {
            if (!wd.key || keyOff) return wd.key ? ink : undefined;
            c.fillStyle = tn.accent; c.beginPath(); c.roundRect(b.x - p, b.y - f.size * 0.62, b.width + 2 * p, f.size * 1.22, 5); c.fill();
            return tn.keyInk;
          } });
      };
    },
    boardSize: (f) => ({ w: Math.ceil(f.width + 2 * SG.padX), h: Math.ceil(f.rows.length * f.lead + 2 * f.size * SG.padY) }),
    // Vertical stack of signs (each takes its wire + its board), centred on `centre`; returns the board centres.
    stack(hs, centre, gap = SG.gap) {
      const hang = SG.hang, tot = hs.reduce((s, h) => s + h + hang, 0) + gap * (hs.length - 1);
      let y = Math.max(SAFE.top + 4, Math.min(centre - tot / 2, SAFE.bottom - tot));
      return hs.map((h) => { const c = y + hang + h / 2; y += hang + h + gap; return c; });
    },

    // A sign board hung on the back wall. cx, cy, wpx, hpx in frame pixels (rest pose). paint(g, w, h) draws its face.
    sign({ cx, cy, wpx, hpx, paint, depth = SG.depth, text = '', side = tn.frame, wires = true }) {
      aim(0, true);
      const zf = SG.gap0 + depth, c = hit(cx, cy, zf);
      const k = hit(cx + 50, cy, zf).distanceTo(hit(cx - 50, cy, zf)) / 100, kv = hit(cx, cy + 50, zf).distanceTo(hit(cx, cy - 50, zf)) / 100;
      const ww = wpx * k, hh = hpx * kv, hang = SG.hang * kv;
      const S = SG.res, cv = document.createElement('canvas'); cv.width = Math.ceil(wpx * S); cv.height = Math.ceil(hpx * S);
      const g = cv.getContext('2d');
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const repaint = (fn) => { g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, wpx, hpx); fn(g, wpx, hpx); tex.needsUpdate = true; };
      repaint(paint);
      const sideM = std(side, 0.6), face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      const pivot = new THREE.Group(); pivot.position.set(c.x, c.y + hh / 2 + hang, SG.gap0); scene.add(pivot);
      const board = add(new THREE.BoxGeometry(ww, hh, depth), [sideM, sideM, sideM, sideM, face, sideM], 0, -hang - hh / 2, depth / 2, pivot);
      const wireL = [], nail = add(new THREE.CylinderGeometry(6, 6, 16, 10), M.cap, c.x, c.y + hh / 2 + hang, 8, scene, false); nail.rotation.x = Math.PI / 2;
      if (wires) for (const sx of [-1, 1]) {
        const ax = sx * ww * 0.38, ay = -hang, len = Math.hypot(ax, ay);
        const wm = add(new THREE.BoxGeometry(3, len, 3), M.wire, ax / 2, ay / 2, depth * 0.45, pivot, false);
        wm.rotation.z = Math.atan2(ax, -ay); wireL.push(wm);
      }
      const s = { pivot, board, wires: wireL, nail, ww, hh, tex, repaint, text, rx: 0, cx, cy, wpx, hpx, extra: null,
        // t0: the moment it lets go. tilt: a crooked hang (radians), set by the caller.
        pose(t, t0, { tilt = 0, lift = SG.lift } = {}) {
          const u = t - t0; pivot.visible = u >= 0; nail.visible = true;
          if (u < 0) return;
          const f = flap(u, lift); s.rx = f.rx; pivot.rotation.set(f.rx, 0, f.rz + tilt);
        },
        rec(label = s.text) { if (pivot.visible && Math.abs(s.rx) < 0.3 && kit && label) kit.rec(...screenBox(board, cam, W, H), label); },
      };
      signs.push(s); return s;
    },

    // The brand's logo as a solid standing out of a board's face.
    logoOn(s, sizePx) {
      const lg = logo3d(brand, { size: sizePx * (s.ww / s.wpx), depth: SG.logoDepth, bevel: 2, material: std(tn.accent, 0.45) });
      lg.position.set(0, 0, s.board.geometry.parameters.depth / 2 + SG.logoDepth / 2); s.board.add(lg); return lg;
    },

    draw(ctx, t) {
      const time = t + clock; aim(time); people_(time);
      clockHands[0].rotation.z = -(2.1 + time * 0.06); clockHands[1].rotation.z = -(0.4 + time * 0.75);
      R.gl.render(scene, cam); ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}
