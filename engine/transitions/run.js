// run.js · draws a transition between two pictures.
//   import { loadTransition, listTransitions } from '/engine/transitions/run.js';
//   const tr = await loadTransition('CrossZoom');             // names are in index.json; 'fade' is plain 2D and needs no WebGL
//   const picture = tr.draw(fromCanvas, toCanvas, 0.5, { strength: 0.4 });   // params are optional; defaults come from the shader file
//   ctx.drawImage(picture, 0, 0);
// The inputs are 2D canvases of the same size. The result is a canvas of that size; it is shared, so draw it before the next call to draw().
// Progress 0 gives the "from" picture and 1 the "to" picture. Nothing is kept between calls except the compiled shaders: same inputs, same pixels.
// The shaders are gl-transitions files (vendor/gl-transitions, see its LICENSES.md) wrapped in a small WebGL2 program: they define
// vec4 transition(vec2 uv) and use progress, ratio, getFromColor, getToColor. uv starts at the bottom left, as in gl-transitions.
import { parseUniforms, zeroOf } from './parse.js';

const KIT = new URL('../../', import.meta.url);
let indexPromise = null;
const loadIndex = () => indexPromise ||= fetch(new URL('engine/transitions/index.json', KIT)).then((r) => {
  if (!r.ok) throw new Error('engine/transitions/index.json is missing: run  node engine/transitions/build.mjs --src <gl-transitions>/transitions  in the kit folder.');
  return r.json();
});
export async function listTransitions() { return (await loadIndex()).transitions; }

const NO_WEBGL = (name) => `The transition "${name}" needs WebGL2, and this browser does not offer it. Use "fade", which is drawn without WebGL, or render on a machine whose Chrome has WebGL2 (Chrome's own software renderer is enough).`;

// ---- 2D cross-fade ---------------------------------------------------------------------------------------------------------------
let fadeCanvas = null;
function sameSize(from, to) {
  if (from.width !== to.width || from.height !== to.height) throw new Error(`A transition needs two pictures of the same size, but got ${from.width}x${from.height} and ${to.width}x${to.height}.`);
}
const fade = {
  name: 'fade',
  draw(from, to, progress = 0) {
    sameSize(from, to);
    fadeCanvas ||= document.createElement('canvas');
    if (fadeCanvas.width !== from.width || fadeCanvas.height !== from.height) { fadeCanvas.width = from.width; fadeCanvas.height = from.height; }
    const c = fadeCanvas.getContext('2d'), p = Math.min(1, Math.max(0, progress));
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(from, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = p; c.drawImage(to, 0, 0); c.globalAlpha = 1;
    return fadeCanvas;
  },
};

// ---- WebGL2, one shared offscreen canvas -----------------------------------------------------------------------------------------
let G = null;      // { gl, canvas, vao, textures, maps } once created; false once WebGL2 turned out to be missing
const VERTEX = `#version 300 es
in vec2 pos; out vec2 _uv;
void main() { _uv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }`;
// "texture2D" is the old name of texture(); several gl-transitions files still use it.
const HEAD = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D _from; uniform sampler2D _to; uniform float progress; uniform float ratio;
in vec2 _uv; out vec4 _out;
vec4 getFromColor(vec2 uv) { return texture(_from, uv); }
vec4 getToColor(vec2 uv) { return texture(_to, uv); }
#define texture2D texture
#line 1
`;
const TAIL = '\nvoid main() { _out = transition(_uv); }\n';

function context() {
  if (G !== null) return G;
  G = false;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(2, 2);
  // preserveDrawingBuffer keeps the picture readable after the call; no alpha because both inputs are opaque frames.
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) return G;
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return t; };
  G = { gl, canvas, vao, textures: [tex(), tex()], maps: new Map(), programs: new Map() };
  return G;
}
export function webglAvailable() { return !!context(); }
// The graphics renderer in use, for reports ("ANGLE (... SwiftShader ...)"), or null.
export function rendererInfo() {
  const g = context(); if (!g) return null;
  const ext = g.gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? g.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.gl.getParameter(g.gl.RENDERER);
}

// A fixed grey map for the two transitions that want an extra texture (LumaWipe, DisplacementMap): smooth value noise from an integer hash,
// so the same map comes out every time. A caller can pass its own canvas as that parameter.
function noiseMap(gl) {
  const N = 256, cell = 32, px = new Uint8Array(N * N * 4);
  const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const sm = (a) => a * a * (3 - 2 * a);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = sm(gx - x0), fy = sm(gy - y0);
    const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1);
    const v = Math.round(255 * ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy)), i = (y * N + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
  }
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t;
}

function compile(g, name, src) {
  const { gl } = g;
  const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (() => { const log = gl.getShaderInfoLog(s) || 'no message'; gl.deleteShader(s); throw new Error(`The transition "${name}" does not compile on this graphics driver: ${log.split('\n').find((l) => l.trim()) || log}`); })(); };
  const vs = sh(gl.VERTEX_SHADER, VERTEX), fs = sh(gl.FRAGMENT_SHADER, HEAD + src + TAIL);
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog, 0, 'pos'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`The transition "${name}" does not link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
}

