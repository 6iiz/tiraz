// shape.js · turns a string and a font into glyph outlines laid out like the browser would lay them out.
//   const s = await shapeText({ fontUrl: '/assets/fonts/Noto Sans Arabic/NotoSansArabic[wdth,wght].ttf', text: 'أهلاً بكم', size: 120, wght: 900 });
// HarfBuzz (WebAssembly, vendor/harfbuzzjs) does the shaping: letter joins, ligatures and marks are already resolved in the outlines.
// Result, in pixels, y down, origin at the LEFT end of the baseline, glyphs in visual order left to right (Arabic words therefore read from the last glyph to the first):
//   glyphs: [{ d, x, y, advance, cluster }]  d = outline at the glyph's own origin (draw it translated to x, y); cluster = index of its first character in `text`
//   words:  [{ text, from, to, x0, x1, ids }]  words in reading order; from/to = first glyph index and one past the last; ids = every glyph index of the word in reading order
//   width, ascent, descent (positive pixels); reading = glyph indexes in reading order (right to left for Arabic).
// Loading is awaitable and cached: call it in a scene's init() (or prepare) and every later call with the same arguments returns at once.
import { splitRuns, hasArabic } from './bidi.js';
import { scalePath } from './path.js';

// HarfBuzz is loaded on first use. The kit's local server may send .wasm as application/octet-stream, which makes the browser's streaming compile fail
// with a console error (the render then stops on it), so for the moment of the import streaming is replaced by reading the file as bytes.
let hb = null, hbLoading = null;
function loadHarfbuzz() {
  hbLoading ??= (async () => {
    const stream = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async (response, imports) => WebAssembly.instantiate(await (await response).arrayBuffer(), imports);
    try { hb = await import('../../vendor/harfbuzzjs/index.mjs'); } finally { WebAssembly.instantiateStreaming = stream; }
  })();
  return hbLoading;
}

const faces = new Map();   // fontUrl -> Promise of { face, upem }
const fonts = new Map();   // fontUrl|wght -> { font, upem, ascender, descender, paths: Map(gid -> path in font units) }
const shaped = new Map();  // all arguments -> Promise of the result

function loadFace(fontUrl) {
  if (!faces.has(fontUrl)) {
    faces.set(fontUrl, (async () => {
      await loadHarfbuzz();
      const res = await fetch(encodeURI(fontUrl)).catch(() => null);
      if (!res || !res.ok) throw new Error(`font file not found: ${fontUrl}. Check the path of the font in brand.json or in the scene's spec.`);
      const face = new hb.Face(new hb.Blob(await res.arrayBuffer()), 0);
      if (!face.upem) throw new Error(`${fontUrl} is not a usable font file (TrueType or OpenType expected).`);
      return face;
    })());
    faces.get(fontUrl).catch(() => faces.delete(fontUrl));      // a failed load may be retried
  }
  return faces.get(fontUrl);
}

async function loadFont(fontUrl, wght) {
  const key = `${fontUrl}|${wght ?? ''}`;
  if (!fonts.has(key)) {
    const face = await loadFace(fontUrl), font = new hb.Font(face);
    if (wght !== undefined && face.getAxisInfos?.().wght) font.setVariations([new hb.Variation('wght', Number(wght))]);   // outlines and advances both follow the weight
    const ext = font.hExtents();
    fonts.set(key, { font, upem: face.upem, ascender: ext.ascender, descender: ext.descender, paths: new Map() });
  }
  return fonts.get(key);
}

const unitPath = (f, gid) => { let d = f.paths.get(gid); if (d === undefined) { d = f.font.glyphToPath(gid); f.paths.set(gid, d); } return d; };

// Shapes one run (one direction, one script) and returns glyphs in visual order with positions in font units.
function shapeRun(f, text, run) {
  const sub = text.slice(run.start, run.end), buf = new hb.Buffer();
  buf.addText(sub);
  buf.guessSegmentProperties();
  buf.setDirection(run.rtl ? hb.Direction.RTL : hb.Direction.LTR);
  if (hasArabic(sub)) { buf.setScript('Arab'); buf.setLanguage('ar'); }          // default features: joins (init, medi, fina), ligatures (rlig, liga, lam-alef), marks (mark, mkmk), kerning
  hb.shape(f.font, buf);
  return buf.getGlyphInfosAndPositions();
}

export async function shapeText({ fontUrl, text, size, dir = 'rtl', wght } = {}) {
  if (!fontUrl) throw new Error('shapeText needs fontUrl, the path of a font file.');
  if (typeof text !== 'string') throw new Error('shapeText needs text, a string.');
  if (!(size > 0)) throw new Error('shapeText needs size, the font size in pixels.');
  if (dir !== 'rtl' && dir !== 'ltr') throw new Error(`dir must be "rtl" or "ltr", not "${dir}".`);
  const key = JSON.stringify([fontUrl, text, size, dir, wght ?? null]);
  if (!shaped.has(key)) {
    const p = build(fontUrl, text, size, dir, wght);
    shaped.set(key, p);
    p.catch(() => shaped.delete(key));                           // a failed shaping may be retried
  }
  return shaped.get(key);
}

async function build(fontUrl, text, size, dir, wght) {
  const f = await loadFont(fontUrl, wght), k = size / f.upem;
  const clean = text.replace(/[\r\n\t]+/g, ' ');                 // one line only: line breaks become spaces (same length, so clusters stay true)
  const runs = splitRuns(clean, dir), glyphs = [], infoRuns = [];
  let pen = 0;
  for (const run of runs) {
    const first = glyphs.length;
    for (const g of shapeRun(f, clean, run)) {
      glyphs.push({ d: scalePath(unitPath(f, g.codepoint), k), x: Math.round((pen + g.xOffset * k) * 100) / 100, y: Math.round(-g.yOffset * k * 100) / 100, advance: g.xAdvance * k, cluster: run.start + g.cluster, gid: g.codepoint });
      pen += g.xAdvance * k;
    }
    infoRuns.push({ ...run, first, last: glyphs.length });
  }
  // Reading order: runs by logical position; inside a right-to-left run the visual order is backwards.
  const reading = [];
  for (const r of [...infoRuns].sort((a, b) => a.start - b.start)) {
    const ids = []; for (let i = r.first; i < r.last; i++) ids.push(i);
    reading.push(...(r.rtl ? ids.reverse() : ids));
  }
  const words = [];
  for (const m of clean.matchAll(/\S+/g)) {
    const a = m.index, b = a + m[0].length, ids = reading.filter((i) => glyphs[i].cluster >= a && glyphs[i].cluster < b);
    if (!ids.length) continue;
    words.push({ text: m[0], from: Math.min(...ids), to: Math.max(...ids) + 1, x0: Math.min(...ids.map((i) => glyphs[i].x)), x1: Math.max(...ids.map((i) => glyphs[i].x + glyphs[i].advance)), ids });
  }
  return { glyphs, words, reading, width: pen, ascent: f.ascender * k, descent: -f.descender * k, size, dir, text, fontUrl, wght, runs: infoRuns.map(({ start, end, level }) => ({ start, end, level })) };
}
