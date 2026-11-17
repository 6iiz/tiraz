// stage.js · mounts a scene on a page the careful way, so the page's own code is only the scene (guides/web.md section 11):
// createStage for a three.js scene, createDrawing for a scene drawn on a 2D canvas (lines, shapes, particles).
// Both take care of what every scene owes the visitor: the still that stands in until the first frame is drawn (and stays when the
// browser refuses), one frame and no loop under reduced motion, no drawing while the scene is off screen or the tab is hidden,
// a capped pixel ratio, the size of its box, and a picture of one frame for the still (node web/still.mjs asks for it).
// It holds no look: the shapes, materials, light, camera, lines and movement are the brand's, written in the page's own scene file.
// Copy this file into the site folder (site/kit/stage.js) and import it from there. A three.js scene also needs site/vendor/three/:
//
//   import * as THREE from './vendor/three/three.module.min.js';
//   import { createStage, studio, softShadow } from './kit/stage.js';
//   const stage = createStage(THREE, { box: document.querySelector('.scene'), still: document.querySelector('.scene img'), rest: 2 });
//   if (stage) {                                   // null when the browser has no WebGL: the still simply stays
//     …build on stage.scene, place stage.camera…
//     stage.run(({ t, dt }) => { …move things for this frame… });
//   }
//
//   import { createDrawing } from './kit/stage.js';
//   const stage = createDrawing({ box: document.querySelector('.scene'), still: document.querySelector('.scene img') });
//   if (stage) stage.run(({ t, dt, ctx, stage }) => { …draw this frame on ctx, in CSS pixels, stage.width by stage.height… });
//
// The markup both expect: a box with a size set in CSS (position: relative, sticky or fixed), holding the still. The canvas is added
// to the box. `still` is one element or a list of them (a scene that carries several moments of a page has a still for each, in the
// place of each moment): all give way when the first frame is drawn, and all come back if the browser takes the drawing surface away.
//
// When there is no scene. If the browser refuses the scene (no WebGL) or takes it away, the box and <html> get the class `no-scene`,
// so the stylesheet can lay the page out for its stills. If the page already stands as plain as it was written (window.pageIsPlain,
// set by the line in the page's head when the script took too long: guides/web.md section 12), nothing is mounted and both functions
// return null: a scene must not arrive on top of a page the visitor is already reading.
//
// When a frame is drawn. The function given to run() is called before every frame, t and dt in seconds. What it returns decides the
// next one: true draws again on the next frame, a number waits that many seconds first (0.05 for a slow drift drawn twenty times a
// second: the canvas keeps its picture in between), false lets this frame stand until something calls stage.invalidate(), and
// nothing (undefined) leaves it to the `continuous` option (true by default). A scene that only answers the scroll or the hand returns
// false once it has settled, or sets continuous: false, and calls invalidate() when the scroll or the hand moves.
//
// The moment a scene rests at. Under reduced motion, and when the page is opened as a still (?still=1), one frame is drawn at
// t = `rest` (or ?t=<number>, which web/still.mjs sets with --t) and nothing moves after it until invalidate() is called.
// stage.calm() says whether that is the case now and stage.rest is that number. A scene whose time is the scroll, not the clock,
// reads its place in the story from the scroll as usual, and from stage.rest when stage.asStill is true.
//
// What web/still.mjs talks to: each mounted scene adds { box, ready, picture(type, quality) } to window.__tirazStages. `ready` turns
// true after the first frame is on the canvas, and picture() draws the resting frame and returns it as a data URL.

// The browser refused the scene, or took it away: the box and the page say so, for a stylesheet that lays things out another way then.
const refused = (box) => { if (box) box.classList.add('no-scene'); document.documentElement.classList.add('no-scene'); };

