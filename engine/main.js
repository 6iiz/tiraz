// main.js · the page that draws one scene on a canvas, frame by frame.
//   index.html?scene=/path/scene.js[&brand=/brand/brand.json][&spec=/path/spec.json][&dur=5][&size=1080x1920]
// A scene module exports  create({ W, H, brand, look, spec, base, clock, query, loadScene, kit })  and returns  { duration, prepare?(t), draw(ctx, t), timeline? }.
//   brand: the identity (null without &brand=).   look: { base: '/brand/look/', tokens } from the brand's "look" folder, or { base: null, tokens: {} }.
//   spec: the parsed JSON of &spec= (or null), base: the folder it came from, for paths written relative to it.
//   clock: seconds from the start of the reel to this scene's start (0 when the scene is the whole reel).
//   kit: engine/kit.js bound to this brand (null without a brand).
// Because create() returns a fresh object each time, one scene can appear several times in a reel (see scenes/sequence.js).
// Older scenes that export init / draw / duration at module level still run (the tool pages use them).
// What the renderer needs from any page is `window.stage`: { ready, end, frame(t) }. A page made of HTML and CSS can provide the same three and be rendered too.
import { loadBrand } from './brand.js';
import { createKit, recordBegin, recordEnd } from './kit.js';
const query = new URLSearchParams(location.search);
const [W, H] = (query.get('size') || '1080x1920').split('x').map(Number);
const canvas = document.querySelector('canvas'); canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');
const brand = query.get('brand') ? await loadBrand(query.get('brand')) : null;

// The brand's look is code and numbers in its own folder; the numbers are read here so every scene gets them the same way.
async function loadLook() {
  if (!brand?.look) return { base: null, tokens: {} };
  const url = brand.look + 'tokens.json', res = await fetch(url);
  if (!res.ok) throw new Error(`the brand's look folder has no ${url}: add a tokens.json there (it may be {}), or remove "look" from brand.json.`);
  let tokens; try { tokens = await res.json(); } catch { throw new Error(`${url} is not valid JSON: open it and fix the syntax.`); }
  return { base: brand.look, tokens };
}
const look = await loadLook();

// A parent scene builds its children with the `loadScene` it receives in create(). A scene must never import this file:
// this file is still waiting for the scene to load, so the import would wait forever.
async function loadScene(url, { spec = null, base = '', clock = 0 } = {}) {
  const mod = await import(url);
  if (mod.create) return mod.create({ W, H, brand, look, spec, base, clock, query, loadScene, kit: brand ? createKit({ W, H, brand, base, query }) : null });
  if (mod.init) await mod.init({ W, H, brand, query });               // module-level scene: one instance only
  return { get duration() { return mod.duration; }, prepare: mod.prepare, draw: (c, t) => mod.draw(c, t, { W, H, dur: mod.duration }), module: mod };
}

let spec = null, base = '';
const specUrl = query.get('spec');
if (specUrl) {
  const res = await fetch(specUrl); if (!res.ok) throw new Error(`spec not found: ${specUrl}. Check the &spec= address, or the --mount that serves it.`);
  try { spec = await res.json(); } catch { throw new Error(`${specUrl} is not valid JSON: open it and fix the syntax.`); }
  base = specUrl.slice(0, specUrl.lastIndexOf('/') + 1);
}
const measuring = query.get('debug') === '1';
const scene = await loadScene(query.get('scene'), { spec, base });
const dur = Number(query.get('dur')) || scene.duration;
if (!(dur > 0)) throw new Error('the scene has no duration: return `duration` from create() or pass &dur=');
window.stage = {
  end: dur,
  timeline: scene.timeline,
  async frame(t) {
    if (scene.prepare) await scene.prepare(t);               // e.g. load the film frame this moment needs
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    recordBegin(measuring);                                  // with &debug=1 the frame publishes the boxes of the text it drew, for the safe-area check
    ctx.save(); scene.draw(ctx, t); ctx.restore();
    recordEnd();
  },
  ready: true,
};
