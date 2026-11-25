// The origami-fold ground: a large sheet of card that was once folded and opened again, lying under a soft lamp. Its crease
// pattern is real relief (mountain and valley folds, flat-shaded facets), so the light picks out every fold; a soft pool of light
// and fine paper fibres are baked into it once. On it, each word is its own sheet of paper: printed in ink, folded into a pleat,
// standing up on its bottom crease and opening panel after panel in front of the lens.
//
//   const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed });
//   const r = await W3.row('بتشبه *مية* شركة', { size: 118 });   // one sheet per word, one sheet per key run (in the accent)
//   r.place({ y: 700 });  then per frame: r.sheets[i].pose(p); W3.draw(ctx, t)
//
// One WebGL renderer is shared by every part of a reel and by the joint. The camera's frustum is solved so the plane the sheets
// rest on maps 1 unit to 1 frame pixel: layout is done in frame pixels; only folding paper leaves that plane. Frames are a function
// of t + clock only; every texture and mesh is built in create().
import { THREE } from '/engine/three3d.js';
import { mix, rng, contrast, SAFE, clamp, font } from '/engine/kit.js';
import { E, stand, crease, DEG } from './motion.js';

let shared = null;
export function glOf(W, H) {
  if (shared && shared.W === W && shared.H === H) return shared;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  gl.setPixelRatio(1); gl.setSize(W, H, false);
  gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.NoToneMapping;   // paper keeps the brand's exact colours at rest
  gl.setClearColor(0x000000, 0);
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap;
  shared = { W, H, canvas, gl, aniso: Math.min(8, gl.capabilities.getMaxAnisotropy()) }; return shared;
}

const lum = (h) => contrast(h, '#000000');
// Every colour is a mix of the brand's three. The lighter of bg/text is the paper the words are printed on, the darker its ink;
// the table follows the brand's own background (a dark card for a dark brand, a kraft card for a light one); the accent is the
// coloured paper of the key word.
export function palette(brand) {
  const { bg, text, accent } = brand.colors, darkBg = lum(bg) <= lum(text);
  const light = darkBg ? text : bg, dark = darkBg ? bg : text;
  const P = {
    light, dark, accent, darkBg,
    ground: darkBg ? mix(bg, text, 0.13) : mix(bg, text, 0.2),
    paper: light, ink: dark, back: mix(light, dark, 0.12),
    leadPaper: mix(light, dark, 0.08), leadInk: mix(dark, light, 0.2),
    oldPaper: mix(light, dark, 0.22), oldInk: mix(dark, light, 0.34),
    key: accent,
  };
  P.keyInk = contrast(dark, accent) >= contrast(light, accent) ? dark : light;
  P.keyBack = mix(accent, dark, 0.2);
  P.strike = contrast(accent, P.oldPaper) >= 2.4 ? accent : dark;
  return P;
}

