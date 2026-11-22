// Phosphor motion: nothing slides. Text is typed: a block cursor walks the line from the reading side and each whole word lights the
// moment the cursor passes it, a hair over-bright at first (the phosphor is freshly struck) and then at rest. Light never cuts off: when
// something is cleared it decays on its own (afterglow, an exponential with a time constant of tokens.dur.tau), computed from t alone.
// Pictures (numbers, the logo, rules, frames) are made of mono characters on the cell grid, picked by ink density. Arabic is never
// broken into characters: it is set whole in the brand's face and only lit and dimmed.
// This file also holds what the phosphor parts share: the palette, the word layout, glow pictures, typing schedules, the cursor, and the
// density-to-character machinery.
import { clamp, mix, contrast, rng, font, rgba } from '/engine/kit.js';

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

// The glass is the brand's darker colour, pushed a little toward neutral black. The phosphor is the brand's accent, lifted toward the
// lighter brand colour only as far as it needs to glow clearly on that glass. Everything else is a step between glass and phosphor.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const glass = mix(dark, '#000000', T.tone.glass);
  let phos = accent, k = 0;
  while (contrast(phos, glass) < T.tone.need && k < 1) { k += 0.04; phos = mix(accent, light, Math.min(1, k)); }
  const step = (a) => { let c = mix(glass, phos, a); while (contrast(c, glass) < 4.6 && a < 1) { a += 0.04; c = mix(glass, phos, Math.min(1, a)); } return c; };
  return {
    dark, light, accent, glass, phos,
    hot: mix(phos, light, T.tone.hot),          // freshly struck, overexposed toward white
    soft: step(T.tone.soft),                    // secondary text (lead-ins, labels): still 4.5:1 on the glass
    dim: mix(glass, phos, T.tone.dim),          // decoration: prompts, frames, indices
    faint: mix(glass, phos, T.tone.faint),      // the cell grid, burnt-in ghosts
    frame: mix(glass, phos, T.tone.frame),      // the text-mode frame round the working area
  };
}

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
// Afterglow of something switched off at tOff: 1 before, then exp decay.
export const decay = (t, tOff, tau) => (t < tOff ? 1 : Math.exp(-(t - tOff) / tau));
// The extra heat of a freshly lit word: 1 when it lights, gone after `heat` seconds.
export const heat = (t, tOn, h) => (t < tOn ? 0 : Math.max(0, 1 - (t - tOn) / h));
// Snap a y to the middle of a cell row.
export const snap = (y, ch) => Math.round(y / ch) * ch + ch / 2;

// Where each word of a fitted text sits, exactly as kit.drawText will place it (no drawing, nothing recorded).
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = [], rtl = kit.rtl;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, w: w.w, key: w.key, arabic: w.arabic });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}

// When each word is typed: the cursor runs at tokens.type.cps characters a second, a little unevenly (seeded), and pauses a beat
// before a key word. Returns { on: [t per word], end }.
export function typing(bx, at, T, seed) {
  const r = rng(seed), on = []; let t = at;
  bx.forEach((b, i) => {
    if (b.key && !(i > 0 && bx[i - 1].key)) t += T.type.pause;
    on.push(t); t += ((b.w.length + 1) / T.type.cps) * (0.8 + r() * 0.4);
  });
  return { on, end: t };
}

// A blurred picture of a word (or a key block), made once: laid under the sharp word it is the phosphor's bloom.
function bloomOf(w, h, paint, colour, T, size) {
  const src = document.createElement('canvas'); src.width = w; src.height = h;
  const s = src.getContext('2d'); s.fillStyle = colour; paint(s);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const o = out.getContext('2d');
  o.filter = `blur(${Math.max(2, size * T.glow.wide)}px)`; o.globalAlpha = T.glow.wideA; o.drawImage(src, 0, 0);
  o.filter = `blur(${Math.max(1, size * T.glow.near)}px)`; o.globalAlpha = T.glow.nearA; o.drawImage(src, 0, 0);
  o.filter = 'none';
  return out;
}