// The part both kinds share: the loop, the still, the box, the resting frame and the picture.
function mount(box, canvas, { still, label, rest, continuous }, kind) {
  const query = new URLSearchParams(location.search), asStill = query.has('still');
  if (label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', label); } else canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  const at = query.has('t') ? parseFloat(query.get('t')) : rest;                              // the moment the scene rests at: its still, and its one frame under reduced motion
  const calm = () => asStill || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = { canvas, box, width: 1, height: 1, live: false, asStill, rest: at, calm };
  const resizers = [];
  // shown or not, whatever the page's stylesheet says about display (an author rule beats the hidden attribute)
  const hide = (el, yes) => { el.hidden = yes; el.style.display = yes ? 'none' : ''; };
  const stills = !still ? [] : still.nodeType ? [still] : [...still];                         // one still, or one for each moment the scene carries
  const entry = { box, ready: false, picture: null };                                         // what web/still.mjs talks to
  let draw = null, raf = 0, start = 0, last = 0, onScreen = true, lost = false, wanted = false, wait = 0, paused = 0;

  const size = () => {
    stage.width = Math.max(1, box.clientWidth); stage.height = Math.max(1, box.clientHeight);
    kind.resize(stage.width, stage.height);
    for (const fn of resizers) fn(stage);
  };
  const paint = (t, dt) => { const more = kind.frame(draw, t, dt); if (!stage.live) reveal(); return more; };
  const reveal = () => {                                                                     // the first frame is on the canvas: the still gives way
    stage.live = true;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!lost) for (const el of stills) hide(el, true); box.classList.add('live'); entry.ready = true; }));
  };
  const tick = (now) => {
    raf = 0;
    if (lost || !draw) return;
    wanted = false;
    if (calm()) { paint(at, 0); return; }                                                     // one frame, then nothing until something asks
    if (!start) start = last = now;
    const dt = Math.min(0.05 + paused, (now - last) / 1000); last = now; paused = 0;         // a long pause never turns into a jump; a wait the scene asked for is not one
    const more = paint((now - start) / 1000, dt);
    if (wanted || more === true || (more === undefined && continuous)) ask();                 // `wanted` again means the scene asked for another frame while drawing this one
    else if (typeof more === 'number' && more > 0) { paused = more; wait = setTimeout(() => { wait = 0; ask(); }, more * 1000); }
  };
  const ask = () => { if (wait) { clearTimeout(wait); wait = 0; } if (!raf && onScreen && !document.hidden && !lost) raf = requestAnimationFrame(tick); };

  // start drawing: fn(…) is called before every frame, t and dt in seconds (see "When a frame is drawn" above)
  stage.run = (fn) => { draw = fn; box.appendChild(canvas); size(); ask(); return stage; };
  // ask for one more frame: after the scroll or the hand moved, and for any change made under reduced motion (a scroll position,
  // a choice the visitor made)
  stage.invalidate = () => { wanted = true; ask(); };
  stage.onResize = (fn) => { resizers.push(fn); return stage; };
  stage.stop = () => { cancelAnimationFrame(raf); clearTimeout(wait); raf = 0; wait = 0; draw = null; };

  if ('ResizeObserver' in window) new ResizeObserver(() => { size(); stage.invalidate(); }).observe(box); else addEventListener('resize', () => { size(); stage.invalidate(); });
  if ('IntersectionObserver' in window) new IntersectionObserver((e) => { onScreen = e[e.length - 1].isIntersecting; if (onScreen) { last = performance.now(); ask(); } }, { rootMargin: '10% 0px' }).observe(box);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); ask(); } });
  // the browser took the drawing surface away: the still comes back and the loop ends
  const lose = () => { lost = true; cancelAnimationFrame(raf); clearTimeout(wait); raf = 0; wait = 0; for (const el of stills) hide(el, false); canvas.style.display = 'none'; box.classList.remove('live'); refused(box); };

  // one frame as a picture, for the still: node web/still.mjs opens the page with ?still=1 (and &t=<number>) and calls this
  entry.picture = (type = 'image/png', quality = 0.92) => { paint(at, 0); return canvas.toDataURL(type, quality); };
  (window.__tirazStages = window.__tirazStages || []).push(entry);
  return { stage, lose };
}

// A three.js scene. Returns null when the browser has no WebGL (asked first, so a refusal logs nothing): the still simply stays,
// and the box and <html> get the class `no-scene`.
// The returned stage has: THREE, renderer, scene, camera, canvas, box, width, height, live, rest, asStill, calm(), run(fn),
// invalidate(), onResize(fn), stop().
export function createStage(THREE, { box, still = null, maxPixelRatio = 2, fov = 35, near = 0.1, far = 100, orthographic = false,
                                      label = '', rest = 0, continuous = true } = {}) {
  if (!box || window.pageIsPlain) return null;
  if (!document.createElement('canvas').getContext('webgl2')) { refused(box); return null; }
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).has('still') }); }
  catch { refused(box); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, maxPixelRatio));
  const scene = new THREE.Scene();
  const camera = orthographic ? new THREE.OrthographicCamera(-1, 1, 1, -1, near, far) : new THREE.PerspectiveCamera(fov, 1, near, far);
  const { stage, lose } = mount(box, canvas, { still, label, rest, continuous }, {
    resize: (w, h) => {
      renderer.setSize(w, h, false);
      if (camera.isPerspectiveCamera) camera.aspect = w / h;
      else { const k = w / h; camera.left = -k; camera.right = k; camera.top = 1; camera.bottom = -1; }
      camera.updateProjectionMatrix();
    },
    frame: (draw, t, dt) => { const more = draw ? draw({ t, dt, stage }) : undefined; renderer.render(scene, camera); return more; },
  });
  Object.assign(stage, { THREE, renderer, scene, camera });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lose(); });
  return stage;
}

