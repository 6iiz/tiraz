// kit.js · what a scene author needs and nothing more: measuring, fitting and placing text, counting numbers, time helpers, loading.
// It has no look: no panel, shadow, glow or motion of its own. How something enters, leaves or is coloured is the brand's to decide in its look/ folder.
// Every function is a pure function of its inputs; a frame never depends on the previous one (ARCHITECTURE.md, rule 2).
import { font, rng, rr, loadFont } from './lib/base.js';
import { rgba, mix, contrast } from './brand.js';
import { SAFE, LINE_GAP } from './safe.js';
export { font, rng, rr, loadFont, rgba, mix, contrast, SAFE, LINE_GAP };

// ---------- pure helpers ----------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const smooth = (p) => { const q = clamp(p); return q * q * (3 - 2 * q); };
// Progress between two moments, 0 before t0 and 1 after t1. A zero-length span is a step at t0.
export const span = (t, t0, t1) => (t1 <= t0 ? (t >= t0 ? 1 : 0) : clamp((t - t0) / (t1 - t0)));

// Each easing clamps its input, so a caller can pass raw (t - delay) / length without guarding.
export const ease = {
  linear: (p) => clamp(p),
  inQuad: (p) => clamp(p) ** 2,
  outQuad: (p) => 1 - (1 - clamp(p)) ** 2,
  inOutQuad: (p) => { p = clamp(p); return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; },
  outCubic: (p) => 1 - (1 - clamp(p)) ** 3,
  inOutCubic: (p) => { p = clamp(p); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; },
  outQuart: (p) => 1 - (1 - clamp(p)) ** 4,
  outExpo: (p) => { p = clamp(p); return p >= 1 ? 1 : 1 - 2 ** (-10 * p); },
  outBack: (p) => { p = clamp(p); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; },
  // A damped swing around 1 (about 3 swings). The (1 - p) factor makes the swing die out exactly at p = 1, so it ends on 1 with no jump.
  spring: (p) => { p = clamp(p); return p >= 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(9 * p) * (1 - p); },
};

// Checks that a spec has what a scene needs, and says which file is wrong.
export function need(spec, keys, where = 'the spec') {
  if (!spec) throw new Error('this scene needs a spec: pass &spec=/path/spec.json, or give it as "spec" or "specUrl" in a sequence.');
  const missing = keys.filter((k) => spec[k] === undefined);
  if (missing.length) throw new Error(`${where} is missing: ${missing.map((k) => `"${k}"`).join(', ')}`);
  return spec;
}

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
export const hasArabic = (s) => ARABIC.test(s);

// "اختر *المنتج*" -> [{ w, key }]: the words between stars are key words. Punctuation written right after a starred word ("*تتوقع*؟")
// stays glued to it instead of becoming a word of its own.
export function marks(text, where = 'the text') {
  if (typeof text !== 'string' || !text.trim()) throw new Error(`${where} needs some text.`);
  if ((text.match(/\*/g) || []).length % 2) throw new Error(`${where}: the stars around a key word do not pair up in "${text}". Put a star before and after each key word.`);
  let key = false; const words = [];
  for (const part of text.split('*')) {
    part.split(/\s+/).filter(Boolean).forEach((w, i) => {
      if (i === 0 && words.length && !/^\s/.test(part) && /^[\p{P}]+$/u.test(w)) words.at(-1).w += w;
      else words.push({ w, key });
    });
    key = !key;
  }
  return words;
}

// One place formats every number, so a brand that wants Arabic-Indic digits (digits: "arabic" in brand.json) changes them all.
export function formatNumber(v, decimals = 0, digits = 'latin') {
  const s = Math.abs(v).toFixed(decimals);
  let [i, f] = s.split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let out = (v < 0 && Number(s) !== 0 ? '-' : '') + (f ? `${i}.${f}` : i);
  if (digits === 'arabic') out = out.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]).replace(/,/g, '٬').replace(/\./g, '٫');
  return out;
}
// Returns exactly `to` once p reaches 1, so a count never lands on 40,999. The easing is the caller's choice.
export const countValue = (from, to, p, easing = ease.outCubic) => (p >= 1 ? to : from + (to - from) * easing(p));

const DIGITS = { latin: '0123456789', arabic: '٠١٢٣٤٥٦٧٨٩' };
const isDigit = (ch) => /[0-9٠-٩]/.test(ch);

