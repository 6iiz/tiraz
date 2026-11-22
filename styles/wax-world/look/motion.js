// Wax world motion and materials. The world is made of solids (extruded words, slabs, cubes, balls) lit from the upper corner on the
// far side of the reading direction, and every solid is drawn in wax crayon: its lit face in firm wax with a few light streaks, its
// shadow faces hatched densely, all of it caught by the paper's tooth. The hatching is baked into each solid once, so it rides with
// the solid as it moves ("hatching sticks to things"). The whole world is redrawn twelve times a second: every move is stepped like
// hand animation, the camera sways slowly and near things slide past far things.
import { clamp, rng, mix, contrast, ease } from '/engine/kit.js';

export const FPS = 12;
export const step = (t) => Math.floor(t * FPS + 1e-6) / FPS;          // the world's time: twelve drawings a second
export const E = ease.outCubic;
export const IO = ease.inOutCubic;
export const DIR = [-0.72, 0.69];                                     // where the depth of a solid goes (away from the light)

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, night = light === bg ? text : bg;
  const keyFace = contrast(accent, night) >= 4.5 ? accent : mix(accent, light, 0.5);
  let k = 0.3, dim = mix(light, night, k); while (contrast(dim, night) < 4.5 && k > 0) { k -= 0.05; dim = mix(light, night, Math.max(0, k)); }
  return {
    light, night, accent, keyFace, dim,
    side: mix(light, night, 0.58), sideDeep: mix(light, night, 0.78),
    keySide: mix(keyFace, night, 0.5), keyDeep: mix(keyFace, night, 0.72),
    dimSide: mix(dim, night, 0.55),
    sky: night, glow: mix(night, accent, 0.42), haze: mix(night, light, 0.12),
    floor: mix(night, light, 0.13), floorLine: mix(night, light, 0.34), shadow: mix(night, light, 0.05),
  };
}

// ---------- the paper's tooth (one field, three pressures) ----------
let TOOTH = null;
export function masks(W, H) {
  if (TOOTH && TOOTH.W === W) return TOOTH;
  const w = W >> 1, h = H >> 1, r = rng(9061), n = new Float32Array(w * h);
  const G = 18, gw = Math.ceil(w / G) + 2, low = new Float32Array(gw * (Math.ceil(h / G) + 2));
  for (let i = 0; i < low.length; i++) low[i] = r();
  for (let y = 0; y < h; y++) {
    const fy = y / G, y0 = fy | 0, ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const fx = x / G, x0 = fx | 0, tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
      const a = low[y0 * gw + x0], b = low[y0 * gw + x0 + 1], c = low[(y0 + 1) * gw + x0], d = low[(y0 + 1) * gw + x0 + 1];
      n[y * w + x] = 0.66 * r() + 0.34 * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
    }
  }
  const cut = (level) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data, th = 1 - level;
    for (let i = 0; i < n.length; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = clamp((n[i] - th) / 0.1) * 255; }
    g.putImageData(img, 0, 0); return cv;
  };
  TOOTH = { W, H, light: cut(0.42), mid: cut(0.68), heavy: cut(0.9) };
  return TOOTH;
}
// Lays a tooth mask over a whole canvas (destination-in), taking the grain from frame position (fx, fy).
export function grain(cv, mask, fx = 0, fy = 0) {
  const g = cv.getContext('2d'), mw = mask.width * 2, mh = mask.height * 2;
  const tile = document.createElement('canvas'); tile.width = cv.width; tile.height = cv.height;
  const tg = tile.getContext('2d'), ox = -(((Math.round(fx) % mw) + mw) % mw), oy = -(((Math.round(fy) % mh) + mh) % mh);
  for (let y = oy; y < cv.height; y += mh) for (let x = ox; x < cv.width; x += mw) tg.drawImage(mask, x, y, mw, mh);
  g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(tile, 0, 0); g.restore();
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// Crayon hatching laid over what is already on a canvas (source-atop): parallel strokes at an angle, gap px apart, with a hand wobble.
export function hatch(c, w, h, color, angle, gap, width, seed, alpha = 1) {
  const r = rng(seed), R = Math.hypot(w, h), ca = Math.cos(angle), sa = Math.sin(angle);
  c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = color; c.lineCap = 'round'; c.globalAlpha = alpha;
  for (let v = -R; v < R; v += gap * (0.8 + r() * 0.4)) {
    c.lineWidth = width * (0.7 + r() * 0.6); c.beginPath();
    const x0 = w / 2 - R * ca - v * sa, y0 = h / 2 - R * sa + v * ca, x1 = w / 2 + R * ca - v * sa, y1 = h / 2 + R * sa + v * ca;
    c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * 8, (y0 + y1) / 2 + (r() - 0.5) * 8, x1, y1); c.stroke();
  }
  c.restore();
}