// A scene drawn on a 2D canvas: an ink drawing, a diagram, a field of marks. Lighter than WebGL and exact for thin lines.
// The scene draws in CSS pixels (the pixel ratio is already applied), on a canvas cleared before every frame unless clear is false.
// Returns null when the browser gives no 2D canvas. The returned stage has: ctx, canvas, box, width, height, ratio, live, rest,
// asStill, calm(), run(fn), invalidate(), onResize(fn), stop(). fn gets { t, dt, ctx, stage }.
export function createDrawing({ box, still = null, maxPixelRatio = 2, label = '', rest = 0, continuous = true, clear = true } = {}) {
  if (!box || window.pageIsPlain) return null;
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) { refused(box); return null; }
  const { stage } = mount(box, canvas, { still, label, rest, continuous }, {
    resize: (w, h) => {
      const r = Math.min(devicePixelRatio || 1, maxPixelRatio), pw = Math.round(w * r), ph = Math.round(h * r);
      stage.ratio = r;
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }    // setting the size wipes the canvas: only when it changed
    },
    frame: (draw, t, dt) => {
      ctx.setTransform(stage.ratio, 0, 0, stage.ratio, 0, 0);
      if (clear) ctx.clearRect(0, 0, stage.width, stage.height);
      return draw ? draw({ t, dt, ctx, stage }) : undefined;
    },
  });
  Object.assign(stage, { ctx, ratio: 1 });
  return stage;
}

// A reflection map made from a few lit panels, in place of an HDR file. Glossy, glazed and metal materials take their reflections
// from it; without one they render dark and flat. Each panel is { position: [x, y, z], size: [w, h], color, intensity } and faces
// the middle of the scene. Which panels, where, how bright and what colour is the look's decision: this is only the mechanism.
//   scene.environment = studio(THREE, stage.renderer, [{ position: [0, 4, 1], size: [5, 5], color: '#ffffff', intensity: 6 }, …]);
export function studio(THREE, renderer, panels, { ambient = '#000000', blur = 0.04 } = {}) {
  const room = new THREE.Scene(); room.background = new THREE.Color(ambient);
  for (const p of panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.intensity ?? 1), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(p.position[0], p.position[1], p.position[2]); m.lookAt(0, 0, 0); room.add(m);
  }
  const maker = new THREE.PMREMGenerator(renderer), map = maker.fromScene(room, blur).texture;
  maker.dispose(); room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return map;
}

// A soft shadow to lay under an object: a flat disc that fades to nothing at its edge, so it never shows the edge of the canvas the
// way a shadow cast on an invisible floor does. Returns a mesh lying on the ground plane (y = 0): place and scale it under the object.
// scale.x is its width and scale.z its depth (the same number for a round shadow); `hardness` is how far from the middle the dark
// core reaches before it starts to fade, 0 to 0.95.
//   const shade = softShadow(THREE, { color: '#000000', opacity: 0.45 }); shade.scale.set(2.4, 1, 2.4); scene.add(shade);
export function softShadow(THREE, { color = '#000000', opacity = 0.5, hardness = 0.25, pixels = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = pixels;
  const x = c.getContext('2d'), g = x.createRadialGradient(pixels / 2, pixels / 2, 0, pixels / 2, pixels / 2, pixels / 2);
  // the fade is painted in grey on black, not in the picture's own transparency: three.js reads an alpha map from its green channel
  g.addColorStop(0, '#ffffff'); g.addColorStop(Math.min(0.95, Math.max(0, hardness)), '#d9d9d9'); g.addColorStop(1, '#000000');
  x.fillStyle = '#000000'; x.fillRect(0, 0, pixels, pixels); x.fillStyle = g; x.fillRect(0, 0, pixels, pixels);
  const flat = new THREE.PlaneGeometry(1, 1); flat.rotateX(-Math.PI / 2);                     // laid on the ground in the shape itself, so scale.x and scale.z are its width and depth
  const mesh = new THREE.Mesh(flat,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color), alphaMap: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false, toneMapped: false }));
  mesh.position.y = 0.001; mesh.renderOrder = -1;
  return mesh;
}