// ---------- what a frame drew, for measuring ----------
// One record for the whole page. Every kit on the page (one per scene) writes into it; the page (main.js) opens it before a frame is drawn
// and closes it after, so a scene does nothing. Closed, it publishes { boxes, strings } in globalThis.__scene. Nothing changes on screen.
const record = { on: false, boxes: [], strings: {} };
export function recordBegin(on) { record.on = !!on; record.boxes = []; record.strings = {}; }
export function recordEnd() { if (record.on) globalThis.__scene = { boxes: record.boxes, strings: record.strings }; }
// A box in the frame's own pixels: its corners go through the canvas transform that was in force when the text was drawn.
function recordBox(ctx, x0, x1, y0, y1, text, extra) {
  if (!record.on) return;
  let xs = [x0, x1, x0, x1], ys = [y0, y0, y1, y1];
  if (ctx && ctx.getTransform) {
    const m = ctx.getTransform(), px = xs.map((x, i) => m.a * x + m.c * ys[i] + m.e), py = xs.map((x, i) => m.b * x + m.d * ys[i] + m.f);
    xs = px; ys = py;
  }
  const r = (v) => Math.round(v * 10) / 10;
  record.boxes.push({ x0: r(Math.min(...xs)), x1: r(Math.max(...xs)), y0: r(Math.min(...ys)), y1: r(Math.max(...ys)), text, ...extra });
}

// ---------- a fading word stays whole ----------
// Joined Arabic letters overlap a little at every join. Drawn half-transparent straight onto the frame, each letter is blended by itself and
// every join shows as a darker seam. So a word that is not fully opaque is drawn solid on a spare canvas first, and that picture is laid on
// the frame with the word's opacity: the word fades as one shape. (x0..x1, y, size) say roughly where the word is, to keep the work small.
let spare = null;
function drawWhole(ctx, x0, x1, y, size, paint) {
  const alpha = ctx.globalAlpha;
  if (alpha >= 0.999) { paint(ctx); return; }
  if (alpha <= 0) return;
  const cv = ctx.canvas, m = ctx.getTransform();
  if (!spare) spare = document.createElement('canvas');
  if (spare.width !== cv.width || spare.height !== cv.height) { spare.width = cv.width; spare.height = cv.height; }
  // willReadFrequently keeps this canvas on the processor. Left to itself the browser moves a canvas between the graphics card and the
  // processor as it sees fit, and the two round soft edges differently: the same moment then differs by a level or two from one run to the next.
  const s = spare.getContext('2d', { willReadFrequently: true });
  // the part of the frame the word can touch, in frame pixels, with room for marks, descenders and a shadow
  const pad = size * 0.9 + (ctx.shadowBlur || 0) * 2 + Math.abs(ctx.shadowOffsetX || 0) + Math.abs(ctx.shadowOffsetY || 0) + 4;
  const xs = [x0 - pad, x1 + pad, x0 - pad, x1 + pad], ys = [y - pad, y - pad, y + pad, y + pad];
  const px = xs.map((x, i) => m.a * x + m.c * ys[i] + m.e), py = xs.map((x, i) => m.b * x + m.d * ys[i] + m.f);
  const whole = ctx.filter && ctx.filter !== 'none';                // a filter may reach anywhere: use the whole frame
  const bx = whole ? 0 : Math.max(0, Math.floor(Math.min(...px))), by = whole ? 0 : Math.max(0, Math.floor(Math.min(...py)));
  const bw = (whole ? cv.width : Math.min(cv.width, Math.ceil(Math.max(...px)))) - bx, bh = (whole ? cv.height : Math.min(cv.height, Math.ceil(Math.max(...py)))) - by;
  if (bw <= 0 || bh <= 0) return;                                    // the word is off the frame
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1; s.globalCompositeOperation = 'source-over'; s.clearRect(bx, by, bw, bh);
  s.setTransform(m);
  for (const k of ['font', 'fillStyle', 'textBaseline', 'direction', 'textAlign', 'filter', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'letterSpacing', 'wordSpacing', 'fontKerning'])
    if (k in ctx) s[k] = ctx[k];
  paint(s);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  ctx.drawImage(spare, bx, by, bw, bh, bx, by, bw, bh);              // ctx keeps its own opacity, clip and blend mode
  ctx.restore();
}