// A solid made from a flat silhouette: draw(c, colour) paints the silhouette with its top-left at (0, 0) inside a w x h box.
// The silhouette is stacked D px back along DIR in the side colour (hatched densely), then its face goes on top in firm wax with a few
// light streaks. Returns { cv, ox, oy }: the sprite and where the silhouette's (0, 0) sits inside it.
export function solid(W, H, { w, h, D, face, side, deep, streak, draw, decorate, seed = 1, fx = 0, fy = 0 }) {
  const M = masks(W, H), pad = 10, ox = pad + Math.ceil(D * -DIR[0]), oy = pad;
  const cw = w + ox + pad, ch = h + D * DIR[1] + pad * 2;
  const sd = canvas(cw, ch), sg = sd.getContext('2d');
  for (let i = D; i >= 1; i -= 1) { sg.save(); sg.translate(ox + DIR[0] * i, oy + DIR[1] * i); draw(sg, i > D * 0.5 ? deep : side); sg.restore(); }
  hatch(sg, cw, ch, deep, -0.95, 6, 2.4, seed);
  grain(sd, M.heavy, fx + seed * 37, fy);
  const fc = canvas(cw, ch), fg = fc.getContext('2d');
  fg.save(); fg.translate(ox, oy); draw(fg, face); fg.restore();
  if (streak) hatch(fg, cw, ch, streak, 0.62, 11, 2, seed + 5, 0.55);
  if (decorate) { fg.save(); fg.translate(ox, oy); decorate(fg); fg.restore(); }
  grain(fc, M.heavy, fx + 400, fy + seed * 13);
  sg.drawImage(fc, 0, 0);
  return { cv: sd, ox, oy, w, h };
}

// The shadow a solid casts on the floor below it: a soft crayon smudge (an ellipse hatched in the shadow colour).
export function smudge(W, H, w, color, seed = 1) {
  const M = masks(W, H), h = Math.max(18, w * 0.09), cv = canvas(w + 40, h * 2 + 20), g = cv.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.ellipse(cv.width / 2, cv.height / 2, w / 2, h, 0, 0, Math.PI * 2); g.fill();
  hatch(g, cv.width, cv.height, mix(color, '#000000', 0.2), 0.15, 5, 2, seed);
  grain(cv, M.mid, seed * 50, 0);
  return cv;
}

