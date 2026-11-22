// Ticking split motion: real time. A clock counts down to each scene's zero and ticks on every whole second; the frame is cut into hard
// cells that multiply as zero nears, and at zero the cells close into one picture and the clock flips (its block turns to the accent and
// the sign becomes T+). Cuts are layout changes, never fades: a cell appears whole, a gutter opens or closes in a few frames.
// This file holds what every part shares: the palette, the clock, a cell with its camera chip, the tracking brackets of a key phrase,
// and where the words of a fitted text sit.
import { clamp, mix, rgba, contrast } from '/engine/kit.js';

export const snap = (p) => { p = clamp(p); return 1 - (1 - p) ** 4; };          // a layout change: fast, then settled
const lum = (h) => contrast(h, '#000000');
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const panel = mix(dark, light, T.tone.panel);
  const on = (fill) => (contrast(fill, dark) >= contrast(fill, light) ? dark : light);
  const readable = (k, against = panel) => { let c = mix(light, dark, k); while (k > 0 && contrast(c, against) < 4.8) { k -= 0.04; c = mix(light, dark, Math.max(0, k)); } return c; };
  // the signal: the brand's accent, lifted towards the light colour only as far as it needs to read on the dark panels
  let signal = accent; for (let k = 0.05; contrast(signal, panel) < 3.2 && k <= 0.9; k += 0.05) signal = mix(accent, light, k);
  return {
    light, dark, accent: signal, brandAccent: accent, panel, on, text: light, muted: readable(T.tone.muted),
    keyText: contrast(signal, panel) >= 3.2 ? signal : light,
    border: rgba(light, 0.18), gutter: dark, plate: rgba(dark, 0.82), pending: mix(light, dark, 0.55),
  };
}

// The clock: T− before zero, T+ after; minutes:seconds in fixed slots, tenths small and grey, a ten-segment bar for the second in progress.
// After zero its block is the accent and its digits the colour that reads on it. Decoration (not measured): it is time, not a fact.
export function clock(ctx, t, zero, P, mono, rtl, box) {
  const left = zero - t, after = left <= 0, a = Math.abs(left);
  const whole = Math.floor(a + 1e-9), tenth = Math.floor(((a + 1e-9) % 1) * 10), done = after ? tenth : (10 - tenth) % 10;   // done: tenths of this second gone
  const mm = String(Math.floor(whole / 60)).padStart(2, '0'), ss = String(whole % 60).padStart(2, '0');
  const { x, y, w, h } = box;
  const flip = after ? clamp((t - zero) / 0.08) : 0;
  ctx.save();
  ctx.fillStyle = flip > 0.5 ? P.accent : P.panel; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = P.border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const ink = flip > 0.5 ? P.on(P.accent) : P.text, sub = flip > 0.5 ? P.on(P.accent) : P.pending;
  const size = h * 0.56, cy = y + h * 0.44;
  ctx.font = `600 ${size}px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'center';
  const cw = ctx.measureText('0').width * 1.02;
  const sign = after ? 'T+' : 'T−', str = `${mm}:${ss}`;
  let cx = x + 26;
  ctx.font = `600 ${size * 0.85}px "${mono}"`; ctx.fillStyle = flip > 0.5 ? ink : P.accent; ctx.textAlign = 'left'; ctx.fillText(sign, cx, cy); cx += ctx.measureText(sign).width + 14;
  ctx.font = `600 ${size}px "${mono}"`; ctx.fillStyle = ink; ctx.textAlign = 'center';
  for (const ch of str) { const cwi = ch === ':' ? cw * 0.6 : cw; ctx.fillText(ch, cx + cwi / 2, cy); cx += cwi; }
  ctx.font = `600 ${size * 0.42}px "${mono}"`; ctx.fillStyle = sub; ctx.textAlign = 'left'; ctx.fillText('.' + tenth, cx + 4, cy + size * 0.16);
  // the ten-segment bar of the running second
  const segW = (w - 52 - 9 * 5) / 10, by = y + h - 18;
  for (let i = 0; i < 10; i++) { ctx.fillStyle = i < done ? (flip > 0.5 ? ink : P.accent) : (flip > 0.5 ? rgba(ink, 0.25) : rgba(P.light, 0.12)); ctx.fillRect(x + 26 + i * (segW + 5), by, segW, 6); }
  ctx.restore();
}

// A cell: a hard panel with a 1 px border, a darker vignette, and a camera chip in its top corner on the reading side (a square dot,
// accent = live, grey = not, then a code). chip: 0..1 how much of the chip is shown (it goes when the cells merge).
export function cell(ctx, R, P, mono, rtl, { code = '', live = true, chip = 1, vignette = null, border = 1, fill = true } = {}) {
  if (fill) { ctx.fillStyle = P.panel; ctx.fillRect(R.x, R.y, R.w, R.h); }
  if (fill && vignette) { ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.drawImage(vignette, R.x, R.y, R.w, R.h); ctx.restore(); }
  if (border > 0) { ctx.save(); ctx.globalAlpha *= border; ctx.strokeStyle = P.border; ctx.lineWidth = 1; ctx.strokeRect(R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1); ctx.restore(); }
  if (chip > 0 && code) {
    ctx.save(); ctx.globalAlpha *= chip; ctx.font = `600 20px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    const tw = ctx.measureText(code).width, cw = tw + 46, ch = 34, cx = rtl ? R.x + R.w - 12 - cw : R.x + 12, cy = R.y + 12;
    ctx.fillStyle = P.plate; ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = live ? P.accent : P.pending; ctx.fillRect(cx + 12, cy + ch / 2 - 6, 12, 12);
    ctx.fillStyle = P.text; ctx.textAlign = 'left'; ctx.fillText(code, cx + 34, cy + ch / 2 + 1);
    ctx.restore();
  }
}
// A built-once soft vignette (to 30% of the ground at the corners), stretched over each cell.
export function vignette(P) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 40, 128, 128, 182); r.addColorStop(0, rgba(P.dark, 0)); r.addColorStop(1, rgba(P.dark, 0.3));
  g.fillStyle = r; g.fillRect(0, 0, 256, 256); return c;
}
// Tracking brackets around a key phrase: four accent corners that close in from a little wider when it is acquired.
export function brackets(ctx, x0, x1, y, size, P, p = 1) {
  if (p <= 0) return;
  // the legs stay above and below the letters, so a bracket never touches the next word
  const k = (1 - snap(p)) * 24, pad = 6 + k, top = y - size * 0.78 - k, bot = y + size * 0.74 + k, L = Math.min(40, (x1 - x0) / 3), V = size * 0.16, a = x0 - pad, b = x1 + pad;
  ctx.save(); ctx.strokeStyle = P.accent; ctx.lineWidth = 5; ctx.lineCap = 'square'; ctx.beginPath();
  ctx.moveTo(a, top + V); ctx.lineTo(a, top); ctx.lineTo(a + L, top); ctx.moveTo(b - L, top); ctx.lineTo(b, top); ctx.lineTo(b, top + V);
  ctx.moveTo(b, bot - V); ctx.lineTo(b, bot); ctx.lineTo(b - L, bot); ctx.moveTo(a + L, bot); ctx.lineTo(a, bot); ctx.lineTo(a, bot - V);
  ctx.stroke(); ctx.restore();
}