// ---------- bound to a brand ----------
export function createKit({ W, H, brand, base = '', query }) {
  if (!brand) throw new Error('createKit needs a brand: pass &brand=/brand/brand.json');
  const rtl = brand.dir === 'rtl', digits = brand.digits === 'arabic' ? 'arabic' : 'latin';
  const mctx = document.createElement('canvas').getContext('2d');

  // Width of the widest digit of each kind at this size: a counting number puts every digit in a cell that wide so it does not wobble.
  const cells = (size, weight, family) => {
    mctx.font = font(weight, size, family);
    const o = {}; for (const k of Object.keys(DIGITS)) o[k] = Math.max(...[...DIGITS[k]].map((d) => mctx.measureText(d).width));
    return o;
  };
  // `settle` (0..1) morphs a digit's cell from the shared width to the font's own width, so a landed number looks typeset, not spaced.
  const cellOf = (ch, cell, settle) => {
    const own = () => mctx.measureText(ch).width;       // the font was set by cells()
    if (/[0-9]/.test(ch)) return cell.latin + (own() - cell.latin) * settle;
    if (/[٠-٩]/.test(ch)) return cell.arabic + (own() - cell.arabic) * settle;
    return own();
  };

  const kit = {
    W, H, brand, rtl, digits,
    fmt: (v, decimals = 0) => formatNumber(v, decimals, digits),
    // A block of height h centred on `centre`, pushed back inside the safe area.
    place: (h, centre = 760) => Math.max(SAFE.top, Math.min(centre - h / 2, SAFE.bottom - h)),
    abs: (p) => (p.startsWith('/') ? p : base + p),

    // Text that fits a box. A line that is too wide shrinks in 5% steps down to minScale, then wraps on whole words at that size.
    // A single word wider than the box shrinks further as a last resort: an Arabic word is never split.
    // single: true never wraps (a field, a handle); it keeps shrinking instead.
    // A text that is still too wide at 40% of the size asked for stops with a sentence instead of running off the frame unseen;
    // overflow: true says the overflow is meant (a giant word bleeding off the frame as decoration).
    fit(text, { family = brand.fonts.display.family, weight = 700, size = 60, maxW = 760, minScale = 0.7, minPx = 0, single = false, lead = LINE_GAP, where = 'text', overflow = false } = {}) {
      const tooWide = (what, width, sz) => {
        if (overflow) return;
        throw new Error(`${where} does not fit: ${what} is ${Math.round(width)} px wide at ${sz} px (40% of the ${size} px asked for), and it was given ${Math.round(maxW)} px. `
          + 'Give it more width, a smaller size, a lighter weight or fewer words; or pass overflow: true if it is meant to run off the frame.');
      };
      const floor = Math.min(1, Math.max(minScale, minPx / size));     // body text keeps a readable size on a phone: it wraps sooner instead of shrinking
      const words = marks(text, where);
      const at = (sz) => {
        mctx.font = font(weight, sz, family); const space = mctx.measureText(' ').width;
        const ws = words.map((w) => ({ ...w, width: mctx.measureText(w.w).width, arabic: hasArabic(w.w) }));
        return { sz, space, ws, total: ws.reduce((s, w) => s + w.width, 0) + space * (ws.length - 1) };
      };
      const pack = (m, rows) => ({
        rows: rows.map((ws) => ({ words: ws, width: ws.reduce((s, w) => s + w.width, 0) + m.space * (ws.length - 1) })),
        size: m.sz, weight, family, lead: m.sz * lead, space: m.space,
      });
      const finish = (f) => { f.width = Math.max(...f.rows.map((r) => r.width)); f.height = f.rows.length * f.lead; return f; };
      let m;
      for (const s of [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7]) {
        if (s < floor - 1e-9) break;
        m = at(Math.round(size * s));
        if (m.total <= maxW) return finish(pack(m, [m.ws]));
      }
      if (single) {
        while (m.total > maxW && m.sz > size * 0.4) m = at(m.sz - 2);
        if (m.total > maxW) tooWide(`"${m.ws.map((w) => w.w).join(' ')}" on one row`, m.total, m.sz);
        return finish(pack(m, [m.ws]));
      }
      for (;;) {
        const rows = [[]]; let w = 0;
        for (const word of m.ws) {
          if (rows.at(-1).length && w + m.space + word.width > maxW) { rows.push([]); w = 0; }
          w += (rows.at(-1).length ? m.space : 0) + word.width; rows.at(-1).push(word);
        }
        const widest = m.ws.reduce((a, b) => (b.width > a.width ? b : a));
        if (widest.width <= maxW) return finish(pack(m, rows));
        if (m.sz <= size * 0.4) { tooWide(`the word "${widest.w}"`, widest.width, m.sz); return finish(pack(m, rows)); }
        m = at(m.sz - 2);
      }
    },

    // Several texts that sit together get one size: the smallest any of them needed, so the group looks even.
    fitAll(list, o) {
      const first = list.map((t) => kit.fit(t, o)), sz = Math.min(...first.map((f) => f.size));
      return first.every((f) => f.size === sz) ? first : list.map((t) => kit.fit(t, { ...o, size: sz, minScale: 1, minPx: 0 }));
    },

    // Draws a fitted text word by word from the reading side, so a mix of Arabic and digits keeps its order. y is the middle of the first row.
    // align: 'center', 'start' (the reading side: right in a right-to-left brand) or 'end'.
    // each(word, index, box, ctx) runs inside its own save/restore just before a word is drawn: the look may change alpha, translate or fillStyle there.
    // Returning false skips the word; returning a string draws the word in that colour.
    // decor: true says this text is decoration, not something a viewer must read, so it is not held to the safe area when the frame is measured.
    drawText(ctx, f, { x0, x1, y, align = 'center', color = brand.colors.text, key = brand.colors.accent, each, decor = false } = {}) {
      ctx.save(); ctx.textBaseline = 'middle'; ctx.font = font(f.weight, f.size, f.family);
      let index = 0;
      f.rows.forEach((row, r) => {
        const yy = y + r * f.lead;
        const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
        const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
        let cur = rtl ? left + row.width : left;
        for (const w of row.words) {
          const wl = rtl ? cur - w.width : cur;
          ctx.save();
          ctx.fillStyle = w.key ? key : color;
          const res = each ? each(w, index, { x: wl, y: yy, width: w.width, row: r }, ctx) : undefined;
          if (res !== false) {
            if (typeof res === 'string') ctx.fillStyle = res;
            ctx.direction = w.arabic ? 'rtl' : 'ltr'; ctx.textAlign = w.arabic ? 'right' : 'left';
            drawWhole(ctx, wl, wl + w.width, yy, f.size, (c) => c.fillText(w.w, w.arabic ? wl + w.width : wl, yy));   // a fading word stays one shape
          }
          ctx.restore();
          index++;
          cur = rtl ? wl - f.space : wl + w.width + f.space;
        }
        recordBox(ctx, left, left + row.width, yy - f.size * 0.7, yy + f.size * 0.7, row.words.map((w) => w.w).join(' '), decor ? { decor: true } : undefined);
      });
      ctx.restore();
      return f.height;
    },

    // align: 'left' | 'right' | 'center' says what x means. The text is always drawn left to right, as digits are read.
    numberWidth(str, size, weight = 900, settle = 0, family = brand.fonts.display.family) {
      const cell = cells(size, weight, family); return [...str].reduce((s, ch) => s + cellOf(ch, cell, settle), 0);
    },
    number(ctx, str, { x, y, size, weight = 900, family = brand.fonts.display.family, color = brand.colors.text, align = 'center', settle = 1, decor = false }) {
      const cell = cells(size, weight, family), total = [...str].reduce((s, ch) => s + cellOf(ch, cell, settle), 0);
      let left = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
      const x0 = left;
      ctx.save(); ctx.font = font(weight, size, family); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = color;
      for (const ch of str) {
        const w = cellOf(ch, cell, settle);
        if (isDigit(ch)) { ctx.textAlign = 'center'; ctx.fillText(ch, left + w / 2, y); } else { ctx.textAlign = 'left'; ctx.fillText(ch, left, y); }
        left += w;
      }
      ctx.restore();
      recordBox(ctx, x0, x0 + total, y - size * 0.6, y + size * 0.6, str, decor ? { decor: true } : undefined);
      return total;
    },

    // Icons come from the asset store (engine/assets.js).
    async icon(id, color) { return (await import('/engine/assets.js')).loadAsset(id, { color }); },
    async image(path) {
      const img = new Image(); img.src = kit.abs(path);
      try { await img.decode(); } catch { throw new Error(`the image did not load: ${path} (paths are relative to the spec file, or start with /).`); }
      return img;
    },

    // ---- measuring: with &debug=1 on the page, each frame publishes what it drew (see recordBegin above). Without it these do nothing.
    begin() {}, end() {},                                    // scenes used to call these around a frame; the page does it now, so they do nothing
    // A box a scene drew by itself, in frame pixels: text set with fillText, a picture that carries words. { decor: true } marks decoration.
    rec(x0, x1, y0, y1, text, extra) { recordBox(null, x0, x1, y0, y1, text, extra); },
    say(key, value) { if (record.on) record.strings[key] = value; },
  };
  return kit;
}
