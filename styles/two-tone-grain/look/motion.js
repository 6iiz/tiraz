// Two-tone motion: the screen has no grey and no smooth time. Everything steps at 15 frames a second, and everything appears or
// goes through an ordered dither: a fixed 8x8 threshold pattern (4 px per dot) lets the new thing in, level by level, never with
// opacity. Words are set one at a time behind a solid block cursor. This file also holds the two inks and the window plates that
// every part shares.
import { clamp, contrast } from '/engine/kit.js';

export const FPS = 15, DOT = 4;
export const step = (t) => Math.floor(t * FPS + 1e-6) / FPS;            // time on the 15 fps grid
export const snap = (v) => Math.round(v / DOT) * DOT;                      // positions on the dot grid

// 8x8 ordered-dither thresholds, 0..63
export const BAYER = (() => { let m = [[0]]; for (let n = 1; n < 8; n *= 2) {
  const o = []; for (let y = 0; y < n * 2; y++) { o.push([]); for (let x = 0; x < n * 2; x++) { const q = (y < n ? 0 : 2) + (x < n ? 0 : 1); o[y].push(4 * m[y % n][x % n] + [0, 2, 3, 1][q]); } } m = o; }
  return m.flat(); })();

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const darker = contrast(bg, '#ffffff') >= contrast(text, '#ffffff');
  const ink = darker ? bg : text, paper = darker ? text : bg;
  const onAccent = contrast(accent, ink) >= contrast(accent, paper) ? ink : paper;
  return { ink, paper, accent, onAccent };
}

// Dither masks: pattern k lets through the dots whose threshold is under k (0..64). Built once per page.
let masks = null, scratch = null;
function mask(ctx, k) {
  if (!masks) masks = [];
  if (!masks[k]) { const c = document.createElement('canvas'); c.width = c.height = 8 * DOT; const g = c.getContext('2d'); g.fillStyle = '#000';
    BAYER.forEach((v, i) => { if (v < k) g.fillRect((i % 8) * DOT, Math.floor(i / 8) * DOT, DOT, DOT); }); masks[k] = c; }
  return ctx.createPattern(masks[k], 'repeat');
}
// The same dither as dots of one colour: a fill pattern of colour c at level k.
const tinted = {};
export function dots(ctx, c, k) {
  const id = c + k;
  if (!tinted[id]) { const cv = document.createElement('canvas'); cv.width = cv.height = 8 * DOT; const g = cv.getContext('2d'); g.fillStyle = c;
    BAYER.forEach((v, i) => { if (v < k) g.fillRect((i % 8) * DOT, Math.floor(i / 8) * DOT, DOT, DOT); }); tinted[id] = cv; }
  return ctx.createPattern(tinted[id], 'repeat');
}
export const level = (p) => Math.round(clamp(p) * 16) * 4;              // 17 visible levels

// Draws what draw(c) paints through a dither of level p (0 nothing, 1 all) inside rect [x, y, w, h] of the frame.
export function dissolve(ctx, p, rect, draw) {
  const k = level(p); if (k <= 0) return; if (k >= 64) { draw(ctx); return; }
  const cv = ctx.canvas;
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== cv.width || scratch.height !== cv.height) { scratch.width = cv.width; scratch.height = cv.height; }
  const s = scratch.getContext('2d', { willReadFrequently: true });
  const [x, y, w, h] = rect.map(Math.round);
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(x - 2, y - 2, w + 4, h + 4);
  s.save(); draw(s); s.restore();
  s.globalCompositeOperation = 'destination-in'; s.fillStyle = mask(s, k); s.fillRect(x - 2, y - 2, w + 4, h + 4);
  s.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, x - 2, y - 2, w + 4, h + 4, x - 2, y - 2, w + 4, h + 4);
}
// A dot screen of colour c laid over an area: at k = 32 the half-screened "disabled" look of a 1-bit interface.
export function screen(ctx, x, y, w, h, c, k = 32) { ctx.fillStyle = dots(ctx, c, k); ctx.fillRect(snap(x), snap(y), snap(w), snap(h)); }

// A window plate: ink fill, a paper frame of one dot, a hard 1-bit shadow of half-screened dots, and a striped title bar with a
// close box. Returns the body's top edge. title(cx, cy) draws into the bar's middle gap when given.
export function plate(ctx, P, x, y, w, h, { bar = 64, gapW = 0, title } = {}) {
  x = snap(x); y = snap(y); w = snap(w); h = snap(h);
  const sh = DOT * 3; ctx.fillStyle = dots(ctx, P.paper, 16);                // a hard shadow of paper dots, one quarter screen
  ctx.fillRect(x + sh, y + h, w, sh); ctx.fillRect(x + w, y + sh, sh, h - sh);
  ctx.fillStyle = P.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = P.ink; ctx.fillRect(x + DOT, y + DOT, w - 2 * DOT, h - 2 * DOT);
  if (bar) {
    ctx.fillStyle = P.paper; ctx.fillRect(x + DOT, y + bar, w - 2 * DOT, DOT);
    for (let yy = y + 3 * DOT; yy < y + bar - 2 * DOT; yy += 2 * DOT) ctx.fillRect(x + 3 * DOT, yy, w - 6 * DOT, DOT);
    const cb = snap(bar * 0.5), cbx = x + 6 * DOT, cby = y + snap((bar - cb) / 2);
    ctx.fillStyle = P.ink; ctx.fillRect(cbx - DOT, cby - DOT, cb + 2 * DOT, cb + 2 * DOT);
    ctx.fillStyle = P.paper; ctx.fillRect(cbx, cby, cb, cb); ctx.fillStyle = P.ink; ctx.fillRect(cbx + DOT, cby + DOT, cb - 2 * DOT, cb - 2 * DOT);
    if (gapW) { const gw = snap(gapW + 8 * DOT); ctx.fillStyle = P.ink; ctx.fillRect(x + snap((w - gw) / 2), y + DOT, gw, bar - DOT); if (title) title(x + w / 2, y + bar / 2 + DOT / 2); }
  }
  return y + bar + DOT;
}
// Word by word behind a block cursor: before its moment a word is not there; for one step a solid paper block stands where it will
// be; then the word is set. Use inside kit.drawText's each(). t0: when the first word lands; gap: seconds between words.
export function typed(t, t0, gap, P, size, key, onKey) {
  return (w, i, box, c) => {
    const at = t0 + i * gap;
    if (t < at) return false;
    if (t < at + 1 / FPS) { c.fillStyle = P.paper; c.fillRect(snap(box.x - 4), snap(box.y - size * 0.55), snap(box.width + 8), snap(size * 1.1)); return false; }
    if (w.key) { c.fillStyle = P.accent; c.fillRect(snap(box.x - size * 0.18), snap(box.y - size * 0.62), snap(box.width + size * 0.36), snap(size * 1.24)); return onKey ?? P.onAccent; }
  };
}
