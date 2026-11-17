// base.js · the four small helpers every scene shares. Written for Tiraz, no third-party code.
// font(): a canvas font string.   rng(): a seeded 0..1 generator (mulberry32, a public-domain algorithm), so a frame never depends on Math.random.
// rr(): starts a rounded-rectangle path.   loadFont(): loads one font file and fails loudly if it is missing.
export const font = (weight, size, family) => `${weight} ${size}px "${family}"`;

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

export async function loadFont(family, url, weight) {
  const face = new FontFace(family, `url("${encodeURI(url)}")`, weight ? { weight } : {});
  try { await face.load(); } catch (e) { throw new Error(`font "${family}" did not load from ${url}`); }
  document.fonts.add(face);
}