function setUniform(gl, loc, type, v, name, tr) {
  const bad = () => { throw new Error(`The parameter "${name}" of "${tr}" is a ${type}; ${JSON.stringify(v)} does not fit.`); };
  const n = { vec2: 2, vec3: 3, vec4: 4, ivec2: 2, ivec3: 3, ivec4: 4 }[type];
  if (type === 'float') { if (typeof v !== 'number') bad(); gl.uniform1f(loc, v); }
  else if (type === 'int') { if (typeof v !== 'number') bad(); gl.uniform1i(loc, Math.round(v)); }
  else if (type === 'bool') gl.uniform1i(loc, v ? 1 : 0);
  else if (n) {
    const a = typeof v === 'number' ? Array(n).fill(v) : v; if (!Array.isArray(a) || a.length !== n) bad();
    if (type.startsWith('i')) gl[`uniform${n}iv`](loc, new Int32Array(a.map(Math.round))); else gl[`uniform${n}fv`](loc, new Float32Array(a));
  }
}

export async function loadTransition(name) {
  const index = (await loadIndex()).transitions;
  let entry = index.find((e) => e.name === name);
  if (!entry) {
    const near = index.filter((e) => e.name.toLowerCase() === String(name).toLowerCase());
    if (near.length === 1) entry = near[0];            // "crosszoom" finds "CrossZoom"; two names that differ only by case must be written exactly
    else throw new Error(`There is no transition called "${name}". ${index.length} are available (see engine/transitions/index.json), for example: ${index.slice(0, 8).map((e) => e.name).join(', ')}.`);
  }
  if (entry.builtin) return fade;

  const g = context();
  if (!g) throw new Error(NO_WEBGL(entry.name));
  const res = await fetch(new URL(entry.file, KIT));
  if (!res.ok) throw new Error(`The shader file ${entry.file} for "${entry.name}" is missing: run  node engine/transitions/build.mjs  again.`);
  const src = await res.text(), params = parseUniforms(src);
  const prog = compile(g, entry.name, src), { gl } = g;
  const loc = (n) => gl.getUniformLocation(prog, n);
  const L = { from: loc('_from'), to: loc('_to'), progress: loc('progress'), ratio: loc('ratio') };
  const locs = params.map((p) => ({ p, loc: loc(p.name) }));      // null when the shader never uses it: then it is skipped

  return {
    name: entry.name, params,
    draw(from, to, progress = 0, given = {}) {
      sameSize(from, to);
      for (const k of Object.keys(given)) if (!params.some((p) => p.name === k)) throw new Error(`"${entry.name}" has no parameter "${k}". Its parameters are: ${params.map((p) => p.name).join(', ') || 'none'}.`);
      const { canvas } = g, W = from.width, H = from.height;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H); gl.useProgram(prog); gl.bindVertexArray(g.vao);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      // y flipped on upload so uv (0,0) is the bottom left and the pictures stand upright, as gl-transitions expects.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      [from, to].forEach((src2, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, g.textures[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src2); });
      gl.uniform1i(L.from, 0); gl.uniform1i(L.to, 1);
      gl.uniform1f(L.progress, Math.min(1, Math.max(0, progress))); gl.uniform1f(L.ratio, W / H);
      let unit = 2;
      for (const { p, loc: l } of locs) {
        if (!l) { if (p.type === 'sampler2D') unit++; continue; }
        if (p.type === 'sampler2D') {
          gl.activeTexture(gl.TEXTURE0 + unit);
          if (given[p.name]) {                                      // a caller's own canvas for this slot
            const t = g.textures[2 + unit] ||= (() => { const x = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, x); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return x; })();
            gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, given[p.name]);
          } else { if (!g.maps.has('noise')) g.maps.set('noise', noiseMap(gl)); gl.bindTexture(gl.TEXTURE_2D, g.maps.get('noise')); }
          gl.uniform1i(l, unit++); continue;
        }
        const v = p.name in given ? given[p.name] : (p.default ?? zeroOf(p.type));
        setUniform(gl, l, p.type, v, p.name, entry.name);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return canvas;
    },
  };
}