const hash = (i, j, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
const tex = (cv, aniso) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

// A paper canvas: colour, fine fibres and a hint of edge wear, at S texture pixels per frame pixel. Returns { cv, g } (g scaled to frame px).
export function paperCanvas(w, h, colour, seed, S, creases = []) {
  const cv = document.createElement('canvas'); cv.width = Math.max(4, Math.ceil(w * S)); cv.height = Math.max(4, Math.ceil(h * S));
  const g = cv.getContext('2d'); g.scale(S, S);
  g.fillStyle = colour; g.fillRect(0, 0, w, h);
  const r = rng(seed), n = Math.min(900, Math.round(w * h / 260));
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = 2 + r() * 7, lightF = r() < 0.5;
    g.strokeStyle = lightF ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'; g.lineWidth = 0.6 + r() * 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // pressed creases: a soft valley line with a lit lip beside it
  for (const x of creases) {
    g.fillStyle = 'rgba(0,0,0,0.075)'; g.fillRect(x - 0.9, 0, 1.8, h);
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(x + 0.9, 0, 1.4, h);
  }
  g.strokeStyle = 'rgba(0,0,0,0.10)'; g.lineWidth = 1.2; g.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
  return { cv, g };
}

export async function create({ W, H, brand, look, clock = 0, kit, seed = 1 }) {
  const T = look.tokens, P = palette(brand), rtl = brand.dir !== 'ltr', s = rtl ? -1 : 1, R = glOf(W, H);
  const Zs = T.z.sheet, D = T.camera.dist, S = T.tex;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.ground);
  const wx = (px) => px - W / 2, wy = (py) => H / 2 - py;

  // ---- camera: a shifted lens; the eye sits a little above and to one side, looking straight at the table
  const cam = new THREE.PerspectiveCamera(30, W / H, 20, 20000);
  function aim(time) {
    const a = (time / T.camera.period) * Math.PI * 2;
    const ex = s * -T.camera.ex + T.camera.drift * Math.sin(a), ey = T.camera.ey + T.camera.drift * 0.5 * Math.sin(a * 0.5 + 1);
    cam.position.set(ex, ey, Zs + D); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
    const k = cam.near / D;
    cam.projectionMatrix.makePerspective((-W / 2 - ex) * k, (W / 2 - ex) * k, (H / 2 - ey) * k, (-H / 2 - ey) * k, cam.near, cam.far);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  aim(clock);

  // ---- light: an even sky and one soft lamp from the upper left that drifts a few degrees, so the creases change as you watch
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8c8c, T.light.sky));
  const sun = new THREE.DirectionalLight(0xfff8ef, T.light.sun);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.intensity = T.light.shadow; sun.shadow.radius = T.light.radius;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
  Object.assign(sun.shadow.camera, { left: -1150, right: 1150, top: 1250, bottom: -1250, near: 200, far: 7000 });
  scene.add(sun, sun.target);
  const lamp = (time) => {
    const a = -0.46 + 0.07 * Math.sin((time / T.light.period) * Math.PI * 2), v = new THREE.Vector3(a, 0.56, 0.72).normalize();
    sun.position.copy(v.multiplyScalar(3200)); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  };

  // ---- the table: a creased card, relief from a mountain/valley lattice, a light pool and fibres baked into its map
  {
    const BW = W * 1.6, BH = H * 1.5, C = T.ground.cell, A = T.ground.relief * (P.darkBg ? 1 : 0.62), r = rng(seed * 31 + 7);
    const ox = (r() - 0.5) * C, oy = (r() - 0.5) * C, nx = Math.ceil(BW / C) + 1, ny = Math.ceil(BH / C) + 1;
    const X = (i) => -BW / 2 + ox + i * C, Y = (j) => -BH / 2 + oy + j * C;
    const hc = (i, j) => A * ((i + j) % 2 ? 1 : -1) * (0.55 + 0.45 * hash(i, j, seed));
    const pos = [], uv = [], U = (x) => x / BW + 0.5, V = (y) => y / BH + 0.5;
    const push = (x, y, z) => { pos.push(x, y, z); uv.push(U(x), V(y)); };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const c = [[X(i), Y(j), hc(i, j)], [X(i + 1), Y(j), hc(i + 1, j)], [X(i + 1), Y(j + 1), hc(i + 1, j + 1)], [X(i), Y(j + 1), hc(i, j + 1)]];
      const m = [(X(i) + X(i + 1)) / 2, (Y(j) + Y(j + 1)) / 2, -0.25 * A * (hash(j, i, seed + 3) - 0.5)];
      for (let e = 0; e < 4; e++) { const a = c[e], b = c[(e + 1) % 4]; push(...a); push(...b); push(...m); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    // the map multiplies the card colour: a soft pool of lamp light, fibres, and a faint valley line on every crease
    const tw = 640, th = Math.round(tw * BH / BW), cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
    const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, tw, th);
    const fx = (x) => U(x) * tw, fy = (y) => (1 - V(y)) * th;
    const pool = g.createRadialGradient(fx(-W * 0.18), fy(H * 0.2), 0, fx(-W * 0.18), fy(H * 0.2), tw * 0.78);
    pool.addColorStop(0, 'rgba(0,0,0,0)'); pool.addColorStop(0.55, 'rgba(0,0,0,0.10)'); pool.addColorStop(1, 'rgba(0,0,0,0.34)');
    g.fillStyle = pool; g.fillRect(0, 0, tw, th);
    for (let k = 0; k < 2600; k++) {
      const x = r() * tw, y = r() * th, a = r() * Math.PI, l = 1 + r() * 4;
      g.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'; g.lineWidth = 0.5 + r() * 0.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 1;
    for (let j = 0; j <= ny; j++) { g.beginPath(); g.moveTo(fx(X(0)), fy(Y(j))); g.lineTo(fx(X(nx)), fy(Y(j))); g.stroke(); }
    for (let i = 0; i <= nx; i++) { g.beginPath(); g.moveTo(fx(X(i)), fy(Y(0))); g.lineTo(fx(X(i)), fy(Y(ny))); g.stroke(); }
    const mat = new THREE.MeshLambertMaterial({ color: P.ground, map: tex(cv, 4), flatShading: true });
    const table = new THREE.Mesh(geo, mat); table.receiveShadow = true; scene.add(table);
  }

  const disp = brand.fonts.display.family, mono = brand.fonts.mono?.family ?? disp;
  await Promise.all([[600, disp], [700, disp], [800, disp], [500, mono], [600, mono]].map(([wt, f]) => document.fonts.load(`${wt} 60px "${f}"`)));
  const fam = (face) => (face === 'mono' ? mono : disp);
  const mctx = document.createElement('canvas').getContext('2d');
  const colours = { word: [P.paper, P.ink, P.back], key: [P.key, P.keyInk, P.keyBack], lead: [P.leadPaper, P.leadInk, P.back], old: [P.oldPaper, P.oldInk, P.back] };
  let sheetSeed = seed * 1000;

  // A sheet of paper: its texture(s), its panels (front printed, back plain), a stand hinge on its bottom edge.
  //  texts: one or more strings, each drawn into its own texture of the same size (a counting number swaps them).
  function sheet({ texts, kind = 'word', size, weight = 800, face = 'display', w, h, asc, padX, padY, fws, panels, decor = false, ltr = false }) {
    const [paper, ink, back] = colours[kind] || colours.word;
    const n = panels ?? clamp(Math.round(w / (h * T.sheet.panel)), 2, 6), pw = w / n;
    const creases = []; for (let k = 1; k < n; k++) creases.push(k * pw);
    const maps = texts.map((txt) => {
      const { cv, g } = paperCanvas(w, h, paper, sheetSeed++, S, creases);
      if (txt) {
        const f = kit.fit(txt, { family: fam(face), weight, size, maxW: 1e5, single: true, where: 'a sheet' });
        kit.drawText(g, f, { x0: 0, x1: w, y: padY + asc, align: 'center', color: ink, key: ink });
      }
      return tex(cv, R.aniso);
    });
    const front = new THREE.MeshLambertMaterial({ map: maps[0], side: THREE.FrontSide }); front.shadowSide = THREE.DoubleSide;
    const rear = new THREE.MeshLambertMaterial({ color: back, side: THREE.BackSide });
    const root = new THREE.Group(), meshes = [];
    for (let k = 0; k < n; k++) {
      const geo = new THREE.PlaneGeometry(pw, h), uv = geo.attributes.uv;
      const u0 = rtl ? 1 - (k + 1) / n : k / n, u1 = u0 + 1 / n;          // panel k counts from the reading-start edge
      for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
      const m = new THREE.Mesh(geo, front), mb = new THREE.Mesh(geo, rear);
      m.castShadow = true; mb.castShadow = false; m.add(mb); root.add(m); meshes.push(m);
    }
    root.visible = false; scene.add(root);
    const sh = {
      root, meshes, n, w, h, kind, front, maps, text: texts.at(-1), decor, rect: null, L: 0, T: 0, shown: 0,
      // left edge and top edge of the sheet in frame pixels
      place(x, y) {
        sh.L = x; sh.T = y; const ax = rtl ? x + w : x;
        root.position.set(wx(ax), wy(y + h), Zs);
        const fw = fws ?? (w - 2 * padX); sh.rect = [x + (w - fw) / 2, x + (w + fw) / 2, y + padY * 0.6, y + h - padY * 0.6];
        return sh;
      },
      show(i) { sh.text = texts[i]; if (sh.shown !== i) { sh.shown = i; front.map = maps[i]; } },
      // p: the arrival (0 folded and lying, 1 flat and standing). o: { z, flex (radians), tilt (radians), wave, rec }
      pose(p, o = {}) {
        root.visible = p > 0; if (!root.visible) return;
        const fold = o.wave != null ? { ...T.fold, wave: o.wave } : T.fold;
        root.rotation.x = stand(p, T.fold.stand) + (o.tilt ?? 0);
        root.position.z = Zs + T.z.lift * (1 - E(p)) + (o.z ?? 0);
        let px = 0, pz = 0;
        for (let k = 0; k < n; k++) {
          const th = crease(p, k, n, fold) + (o.flex ?? 0), sg = k % 2 ? -1 : 1;
          const dx = s * pw * Math.cos(th), dz = sg * pw * Math.sin(th);
          const m = meshes[k]; m.position.set(px + dx / 2, h / 2, pz + dz / 2); m.rotation.set(0, -s * sg * th, 0);
          px += dx; pz += dz;
        }
        if (o.rec !== false && kit && p > 0.02) kit.rec(...sh.rect, sh.text, decor ? { decor: true } : undefined);
      },
    };
    return sh;
  }

  // ascent/descent of a text about the middle baseline, at a size and face
  function metrics(strs, { size, weight, face }) {
    mctx.font = font(weight, size, fam(face)); mctx.textBaseline = 'middle';
    let asc = size * 0.42, desc = size * 0.3;
    for (const t of strs) { if (!t) continue; mctx.direction = /[؀-ۿ]/.test(t) ? 'rtl' : 'ltr'; const m = mctx.measureText(t); asc = Math.max(asc, m.actualBoundingBoxAscent); desc = Math.max(desc, m.actualBoundingBoxDescent); }
    return { asc, desc };
  }
  const groupsOf = (text, whole) => {
    const words = []; let key = false;
    for (const part of text.split('*')) { part.split(/\s+/).filter(Boolean).forEach((w) => { if (/^[\p{P}]+$/u.test(w) && words.length) words.at(-1).w += w; else words.push({ w, key }); }); key = !key; }
    if (whole) return [{ text: words.map((x) => x.w).join(' '), key: false }];
    const out = [];
    for (const x of words) { const last = out.at(-1); if (x.key && last?.key) last.text += ' ' + x.w; else out.push({ text: x.w, key: x.key }); }
    return out;
  };

  // Measures a row without building it: { width, h } in frame pixels.
  function measure(text, { size, weight = 800, face = 'display', whole = false }) {
    const gs = groupsOf(text, whole), m = metrics(gs.map((g) => g.text), { size, weight, face });
    const padX = size * T.sheet.padX, gap = size * T.sheet.gap;
    let width = 0; gs.forEach((g, i) => { const f = kit.fit(g.text, { family: fam(face), weight, size, maxW: 1e5, single: true, where: 'a sheet' }); width += f.width + 2 * padX + (i ? gap : 0); });
    return { width, h: m.asc + m.desc + 2 * size * T.sheet.padY };
  }

  // A row of sheets: one per word, one per run of key words (accent paper), or one for the whole text (whole: true).
  async function row(text, { size, weight = 800, face = 'display', kind = 'word', whole = false, ltr = false, decor = false, panels } = {}) {
    await document.fonts.load(`${weight} ${size}px "${fam(face)}"`);
    const gs = groupsOf(text, whole), m = metrics(gs.map((g) => g.text), { size, weight, face });
    const padX = size * T.sheet.padX, padY = size * T.sheet.padY, gap = size * T.sheet.gap, h = m.asc + m.desc + 2 * padY;
    const sheets = gs.map((g) => {
      const f = kit.fit(g.text, { family: fam(face), weight, size, maxW: 1e5, single: true, where: 'a sheet' });
      const w = f.width + 2 * padX;
      return sheet({ texts: [g.text], kind: g.key ? 'key' : kind, size, weight, face, w, h, asc: m.asc, padX, padY, decor, ltr, panels });
    });
    const width = sheets.reduce((a, b) => a + b.w, 0) + gap * (sheets.length - 1);
    const r = {
      sheets, width, h, gap, size,
      // y: top of the row in frame px; align 'center' | 'start' (the reading side) inside x0..x1
      place({ y, align = 'center', x0 = SAFE.left, x1 = SAFE.right }) {
        let cur = align === 'center' ? (rtl ? (x0 + x1 + width) / 2 : (x0 + x1 - width) / 2) : (rtl ? x1 : x0);
        for (const sh of sheets) { if (rtl) { cur -= sh.w; sh.place(cur, y); cur -= gap; } else { sh.place(cur, y); cur += sh.w + gap; } }
        r.y = y; return r;
      },
    };
    return r;
  }

  // A sheet whose print changes (a counting number): every text in `texts` gets its own texture at one size.
  async function counter(texts, { size, weight = 800, face = 'display', kind = 'key', panels = 4 }) {
    await document.fonts.load(`${weight} ${size}px "${fam(face)}"`);
    const m = metrics(texts, { size, weight, face }), padX = size * T.sheet.padX * 0.8, padY = size * T.sheet.padY * 0.8;
    const fw = Math.max(...texts.map((t) => kit.fit(t, { family: fam(face), weight, size, maxW: 1e5, single: true, where: 'the number' }).width));
    const w = fw + 2 * padX, h = m.asc + m.desc + 2 * padY;
    return sheet({ texts, kind, size, weight, face, w, h, asc: m.asc, padX, padY, fws: fw, panels, ltr: true });
  }

  const world = {
    THREE, scene, camera: cam, P, rtl, s, Zs, D, S, wx, wy, aniso: R.aniso, row, measure, counter, sheet,
    paper: (w, h, colour, creases = []) => paperCanvas(w, h, colour, sheetSeed++, S, creases),
    tex: (cv) => tex(cv, R.aniso),
    draw(ctx, t) {
      const time = t + clock; aim(time); lamp(time);
      R.gl.render(scene, cam); ctx.drawImage(R.canvas, 0, 0);
    },
  };
  return world;
}
