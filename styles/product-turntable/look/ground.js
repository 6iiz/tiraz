// The product-turntable ground: a small product-photography studio, built in 3D. A seamless paper sweep (floor curving up into
// the wall) in the brand's ground colour with a soft pool of light behind the set; a round podium whose top is a turntable that
// turns slowly and evenly, carrying a product box in the accent with a paper band printed with the logo; softbox light (a studio
// environment of soft panels plus one soft key that casts the only shadows). The words are printed on price tags threaded on one
// cord that hangs from above: each tag swings round the cord from behind and settles square to the lens.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
//   const tg = W3.textTag(fit.rows[0], fit, { color: W3.tone.ink });   // a tag carrying one row of fitted text
//   W3.hang([tg, ...], { centre: 700 });                               // threads the tags on the cord, top to bottom
//   per frame: W3.swing(tg, t, { t0, out0 }); W3.draw(ctx, t);
//
// One WebGL renderer is shared by every part of a reel (one context); each part has its own scene. The camera is level and its
// lens is shifted so that the plane of the tags (z = 0) maps 1 unit to 1 frame pixel: layout is done in frame pixels.
import { THREE } from '/engine/three3d.js';
import { mix, contrast, font, SAFE, span } from '/engine/kit.js';
import { settle, inn, hash } from './motion.js';

let shared = null;
function renderer(W, H, T) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = T.light.exposure;
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  shared = { W, H, canvas, gl, env: studioEnv(gl) }; return shared;
}

// The softboxes, as an environment: a dim neutral room with a big soft panel high on the left front, a strip on the right and a
// panel overhead. Pre-filtered once; it gives the podium and the product their soft studio highlights.
function studioEnv(gl) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x1c1c1c, side: THREE.BackSide })));
  const panel = (w, h, x, y, z, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(4.5, 3.2, -3.6, 2.6, 3.4, 5.5);     // the key softbox
  panel(1.3, 4.6, 4.8, 0.6, 1.6, 2.6);      // a strip light on the other side
  panel(5, 5, 0, 5.8, 0, 2.0);              // overhead
  panel(6, 2, 0, -1, -5.8, 0.6);            // light bouncing off the sweep behind
  const pm = new THREE.PMREMGenerator(gl), rt = pm.fromScene(s, 0.05); pm.dispose();
  return rt.texture;
}

const lum = (c) => contrast(c, '#000000');
// The palette, all from the brand. The studio is the brand's own ground (a dark brand gets a low-key dark studio, a light brand a
// bright one); tags are always the lighter of bg/text with the darker one as print, so they read on either.
export function tones(brand, T) {
  const { bg, text, accent } = brand.colors, dark = lum(bg) < lum(text);
  const paper = dark ? text : bg, ink = dark ? bg : text, S = T.studio[dark ? 'dark' : 'light'];
  const lo = dark ? mix(mix(bg, accent, S.tint), paper, S.lo) : mix(mix(bg, accent, S.tint), ink, S.lo);
  const hi = dark ? mix(mix(bg, accent, S.tint * 1.3), paper, S.hi) : mix(mix(bg, accent, S.tint * 0.5), ink, S.hi);
  const onAccent = contrast(accent, ink) >= contrast(accent, paper) ? ink : paper;
  const podium = dark ? mix(paper, bg, 0.1) : mix(paper, ink, 0.02);
  return { dark, paper, ink, accent, lo, hi, onAccent, podium,
    grey: mix(ink, paper, 0.36), old: mix(ink, paper, 0.3), rule: mix(paper, ink, 0.2), edge: mix(paper, ink, 0.3),
    cord: dark ? mix(paper, bg, 0.25) : mix(ink, paper, 0.15), ticks: mix(podium, ink, 0.45), metal: mix(paper, ink, 0.45) };
}