// Where each word of a fitted text sits when drawn with kit.drawText(…, { x0, x1, y, align }).
export function rowsOf(f, x0, x1, y, align, rtl) {
  return f.rows.map((row, r) => {
    const yy = y + r * f.lead;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? (rtl ? x1 - row.width : x0) : (rtl ? x0 : x1 - row.width);
    let cur = rtl ? left + row.width : left;
    const words = row.words.map((w) => { const wl = rtl ? cur - w.width : cur; cur = rtl ? wl - f.space : wl + w.width + f.space; return { ...w, x: wl }; });
    return { y: yy, left, width: row.width, words };
  });
}
// A key phrase (*several words*) is one span per row, not one per word.
export function keySpans(f, x0, x1, y, align, rtl) {
  const out = [];
  rowsOf(f, x0, x1, y, align, rtl).forEach((row, r) => {
    let cur = null;
    for (const w of row.words) {
      if (!w.key) { cur = null; continue; }
      if (cur) { cur.x0 = Math.min(cur.x0, w.x); cur.x1 = Math.max(cur.x1, w.x + w.width); } else { cur = { x0: w.x, x1: w.x + w.width, y: row.y, row: r }; out.push(cur); }
    }
  });
  return out;
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 16; w > o.maxW * 0.45; w -= 16) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
// A rectangle between two others (cells closing into one picture).
export const lerpRect = (A, B, p) => ({ x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p, w: A.w + (B.w - A.w) * p, h: A.h + (B.h - A.h) * p });
// Where the clock sits: the far side of the top rail (the LIVE plate is on the reading side).
export const clockBox = (T, rtl) => ({ x: rtl ? T.area.x0 : T.area.x1 - T.clock.w, y: T.clock.y, w: T.clock.w, h: T.clock.h });