// A ball lit from the upper far corner: a disc in wax, its dark side hatched across, a spot where the light hits left bare.
export function ball(W, H, r, lit, dark, seed = 1, rtl = true) {
  const M = masks(W, H), s = r * 2 + 20, cv = canvas(s, s), g = cv.getContext('2d'), c = s / 2, lx = rtl ? -1 : 1;
  g.fillStyle = lit; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = dark;
  g.beginPath(); g.arc(c - lx * r * 0.35, c + r * 0.35, r * 1.02, 0, Math.PI * 2); g.arc(c + lx * r * 0.25, c - r * 0.25, r * 0.92, 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
  hatch(g, s, s, dark, 0.8, 7, 2.5, seed, 0.8);
  grain(cv, M.heavy, seed * 91, 0);
  return cv;
}

// A fitted text as a row of solid words. Each word is its own sprite, so it can drop in by itself.
// Returns [{ sprite, x, y, box, row }] where (x, y) is the frame position of the sprite's top-left once landed, and rows for measuring.
export function solidText(kit, W, H, f, { x0, x1, y, align = 'center', D, colours, seed = 1 }) {
  const probe = canvas(4, 4).getContext('2d'), words = [];
  kit.drawText(probe, f, { x0, x1, y, align, each: (w, i, box) => { words.push({ w, i, box }); return false; } });
  return words.map(({ w, i, box }) => {
    const c = w.key ? colours.key : colours.plain, wb = box.width + 8, hb = f.size * 1.7, bx = box.x - 4, by = box.y - hb / 2;
    const sp = solid(W, H, { w: wb, h: hb, D, face: c.face, side: c.side, deep: c.deep, streak: c.streak, seed: seed + i * 7, fx: bx, fy: by,
      draw: (g, colour) => { g.translate(-bx, -by); kit.drawText(g, f, { x0, x1, y, align, color: colour, key: colour, each: (_, j) => (j === i ? undefined : false) }); } });
    return { sprite: sp, x: bx - sp.ox, y: by - sp.oy, box, row: box.row, key: w.key, text: w.w };
  });
}
// Rows of a fitted text, in frame pixels, for kit.rec.
export function rowsOf(words, size) {
  const rows = new Map();
  for (const q of words) { const r = rows.get(q.row) ?? { x0: 1e9, x1: -1e9, y: q.box.y, text: [] }; r.x0 = Math.min(r.x0, q.box.x); r.x1 = Math.max(r.x1, q.box.x + q.box.width); r.text.push(q.text); rows.set(q.row, r); }
  return [...rows.entries()].map(([row, r]) => ({ ...r, row, y0: r.y - size * 0.7, y1: r.y + size * 0.7, text: r.text.join(' ') }));
}

// A drop: the thing falls from `h` px above (gravity, stepped), lands, squashes a little and settles. Returns { dy, sx, sy } or null.
export function drop(p, h = 150) {
  if (p <= 0) return null;
  const fall = clamp(p / 0.7), land = clamp((p - 0.7) / 0.3);
  const dy = -h * (1 - fall * fall), sq = land > 0 ? Math.sin(land * Math.PI) * 0.07 : 0;
  return { dy, sx: 1 + sq, sy: 1 - sq, a: clamp(p * 2.2) };
}
// Draws a sprite with a drop applied, squashing about its base.
export function place(ctx, s, x, y, d, base) {
  if (!d) return;
  ctx.save(); ctx.globalAlpha *= d.a; const bx = x + s.cv.width / 2, by = base ?? (y + s.cv.height);
  ctx.translate(bx, by + d.dy); ctx.scale(d.sx, d.sy); ctx.translate(-bx, -by);
  ctx.drawImage(s.cv, x, y); ctx.restore();
}

// Colour sets for solids: plain (the lighter brand colour), key (the accent), dim (a quieter tone for leads and old values).
export function sets(P) {
  return {
    plain: { face: P.light, side: P.side, deep: P.sideDeep, streak: mix(P.light, P.night, 0.14) },
    key: { face: P.keyFace, side: P.keySide, deep: P.keyDeep, streak: mix(P.keyFace, P.light, 0.3) },
    dim: { face: P.dim, side: P.dimSide, deep: mix(P.dimSide, P.night, 0.45), streak: null },
  };
}
// Draws solid words that drop in one by one. when(k) gives the moment word k starts to fall; ts is the stepped scene time.
// Each landed row casts a smudge on the floor far below it. Rows are reported for measuring once their first word is in.
export function words(ctx, kit, list, rows, ts, when, { dx = 0, h = 150, dur = 0.42, shadows = null, shadowY = 0 } = {}) {
  let landed = 0;
  list.forEach((q, k) => {
    const p = clamp((ts - when(k)) / dur); if (p <= 0) return; if (p >= 1) landed++;
    place(ctx, q.sprite, q.x + dx, q.y, drop(p, h), q.y + q.sprite.oy + q.sprite.h);
  });
  if (shadows) shadows.forEach((s, i) => { const k = landed / list.length; if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; ctx.drawImage(s.cv, s.x + dx * 1.6 - s.cv.width / 2, shadowY + i * 26 - s.cv.height / 2); ctx.restore(); });
  rows.forEach((r) => { if (list.some((q) => q.row === r.row && ts >= when(list.indexOf(q)) + dur * 0.7)) kit.rec(r.x0 + dx, r.x1 + dx, r.y0, r.y1, r.text); });
}