// The seamless sweep: one sheet from the floor in front of the lens, curving up into the wall. Coloured per vertex (the pool of
// light is part of the paper's colour, so the brand's ground stays exact), drawn unlit; a shadow catcher on the same sheet.
function sweep(T, tone) {
  const S = T.set, prof = [];
  for (let k = 0; k <= 12; k++) prof.push([S.front + (S.cycZ - S.front) * k / 12, S.floorY]);
  for (let k = 1; k <= 20; k++) { const a = (k / 20) * Math.PI / 2; prof.push([S.cycZ - S.cycR * Math.sin(a), S.floorY + S.cycR * (1 - Math.cos(a))]); }
  for (let k = 1; k <= 12; k++) prof.push([S.cycZ - S.cycR, S.floorY + S.cycR + (S.wallTop - S.floorY - S.cycR) * k / 12]);
  const s = [0]; for (let i = 1; i < prof.length; i++) s.push(s[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const sPool = s[12 + 20] + (150 - (S.floorY + S.cycR));                // the pool sits on the wall behind the tags
  const NX = 36, pos = [], col = [], idx = [], lo = new THREE.Color(tone.lo), hi = new THREE.Color(tone.hi), c = new THREE.Color();
  prof.forEach(([z, y], i) => {
    for (let j = 0; j <= NX; j++) {
      const x = -S.halfW + 2 * S.halfW * j / NX; pos.push(x, y, z);
      const d = Math.hypot(x * 0.85, s[i] - sPool) / T.studio.pool, f = Math.exp(-d * d);
      c.lerpColors(lo, hi, f); col.push(c.r, c.g, c.b);
    }
  });
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < NX; j++) {
    const a = i * (NX + 1) + j, b2 = a + NX + 1; idx.push(a, b2, a + 1, a + 1, b2, b2 + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const paper = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, dithering: true, side: THREE.DoubleSide }));
  const catcher = new THREE.Mesh(geo, new THREE.ShadowMaterial({ opacity: T.light.shadow, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  catcher.receiveShadow = true; catcher.renderOrder = 1;
  const g = new THREE.Group(); g.add(paper, catcher); return g;
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const texOf = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

export async function create({ W, H, brand, look, clock = 0, kit, seed = 0 }) {
  const T = look.tokens, C = T.camera, P = T.set, TG = T.tag;
  const tone = tones(brand, T), rtl = brand.dir !== 'ltr', b = rtl ? -1 : 1;
  const R = renderer(W, H, T);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(tone.lo);
  scene.environment = R.env; scene.environmentIntensity = T.light.env;
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;

  // ---- camera: level, shifted lens, the plane z = 0 maps 1:1 to the frame; it drifts a little, so the set shows its depth
  const cam = new THREE.PerspectiveCamera(30, W / H, 20, 30000), eye = new THREE.Vector3();
  function aim(time) {
    const a = (time / C.period) * Math.PI * 2;
    eye.set(C.drift * Math.sin(a), C.ey + C.drift * 0.35 * Math.sin(a * 0.7 + 1), C.dist);
    cam.position.copy(eye); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / C.dist;
    cam.projectionMatrix.makePerspective((-W / 2 - eye.x) * k, (W / 2 - eye.x) * k, (H / 2 - eye.y) * k, (-H / 2 - eye.y) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: the key softbox high on the side the tags reach towards, casting the only (soft) shadows
  const key = new THREE.DirectionalLight(0xfff7ee, T.light.key);
  key.position.set(1150 * b, 1500, 1900); key.target.position.set(0, -250, -350); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2300, right: 2300, top: 2300, bottom: -2300, near: 300, far: 7000 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 1.5; key.shadow.radius = 6;
  scene.add(sweep(T, tone));

  // ---- the podium: a static base with an accent band, and the turntable on top with its index ticks and the product
  const pod = new THREE.Group(); pod.position.set(0, P.floorY, P.podZ); scene.add(pod);
  const baseH = P.podH - P.tableH, Rr = P.podR;
  const mSide = new THREE.MeshStandardMaterial({ color: tone.podium, roughness: 0.4 }), mTop = new THREE.MeshStandardMaterial({ color: mix(tone.podium, tone.ink, 0.05), roughness: 0.55 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr, baseH, 80), [mSide, mTop, mTop]); base.position.y = baseH / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(Rr + 1.5, Rr + 1.5, 10, 80, 1, true), new THREE.MeshStandardMaterial({ color: tone.accent, roughness: 0.35 }));
  band.position.y = baseH - 18;
  const table = new THREE.Group(); table.position.y = baseH;
  const mDisc = new THREE.MeshStandardMaterial({ color: mix(tone.podium, tone.ink, 0.14), roughness: 0.35 }), mDiscTop = new THREE.MeshStandardMaterial({ color: mix(tone.podium, tone.ink, 0.07), roughness: 0.6 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 0.95, Rr * 0.95, P.tableH, 80), [mDisc, mDiscTop, mDiscTop]); disc.position.y = P.tableH / 2;
  const NT = 48, ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: tone.ticks, roughness: 0.6 }), NT);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  for (let k = 0; k < NT; k++) {
    const a = (k / NT) * Math.PI * 2, long = k % 4 === 0, len = long ? 30 : 13, r = Rr * 0.95 - 12 - len / 2;
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a); V.set(Math.sin(a) * r, P.tableH + 0.8, Math.cos(a) * r); Sc.set(long ? 5 : 3, 1.6, len);
    M.compose(V, Q, Sc); ticks.setMatrixAt(k, M);
  }
  table.add(disc, ticks); pod.add(base, band, table);
  [base, disc].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

  // the product: a box in the accent with a paper band printed with the logo on its four sides
  const PR = T.product, product = new THREE.Group(); product.position.y = P.tableH; table.add(product);
  const box = new THREE.Mesh(new THREE.BoxGeometry(PR.w, PR.h, PR.w), new THREE.MeshStandardMaterial({ color: tone.accent, roughness: 0.32, metalness: 0.04 }));
  box.position.y = PR.h / 2; box.castShadow = true; box.receiveShadow = true;
  const bh = PR.h * PR.band, lc = canvas(512, Math.round(512 * bh / (PR.w + 4))), lg = lc.getContext('2d');
  lg.fillStyle = tone.paper; lg.fillRect(0, 0, lc.width, lc.height);
  { const L = brand.logo, s = lc.height * 0.62 / (L.box || 256); lg.save(); lg.translate(lc.width / 2 - (L.box || 256) * s / 2, lc.height * 0.19); lg.scale(s, s);
    lg.fillStyle = tone.ink; lg.fill(new Path2D(L.path), L.rule === 'evenodd' ? 'evenodd' : 'nonzero'); lg.restore();
    lg.fillStyle = tone.accent; lg.fillRect(0, 0, lc.width, 5); lg.fillRect(0, lc.height - 5, lc.width, 5); }
  const mLabel = new THREE.MeshStandardMaterial({ map: texOf(lc), roughness: 0.7 }), mPlain = new THREE.MeshStandardMaterial({ color: tone.paper, roughness: 0.7 });
  const label = new THREE.Mesh(new THREE.BoxGeometry(PR.w + 4, bh, PR.w + 4), [mLabel, mLabel, mPlain, mPlain, mLabel, mLabel]);
  label.position.y = PR.h * 0.44; label.castShadow = true;
  product.add(box, label);

  // ---- price tags
  const holeX = wx(rtl ? SAFE.right - TG.edge : SAFE.left + TG.edge);
  const textMax = (SAFE.right - SAFE.left) - TG.edge - TG.gap - TG.end - 16;
  const tagSide = new Map();
  const live = [];

  // A tag: a flat card with a pointed end at the cord, a punched hole with a metal eyelet, the print on its face and a barcode on
  // its back. w = width of the printed area, h = height. paint(g, rect) prints the face (in tag pixels); body = card colour.
  function tag({ w, h, body = tone.paper, ink = tone.ink, paint, plain = '', id = 0 }) {
    const L = TG.gap + w + TG.end, tip = TG.tip, xmin = rtl ? -L : -tip, span_ = L + tip, X = (u) => -b * u;
    const c = Math.min(h * 0.3, 44), r = Math.min(14, h * 0.14);
    const sh = new THREE.Shape();
    sh.moveTo(X(tip), h / 2 - c); sh.lineTo(X(tip - c), h / 2); sh.lineTo(X(-L + r), h / 2); sh.quadraticCurveTo(X(-L), h / 2, X(-L), h / 2 - r);
    sh.lineTo(X(-L), -h / 2 + r); sh.quadraticCurveTo(X(-L), -h / 2, X(-L + r), -h / 2); sh.lineTo(X(tip - c), -h / 2); sh.lineTo(X(tip), -h / 2 + c); sh.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, TG.hole, 0, Math.PI * 2, true); sh.holes.push(hole);
    const D = TG.depth, bev = 1;
    if (!tagSide.has(body)) tagSide.set(body, [new THREE.MeshStandardMaterial({ color: body, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: mix(body, tone.ink, 0.22), roughness: 0.85 })]);
    const card = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D, curveSegments: 10, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 }), tagSide.get(body));
    card.receiveShadow = true;                       // tags cast no shadow: no ghost of a tag on the sweep
    const SX = TG.scale, fc = canvas(Math.ceil(span_ * SX), Math.ceil(h * SX)), bc = canvas(fc.width, fc.height);
    const ft = texOf(fc), bt = texOf(bc);
    for (const t of [ft, bt]) { t.repeat.set(1 / span_, 1 / h); t.offset.set(-xmin / span_, 0.5); }
    const faceGeo = new THREE.ShapeGeometry(sh, 10);
    const front = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map: ft, roughness: 0.78, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: T.light.selfLit }));
    front.position.z = D + bev + 0.3; front.receiveShadow = true;
    const back = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8, side: THREE.BackSide }));
    back.position.z = -bev - 0.3;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(TG.hole + 2.5, 3.6, 8, 28), new THREE.MeshStandardMaterial({ color: tone.metal, roughness: 0.25, metalness: 0.85 }));
    eyelet.position.z = D / 2;
    const content = new THREE.Group(); content.add(card, front, back, eyelet); content.position.z = -D / 2;   // the cord runs through z = 0
    const pivot = new THREE.Group(); pivot.add(content); scene.add(pivot);
    // the printed area in tag pixels (x from the canvas's left, y from its top) and in the tag's own units
    const px0 = rtl ? L - TG.gap - w : tip + TG.gap, rect = { x0: px0, x1: px0 + w, yc: h / 2 };
    const lx0 = px0 + xmin, local = { x0: lx0, x1: lx0 + w, y0: -h / 2 + 4, y1: h / 2 - 4, z: D + bev + 0.3 };
    const perf = rtl ? L - TG.gap * 0.5 : tip + TG.gap * 0.5;
    const tg = { pivot, content, front, L, h, w, local, plain, body, xspan: span_, rec: true, y: 0 };
    tg.repaint = (fn) => {
      const g = fc.getContext('2d'); g.setTransform(SX, 0, 0, SX, 0, 0);
      g.fillStyle = body; g.fillRect(0, 0, span_, h);
      g.strokeStyle = mix(body, tone.ink, 0.22); g.lineWidth = 1.6; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(perf, 9); g.lineTo(perf, h - 9); g.stroke(); g.setLineDash([]);
      g.strokeStyle = mix(body, tone.ink, 0.12); g.lineWidth = 1.2;
      const bx0 = rtl ? 9 : perf + 8, bx1 = rtl ? perf - 8 : span_ - 9; rrect(g, bx0, 8, bx1 - bx0, h - 16, Math.max(2, r - 6)); g.stroke();
      (fn || paint)(g, rect); ft.needsUpdate = true;
    };
    tg.repaint(paint);
    { // the back: a barcode in the middle of the card, as seen from behind
      const g = bc.getContext('2d'); g.setTransform(-SX, 0, 0, SX, bc.width, 0);
      g.fillStyle = body; g.fillRect(0, 0, span_, h);
      const cx = rect.x0 + w / 2, bw = Math.min(w * 0.6, 240), bh2 = Math.min(h * 0.46, 70); let x = cx - bw / 2;
      g.fillStyle = mix(ink, body, 0.15);
      for (let k = 0; x < cx + bw / 2; k++) { const ww = 1.5 + Math.floor(hash(k, id, seed) * 4) * 1.4; if (k % 2 === 0) g.fillRect(x, h / 2 - bh2 / 2, ww, bh2); x += ww + 1.2; }
      g.fillStyle = mix(body, tone.accent, 0.8); g.fillRect(cx - bw / 2, h / 2 + bh2 / 2 + 6, bw * 0.3, 3);
      bt.needsUpdate = true;
    }
    return tg;
  }

  // One row of fitted text (a row of kit.fit) printed on a tag. Key words sit on an accent sticker in the colour that reads on it.
  const rowWidth = (row) => row.width + (row.words[0].key ? TG.keyPad : 0) + (row.words.at(-1).key ? TG.keyPad : 0);
  function printRow(g, row, f, { x0, x1, yc, color, keyFill = tone.accent, keyInk = tone.onAccent, family = f.family, ltr = false }) {
    const R2L = rtl && !ltr, kp = TG.keyPad;
    g.font = font(f.weight, f.size, family); g.textBaseline = 'middle';
    let cur = R2L ? x1 - (row.words[0].key ? kp : 0) : x0 + (row.words[0].key ? kp : 0);
    const at = row.words.map((w) => { const wl = R2L ? cur - w.width : cur; cur = R2L ? wl - f.space : wl + w.width + f.space; return { w, wl }; });
    for (let i = 0; i < at.length; i++) {
      if (!at[i].w.key) continue; let e = i; while (e + 1 < at.length && at[e + 1].w.key) e++;
      const run = at.slice(i, e + 1), a = Math.min(...run.map((q) => q.wl)) - kp * 0.8, z = Math.max(...run.map((q) => q.wl + q.w.width)) + kp * 0.8;
      g.fillStyle = keyFill; rrect(g, a, yc - f.size * 0.62, z - a, f.size * 1.24, Math.min(12, f.size * 0.16)); g.fill();
      i = e;
    }
    for (const { w, wl } of at) {
      g.fillStyle = w.key ? keyInk : color; g.direction = w.arabic ? 'rtl' : 'ltr'; g.textAlign = w.arabic ? 'right' : 'left';
      g.fillText(w.w, w.arabic ? wl + w.width : wl, yc + f.size * 0.03);
    }
  }
  let ids = 0;
  const world = {
    THREE, scene, camera: cam, eye, tone, rtl, b, wx, wy, holeX, textMax, product, table, pod, P, tableTop: P.floorY + P.podH,
    tableAngle: null, tag, printRow, rowWidth,
    textTag(row, f, { color = tone.ink, body = tone.paper, keyFill, keyInk, high = 1.5, extra = 0, after, family, ltr } = {}) {
      const w = rowWidth(row) + extra, h = Math.round(f.size * high);
      const plain = row.words.map((x) => x.w).join(' ');
      return tag({ w, h, body, id: ids++, plain, paint: (g, r) => {
        printRow(g, row, f, { x0: rtl ? r.x1 - rowWidth(row) : r.x0, x1: rtl ? r.x1 : r.x0 + rowWidth(row), yc: r.yc, color, keyFill, keyInk, family, ltr });
        if (after) after(g, r);
      } });
    },
    // Threads the tags on one cord, top to bottom, the stack centred near `centre` (frame y) inside the safe area.
    hang(tags, { centre = 700, gap = TG.space } = {}) {
      const total = tags.reduce((s, tg) => s + tg.h, 0) + gap * (tags.length - 1);
      let y = kit.place(total, centre);
      for (const tg of tags) { tg.y = y + tg.h / 2; tg.pivot.position.set(holeX, wy(tg.y), 0); y += tg.h + gap; }
      const yTop = wy(-300), yBot = wy(tags.at(-1).y) - 46;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, yTop - yBot, 8), new THREE.MeshStandardMaterial({ color: tone.cord, roughness: 0.9 }));
      cord.position.set(holeX, (yTop + yBot) / 2, 0); scene.add(cord);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 8), cord.material); knot.position.set(holeX, yBot, 0); scene.add(knot);
      return { top: tags[0].y - tags[0].h / 2, bottom: y - gap };
    },
    // A tag's turn on its cord for frame time t: from behind (its back to us) round to square on, settling by t0 + dur; from out0
    // it is swung back round. Only a tag that is square on is reported to the check as text.
    swing(tg, t, { t0, dur = T.dur.swing, out0 = 1e9, outDur = T.dur.out }) {
      const s = settle(span(t, t0, t0 + dur)) + inn(span(t, out0, out0 + outDur));
      const phi = b * Math.PI * Math.min(1, s);
      tg.pivot.rotation.y = phi; tg.angle = phi; live.push(tg);
    },
    draw(ctx, t) {
      const time = t + clock; aim(time);
      table.rotation.y = world.tableAngle ? world.tableAngle(t) : time * P.spin;
      scene.updateMatrixWorld(true);
      for (const tg of live) {
        if (!tg.rec || Math.abs(tg.angle) > 0.26 || !tg.pivot.visible || !kit) continue;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const X of [tg.local.x0, tg.local.x1]) for (const Y of [tg.local.y0, tg.local.y1]) {
          V.set(X, Y, tg.local.z).applyMatrix4(tg.content.matrixWorld).project(cam);
          const sx = (V.x + 1) / 2 * W, sy = (1 - V.y) / 2 * H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
        kit.rec(x0, x1, y0, y1, tg.plain);
      }
      live.length = 0;
      R.gl.render(scene, cam);
      ctx.drawImage(R.canvas, 0, 0);
    },
    // Waits for the faces this part prints with, so measuring and printing use the real font.
    async fonts(list) { await Promise.all(list.map(([w, s, fam]) => document.fonts.load(font(w, s, fam)))); },
  };
  return world;
}