// A fitted text set on the screen. draw(ctx, level, hot) lights word i at level(i) (0 = dark, 1 = at rest) with extra heat hot(i)
// (0..1, toward white). Key words (*…*) are inverse video: a block of phosphor with the word cut out of it in the glass colour.
export function screenText(kit, f, o, pal, T, colour = pal.phos) {
  const bx = boxes(kit, f, o), P = Math.ceil(f.size * 0.9), hh = Math.ceil(f.size * 1.7) + 2 * P, pad = f.size * 0.16;
  for (const b of bx) {
    const ww = Math.ceil(b.width + 2 * pad) + 2 * P;
    b.P = P; b.hh = hh;
    b.glow = bloomOf(ww, hh, (g) => {
      if (b.key) { g.fillRect(P, hh / 2 - f.size * 0.62, b.width + 2 * pad, f.size * 1.24); return; }
      g.font = font(f.weight, f.size, f.family); g.textBaseline = 'middle';
      g.direction = b.arabic ? 'rtl' : 'ltr'; g.textAlign = b.arabic ? 'right' : 'left';
      g.fillText(b.w, b.arabic ? P + pad + b.width : P + pad, hh / 2);
    }, colour, T, f.size);
  }
  return {
    boxes: bx,
    draw(ctx, level, hot = () => 0) {
      for (const [i, b] of bx.entries()) {
        const l = level(i); if (l <= 0.01) continue;
        ctx.save(); ctx.globalAlpha = clamp(l) * (1 + 0.5 * hot(i)) * T.glow.a; ctx.drawImage(b.glow, b.x - pad - b.P, b.y - b.hh / 2); ctx.restore();
      }
      kit.drawText(ctx, f, { ...o, color: colour, key: pal.glass, each: (w, i, box, c) => {
        const l = level(i); if (l <= 0.01) return false;
        c.globalAlpha = clamp(l);
        const lit = mix(colour, pal.hot, clamp(hot(i)));
        if (w.key) { c.fillStyle = lit; c.fillRect(box.x - pad, box.y - f.size * 0.62, box.width + 2 * pad, f.size * 1.24); return pal.glass; }
        return lit;
      } });
    },
  };
}

// The block cursor: solid while typing, blinking (on half of each period) when idle; it sits just past the last typed word on the
// reading side's far end. b: the word box it follows (or null: at x, the start of the row).
export function cursor(ctx, pal, T, t, { x, y, size, rtl, typingUntil = -1, alpha = 1 }) {
  if (alpha <= 0.01) return;
  const on = t < typingUntil || ((t - typingUntil) % T.dur.blink) < T.dur.blink / 2;
  if (!on) return;
  const w = size * 0.48, h = size * 1.05, cx = rtl ? x - w : x;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = rgba(pal.phos, 0.25); ctx.fillRect(cx - 6, y - h / 2 - 6, w + 12, h + 12);
  ctx.fillStyle = pal.phos; ctx.fillRect(cx, y - h / 2, w, h);
  ctx.restore();
}
// Where the cursor goes after word i (-1: before the first word).
export function cursorX(bx, i, f, rtl, x0, x1) {
  if (i < 0 || !bx.length) return rtl ? x1 : x0;
  const b = bx[Math.min(i, bx.length - 1)], g = f.size * (b.key ? 0.16 : 0) + f.space * 0.5 + 6;
  return rtl ? b.x - g : b.x + b.width + g;
}
// How many words are typed at t (index of the last one, -1 for none).
export const typedUpTo = (on, t) => { let k = -1; for (let i = 0; i < on.length; i++) if (t >= on[i]) k = i; return k; };

// ---- pictures made of characters
export const RAMP = ' .,:;=+*#%@';
// A sampler: paint(g, w, h, arg) draws a picture in any colour on a small canvas cols*sx by rows*sy; read(arg) returns the ink cover of
// each cell (0..1). The canvas is small, so this is cheap enough to run every frame for a counting number.
export function sampler(cols, rows, paint, sx = 4, sy = 8) {
  const cv = document.createElement('canvas'); cv.width = cols * sx; cv.height = rows * sy;
  const g = cv.getContext('2d', { willReadFrequently: true });
  return (arg) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#ffffff';
    paint(g, cv.width, cv.height, arg);
    const d = g.getImageData(0, 0, cv.width, cv.height).data, out = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let s = 0;
      for (let y = 0; y < sy; y++) { let i = ((r * sy + y) * cv.width + c * sx) * 4 + 3; for (let x = 0; x < sx; x++, i += 4) s += d[i]; }
      out[r * cols + c] = s / (sx * sy * 255);
    }
    return out;
  };
}
// Draws cells as characters: denser ink, a denser and brighter glyph. show(c, r) (0..1) can switch cells on row by row.
// Three brightness levels, so a frame changes fillStyle three times, not per cell.
export function drawCells(ctx, dens, cols, rows, x0, y0, cw, ch, mono, pal, show = null) {
  ctx.save(); ctx.font = `700 ${Math.round(ch * 0.78)}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
  const lv = [mix(pal.glass, pal.phos, 0.5), pal.phos, pal.hot];
  for (let L = 0; L < 3; L++) {
    ctx.fillStyle = lv[L];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = dens[r * cols + c]; if (d < 0.07) continue;
      const lvl = d < 0.4 ? 0 : d < 0.9 ? 1 : 2; if (lvl !== L) continue;
      if (show && show(c, r) <= 0) continue;
      ctx.fillText(RAMP[Math.min(RAMP.length - 1, 1 + Math.floor(d * (RAMP.length - 1)))], x0 + c * cw + cw / 2, y0 + r * ch + ch / 2);
    }
  }
  ctx.restore();
}
// A row of characters (a rule, a progress bar), mono, left to right as code is read.
export function charRow(ctx, str, x, y, size, mono, colour, align = 'left') {
  ctx.save(); ctx.font = `600 ${size}px "${mono}"`; ctx.fillStyle = colour; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = align;
  ctx.fillText(str, x, y); ctx.restore();
}
