// Neon motion: nothing moves, it lights. A tube is mounted on the wall unlit (dull glass), then ignites: it stutters a few times,
// catches, and holds steady. It goes out the same way in reverse, or dies (a stutter, then a dull glow with no bloom). Every stutter is
// drawn from rng(seed), so a frame is a pure function of time. The bloom is drawn once per word or shape, in create(), from blurred
// copies; a frame only lays those pictures down at the tube's brightness, and draws the sharp core on top so Arabic stays crisp.
import { clamp, mix, rng, contrast, font } from '/engine/kit.js';

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The wall is the brand's darker colour. Two tube colours: the lighter brand colour, and the accent with a hot core (the accent pushed
// toward the light colour). When even that core does not read at 4.5:1 on the wall, the core is the light colour and only the bloom is accent.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const hot = mix(accent, light, T.tone.hot);
  return {
    dark, light, accent, unlit: mix(dark, light, T.tone.unlit), dead: mix(light, dark, T.tone.dead),
    white: { core: light, glow: light }, hot: { core: contrast(hot, dark) >= 4.5 ? hot : light, glow: accent },
  };
}

// Brightness of a tube igniting, p 0..1: a few stutters in the first 70%, then it catches. seed makes each tube stutter its own way.
export function flick(p, seed) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const r = rng(seed * 7919 + 17), n = 2 + Math.floor(r() * 3), cuts = [];
  for (let i = 0; i < n * 2; i++) cuts.push(0.05 + r() * 0.65);
  cuts.sort((a, b) => a - b);
  if (p > cuts.at(-1)) return 0.75 + 0.25 * clamp((p - cuts.at(-1)) / (1 - cuts.at(-1)) * 1.6);
  let on = false; for (const c of cuts) { if (p < c) break; on = !on; }
  return on ? 0.55 + r() * 0.35 : 0.04;
}
// A tube going out (p 0..1): a short stutter, then off.
export const douse = (p, seed) => (p <= 0 ? 1 : p >= 1 ? 0 : flick(1 - p, seed + 101) * (1 - p * 0.5));
// A tube dying: it stutters out to `rest` and stays there.
export const die = (p, seed, rest = 0) => (p <= 0 ? 1 : p >= 1 ? rest : rest + (1 - rest) * flick(1 - p, seed + 211) * (1 - p));

// The motion contract for any box: it lights with a stutter and goes out with one.
const seedOf = (box) => Math.round(box.x * 13 + box.y * 7);
export function arrive(ctx, p, box) {
  if (p <= 0) return false;
  ctx.globalAlpha *= flick(p, seedOf(box));
}
export function leave(ctx, p, box) {
  if (p >= 1) return false;
  ctx.globalAlpha *= douse(p, seedOf(box));
}

// A bloom: paint(c) draws a shape in `colour` on a canvas w x h; the result holds two blurred copies of it (a tight one and a wide one).
export function bloom(w, h, paint, colour, near, far, T) {
  const src = document.createElement('canvas'); src.width = w; src.height = h;
  const s = src.getContext('2d'); s.fillStyle = colour; s.strokeStyle = colour; paint(s);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const o = out.getContext('2d');
  o.filter = `blur(${far}px)`; o.globalAlpha = T.glow.farA; o.drawImage(src, 0, 0);
  o.filter = `blur(${near}px)`; o.globalAlpha = T.glow.nearA; o.drawImage(src, 0, 0);
  o.filter = 'none';
  return out;
}

// A fitted text made into tubes: one bloom per word, built here, once. draw(ctx, level) lays each word's bloom at its brightness
// level(i) (0..1), then draws the sharp words through kit.drawText, from dull glass (0) to the lit core (1). Key words (*…*) are hot tubes.
// o: the drawText placement { x0, x1, y, align }. tubes: { base, key } from palette (white / hot). glass: false hides an unlit word.
export function sign(kit, f, o, tubes, pal, T, glass = true) {
  const words = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, each: (w, i, b) => { words.push({ ...b, w: w.w, key: w.key, arabic: w.arabic }); return false; } });
  const P = Math.ceil(f.size * (T.glow.far * 2.6)), near = f.size * T.glow.near, far = f.size * T.glow.far, hh = Math.ceil(f.size * 1.6) + 2 * P;
  for (const wd of words) {
    const tube = wd.key ? tubes.key : tubes.base, ww = Math.ceil(wd.width) + 2 * P;
    wd.glow = bloom(ww, hh, (g) => {
      g.font = font(f.weight, f.size, f.family); g.textBaseline = 'middle';
      g.direction = wd.arabic ? 'rtl' : 'ltr'; g.textAlign = wd.arabic ? 'right' : 'left';
      g.fillText(wd.w, wd.arabic ? P + wd.width : P, hh / 2);
    }, tube.glow, near, far, T);
    wd.P = P; wd.hh = hh;
  }
  return {
    words,
    draw(ctx, level, colourOf) {
      for (const [i, wd] of words.entries()) {
        const b = level(i); if (b <= 0.02) continue;
        ctx.save(); ctx.globalAlpha = b; ctx.drawImage(wd.glow, wd.x - wd.P, wd.y - wd.hh / 2); ctx.restore();
      }
      kit.drawText(ctx, f, { ...o, each: (w, i) => {
        const b = level(i);
        if (b <= 0 && !glass) return false;
        const lit = colourOf ? colourOf(w, i, b) : null;
        return lit ?? mix(pal.unlit, (w.key ? tubes.key : tubes.base).core, clamp(b));
      } });
    },
  };
}

// A shape made into a tube, inside the frame box (x, y, w, h): path(c) strokes (or fills) it in frame coordinates with the colour it is
// given. Returns { draw(ctx, b) } with the bloom built once, only as large as the box.
export function shape(x, y, w, h, path, tube, pal, T, width = 5) {
  const near = 6, far = 22, pad = far * 3, X = Math.floor(x - pad), Y = Math.floor(y - pad);
  const glow = bloom(Math.ceil(w + 2 * pad), Math.ceil(h + 2 * pad), (g) => { g.translate(-X, -Y); g.lineWidth = width * 1.4; g.lineCap = 'round'; g.lineJoin = 'round'; path(g); }, tube.glow, near, far, T);
  return {
    draw(ctx, b) {
      if (b > 0.02) { ctx.save(); ctx.globalAlpha = b; ctx.drawImage(glow, X, Y); ctx.restore(); }
      ctx.save(); ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const col = mixLit(pal, tube.core, b); ctx.strokeStyle = col; ctx.fillStyle = col; path(ctx); ctx.restore();
    },
  };
}
// A tube's colour at brightness b: dull glass at 0, its core at 1.
export const mixLit = (pal, core, b) => mix(pal.unlit, core, clamp(b));
