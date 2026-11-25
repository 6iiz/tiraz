// The glass studio: a dark room in the brand's darker colour, a soft glow on the back wall behind the text, a glossy floor that fades
// into the dark, two rim lights behind the glass so its edges catch, and the band of light that sweeps across between scenes.
// The camera is set so that the plane z = 0 maps one world unit to one frame pixel: text placed at (sx - W/2, horizon - sy, 0) lands at
// frame pixel (sx, sy). The horizon sits at tokens.cam.horizon; the floor is tokens.cam.eye below the eye, so it shows under the safe area.
// create() returns the scene, the camera and helpers; draw(ctx, t, sweep) renders into the reel's frame.
import { mix } from '/engine/kit.js';
import { THREE, gl, palette } from './motion.js';

const VERT = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = `
uniform vec3 uGround, uInk; uniform float uGlowY, uGlowK, uBand, uBandK, uFloorY;
varying vec3 vW;
void main() {
  float y = vW.y - uFloorY;
  vec3 c = uGround * mix(1.0, 0.45, smoothstep(0.0, 4200.0, max(y, 0.0)));                       // the wall darkens upwards
  float g = exp(-pow(vW.x / 1700.0, 2.0) - pow((vW.y - uGlowY) / 1300.0, 2.0));
  c += uInk * g * uGlowK;                                                               // the glow behind the text
  float sl = 0.5 + 0.5 * cos(vW.x / 420.0 * 3.14159);
  c += uInk * pow(sl, 4.0) * g * uGlowK * 0.45;                                          // soft fluted slats: the glass bends them
  c = mix(uGround, c, smoothstep(0.0, 500.0, y));                                       // meets the floor in the ground colour
  float b = exp(-pow((vW.x - uBand + vW.y * 0.32) / 240.0, 2.0));
  c += uInk * b * uBandK;                                                               // the sweeping band of light
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function create({ W, H, brand, look }) {
  const C = look.tokens.cam, P = palette(brand), G = gl(W, H, P);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.ground);
  const D = C.D, back = C.back, hz = C.horizon, eye = C.eye;
  // a camera at the eye, looking straight ahead, with its picture shifted so the horizon sits at frame y = hz
  const Hf = 2 * Math.max(hz, H - hz), offY = hz < H / 2 ? Hf - H : 0;
  const camera = new THREE.PerspectiveCamera(2 * Math.atan(Hf / 2 / D) * 180 / Math.PI, W / Hf, 10, 40000);
  camera.setViewOffset(W, Hf, 0, offY, W, H); camera.position.set(0, 0, D); camera.lookAt(0, 0, 0);
  const at = (sx, sy) => [sx - W / 2, hz - sy];                // frame pixel -> world (x, y) on the plane z = 0

  const lin = (h) => new THREE.Color(h);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60000, 40000), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uGround: { value: lin(P.ground) }, uInk: { value: lin(P.ink) }, uGlowY: { value: 120 }, uGlowK: { value: look.tokens.light.glow },
      uBand: { value: -99999 }, uBandK: { value: look.tokens.light.band }, uFloorY: { value: -eye } } }));
  wall.position.set(0, 10000 - eye, -back); scene.add(wall);

  // the floor fades into the wall over its far part, so there is no seam
  function fade() { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#000'); g.addColorStop(0.1, '#000'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#fff');
    x.fillStyle = g; x.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60000, back + D + 400),
    new THREE.MeshStandardMaterial({ color: lin(mix(P.ground, P.ink, 0.05)), roughness: 0.22, metalness: 0.0, envMap: G.env, envMapIntensity: 0.5,
      transparent: true, alphaMap: fade(), depthWrite: false, fog: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -eye, (D - back) / 2); scene.add(floor);

  scene.add(new THREE.AmbientLight(lin(P.ink), 0.4));
  const rim = (x, y, z, k) => { const l = new THREE.DirectionalLight(0xffffff, k); l.position.set(x, y, z); scene.add(l); return l; };
  rim(-900, 700, -900, 2.4); rim(1000, 400, -700, 1.8); rim(0, 900, 900, 1.3);
  const sweepLight = new THREE.PointLight(lin(P.ink), 0, 1600, 0); scene.add(sweepLight);

  // light that has passed through glass and lies on the floor in front of it: a soft patch, additive, never darker than the floor
  const blob = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  // (kept, unused: a word-shaped patch read as a blurred mirrored word under the text, so every patch is now a plain soft pool)
  // a patch shaped like a word: the word drawn blurred, so the coloured light carries its outline (seen upside down, as cast light is)
  const wordTex = (text, size) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 512);
    x.save(); x.translate(512, 256); x.scale(2, 1); const g = x.createRadialGradient(0, 0, 0, 0, 0, 250);
    g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-256, -256, 512, 512); x.restore();
    x.filter = 'blur(20px)'; x.globalAlpha = 0.75; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = brand.dir === 'ltr' ? 'ltr' : 'rtl';
    let s = 260; x.font = `800 ${s}px "${brand.fonts.display.family}"`; const w = x.measureText(text).width; if (w > 760) { s *= 760 / w; x.font = `800 ${s}px "${brand.fonts.display.family}"`; }
    x.save(); x.translate(512, 256); x.scale(1, -1); x.fillText(text, 0, 0); x.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  // patch(colour, sx, width, { text }) -> mesh on the floor, in front of the glass at frame x = sx; set .material.opacity per frame
  const patch = (color, sx, width, { text = null, z = 420, length = 620 } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshBasicMaterial({ map: blob, color: lin(color).multiplyScalar(0.4),
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: true }));
    m.rotation.x = -Math.PI / 2; m.position.set(sx - W / 2, -eye + 1, z); m.renderOrder = 2; scene.add(m); return m;
  };

  return {
    scene, camera, P, at, patch, W, H, env: G.env,
    draw(ctx, t, sw) {
      const s = sw || { x: -9999, k: 0 }, fx = s.x - W / 2;
      wall.material.uniforms.uBand.value = fx * (D + back) / D;
      sweepLight.position.set(fx, 200, 500); sweepLight.intensity = s.k * look.tokens.light.sweep;
      G.renderer.render(scene, camera); ctx.drawImage(G.canvas, 0, 0);
    },
  };
}
